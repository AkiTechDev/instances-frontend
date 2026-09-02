import { createSignal, Show, type Component } from "solid-js";

import SurveyModal from "./SurveyModal";

import button from "../../../styles/components/button.module.css";
import iconFeedback from "../../../assets/icons/feedback.svg";

/**
 * The survey's open/close toggle, bundled with the modal it controls so a page
 * only has to drop `<FeedbackButton />` into its header — no state to plumb.
 *
 * The modal is mounted fresh each time, so closing it discards whatever was
 * filled in rather than leaving a stale half-answered form behind.
 */
const FeedbackButton: Component<{}> = () => {
    const [isOpen, setIsOpen] = createSignal(false);

    return (
        <>
            <button
                class={`${button.btn} ${button.sm} ${button.outlineDark} ${button.icon}`}
                style={`--icon: url("${iconFeedback.src}")`}
                onClick={() => setIsOpen(!isOpen())}
                aria-haspopup="dialog"
                aria-expanded={isOpen()}
                type="button"
            >
                <p class="buttonTextSmall">Feedback</p>
            </button>

            <Show when={isOpen()}>
                <SurveyModal onClose={() => setIsOpen(false)} />
            </Show>
        </>
    )
}

export default FeedbackButton
