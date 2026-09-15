import { Object3D, Scene, Vector3 } from "three";
import { YARD_SIZE } from "../config/units";
import type { SharedMaterials } from "./materials";
import type { LoadItem, PadZone } from "../loads/types";
import { CRATE_MASS_KG, BARREL_MASS_KG } from "../loads/types";
import { box, cyl, group } from "./meshHelpers";


/** Load-pad layout (shared with ground flat-mask). size = full width. */
export const LOAD_PAD_LAYOUT: ReadonlyArray<{
  id: string;
  label: string;
  x: number;
  z: number;
  size: number;
  marked?: boolean;
}> = [
  { id: "Pad1", label: "Pad A", x: -18, z: 12, size: 10, marked: true },
  { id: "Pad2", label: "Pad B", x: 22, z: -8, size: 8, marked: true },
  { id: "Pad3", label: "Pad 3", x: -12, z: -22, size: 7 },
];

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

  // Light joint cross on pad surface
  const j = box(`${name}_JointX`, size * 0.92, 0.03, 0.08, mats.oilStain, parent);
  j.position.set(x, 0.16, z);
  const jz = box(`${name}_JointZ`, 0.08, 0.03, size * 0.92, mats.oilStain, parent);
  jz.position.set(x, 0.16, z);

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

  // Corner trim bevels
  for (const [cx, cz] of [
    [-3.05, 2.25],
    [3.05, 2.25],
    [-3.05, -2.25],
    [3.05, -2.25],
  ] as const) {
    const trim = box(
      `ShedCorner_${cx}_${cz}`,
      0.12,
      3.2,
      0.12,
      mats.shedRoof,
      shed
    );
    trim.position.set(cx, 1.6, cz);
  }

  const doorRecess = box("ShedDoorRecess", 1.5, 2.2, 0.25, mats.shedDoor, shed);
  doorRecess.position.set(0, 1.1, 2.2);

  const doorPanel = box("ShedDoorPanel", 1.25, 2.0, 0.08, mats.shedDoor, shed);
  doorPanel.position.set(0, 1.05, 2.28);

  const doorHandle = box("ShedDoorHandle", 0.08, 0.08, 0.2, mats.steel, shed);
  doorHandle.position.set(0.45, 1.05, 2.36);

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

  const hvac = box("ShedHVAC", 1.4, 0.7, 1.1, mats.steelDark, shed);
  hvac.position.set(-1.6, 4.15, -0.3);

  const hvacFan = cyl("ShedHVACFan", 0.275, 0.275, 0.12, mats.steel, shed, 12);
  hvacFan.position.set(-1.6, 4.55, -0.3);

  // Foundation skirt
  const skirt = box("ShedSkirt", 6.2, 0.2, 4.7, mats.concrete, shed);
  skirt.position.y = 0.1;
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
        `FencePost_${postIdx}`,
        postW,
        postH,
        postW,
        mats.fence,
        fenceRoot
      );
      if (side.axis === "x") post.position.set(side.fixed, postH / 2, t);
      else post.position.set(t, postH / 2, side.fixed);

      // Cap
      const cap = box(
        `FenceCap_${postIdx}`,
        postW * 1.3,
        0.1,
        postW * 1.3,
        mats.steelDark,
        fenceRoot
      );
      if (side.axis === "x") cap.position.set(side.fixed, postH + 0.05, t);
      else cap.position.set(t, postH + 0.05, side.fixed);
      postIdx++;
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
  const body = box(name, w, h, d, mats.crate, parent);
  body.position.set(pos.x, pos.y + h / 2, pos.z);
  body.rotation.y = Math.random() * 0.4 - 0.2;

  const rimT = 0.06 * scale;
  const rim = box(`${name}_TopRim`, w + 0.04, rimT, d + 0.04, mats.steelDark, body);
  rim.position.set(0, h / 2 - rimT * 0.5, 0);

  const lab = box(
    `${name}_Label`,
    w * 0.45,
    h * 0.28,
    0.04,
    mats.crateLabel,
    body
  );
  lab.position.set(0, 0.05, d / 2 + 0.02);

  return {
    id: name,
    kind: "crate",
    mesh: body,
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

  // Lid
  const lid = cyl(
    `${name}_Lid`,
    diameter / 2 + 0.02,
    diameter / 2 + 0.02,
    0.06,
    mats.barrelLid,
    barrel,
    16
  );
  lid.position.y = height / 2 - 0.02;

  // Hoop bands
  for (const hy of [-0.28, 0.05, 0.32] as const) {
    const hoop = cyl(
      `${name}_Hoop_${hy}`,
      diameter / 2 + 0.015,
      diameter / 2 + 0.015,
      0.05,
      mats.steelDark,
      barrel,
      14
    );
    hoop.position.y = hy;
  }

  // Label block
  const label = box(`${name}_Label`, 0.04, 0.28, 0.35, mats.crateLabel, barrel);
  label.position.set(diameter / 2 + 0.01, 0.05, 0);

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

  // White stripe ring
  const stripe = cyl(`${name}_Stripe`, 0.09, 0.12, 0.08, mats.coneStripe, cone, 12);
  stripe.position.y = 0.05;

  // Base disc
  const base = cyl(`${name}_Base`, 0.2, 0.2, 0.05, mats.steelDark, cone, 12);
  base.position.y = -0.34;
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

function createPipeStack(
  name: string,
  mats: SharedMaterials,
  parent: Object3D,
  x: number,
  z: number
): void {
  const root = group(name, parent);
  root.position.set(x, 0, z);
  root.rotation.y = 0.35;

  let idx = 0;
  for (let row = 0; row < 3; row++) {
    const count = 3 - row;
    for (let i = 0; i < count; i++) {
      const pipe = cyl(
        `${name}_Pipe_${idx++}`,
        0.12,
        0.12,
        3.2,
        mats.steel,
        root,
        10
      );
      pipe.rotation.z = Math.PI / 2;
      const xOff = (i - (count - 1) / 2) * 0.28;
      pipe.position.set(xOff, 0.12 + row * 0.24, 0);
    }
  }
}

function createPallet(
  name: string,
  mats: SharedMaterials,
  parent: Object3D,
  x: number,
  z: number
): void {
  const root = group(name, parent);
  root.position.set(x, 0, z);

  const deck = box(`${name}_Deck`, 1.6, 0.08, 1.2, mats.crate, root);
  deck.position.y = 0.14;

  for (const ox of [-0.65, 0, 0.65] as const) {
    const runner = box(`${name}_Runner_${ox}`, 0.12, 0.12, 1.15, mats.crate, root);
    runner.position.set(ox, 0.06, 0);
  }
  // Small crate on pallet (dressing only)
  const top = box(`${name}_Box`, 0.9, 0.55, 0.7, mats.truckBox, root);
  top.position.y = 0.45;
  const lab = box(`${name}_Label`, 0.35, 0.2, 0.04, mats.crateLabel, root);
  lab.position.set(0, 0.5, 0.38);
}

export function createProps(scene: Scene, mats: SharedMaterials): PropsResult {
  const root = group("PropsRoot");
  scene.add(root);
  const loads: LoadItem[] = [];
  const pads: PadZone[] = [];

  for (const def of LOAD_PAD_LAYOUT) {
    const pad = createConcretePad(def.id, mats, root, def.x, def.z, def.size);
    pad.label = def.label;
    pad.marked = !!def.marked;
    pads.push(pad);
  }

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

  for (const def of LOAD_PAD_LAYOUT) {
    if (def.label === "Pad A") createPadMarker("A", mats, root, def.x, def.z);
    if (def.label === "Pad B") createPadMarker("B", mats, root, def.x, def.z);
  }

  // Pipe stacks + pallet (away from roads/pads)
  createPipeStack("PipeStack1", mats, root, 30, 18);
  createPipeStack("PipeStack2", mats, root, 32, 16);
  createPallet("Pallet1", mats, root, -22, -14);
  createPallet("Pallet2", mats, root, 18, 20);

  return { root, loads, pads };
}
