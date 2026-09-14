import { type Object3D, Scene } from "three";
import { YARD_SIZE } from "../config/units";
import type { SharedMaterials } from "./materials";
import { box, groundPlane, group } from "./meshHelpers";

export function createGround(scene: Scene, mats: SharedMaterials): Object3D {
  const root = group("YardRoot");
  scene.add(root);

  groundPlane("GroundDirt", YARD_SIZE, YARD_SIZE, mats.dirt, root);

  const packed = groundPlane("GroundPacked", 28, 28, mats.packed, root);
  packed.position.set(0, 0.02, 0);

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

  const stripW = YARD_SIZE;
  const stripD = 12;
  for (const z of [
    YARD_SIZE / 2 - stripD / 2 - 1,
    -(YARD_SIZE / 2 - stripD / 2 - 1),
  ]) {
    const grass = groundPlane(
      `GrassStrip_${z > 0 ? "N" : "S"}`,
      stripW - 4,
      stripD,
      mats.grass,
      root
    );
    grass.position.set(0, 0.015, z);
  }

  const fenceGrassD = 4;
  const half = YARD_SIZE / 2;
  for (const [name, w, d, x, z] of [
    ["GrassFenceN", YARD_SIZE - 2, fenceGrassD, 0, half - fenceGrassD / 2 - 0.5],
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
    [
      "GrassFenceW",
      fenceGrassD,
      YARD_SIZE - 10,
      -(half - fenceGrassD / 2 - 0.5),
      0,
    ],
  ] as const) {
    const g = groundPlane(name, w, d, mats.grassDark, root);
    g.position.set(x, 0.018, z);
  }

  const mottles: {
    name: string;
    w: number;
    d: number;
    x: number;
    z: number;
    mat: "dirtMottle" | "dirtMottle2";
  }[] = [
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
    const q = groundPlane(m.name, m.w, m.d, mats[m.mat], root);
    q.position.set(m.x, 0.012, m.z);
  }

  return root;
}
