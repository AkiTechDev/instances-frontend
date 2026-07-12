import styles from "./FormSelect.module.css";

/** Width of a form field as a span of the 12-column form grid. */
export type FieldSize = "sm" | "md" | "lg" | "full";

const map: Record<FieldSize, string> = {
    sm: styles.sizeSM,     // span 3 — number, toggle
    md: styles.sizeMD,     // span 4 — select, short text
    lg: styles.sizeLG,     // span 6 — long text
    full: styles.sizeFull, // span 12 — textarea / full width
};

export const sizeClass = (size: FieldSize): string => map[size];
