import type { Component } from "solid-js";
import styles from "./Extra.module.css";

const Extra: Component<{}> = () => {

    return (
        <div class={styles.container}>
            <h3 class="h3">Under Constructions</h3>
            <p class="statsTitle">We need ideas, what should we put here?</p>
        </div>
    )
}

export default Extra