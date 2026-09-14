import { Vector3 } from "@babylonjs/core";
import type { CraneParts } from "../crane/placeholderCrane";
import type { LoadItem, PadZone } from "./types";
import { setObjective } from "../ui/hud";

/** Combined grab distance from hook ring to load top (m). */
export const ATTACH_DISTANCE = 1.25;
/** Max horizontal offset so hook is "roughly above" the load (m). */
export const ATTACH_HORIZONTAL_MAX = 1.1;
/** Release counts as placed if load center is within pad + this margin (m). */
export const PAD_PLACE_MARGIN = 0.75;

export interface LoadManager {
  loads: LoadItem[];
  pads: PadZone[];
  /** Currently attached load, if any. */
  attached: LoadItem | null;
  /** How many loads successfully placed (any pad). */
  placedCount: number;
  /** True once at least one crate is on a marked pad (M2 win). */
  m2Complete: boolean;
  /** Toggle grab/release (Space / button). */
  tryToggleGrab(parts: CraneParts): void;
  /** Keep attached load under the hook each frame. */
  update(parts: CraneParts): void;
}

function hookWorldPos(parts: CraneParts): Vector3 {
  parts.hookRing.computeWorldMatrix(true);
  return parts.hookRing.getAbsolutePosition().clone();
}

function loadTopWorld(load: LoadItem): Vector3 {
  load.mesh.computeWorldMatrix(true);
  const p = load.mesh.getAbsolutePosition().clone();
  // mesh origin is at geometric center → top ≈ center.y + halfHeight
  p.y += load.halfHeight;
  return p;
}

function horizontalDist(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function findNearestGrabbable(
  parts: CraneParts,
  loads: LoadItem[]
): LoadItem | null {
  const hook = hookWorldPos(parts);
  let best: LoadItem | null = null;
  let bestDist = Infinity;

  for (const load of loads) {
    if (load.attached || load.placed) continue;
    const top = loadTopWorld(load);
    const horiz = horizontalDist(hook, top);
    if (horiz > ATTACH_HORIZONTAL_MAX) continue;
    const d = Vector3.Distance(hook, top);
    if (d > ATTACH_DISTANCE) continue;
    // Prefer loads that are below or near the hook vertically
    if (top.y - hook.y > 0.4) continue;
    if (d < bestDist) {
      bestDist = d;
      best = load;
    }
  }
  return best;
}

function findPadUnder(load: LoadItem, pads: PadZone[]): PadZone | null {
  load.mesh.computeWorldMatrix(true);
  const p = load.mesh.getAbsolutePosition();
  for (const pad of pads) {
    const half = pad.halfSize + PAD_PLACE_MARGIN;
    if (
      Math.abs(p.x - pad.center.x) <= half &&
      Math.abs(p.z - pad.center.z) <= half
    ) {
      return pad;
    }
  }
  return null;
}

function attachLoad(load: LoadItem, parts: CraneParts): void {
  // parent accessor = snap without preserving world pose
  load.mesh.parent = parts.hook;
  // Hang below hook: ring sits ~0.55 below Hook origin
  load.mesh.position = new Vector3(0, -0.55 - load.halfHeight, 0);
  load.mesh.rotation = new Vector3(0, 0, 0);
  load.attached = true;
}

function detachLoad(load: LoadItem): void {
  load.mesh.computeWorldMatrix(true);
  const worldPos = load.mesh.getAbsolutePosition().clone();
  // Unparent without preserving (we set world pose explicitly)
  load.mesh.parent = null;
  const groundY = load.halfHeight + 0.15;
  load.mesh.rotationQuaternion = null;
  load.mesh.position = new Vector3(worldPos.x, groundY, worldPos.z);
  load.mesh.rotation = new Vector3(0, 0, 0);
  load.attached = false;
}

function updateObjective(mgr: LoadManager): void {
  if (mgr.m2Complete) {
    setObjective(
      "Nice work — crate placed on a pad! Keep practicing grab & place."
    );
    return;
  }
  if (mgr.attached) {
    const kind = mgr.attached.kind === "crate" ? "crate" : "barrel";
    setObjective(
      `Carrying a ${kind}. Release over Pad A (or any pad) with Space / Grab.`
    );
    return;
  }
  if (mgr.placedCount > 0) {
    setObjective(
      "Load placed. Pick up another crate and set it on Pad A to finish."
    );
    return;
  }
  setObjective("Pick up a crate and place it on Pad A");
}

export function createLoadManager(
  loads: LoadItem[],
  pads: PadZone[]
): LoadManager {
  const mgr: LoadManager = {
    loads,
    pads,
    attached: null,
    placedCount: 0,
    m2Complete: false,
    tryToggleGrab(parts: CraneParts): void {
      if (mgr.attached) {
        const load = mgr.attached;
        detachLoad(load);
        mgr.attached = null;

        const pad = findPadUnder(load, mgr.pads);
        if (pad) {
          load.placed = true;
          mgr.placedCount += 1;
          load.mesh.position.y = load.halfHeight + 0.15;
          if (load.kind === "crate" && pad.marked) {
            mgr.m2Complete = true;
          }
          console.info(
            `[Crane M2] Placed ${load.id} on ${pad.label} (placed=${mgr.placedCount}, win=${mgr.m2Complete})`
          );
        } else {
          console.info(`[Crane M2] Released ${load.id} (not on a pad)`);
        }
        updateObjective(mgr);
        return;
      }

      const target = findNearestGrabbable(parts, mgr.loads);
      if (!target) {
        console.info("[Crane M2] Grab: no load in range");
        return;
      }
      attachLoad(target, parts);
      mgr.attached = target;
      console.info(`[Crane M2] Attached ${target.id}`);
      updateObjective(mgr);
    },
    update(_parts: CraneParts): void {
      if (mgr.attached) {
        const load = mgr.attached;
        load.mesh.position.set(0, -0.55 - load.halfHeight, 0);
      }
    },
  };

  updateObjective(mgr);
  return mgr;
}
