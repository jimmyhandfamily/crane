import { Vector3, type Object3D } from "three";
import type { CraneParts } from "../crane/placeholderCrane";
import type { LoadItem, PadZone } from "./types";
import { setObjective } from "../ui/hud";

export const ATTACH_DISTANCE = 1.25;
export const ATTACH_HORIZONTAL_MAX = 1.1;
export const PAD_PLACE_MARGIN = 0.75;

export interface LoadManager {
  loads: LoadItem[];
  pads: PadZone[];
  attached: LoadItem | null;
  placedCount: number;
  m2Complete: boolean;
  tryToggleGrab(parts: CraneParts): void;
  update(parts: CraneParts): void;
}

const _hook = new Vector3();
const _top = new Vector3();
const _world = new Vector3();

function hookWorldPos(parts: CraneParts): Vector3 {
  parts.hookRing.updateWorldMatrix(true, false);
  parts.hookRing.getWorldPosition(_hook);
  return _hook;
}

function loadTopWorld(load: LoadItem): Vector3 {
  load.mesh.updateWorldMatrix(true, false);
  load.mesh.getWorldPosition(_top);
  _top.y += load.halfHeight;
  return _top;
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
    const d = hook.distanceTo(top);
    if (d > ATTACH_DISTANCE) continue;
    if (top.y - hook.y > 0.4) continue;
    if (d < bestDist) {
      bestDist = d;
      best = load;
    }
  }
  return best;
}

function findPadUnder(load: LoadItem, pads: PadZone[]): PadZone | null {
  load.mesh.updateWorldMatrix(true, false);
  load.mesh.getWorldPosition(_world);
  for (const pad of pads) {
    const half = pad.halfSize + PAD_PLACE_MARGIN;
    if (
      Math.abs(_world.x - pad.center.x) <= half &&
      Math.abs(_world.z - pad.center.z) <= half
    ) {
      return pad;
    }
  }
  return null;
}

function attachLoad(load: LoadItem, parts: CraneParts): void {
  parts.hook.add(load.mesh);
  load.mesh.position.set(0, -0.55 - load.halfHeight, 0);
  load.mesh.rotation.set(0, 0, 0);
  load.attached = true;
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
  pads: PadZone[],
  propsRoot: Object3D
): LoadManager {
  for (const load of loads) {
    load.mesh.userData.propsRoot = propsRoot;
  }

  const mgr: LoadManager = {
    loads,
    pads,
    attached: null,
    placedCount: 0,
    m2Complete: false,
    tryToggleGrab(parts: CraneParts): void {
      if (mgr.attached) {
        const load = mgr.attached;
        load.mesh.updateWorldMatrix(true, false);
        load.mesh.getWorldPosition(_world);
        if (load.mesh.parent) load.mesh.parent.remove(load.mesh);
        const root = (load.mesh.userData.propsRoot as Object3D) ?? propsRoot;
        root.add(load.mesh);
        load.mesh.position.set(_world.x, load.halfHeight + 0.15, _world.z);
        load.mesh.rotation.set(0, 0, 0);
        load.attached = false;
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
            `[Crane] Placed ${load.id} on ${pad.label} (placed=${mgr.placedCount}, win=${mgr.m2Complete})`
          );
        } else {
          console.info(`[Crane] Released ${load.id} (not on a pad)`);
        }
        updateObjective(mgr);
        return;
      }

      const target = findNearestGrabbable(parts, mgr.loads);
      if (!target) {
        console.info("[Crane] Grab: no load in range");
        return;
      }
      attachLoad(target, parts);
      mgr.attached = target;
      console.info(`[Crane] Attached ${target.id}`);
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
