import { Object3D, Scene, Vector3 } from "three";
import { YARD_SIZE } from "../config/units";
import type { SharedMaterials } from "./materials";
import type { LoadItem, PadZone } from "../loads/types";
import { CRATE_MASS_KG, BARREL_MASS_KG } from "../loads/types";
import { box, cyl, group } from "./meshHelpers";

export interface PropsResult {
  root: Object3D;
  loads: LoadItem[];
  pads: PadZone[];
}

function createConcretePad(
  name: string,
  mats: SharedMaterials,
  parent: Object3D,
  x: number,
  z: number,
  size = 8
): PadZone {
  const pad = box(name, size, 0.15, size, mats.concrete, parent);
  pad.position.set(x, 0.075, z);
  pad.receiveShadow = true;

  const lipT = 0.28;
  const lipH = 0.1;
  const half = size / 2;
  const lipY = 0.15 + lipH / 2;
  for (const [suffix, w, d, ox, oz] of [
    ["LipN", size + lipT * 2, lipT, 0, half + lipT / 2],
    ["LipS", size + lipT * 2, lipT, 0, -(half + lipT / 2)],
    ["LipE", lipT, size, half + lipT / 2, 0],
    ["LipW", lipT, size, -(half + lipT / 2), 0],
  ] as const) {
    const lip = box(`${name}_${suffix}`, w, lipH, d, mats.concrete, parent);
    lip.position.set(x + ox, lipY, z + oz);
  }

  return {
    id: name,
    label: name,
    center: new Vector3(x, 0, z),
    halfSize: size / 2,
    marked: false,
  };
}

function createShed(
  mats: SharedMaterials,
  parent: Object3D,
  x: number,
  z: number
): void {
  const shed = group("SchoolShed", parent);
  shed.position.set(x, 0, z);

  const wall = box("ShedBody", 6, 3.2, 4.5, mats.shedWall, shed);
  wall.position.y = 1.6;

  const doorRecess = box("ShedDoorRecess", 1.5, 2.2, 0.25, mats.shedDoor, shed);
  doorRecess.position.set(0, 1.1, 2.2);

  const doorPanel = box("ShedDoorPanel", 1.25, 2.0, 0.08, mats.shedDoor, shed);
  doorPanel.position.set(0, 1.05, 2.28);

  for (const [wx, wz] of [
    [-3.05, 0.4],
    [-3.05, -0.9],
    [3.05, 0.4],
    [3.05, -0.9],
  ] as const) {
    const frame = box(
      `ShedWinFrame_${wx}_${wz}`,
      0.12,
      1.15,
      1.25,
      mats.shedRoof,
      shed
    );
    frame.position.set(wx, 1.85, wz);

    const glass = box(
      `ShedWinGlass_${wx}_${wz}`,
      0.06,
      0.95,
      1.05,
      mats.shedWindow,
      shed
    );
    glass.position.set(wx + Math.sign(wx) * 0.02, 1.85, wz);
  }

  const roofL = box("ShedRoofL", 7.0, 0.22, 2.9, mats.shedRoof, shed);
  roofL.position.set(0, 3.55, -0.75);
  roofL.rotation.x = 0.35;

  const roofR = box("ShedRoofR", 7.0, 0.22, 2.9, mats.shedRoof, shed);
  roofR.position.set(0, 3.55, 0.75);
  roofR.rotation.x = -0.35;

  const ridge = box("ShedRoofRidge", 7.1, 0.14, 0.35, mats.shedRoof, shed);
  ridge.position.set(0, 3.95, 0);

  const porch = box("ShedPorch", 3.2, 0.18, 1.6, mats.concrete, shed);
  porch.position.set(0, 0.09, 3.15);

  const hvac = box("ShedHVAC", 1.4, 0.7, 1.1, mats.steel, shed);
  hvac.position.set(-1.6, 4.15, -0.3);

  const hvacFan = cyl("ShedHVACFan", 0.275, 0.275, 0.12, mats.steel, shed, 12);
  hvacFan.position.set(-1.6, 4.55, -0.3);
}

function createYardFence(mats: SharedMaterials, parent: Object3D): void {
  const fenceRoot = group("YardFence", parent);
  const half = YARD_SIZE / 2 - 1.5;
  const postH = 1.35;
  const postW = 0.28;
  const railH = 0.16;
  const railD = 0.2;
  const spacing = 4.5;
  const gateHalf = 5.5;

  const sides: { axis: "x" | "z"; fixed: number; from: number; to: number }[] = [
    { axis: "x", fixed: half, from: -half, to: half },
    { axis: "x", fixed: -half, from: -half, to: half },
    { axis: "z", fixed: half, from: -half, to: half },
    { axis: "z", fixed: -half, from: -half, to: half },
  ];

  let postIdx = 0;
  let railIdx = 0;

  for (const side of sides) {
    const posts: number[] = [];
    for (let t = side.from; t <= side.to + 0.01; t += spacing) {
      if (Math.abs(t) < gateHalf) continue;
      posts.push(t);
    }
    if (posts.length === 0 || posts[0]! > side.from + 0.1) {
      if (Math.abs(side.from) >= gateHalf) posts.unshift(side.from);
    }
    if (posts.length === 0 || posts[posts.length - 1]! < side.to - 0.1) {
      if (Math.abs(side.to) >= gateHalf) posts.push(side.to);
    }

    for (const t of posts) {
      const post = box(
        `FencePost_${postIdx++}`,
        postW,
        postH,
        postW,
        mats.fence,
        fenceRoot
      );
      if (side.axis === "x") post.position.set(side.fixed, postH / 2, t);
      else post.position.set(t, postH / 2, side.fixed);
    }

    for (let i = 0; i < posts.length - 1; i++) {
      const a = posts[i]!;
      const b = posts[i + 1]!;
      const span = b - a;
      if (span > spacing * 1.6) continue;
      const mid = (a + b) / 2;
      const len = span - postW * 0.4;

      for (const railY of [0.45, 0.95] as const) {
        const rail =
          side.axis === "x"
            ? box(`FenceRail_${railIdx++}`, railD, railH, len, mats.fence, fenceRoot)
            : box(`FenceRail_${railIdx++}`, len, railH, railD, mats.fence, fenceRoot);
        if (side.axis === "x") rail.position.set(side.fixed, railY, mid);
        else rail.position.set(mid, railY, side.fixed);
      }
    }
  }
}

function createCrate(
  name: string,
  mats: SharedMaterials,
  parent: Object3D,
  pos: Vector3,
  scale = 1
): LoadItem {
  const w = 1.2 * scale;
  const h = 1.0 * scale;
  const d = 1.2 * scale;
  const crate = box(name, w, h, d, mats.crate, parent);
  crate.position.set(pos.x, pos.y + h / 2, pos.z);
  crate.rotation.y = Math.random() * 0.4 - 0.2;

  return {
    id: name,
    kind: "crate",
    mesh: crate,
    halfHeight: h / 2,
    radius: Math.max(w, d) / 2,
    massKg: CRATE_MASS_KG * scale,
    attached: false,
    placed: false,
  };
}

function createBarrel(
  name: string,
  mats: SharedMaterials,
  parent: Object3D,
  pos: Vector3,
  pickable = false
): LoadItem | null {
  const height = 1.1;
  const diameter = 0.7;
  const barrel = cyl(name, diameter / 2, diameter / 2, height, mats.barrel, parent, 16);
  barrel.position.set(pos.x, pos.y + height / 2, pos.z);

  if (!pickable) return null;

  return {
    id: name,
    kind: "barrel",
    mesh: barrel,
    halfHeight: height / 2,
    radius: diameter / 2,
    massKg: BARREL_MASS_KG,
    attached: false,
    placed: false,
  };
}

function createCone(
  name: string,
  mats: SharedMaterials,
  parent: Object3D,
  x: number,
  z: number
): void {
  const cone = cyl(name, 0.025, 0.175, 0.7, mats.cones, parent, 12);
  cone.position.set(x, 0.35, z);
}

function createPadMarker(
  label: "A" | "B",
  mats: SharedMaterials,
  parent: Object3D,
  x: number,
  z: number
): void {
  const node = group(`PadMarker${label}`, parent);
  node.position.set(x, 0, z);

  const discMesh = cyl(
    `MarkerDisc${label}`,
    1.1,
    1.1,
    0.08,
    label === "A" ? mats.markerA : mats.markerB,
    node,
    24
  );
  discMesh.position.y = 0.06;

  const bar = box(
    `MarkerGlyph${label}`,
    label === "A" ? 0.15 : 0.9,
    0.12,
    label === "A" ? 1.1 : 0.15,
    mats.glyph,
    node
  );
  bar.position.y = 0.16;

  if (label === "A") {
    const cross = box("MarkerGlyphA_cross", 0.9, 0.12, 0.15, mats.glyph, node);
    cross.position.y = 0.16;
  }
}

export function createProps(scene: Scene, mats: SharedMaterials): PropsResult {
  const root = group("PropsRoot");
  scene.add(root);
  const loads: LoadItem[] = [];
  const pads: PadZone[] = [];

  const pad1 = createConcretePad("Pad1", mats, root, -18, 12, 10);
  pad1.label = "Pad A";
  pad1.marked = true;
  pads.push(pad1);

  const pad2 = createConcretePad("Pad2", mats, root, 22, -8, 8);
  pad2.label = "Pad B";
  pad2.marked = true;
  pads.push(pad2);

  const pad3 = createConcretePad("Pad3", mats, root, -12, -22, 7);
  pad3.label = "Pad 3";
  pads.push(pad3);

  createShed(mats, root, -28, 28);
  createYardFence(mats, root);

  loads.push(createCrate("Crate1", mats, root, new Vector3(-16, 0, 10)));
  loads.push(createCrate("Crate2", mats, root, new Vector3(-14.5, 0, 11.2), 0.85));
  loads.push(createCrate("Crate3", mats, root, new Vector3(20, 0, -6), 1.1));
  loads.push(createCrate("Crate4", mats, root, new Vector3(21.5, 0, -7.5), 0.7));

  const b1 = createBarrel("Barrel1", mats, root, new Vector3(-10, 0, -20), true);
  if (b1) loads.push(b1);
  createBarrel("Barrel2", mats, root, new Vector3(-9.1, 0, -20.8));
  createBarrel("Barrel3", mats, root, new Vector3(24, 0, -10));

  const coneRing: [number, number][] = [
    [14, 14],
    [14, -14],
    [-14, 14],
    [-14, -14],
    [0, 16],
    [0, -16],
    [16, 0],
    [-16, 0],
  ];
  coneRing.forEach(([cx, cz], i) => {
    createCone(`Cone${i}`, mats, root, cx, cz);
  });

  createPadMarker("A", mats, root, -18, 12);
  createPadMarker("B", mats, root, 22, -8);

  return { root, loads, pads };
}
