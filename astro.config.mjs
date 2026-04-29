import { defineConfig } from "astro/config";

import solidJs from "@astrojs/solid-js";
import sitemap from '@astrojs/sitemap';

import solidSVG from 'vite-solid-svg';

import cloudflare from '@astrojs/cloudflare';
import basicSsl from '@vitejs/plugin-basic-ssl';

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
    server: {
      https: true
    },
    ssr: {
      external: ['@azure/msal-browser'],
    },
    plugins: [basicSsl(), solidSVG()]
  },

  adapter: cloudflare()
});