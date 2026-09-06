/**
 * Behaviour shared by the long-form legal pages (/privacy-policy, /terms).
 *
 * Three jobs, all of which exist because these documents are scanned rather
 * than read start to end:
 *   - highlight the contents entry for the section you are actually reading;
 *   - keep that entry visible in the rail when the list is longer than the
 *     viewport, which it is on /terms;
 *   - keep anchor targets clear of the sticky site Header.
 *
 * Markup contract: a `.page` root, `[data-toc]` around each copy of the nav
 * (sticky rail + mobile disclosure), and `.prose h2[id]` section headings.
 */

import { syncStickyHeader } from "./stickyHeader";

/** Marks the nav entry for `id` as current across every copy of the nav. */
const setActive = (links: HTMLAnchorElement[], id: string): void => {
    for (const link of links) {
        if (link.hash.slice(1) === id) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
    }
};

/**
 * Scroll the rail — and only the rail — so the current entry is visible.
 *
 * `scrollIntoView` would walk up to the document and yank the page out from
 * under the reader, so the rail's own scrollTop is adjusted directly, and only
 * when the entry has actually fallen outside it.
 */
const revealInRail = (rail: HTMLElement | null): void => {
    const active = rail?.querySelector<HTMLAnchorElement>('a[aria-current="true"]');
    if (!rail || !active) return;

    const entry = active.getBoundingClientRect();
    const bounds = rail.getBoundingClientRect();

    if (entry.top < bounds.top) rail.scrollTop -= bounds.top - entry.top;
    else if (entry.bottom > bounds.bottom) rail.scrollTop += entry.bottom - bounds.bottom;
};

/**
 * Warn when the hand-written headings and the array-driven nav drift apart.
 * Dev only — in production a missing entry is a dead nav link, not a crash.
 */
const warnOnDrift = (page: string, links: HTMLAnchorElement[], headings: HTMLElement[]): void => {
    const linked = new Set(links.map((a) => a.hash.slice(1)));
    const headingsNotInNav = headings.filter((h) => !linked.has(h.id)).map((h) => h.id);
    const navEntriesWithNoHeading = [...linked].filter((id) => !document.getElementById(id));

    if (headingsNotInNav.length || navEntriesWithNoHeading.length) {
        console.warn(
            `[${page}] contents nav is out of step with the headings.`,
            { headingsNotInNav, navEntriesWithNoHeading },
        );
    }
};

export const initLegalDoc = (page: string): void => {
    const links = Array.from(
        document.querySelectorAll<HTMLAnchorElement>("[data-toc] a[href^='#']"),
    );
    const headings = Array.from(document.querySelectorAll<HTMLElement>(".prose h2[id]"));
    const rail = document.querySelector<HTMLElement>(".tocDesktop");

    if (import.meta.env.DEV) warnOnDrift(page, links, headings);

    if (links.length && headings.length) {
        const visible = new Set<string>();

        /* rootMargin pins the "active" band to the upper third of the viewport,
           so the highlighted entry is the heading you are reading rather than
           whichever one happens to be nearest the fold. */
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) visible.add(entry.target.id);
                    else visible.delete(entry.target.id);
                }

                // Document order wins, so scrolling up lands on the heading you
                // scrolled back into rather than the last one to leave the band.
                const first = headings.find((h) => visible.has(h.id));
                if (first) {
                    setActive(links, first.id);
                    revealInRail(rail);
                }
            },
            { rootMargin: "0px 0px -66% 0px", threshold: 0 },
        );

        for (const heading of headings) observer.observe(heading);

        // Clicking an entry should highlight it immediately, before the scroll
        // animation has moved the heading into the observed band.
        for (const link of links) {
            link.addEventListener("click", () => setActive(links, link.hash.slice(1)));
        }
    }

    /* The site Header is sticky and grows when its nav wraps, so a hardcoded
       offset parks jumped-to headings behind it at some widths. */
    syncStickyHeader(document.querySelector<HTMLElement>(".page"));

    // Collapse the mobile contents once a destination is chosen.
    const mobileToc = document.querySelector<HTMLDetailsElement>(".tocMobile");
    mobileToc?.addEventListener("click", (event) => {
        if ((event.target as HTMLElement).closest("a")) mobileToc.open = false;
    });
};
