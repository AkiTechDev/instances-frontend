import { defineConfig } from "astro/config";

import qwikdev from "@qwikdev/astro";
import mkcert from 'vite-plugin-mkcert';

// https://astro.build/config
export default defineConfig({
  site: 'https://AkiTechDev.github.io',
  base: '/instances-frontend/',
  integrations: [qwikdev()],

  server: {
    port: 443,
    https: true,
    host: 'instances.aki-labs.com'
  },
  vite: {
    plugins: [mkcert()]
  }
});