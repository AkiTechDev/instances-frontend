import { type Component } from 'solid-js';

import styles from "./FormSelect.module.css";
import typo from "../../../styles/typography.module.css";

const FormNumberInput: Component<{ field: any, field_id: string, field_label: string, field_placeholder: number}> = (props) => {
    props.field.value = props.field_placeholder

    return (
        <div class={styles.instanceConfigSettingsContainer}>
            <label>{props.field_label} </label>
            <input {...props.field.props} type="number" value={props.field.input}></input>
            {props.field.errors && <div>{props.field.errors[0]}</div>}
        </div>
    )
}

export default FormNumberInput;

