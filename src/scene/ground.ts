import { type Object3D, Scene } from "three";
import { YARD_SIZE } from "../config/units";
import type { SharedMaterials } from "./materials";
import { box, groundPlane, group } from "./meshHelpers";

export function createGround(scene: Scene, mats: SharedMaterials): Object3D {
  const root = group("YardRoot");
  scene.add(root);

  groundPlane("GroundDirt", YARD_SIZE, YARD_SIZE, mats.dirt, root);

  // Crane work pad — mostly flat packed earth
  const packed = groundPlane("GroundPacked", 28, 28, mats.packed, root);
  packed.position.set(0, 0.02, 0);

  // Pad joints (grid lines)
  const jointT = 0.18;
  const jointH = 0.04;
  for (let i = -1; i <= 1; i++) {
    if (i === 0) continue;
    const jx = box(
      `PadJointX_${i}`,
      28,
      jointH,
      jointT,
      mats.oilStain,
      root
    );
    jx.position.set(0, 0.04, i * 7);
    const jz = box(
      `PadJointZ_${i}`,
      jointT,
      jointH,
      28,
      mats.oilStain,
      root
    );
    jz.position.set(i * 7, 0.04, 0);
  }
  // Cross center joints
  const jx0 = box("PadJointX_0", 28, jointH, jointT * 0.7, mats.oilStain, root);
  jx0.position.set(0, 0.038, 0);
  const jz0 = box("PadJointZ_0", jointT * 0.7, jointH, 28, mats.oilStain, root);
  jz0.position.set(0, 0.038, 0);

  // Oil stains near crane base
  const stains: [string, number, number, number, number][] = [
    ["OilStain1", 3.2, 2.4, 2.5, 3.0],
    ["OilStain2", 2.0, 1.6, -3.5, -2.0],
    ["OilStain3", 2.6, 1.8, 4.0, -4.5],
  ];
  for (const [name, w, d, x, z] of stains) {
    const s = groundPlane(name, w, d, mats.oilStain, root);
    s.position.set(x, 0.032, z);
  }

  const lipT = 0.35;
  const lipH = 0.08;
  const padHalf = 14;
  for (const [name, w, d, x, z] of [
    ["CranePadLipN", 28 + lipT * 2, lipT, 0, padHalf + lipT / 2],
    ["CranePadLipS", 28 + lipT * 2, lipT, 0, -(padHalf + lipT / 2)],
    ["CranePadLipE", lipT, 28, padHalf + lipT / 2, 0],
    ["CranePadLipW", lipT, 28, -(padHalf + lipT / 2), 0],
  ] as const) {
    const lip = box(name, w, lipH, d, mats.packed, root);
    lip.position.set(x, lipH / 2, z);
  }

  // Grass strips — leave corridors clear for west lane (x≈-42) and north conn (z≈42)
  const stripW = YARD_SIZE;
  const stripD = 10;
  // South grass (full)
  const grassS = groundPlane("GrassStrip_S", stripW - 4, stripD, mats.grass, root);
  grassS.position.set(0, 0.015, -(YARD_SIZE / 2 - stripD / 2 - 1));
  // North grass — split around north road corridor (x -6..6 kept dirt/gravel)
  const grassN_L = groundPlane("GrassStrip_NL", 38, stripD, mats.grass, root);
  grassN_L.position.set(-28, 0.015, YARD_SIZE / 2 - stripD / 2 - 1);
  const grassN_R = groundPlane("GrassStrip_NR", 38, stripD, mats.grass, root);
  grassN_R.position.set(28, 0.015, YARD_SIZE / 2 - stripD / 2 - 1);

  const fenceGrassD = 4;
  const half = YARD_SIZE / 2;
  // Fence grass — west side leaves gap for west lane/apron (z -8..40 dirt)
  for (const [name, w, d, x, z] of [
    ["GrassFenceN", YARD_SIZE - 16, fenceGrassD, 18, half - fenceGrassD / 2 - 0.5],
    [
      "GrassFenceS",
      YARD_SIZE - 2,
      fenceGrassD,
      0,
      -(half - fenceGrassD / 2 - 0.5),
    ],
    [
      "GrassFenceE",
      fenceGrassD,
      YARD_SIZE - 10,
      half - fenceGrassD / 2 - 0.5,
      0,
    ],
    // West fence grass split N/S of gate, skip road corridor
    [
      "GrassFenceW_S",
      fenceGrassD,
      36,
      -(half - fenceGrassD / 2 - 0.5),
      -28,
    ],
    [
      "GrassFenceW_N",
      fenceGrassD,
      8,
      -(half - fenceGrassD / 2 - 0.5),
      44,
    ],
  ] as const) {
    const g = groundPlane(name, w, d, mats.grassDark, root);
    g.position.set(x, 0.018, z);
  }

  // Dirt mottles — avoid road corridors
  const mottles: {
    name: string;
    w: number;
    d: number;
    x: number;
    z: number;
    mat: "dirtMottle" | "dirtMottle2";
  }[] = [
    { name: "DirtMottle1", w: 8, d: 6, x: 32, z: 22, mat: "dirtMottle" },
    { name: "DirtMottle2", w: 7, d: 5, x: -34, z: -30, mat: "dirtMottle2" },
    { name: "DirtMottle3", w: 6, d: 7, x: 30, z: -32, mat: "dirtMottle" },
    { name: "DirtMottle4", w: 9, d: 5, x: -22, z: 8, mat: "dirtMottle2" },
    { name: "DirtMottle5", w: 5, d: 8, x: 38, z: 8, mat: "dirtMottle" },
    { name: "DirtMottle6", w: 6, d: 6, x: -38, z: -14, mat: "dirtMottle2" },
    { name: "DirtMottle7", w: 7, d: 4, x: 18, z: 34, mat: "dirtMottle" },
    { name: "DirtMottle8", w: 5, d: 6, x: -20, z: -38, mat: "dirtMottle2" },
    { name: "DirtMottle9", w: 4.5, d: 5, x: 12, z: -28, mat: "dirtMottle" },
    { name: "DirtMottle10", w: 5.5, d: 4, x: 26, z: 14, mat: "dirtMottle2" },
  ];
  for (const m of mottles) {
    const q = groundPlane(m.name, m.w, m.d, mats[m.mat], root);
    q.position.set(m.x, 0.012, m.z);
  }

  return root;
}
