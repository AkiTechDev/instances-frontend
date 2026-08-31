import { createSignal, createUniqueId, onCleanup, onMount, Show, type Component } from "solid-js";
import { Portal } from "solid-js/web";
import { revalidate } from "@solidjs/router";

import styles from "./DeleteInstanceModal.module.css";
import button from "../../../styles/components/button.module.css";
import iconCross from "../../../assets/icons/cross.svg";

import { deleteInstance, getInstances, type Instance } from "../../../lib/apis";
import { gameRegistry } from "../../../lib/games/index";

const DeleteInstanceModal: Component<{
    instance: Instance,
    onClose: () => void,
    onDeleted: () => void,
}> = (props) => {
    const id = createUniqueId();
    const [deleting, setDeleting] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    let cancelRef: HTMLButtonElement | undefined;

    const gameName = () => gameRegistry[props.instance.game]?.name ?? props.instance.game;

    // Once the DELETE is away the teardown can't be called back, so every
    // dismissal route (backdrop, X, Escape, Cancel) is closed while it's in flight.
    const dismiss = () => {
        if (!deleting()) props.onClose();
    };

    const confirmDelete = async () => {
        if (deleting()) return;
        setDeleting(true);
        setError(null);
        try {
            await deleteInstance(props.instance);
            // Drop the cached instance list so the dashboard doesn't render a
            // card for something that no longer exists.
            await revalidate(getInstances.key);
            props.onDeleted();
        } catch (err) {
            console.error("delete failed", err);
            setError("We couldn't delete that instance. Nothing has been removed — try again in a moment.");
            setDeleting(false);
        }
    };

    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape") dismiss();
    };

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
        document.body.style.overflow = "hidden";
        // Land focus on Cancel, never on the destructive button.
        cancelRef?.focus();
    });

    onCleanup(() => {
        window.removeEventListener("keydown", handleKeydown);
        document.body.style.overflow = "";
    });

    return (
        <Portal>
            <div class={styles.backdrop} onClick={dismiss}></div>
            <div
                class={styles.container}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={`deleteTitle${id}`}
                aria-describedby={`deleteBody${id}`}
                onClick={(e) => e.stopImmediatePropagation()}
            >
                <button
                    class={styles.exit}
                    style={`--icon: url("${iconCross.src}")`}
                    onClick={dismiss}
                    disabled={deleting()}
                    aria-label="Close"
                ></button>

                <div class={styles.header}>
                    <span class={styles.warning} aria-hidden="true">!</span>
                    <h6 id={`deleteTitle${id}`} class="h6">Delete this instance?</h6>
                </div>

                <div id={`deleteBody${id}`} class={styles.body}>
                    <p class="bodyText">
                        You're about to permanently delete <strong>{props.instance.name}</strong> ({gameName()}).
                    </p>
                    <p class={`${styles.muted} bodyText`}>
                        The server, its world and every save file are destroyed with it. This is permanent — it can't
                        be undone, and we can't recover it for you afterwards.
                    </p>
                </div>

                <Show when={error()}>
                    <p class={`${styles.error} bodyTextSmall`} role="alert">{error()}</p>
                </Show>

                <div class={styles.actions}>
                    <button
                        ref={cancelRef}
                        class={`${button.btn} ${button.sm} ${button.outlineDark}`}
                        onClick={dismiss}
                        disabled={deleting()}
                        type="button"
                    >
                        <p class="buttonTextSmall">Cancel</p>
                    </button>
                    <button
                        class={`${button.btn} ${button.sm} ${button.danger}`}
                        onClick={confirmDelete}
                        disabled={deleting()}
                        type="button"
                    >
                        <p class="buttonTextSmall">{deleting() ? "Deleting…" : "Delete Instance"}</p>
                    </button>
                </div>
            </div>
        </Portal>
    )
}

export default DeleteInstanceModal
