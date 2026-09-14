/**
 * HTML HUD overlay controller.
 * Markup lives in index.html; this module wires copy and optional stubs.
 *
 * Objective sits under the rank card (top-left) — slim, low opacity.
 * Load meter: visual only. Sound cue — future only.
 * Swing warning: when loaded + high sway, meter shows warning band/text.
 */

import {
  LOAD_HEAVY_REF_KG,
  loadMeterBand,
  type LoadMeterBand,
} from "../crane/cranePhysics";

export interface HudOptions {
  title?: string;
  role?: string;
  objective?: string;
  showPayTease?: boolean;
}

const DEFAULTS: Required<HudOptions> = {
  title: "Training Yard",
  role: "Apprentice",
  objective: "Look around the yard. Get a feel for the crane.",
  showPayTease: true,
};

export function initHud(options: HudOptions = {}): void {
  const opts = { ...DEFAULTS, ...options };

  const titleEl = document.querySelector("#hud-title h1");
  const roleEl = document.querySelector("#hud-title .role");
  const objectiveEl = document.querySelector("#hud-objective .text");
  const payEl = document.getElementById("hud-pay");

  if (titleEl) titleEl.textContent = opts.title;
  if (roleEl) roleEl.textContent = opts.role;
  if (objectiveEl) objectiveEl.textContent = opts.objective;

  if (payEl) {
    payEl.style.display = opts.showPayTease ? "" : "none";
  }

  setLoadMeter(0, false);
}

export function setTitle(text: string): void {
  const el = document.querySelector("#hud-title h1");
  if (el) el.textContent = text;
}

export function setRole(text: string): void {
  const el = document.querySelector("#hud-title .role");
  if (el) el.textContent = text;
}

export function setObjective(text: string): void {
  const el = document.querySelector("#hud-objective .text");
  if (el) el.textContent = text;
}

export function setPayTease(dayRate: number, stub?: string): void {
  const payEl = document.getElementById("hud-pay");
  if (!payEl) return;
  const stubHtml = stub
    ? `<div class="stub">${stub}</div>`
    : `<div class="stub">Pay unlocks later — stub</div>`;
  payEl.innerHTML = `Day rate: $${dayRate}${stubHtml}`;
  payEl.style.display = "";
}

/**
 * Update load meter. When swingHigh is true (loaded + sway over threshold),
 * show warning color/text; cleared when settled or empty.
 */
export function setLoadMeter(loadMassKg: number, swingHigh = false): void {
  const root = document.getElementById("hud-load");
  if (!root) return;

  const band: LoadMeterBand = loadMeterBand(loadMassKg);
  const fill = root.querySelector<HTMLElement>(".load-fill");
  const label = root.querySelector<HTMLElement>(".load-label");
  const value = root.querySelector<HTMLElement>(".load-value");

  const pct =
    loadMassKg <= 0
      ? 0
      : Math.min(100, Math.round((loadMassKg / LOAD_HEAVY_REF_KG) * 100));

  const warn = swingHigh && loadMassKg > 0;
  root.dataset.band = warn ? "swing" : band;
  if (fill) fill.style.width = `${pct}%`;
  if (label) {
    if (warn) {
      label.textContent = "Swing high";
    } else {
      label.textContent =
        band === "empty" ? "Empty" : band === "light" ? "Light" : "Heavy";
    }
  }
  if (value) {
    value.textContent =
      loadMassKg <= 0 ? "0 kg" : `${Math.round(loadMassKg)} kg`;
  }
}
