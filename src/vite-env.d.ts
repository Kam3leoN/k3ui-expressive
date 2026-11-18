/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  /** `1` when sibling ../k3ux is present at dev/build time. */
  readonly VITE_K3UX_SIBLING: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
