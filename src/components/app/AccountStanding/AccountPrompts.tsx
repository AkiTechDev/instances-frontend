import { createMemo, createSignal, ErrorBoundary, Match, on, onCleanup, Show, Switch, type Component } from "solid-js";

import { useAuth } from "../Auth/AuthProvider";
import SurveyModal from "../SurveyModal/SurveyModal";
import { useStanding } from "./AccountStandingProvider";
import StandingBanner from "./StandingBanner";
import StandingModal from "./StandingModal";
import TrialOverModal from "./TrialOverModal";
import { copyFor, dismiss, formatTrialLength, isDismissed, markModalSeen, modalSeen } from "./prompts";

import { startCheckout, type StandingPrompt } from "../../../lib/account";

/* Never open on top of one of the app's own dialogs. Each one traps focus by
   pulling it back on `focusin`, so two at once would take it from each other
   forever. The banner stands in until the next load. */
const anotherDialogOpen = () =>
    document.querySelector('[aria-modal="true"]:not([data-account-standing])') !== null;

const Prompts: Component = () => {
    const { account } = useAuth();
    const store = useStanding();

    // Dismissals and the seen-this-load set live outside Solid; bumping this
    // makes everything below read them again.
    const [revision, setRevision] = createSignal(0);
    const bump = () => setRevision((n) => n + 1);

    const [surveyFor, setSurveyFor] = createSignal<StandingPrompt | null>(null);
    const [note, setNote] = createSignal<string | null>(null);

    /* One prompt at a time — never a review request stacked on a payment
       warning. The server ranks; this shows the top one still standing. While
       a checkout return is being confirmed, none: that banner is the story. */
    const winner = createMemo(() => {
        revision();
        const standing = store.standing();
        if (!standing || store.confirmingPayment()) return undefined;

        const sub = account().sub;
        return standing.prompts
            .filter((p) => !p.dismissible || !isDismissed(sub, p))
            .sort((a, b) => b.priority - a.priority)[0];
    });

    const shown = createMemo(() => {
        const prompt = winner();
        const standing = store.standing();
        if (!prompt || !standing) return undefined;
        return {
            prompt,
            copy: copyFor(prompt, standing, store.trialRemaining()),
            // The status decides, as it does for the copy.
            trialOver: prompt.kind === "payment" && standing.status === "EXHAUSTED",
            trialLength: standing.trial && formatTrialLength(standing.trial.granted_seconds),
        };
    });

    const winnerKey = createMemo(() => {
        const p = winner();
        return p && `${p.id}|${p.surface}|${p.dismissible}`;
    });

    /* Where the winner goes. Re-decided only when the winner itself changes or
       something is closed — a re-read that returns the same prompt must not
       pull a modal out from under someone reading it. */
    const placement = createMemo(on([winnerKey, revision], () => {
        const p = winner();
        if (!p) return null;

        if (p.surface === "modal" && !modalSeen(p.id) && !anotherDialogOpen()) return "modal";

        // A modal that has had its turn carries on as a banner until it's
        // resolved — unless it could be dismissed, in which case closing it
        // was the dismissal.
        if (p.surface === "banner" || !p.dismissible) return "banner";
        return null;
    }));

    const tone = () => (store.standing()?.blocked ? "critical" : "notice");

    /* Each press creates a Stripe session, so a second one is ignored while the
       first is in flight. On success it stays set: the page is navigating
       away, and a press during that wait would open a second checkout. */
    const [checkingOut, setCheckingOut] = createSignal(false);

    // …except that Back from Stripe can restore this page from the bfcache,
    // exactly as it was left: busy, with nothing in flight, and holding the
    // standing from before checkout. Whatever happened there, ask again.
    const onPageShow = (e: PageTransitionEvent) => {
        if (!e.persisted || !checkingOut()) return;
        setCheckingOut(false);
        void store.refresh({ force: true });
    };
    window.addEventListener("pageshow", onPageShow);
    onCleanup(() => window.removeEventListener("pageshow", onPageShow));

    const act = async (prompt: StandingPrompt) => {
        if (prompt.kind === "review") {
            setSurveyFor(prompt);
            return;
        }
        if (checkingOut()) return;

        setNote(null);
        setCheckingOut(true);
        try {
            await startCheckout(account().sub);
        } catch (err) {
            console.error("checkout failed", err);
            setNote("We couldn't open checkout. Try again in a moment.");
            setCheckingOut(false);
        }
    };

    const closeModal = (prompt: StandingPrompt) => {
        markModalSeen(prompt.id);
        dismiss(account().sub, prompt); // a no-op unless it's dismissible
        setNote(null);
        bump();
    };

    const dismissBanner = (prompt: StandingPrompt) => {
        dismiss(account().sub, prompt);
        setNote(null);
        bump();
    };

    const closeSurvey = (prompt: StandingPrompt) => {
        setSurveyFor(null);
        dismiss(account().sub, prompt);
        bump();
    };

    return (
        <>
            <Show when={store.confirmingPayment()}>
                <StandingBanner tone="notice" title="Confirming your payment…" body="This usually takes a few seconds." />
            </Show>

            <Show when={placement() === "banner" && shown()}>
                {(view) => (
                    <StandingBanner
                        tone={tone()}
                        title={view().copy.title}
                        body={view().copy.body}
                        note={note()}
                        action={{ label: view().copy.action, onClick: () => void act(view().prompt) }}
                        busy={checkingOut()}
                        onDismiss={view().prompt.dismissible ? () => dismissBanner(view().prompt) : undefined}
                        promptId={view().prompt.id}
                    />
                )}
            </Show>

            <Show when={placement() === "modal" && shown()}>
                {(view) => (
                    <Switch
                        fallback={
                            <StandingModal
                                tone={tone()}
                                title={view().copy.title}
                                body={view().copy.body}
                                note={note()}
                                actionLabel={view().copy.action}
                                onAction={() => void act(view().prompt)}
                                busy={checkingOut()}
                                onClose={() => closeModal(view().prompt)}
                                promptId={view().prompt.id}
                            />
                        }
                    >
                        {/* A review prompt's modal is the existing survey, as-is. */}
                        <Match when={view().prompt.kind === "review"}>
                            <SurveyModal onClose={() => closeModal(view().prompt)} />
                        </Match>
                        <Match when={view().trialOver}>
                            <TrialOverModal
                                trialLength={view().trialLength}
                                message={view().prompt.message}
                                note={note()}
                                onAction={() => void act(view().prompt)}
                                busy={checkingOut()}
                                onClose={() => closeModal(view().prompt)}
                                promptId={view().prompt.id}
                            />
                        </Match>
                    </Switch>
                )}
            </Show>

            <Show when={surveyFor()}>
                {(prompt) => <SurveyModal onClose={() => closeSurvey(prompt())} />}
            </Show>
        </>
    );
};

/**
 * Picks the one prompt that wins and routes it to a banner or a modal.
 *
 * Mounted above the route's error boundary on purpose: someone whose page just
 * failed to render is exactly who needs to know their account is blocked. So
 * it carries a boundary of its own — a bug in here must never take the app
 * down with it.
 */
const AccountPrompts: Component = () => (
    <ErrorBoundary fallback={(err) => {
        console.error("account prompts failed to render", err);
        return null;
    }}>
        <Prompts />
    </ErrorBoundary>
);

export default AccountPrompts;
