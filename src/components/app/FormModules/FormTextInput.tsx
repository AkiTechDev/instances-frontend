import { type Component } from 'solid-js';

import styles from "./FormSelect.module.css";

const FormTextInput: Component<{ field: any, field_id: string, field_label: string, field_placeholder: string, field_maxlength: number }> = (props) => {
    
    return (
        <div class={`${styles.instanceConfigSettingsContainer} ${props.field_maxlength > 32 ? styles.fieldMD : styles.fieldSM}`}>
            <label class="bodyTextSmall">{props.field_label} </label>
            <input {...props.field.props} value={props.field.input} class={`${styles.select} bodyText`} placeholder={props.field_placeholder}></input>
            {props.field.errors && <div>{props.field.errors[0]}</div>}
        </div>
    )
}

export default FormTextInput;