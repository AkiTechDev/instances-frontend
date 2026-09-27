import { createUniqueId, Show, type Component } from "solid-js";
import { ResponsiveImage } from "@responsive-image/solid";

import StandingDialog from "./StandingDialog";

import styles from "./AccountStanding.module.css";
import button from "../../../styles/components/button.module.css";
import iconCross from "../../../assets/icons/cross.svg";
/* Animates itself: the file carries its own CSS, so it costs nothing until the
   modal opens, and honours reduced motion from inside. The moving parts are
   hand-tagged (brows, eyes, nose, mouth) — a fresh export from the design tool
   drops the tags and the villager goes still. */
import villager from "../../../assets/icons/villager.svg";
/* Flat pixel art, which AVIF and WebP shrink to a few KB against the PNG's
   177. It is always drawn 548px wide (--art-width), so those are the only two
   sizes worth making: 1x and 2x. */
import grassBackground from "../../../assets/images/grassBackground.png?w=548;1096&format=avif;webp&responsive";

/**
 * The modal an exhausted trial opens with. Once closed it carries on as the
 * plain banner, in paymentCopy's words rather than these.
 */
const TrialOverModal: Component<{
    /** "7-day", "1-hour" — from what the trial granted. Absent, the heading
     *  just says "free trial". */
    trialLength?: string,
    /** The server's override for urgent wording; stands in for the subtext. */
    message?: string,
    note?: string | null,
    onAction: () => void,
    /** Checkout is being opened. Not `disabled`: that would grey the button
     *  out for the moment before Stripe loads, and drop focus off it. */
    busy?: boolean,
    onClose: () => void,
    promptId: string,
}> = (props) => {
    const id = createUniqueId();

    return (
        <StandingDialog
            class={`${styles.modal} ${styles.trialOver}`}
            promptId={props.promptId}
            labelledBy={`trialOverTitle${id}`}
            describedBy={`trialOverBody${id}`}
            onClose={() => props.onClose()}
        >
            <div class={styles.scene}>
                <ResponsiveImage class={styles.art} src={grassBackground} width={548} alt="" loading="eager" />

                <button
                    class={styles.close}
                    style={`--icon: url("${iconCross.src}")`}
                    type="button"
                    aria-label="Close"
                    onClick={() => props.onClose()}
                ></button>

                <h6 id={`trialOverTitle${id}`} class="h5">
                    Hope you enjoyed<br />
                    your <span class={styles.accent}>{props.trialLength ? `${props.trialLength} free trial!` : "free trial!"}</span> <span aria-hidden="true">🎮</span>
                </h6>
                <p id={`trialOverBody${id}`} class={`${styles.muted} ${styles.subtext} statsTitle`}>
                    {props.message ?? "Game over? Not quite. Add a payment method and keep your server running."}
                </p>

                <Show when={props.note}>
                    <p class={`${styles.note} bodyTextSmall`} role="status">{props.note}</p>
                </Show>

                <img
                    class={styles.villager}
                    src={villager.src}
                    width={villager.width}
                    height={villager.height}
                    alt=""
                    decoding="async"
                />

                <button
                    class={`${button.btn} ${button.dark} ${styles.cta} ${props.busy ? button.busy : ""}`}
                    type="button"
                    aria-disabled={props.busy}
                    onClick={() => props.onAction()}
                >
                    <p class="buttonText">{props.busy ? "Opening checkout…" : "Keep Playing"}</p>
                </button>
                <button class={`${button.btn} ${button.linkDark} ${styles.skip}`} type="button" onClick={() => props.onClose()}>
                    <p class="bodyTextSmall">Skip for now</p>
                </button>
            </div>
        </StandingDialog>
    );
};

export default TrialOverModal;
