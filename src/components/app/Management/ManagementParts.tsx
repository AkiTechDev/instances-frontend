import { Index, Show, type Component } from "solid-js";

import styles from "./Management.module.css";
import effects from "../../../styles/components/effects.module.css";

import Tooltip from "../Tooltip/Tooltip";
import clipboardIcon from "../../../assets/icons/clipboard.svg";

/* Presentational pieces of the management page. Split out so Management.tsx
   holds the page's wiring and nothing else. */

/**
 * Suspense fallback for a settings form: renders the form's grid shape so the
 * layout holds steady while config()/state() resolve and the real fields swap
 * in without a pop-in.
 */
export const ConfigFormSkeleton: Component<{ rows: number }> = (props) => (
    <div class={styles.formSkeleton} aria-busy="true">
        <Index each={Array.from({ length: props.rows })}>
            {() => (
                <div class={styles.skeletonField}>
                    <div class={`${effects.skeleton} ${styles.skeletonLabel}`} />
                    <div class={`${effects.skeleton} ${styles.skeletonInput}`} />
                </div>
            )}
        </Index>
        <div class={`${effects.skeleton} ${styles.skeletonButton}`} />
    </div>
);

/** Suspense fallback for the quick-actions + connectivity block. */
export const PanelBodySkeleton: Component = () => (
    <>
        <div class={styles.quickActions} aria-busy="true">
            <div class={`${effects.skeleton} ${styles.skeletonPanelButton}`} />
            <div class={`${effects.skeleton} ${styles.skeletonPanelButton}`} />
        </div>
        <div class={styles.connectivity}>
            <Index each={Array.from({ length: 3 })}>
                {() => (
                    <div class={styles.connectivityInfo}>
                        <div class={`${effects.skeleton} ${styles.skeletonLabel}`} />
                        <div class={`${effects.skeleton} ${styles.skeletonValue}`} />
                    </div>
                )}
            </Index>
        </div>
    </>
);

/**
 * A single copyable connectivity value (domain / ip). Renders nothing when the
 * value is absent so we never print empty or placeholder rows.
 */
export const CopyRow: Component<{
    label: string;
    value?: string;
    onCopy: (v: string | null) => void;
}> = (props) => (
    <Show when={props.value}>
        <div class={styles.connectivityInfo}>
            <p class="statsTitle">{props.label}</p>
            <Tooltip tooltipContent="Copied!" tooltipContentStyle="bodyTextSmallest" enableTimeout={true} timeoutDuration={1000}>
                <button
                    type="button"
                    class={`statsText ${styles.copy}`}
                    style={`--icon: url(${clipboardIcon.src})`}
                    aria-label={`Copy ${props.label}`}
                    onClick={(e) => props.onCopy(e.currentTarget.textContent)}
                >{props.value}</button>
            </Tooltip>
        </div>
    </Show>
);

/**
 * Headline + sub-line used for every non-running runtime state. `busy` adds the
 * pulse used while the instance is transitioning.
 */
export const StatusBanner: Component<{
    title: string;
    subtitle?: string;
    busy?: boolean;
}> = (props) => (
    <div class={styles.statusBanner} role="status">
        <p class={`statsText ${props.busy ? effects.pulse : ""}`}>{props.title}</p>
        <Show when={props.subtitle}>
            <p class={`bodyTextSmall ${styles.statusSub}`}>{props.subtitle}</p>
        </Show>
    </div>
);
