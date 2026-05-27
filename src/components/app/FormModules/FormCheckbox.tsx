import { type Component } from 'solid-js';

import toggleSwitch from "../../../styles/components/toggleSwitch.module.css";
import styles from "./FormSelect.module.css";

const FormCheckbox: Component<{ field: any, field_id: string, field_label: string, field_placeholder: boolean }> = (props) => {
    return (
        <div class={`${toggleSwitch.container} ${styles.fieldSM}`}>
            <input {...props.field.props} id={props.field_id} type="checkbox" checked={props.field.value} />
            <label for={props.field_id}>
                <p class="smallestLabel">ON</p>
                <p class="smallestLabel">OFF</p>
            </label>
            {props.field.errors && <div>{props.field.errors[0]}</div>}
        </div>
    )
}

export default FormCheckbox;