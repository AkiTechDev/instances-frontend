import { type Component } from 'solid-js';

import styles from "./AdvancedSettingsToggle.module.css";
import iconChevron from "../../../assets/icons/chevron.svg";

/**
 * Reveals the advanced half of a settings form. A text-only link rather than a
 * button, so it never competes with the submit it sits beside.
 *
 * Pass `expanded` where the fields open in place, so the chevron flips and the
 * label reads "Hide"; leave it off where the button opens a dialog instead.
 */
const AdvancedSettingsToggle: Component<{
    onToggle: () => void,
    expanded?: boolean,
    label?: string
}> = (props) => {
    const label = () => props.label ?? (props.expanded ? "Hide Advanced Settings" : "Show Advanced Settings");

    return (
        <button
            type="button"
            class={`${styles.toggle} ${props.expanded ? styles.expanded : ""} buttonTextSmall`}
            style={`--icon: url("${iconChevron.src}")`}
            aria-expanded={props.expanded}
            onClick={() => props.onToggle()}
        >
            {label()}
        </button>
    )
}

export default AdvancedSettingsToggle;
