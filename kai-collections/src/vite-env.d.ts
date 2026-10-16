/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `off` builds the concept without any media hosted by KAI (photography, campaign images, logo). */
  readonly VITE_KAI_MEDIA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
