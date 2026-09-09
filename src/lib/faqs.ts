/**
 * The site's general FAQ, in one place.
 *
 * Two pages render this: the landing page shows the handful marked `landing`
 * as an accordion, and /faq shows every entry, grouped. They read the same
 * objects, so an answer exists exactly once and the two can't drift apart.
 *
 * Per-game questions are not here — those live on each game's `page.faqs` in
 * lib/games/supported/, next to the sizes and settings they talk about.
 *
 * House rules for anything added here:
 *
 *   - Write for someone who has never rented a server. No jargon without a
 *     plain-English gloss in the same sentence; no "simply", no "just".
 *   - Every factual claim must be true of the product as it stands today, not
 *     as it's planned. Where the Terms mark something "to be confirmed"
 *     (currency, VAT, failed-payment windows), say nothing here rather than
 *     guessing — link to the Terms and let the one source say it once.
 *   - No response-time promise: lib/support.ts keeps those unpublished until
 *     they're targets we'd stand behind, and this file must not leak one.
 *   - No numbers that live somewhere else. Prices come from lib/pricing.ts via
 *     the game pages, and the list of games comes from the registry. Link to
 *     those rather than restating a figure that will quietly go stale.
 *   - Answers are plain text. They're also the source for the FAQPage
 *     structured data on /faq, and markup in there would be published as
 *     literal angle brackets. Anything link-shaped goes in `links`.
 */

import { SUPPORT_EMAIL } from "./support";

export interface FaqLink {
    label: string;
    href: string;
}

export interface FaqCategory {
    id: string;
    title: string;
    /** One line under the heading — sets expectations for the group. */
    blurb: string;
}

export interface Faq {
    /** Anchor target: /faq#<id>. Stable — people link to these. */
    id: string;
    category: string;
    q: string;
    /** One string per paragraph. Plain text only; see the note above. */
    a: string[];
    /** Rendered under the answer on /faq. Not part of the structured data. */
    links?: FaqLink[];
    /**
     * Shown on the landing page too. Reserve it for questions someone asks
     * *before* signing up — the ones standing between a visitor and a first
     * server. Everything else is for people who already have one.
     */
    landing?: boolean;
}

export const faqCategories: FaqCategory[] = [
    {
        id: "getting-started",
        title: "Getting started",
        blurb: "What this is, and what happens when you make your first server.",
    },
    {
        id: "games",
        title: "Games and modpacks",
        blurb: "What you can run, and what to do if we don't host it yet.",
    },
    {
        id: "paying",
        title: "Paying for it",
        blurb: "How pay-as-you-play works, and the one thing worth knowing about stopped servers.",
    },
    {
        id: "running",
        title: "Running your server",
        blurb: "Changing your mind after it's up — size, location, and getting your world back out.",
    },
    {
        id: "account",
        title: "Your account and your data",
        blurb: "Who can see what, and what happens if you leave.",
    },
    {
        id: "help",
        title: "Getting help",
        blurb: "Where to find us when something isn't right.",
    },
];

export const faqs: Faq[] = [
    /* ── Getting started ──────────────────────────────────────────────── */
    {
        id: "what-is-instances",
        category: "getting-started",
        q: "What is Instances, in plain English?",
        a: [
            "It's a game server you rent by the hour instead of by the month. You pick a game, give the server a name, and we set it up and run it for you on our own hardware.",
            "The point of it is that the server keeps running whether or not your computer is on. Your friends can play in your world while you're at work, and nobody has to leave a PC switched on at home.",
        ],
    },
    {
        id: "do-i-need-to-install",
        category: "getting-started",
        q: "Do I need to install anything, or know anything technical?",
        a: [
            "No. Everything happens in your web browser, and you never touch a settings file, a command line, or your home router.",
            "You choose a game and a size, and we handle the rest — installing it, keeping it running, and giving you an address to share. If you can join a friend's server, you can run one here.",
        ],
        landing: true,
    },
    {
        id: "how-long-to-start",
        category: "getting-started",
        q: "How long does it take before I can play?",
        a: [
            "A few minutes. Your dashboard shows the server building and tells you the moment it's ready — you don't have to sit and watch it, and nothing is lost if you close the tab.",
            "Modpacks take longer than a plain game, because there's a lot more to install before the first player can join.",
        ],
    },
    {
        id: "how-friends-join",
        category: "getting-started",
        q: "How do my friends join my server?",
        a: [
            "Your server gets its own address, shown on its page in your dashboard. Send that to your friends, and they paste it into the game's \"add server\" or \"join by address\" box. That's the whole process.",
            "They don't need an Instances account, and they don't pay anything. Only the person who created the server is charged for it.",
        ],
    },

    /* ── Games and modpacks ───────────────────────────────────────────── */
    {
        id: "which-games",
        category: "games",
        q: "Which games can I run?",
        a: [
            "Minecraft — both Java and Bedrock editions — several ready-made Minecraft modpacks, Valheim, and Project Zomboid, with more being added.",
            "The games page has the current list, and each game has its own page showing what it costs to run and what you can change about it.",
        ],
        links: [{ label: "See every game we host", href: "/games" }],
        landing: true,
    },
    {
        id: "modpacks",
        category: "games",
        q: "Can I play with mods?",
        a: [
            "Yes, if it's one of the modpacks we host. A modpack is a bundle of mods that have been tested together, and we install and configure the whole bundle for you — there's nothing to download or set up on your side beyond installing the same pack in your own game.",
            "We don't currently support uploading your own custom set of mods. If there's a pack you want that we don't have yet, tell us — it's the most useful thing you can send us.",
        ],
        links: [{ label: "Ask for a modpack", href: "/contact?topic=game-request" }],
    },
    {
        id: "switch-games",
        category: "games",
        q: "Can I play a different game later?",
        a: [
            "Yes. You create a second server for the other game, and each one keeps its own world, entirely separate from the other.",
            "Because you're only charged for a server while it's running, having two costs no more than having one, as long as you're only playing one at a time. Stop the one you've finished with and start the other.",
        ],
    },
    {
        id: "game-not-listed",
        category: "games",
        q: "What if the game I want isn't on the list?",
        a: [
            "Ask us for it. There's a form for exactly this, and it takes about a minute — the edition or version matters, and so does roughly how many of you would play, because that's what tells us which games are actually worth adding next.",
            "We can't promise any particular game, and we won't pretend otherwise. But every game we've added so far got there because somebody asked.",
        ],
        links: [{ label: "Request a game", href: "/contact?topic=game-request" }],
    },

    /* ── Paying for it ────────────────────────────────────────────────── */
    {
        id: "how-billing-works",
        category: "paying",
        q: "How does paying work?",
        a: [
            "You pay for the hours your server actually runs. There's no monthly subscription, no minimum, and no contract to get out of — a server that ran for three hours this month costs you three hours.",
            "We add up what you've used at the end of each calendar month and charge your saved card once, for that total. You can see what you've run up so far at any point in your account.",
        ],
        links: [{ label: "The formal version, in our Terms", href: "/terms#pricing-payment" }],
        landing: true,
    },
    {
        id: "stopped-server-charges",
        category: "paying",
        q: "If I stop my server, do I stop paying?",
        a: [
            "Almost entirely, and this is the one thing worth understanding properly. Stopping a server stops the expensive part — the computing power it uses while people are playing.",
            "What carries on is a much smaller charge for keeping your world saved and waiting for you. That's the trade: your world is still there next weekend, and you're paying a little to hold onto it rather than paying to run a server nobody is using.",
            "If you want a server to cost you nothing at all, delete it. Download your world first if you might want it back — deleting is final.",
        ],
        links: [{ label: "How charges stop, in our Terms", href: "/terms#pricing-payment" }],
        landing: true,
    },
    {
        id: "how-much",
        category: "paying",
        q: "How much is this going to cost me?",
        a: [
            "It depends on the game and the size you pick, so every game's page shows its own hourly prices rather than us quoting one number that's wrong for most people.",
            "The useful way to think about it: work out roughly how many hours a week you and your friends actually play, and multiply. For most groups playing a couple of evenings a week, that's a much smaller number than a monthly server plan, because you aren't paying for the nights nobody logs in.",
        ],
        links: [{ label: "Prices for each game", href: "/games" }],
    },
    {
        id: "cancel-anytime",
        category: "paying",
        q: "Am I tied in? Can I stop whenever I want?",
        a: [
            "You're not tied in. There's nothing to cancel, because there's no subscription — stop or delete your servers and the charges stop with them.",
            "You can close your account entirely from your account settings, or by emailing us. As a consumer buying online you also have a legal right to cancel within 14 days, and because you only ever pay for what you've used, that simply means you pay for the hours you ran and nothing else.",
        ],
        links: [{ label: "Your cancellation rights, in our Terms", href: "/terms#cooling-off" }],
    },

    /* ── Running your server ──────────────────────────────────────────── */
    {
        id: "change-size",
        category: "running",
        q: "Can I make my server bigger or smaller after I've made it?",
        a: [
            "Yes, and your world is not affected. Server size is just how much power it's given to run with — bigger costs more per hour and copes with more players or heavier modpacks.",
            "So you don't have to get it right first time. Start with the size we suggest for your game, and if it feels sluggish with everyone online, move it up. If you've gone quiet, move it down and pay less.",
        ],
        landing: true,
    },
    {
        id: "always-on",
        category: "running",
        q: "Does my server stay up when my computer is off?",
        a: [
            "Yes. Once it's running it stays running on our hardware until you stop it, so your friends can play at three in the morning whether or not you're awake.",
            "You decide when it runs. Most people start it when they sit down to play and stop it when they're done, which is what keeps the cost down.",
        ],
    },
    {
        id: "where-servers-run",
        category: "running",
        q: "Where is my server, and does it matter?",
        a: [
            "You choose a location when you create it, from a list covering Europe, North and South America, and Asia-Pacific.",
            "It matters for one reason: the further the server is from the people playing, the more lag they get. Pick the location closest to most of your group — not necessarily closest to you.",
        ],
    },
    {
        id: "backups",
        category: "running",
        q: "Do you back up my world?",
        a: [
            "No, and we'd rather say so plainly than let you find out the hard way. There's no backup or restore service here — if a world is lost, we can't produce yesterday's copy of it.",
            "Some games save their own snapshots onto the server as they go, but that's the game doing it, not us, and it disappears along with the server if you delete it.",
            "So if a world matters to you, download a copy of it now and again. It takes a moment, and it's the only thing that actually protects you.",
        ],
        links: [{ label: "What our Terms say about backups", href: "/terms#backups" }],
    },
    {
        id: "download-world",
        category: "running",
        q: "Can I get my world off your servers?",
        a: [
            "Yes. There's a Download Game Data option on each server, which gives you your world files to keep. It's yours; we're just holding it.",
            "It's worth doing before you delete a server, and worth doing occasionally anyway if the world matters to you.",
        ],
    },

    /* ── Your account and your data ───────────────────────────────────── */
    {
        id: "is-my-data-safe",
        category: "account",
        q: "Who can see my world and my account details?",
        a: [
            "Our staff can access your data only where it's needed to run the service or to fix something you've asked us to fix. Payments are handled by Stripe, so your full card number never reaches us at all.",
            "Our privacy policy sets out exactly what we hold, why, and how long for.",
        ],
        links: [{ label: "Read the privacy policy", href: "/privacy-policy" }],
    },
    {
        id: "delete-account",
        category: "account",
        q: "What happens if I close my account?",
        a: [
            "Your servers are stopped, charges stop, and we bill you once for the hours you'd already used. Your data is then scheduled for deletion.",
            "Download anything you want to keep before you close the account — worlds especially. Once deletion has run, we can't get it back for you.",
        ],
        links: [{ label: "Closing your account, in our Terms", href: "/terms#closing-account" }],
    },
    {
        id: "never-send-us",
        category: "account",
        q: "Will you ever ask me for my password?",
        a: [
            "No. Not by email, not in Discord, not on a support ticket, not ever. Neither will we ask for a one-time login code or your full card number.",
            "If anyone claiming to be from Instances asks you for any of those, they aren't from Instances. Tell us and we'll look into it.",
        ],
        links: [{ label: "Report it", href: "/contact?topic=security" }],
    },

    /* ── Getting help ─────────────────────────────────────────────────── */
    {
        id: "get-help",
        category: "help",
        q: "Something's wrong. How do I get help from a person?",
        a: [
            `Three ways, and all of them reach us. Our Discord is usually the quickest for \"how do I\" questions, because other players answer too. There's a contact form that asks the right follow-up questions for whatever's gone wrong, so we're not stuck emailing you back for basics. And you can always just email ${SUPPORT_EMAIL}.`,
            "Whichever you use, tell us the name of the server and roughly when the trouble started — that's normally enough for us to go and look at it before we reply.",
        ],
        links: [{ label: "Contact us", href: "/contact" }],
        landing: true,
    },
    {
        id: "report-bug",
        category: "help",
        q: "I've found something broken on the website itself.",
        a: [
            "Please tell us, even if it seems small and even if you're not sure it's a bug. What page you were on and what you'd clicked is enough to start with.",
            "If it's a security problem rather than a glitch, use the security option on the contact form and please don't post it publicly until it's fixed.",
        ],
        links: [{ label: "Report a bug", href: "/contact?topic=bug" }],
    },
];

/** The pre-signup subset, in the order they're declared above. */
export const landingFaqs: Faq[] = faqs.filter((faq) => faq.landing);

/** Categories that actually have questions, each with its own, in file order. */
export const faqsByCategory = (): { category: FaqCategory; items: Faq[] }[] =>
    faqCategories
        .map((category) => ({
            category,
            items: faqs.filter((faq) => faq.category === category.id),
        }))
        .filter(({ items }) => items.length > 0);

/**
 * Structured data for /faq. Only what a reader can actually see on the page,
 * and links are dropped: `text` is a plain-text field, and the anchors are
 * navigation rather than part of the answer.
 */
export const faqPageLd = () => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a.join("\n\n") },
    })),
});
