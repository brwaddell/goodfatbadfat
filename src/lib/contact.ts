export const CONTACT_MIN_ELAPSED_MS = 2000;
export const CONTACT_NAME_MAX = 80;
export const CONTACT_SUBJECT_MAX = 120;
export const CONTACT_MESSAGE_MAX = 4000;

export type ContactPayload = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
  startedAt?: number;
};

export type ContactFieldErrors = Partial<
  Record<"name" | "email" | "subject" | "message", string>
>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trimField(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function normalizeContactPayload(input: unknown): ContactPayload {
  const data = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const startedRaw = data.startedAt;
  const startedAt =
    typeof startedRaw === "number"
      ? startedRaw
      : typeof startedRaw === "string"
        ? Number(startedRaw)
        : undefined;

  return {
    name: trimField(data.name, CONTACT_NAME_MAX),
    email: trimField(data.email, 200).toLowerCase(),
    subject: trimField(data.subject, CONTACT_SUBJECT_MAX),
    message: trimField(data.message, CONTACT_MESSAGE_MAX),
    website: typeof data.website === "string" ? data.website.trim() : "",
    startedAt: Number.isFinite(startedAt) ? startedAt : undefined,
  };
}

export function validateContactPayload(
  payload: ContactPayload,
  options: { now?: number; enforceTiming?: boolean } = {},
): { ok: true } | { ok: false; errors: ContactFieldErrors; spam?: boolean } {
  const errors: ContactFieldErrors = {};

  if (payload.website) {
    return { ok: false, errors: {}, spam: true };
  }

  if (options.enforceTiming !== false) {
    const now = options.now ?? Date.now();
    if (!payload.startedAt || now - payload.startedAt < CONTACT_MIN_ELAPSED_MS) {
      return { ok: false, errors: {}, spam: true };
    }
  }

  if (payload.name.length < 2) {
    errors.name = "Please enter your name.";
  }

  if (!EMAIL_PATTERN.test(payload.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (payload.subject.length < 3) {
    errors.subject = "Please add a short subject.";
  }

  if (payload.message.length < 10) {
    errors.message = "Please tell us a bit more so we can help.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}

export function buildMailtoUrl(payload: ContactPayload, to: string): string {
  const body = [
    payload.message,
    "",
    `— ${payload.name}`,
    payload.email,
  ].join("\n");

  return `mailto:${to}?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(body)}`;
}
