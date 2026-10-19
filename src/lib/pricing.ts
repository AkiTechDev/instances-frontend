import { hourly } from "./rates.generated";

/**
 * A server's price per hour, in US dollars, for its region, memory (MiB), CPU
 * (Fargate CPU units) and plan: the rate card's own price, so what the site
 * shows is what an invoice charges.
 *
 * The prices are generated, never typed here: control-plane-cdk's
 * pricing/pricing.yaml decides them (Fargate's on-demand list price for the
 * size, times the plan's multiplier, plus its fixed hourly rate), and
 * `python catalog.py --site` there rewrites rates.generated.ts from it.
 *
 * Any plan but "Premium" is priced as Default, as a form with no plan chosen
 * yet always has been.
 *
 * Returns null when there is no price for the region or size (a region added
 * since the table was generated, or a size Fargate doesn't offer): the caller
 * decides how to render "we don't know" rather than this throwing part-way
 * through a render.
 */
export const fgCalc = (region: string, memory: number, cpu: number, tier: string): string | null =>
    hourly[region]?.[tier === "Premium" ? "Premium" : "Default"]?.[`${cpu}x${memory}`] ?? null;
