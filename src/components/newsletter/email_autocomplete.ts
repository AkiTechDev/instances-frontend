"use strict";

interface EmailAutocompleteOptions {
    suggClass?: string;
    domains?: string[];
}

/*
interface EmailAutocompleteWindow extends Window {
    emailautocomplete?: (
        selector: string,
        options?: EmailAutocompleteOptions
    ) => EmailAutocompleteVanilla[];
}


interface EmailAutocompleteWindow extends Window {
    emailautocomplete?: (
        selector: string,
    ) => EmailAutocompleteVanilla[];
}
*/

export function emailautocomplete(
    selector: string,
    //options?: EmailAutocompleteOptions
): EmailAutocompleteVanilla[] {

    const elems = Array.from(
        document.querySelectorAll<HTMLInputElement>(selector)
    );

    const instances: EmailAutocompleteVanilla[] = [];

    elems.forEach((elem) => {
        if (!elem.dataset.eac) {
            instances.push(
                new EmailAutocompleteVanilla(elem)
            );

            elem.dataset.eac = "true";
        }
    });

    return instances;
}


class EmailAutocompleteVanilla {
    private _f: HTMLInputElement;
    private _o: Required<EmailAutocompleteOptions>;
    private _d: string[];
    private _flo: number | null = null;
    private _cv!: HTMLSpanElement;
    private _so!: HTMLSpanElement;
    private _s = "";
    private _v = "";

    constructor(obj: HTMLInputElement ) { //options: EmailAutocompleteOptions = {}
        if (!obj) {
            throw new Error("eac,const:C00");
        }

        const defaults: Required<EmailAutocompleteOptions> = {
            suggClass: "emailAutocomplete",
            domains: [
                "gmail.com",
                "icloud.com",
                "outlook.com",
                "yahoo.com",
                "hotmail.com",
                "aol.com",
                "live.com",
                "msn.com",
                "protonmail.com",
                "me.com",
                "mac.com",
                "googlemail.com",
                "facebook.com",
                "gmx.com",
                "zoho.com",
            ],
        };

        this._f = obj;
        this._o = { ...defaults };
        this._d = this._o.domains;

        this.init();
    }

    private init(): void {
        try {
            const fieldObj = this._f;

            const fieldStyle = getComputedStyle(fieldObj);

            if (!fieldObj.parentNode) {
                console.error("eac,init:Object null");
                return;
            }

            // Wrapper
            const wrap = document.createElement("div");

            wrap.className = "eac-input-wrap";

            wrap.style.display = fieldStyle.display;
            wrap.style.position =
                fieldStyle.position === "static"
                    ? "relative"
                    : fieldStyle.position;

            wrap.style.fontSize = fieldStyle.fontSize;
            wrap.style.width = fieldStyle.width;

            fieldObj.parentNode.insertBefore(wrap, fieldObj);

            wrap.appendChild(fieldObj);

            // Current value measurement span
            this._cv = document.createElement("span");

            this._cv.className = "eac-cval";

            Object.assign(this._cv.style, {
                visibility: "hidden",
                position: "absolute",
                display: "inline-block",
                fontFamily: fieldStyle.fontFamily,
                fontWeight: fieldStyle.fontWeight,
                letterSpacing: fieldStyle.letterSpacing,
                whiteSpace: "pre",
            });

            fieldObj.parentNode.insertBefore(
                this._cv,
                fieldObj.nextSibling
            );

            // Suggestion overlay
            this._so = document.createElement("span");

            this._so.className = this._o.suggClass;

            const marginTop =
                parseFloat(fieldStyle.marginTop) +
                parseFloat(fieldStyle.paddingTop) +
                ((fieldObj.offsetHeight - fieldObj.clientHeight) / 2);

            Object.assign(this._so.style, {
                display: "block",
                boxSizing: "content-box",
                lineHeight: fieldStyle.lineHeight,
                marginTop: `${marginTop}px`,
                marginLeft: fieldStyle.marginLeft,
                marginBottom: `${marginTop}px`,
                fontFamily: fieldStyle.fontFamily,
                fontWeight: fieldStyle.fontWeight,
                letterSpacing: fieldStyle.letterSpacing,
                position: "absolute",
                top: "0",
                left: "0",
                pointerEvents: "auto",
            });

            fieldObj.parentNode.insertBefore(
                this._so,
                fieldObj.nextSibling
            );

            // Events
            fieldObj.addEventListener(
                "keyup",
                this.displaySuggestion
            );

            fieldObj.addEventListener(
                "blur",
                this.autocomplete
            );

            fieldObj.addEventListener("keydown", (e: KeyboardEvent) => {
                if (
                    e.key === "Enter" ||
                    e.key === "ArrowRight" ||
                    e.key === "Tab"
                ) {
                    this.autocomplete();
                }
            });

            this._so.addEventListener(
                "mousedown",
                this.autocomplete
            );

            this._so.addEventListener(
                "touchstart",
                this.autocomplete
            );
        } catch (e) {
            console.error("eac,init:", e);
        }
    }

    private suggest(str: string): string {
        if (!str || !Array.isArray(this._d)) {
            return "";
        }

        const strArr = str.split("@");

        if (strArr.length <= 1) {
            return "";
        }

        const partial = strArr.pop() ?? "";

        if (!partial.length) {
            return "";
        }

        const match =
            this._d.find((domain) =>
                domain.startsWith(partial)
            ) ?? "";

        return match
            ? match.replace(partial, "")
            : "";
    }

    private autocomplete = (): boolean => {
        if (!this._s || !this._v) {
            return false;
        }

        this._f.value = this._v + this._s;

        this._so.textContent = "";
        this._cv.textContent = "";

        return true;
    };

    private displaySuggestion = (
        e: KeyboardEvent
    ): void => {
        this._v = this._f.value;

        this._s = this.suggest(this._v);

        this._so.textContent = this._s || "";

        if (this._s) {
            e.preventDefault();
        }

        this._cv.textContent = this._v;

        if (this._flo === null) {
            const style = getComputedStyle(this._f);

            this._flo =
                parseFloat(style.paddingLeft) +
                parseFloat(style.borderLeftWidth);
        }

        const left =
            this._flo +
            this._cv.getBoundingClientRect().width;

        this._so.style.left = `${left}px`;
    };
}

/*

((windowObj: EmailAutocompleteWindow, documentObj: Document) => {
    windowObj.emailautocomplete = (
        selector: string,
        options?: EmailAutocompleteOptions
    ): EmailAutocompleteVanilla[] => {
        const elems = Array.from(
            documentObj.querySelectorAll<HTMLInputElement>(
                selector
            )
        );

        const instances: EmailAutocompleteVanilla[] = [];

        elems.forEach((elem) => {
            if (!elem.dataset.eac) {
                instances.push(
                    new EmailAutocompleteVanilla(
                        elem
                    )
                );

                elem.dataset.eac = "true";
            }
        });

        return instances;
    };
})(window as EmailAutocompleteWindow, document);

*/