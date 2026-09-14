import {
  CanvasTexture,
  MeshBasicMaterial,
  Scene,
  Vector3,
} from "three";
import type { CraneParts } from "../crane/placeholderCrane";
import type { LoadManager } from "../loads";
import { disc } from "./meshHelpers";

const SHADOW_Y = 0.18;
const HOOK_BASE_DIAMETER = 1.35;
const LOAD_BASE_DIAMETER = 1.5;
const HEIGHT_REF = 25;
const HEIGHT_SCALE_MIN = 0.85;
const HEIGHT_SCALE_MAX = 1.35;

export interface BlobShadows {
  update(parts: CraneParts, loads: LoadManager): void;
}

const _pos = new Vector3();

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

export function createBlobShadows(scene: Scene): BlobShadows {
  const mat = makeSoftBlobMaterial("matBlobShadow");
  const hookBlob = disc("HookGroundShadow", 0.5, mat);
  scene.add(hookBlob);
  const loadBlob = disc("LoadGroundShadow", 0.5, mat);
  scene.add(loadBlob);
  loadBlob.visible = false;

  return {
    update(parts: CraneParts, loads: LoadManager): void {
      parts.hook.updateWorldMatrix(true, false);
      parts.hook.getWorldPosition(_pos);
      const hScale = heightScale(_pos.y);
      hookBlob.position.set(_pos.x, SHADOW_Y, _pos.z);
      const hookDiam = HOOK_BASE_DIAMETER * hScale;
      hookBlob.scale.set(hookDiam, hookDiam, 1);

      if (loads.attached) {
        const load = loads.attached;
        load.mesh.updateWorldMatrix(true, false);
        load.mesh.getWorldPosition(_pos);
        const lScale = heightScale(_pos.y);
        const loadDiam =
          Math.max(LOAD_BASE_DIAMETER, load.radius * 2.4) * lScale;
        loadBlob.visible = true;
        loadBlob.position.set(_pos.x, SHADOW_Y, _pos.z);
        loadBlob.scale.set(loadDiam, loadDiam, 1);
      } else {
        loadBlob.visible = false;
      }
    },
  };
}
