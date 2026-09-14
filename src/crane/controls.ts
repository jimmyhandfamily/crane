/**
 * Keyboard + on-screen hold buttons for M1 crane controls.
 * Does not bind left-drag (camera keeps orbit).
 */

import type { CraneInput } from "./craneController";

type Axis = "slew" | "trolley" | "hoist";

interface HeldAxes {
  slew: number;
  trolley: number;
  hoist: number;
}

const keysDown = new Set<string>();

/** Buttons / keys contribute to these; merged each frame. */
const held: HeldAxes = { slew: 0, trolley: 0, hoist: 0 };
const buttonHeld: HeldAxes = { slew: 0, trolley: 0, hoist: 0 };

function codeToAxis(code: string): { axis: Axis; dir: number } | null {
  switch (code) {
    case "KeyA":
      return { axis: "slew", dir: -1 };
    case "KeyD":
      return { axis: "slew", dir: 1 };
    case "KeyW":
      return { axis: "trolley", dir: 1 };
    case "KeyS":
      return { axis: "trolley", dir: -1 };
    case "KeyR":
      return { axis: "hoist", dir: 1 };
    case "KeyF":
      return { axis: "hoist", dir: -1 };
    default:
      return null;
  }
}

function refreshKeyboardAxes(): void {
  held.slew = 0;
  held.trolley = 0;
  held.hoist = 0;
  for (const code of keysDown) {
    const m = codeToAxis(code);
    if (!m) continue;
    // Last conflicting key wins by summing then clamping later
    held[m.axis] += m.dir;
  }
}

function clampAxis(v: number): number {
  if (v > 0) return 1;
  if (v < 0) return -1;
  return 0;
}

export function getCraneInput(): CraneInput {
  return {
    slew: clampAxis(held.slew + buttonHeld.slew),
    trolley: clampAxis(held.trolley + buttonHeld.trolley),
    hoist: clampAxis(held.hoist + buttonHeld.hoist),
  };
}

function bindHoldButton(
  el: HTMLElement,
  axis: Axis,
  dir: number
): void {
  const press = (e: Event) => {
    e.preventDefault();
    buttonHeld[axis] = dir;
    el.classList.add("active");
  };
  const release = (e: Event) => {
    e.preventDefault();
    if (buttonHeld[axis] === dir) buttonHeld[axis] = 0;
    el.classList.remove("active");
  };

  el.addEventListener("pointerdown", press);
  el.addEventListener("pointerup", release);
  el.addEventListener("pointerleave", release);
  el.addEventListener("pointercancel", release);
  // Prevent context menu / focus steal on long-press
  el.addEventListener("contextmenu", (e) => e.preventDefault());
}

/**
 * Wire keyboard + optional #crane-pad buttons.
 * Call once after HUD DOM exists.
 */
export function initCraneControls(): void {
  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    if (!codeToAxis(e.code)) return;
    // Don't steal typing from inputs
    const t = e.target;
    if (
      t instanceof HTMLInputElement ||
      t instanceof HTMLTextAreaElement ||
      (t instanceof HTMLElement && t.isContentEditable)
    ) {
      return;
    }
    keysDown.add(e.code);
    refreshKeyboardAxes();
  });

  window.addEventListener("keyup", (e) => {
    if (!keysDown.has(e.code)) return;
    keysDown.delete(e.code);
    refreshKeyboardAxes();
  });

  window.addEventListener("blur", () => {
    keysDown.clear();
    refreshKeyboardAxes();
    buttonHeld.slew = 0;
    buttonHeld.trolley = 0;
    buttonHeld.hoist = 0;
    document
      .querySelectorAll("#crane-pad .pad-btn.active")
      .forEach((b) => b.classList.remove("active"));
  });

  const pad = document.getElementById("crane-pad");
  if (!pad) return;

  pad.querySelectorAll<HTMLElement>("[data-axis][data-dir]").forEach((btn) => {
    const axis = btn.dataset.axis as Axis | undefined;
    const dir = Number(btn.dataset.dir);
    if (!axis || !Number.isFinite(dir) || dir === 0) return;
    if (axis !== "slew" && axis !== "trolley" && axis !== "hoist") return;
    bindHoldButton(btn, axis, dir);
  });
}
