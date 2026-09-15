import {
  BufferAttribute,
  Mesh,
  PlaneGeometry,
  type Object3D,
  Scene,
} from "three";
import { YARD_SIZE } from "../config/units";
import type { SharedMaterials } from "./materials";
import { box, groundPlane, group } from "./meshHelpers";
import { LOAD_PAD_LAYOUT } from "./props";

/** Flat zones: crane pad, gravel roads/aprons, load pads — height stays ~0. */
function isFlatZone(x: number, z: number): boolean {
  // Crane work pad ±14
  if (Math.abs(x) < 15 && Math.abs(z) < 15) return true;
  // West lane corridor x≈-42, z 0..42
  if (Math.abs(x + 42) < 6 && z > -4 && z < 46) return true;
  // North connector z≈42, x -42..6
  if (Math.abs(z - 42) < 6 && x > -48 && x < 8) return true;
  // West / north gate aprons
  if (x < -YARD_SIZE / 2 + 8 && Math.abs(z) < 6) return true;
  if (z > YARD_SIZE / 2 - 8 && Math.abs(x) < 6) return true;
  // Shed spur
  if (Math.abs(z - 28) < 4 && x > -44 && x < -28) return true;
  // Load pads from props.ts — flat rect around each center ±(halfSize+2)
  for (const pad of LOAD_PAD_LAYOUT) {
    const extent = pad.size / 2 + 2;
    if (Math.abs(x - pad.x) <= extent && Math.abs(z - pad.z) <= extent) return true;
  }
  return false;
}

function terrainHeight(x: number, z: number): number {
  if (isFlatZone(x, z)) return 0;
  // Smooth rolling hills outside work areas
  const n =
    Math.sin(x * 0.045) * Math.cos(z * 0.038) * 1.35 +
    Math.sin(x * 0.09 + 1.7) * Math.cos(z * 0.07) * 0.55 +
    Math.sin((x + z) * 0.03) * 0.4;
  // Soft edge falloff near yard boundary (higher berms)
  const half = YARD_SIZE / 2;
  const edge = Math.max(
    0,
    Math.max(Math.abs(x) - (half - 14), Math.abs(z) - (half - 14)) / 14
  );
  const h = n * (0.35 + edge * 1.8) + edge * 0.85;
  return Math.max(-0.15, Math.min(3.2, h));
}

function createHeightfield(
  name: string,
  size: number,
  segs: number,
  mat: SharedMaterials["dirt"],
  parent: Object3D
): Mesh {
  const geo = new PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, terrainHeight(x, z));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  const mesh = new Mesh(geo, mat);
  mesh.name = name;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  parent.add(mesh);
  return mesh;
}

export function createGround(scene: Scene, mats: SharedMaterials): Object3D {
  const root = group("YardRoot");
  scene.add(root);

  // Rolling dirt heightfield (replaces flat infinite plate feel)
  createHeightfield("GroundDirtHF", YARD_SIZE + 40, 96, mats.dirt, root);

  // Crane work pad — flat packed earth (slightly raised for z-fight)
  const packed = groundPlane("GroundPacked", 28, 28, mats.packed, root);
  packed.position.set(0, 0.04, 0);

  // Pad joints (grid lines)
  const jointT = 0.18;
  const jointH = 0.04;
  for (let i = -1; i <= 1; i++) {
    if (i === 0) continue;
    const jx = box(`PadJointX_${i}`, 28, jointH, jointT, mats.oilStain, root);
    jx.position.set(0, 0.055, i * 7);
    const jz = box(`PadJointZ_${i}`, jointT, jointH, 28, mats.oilStain, root);
    jz.position.set(i * 7, 0.055, 0);
  }
  const jx0 = box("PadJointX_0", 28, jointH, jointT * 0.7, mats.oilStain, root);
  jx0.position.set(0, 0.052, 0);
  const jz0 = box("PadJointZ_0", jointT * 0.7, jointH, 28, mats.oilStain, root);
  jz0.position.set(0, 0.052, 0);

  const stains: [string, number, number, number, number][] = [
    ["OilStain1", 3.2, 2.4, 2.5, 3.0],
    ["OilStain2", 2.0, 1.6, -3.5, -2.0],
    ["OilStain3", 2.6, 1.8, 4.0, -4.5],
  ];
  for (const [name, w, d, x, z] of stains) {
    const s = groundPlane(name, w, d, mats.oilStain, root);
    s.position.set(x, 0.048, z);
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
    lip.position.set(x, lipH / 2 + 0.02, z);
  }

  // Grass on rolling ground — follow approximate height at center
  const placeGrass = (
    name: string,
    w: number,
    d: number,
    x: number,
    z: number,
    mat: SharedMaterials["grass"]
  ): void => {
    const g = groundPlane(name, w, d, mat, root);
    const y = Math.max(0.02, terrainHeight(x, z) + 0.03);
    g.position.set(x, y, z);
  };

  const stripW = YARD_SIZE;
  const stripD = 10;
  placeGrass("GrassStrip_S", stripW - 4, stripD, 0, -(YARD_SIZE / 2 - stripD / 2 - 1), mats.grass);
  placeGrass("GrassStrip_NL", 38, stripD, -28, YARD_SIZE / 2 - stripD / 2 - 1, mats.grass);
  placeGrass("GrassStrip_NR", 38, stripD, 28, YARD_SIZE / 2 - stripD / 2 - 1, mats.grass);

  const fenceGrassD = 4;
  const half = YARD_SIZE / 2;
  for (const [name, w, d, x, z] of [
    ["GrassFenceN", YARD_SIZE - 16, fenceGrassD, 18, half - fenceGrassD / 2 - 0.5],
    ["GrassFenceS", YARD_SIZE - 2, fenceGrassD, 0, -(half - fenceGrassD / 2 - 0.5)],
    ["GrassFenceE", fenceGrassD, YARD_SIZE - 10, half - fenceGrassD / 2 - 0.5, 0],
    ["GrassFenceW_S", fenceGrassD, 36, -(half - fenceGrassD / 2 - 0.5), -28],
    ["GrassFenceW_N", fenceGrassD, 8, -(half - fenceGrassD / 2 - 0.5), 44],
  ] as const) {
    placeGrass(name, w, d, x, z, mats.grassDark);
  }

  // Extra rolling grass patches outside pads
  const grassPatches: [string, number, number, number, number][] = [
    ["GrassHill_SE", 22, 18, 38, -38],
    ["GrassHill_SW", 20, 16, -36, -40],
    ["GrassHill_NE", 18, 14, 40, 28],
    ["GrassHill_E", 14, 22, 46, 0],
  ];
  for (const [name, w, d, x, z] of grassPatches) {
    placeGrass(name, w, d, x, z, mats.grass);
  }

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
    q.position.set(m.x, Math.max(0.02, terrainHeight(m.x, m.z) + 0.025), m.z);
  }

  return root;
}

/** Exported for trees / props that need ground height. */
export { terrainHeight, isFlatZone };
