
import { type Component, For } from 'solid-js';

import styles from "./FormSelect.module.css";
import typo from "../../../styles/typography.module.css";

const FormSelect: Component<{ field: any, field_id: string, field_label: string, field_placeholder: string | number | boolean, field_options: string[] }> = (props) => {
    props.field.value = props.field_placeholder

    return (
        <div class={styles.instanceConfigSettingsContainer}>
            <label class={typo.bodyTextSmall}>{props.field_label} </label>
            <select {...props.field.props} value={props.field.input} class={`${styles.select} ${typo.bodyText}`}>
            <For each={props.field_options}>
                { (option, i) =>
                    <option class={typo.bodyText} value={option} selected={option == props.field_placeholder}>{option}</option>
                }
            </For>
            </select>
            {props.field.errors && <div>{props.field.errors[0]}</div>}
        </div>
    )
}

export default FormSelect;