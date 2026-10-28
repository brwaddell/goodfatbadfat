import type { APIRoute } from "astro";
import {
  buildMailtoUrl,
  normalizeContactPayload,
  validateContactPayload,
} from "../../lib/contact";
import { SITE_URL, SUPPORT_EMAIL } from "../../lib/site";

export const prerender = false;

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const recentPosts = new Map<string, number[]>();

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const stamps = (recentPosts.get(key) ?? []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  if (stamps.length >= RATE_LIMIT_MAX) {
    recentPosts.set(key, stamps);
    return true;
  }
  stamps.push(now);
  recentPosts.set(key, stamps);
  return false;
}

function allowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;
    return url.origin === SITE_URL || url.hostname.endsWith(".goodfatbadfat.com");
  } catch {
    return false;
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function sendWithMailgun(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  const apiKey = import.meta.env.MAILGUN_API_KEY;
  const domain = import.meta.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain) return false;

  const apiBase = (import.meta.env.MAILGUN_API_URL || "https://api.mailgun.net").replace(/\/+$/, "");
  const from = import.meta.env.MAILGUN_FROM || `GoodFat Support <help@${domain}>`;
  const body = new URLSearchParams({
    from,
    to: SUPPORT_EMAIL,
    subject: `[GoodFat support] ${payload.subject}`,
    text: [`From: ${payload.name} <${payload.email}>`, "", payload.message].join("\n"),
    "h:Reply-To": payload.email,
  });

  const response = await fetch(`${apiBase}/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
    },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Mailgun contact send failed", response.status, detail);
    return false;
  }

  return true;
}

export const POST: APIRoute = async ({ request }) => {
  if (!allowedOrigin(request.headers.get("origin"))) {
    return json({ ok: false, error: "Request not allowed." }, 403);
  }

  const key = clientKey(request);
  if (isRateLimited(key)) {
    return json({ ok: false, error: "Please wait a few minutes before sending another message." }, 429);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, error: "Please send a valid message." }, 400);
  }

  const payload = normalizeContactPayload(raw);
  const result = validateContactPayload(payload, { enforceTiming: true });

  if (!result.ok) {
    if (result.spam) {
      return json({ ok: true });
    }
    return json({ ok: false, errors: result.errors }, 400);
  }

  const sent = await sendWithMailgun(payload);
  if (sent) {
    return json({ ok: true, delivered: true });
  }

  return json({
    ok: true,
    delivered: false,
    mailto: buildMailtoUrl(payload, SUPPORT_EMAIL),
  });
};

export const GET: APIRoute = () => json({ ok: false, error: "Use POST." }, 405);
