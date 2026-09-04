import { createSignal, createUniqueId, onCleanup, onMount, Show, type Component } from "solid-js";

import styles from "./InstanceOptions.module.css";
import { revalidate, useNavigate } from "@solidjs/router";
import {
    getInstanceConfig,
    getInstanceStatus,
    postDownloadGameData,
    postInstanceConfig,
    type Instance,
} from "../../../lib/apis";
import { sleep } from "../../../lib/utils";
import DeleteInstanceModal from "../DeleteInstanceModal/DeleteInstanceModal";

const InstanceOptions: Component<{ endpoint: string, instance: Instance, class?: string }> = (props) => {
    const navigate = useNavigate();
    const id = createUniqueId();
    const [confirmingDelete, setConfirmingDelete] = createSignal(false);
    let elRef: HTMLDetailsElement | undefined;

    const closeMenu = () => {
        if (elRef?.open) {
            elRef.open = false;
        }
    }

    const handleBodyClick = (e: MouseEvent) => {
        if (!elRef?.contains(e.target as Node)) {
            closeMenu();
        }
    };

    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeMenu();
    };

    // Registered in onMount rather than during render. One card renders one of
    // these, so attaching as a render side effect meant a document-level
    // listener per card, added before the menu was even in the DOM.
    onMount(() => {
        document.body.addEventListener("click", handleBodyClick);
        document.addEventListener("keydown", handleKeydown);
    });

    onCleanup(() => {
        document.body.removeEventListener("click", handleBodyClick);
        document.removeEventListener("keydown", handleKeydown);
    });

    // Re-send the current config to the per-server gateway, which re-triggers
    // the CDK deploy workflow. With no values changed CDK synth diffs cleanly
    // and applies any template improvements published since the stack was last
    // deployed; no-ops if nothing has changed.
    const updateInstance = async () => {
        if (!props.endpoint) return;
        try {
            const [config, runtime] = await Promise.all([
                getInstanceConfig(props.endpoint),
                getInstanceStatus(props.endpoint),
            ]);
            await postInstanceConfig(props.endpoint, {
                plan: config.plan,
                cpu: config.cpu,
                memory: config.memory,
                auto_start: runtime?.state === "running",
            });
            await revalidate("instanceState");
        } catch (err) {
            console.error("refresh failed", err);
        } finally {
            closeMenu();
        }
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
        <details ref={elRef} name="Instance Settings" class={`${styles.container} ${props.class ?? ""}`} onclick={(e) => e.stopImmediatePropagation()}>
            <summary id={`options${id}`} role="button" aria-label={`Options for ${props.instance.name}`}>
                <span class={styles.dot}></span>
                <span class={styles.dot}></span>
                <span class={styles.dot}></span>
            </summary>
            <div class={styles.options} role="menu">
                <button type="button" role="menuitem" class="bodyTextMedium" onclick={updateInstance} disabled={!props.endpoint}>Update Instance</button>
                <button type="button" role="menuitem" class="bodyTextMedium" disabled={!props.endpoint} onclick={async () => {await postDownloadGameData(props.endpoint); await sleep(1000); closeMenu() }}>Download Game Data</button>
                <button type="button" role="menuitem" class="bodyTextMedium" disabled title="Coming soon">Transfer Ownership</button>
                <button type="button" role="menuitem" class="bodyTextMedium" disabled title="Coming soon">Change Instance Location</button>
                <button type="button" role="menuitem" class={`bodyTextMedium ${styles.destructive}`} onclick={() => { setConfirmingDelete(true); closeMenu(); }}>Delete Instance</button>
            </div>
        </details>
        </>
    )
}

export default InstanceOptions