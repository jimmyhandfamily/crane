import {
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { YARD_SIZE } from "../config/units";
import type { SharedMaterials } from "./materials";

/** Waypoint on the edge gravel path (stays clear of Pad A/B). */
interface Waypoint {
  x: number;
  z: number;
}

type TruckKind = "pickup" | "flatbed" | "box";

interface AmbientTruck {
  root: TransformNode;
  kind: TruckKind;
  /** Progress along path [0..pathLen], or -1 when waiting offsite. */
  t: number;
  speed: number;
  pauseAt: number;
  pauseLeft: number;
  waitLeft: number;
  /** Direction: +1 inbound/outbound along path, or -1 reverse exit. */
  dir: 1 | -1;
  phase: "wait" | "drive" | "pause" | "exit";
}

export interface AmbientTraffic {
  root: TransformNode;
  update(dt: number): void;
}

/**
 * Edge path: west gate → along west fence → pause near shed → out north gate.
 * Keeps clear of Pad A (-18,12) and Pad B (22,-8) and crane center.
 */
const EDGE_PATH: Waypoint[] = [
  { x: -YARD_SIZE / 2 - 8, z: 0 }, // outside west gate
  { x: -42, z: 0 },
  { x: -42, z: 18 },
  { x: -36, z: 24 }, // pause near shed (-28,28)
  { x: -36, z: 38 },
  { x: -12, z: 42 },
  { x: 0, z: 42 },
  { x: 0, z: YARD_SIZE / 2 + 8 }, // outside north gate
];

const PAUSE_INDEX = 3;

function pathLength(path: Waypoint[]): number {
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    len += Math.hypot(b.x - a.x, b.z - a.z);
  }
  return len;
}

function samplePath(
  path: Waypoint[],
  dist: number
): { pos: Vector3; yaw: number } {
  if (dist <= 0) {
    const a = path[0]!;
    const b = path[1]!;
    return {
      pos: new Vector3(a.x, 0, a.z),
      yaw: Math.atan2(b.x - a.x, b.z - a.z),
    };
  }
  let remaining = dist;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const seg = Math.hypot(b.x - a.x, b.z - a.z);
    if (remaining <= seg || i === path.length - 1) {
      const u = seg > 0 ? Math.min(1, remaining / seg) : 0;
      const x = a.x + (b.x - a.x) * u;
      const z = a.z + (b.z - a.z) * u;
      return {
        pos: new Vector3(x, 0, z),
        yaw: Math.atan2(b.x - a.x, b.z - a.z),
      };
    }
    remaining -= seg;
  }
  const last = path[path.length - 1]!;
  const prev = path[path.length - 2]!;
  return {
    pos: new Vector3(last.x, 0, last.z),
    yaw: Math.atan2(last.x - prev.x, last.z - prev.z),
  };
}

function distToIndex(path: Waypoint[], index: number): number {
  let len = 0;
  for (let i = 1; i <= index && i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    len += Math.hypot(b.x - a.x, b.z - a.z);
  }
  return len;
}

function addWheel(
  name: string,
  scene: Scene,
  parent: TransformNode,
  mat: StandardMaterial,
  x: number,
  z: number,
  y = 0.45
): void {
  // Chunky thick short cylinder, axis along X (sideways)
  const wheel = MeshBuilder.CreateCylinder(
    name,
    { height: 0.4, diameter: 0.9, tessellation: 10 },
    scene
  );
  wheel.rotation.z = Math.PI / 2;
  wheel.position = new Vector3(x, y, z);
  wheel.material = mat;
  wheel.parent = parent;
}

function createPickup(
  name: string,
  scene: Scene,
  mats: SharedMaterials,
  bodyMat: StandardMaterial
): TransformNode {
  // ~5.5 × 2 × 1.9 m
  const root = new TransformNode(name, scene);
  const cab = MeshBuilder.CreateBox(
    `${name}_Cab`,
    { width: 2.0, height: 1.5, depth: 2.2 },
    scene
  );
  cab.position = new Vector3(0, 1.15, 1.2);
  cab.material = bodyMat;
  cab.parent = root;

  const glass = MeshBuilder.CreateBox(
    `${name}_Glass`,
    { width: 1.7, height: 0.7, depth: 0.12 },
    scene
  );
  glass.position = new Vector3(0, 1.45, 2.25);
  glass.material = mats.glassDark;
  glass.parent = root;

  const bed = MeshBuilder.CreateBox(
    `${name}_Bed`,
    { width: 1.9, height: 0.45, depth: 2.8 },
    scene
  );
  bed.position = new Vector3(0, 0.75, -1.2);
  bed.material = mats.steel;
  bed.parent = root;

  const railL = MeshBuilder.CreateBox(
    `${name}_RailL`,
    { width: 0.1, height: 0.55, depth: 2.7 },
    scene
  );
  railL.position = new Vector3(-0.9, 1.15, -1.2);
  railL.material = mats.steel;
  railL.parent = root;
  const railR = railL.clone(`${name}_RailR`);
  railR.position.x = 0.9;
  railR.parent = root;

  for (const [wx, wz] of [
    [-0.85, 1.5],
    [0.85, 1.5],
    [-0.85, -1.8],
    [0.85, -1.8],
  ] as const) {
    addWheel(`${name}_Wheel_${wx}_${wz}`, scene, root, mats.wheel, wx, wz);
  }
  return root;
}

function createFlatbed(
  name: string,
  scene: Scene,
  mats: SharedMaterials,
  bodyMat: StandardMaterial
): TransformNode {
  // ~7 × 2.4 × 2.2 m
  const root = new TransformNode(name, scene);
  const cab = MeshBuilder.CreateBox(
    `${name}_Cab`,
    { width: 2.3, height: 1.7, depth: 2.4 },
    scene
  );
  cab.position = new Vector3(0, 1.35, 2.0);
  cab.material = bodyMat;
  cab.parent = root;

  const glass = MeshBuilder.CreateBox(
    `${name}_Glass`,
    { width: 1.9, height: 0.75, depth: 0.12 },
    scene
  );
  glass.position = new Vector3(0, 1.65, 3.15);
  glass.material = mats.glassDark;
  glass.parent = root;

  const deck = MeshBuilder.CreateBox(
    `${name}_Deck`,
    { width: 2.4, height: 0.35, depth: 4.2 },
    scene
  );
  deck.position = new Vector3(0, 0.85, -1.2);
  deck.material = mats.steel;
  deck.parent = root;

  for (const [wx, wz] of [
    [-1.05, 2.2],
    [1.05, 2.2],
    [-1.05, -0.2],
    [1.05, -0.2],
    [-1.05, -2.6],
    [1.05, -2.6],
  ] as const) {
    addWheel(`${name}_Wheel_${wx}_${wz}`, scene, root, mats.wheel, wx, wz, 0.5);
  }
  return root;
}

function createBoxTruck(
  name: string,
  scene: Scene,
  mats: SharedMaterials
): TransformNode {
  // ~8 × 2.5 × 3.2 m — tall rear box, optional yellow cab
  const root = new TransformNode(name, scene);
  const cab = MeshBuilder.CreateBox(
    `${name}_Cab`,
    { width: 2.4, height: 2.0, depth: 2.2 },
    scene
  );
  cab.position = new Vector3(0, 1.5, 2.6);
  cab.material = mats.craneYellow;
  cab.parent = root;

  const glass = MeshBuilder.CreateBox(
    `${name}_Glass`,
    { width: 2.0, height: 0.9, depth: 0.12 },
    scene
  );
  glass.position = new Vector3(0, 1.85, 3.65);
  glass.material = mats.glassDark;
  glass.parent = root;

  const box = MeshBuilder.CreateBox(
    `${name}_Box`,
    { width: 2.5, height: 2.8, depth: 5.2 },
    scene
  );
  box.position = new Vector3(0, 1.9, -0.8);
  box.material = mats.truckBox;
  box.parent = root;

  for (const [wx, wz] of [
    [-1.1, 2.6],
    [1.1, 2.6],
    [-1.1, 0.2],
    [1.1, 0.2],
    [-1.1, -2.6],
    [1.1, -2.6],
  ] as const) {
    addWheel(`${name}_Wheel_${wx}_${wz}`, scene, root, mats.wheel, wx, wz, 0.5);
  }
  return root;
}

function createParkedVan(
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode
): void {
  const van = new TransformNode("AmbientVanParked", scene);
  van.parent = parent;
  // Near shed (-28, 28), south-east of porch, clear of truck path
  van.position = new Vector3(-24, 0, 22);
  van.rotation.y = Math.PI * 0.15;

  const body = MeshBuilder.CreateBox(
    "AmbientVanParked_Body",
    { width: 2.1, height: 2.2, depth: 5.0 },
    scene
  );
  body.position.y = 1.4;
  body.material = mats.truckBlue;
  body.parent = van;

  const glass = MeshBuilder.CreateBox(
    "AmbientVanParked_Glass",
    { width: 1.8, height: 0.8, depth: 0.1 },
    scene
  );
  glass.position = new Vector3(0, 1.7, 2.45);
  glass.material = mats.glassDark;
  glass.parent = van;

  for (const [wx, wz] of [
    [-0.9, 1.6],
    [0.9, 1.6],
    [-0.9, -1.6],
    [0.9, -1.6],
  ] as const) {
    addWheel(`AmbientVanParked_Wheel_${wx}_${wz}`, scene, van, mats.wheel, wx, wz);
  }
}

function createGravelRoad(
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode
): void {
  const roadRoot = new TransformNode("GravelDriveway", scene);
  roadRoot.parent = parent;

  // West approach strip (through west gate along x, centered z=0)
  const westOuter = MeshBuilder.CreateGround(
    "GravelWestOuter",
    { width: 22, height: 7 },
    scene
  );
  westOuter.position = new Vector3(-44, 0.05, 0);
  westOuter.material = mats.gravel;
  westOuter.parent = roadRoot;
  westOuter.receiveShadows = true;

  const westCenter = MeshBuilder.CreateGround(
    "GravelWestCenter",
    { width: 20, height: 3.2 },
    scene
  );
  westCenter.position = new Vector3(-44, 0.06, 0);
  westCenter.material = mats.gravelLight;
  westCenter.parent = roadRoot;

  // North–south run along west edge toward shed
  const edgeOuter = MeshBuilder.CreateGround(
    "GravelEdgeOuter",
    { width: 7, height: 44 },
    scene
  );
  edgeOuter.position = new Vector3(-42, 0.05, 20);
  edgeOuter.material = mats.gravel;
  edgeOuter.parent = roadRoot;
  edgeOuter.receiveShadows = true;

  const edgeCenter = MeshBuilder.CreateGround(
    "GravelEdgeCenter",
    { width: 3.2, height: 42 },
    scene
  );
  edgeCenter.position = new Vector3(-42, 0.06, 20);
  edgeCenter.material = mats.gravelLight;
  edgeCenter.parent = roadRoot;

  // Spur toward shed pause area
  const spurOuter = MeshBuilder.CreateGround(
    "GravelSpurOuter",
    { width: 10, height: 7 },
    scene
  );
  spurOuter.position = new Vector3(-36, 0.05, 24);
  spurOuter.material = mats.gravel;
  spurOuter.parent = roadRoot;

  const spurCenter = MeshBuilder.CreateGround(
    "GravelSpurCenter",
    { width: 7, height: 3.2 },
    scene
  );
  spurCenter.position = new Vector3(-36, 0.06, 24);
  spurCenter.material = mats.gravelLight;
  spurCenter.parent = roadRoot;

  // North exit run
  const northOuter = MeshBuilder.CreateGround(
    "GravelNorthOuter",
    { width: 7, height: 20 },
    scene
  );
  northOuter.position = new Vector3(0, 0.05, 44);
  northOuter.material = mats.gravel;
  northOuter.parent = roadRoot;

  const northCenter = MeshBuilder.CreateGround(
    "GravelNorthCenter",
    { width: 3.2, height: 18 },
    scene
  );
  northCenter.position = new Vector3(0, 0.06, 44);
  northCenter.material = mats.gravelLight;
  northCenter.parent = roadRoot;

  // Connector from edge to north (along z≈42)
  const connOuter = MeshBuilder.CreateGround(
    "GravelConnOuter",
    { width: 36, height: 7 },
    scene
  );
  connOuter.position = new Vector3(-18, 0.05, 42);
  connOuter.material = mats.gravel;
  connOuter.parent = roadRoot;

  const connCenter = MeshBuilder.CreateGround(
    "GravelConnCenter",
    { width: 34, height: 3.2 },
    scene
  );
  connCenter.position = new Vector3(-18, 0.06, 42);
  connCenter.material = mats.gravelLight;
  connCenter.parent = roadRoot;

  // Tire track strips on gravel (#7A7160) — dual ruts along main runs
  const tracks: { name: string; w: number; d: number; x: number; z: number }[] = [
    { name: "TireTrackWestL", w: 18, d: 0.45, x: -44, z: -1.1 },
    { name: "TireTrackWestR", w: 18, d: 0.45, x: -44, z: 1.1 },
    { name: "TireTrackEdgeL", w: 0.45, d: 40, x: -43.1, z: 20 },
    { name: "TireTrackEdgeR", w: 0.45, d: 40, x: -40.9, z: 20 },
    { name: "TireTrackSpurL", w: 8, d: 0.45, x: -36, z: 22.9 },
    { name: "TireTrackSpurR", w: 8, d: 0.45, x: -36, z: 25.1 },
    { name: "TireTrackConnL", w: 32, d: 0.45, x: -18, z: 40.9 },
    { name: "TireTrackConnR", w: 32, d: 0.45, x: -18, z: 43.1 },
    { name: "TireTrackNorthL", w: 0.45, d: 16, x: -1.1, z: 44 },
    { name: "TireTrackNorthR", w: 0.45, d: 16, x: 1.1, z: 44 },
  ];
  for (const t of tracks) {
    const strip = MeshBuilder.CreateGround(t.name, { width: t.w, height: t.d }, scene);
    strip.position = new Vector3(t.x, 0.065, t.z);
    strip.material = mats.tireTrack;
    strip.parent = roadRoot;
  }
}

/**
 * Ambient site traffic: gravel edge driveway + looping cartoon trucks + parked van.
 * Kinematic only — does not touch crane gameplay / pads.
 */
export function createAmbientTraffic(
  scene: Scene,
  mats: SharedMaterials
): AmbientTraffic {
  const root = new TransformNode("AmbientTrafficRoot", scene);
  createGravelRoad(scene, mats, root);
  createParkedVan(scene, mats, root);

  const totalLen = pathLength(EDGE_PATH);
  const pauseDist = distToIndex(EDGE_PATH, PAUSE_INDEX);

  const specs: {
    name: string;
    kind: TruckKind;
    build: () => TransformNode;
    startWait: number;
    speed: number;
  }[] = [
    {
      name: "AmbientTruck1",
      kind: "pickup",
      build: () => createPickup("AmbientTruck1", scene, mats, mats.truckWhite),
      startWait: 0.5,
      speed: 9.5,
    },
    {
      name: "AmbientTruck2",
      kind: "flatbed",
      build: () => createFlatbed("AmbientTruck2", scene, mats, mats.truckBlue),
      startWait: 11,
      speed: 8.5,
    },
    {
      name: "AmbientTruck3",
      kind: "box",
      build: () => createBoxTruck("AmbientTruck3", scene, mats),
      startWait: 22,
      speed: 7.5,
    },
  ];

  const trucks: AmbientTruck[] = specs.map((s) => {
    const node = s.build();
    node.parent = root;
    node.setEnabled(false);
    return {
      root: node,
      kind: s.kind,
      t: 0,
      speed: s.speed,
      pauseAt: pauseDist,
      pauseLeft: 0,
      waitLeft: s.startWait,
      dir: 1,
      phase: "wait" as const,
    };
  });

  // Hide at start position
  for (const truck of trucks) {
    const { pos, yaw } = samplePath(EDGE_PATH, 0);
    truck.root.position.copyFrom(pos);
    truck.root.rotation.y = yaw;
  }

  const update = (dt: number): void => {
    for (const truck of trucks) {
      if (truck.phase === "wait") {
        truck.waitLeft -= dt;
        if (truck.waitLeft <= 0) {
          truck.phase = "drive";
          truck.t = 0;
          truck.dir = 1;
          truck.root.setEnabled(true);
        }
        continue;
      }

      if (truck.phase === "pause") {
        truck.pauseLeft -= dt;
        if (truck.pauseLeft <= 0) {
          truck.phase = "exit";
        }
        continue;
      }

      // drive or exit
      truck.t += truck.speed * dt * truck.dir;

      if (truck.phase === "drive" && truck.t >= truck.pauseAt) {
        truck.t = truck.pauseAt;
        truck.phase = "pause";
        // Brief staggered pause 2.5–4.5s
        truck.pauseLeft = 2.5 + Math.random() * 2;
      }

      if (truck.t >= totalLen) {
        truck.root.setEnabled(false);
        truck.phase = "wait";
        // Stagger respawn 8–18s so loops feel random
        truck.waitLeft = 8 + Math.random() * 10;
        truck.t = 0;
        continue;
      }

      const { pos, yaw } = samplePath(EDGE_PATH, Math.max(0, truck.t));
      truck.root.position.copyFrom(pos);
      truck.root.rotation.y = yaw;
    }
  };

  return { root, update };
}
