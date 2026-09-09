/**
 * The /pricing estimator.
 *
 * The page is server-rendered complete: the default selection's numbers are
 * already in the HTML, and the per-game table below is static. This script only
 * makes the controls live, which is why they ship `disabled` and are enabled
 * here — an inert-but-clickable select is worse than an obviously inactive one.
 *
 * All arithmetic comes from lib/pricingCalc.ts, the same module the page used to
 * render its initial figures, so the two can never disagree.
 *
 * Markup contract:
 *   [data-pc-data]     <script type="application/json"> holding games + profiles
 *   [data-pc-game]     game <select>
 *   [data-pc-size]     group-size <select>, repopulated per game
 *   [data-pc-region]   region <select>
 *   [data-pc-hours]    hours-per-week <input type="range">
 *   [data-pc-preset]   preset buttons carrying data-hours
 *   [data-pc-monthly] [data-pc-hourly] [data-pc-working] [data-pc-spec]
 *   [data-pc-play]     the chosen play rate, in words
 *   [data-pc-rows]     <tbody> for the at-a-glance table
 *   [data-pc-cta]      link through to the chosen game's page
 */

import {
    comparisonHours,
    formatHours,
    formatMoney,
    hourlyFor,
    HOURS_ALWAYS,
    memoryGbOf,
    monthlyFor,
    splitProfileId,
    vcpuOf,
    WEEKS_PER_MONTH,
    type CalcGame,
    type CalcProfile,
} from "./pricingCalc";

const q = <T extends HTMLElement>(sel: string): T | null => document.querySelector<T>(sel);

export const initPricingForm = (): void => {
    const dataEl = q<HTMLScriptElement>("[data-pc-data]");
    const gameSel = q<HTMLSelectElement>("[data-pc-game]");
    const sizeSel = q<HTMLSelectElement>("[data-pc-size]");
    const regionSel = q<HTMLSelectElement>("[data-pc-region]");
    const hoursInput = q<HTMLInputElement>("[data-pc-hours]");

    if (!dataEl || !gameSel || !sizeSel || !regionSel || !hoursInput) return;

    let games: CalcGame[];
    try {
        games = JSON.parse(dataEl.textContent ?? "[]");
    } catch {
        return; // Leave the server-rendered figures standing rather than blanking them.
    }
    if (!games.length) return;

    const monthlyOut = q("[data-pc-monthly]");
    const hourlyOut = q("[data-pc-hourly]");
    const workingOut = q("[data-pc-working]");
    const specOut = q("[data-pc-spec]");
    const playOut = q("[data-pc-play]");
    const rowsOut = q<HTMLTableSectionElement>("[data-pc-rows]");
    const ctaOut = q<HTMLAnchorElement>("[data-pc-cta]");
    const presets = [...document.querySelectorAll<HTMLButtonElement>("[data-pc-preset]")];

    const gameOf = (id: string): CalcGame =>
        games.find((game) => game.id === id) ?? games[0];

    const profileOf = (game: CalcGame, id: string): CalcProfile =>
        game.profiles.find((profile) => profile.id === id) ?? game.profiles[0];

    /* Sizes are per-game, so the picker is rebuilt whenever the game changes.
       The previous choice is matched by position rather than by id: someone who
       had picked the second-smallest tier means the same thing after switching
       games, and no id survives the switch. */
    const fillSizes = (game: CalcGame, preferIndex: number): void => {
        sizeSel.innerHTML = "";
        game.profiles.forEach((profile, i) => {
            const { label, players } = splitProfileId(profile.id);
            const option = document.createElement("option");
            option.value = profile.id;
            option.textContent = players ? `${players} — ${label}` : label;
            if (i === Math.min(preferIndex, game.profiles.length - 1)) option.selected = true;
            sizeSel.append(option);
        });
    };

    const render = (): void => {
        const game = gameOf(gameSel.value);
        const profile = profileOf(game, sizeSel.value);
        const region = regionSel.value;
        const hours = Number(hoursInput.value);
        const hourly = hourlyFor(profile, region);

        presets.forEach((preset) => {
            const on = Number(preset.dataset.hours) === hours;
            preset.setAttribute("aria-pressed", String(on));
        });

        if (playOut) playOut.textContent = formatHours(hours);

        if (specOut) {
            specOut.textContent =
                `${vcpuOf(profile)} vCPU · ${memoryGbOf(profile)} GB · ${regionSel.selectedOptions[0]?.textContent ?? region}`;
        }

        if (ctaOut && game.slug) {
            ctaOut.href = `/games/${game.slug}`;
            ctaOut.textContent = `See ${game.name} in detail`;
            ctaOut.hidden = false;
        } else if (ctaOut) {
            ctaOut.hidden = true;
        }

        /* No price table for the region means we don't know, and saying so is
           the only honest option — a zero here would read as "free". */
        if (hourly === null) {
            if (monthlyOut) monthlyOut.textContent = "—";
            if (hourlyOut) hourlyOut.textContent = "—";
            if (workingOut) workingOut.textContent = "We don't hold a price for that location yet.";
            if (rowsOut) rowsOut.innerHTML = "";
            return;
        }

        const monthly = monthlyFor(hourly, hours);
        if (monthlyOut) monthlyOut.textContent = formatMoney(monthly);
        if (hourlyOut) hourlyOut.textContent = formatMoney(hourly);

        if (workingOut) {
            workingOut.textContent = hours === 168
                ? `${formatMoney(hourly)} an hour, running continuously — about ${Math.round(HOURS_ALWAYS * WEEKS_PER_MONTH)} hours in an average month.`
                : `${formatMoney(hourly)} an hour × ${hours} hours a week × ${WEEKS_PER_MONTH.toFixed(2)} weeks in an average month.`;
        }

        if (rowsOut) {
            rowsOut.innerHTML = "";
            for (const h of comparisonHours) {
                const row = document.createElement("tr");
                if (h === hours) row.className = "isCurrent";

                const th = document.createElement("th");
                th.scope = "row";
                th.className = "bodyText";
                th.textContent = h === 168 ? "Left running all month" : `${h} hours a week`;

                const td = document.createElement("td");
                td.className = "bodyText money";
                td.textContent = formatMoney(monthlyFor(hourly, h));

                row.append(th, td);
                rowsOut.append(row);
            }
        }
    };

    gameSel.addEventListener("change", () => {
        fillSizes(gameOf(gameSel.value), sizeSel.selectedIndex < 0 ? 1 : sizeSel.selectedIndex);
        render();
    });

    sizeSel.addEventListener("change", render);
    regionSel.addEventListener("change", render);
    hoursInput.addEventListener("input", render);

    for (const preset of presets) {
        preset.addEventListener("click", () => {
            hoursInput.value = preset.dataset.hours ?? "8";
            render();
        });
    }

    /* Live controls only once they do something. */
    for (const control of [gameSel, sizeSel, regionSel, hoursInput, ...presets]) {
        control.removeAttribute("disabled");
    }

    fillSizes(gameOf(gameSel.value), sizeSel.selectedIndex < 0 ? 1 : sizeSel.selectedIndex);
    render();
};
