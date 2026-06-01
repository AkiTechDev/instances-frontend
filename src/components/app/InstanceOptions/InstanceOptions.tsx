import { createUniqueId, onCleanup, type Component } from "solid-js";

import styles from "./InstanceOptions.module.css";
import { revalidate, useNavigate } from "@solidjs/router";
import {
    deleteInstance,
    getInstanceConfig,
    getInstanceStatus,
    postDownloadGameData,
    postInstanceConfig,
    type Instance,
} from "../../../lib/apis";
import { sleep } from "../../../lib/utils";

const InstanceOptions: Component<{ endpoint: string, instance: Instance }> = (props) => {
    const navigate = useNavigate();
    const id = createUniqueId();
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

    document.body.addEventListener("click", handleBodyClick);

    onCleanup(() => {
        document.body.removeEventListener("click", handleBodyClick);
    });

    // Re-send the current config to the per-server gateway, which re-triggers
    // the CDK deploy workflow. With no values changed CDK synth diffs cleanly
    // and applies any template improvements published since the stack was last
    // deployed; no-ops if nothing has changed.
    const refresh = async () => {
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
                auto_start: !!(runtime && "ipv6" in runtime),
            });
            await revalidate("instanceState");
        } catch (err) {
            console.error("refresh failed", err);
        } finally {
            closeMenu();
        }
    };


    return (
        <details ref={elRef} name="Instance Settings" class={styles.container} onclick={(e) => e.stopImmediatePropagation()}>
            <summary id={`options${id}`}>
                <span class={styles.dot}></span>
                <span class={styles.dot}></span>
                <span class={styles.dot}></span>
            </summary>
            <div class={styles.options}>
                <button class="bodyTextMedium" onclick={refresh} disabled={!props.endpoint}>Refresh Instance</button>
                <button class="bodyTextMedium" onclick={async () => {await postDownloadGameData(props.endpoint); await sleep(1000); closeMenu() }}>Download Game Data</button>
                <button class="bodyTextMedium" disabled>Transfer Ownership</button>
                <button class="bodyTextMedium" disabled>Change Instance Location</button>
                <button class="bodyTextMedium" onclick={async () => {await deleteInstance(props.instance); navigate("/dashboard", { replace: true }) }}>Delete Instance</button>
            </div>
        </details>
    )
}

export default InstanceOptions