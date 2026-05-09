import { type Component } from 'solid-js';

import styles from "./FormSelect.module.css";

const FormNumberInput: Component<{ field: any, field_id: string, field_label: string, field_placeholder: number}> = (props) => {
    return (
        <div class={`${styles.instanceConfigSettingsContainer} ${styles.fieldXS}`}>
            <label class="bodyTextSmall">{props.field_label} </label>
            <input {...props.field.props} type="number" value={props.field.input} class={`${styles.select} bodyText`}></input>
            {props.field.errors && <div>{props.field.errors[0]}</div>}
        </div>
    )
}

export default FormNumberInput;

