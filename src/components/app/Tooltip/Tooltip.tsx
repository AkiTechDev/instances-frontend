import { children, createSignal, onCleanup, onMount, Show, type JSXElement } from "solid-js";
import styles from "./Tooltip.module.css";

/**
 * Click-triggered tooltip. Used for transient confirmations ("Copied!") beside
 * the thing that was acted on.
 */
const Tooltip = (props: {
    tooltipContent: string,
    tooltipContentStyle: CSSModuleClasses[string],
    enableTimeout: boolean,
    timeoutDuration: number,
    children: JSXElement,
}) => {
    const [isActive, setIsActive] = createSignal(false);
    const [animClass, setAnimClass] = createSignal("");
    let tooltipRef: HTMLSpanElement | undefined;
    let triggerRef: HTMLSpanElement | undefined;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const child = children(() => props.children);

    const clearExistingTimeout = () => {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
    }

    const closeTooltip = () => {
        setAnimClass(styles.tooltipOut);

        tooltipRef?.addEventListener("animationend", () => {
            setAnimClass("");
            setIsActive(false);
        }, { once: true });
    }

    const handleTriggerClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isActive()) {
            setIsActive(true);
            setAnimClass(styles.tooltipIn);

            tooltipRef?.addEventListener("animationend", () => {
                setAnimClass("")
            }, { once: true });

            if (props.enableTimeout) {
                clearExistingTimeout();
                timeoutId = setTimeout(() => {
                    closeTooltip();
                }, props.timeoutDuration ?? 3000);
            }
        } else {
            closeTooltip();
        }
    }

    const handleBodyClick = (e: MouseEvent) => {
        if (!triggerRef?.contains(e.target as Node)) {
            if (isActive()) {
                closeTooltip();
            }
        }
    };

    // Registered in onMount, not during render: attaching a document-level
    // listener as a render side effect means every render pass adds one, and
    // it runs before the component is actually in the DOM.
    onMount(() => {
        document.body.addEventListener("click", handleBodyClick);
    });

    onCleanup(() => {
        clearExistingTimeout();
        document.body.removeEventListener("click", handleBodyClick);
    });

    return (
        <span
            ref={triggerRef}
            class={styles.tooltipWrapper}
            onclick={handleTriggerClick}
        >
            {child()}
            <Show when={isActive()}>
                <span
                ref={tooltipRef}
                role="status"
                class={`${styles.tooltip} ${props.tooltipContentStyle} ${animClass()}`}>
                    {props.tooltipContent}
                </span>
            </Show>
        </span>
    )
}

export default Tooltip;
