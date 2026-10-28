import { defineMiddleware } from "astro:middleware";

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function forwardedHost(request: Request): string | null {
  return request.headers.get("x-forwarded-host") || request.headers.get("host");
}

function forwardedProto(request: Request): string {
  const raw = request.headers.get("x-forwarded-proto") || "";
  const first = raw.split(",")[0]?.trim();
  return first || "https";
}

export const onRequest = defineMiddleware(async (context, next) => {
  const host = forwardedHost(context.request);
  const proto = forwardedProto(context.request);
  const isProd = import.meta.env.PROD;
  const isLocalHost = Boolean(host && /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host));

  if (isProd && host && proto === "http" && !isLocalHost) {
    const redirectUrl = new URL(context.request.url);
    redirectUrl.protocol = "https:";
    redirectUrl.host = host;
    redirectUrl.port = "";
    return context.redirect(redirectUrl.toString(), 301);
  }

  const isKeystaticRoute =
    context.url.pathname.startsWith("/api/keystatic") ||
    context.url.pathname.startsWith("/keystatic");

  if (isKeystaticRoute && host) {
    const url = new URL(context.request.url);
    url.host = host;
    url.protocol = proto.endsWith(":") ? proto : `${proto}:`;
    url.port = "";
    context.request = new Request(url.toString(), context.request);
  }

  const response = await next();

  if (isProd) {
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(header, value);
    }
  }

  return response;
});
