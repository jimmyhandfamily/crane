/**
 * Keyboard + on-screen hold buttons for crane controls.
 * Does not bind left-drag (camera keeps orbit).
 * M2: Space / Grab button edge-triggers grab/release.
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

/** Edge-triggered grab/release requests consumed by the game loop. */
let grabQueued = false;
/** Edge-triggered cab / orbit camera toggle (key C). */
let cabQueued = false;

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
    held[m.axis] += m.dir;
  }
}

function clampAxis(v: number): number {
  if (v > 0) return 1;
  if (v < 0) return -1;
  return 0;
}

function isTypingTarget(t: EventTarget | null): boolean {
  return (
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    (t instanceof HTMLElement && t.isContentEditable)
  );
}

export function getCraneInput(): CraneInput {
  return {
    slew: clampAxis(held.slew + buttonHeld.slew),
    trolley: clampAxis(held.trolley + buttonHeld.trolley),
    hoist: clampAxis(held.hoist + buttonHeld.hoist),
  };
}

/** Consume a pending grab/release press (Space or Grab button). */
export function consumeGrabPress(): boolean {
  if (!grabQueued) return false;
  grabQueued = false;
  return true;
}

export function queueGrabPress(): void {
  grabQueued = true;
}

/** Consume a pending cab-camera toggle (C). */
export function consumeCabToggle(): boolean {
  if (!cabQueued) return false;
  cabQueued = false;
  return true;
}

function bindHoldButton(el: HTMLElement, axis: Axis, dir: number): void {
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
  el.addEventListener("contextmenu", (e) => e.preventDefault());
}

function bindGrabButton(el: HTMLElement): void {
  const fire = (e: Event) => {
    e.preventDefault();
    queueGrabPress();
    el.classList.add("active");
    window.setTimeout(() => el.classList.remove("active"), 120);
  };
  el.addEventListener("pointerdown", fire);
  el.addEventListener("contextmenu", (e) => e.preventDefault());
}

/**
 * Wire keyboard + optional #crane-pad buttons.
 * Call once after HUD DOM exists.
 */
export function initCraneControls(): void {
  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    if (isTypingTarget(e.target)) return;

    // Space = grab/release (M2)
    if (e.code === "Space") {
      e.preventDefault();
      queueGrabPress();
      return;
    }

    // C = cab / orbit camera toggle
    if (e.code === "KeyC") {
      e.preventDefault();
      cabQueued = true;
      return;
    }

    if (!codeToAxis(e.code)) return;
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
    grabQueued = false;
    cabQueued = false;
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

  const grabBtn = document.getElementById("btn-grab");
  if (grabBtn) bindGrabButton(grabBtn);
}
