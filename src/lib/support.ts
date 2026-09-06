/**
 * The support desk's routing table.
 *
 * /contact is a composer, not a mailbox: choosing a topic decides which extra
 * fields appear, which desk the ticket is addressed to, and whether Discord
 * would in fact be the faster route. All of that lives here rather than in the
 * page so the markup stays declarative and the client script has one source of
 * truth to read from.
 *
 * Two deliberate absences:
 *   - No response-time promise is rendered unless `responseTargets.published`
 *     is turned on. An unmet SLA on a public page is worse than no SLA.
 *   - No submission endpoint is assumed. Until `PUBLIC_SUPPORT_ENDPOINT` is
 *     set the form composes the ticket and hands it to the user's mail client,
 *     which works today and cannot silently drop a message into a 404.
 */

export const SUPPORT_EMAIL = "help@aki-labs.com";
export const DISCORD_INVITE = "https://discord.gg/nhCEXaZVMX";

/**
 * POST target for a composed ticket. Empty string means "no endpoint yet" —
 * see `submitMode` below. Set `PUBLIC_SUPPORT_ENDPOINT` to switch the form
 * over; nothing else needs to change.
 */
export const SUPPORT_ENDPOINT: string = import.meta.env.PUBLIC_SUPPORT_ENDPOINT ?? "";

/** "post" once an endpoint exists, "email" until then. */
export const submitMode: "post" | "email" = SUPPORT_ENDPOINT ? "post" : "email";

/**
 * First-response targets, off until they're something we'd stand behind.
 * Flip `published` and the routing card starts showing `topic.response`.
 */
export const responseTargets = { published: false } as const;

export type FieldKind = "text" | "email" | "textarea" | "select" | "datetime-local";

export interface SupportField {
    /** Also the label in the composed ticket, so keep it human. */
    name: string;
    label: string;
    kind: FieldKind;
    placeholder?: string;
    /** Static choices for `kind: "select"`. */
    options?: string[];
    /** Choices the page fills at build time — see `optionsFrom` handling in contact.astro. */
    optionsFrom?: "games";
    hint?: string;
    /** Spans both columns of the details grid. */
    wide?: boolean;
}

/**
 * Stable per-field key. Field names are human sentences ("Instance name") so
 * they can be reused verbatim as labels in the composed ticket; this is the
 * slug used for ids and `data-field` hooks, and both the page and the client
 * script derive it the same way so they can never disagree.
 */
export const fieldKey = (field: SupportField): string =>
    field.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export interface SupportTopic {
    id: string;
    /** Shown in the <select>. */
    label: string;
    /** <optgroup> heading. */
    group: string;
    /** Subject-line prefix on the composed ticket. */
    tag: string;
    /** Who picks it up — a team, not a person, so it survives staff changes. */
    desk: string;
    /** One line explaining what happens next. */
    blurb: string;
    /** Only rendered when `responseTargets.published`. */
    response: string;
    /** Drives the routing card's accent; see `--route-accent` in contact.astro. */
    accent: "orange" | "purple" | "sky" | "green" | "red";
    /** True when the community will almost certainly answer faster than we will. */
    discordFirst?: boolean;
    /** Shown as a warning strip on the routing card. */
    caution?: string;
    fields: SupportField[];
}

export const topics: SupportTopic[] = [
    {
        id: "platform-issue",
        label: "My server or the platform is broken",
        group: "Something's wrong",
        tag: "Platform",
        desk: "Platform on-call",
        blurb: "Goes to whoever is watching the fleet. Naming the instance means we can pull its logs before we reply.",
        response: "Same day",
        accent: "red",
        fields: [
            {
                name: "Instance name",
                label: "Instance name",
                kind: "text",
                placeholder: "e.g. gentle-badger-42",
                hint: "The name on its dashboard card.",
            },
            { name: "Game", label: "Game", kind: "select", optionsFrom: "games" },
            {
                name: "Started",
                label: "When did it start?",
                kind: "datetime-local",
                hint: "Roughly is fine — it narrows the log window.",
            },
            {
                name: "Impact",
                label: "How bad is it?",
                kind: "select",
                options: [
                    "Nobody can play",
                    "Playable, but degraded",
                    "Cosmetic or minor",
                ],
            },
        ],
    },
    {
        id: "bug",
        label: "Something in the site is misbehaving",
        group: "Something's wrong",
        tag: "Bug",
        desk: "Engineering",
        blurb: "Filed straight onto the board. Reproduction steps are the difference between a fix this week and a fix eventually.",
        response: "Two working days",
        accent: "orange",
        fields: [
            {
                name: "Where",
                label: "Where did it happen?",
                kind: "select",
                options: [
                    "Dashboard",
                    "Managing an instance",
                    "Creating an instance",
                    "Signing in",
                    "Billing",
                    "This marketing site",
                    "Somewhere else",
                ],
            },
            {
                name: "Browser",
                label: "Browser and device",
                kind: "text",
                placeholder: "e.g. Firefox on Windows",
                hint: "Tick the diagnostics box below and we'll fill this in for you.",
            },
            {
                name: "Steps",
                label: "Steps to reproduce",
                kind: "textarea",
                placeholder: "1. Open the dashboard\n2. Click…\n3. Expected X, got Y",
                wide: true,
            },
        ],
    },
    {
        id: "account",
        label: "I can't get into my account",
        group: "Something's wrong",
        tag: "Account",
        desk: "Accounts",
        blurb: "Handled by a human, not a bot. We'll never ask you for your password.",
        response: "Same day",
        accent: "purple",
        caution: "Never send us a password, a one-time code or a session token — not here, not over email, not in Discord.",
        fields: [
            {
                name: "Sign-in method",
                label: "How do you normally sign in?",
                kind: "select",
                options: ["Email and password", "A social or single sign-on account", "Not sure"],
            },
            {
                name: "Account email",
                label: "Email on the account",
                kind: "email",
                placeholder: "you@example.com",
                hint: "Only if it differs from your reply address above.",
            },
        ],
    },
    {
        id: "billing",
        label: "Something's wrong with a charge",
        group: "Something's wrong",
        tag: "Billing",
        desk: "Billing",
        blurb: "We can look up any charge from the account email. A reference just gets us there faster.",
        response: "Two working days",
        accent: "orange",
        caution: "Card numbers stay between you and our payment provider — we don't need them and can't read them.",
        fields: [
            {
                name: "Account email",
                label: "Email on the account",
                kind: "email",
                placeholder: "you@example.com",
            },
            {
                name: "Reference",
                label: "Payment or invoice reference",
                kind: "text",
                placeholder: "Optional",
            },
            {
                name: "Charge",
                label: "Which charge or period?",
                kind: "text",
                placeholder: "e.g. the £4.20 on 12 August",
                wide: true,
            },
        ],
    },
    {
        id: "feature",
        label: "I want Instances to do something new",
        group: "Something's missing",
        tag: "Feature",
        desk: "Product",
        blurb: "Read every week when we plan. Tell us the problem and we'll usually find a better fix than the one you asked for.",
        response: "We read everything; we reply to most",
        accent: "sky",
        fields: [
            {
                name: "Area",
                label: "Which part of Instances?",
                kind: "select",
                options: [
                    "Dashboard",
                    "Managing an instance",
                    "Game settings and mods",
                    "Billing and plans",
                    "Sharing with friends",
                    "Something else",
                ],
            },
            {
                name: "Outcome",
                label: "What would you do with it?",
                kind: "textarea",
                placeholder: "What you're trying to get done, and what stops you today.",
                hint: "The problem matters more to us than the feature.",
                wide: true,
            },
        ],
    },
    {
        id: "game-request",
        label: "I want a game you don't host yet",
        group: "Something's missing",
        tag: "Game request",
        desk: "Product",
        blurb: "Every game needs its own tested compute profile, so requests are how we decide what to build next.",
        response: "We read everything; we reply to most",
        accent: "green",
        fields: [
            {
                name: "Game",
                label: "Which game?",
                kind: "text",
                placeholder: "e.g. Terraria",
            },
            {
                name: "Edition",
                label: "Edition, version or modpack",
                kind: "text",
                placeholder: "e.g. All the Mods 10, or a specific server build",
            },
            {
                name: "Group size",
                label: "How many of you would play?",
                kind: "select",
                options: ["A few friends (2–5)", "A small group (6–15)", "A community (16+)"],
            },
        ],
    },
    {
        id: "question",
        label: "I've got a question about how it works",
        group: "Everything else",
        tag: "Question",
        desk: "Community",
        blurb: "Someone in Discord has almost certainly hit this already, and they're awake more hours than we are.",
        response: "Usually minutes in Discord",
        accent: "purple",
        discordFirst: true,
        fields: [],
    },
    {
        id: "partnership",
        label: "Business, press or partnership",
        group: "Everything else",
        tag: "Partnership",
        desk: "Aki Laboratories",
        blurb: "Comes to the founders directly.",
        response: "Two working days",
        accent: "sky",
        fields: [
            { name: "Organisation", label: "Organisation", kind: "text" },
            {
                name: "Links",
                label: "Website or socials",
                kind: "text",
                placeholder: "https://",
                wide: true,
            },
        ],
    },
    {
        id: "security",
        label: "I've found a security problem",
        group: "Everything else",
        tag: "Security",
        desk: "Security",
        blurb: "Report it privately and give us a reasonable window to fix it before going public. We won't come after you for looking.",
        response: "Same day",
        accent: "red",
        caution: "Please don't post this in Discord or anywhere public until it's fixed.",
        fields: [
            {
                name: "Affected area",
                label: "Affected area, endpoint or page",
                kind: "text",
                placeholder: "e.g. the instance config API",
                wide: true,
            },
        ],
    },
    {
        id: "other",
        label: "None of the above",
        group: "Everything else",
        tag: "General",
        desk: "Whoever's closest",
        blurb: "We'll read it and pass it to the right person.",
        response: "Two working days",
        accent: "orange",
        fields: [],
    },
];

/** Topics bucketed into their `<optgroup>`s, in first-seen order. */
export const topicGroups = (): { group: string; topics: SupportTopic[] }[] => {
    const groups: { group: string; topics: SupportTopic[] }[] = [];
    for (const topic of topics) {
        const existing = groups.find((g) => g.group === topic.group);
        if (existing) existing.topics.push(topic);
        else groups.push({ group: topic.group, topics: [topic] });
    }
    return groups;
};

export const findTopic = (id: string): SupportTopic | undefined =>
    topics.find((topic) => topic.id === id);

/**
 * What the "attach diagnostics" box actually attaches. Kept to things that
 * help us reproduce a bug and nothing that identifies you beyond what the
 * request already carries — and it's all visible in the preview before you
 * send, which is the point of showing the preview at all.
 */
export const collectDiagnostics = (): [string, string][] => {
    if (typeof window === "undefined") return [];
    return [
        ["Page", window.location.href],
        ["Browser", navigator.userAgent],
        ["Viewport", `${window.innerWidth}x${window.innerHeight} @ ${window.devicePixelRatio}x`],
        ["Language", navigator.language],
        ["Time zone", Intl.DateTimeFormat().resolvedOptions().timeZone],
        ["Local time", new Date().toString()],
    ];
};

export interface Ticket {
    topic: SupportTopic;
    name: string;
    email: string;
    summary: string;
    /** Topic-specific answers, already filtered to the ones actually filled in. */
    details: [string, string][];
    message: string;
    diagnostics: [string, string][] | null;
}

const block = (heading: string, rows: [string, string][]): string => {
    if (!rows.length) return "";
    const width = Math.max(...rows.map(([label]) => label.length));
    const lines = rows.map(([label, value]) => {
        const [first, ...rest] = value.split("\n");
        const pad = " ".repeat(width + 2);
        return [`${(label + ":").padEnd(width + 2)}${first}`, ...rest.map((line) => pad + line)].join("\n");
    });
    return `${heading ? heading + "\n" : ""}${lines.join("\n")}\n`;
};

/** The exact text that gets sent — and the exact text shown in the preview. */
export const composeTicket = (ticket: Ticket): string => {
    const sections = [
        block("", [
            ["Topic", ticket.topic.label],
            ["Desk", ticket.topic.desk],
            ["From", ticket.name ? `${ticket.name} <${ticket.email}>` : ticket.email],
        ].filter(([, value]) => value) as [string, string][]),
        ticket.details.length ? block("— Details —", ticket.details) : "",
        ticket.message ? `— Message —\n${ticket.message}\n` : "",
        ticket.diagnostics?.length ? block("— Diagnostics —", ticket.diagnostics) : "",
    ];
    return sections.filter(Boolean).join("\n").trimEnd();
};

export const ticketSubject = (ticket: Ticket): string =>
    `[${ticket.topic.tag}] ${ticket.summary || "No summary given"}`;

/**
 * What the preview shows and the copy button copies. The subject travels in a
 * header field rather than the body, but the page promises the preview is the
 * whole message — so it's shown as a labelled line rather than quietly left
 * out.
 */
export const previewText = (ticket: Ticket): string =>
    `Subject: ${ticketSubject(ticket)}\n\n${composeTicket(ticket)}`;

/**
 * `mailto:` handoff used while `submitMode === "email"`. Long bodies get
 * truncated by some mail clients, so the copy button is always offered
 * alongside rather than as a fallback nobody notices.
 */
export const mailtoHref = (ticket: Ticket): string => {
    const params = new URLSearchParams({
        subject: ticketSubject(ticket),
        body: composeTicket(ticket),
    });
    return `mailto:${SUPPORT_EMAIL}?${params.toString().replace(/\+/g, "%20")}`;
};
