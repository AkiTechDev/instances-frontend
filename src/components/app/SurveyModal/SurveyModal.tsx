import { createSignal, createUniqueId, For, onCleanup, onMount, Show, type Component } from "solid-js";
import { Portal } from "solid-js/web";

import styles from "./SurveyModal.module.css";
import button from "../../../styles/components/button.module.css";
import iconCross from "../../../assets/icons/cross.svg";

import { postSurvey, type SurveyResponse } from "../../../lib/apis";
import {
    COMMENT_MAX_LENGTH,
    COMMENT_PLACEHOLDER,
    MAX_RATING,
    RATING_SCALE,
    SURVEY_ID,
    SURVEY_QUESTIONS,
} from "./questions";

const SurveyModal: Component<{ onClose: () => void }> = (props) => {
    const id = createUniqueId();

    const [ratings, setRatings] = createSignal<Record<string, number>>({});
    const [comment, setComment] = createSignal("");
    const [submitting, setSubmitting] = createSignal(false);
    const [submitted, setSubmitted] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);

    let containerRef: HTMLDivElement | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;

    const answered = () => Object.keys(ratings()).length;
    const allAnswered = () => answered() === SURVEY_QUESTIONS.length;
    const locked = () => submitting() || submitted();

    const setRating = (questionId: string, value: number) =>
        setRatings((prev) => ({ ...prev, [questionId]: value }));

    // Every dismissal route (backdrop, X, Escape, Cancel) is closed while the
    // POST is in flight, so a half-sent response can't be abandoned mid-way.
    const dismiss = () => {
        if (!submitting()) props.onClose();
    };

    const submit = async (e: Event) => {
        e.preventDefault();
        if (locked() || !allAnswered()) return;

        setSubmitting(true);
        setError(null);

        const trimmedComment = comment().trim();
        const payload: SurveyResponse = {
            survey_id: SURVEY_ID,
            submitted_at: new Date().toISOString(),
            answers: SURVEY_QUESTIONS.map((q) => ({
                id: q.id,
                question: q.question,
                rating: ratings()[q.id],
            })),
            // Omitted entirely when blank rather than sent as an empty string.
            ...(trimmedComment ? { comment: trimmedComment } : {}),
            context: {
                path: window.location.pathname,
                user_agent: navigator.userAgent,
            },
        };

        try {
            await postSurvey(payload);
            setSubmitted(true);
            // Let the thank-you actually register before the modal disappears.
            closeTimer = setTimeout(() => props.onClose(), 1600);
        } catch (err) {
            console.error("survey submit failed", err);
            setError("We couldn't send that. Your answers are still here — try again in a moment.");
            setSubmitting(false);
        }
    };

    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape") dismiss();
    };

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
        document.body.style.overflow = "hidden";
        // Focus the dialog itself rather than the first radio, so the title and
        // intro are announced before the rater lands in the questions.
        containerRef?.focus();
    });

    onCleanup(() => {
        window.removeEventListener("keydown", handleKeydown);
        document.body.style.overflow = "";
        clearTimeout(closeTimer);
    });

    return (
        <Portal>
            <div class={styles.backdrop} onClick={dismiss}></div>
            <div
                ref={containerRef}
                class={styles.container}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`surveyTitle${id}`}
                aria-describedby={`surveyIntro${id}`}
                tabindex="-1"
                onClick={(e) => e.stopImmediatePropagation()}
            >
                <button
                    class={styles.exit}
                    style={`--icon: url("${iconCross.src}")`}
                    onClick={dismiss}
                    disabled={submitting()}
                    aria-label="Close"
                    type="button"
                ></button>

                <div class={styles.header}>
                    <h6 id={`surveyTitle${id}`} class="h6">How are we doing?</h6>
                    <p id={`surveyIntro${id}`} class={`${styles.intro} statsTitle`}>
                        We're in beta, so this is the part where you tell us what's broken.
                        Rate each one from 0 to 5 — it takes about a minute.
                    </p>
                </div>

                <Show
                    when={!submitted()}
                    fallback={
                        <div class={styles.thanks} role="status">
                            <span class={styles.thanksMark} aria-hidden="true">✓</span>
                            <p class="subtitleSemi">Thank you — that's genuinely useful.</p>
                            <p class={`${styles.intro} bodyText`}>
                                Every rating here goes straight into what we fix next.
                            </p>
                        </div>
                    }
                >
                    <form class={styles.form} onSubmit={submit} noValidate>
                        <div class={styles.questions}>
                            <For each={SURVEY_QUESTIONS}>
                                {(q) => (
                                    // Deliberately a radiogroup rather than fieldset/legend: browsers
                                    // don't treat <legend> as a flex item, so the layout below would
                                    // space unevenly. Same semantics, no quirk — and arrow-key
                                    // navigation comes from the shared `name`, not the fieldset.
                                    <div
                                        class={styles.question}
                                        role="radiogroup"
                                        aria-labelledby={`q${id}${q.id}`}
                                        aria-describedby={q.hint ? `h${id}${q.id}` : undefined}
                                    >
                                        <p id={`q${id}${q.id}`} class="bodyTextMedium">
                                            {q.question}
                                        </p>

                                        <Show when={q.hint}>
                                            <p id={`h${id}${q.id}`} class={`${styles.hint} bodyTextSmall`}>
                                                {q.hint}
                                            </p>
                                        </Show>

                                        <div class={styles.options}>
                                            <For each={RATING_SCALE}>
                                                {(value) => (
                                                    <label class={styles.option}>
                                                        <input
                                                            type="radio"
                                                            name={`${id}-${q.id}`}
                                                            value={value}
                                                            checked={ratings()[q.id] === value}
                                                            onChange={() => setRating(q.id, value)}
                                                            disabled={locked()}
                                                            aria-label={
                                                                value === 0
                                                                    ? `0 — ${q.lowLabel}`
                                                                    : value === MAX_RATING
                                                                        ? `${MAX_RATING} — ${q.highLabel}`
                                                                        : String(value)
                                                            }
                                                        />
                                                        <span class="bodyTextSmallSemi">{value}</span>
                                                    </label>
                                                )}
                                            </For>
                                        </div>

                                        <div class={styles.scaleLabels} aria-hidden="true">
                                            <span class="bodyTextSmallest">{q.lowLabel}</span>
                                            <span class="bodyTextSmallest">{q.highLabel}</span>
                                        </div>
                                    </div>
                                )}
                            </For>

                            <div class={styles.commentField}>
                                <label class="bodyTextMedium" for={`surveyComment${id}`}>
                                    Anything else? <span class={styles.optional}>(optional)</span>
                                </label>
                                <textarea
                                    id={`surveyComment${id}`}
                                    class={`${styles.textarea} bodyText`}
                                    rows={4}
                                    maxlength={COMMENT_MAX_LENGTH}
                                    placeholder={COMMENT_PLACEHOLDER}
                                    value={comment()}
                                    disabled={locked()}
                                    onInput={(e) => setComment(e.currentTarget.value)}
                                />
                                <Show when={comment().length > COMMENT_MAX_LENGTH * 0.8}>
                                    <p class={`${styles.counter} bodyTextSmallest`}>
                                        {comment().length} / {COMMENT_MAX_LENGTH}
                                    </p>
                                </Show>
                            </div>
                        </div>

                        <Show when={error()}>
                            <p class={`${styles.error} bodyTextSmall`} role="alert">{error()}</p>
                        </Show>

                        <div class={styles.actions}>
                            <p class={`${styles.progress} bodyTextSmall`} aria-live="polite">
                                {answered()} of {SURVEY_QUESTIONS.length} answered
                            </p>
                            <div class={styles.buttons}>
                                <button
                                    class={`${button.btn} ${button.sm} ${button.outlineDark}`}
                                    onClick={dismiss}
                                    disabled={submitting()}
                                    type="button"
                                >
                                    <p class="buttonTextSmall">Cancel</p>
                                </button>
                                <button
                                    class={`${button.btn} ${button.sm} ${button.vibrant}`}
                                    disabled={!allAnswered() || submitting()}
                                    type="submit"
                                >
                                    <p class="buttonTextSmall">
                                        {submitting() ? "Sending…" : "Send Feedback"}
                                    </p>
                                </button>
                            </div>
                        </div>
                    </form>
                </Show>
            </div>
        </Portal>
    )
}

export default SurveyModal
