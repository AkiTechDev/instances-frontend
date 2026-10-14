import { createSignal, createUniqueId, onCleanup, onMount, Show, type Component } from "solid-js";

import styles from "./InstanceOptions.module.css";
import effects from "../../../styles/components/effects.module.css";
import iconTick from "../../../assets/icons/tick.svg";
import { useNavigate } from "@solidjs/router";
import {
    describeFailure,
    getInstanceConfig,
    getInstanceStatus,
    postDownloadGameData,
    postInstanceConfig,
    type Failure,
    type Instance,
} from "../../../lib/apis";
import DeleteInstanceModal from "../DeleteInstanceModal/DeleteInstanceModal";
import FormError from "../FormModules/FormError";

type MenuAction = "update" | "download";

/** How the last request ended — a failure carries why. Kept until the menu closes. */
interface Outcome {
    action: MenuAction,
    failure?: Failure,
}

/** How long a success stays up before the menu folds itself away. */
const CONFIRM_MS = 5000;

/** What each action says before, during and after its request. */
const COPY: Record<MenuAction, { idle: string, busy: string, done: string, note: string, failed: string }> = {
    update: {
        idle: "Update Instance",
        busy: "Starting update…",
        done: "Update started",
        note: "Applies over the next few minutes. A running server restarts to pick it up.",
        failed: "We couldn't start the update",
    },
    download: {
        idle: "Download Game Data",
        busy: "Requesting download…",
        done: "Download requested",
        note: "We'll email you a download link once your world is packed.",
        failed: "We couldn't request a download",
    },
};

/**
 * Update / Download: an item whose request takes a moment, so it says so —
 * busy while the request is out, a tick once it has gone through.
 */
const ActionItem: Component<{
    label: string,
    busy: boolean,
    done: boolean,
    disabled: boolean,
    onClick: () => void,
}> = (props) => (
    <button
        type="button"
        role="menuitem"
        class="bodyTextMedium"
        classList={{ [styles.busy]: props.busy, [styles.done]: props.done }}
        style={`--icon: url("${iconTick.src}")`}
        // aria-disabled, not disabled: disabling the item that was just
        // pressed throws keyboard focus off it. So presses are ignored here.
        aria-disabled={props.busy || props.done || undefined}
        disabled={props.disabled}
        onclick={() => { if (!props.busy && !props.done) props.onClick(); }}
    >
        <span classList={{ [effects.pulse]: props.busy }}>{props.label}</span>
    </button>
);

const InstanceOptions: Component<{
    endpoint: string,
    instance: Instance,
    class?: string,
    /** Called, not awaited, once an update is accepted — the card's or panel's
     *  "Updating…" bridge (useProvisioningProgress's onConfigSubmitted). */
    onUpdateStarted?: () => void,
}> = (props) => {
    const navigate = useNavigate();
    const id = createUniqueId();
    const [confirmingDelete, setConfirmingDelete] = createSignal(false);
    // Which request is out, and how the last one ended.
    const [pending, setPending] = createSignal<MenuAction>();
    const [outcome, setOutcome] = createSignal<Outcome>();
    let elRef: HTMLDetailsElement | undefined;
    let summaryRef: HTMLElement | undefined;
    let confirmTimer: ReturnType<typeof setTimeout> | undefined;

    const closeMenu = () => {
        if (elRef?.open) {
            elRef.open = false;
        }
    }

    // Neither of these closes the menu while a request is out: its result
    // would have nowhere to show. The delete modal holds open for the same
    // reason.
    const handleBodyClick = (e: MouseEvent) => {
        if (pending()) return;
        if (!elRef?.contains(e.target as Node)) {
            closeMenu();
        }
    };

    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !pending()) closeMenu();
    };

    // However the menu closed — including another card's menu opening, which
    // closes this one natively — it reopens clean.
    const handleToggle = () => {
        if (elRef?.open) return;
        clearTimeout(confirmTimer);
        setOutcome(undefined);
    };

    // Registered in onMount rather than during render. One card renders one of
    // these, so attaching as a render side effect meant a document-level
    // listener per card, added before the menu was even in the DOM.
    onMount(() => {
        document.body.addEventListener("click", handleBodyClick);
        document.addEventListener("keydown", handleKeydown);
    });

    onCleanup(() => {
        clearTimeout(confirmTimer);
        document.body.removeEventListener("click", handleBodyClick);
        document.removeEventListener("keydown", handleKeydown);
    });

    /**
     * One request at a time. A failure stays up until the menu closes, with
     * the item back to normal so trying again is one press. A success shows
     * for CONFIRM_MS, then the menu folds away.
     */
    const run = async (action: MenuAction, request: (endpoint: string) => Promise<unknown>) => {
        const endpoint = props.endpoint;
        if (!endpoint || pending()) return;
        clearTimeout(confirmTimer);
        setOutcome(undefined);
        setPending(action);
        try {
            await request(endpoint);
        } catch (err) {
            console.error(`${action} request failed`, err);
            setOutcome({ action, failure: describeFailure(err) });
            return;
        } finally {
            setPending(undefined);
        }
        setOutcome({ action });
        confirmTimer = setTimeout(() => {
            setOutcome(undefined);
            // Pressed from the keyboard, focus is still on the item — don't
            // drop it onto <body> as the menu folds away.
            if (elRef?.contains(document.activeElement)) summaryRef?.focus();
            closeMenu();
        }, CONFIRM_MS);
    };

    // Re-send the current config to the per-server gateway, which re-triggers
    // the CDK deploy workflow. With no values changed CDK synth diffs cleanly
    // and applies any template improvements published since the stack was last
    // deployed; no-ops if nothing has changed.
    const requestUpdate = async (endpoint: string) => {
        const [config, runtime] = await Promise.all([
            getInstanceConfig(endpoint),
            getInstanceStatus(endpoint),
        ]);
        await postInstanceConfig(endpoint, {
            plan: config.plan,
            cpu: config.cpu,
            memory: config.memory,
            auto_start: runtime?.state === "running",
        });
        // No revalidate here: the parent's bridge refreshes this instance's
        // state as it polls, where a revalidate refetched every card's.
        props.onUpdateStarted?.();
    };

    const isDone = (action: MenuAction) => {
        const o = outcome();
        return o?.action === action && !o.failure;
    };

    const label = (action: MenuAction) =>
        pending() === action ? COPY[action].busy
        : isDone(action) ? COPY[action].done
        : COPY[action].idle;

    // No endpoint yet, or the other action's request is out.
    const blocked = (action: MenuAction) => {
        const p = pending();
        return !props.endpoint || (p !== undefined && p !== action);
    };

    return (
        <>
        <Show when={confirmingDelete()}>
            <DeleteInstanceModal
                instance={props.instance}
                onClose={() => setConfirmingDelete(false)}
                onDeleted={() => {
                    setConfirmingDelete(false);
                    navigate("/dashboard", { replace: true });
                }}
            />
        </Show>
        <details ref={elRef} name="Instance Settings" class={`${styles.container} ${props.class ?? ""}`} onclick={(e) => e.stopImmediatePropagation()} onToggle={handleToggle}>
            <summary
                ref={summaryRef}
                id={`options${id}`}
                role="button"
                aria-label={`Options for ${props.instance.name}`}
                onclick={(e) => { if (pending()) e.preventDefault(); }}
            >
                <span class={styles.dot}></span>
                <span class={styles.dot}></span>
                <span class={styles.dot}></span>
            </summary>
            <div class={styles.options}>
                <div class={styles.menu} role="menu">
                    <ActionItem
                        label={label("update")}
                        busy={pending() === "update"}
                        done={isDone("update")}
                        disabled={blocked("update")}
                        onClick={() => void run("update", requestUpdate)}
                    />
                    <ActionItem
                        label={label("download")}
                        busy={pending() === "download"}
                        done={isDone("download")}
                        disabled={blocked("download")}
                        onClick={() => void run("download", postDownloadGameData)}
                    />
                    <button type="button" role="menuitem" class={`bodyTextMedium ${styles.comingSoon}`} disabled title="Coming soon">Transfer Ownership <span class={`${styles.soon} smallestLabel`}>Soon</span></button>
                    <button type="button" role="menuitem" class={`bodyTextMedium ${styles.comingSoon}`} disabled title="Coming soon">Change Instance Location <span class={`${styles.soon} smallestLabel`}>Soon</span></button>
                    <button type="button" role="menuitem" class={`bodyTextMedium ${styles.destructive}`} onclick={() => { setConfirmingDelete(true); closeMenu(); }}>Delete Instance</button>
                </div>
                {/* Outside role="menu", which may only own menu items. */}
                <Show when={outcome()}>
                    {(o) => (
                        <div class={styles.notice}>
                            <Show
                                when={o().failure}
                                fallback={<p class={`${styles.note} bodyTextSmall`} role="status">{COPY[o().action].note}</p>}
                            >
                                {(failure) => <FormError title={COPY[o().action].failed} failure={failure()} />}
                            </Show>
                        </div>
                    )}
                </Show>
            </div>
        </details>
        </>
    )
}

export default InstanceOptions
