/**
 * Behaviour for /contact.
 *
 * The page is a composer: the topic you pick decides which extra fields are in
 * play, who the ticket is addressed to, and — while there's no submission
 * endpoint — what lands in your mail client. Everything the form will send is
 * rendered back to you as plain text before you send it, so "attach
 * diagnostics" is a promise you can check rather than one you have to take on
 * trust.
 *
 * Markup contract (see contact.astro):
 *   [data-contact-form]      the form itself
 *   #topic                   the topic <select>
 *   [data-topic-fields=ID]   one block of extra fields per topic, hidden unless current
 *   [data-route-*]           the routing card's slots
 *   [data-preview]           <pre> holding the composed ticket
 *   [data-nudge]             one-line prompt for the most useful empty field
 *   [data-status]            aria-live region for submission outcome
 */

import {
    collectDiagnostics,
    fieldKey,
    findTopic,
    mailtoHref,
    previewText,
    responseTargets,
    submitMode,
    SUPPORT_EMAIL,
    SUPPORT_ENDPOINT,
    ticketSubject,
    topics,
    type SupportTopic,
    type Ticket,
} from "./support";
import { syncStickyHeader } from "./stickyHeader";

const text = (root: ParentNode, selector: string): HTMLElement | null =>
    root.querySelector<HTMLElement>(selector);

/** Fields inside a hidden block must be disabled too, or they still submit. */
const setBlockActive = (block: HTMLElement, active: boolean): void => {
    block.hidden = !active;
    for (const control of block.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")) {
        control.disabled = !active;
    }
};

export const initContactForm = (): void => {
    const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
    const select = document.querySelector<HTMLSelectElement>("#topic");
    if (!form || !select) return;

    const blocks = new Map<string, HTMLElement>();
    for (const block of document.querySelectorAll<HTMLElement>("[data-topic-fields]")) {
        blocks.set(block.dataset.topicFields ?? "", block);
    }

    const preview = document.querySelector<HTMLPreElement>("[data-preview]");
    const nudge = text(document, "[data-nudge]");
    const status = text(document, "[data-status]");
    const route = text(document, "[data-route]");
    const diagnostics = document.querySelector<HTMLInputElement>("#diagnostics");
    const copyBtn = document.querySelector<HTMLButtonElement>("[data-copy]");
    const submitBtn = document.querySelector<HTMLButtonElement>("[data-submit]");

    if (import.meta.env.DEV) {
        const missing = topics.filter((topic) => !blocks.has(topic.id)).map((t) => t.id);
        const orphaned = [...blocks.keys()].filter((id) => !findTopic(id));
        if (missing.length || orphaned.length) {
            console.warn("[contact] topic catalogue and markup are out of step.", { missing, orphaned });
        }
    }

    const currentTopic = (): SupportTopic => findTopic(select.value) ?? topics[topics.length - 1];

    /** Every filled-in answer for the active topic, in the order it's asked. */
    const readDetails = (topic: SupportTopic): [string, string][] => {
        const block = blocks.get(topic.id);
        if (!block) return [];
        const rows: [string, string][] = [];
        for (const field of topic.fields) {
            const control = block.querySelector<HTMLInputElement>(`[data-field="${fieldKey(field)}"]`);
            const value = control?.value.trim();
            if (value) rows.push([field.name, value]);
        }
        return rows;
    };

    const readTicket = (): Ticket => {
        const topic = currentTopic();
        const value = (name: string) =>
            form.querySelector<HTMLInputElement>(`[name="${name}"]`)?.value.trim() ?? "";
        return {
            topic,
            name: value("name"),
            email: value("email"),
            summary: value("summary"),
            details: readDetails(topic),
            message: value("message"),
            diagnostics: diagnostics?.checked ? collectDiagnostics() : null,
        };
    };

    /** The single most useful thing still missing, phrased as an offer. */
    const renderNudge = (ticket: Ticket): void => {
        if (!nudge) return;
        const filled = new Set(ticket.details.map(([label]) => label));
        const firstEmpty = ticket.topic.fields.find((field) => !filled.has(field.name));

        if (!ticket.message) {
            nudge.textContent = "";
            nudge.hidden = true;
            return;
        }
        if (firstEmpty) {
            nudge.textContent = `Adding “${firstEmpty.label}” would save us asking.`;
            nudge.hidden = false;
            return;
        }
        nudge.textContent = "That's everything we'd have asked for. Thank you.";
        nudge.hidden = false;
    };

    const render = (): void => {
        const ticket = readTicket();
        if (preview) preview.textContent = previewText(ticket);
        renderNudge(ticket);
    };

    const applyTopic = (): void => {
        const topic = currentTopic();

        for (const [id, block] of blocks) setBlockActive(block, id === topic.id);

        if (route) {
            route.dataset.accent = topic.accent;
            const set = (selector: string, value: string | null) => {
                const slot = text(route, selector);
                if (!slot) return;
                slot.textContent = value ?? "";
                slot.hidden = !value;
            };
            set("[data-route-desk]", topic.desk);
            set("[data-route-blurb]", topic.blurb);
            set("[data-route-response]", responseTargets.published ? topic.response : null);

            const caution = text(route, "[data-route-caution]");
            if (caution) {
                caution.textContent = topic.caution ?? "";
                caution.hidden = !topic.caution;
            }
            const discord = text(route, "[data-route-discord]");
            if (discord) discord.hidden = !topic.discordFirst;
        }

        // Deep links: /contact?topic=billing preselects, and picking a topic
        // makes the current one shareable.
        const url = new URL(window.location.href);
        if (url.searchParams.get("topic") !== topic.id) {
            url.searchParams.set("topic", topic.id);
            window.history.replaceState(null, "", url);
        }

        render();
    };

    const say = (message: string, tone: "ok" | "warn" | "bad"): void => {
        if (!status) return;
        status.textContent = message;
        status.dataset.tone = tone;
        status.hidden = false;
    };

    const handOffToEmail = (ticket: Ticket, preamble = ""): void => {
        window.location.href = mailtoHref(ticket);
        say(
            `${preamble}Your email app should be opening with everything filled in, addressed to ${SUPPORT_EMAIL}. ` +
            "If nothing happened, copy the ticket and send it yourself — it's the same message either way.",
            preamble ? "warn" : "ok",
        );
    };

    const post = async (ticket: Ticket): Promise<void> => {
        const response = await fetch(SUPPORT_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                topic: ticket.topic.id,
                desk: ticket.topic.desk,
                subject: ticketSubject(ticket),
                name: ticket.name,
                email: ticket.email,
                summary: ticket.summary,
                details: Object.fromEntries(ticket.details),
                message: ticket.message,
                diagnostics: ticket.diagnostics ? Object.fromEntries(ticket.diagnostics) : null,
            }),
        });
        if (!response.ok) throw new Error(`Support endpoint returned ${response.status}`);
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        const ticket = readTicket();

        if (submitMode === "email") {
            handOffToEmail(ticket);
            return;
        }

        submitBtn?.setAttribute("aria-busy", "true");
        if (submitBtn) submitBtn.disabled = true;
        say("Sending…", "ok");

        try {
            await post(ticket);
            say(
                `Sent. We'll reply to ${ticket.email}. Your ticket reference is the subject line: ${ticketSubject(ticket)}`,
                "ok",
            );
            form.hidden = true;
        } catch (error) {
            console.error(error);
            // Falling back rather than failing: the ticket is already composed,
            // and email is the route that always works.
            handOffToEmail(ticket, "We couldn't reach the support desk just now. ");
        } finally {
            submitBtn?.removeAttribute("aria-busy");
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    copyBtn?.addEventListener("click", async () => {
        const composed = previewText(readTicket());
        try {
            await navigator.clipboard.writeText(composed);
            const original = copyBtn.dataset.label ?? copyBtn.textContent ?? "Copy";
            copyBtn.dataset.label = original;
            copyBtn.textContent = "Copied";
            copyBtn.dataset.copied = "true";
            window.setTimeout(() => {
                copyBtn.textContent = original;
                delete copyBtn.dataset.copied;
            }, 2000);
        } catch {
            // Clipboard is permission-gated and blocked outright in some
            // browsers; selecting the text is the honest fallback.
            const range = document.createRange();
            if (preview) {
                range.selectNodeContents(preview);
                const selection = window.getSelection();
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
            say("Your browser blocked the clipboard — the ticket is selected, so copy it as usual.", "warn");
        }
    });

    select.addEventListener("change", applyTopic);
    form.addEventListener("input", render);
    diagnostics?.addEventListener("change", render);

    const requested = new URL(window.location.href).searchParams.get("topic");
    if (requested && findTopic(requested)) select.value = requested;

    applyTopic();
    syncStickyHeader(document.querySelector<HTMLElement>(".page"));
};
