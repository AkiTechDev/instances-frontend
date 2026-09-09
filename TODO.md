# TODO

Things spotted while building `/contact`, `/games`, `/games/[slug]` and `/faq`.
Everything here was verified against the code or a production build on the date
noted — nothing is from memory or assumption. Each item says what's wrong, where,
and what "done" looks like, so any of them can be picked up cold.

Last reviewed: **2026-09-09**, against a clean `astro build`.

---

## Blockers — wrong or misleading in production

### 1. `theme-color` on the landing page is still the placeholder
`src/pages/index.astro:89` — `<meta name="theme-color" content="#YOUR_BRAND_COLOR">`.

Not a valid colour, so mobile browsers fall back to their default chrome. Every
other page already uses `#191C2E`. One-line fix; it's listed first only because
it's the cheapest real bug on the site.

### 2. Blank pages are being submitted to search engines
`sitemap-0.xml` currently lists `/about/` and `/pricing/` (both 0-byte files), plus
four routes that only make sense signed in: `/dashboard/`, `/explore/`, `/extra/`,
`/auth/redirect/`.

Submitting empty and app-only URLs is what gets a site flagged in Search Console.
The sitemap filter in `astro.config.mjs` already excludes draft game pages — the
same predicate can exclude these. Two options, and the choice matters:

- **Short term:** extend the filter. Fast, but it's a list that has to be
  remembered when `/pricing` and `/about` are eventually written.
- **Better:** invert it — an explicit allow-list of marketing routes, so a new
  app route is excluded by default rather than by someone remembering.

### 3. `/pricing` is a blank page that the Terms treat as contractual
`src/pages/pricing.astro` is 0 bytes. `terms.astro` §9 says charges accrue "at the
rates published at instances.aki-labs.com/pricing" — so the contract points at an
empty page. `/faq` deliberately links to `/games` for prices instead, and says
nothing it can't stand behind, but that's a workaround.

`/about` (`src/pages/about.astro`) is also 0 bytes, with no such contractual
weight — lower priority.

### 4. "Switch games, not just servers" overstates what the product does
`src/pages/index.astro:135-137` — *"Play Minecraft today, Terraria tomorrow, your
setup follows you."*

`putCreateInstance` takes a `game_id` (`src/lib/apis.ts:298`); there is no
game-switching on an existing instance, and Terraria isn't hosted at all. What's
actually true is on `/faq#switch-games`: a second server, each keeping its own
world, and two cost no more than one if only one runs at a time.

Reword the card to match. The underlying pitch still works — it just isn't the
same world following you between games.

---

## Layout bugs in shared components

Both are pre-existing and site-wide. Both are their own task, because each one
changes every page at once.

### 5. Header has no mobile breakpoint
`src/components/astrojs/header/Header.module.css` has no media queries. Below
roughly 700px the `.actions` block (Log in / Start playing) runs off the right
edge. Measured at 430px: document width 628px against a 430px viewport, and
identically 628 on `/`, `/games` and `/faq` — so it's the header, not any page.

Needs a real mobile treatment (collapse to a menu, or wrap the actions under the
nav). Until then, every page looks broken on a phone.

### 6. The landing page scrolls sideways at every width
`src/components/astrojs/HowItWorks/HowItWorks.module.css:55-71`. The carousel is a
flex `.track` of full-width cards moved with `transform`, and the off-screen ones
are hidden with `clip-path: inset(-100vw -100vw -100vw 0)`.

`clip-path` paints nothing but **does not remove elements from scroll width**, so
the landing document measures ~2882px at a 1440px viewport. The cards are
invisible; the horizontal scrollbar is the only tell.

Fix is `overflow: hidden` on a wrapper around `.cards` — but that also clips the
"peek" and the next-button overhang the current `clip-path` was written to
preserve, so it needs a design decision, not just the one property.

### 7. `<Newsletter />` has no mobile breakpoint
`src/components/newsletter/newsletter.module.css` has zero media queries and
hardcodes `padding: var(--padding-outer-sides)` (7.5rem) plus `.content
{ max-width: 33% }`. Below ~760px the copy is a few characters wide with the email
input crushed beside it.

It sits above `<Footer />` on the landing page, `/contact`, `/faq`, `/games`,
`/games/*`, `/terms` and `/privacy-policy` — so it's in the mobile screenshot of
every marketing page.

---

## Dead links and duplication

### 8. `#services` and `#process` are dead off the landing page
`Header.astro:15,17` and `Footer.astro:14`. They're landing-page anchors rendered
into the nav on every page, so from `/faq` or `/games` they do nothing.

`#games` and `#faqs` had the same problem and now point at `/games` and `/faq`.
These two have no page to point at yet — either write one, or make them
`/#services` and `/#process` so they navigate home and then scroll.

### 9. `.gradientOne` is defined twice
`src/styles/theme/colours.module.css:2` (CSS module) and
`src/styles/theme/default.css:347` (global). Both are in use: `terms.astro` and
`privacy-policy.astro` use the bare global class, everything newer imports the
module.

They can drift into two different gradients. Pick one — the module, since it's
what new pages already use — and update the two legal pages.

### 10. Supported Games on the landing page expands in place
`src/components/SupportedGames/SupportedGames.tsx:46,54-60` — "Show More Games"
toggles `showAll` and reveals the rest of the list inline. `/games` now exists and
is the better destination.

Also worth noting while you're in there: it's mounted `client:only`
(`SupportedGames.astro:10`), so the game list isn't in the server-rendered HTML at
all and no crawler sees it. `/games` covers that now, but the landing page's own
games section contributes nothing to search.

---

## Honest-by-construction switches, waiting on a backend

These are all deliberate. Each is one flag away from being live, and each is
currently *correct* — the note is so nobody has to rediscover why.

### 11. Contact form has no endpoint
`src/lib/support.ts` — `SUPPORT_ENDPOINT` reads `PUBLIC_SUPPORT_ENDPOINT`, which is
not set in `.env` (only the three `PUBLIC_ZITADEL_*` vars are). So `submitMode` is
`"email"` and the form composes a ticket and hands it to the user's mail client.

Set the variable and it switches to POST with no other change. Until the route
exists, leave it — a send button that drops messages into a 404 is worse.

### 12. Support response times are unpublished
`src/lib/support.ts` — `responseTargets.published` is `false`, so each topic's
`response` value is never rendered. `/faq` deliberately makes no timing promise
either.

Flip it when the targets are ones we'd stand behind. An unmet published SLA is
worse than no SLA.

### 13. The beta survey posts to a route that doesn't exist
`src/lib/apis.ts:333` — `postSurvey` POSTs to `${API_BASE}/feedback`. The backend
hasn't shipped that route. Check there before debugging the frontend.

---

## Content still to write

### 14. Nine of the ten game pages are drafts
`src/lib/games/draftSlugs.ts` lists them: everything except `valheim`. They're
`noindex`, excluded from the sitemap, and carry a visible draft notice — the sizes,
prices and settings on them are generated and correct, only the prose is unsigned.

Sign off a page by writing its `page` copy and removing the slug from
`draftSlugs.ts` **and** clearing `draft: true` on the game's `GamePage`. A build-time
check in `pages/games/[slug].astro` warns if those two disagree.

### 15. Both legal documents need a lawyer
33 `class="pending"` markers across the two: 16 in `terms.astro`, 17 in
`privacy-policy.astro`. They render as bracketed, deliberately loud placeholders.

The ones that block other work: **currency (GBP or USD)**, VAT position,
failed-payment suspension/termination windows, and the export window before
deletion on account closure. `/faq` currently says nothing about currency for
exactly this reason.

### 16. Terms §14 can now point at the FAQ
`terms.astro` §14 (Backups) has a `pending` note reading *"How to export or download
Your Content — to be documented"*. `/faq#backups` and `/faq#download-world` now
document it, naming the Download Game Data action.

Set `terms.dataExportUrl` to `/faq#download-world` and that placeholder resolves
into a real link.

---

## Housekeeping

### 17. Four stale Vite cache directories need `sudo rm`
```
node_modules/.vite/deps.root-owned-stale
node_modules/.vite/deps.root-owned-stale-1788852098
node_modules/.vite/deps.stale-1788852332570846000
node_modules/.vite/deps.stale-1788852449441131000
```
Left over from moving a root-owned cache aside when the dev server was running as
root on :443. They're root-owned, so they need `sudo rm -rf`. Harmless, just waste.

Worth knowing for next time: while a root dev server holds
`node_modules/.vite/deps`, `astro check` and `astro build` both fail with `EACCES`.
Stop the server before building rather than moving its cache.
