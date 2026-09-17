import { onCleanup, onMount, type Accessor } from "solid-js";

/**
 * Things a keyboard can land on. Recomputed on every Tab rather than cached at
 * mount: a dialog's contents change as it is filled in — a game is picked and
 * a whole config form appears, a submit button enables, an error region shows
 * up — and a stale list would let Tab walk straight past the new controls.
 */
const FOCUSABLE = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

const focusableWithin = (root: HTMLElement): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))
        // `offsetParent` is null for anything display:none — a collapsed
        // advanced-settings panel keeps its fields in the DOM.
        .filter((el) => el.offsetParent !== null || el === document.activeElement);

/**
 * Keeps keyboard focus inside a dialog, and hands it back when the dialog goes.
 *
 * `aria-modal="true"` tells assistive tech the rest of the page is inert. It
 * does nothing whatsoever to Tab: without this, a few presses walk out of the
 * dialog and into the page behind it, with no visible sign that they have —
 * which is how someone ends up typing into the dashboard underneath a form
 * they think they are filling in.
 *
 * Restoring focus on close is the other half. The control that opened the
 * dialog is where the user was, and returning them anywhere else (or, as
 * happens by default, to the top of the document) loses their place.
 *
 * A native `<dialog>` with `showModal()` would give all of this plus real
 * inertness for free. That is the right eventual home for all four modals, but
 * it moves each one's backdrop, stacking and positioning into the top layer —
 * a visual change to four components. This is the behaviour without that risk.
 */
export function useFocusTrap(
    container: Accessor<HTMLElement | undefined>,
    opts?: {
        /** Where focus should land on open. Defaults to the dialog itself, so
         *  its label and description are announced before its controls. */
        initialFocus?: () => HTMLElement | undefined;
    },
): void {
    let returnTo: HTMLElement | null = null;

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;

        const root = container();
        if (!root?.isConnected) return;

        const items = focusableWithin(root);

        // Nothing to land on — hold the dialog itself rather than letting Tab
        // escape into the page behind.
        if (!items.length) {
            e.preventDefault();
            root.focus();
            return;
        }

        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement as HTMLElement | null;
        const outside = !root.contains(active);

        if (e.shiftKey && (active === first || outside)) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && (active === last || outside)) {
            e.preventDefault();
            first.focus();
        }
    };

    // Backstop for focus that arrives without a Tab — a click on the page
    // behind the backdrop, or a programmatic focus() from another component.
    const onFocusIn = (e: FocusEvent) => {
        const root = container();
        if (!root?.isConnected) return;
        if (root.contains(e.target as Node)) return;

        (focusableWithin(root)[0] ?? root).focus();
    };

    onMount(() => {
        returnTo = document.activeElement as HTMLElement | null;

        const root = container();
        (opts?.initialFocus?.() ?? root)?.focus();

        // Capture phase, so the wrap happens before anything inside the dialog
        // gets to act on the same Tab.
        document.addEventListener("keydown", onKeyDown, true);
        document.addEventListener("focusin", onFocusIn);
    });

    onCleanup(() => {
        document.removeEventListener("keydown", onKeyDown, true);
        document.removeEventListener("focusin", onFocusIn);

        // Only if it is still on the page: a dialog that closed because the
        // route changed, or because the thing that opened it was deleted, has
        // nothing to go back to.
        if (returnTo?.isConnected) returnTo.focus();
    });
}
