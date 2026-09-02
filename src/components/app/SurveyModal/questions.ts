/**
 * Beta feedback survey — the whole question set lives here.
 *
 * Add, remove or reword a question and the modal follows; nothing else needs
 * touching. Two rules keep responses comparable as the survey evolves:
 *
 *   1. `id` is what gets stored against each rating, so never reuse an old id
 *      for a different question.
 *   2. Bump SURVEY_ID whenever the set changes, so answers collected before and
 *      after a reword can be told apart on the receiving end.
 *
 * The question text is submitted alongside every rating as well, so a stored
 * response stays readable even once the wording here has moved on.
 */

export const SURVEY_ID = "beta-2026-09";

export interface SurveyQuestion {
    /** Stable key stored with the rating. Never reuse for a different question. */
    id: string,
    /** Shown as the legend of the question's rating group. */
    question: string,
    /** Optional clarifier, shown under the question. */
    hint?: string,
    /** What the ends of the scale mean here — shown under 0 and 5. */
    lowLabel: string,
    highLabel: string,
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
    {
        id: "create_ease",
        question: "How easy was it to create your first instance?",
        lowLabel: "Painful",
        highLabel: "Effortless",
    },
    {
        id: "config_clarity",
        question: "How clear were the configuration options?",
        hint: "Tier, region, player count, and the cost that comes with them.",
        lowLabel: "Confusing",
        highLabel: "Obvious",
    },
    {
        id: "provision_speed",
        question: "How happy were you with the time it took to become playable?",
        lowLabel: "Far too slow",
        highLabel: "Quick",
    },
    {
        id: "reliability",
        question: "How reliable has your server been while playing?",
        lowLabel: "Kept breaking",
        highLabel: "Rock solid",
    },
    {
        id: "management_ease",
        question: "How easy is it to manage a server after it's running?",
        hint: "Starting and stopping it, changing settings, finding the connection details.",
        lowLabel: "Hard work",
        highLabel: "Straightforward",
    },
    {
        id: "recommend",
        question: "How likely are you to recommend us to someone you play with?",
        lowLabel: "Not a chance",
        highLabel: "Already have",
    },
];

/** The 0–5 scale, low to high. */
export const RATING_SCALE = [0, 1, 2, 3, 4, 5] as const;

export const MAX_RATING = RATING_SCALE[RATING_SCALE.length - 1];

export const COMMENT_MAX_LENGTH = 1000;

export const COMMENT_PLACEHOLDER =
    "Anything the ratings missed? Bugs you hit, what annoyed you most, what you wish existed.";
