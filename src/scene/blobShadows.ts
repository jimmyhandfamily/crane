import {
  CanvasTexture,
  MeshBasicMaterial,
  Scene,
  Vector3,
} from "three";
import type { CraneParts } from "../crane/placeholderCrane";
import type { LoadManager } from "../loads";
import { disc } from "./meshHelpers";

/** Default ground clearance for the soft disc. */
const GROUND_SHADOW_Y = 0.18;
/** Slight lift above pad/load tops so the disc doesn't z-fight. */
const SURFACE_EPS = 0.04;
const HOOK_BASE_DIAMETER = 1.35;
const LOAD_BASE_DIAMETER = 1.5;
const HEIGHT_REF = 25;
const HEIGHT_SCALE_MIN = 0.85;
const HEIGHT_SCALE_MAX = 1.35;

export interface BlobShadows {
  update(parts: CraneParts, loads: LoadManager): void;
}

const _hook = new Vector3();
const _loadPos = new Vector3();

function makeSoftBlobMaterial(name: string): MeshBasicMaterial {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  grad.addColorStop(0, "rgba(20, 16, 12, 0.62)");
  grad.addColorStop(0.35, "rgba(20, 16, 12, 0.42)");
  grad.addColorStop(0.7, "rgba(20, 16, 12, 0.16)");
  grad.addColorStop(1, "rgba(20, 16, 12, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new CanvasTexture(canvas);
  tex.needsUpdate = true;

  const mat = new MeshBasicMaterial({
    name,
    map: tex,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  return mat;
}

function heightScale(worldY: number): number {
  const t = Math.min(Math.max(worldY / HEIGHT_REF, 0), 1);
  return HEIGHT_SCALE_MIN + t * (HEIGHT_SCALE_MAX - HEIGHT_SCALE_MIN);
}

/**
 * Highest surface Y under (x,z): ground, pad top, or unattached load top.
 * Attached loads are ignored so the hook shadow still lands on ground/pad
 * while the separate load blob follows the hanging cargo.
 */
function surfaceYUnder(
  x: number,
  z: number,
  loads: LoadManager,
  skipAttached: boolean
): number {
  let y = GROUND_SHADOW_Y;

  for (const pad of loads.pads) {
    const dx = Math.abs(x - pad.center.x);
    const dz = Math.abs(z - pad.center.z);
    if (dx <= pad.halfSize && dz <= pad.halfSize) {
      // Concrete pad box is 0.15 tall centered at y=0.075 → top at 0.15
      y = Math.max(y, 0.15 + SURFACE_EPS);
    }
  }

  for (const load of loads.loads) {
    if (skipAttached && load.attached) continue;
    load.mesh.updateWorldMatrix(true, false);
    load.mesh.getWorldPosition(_loadPos);
    const topY = _loadPos.y + load.halfHeight;
    const dx = x - _loadPos.x;
    const dz = z - _loadPos.z;
    const reach = load.radius * 1.15;
    if (dx * dx + dz * dz <= reach * reach) {
      y = Math.max(y, topY + SURFACE_EPS);
    }
  }

  return y;
}

export function createBlobShadows(scene: Scene): BlobShadows {
  const mat = makeSoftBlobMaterial("matBlobShadow");
  const hookBlob = disc("HookGroundShadow", 0.5, mat);
  scene.add(hookBlob);
  const loadBlob = disc("LoadGroundShadow", 0.5, mat);
  scene.add(loadBlob);
  loadBlob.visible = false;
  // Render above ground/pad/crate surfaces without fighting opaque geo hard
  hookBlob.renderOrder = 2;
  loadBlob.renderOrder = 2;

  return {
    update(parts: CraneParts, loads: LoadManager): void {
      parts.hook.updateWorldMatrix(true, false);
      parts.hook.getWorldPosition(_hook);
      const hScale = heightScale(_hook.y);
      const hookSurfY = surfaceYUnder(_hook.x, _hook.z, loads, true);
      hookBlob.position.set(_hook.x, hookSurfY, _hook.z);
      const hookDiam = HOOK_BASE_DIAMETER * hScale;
      hookBlob.scale.set(hookDiam, hookDiam, 1);

      if (loads.attached) {
        const load = loads.attached;
        load.mesh.updateWorldMatrix(true, false);
        load.mesh.getWorldPosition(_loadPos);
        const lScale = heightScale(_loadPos.y);
        const loadDiam =
          Math.max(LOAD_BASE_DIAMETER, load.radius * 2.4) * lScale;
        // Attached load shadow: ground or pad under the hanging load (not crate top)
        const loadSurfY = surfaceYUnder(_loadPos.x, _loadPos.z, loads, true);
        loadBlob.visible = true;
        loadBlob.position.set(_loadPos.x, loadSurfY, _loadPos.z);
        loadBlob.scale.set(loadDiam, loadDiam, 1);
      } else {
        loadBlob.visible = false;
      }
    },
  };
}
