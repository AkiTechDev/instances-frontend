import { type Component } from "solid-js";

import styles from "./RouteError.module.css";
import button from "../../../styles/components/button.module.css";

/**
 * Fallback for a route (or the whole app shell) that threw while rendering.
 *
 * Deliberately free of router primitives — the same component backs the
 * boundary outside `<Router>` as well as the one inside it, so the way home is
 * a plain anchor. That costs a document load and works in both places, which is
 * the right trade for a screen that only appears when something already broke.
 */
const RouteError: Component<{
    onRetry: () => void;
    /** Set when the boundary sits outside the shell's sidebar column, where a
     *  single grid child would otherwise be squeezed into the 100px rail. */
    fullWidth?: boolean;
}> = (props) => (
    <div class={`${styles.container} ${props.fullWidth ? styles.fullWidth : ""}`} role="alert">
        <div class={styles.content}>
            <h6 class="h6">Something went wrong on this page</h6>
            <p class="statsTitle">
                Your servers are unaffected — this is the page failing to draw, not your
                instances. Try again, or head back to your games.
            </p>
        </div>
        <div class={styles.actions}>
            <button
                type="button"
                class={`${button.btn} ${button.vibrant}`}
                onClick={() => props.onRetry()}
            ><p class="buttonText">Try Again</p></button>
            <a class={`${button.btn} ${button.outlineDark} ${styles.link}`} href="/dashboard">
                <p class="buttonText">Back to My Games</p>
            </a>
        </div>
    </div>
);

export default RouteError;
