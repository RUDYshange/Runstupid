/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENABLE_POPIA_MASKING: string;
  readonly VITE_ENABLE_HONEYPOT: string;
  readonly VITE_ENABLE_IDEMPOTENCY_LOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
