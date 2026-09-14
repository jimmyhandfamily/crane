import {
  MeshBuilder,
  Scene,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { YARD_SIZE } from "../config/units";
import type { SharedMaterials } from "./materials";

/**
 * ~100×100 m training yard: dirt base, packed ring under crane,
 * grass patches at edges.
 */
export function createGround(scene: Scene, mats: SharedMaterials): TransformNode {
  const root = new TransformNode("YardRoot", scene);

  const dirt = MeshBuilder.CreateGround(
    "GroundDirt",
    { width: YARD_SIZE, height: YARD_SIZE, subdivisions: 2 },
    scene
  );
  dirt.material = mats.dirt;
  dirt.parent = root;
  dirt.receiveShadows = true;

  // Packed earth pad under crane (~24 m)
  const packed = MeshBuilder.CreateGround(
    "GroundPacked",
    { width: 28, height: 28 },
    scene
  );
  packed.position = new Vector3(0, 0.02, 0);
  packed.material = mats.packed;
  packed.parent = root;
  packed.receiveShadows = true;

  // Soft grass strips along N/S edges
  const stripW = YARD_SIZE;
  const stripD = 12;
  for (const z of [YARD_SIZE / 2 - stripD / 2 - 1, -(YARD_SIZE / 2 - stripD / 2 - 1)]) {
    const grass = MeshBuilder.CreateGround(
      `GrassStrip_${z > 0 ? "N" : "S"}`,
      { width: stripW - 4, height: stripD },
      scene
    );
    grass.position = new Vector3(0, 0.015, z);
    grass.material = mats.grass;
    grass.parent = root;
    grass.receiveShadows = true;
  }

  return root;
}
