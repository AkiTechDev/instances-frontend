import { createUniqueId, onCleanup, type Component } from "solid-js";

import styles from "./InstanceOptions.module.css";
import { useNavigate } from "@solidjs/router";
import { deleteInstance, postDownloadGameData, type Instance } from "../../../lib/apis";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
    

    return (
        <details ref={elRef} name="Instance Settings" class={styles.container} onclick={(e) => e.stopImmediatePropagation()}>
            <summary id={`options${id}`}>
                <span class={styles.dot}></span>
                <span class={styles.dot}></span>
                <span class={styles.dot}></span>
            </summary>
            <div class={styles.options}>
                <button class="bodyTextMedium" onclick={async () => {await postDownloadGameData(props.endpoint); sleep(1); closeMenu() }}>Download Game Data</button>
                <button class="bodyTextMedium" disabled>Transfer Ownership</button>
                <button class="bodyTextMedium" disabled>Change Instance Location</button>
                <button class="bodyTextMedium" onclick={async () => {await deleteInstance(props.instance); navigate("/dashboard", { replace: true }) }}>Delete Instance</button>
            </div>
        </details>
    )
}

export default InstanceOptions