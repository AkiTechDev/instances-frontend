import { type Component } from 'solid-js';

import styles from "./FormSelect.module.css";
import { sizeClass, type FieldSize } from "./fieldSize";

const FormNumberInput: Component<{ field: any, field_id: string, field_label: string, field_placeholder: number, size?: FieldSize }> = (props) => {
    return (
        <div class={`${styles.instanceConfigSettingsContainer} ${props.size ? sizeClass(props.size) : styles.fieldXS}`}>
            <label class="bodyTextSmall">{props.field_label} </label>
            <input {...props.field.props} type="number" value={props.field.input} class={`${styles.select} bodyText`}></input>
            {props.field.errors && <div>{props.field.errors[0]}</div>}
        </div>
    )
}

export default FormNumberInput;

