/**
 * Standalone Node entry that wraps the Astro handler so HTTPS redirects
 * and security headers apply to prerendered static files as well as SSR routes.
 */
process.env.ASTRO_NODE_AUTOSTART = "disabled";

import http from "node:http";
import https from "node:https";
import fs from "node:fs";

const { handler } = await import("../dist/server/entry.mjs");

const SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function isLocalHost(host) {
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
}

function applySecurityHeaders(res) {
  if (process.env.NODE_ENV !== "production") return;
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!res.getHeader(name)) res.setHeader(name, value);
  }
}

const listener = (req, res) => {
  const proto = String(req.headers["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "");

  if (
    process.env.NODE_ENV === "production" &&
    proto === "http" &&
    host &&
    !isLocalHost(host)
  ) {
    applySecurityHeaders(res);
    res.writeHead(301, { Location: `https://${host}${req.url || "/"}` });
    res.end();
    return;
  }

  const originalWriteHead = res.writeHead.bind(res);
  res.writeHead = (...args) => {
    applySecurityHeaders(res);
    return originalWriteHead(...args);
  };

  applySecurityHeaders(res);
  return handler(req, res);
};

const port = process.env.PORT ? Number(process.env.PORT) : 8080;
const host = process.env.HOST ?? "0.0.0.0";

const server =
  process.env.SERVER_CERT_PATH && process.env.SERVER_KEY_PATH
    ? https.createServer(
        {
          key: fs.readFileSync(process.env.SERVER_KEY_PATH),
          cert: fs.readFileSync(process.env.SERVER_CERT_PATH),
        },
        listener,
      )
    : http.createServer(listener);

server.listen(port, host, () => {
  console.log(`GoodFat site listening on http://${host}:${port}`);
});
