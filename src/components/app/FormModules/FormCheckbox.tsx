import { type Component } from 'solid-js';

const FormCheckbox: Component<{ field: any, field_id: string, field_label: string, field_placeholder: boolean }> = (props) => {
    props.field.value = props.field_placeholder

    return (
        <div class="game-config-checkbox">
            <label>{props.field_label} </label>
            <input {...props.field.props} type="checkbox" checked={props.field.value}></input>
            {props.field.errors && <div>{props.field.errors[0]}</div>}
        </div>
    )
}

export default FormCheckbox;