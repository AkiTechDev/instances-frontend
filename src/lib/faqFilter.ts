/**
 * Live filtering for /faq.
 *
 * The page ships complete and readable with every answer visible: this only
 * ever *hides* things. With JavaScript off, or before it runs, the reader gets
 * the whole document — which is also what makes the page's FAQPage structured
 * data honest, since every marked-up answer is on the page by default.
 *
 * Markup contract:
 *   [data-faq-search]  the input
 *   [data-faq-clear]   button that empties it
 *   [data-faq-item]    one question, carrying `data-search` (lowercased haystack)
 *   [data-faq-group]   a category section, hidden when all its items are
 *   [data-faq-count]   polite live region for the result count
 *   [data-faq-empty]   the nothing-matched block
 *   [data-faq-term]    where the searched term is echoed inside that block
 */

import { syncStickyHeader } from "./stickyHeader";

/** Every whitespace-separated word must appear somewhere in the haystack. */
const matches = (haystack: string, terms: string[]): boolean =>
    terms.every((term) => haystack.includes(term));

export const initFaqFilter = (): void => {
    const page = document.querySelector<HTMLElement>(".page");
    syncStickyHeader(page);

    const input = document.querySelector<HTMLInputElement>("[data-faq-search]");
    const clear = document.querySelector<HTMLButtonElement>("[data-faq-clear]");
    const count = document.querySelector<HTMLElement>("[data-faq-count]");
    const empty = document.querySelector<HTMLElement>("[data-faq-empty]");
    const term = document.querySelector<HTMLElement>("[data-faq-term]");
    const items = [...document.querySelectorAll<HTMLElement>("[data-faq-item]")];
    const groups = [...document.querySelectorAll<HTMLElement>("[data-faq-group]")];

    if (!input || !items.length) return;

    /* The search box is the one control that is useless without scripting, so
       the page ships it hidden and this reveals it. */
    document.querySelector<HTMLElement>("[data-faq-tools]")?.removeAttribute("hidden");

    const total = items.length;

    const apply = (raw: string): void => {
        const terms = raw.toLowerCase().split(/\s+/).filter(Boolean);
        let shown = 0;

        for (const item of items) {
            const hit = !terms.length || matches(item.dataset.search ?? "", terms);
            item.hidden = !hit;
            if (hit) shown += 1;
        }

        /* A heading left standing over nothing reads as a bug. */
        for (const group of groups) {
            const anyVisible = [...group.querySelectorAll<HTMLElement>("[data-faq-item]")]
                .some((item) => !item.hidden);
            group.hidden = !anyVisible;
        }

        if (empty) empty.hidden = shown > 0;
        if (term) term.textContent = raw.trim();
        if (clear) clear.hidden = !raw;

        if (count) {
            /* "1 of 22 answers match" is wrong and "…matches" reads oddly
               next to the plural, so the count sidesteps the verb entirely. */
            count.textContent = !terms.length
                ? ""
                : shown === 0
                    ? "No answers match."
                    : `Showing ${shown} of ${total} answers.`;
        }
    };

    input.addEventListener("input", () => apply(input.value));

    /* Escape clears rather than blurring — the browser's own behaviour on a
       search input is inconsistent, and losing focus mid-thought is worse. */
    input.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !input.value) return;
        input.value = "";
        apply("");
    });

    clear?.addEventListener("click", () => {
        input.value = "";
        apply("");
        input.focus();
    });

    /* Following a link into a filtered-out answer would land on nothing. */
    for (const link of document.querySelectorAll<HTMLAnchorElement>("[data-faq-jump]")) {
        link.addEventListener("click", () => {
            if (!input.value) return;
            input.value = "";
            apply("");
        });
    }

    /* Deep link: /faq?q=billing arrives pre-filtered. */
    const preset = new URLSearchParams(location.search).get("q");
    if (preset) {
        input.value = preset;
        apply(preset);
    }
};
