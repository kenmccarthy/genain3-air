/** The application version from package.json, injected by Vite (see vite.config.ts). */
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  /** "true" in the GitHub Pages preview build only. */
  readonly VITE_PREVIEW?: string
}
