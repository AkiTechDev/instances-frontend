import { defineConfig } from "astro/config";

import solidJs from "@astrojs/solid-js";
import sitemap from '@astrojs/sitemap';

import solidSVG from 'vite-solid-svg';
import { responsiveImage } from '@responsive-image/vite-plugin';

import basicSsl from '@vitejs/plugin-basic-ssl';

import vercel from '@astrojs/vercel';

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
    plugins: [basicSsl(), solidSVG(), responsiveImage()]
  },

  adapter: vercel()
});