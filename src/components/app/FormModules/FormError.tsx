import { Show, type Component } from 'solid-js';

import styles from "./FormError.module.css";
import type { Failure } from "../../../lib/apis";

/**
 * A request behind a settings form failed. The title says what didn't happen;
 * under it, the API's own reason when it gave one, and its specific detail.
 *
 * Mounted only while there is a failure to show, so each new one is announced
 * — `role="alert"` reads out content that appears, not content that stays put.
 */
const FormError: Component<{ title: string, failure: Failure }> = (props) => (
    <div class={styles.error} role="alert">
        <p class="bodyTextSmallSemi">{props.title}</p>
        <p class="bodyTextSmall">{props.failure.message}</p>
        <Show when={props.failure.detail}>
            <p class="bodyTextSmall">{props.failure.detail}</p>
        </Show>
    </div>
)

export default FormError;
