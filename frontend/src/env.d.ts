/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHAT_SHARED_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
