import {
  MeshBuilder,
  Scene,
  TransformNode,
  Vector3,
  Color3,
  StandardMaterial,
  Mesh,
} from "@babylonjs/core";
import { YARD_SIZE } from "../config/units";
import type { SharedMaterials } from "./materials";
import type { LoadItem, PadZone } from "../loads/types";

export interface PropsResult {
  root: TransformNode;
  loads: LoadItem[];
  pads: PadZone[];
}

function createConcretePad(
  name: string,
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode,
  x: number,
  z: number,
  size = 8
): PadZone {
  const pad = MeshBuilder.CreateBox(
    name,
    { width: size, height: 0.15, depth: size },
    scene
  );
  pad.position = new Vector3(x, 0.075, z);
  pad.material = mats.concrete;
  pad.parent = parent;
  pad.receiveShadows = true;

  return {
    id: name,
    label: name,
    center: new Vector3(x, 0, z),
    halfSize: size / 2,
    marked: false,
  };
}

function createShed(
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode,
  x: number,
  z: number
): void {
  const shed = new TransformNode("SchoolShed", scene);
  shed.parent = parent;
  shed.position = new Vector3(x, 0, z);

  const wall = MeshBuilder.CreateBox(
    "ShedBody",
    { width: 6, height: 3.2, depth: 4.5 },
    scene
  );
  wall.position.y = 1.6;
  wall.material = mats.shedWall;
  wall.parent = shed;

  // Door recess (front +Z)
  const doorRecess = MeshBuilder.CreateBox(
    "ShedDoorRecess",
    { width: 1.5, height: 2.2, depth: 0.25 },
    scene
  );
  doorRecess.position = new Vector3(0, 1.1, 2.2);
  doorRecess.material = mats.shedDoor;
  doorRecess.parent = shed;

  const doorPanel = MeshBuilder.CreateBox(
    "ShedDoorPanel",
    { width: 1.25, height: 2.0, depth: 0.08 },
    scene
  );
  doorPanel.position = new Vector3(0, 1.05, 2.28);
  doorPanel.material = mats.shedDoor;
  doorPanel.parent = shed;

  // Window quads (side walls)
  for (const [wx, wz] of [
    [-3.05, 0.4],
    [-3.05, -0.9],
    [3.05, 0.4],
    [3.05, -0.9],
  ] as const) {
    const frame = MeshBuilder.CreateBox(
      `ShedWinFrame_${wx}_${wz}`,
      { width: 0.12, height: 1.15, depth: 1.25 },
      scene
    );
    frame.position = new Vector3(wx, 1.85, wz);
    frame.material = mats.shedRoof;
    frame.parent = shed;

    const glass = MeshBuilder.CreateBox(
      `ShedWinGlass_${wx}_${wz}`,
      { width: 0.06, height: 0.95, depth: 1.05 },
      scene
    );
    glass.position = new Vector3(wx + Math.sign(wx) * 0.02, 1.85, wz);
    glass.material = mats.shedWindow;
    glass.parent = shed;
  }

  // Roof with stronger overhang
  const roofL = MeshBuilder.CreateBox(
    "ShedRoofL",
    { width: 7.0, height: 0.22, depth: 2.9 },
    scene
  );
  roofL.position = new Vector3(0, 3.55, -0.75);
  roofL.rotation.x = 0.35;
  roofL.material = mats.shedRoof;
  roofL.parent = shed;

  const roofR = MeshBuilder.CreateBox(
    "ShedRoofR",
    { width: 7.0, height: 0.22, depth: 2.9 },
    scene
  );
  roofR.position = new Vector3(0, 3.55, 0.75);
  roofR.rotation.x = -0.35;
  roofR.material = mats.shedRoof;
  roofR.parent = shed;

  // Ridge cap
  const ridge = MeshBuilder.CreateBox(
    "ShedRoofRidge",
    { width: 7.1, height: 0.14, depth: 0.35 },
    scene
  );
  ridge.position = new Vector3(0, 3.95, 0);
  ridge.material = mats.shedRoof;
  ridge.parent = shed;

  // Porch slab
  const porch = MeshBuilder.CreateBox(
    "ShedPorch",
    { width: 3.2, height: 0.18, depth: 1.6 },
    scene
  );
  porch.position = new Vector3(0, 0.09, 3.15);
  porch.material = mats.concrete;
  porch.parent = shed;

  // Optional HVAC box on roof
  const hvac = MeshBuilder.CreateBox(
    "ShedHVAC",
    { width: 1.4, height: 0.7, depth: 1.1 },
    scene
  );
  hvac.position = new Vector3(-1.6, 4.15, -0.3);
  hvac.material = mats.steel;
  hvac.parent = shed;

  const hvacFan = MeshBuilder.CreateCylinder(
    "ShedHVACFan",
    { height: 0.12, diameter: 0.55, tessellation: 12 },
    scene
  );
  hvacFan.position = new Vector3(-1.6, 4.55, -0.3);
  hvacFan.material = mats.steel;
  hvacFan.parent = shed;
}

/**
 * Chunky post+rail fence along yard edges (not skinny wire).
 * Gaps on axes for yard entrances.
 */
function createYardFence(
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode
): void {
  const fenceRoot = new TransformNode("YardFence", scene);
  fenceRoot.parent = parent;

  const half = YARD_SIZE / 2 - 1.5; // just inside grass edge
  const postH = 1.35;
  const postW = 0.28;
  const railH = 0.16;
  const railD = 0.2;
  const spacing = 4.5;
  const gateHalf = 5.5; // open gap centered on each axis

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
      // Skip gate openings near axis centers
      if (Math.abs(t) < gateHalf) continue;
      posts.push(t);
    }
    // Ensure end posts
    if (posts.length === 0 || posts[0]! > side.from + 0.1) {
      if (Math.abs(side.from) >= gateHalf) posts.unshift(side.from);
    }
    if (posts.length === 0 || posts[posts.length - 1]! < side.to - 0.1) {
      if (Math.abs(side.to) >= gateHalf) posts.push(side.to);
    }

    for (const t of posts) {
      const post = MeshBuilder.CreateBox(
        `FencePost_${postIdx++}`,
        { width: postW, height: postH, depth: postW },
        scene
      );
      if (side.axis === "x") {
        post.position = new Vector3(side.fixed, postH / 2, t);
      } else {
        post.position = new Vector3(t, postH / 2, side.fixed);
      }
      post.material = mats.fence;
      post.parent = fenceRoot;
    }

    // Rails between consecutive posts (skip large gaps = gates)
    for (let i = 0; i < posts.length - 1; i++) {
      const a = posts[i]!;
      const b = posts[i + 1]!;
      const span = b - a;
      if (span > spacing * 1.6) continue; // gate / missing segment

      const mid = (a + b) / 2;
      const len = span - postW * 0.4;

      for (const railY of [0.45, 0.95] as const) {
        const rail = MeshBuilder.CreateBox(
          `FenceRail_${railIdx++}`,
          side.axis === "x"
            ? { width: railD, height: railH, depth: len }
            : { width: len, height: railH, depth: railD },
          scene
        );
        if (side.axis === "x") {
          rail.position = new Vector3(side.fixed, railY, mid);
        } else {
          rail.position = new Vector3(mid, railY, side.fixed);
        }
        rail.material = mats.fence;
        rail.parent = fenceRoot;
      }
    }
  }
}

function createCrate(
  name: string,
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode,
  pos: Vector3,
  scale = 1
): LoadItem {
  const w = 1.2 * scale;
  const h = 1.0 * scale;
  const d = 1.2 * scale;
  const crate = MeshBuilder.CreateBox(
    name,
    { width: w, height: h, depth: d },
    scene
  );
  crate.position = pos.add(new Vector3(0, h / 2, 0));
  crate.material = mats.crate;
  crate.parent = parent;
  crate.rotation.y = Math.random() * 0.4 - 0.2;

  return {
    id: name,
    kind: "crate",
    mesh: crate,
    halfHeight: h / 2,
    radius: Math.max(w, d) / 2,
    attached: false,
    placed: false,
  };
}

function createBarrel(
  name: string,
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode,
  pos: Vector3,
  pickable = false
): LoadItem | null {
  const height = 1.1;
  const diameter = 0.7;
  const barrel = MeshBuilder.CreateCylinder(
    name,
    { height, diameter, tessellation: 16 },
    scene
  );
  barrel.position = pos.add(new Vector3(0, height / 2, 0));
  barrel.material = mats.barrel;
  barrel.parent = parent;

  if (!pickable) return null;

  return {
    id: name,
    kind: "barrel",
    mesh: barrel as Mesh,
    halfHeight: height / 2,
    radius: diameter / 2,
    attached: false,
    placed: false,
  };
}

function createCone(
  name: string,
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode,
  x: number,
  z: number
): void {
  const cone = MeshBuilder.CreateCylinder(
    name,
    { height: 0.7, diameterTop: 0.05, diameterBottom: 0.35, tessellation: 12 },
    scene
  );
  cone.position = new Vector3(x, 0.35, z);
  cone.material = mats.cones;
  cone.parent = parent;
}

function createPadMarker(
  label: "A" | "B",
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode,
  x: number,
  z: number
): void {
  const node = new TransformNode(`PadMarker${label}`, scene);
  node.parent = parent;
  node.position = new Vector3(x, 0, z);

  const disc = MeshBuilder.CreateCylinder(
    `MarkerDisc${label}`,
    { height: 0.08, diameter: 2.2, tessellation: 24 },
    scene
  );
  disc.position.y = 0.06;
  disc.material = label === "A" ? mats.markerA : mats.markerB;
  disc.parent = node;

  const bar = MeshBuilder.CreateBox(
    `MarkerGlyph${label}`,
    {
      width: label === "A" ? 0.15 : 0.9,
      height: 0.12,
      depth: label === "A" ? 1.1 : 0.15,
    },
    scene
  );
  bar.position.y = 0.16;
  const glyphMat = new StandardMaterial(`matGlyph${label}`, scene);
  glyphMat.diffuseColor = Color3.White();
  glyphMat.emissiveColor = Color3.White().scale(0.3);
  glyphMat.specularColor = Color3.Black();
  bar.material = glyphMat;
  bar.parent = node;

  if (label === "A") {
    const cross = MeshBuilder.CreateBox(
      "MarkerGlyphA_cross",
      { width: 0.9, height: 0.12, depth: 0.15 },
      scene
    );
    cross.position.y = 0.16;
    cross.material = glyphMat;
    cross.parent = node;
  }
}

/**
 * Yard props: concrete pads, school shed, fence, crates, barrels, cones, markers.
 * Returns pickable loads + pad zones for M2 grab/place.
 */
export function createProps(scene: Scene, mats: SharedMaterials): PropsResult {
  const root = new TransformNode("PropsRoot", scene);
  const loads: LoadItem[] = [];
  const pads: PadZone[] = [];

  const pad1 = createConcretePad("Pad1", scene, mats, root, -18, 12, 10);
  pad1.label = "Pad A";
  pad1.marked = true;
  pads.push(pad1);

  const pad2 = createConcretePad("Pad2", scene, mats, root, 22, -8, 8);
  pad2.label = "Pad B";
  pad2.marked = true;
  pads.push(pad2);

  const pad3 = createConcretePad("Pad3", scene, mats, root, -12, -22, 7);
  pad3.label = "Pad 3";
  pads.push(pad3);

  createShed(scene, mats, root, -28, 28);
  createYardFence(scene, mats, root);

  // Pickable crates near pads
  loads.push(createCrate("Crate1", scene, mats, root, new Vector3(-16, 0, 10)));
  loads.push(
    createCrate("Crate2", scene, mats, root, new Vector3(-14.5, 0, 11.2), 0.85)
  );
  loads.push(
    createCrate("Crate3", scene, mats, root, new Vector3(20, 0, -6), 1.1)
  );
  loads.push(
    createCrate("Crate4", scene, mats, root, new Vector3(21.5, 0, -7.5), 0.7)
  );

  // One pickable barrel + decorative barrels
  const b1 = createBarrel(
    "Barrel1",
    scene,
    mats,
    root,
    new Vector3(-10, 0, -20),
    true
  );
  if (b1) loads.push(b1);
  createBarrel("Barrel2", scene, mats, root, new Vector3(-9.1, 0, -20.8));
  createBarrel("Barrel3", scene, mats, root, new Vector3(24, 0, -10));

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
    createCone(`Cone${i}`, scene, mats, root, cx, cz);
  });

  createPadMarker("A", scene, mats, root, -18, 12);
  createPadMarker("B", scene, mats, root, 22, -8);

  return { root, loads, pads };
}
