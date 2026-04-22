import { defineConfig } from "astro/config";

import solidJs from "@astrojs/solid-js";
import mkcert from 'vite-plugin-mkcert';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://instances.aki-labs.com',
  integrations: [solidJs(), sitemap()],

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