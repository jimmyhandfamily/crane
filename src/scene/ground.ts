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
 * grass at edges (darker at fence), mottled dirt tint quads.
 * Crane pad stays flat for hook shadows. No tall ground inside ~25 m of origin.
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

  // Packed earth pad under crane (~28 m) — keep flat for hook/load blobs
  const packed = MeshBuilder.CreateGround(
    "GroundPacked",
    { width: 28, height: 28 },
    scene
  );
  packed.position = new Vector3(0, 0.02, 0);
  packed.material = mats.packed;
  packed.parent = root;
  packed.receiveShadows = true;

  // Thin pad lip frame around crane packed area
  const lipT = 0.35;
  const lipH = 0.08;
  const padHalf = 14;
  for (const [name, w, d, x, z] of [
    ["CranePadLipN", 28 + lipT * 2, lipT, 0, padHalf + lipT / 2],
    ["CranePadLipS", 28 + lipT * 2, lipT, 0, -(padHalf + lipT / 2)],
    ["CranePadLipE", lipT, 28, padHalf + lipT / 2, 0],
    ["CranePadLipW", lipT, 28, -(padHalf + lipT / 2), 0],
  ] as const) {
    const lip = MeshBuilder.CreateBox(
      name,
      { width: w, height: lipH, depth: d },
      scene
    );
    lip.position = new Vector3(x, lipH / 2, z);
    lip.material = mats.packed;
    lip.parent = root;
  }

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

  // Darker grass at fence line (outer rim)
  const fenceGrassD = 4;
  const half = YARD_SIZE / 2;
  for (const [name, w, d, x, z] of [
    ["GrassFenceN", YARD_SIZE - 2, fenceGrassD, 0, half - fenceGrassD / 2 - 0.5],
    ["GrassFenceS", YARD_SIZE - 2, fenceGrassD, 0, -(half - fenceGrassD / 2 - 0.5)],
    ["GrassFenceE", fenceGrassD, YARD_SIZE - 10, half - fenceGrassD / 2 - 0.5, 0],
    ["GrassFenceW", fenceGrassD, YARD_SIZE - 10, -(half - fenceGrassD / 2 - 0.5), 0],
  ] as const) {
    const g = MeshBuilder.CreateGround(name, { width: w, height: d }, scene);
    g.position = new Vector3(x, 0.018, z);
    g.material = mats.grassDark;
    g.parent = root;
    g.receiveShadows = true;
  }

  // Mottled dirt tint quads — stay outside ~25 m of CraneRoot (no tall ground near work)
  const mottles: { name: string; w: number; d: number; x: number; z: number; mat: "dirtMottle" | "dirtMottle2" }[] = [
    { name: "DirtMottle1", w: 8, d: 6, x: 32, z: 28, mat: "dirtMottle" },
    { name: "DirtMottle2", w: 7, d: 5, x: -34, z: -30, mat: "dirtMottle2" },
    { name: "DirtMottle3", w: 6, d: 7, x: 30, z: -32, mat: "dirtMottle" },
    { name: "DirtMottle4", w: 9, d: 5, x: -30, z: 36, mat: "dirtMottle2" },
    { name: "DirtMottle5", w: 5, d: 8, x: 38, z: 8, mat: "dirtMottle" },
    { name: "DirtMottle6", w: 6, d: 6, x: -38, z: -8, mat: "dirtMottle2" },
    { name: "DirtMottle7", w: 7, d: 4, x: 18, z: 38, mat: "dirtMottle" },
    { name: "DirtMottle8", w: 5, d: 6, x: -20, z: -38, mat: "dirtMottle2" },
  ];
  for (const m of mottles) {
    const q = MeshBuilder.CreateGround(m.name, { width: m.w, height: m.d }, scene);
    q.position = new Vector3(m.x, 0.012, m.z);
    q.material = mats[m.mat];
    q.parent = root;
    q.receiveShadows = true;
  }

  return root;
}
