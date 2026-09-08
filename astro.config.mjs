import { defineConfig } from "astro/config";

import solidJs from "@astrojs/solid-js";
import sitemap from '@astrojs/sitemap';

import solidSVG from 'vite-solid-svg';
import { responsiveImage } from '@responsive-image/vite-plugin';

import basicSsl from '@vitejs/plugin-basic-ssl';

import vercel from '@astrojs/vercel';

import { draftSlugs } from './src/lib/games/draftSlugs';

// https://astro.build/config
export default defineConfig({
  site: 'https://instances.aki-labs.com',
  integrations: [
    solidJs(),
    /* Draft game pages are `noindex`; submitting them in the sitemap as well
       would be asking Search Console to flag every one of them. */
    sitemap({
      filter: (page) => !draftSlugs.some((slug) => page.endsWith(`/games/${slug}/`)),
    }),
  ],
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
      external: ['oidc-client-ts'],
    },
    plugins: [basicSsl(), solidSVG(), responsiveImage()]
  },

  adapter: vercel()
});