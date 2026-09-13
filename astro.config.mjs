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
    /* The sitemap is an allow-list, not a deny-list.

       Everything under /dashboard, /explore and /extra is the signed-in SolidJS
       app; /auth/redirect is the OIDC landing page. All of them send
       `noindex, nofollow`, so listing them was asking Search Console to index
       pages that refuse to be indexed. Allow-listing means a route added later
       stays out by default instead of relying on someone remembering to exclude
       it — which is how those four got in.

       Draft game pages are `noindex` for the same reason and stay out until
       their copy is finished. */
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/+$/, "") || "/";

        const marketingRoutes = [
          "/",
          "/contact",
          "/faq",
          "/games",
          "/pricing",
          "/privacy-policy",
          "/terms",
        ];
        if (marketingRoutes.includes(path)) return true;

        const game = path.match(/^\/games\/([^/]+)$/);
        return game !== null && !draftSlugs.includes(game[1]);
      },
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