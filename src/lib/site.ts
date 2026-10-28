export const SITE_URL = "https://goodfatbadfat.com";
export const SITE_NAME = "GoodFat";
export const SUPPORT_EMAIL = "help@goodfatbadfat.com";

export const DEFAULT_TITLE = "GoodFat — Eat fats that help you feel better.";
export const DEFAULT_DESCRIPTION =
  "GoodFat uses Apple Intelligence on your iPhone to help you choose fats that calm inflammation. Meal photos and questions stay on the device.";

export const DEFAULT_APP_STORE_URL =
  "https://apps.apple.com/us/app/goodfatbadfat/id6808787656";
export const APP_STORE_ID = "6808787656";

export const appStoreUrl = import.meta.env.PUBLIC_APP_STORE_URL || DEFAULT_APP_STORE_URL;
export const playStoreUrl = import.meta.env.PUBLIC_PLAY_STORE_URL ?? "";
export const gaMeasurementId = import.meta.env.PUBLIC_GA_MEASUREMENT_ID ?? "";
export const plausibleDomain = import.meta.env.PUBLIC_PLAUSIBLE_DOMAIN ?? "";

export function canonicalUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${path.replace(/\/+$/, "")}`;
}
