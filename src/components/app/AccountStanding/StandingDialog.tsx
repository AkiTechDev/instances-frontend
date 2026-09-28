import { onCleanup, onMount, type Component, type JSX } from "solid-js";
import { Portal } from "solid-js/web";

import { useFocusTrap } from "../../../lib/hooks/useFocusTrap";

import styles from "./AccountStanding.module.css";

/**
 * The dialog every account-standing modal sits in — backdrop, Escape, focus
 * trap and the page's scroll lock — so each modal only brings its contents.
 *
 * Always closable, even for a prompt that can't be dismissed: closing only ends
 * the interruption for this page load. A prompt that can't be dismissed carries
 * on as a banner with no close button, and the modal returns on the next load.
 */
const StandingDialog: Component<{
    class: string,
    tone?: "notice" | "critical",
    promptId: string,
    labelledBy: string,
    describedBy: string,
    onClose: () => void,
    children: JSX.Element,
}> = (props) => {
    let containerRef: HTMLDivElement | undefined;

    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape") props.onClose();
    };

    // Focus the dialog itself, so its title and body are read out before the
    // buttons — then keep Tab inside it.
    useFocusTrap(() => containerRef);

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
        document.body.style.overflow = "hidden";
    });

    onCleanup(() => {
        window.removeEventListener("keydown", handleKeydown);
        document.body.style.overflow = "";
    });

    return (
        <Portal>
            <div class={styles.backdrop} onClick={() => props.onClose()}></div>
            <div
                ref={containerRef}
                class={props.class}
                data-tone={props.tone}
                data-prompt={props.promptId}
                /* Lets AccountPrompts tell this dialog apart from the app's
                   own when it checks whether another one is already open. */
                data-account-standing=""
                role="dialog"
                aria-modal="true"
                aria-labelledby={props.labelledBy}
                aria-describedby={props.describedBy}
                tabindex="-1"
            >
                {props.children}
            </div>
        </Portal>
    );
};

export default StandingDialog;
