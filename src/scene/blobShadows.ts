import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
} from "@babylonjs/core";
import type { CraneParts } from "../crane/placeholderCrane";
import type { LoadManager } from "../loads";

/** Slightly above concrete pad tops (~0.15) so the blob stays readable over pads. */
const SHADOW_Y = 0.18;

/** Base diameter for hook ground blob (m). */
const HOOK_BASE_DIAMETER = 1.35;
/** Base diameter for load ground blob (m); scaled by load radius. */
const LOAD_BASE_DIAMETER = 1.5;

/** Height (m) at which size scale saturates. */
const HEIGHT_REF = 25;
const HEIGHT_SCALE_MIN = 0.85;
const HEIGHT_SCALE_MAX = 1.35;

export interface BlobShadows {
  /** Reposition blobs from hook / attached load each frame. */
  update(parts: CraneParts, loads: LoadManager): void;
}

function makeSoftBlobMaterial(name: string, scene: Scene): StandardMaterial {
  const size = 128;
  const tex = new DynamicTexture(`${name}_Tex`, size, scene, false);
  tex.hasAlpha = true;
  const ctx = tex.getContext();
  const cx = size / 2;
  const cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
  // Dark soft disc — readable from high ~60° camera over light dirt/concrete
  grad.addColorStop(0, "rgba(20, 16, 12, 0.62)");
  grad.addColorStop(0.35, "rgba(20, 16, 12, 0.42)");
  grad.addColorStop(0.7, "rgba(20, 16, 12, 0.16)");
  grad.addColorStop(1, "rgba(20, 16, 12, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  tex.update();

  const mat = new StandardMaterial(name, scene);
  mat.diffuseTexture = tex;
  mat.opacityTexture = tex;
  mat.useAlphaFromDiffuseTexture = true;
  mat.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
  mat.diffuseColor = Color3.White();
  mat.emissiveColor = Color3.Black();
  mat.specularColor = Color3.Black();
  mat.disableLighting = true;
  mat.backFaceCulling = false;
  mat.zOffset = -2; // bias toward camera to reduce z-fight with ground
  return mat;
}

function createBlobDisc(name: string, scene: Scene, mat: StandardMaterial): Mesh {
  // Unit disc in XY; rotate flat onto XZ ground plane
  const disc = MeshBuilder.CreateDisc(
    name,
    { radius: 0.5, tessellation: 36 },
    scene
  );
  disc.rotation.x = Math.PI / 2;
  disc.material = mat;
  disc.isPickable = false;
  disc.receiveShadows = false;
  return disc;
}

function heightScale(worldY: number): number {
  const t = Math.min(Math.max(worldY / HEIGHT_REF, 0), 1);
  return HEIGHT_SCALE_MIN + t * (HEIGHT_SCALE_MAX - HEIGHT_SCALE_MIN);
}

/**
 * Soft dark ground blobs under the hook (always) and attached load (when carrying).
 * Cheap playability cue — no Babylon shadow generator.
 */
export function createBlobShadows(scene: Scene): BlobShadows {
  const mat = makeSoftBlobMaterial("matBlobShadow", scene);
  const hookBlob = createBlobDisc("HookGroundShadow", scene, mat);
  const loadBlob = createBlobDisc("LoadGroundShadow", scene, mat);
  loadBlob.setEnabled(false);

  return {
    update(parts: CraneParts, loads: LoadManager): void {
      parts.hook.computeWorldMatrix(true);
      const hookPos = parts.hook.getAbsolutePosition();
      const hScale = heightScale(hookPos.y);
      hookBlob.position.set(hookPos.x, SHADOW_Y, hookPos.z);
      const hookDiam = HOOK_BASE_DIAMETER * hScale;
      hookBlob.scaling.set(hookDiam, hookDiam, 1);

      if (loads.attached) {
        const load = loads.attached;
        load.mesh.computeWorldMatrix(true);
        const loadPos = load.mesh.getAbsolutePosition();
        const lScale = heightScale(loadPos.y);
        const loadDiam =
          Math.max(LOAD_BASE_DIAMETER, load.radius * 2.4) * lScale;
        loadBlob.setEnabled(true);
        loadBlob.position.set(loadPos.x, SHADOW_Y, loadPos.z);
        loadBlob.scaling.set(loadDiam, loadDiam, 1);
      } else {
        loadBlob.setEnabled(false);
      }
    },
  };
}
