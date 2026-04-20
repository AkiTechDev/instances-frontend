import { defineConfig } from "astro/config";

import solidJs from "@astrojs/solid-js";
import mkcert from 'vite-plugin-mkcert';

// https://astro.build/config
export default defineConfig({
  site: 'https://AkiTechDev.github.io',
  base: '/instances-frontend/',
  integrations: [solidJs()],

  prefetch: true,

  server: {
    port: 443,
    https: true,
    host: 'instances.aki-labs.com',
  },
  vite: {
    ssr: {
      external: ['@azure/msal-browser'],
    },
    plugins: [mkcert()]
  }
});