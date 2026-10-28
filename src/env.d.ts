/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_APP_STORE_URL?: string;
  readonly PUBLIC_PLAY_STORE_URL?: string;
  readonly PUBLIC_GA_MEASUREMENT_ID?: string;
  readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
  readonly MAILGUN_API_KEY?: string;
  readonly MAILGUN_DOMAIN?: string;
  readonly MAILGUN_API_URL?: string;
  readonly MAILGUN_FROM?: string;
}
