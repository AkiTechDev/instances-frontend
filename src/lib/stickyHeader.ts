/**
 * Keep a `--header-h` custom property on `target` in step with the sticky site
 * Header.
 *
 * `components/astrojs/header/Header.astro` is `position: sticky; top: 0`, and
 * it grows from ~94px to ~118px once its nav wraps. Anything that jumps to an
 * anchor, or sticks below it, has to clear that height — and a hardcoded
 * offset is wrong at one width or the other. Pages set a pre-hydration
 * fallback in CSS and call this to correct it once the real header exists.
 *
 * Returns the observer so a caller with a lifecycle can disconnect it; page
 * scripts that live as long as the document can ignore it.
 */
export const syncStickyHeader = (target: HTMLElement | null): ResizeObserver | null => {
    const siteHeader = document.querySelector<HTMLElement>("body > header");
    if (!target || !siteHeader) return null;

    const apply = () => {
        const height = siteHeader.getBoundingClientRect().height;
        // A zero height means the header hasn't laid out yet; the CSS fallback
        // is a better answer than 0px.
        if (height > 0) target.style.setProperty("--header-h", `${height}px`);
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(siteHeader);
    return observer;
};
