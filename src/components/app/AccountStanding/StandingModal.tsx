import { createUniqueId, Show, type Component } from "solid-js";

import StandingDialog from "./StandingDialog";

import styles from "./AccountStanding.module.css";
import button from "../../../styles/components/button.module.css";

/**
 * Test surface for a modal prompt — placeholder styling until design lands.
 * An exhausted trial has its design already; see TrialOverModal.
 */
const StandingModal: Component<{
    tone: "notice" | "critical",
    title: string,
    body: string,
    note?: string | null,
    actionLabel: string,
    onAction: () => void,
    /** Checkout is being opened; see TrialOverModal. */
    busy?: boolean,
    onClose: () => void,
    promptId: string,
}> = (props) => {
    const id = createUniqueId();

    return (
        <StandingDialog
            class={styles.modal}
            tone={props.tone}
            promptId={props.promptId}
            labelledBy={`standingTitle${id}`}
            describedBy={`standingBody${id}`}
            onClose={() => props.onClose()}
        >
            <h6 id={`standingTitle${id}`} class="h6">{props.title}</h6>
            <p id={`standingBody${id}`} class={`${styles.muted} bodyText`}>{props.body}</p>

            <Show when={props.note}>
                <p class={`${styles.note} bodyTextSmall`} role="status">{props.note}</p>
            </Show>

            <div class={styles.actions}>
                <button class={`${button.btn} ${button.sm} ${button.outlineDark}`} type="button" onClick={() => props.onClose()}>
                    <p class="buttonTextSmall">Not now</p>
                </button>
                <button
                    class={`${button.btn} ${button.sm} ${button.vibrant} ${props.busy ? button.busy : ""}`}
                    type="button"
                    aria-disabled={props.busy}
                    onClick={() => props.onAction()}
                >
                    <p class="buttonTextSmall">{props.busy ? "Opening checkout…" : props.actionLabel}</p>
                </button>
            </div>
        </StandingDialog>
    );
};

export default StandingModal;
