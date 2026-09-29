/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** WordPress/WooCommerce base URL, e.g. https://shop.sawargi.com. Unset = sample catalogue + demo checkout. */
  readonly VITE_WC_URL?: string
}
