import { Show, type Component } from "solid-js";

import styles from "./AccountStanding.module.css";
import button from "../../../styles/components/button.module.css";
import iconCross from "../../../assets/icons/cross.svg";

/**
 * Test surface for a banner prompt — placeholder styling until design lands.
 *
 * Fixed to the bottom of the viewport rather than in the page flow: the app's
 * body is a two-column grid (Instance.astro), and a new in-flow child would be
 * auto-placed into the 100px nav column and push every route down a row. Where
 * the real banner sits is a layout decision for the design pass.
 */
const StandingBanner: Component<{
    tone: "notice" | "critical",
    title: string,
    body?: string,
    note?: string | null,
    action?: { label: string, onClick: () => void },
    /** Checkout is being opened; see TrialOverModal. */
    busy?: boolean,
    /** Omitted for a prompt that can't be dismissed — there is no close button. */
    onDismiss?: () => void,
    promptId?: string,
}> = (props) => (
    // A landmark rather than a live region: the trial countdown ticks inside
    // it, and a live region would announce every second.
    <aside class={styles.banner} data-tone={props.tone} data-prompt={props.promptId} aria-label="Account notice">
        <div class={styles.bannerText}>
            <p class="bodyTextMedium">{props.title}</p>
            <Show when={props.body}>
                <p class={`${styles.muted} bodyTextSmall`}>{props.body}</p>
            </Show>
            <Show when={props.note}>
                <p class={`${styles.note} bodyTextSmall`} role="status">{props.note}</p>
            </Show>
        </div>

        <Show when={props.action}>
            {(action) => (
                <button
                    class={`${button.btn} ${button.sm} ${button.vibrant} ${props.busy ? button.busy : ""}`}
                    type="button"
                    aria-disabled={props.busy}
                    onClick={() => action().onClick()}
                >
                    <p class="buttonTextSmall">{props.busy ? "Opening checkout…" : action().label}</p>
                </button>
            )}
        </Show>

        <Show when={props.onDismiss}>
            <button
                class={styles.dismiss}
                style={`--icon: url("${iconCross.src}")`}
                type="button"
                aria-label="Dismiss"
                onClick={() => props.onDismiss?.()}
            ></button>
        </Show>
    </aside>
);

export default StandingBanner;
