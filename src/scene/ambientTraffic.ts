import {
  MeshStandardMaterial,
  Object3D,
  Scene,
} from "three";
import { YARD_SIZE } from "../config/units";
import type { SharedMaterials } from "./materials";
import { box, cyl, groundPlane, group } from "./meshHelpers";

interface Waypoint {
  x: number;
  z: number;
}

type TruckKind = "pickup" | "flatbed" | "box" | "mixer";

interface AmbientTruck {
  root: Object3D;
  kind: TruckKind;
  t: number;
  speed: number;
  pauseAt: number;
  pauseLeft: number;
  waitLeft: number;
  dir: 1 | -1;
  phase: "wait" | "drive" | "pause" | "exit";
}

export interface AmbientTruckPose {
  x: number;
  z: number;
  visible: boolean;
  kind: TruckKind;
}

export interface AmbientTraffic {
  root: Object3D;
  update(dt: number): void;
  /** World XZ of active (or waiting-offmap) trucks for gate proximity. */
  getTruckPoses(): AmbientTruckPose[];
}

const EDGE_PATH: Waypoint[] = [
  { x: -YARD_SIZE / 2 - 8, z: 0 },
  { x: -42, z: 0 },
  { x: -42, z: 18 },
  { x: -36, z: 24 },
  { x: -36, z: 38 },
  { x: -12, z: 42 },
  { x: 0, z: 42 },
  { x: 0, z: YARD_SIZE / 2 + 8 },
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
): { x: number; z: number; yaw: number } {
  if (dist <= 0) {
    const a = path[0]!;
    const b = path[1]!;
    return { x: a.x, z: a.z, yaw: Math.atan2(b.x - a.x, b.z - a.z) };
  }
  let remaining = dist;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const seg = Math.hypot(b.x - a.x, b.z - a.z);
    if (remaining <= seg || i === path.length - 1) {
      const u = seg > 0 ? Math.min(1, remaining / seg) : 0;
      return {
        x: a.x + (b.x - a.x) * u,
        z: a.z + (b.z - a.z) * u,
        yaw: Math.atan2(b.x - a.x, b.z - a.z),
      };
    }
    remaining -= seg;
  }
  const last = path[path.length - 1]!;
  const prev = path[path.length - 2]!;
  return {
    x: last.x,
    z: last.z,
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
  parent: Object3D,
  mat: MeshStandardMaterial,
  x: number,
  z: number,
  y = 0.45
): void {
  const wheel = cyl(name, 0.45, 0.45, 0.4, mat, parent, 10);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, y, z);
}

function createPickup(
  name: string,
  mats: SharedMaterials,
  bodyMat: MeshStandardMaterial
): Object3D {
  const root = group(name);
  const cab = box(`${name}_Cab`, 2.0, 1.5, 2.2, bodyMat, root);
  cab.position.set(0, 1.15, 1.2);

  const glass = box(`${name}_Glass`, 1.7, 0.7, 0.12, mats.glassDark, root);
  glass.position.set(0, 1.45, 2.25);

  const bed = box(`${name}_Bed`, 1.9, 0.45, 2.8, mats.steel, root);
  bed.position.set(0, 0.75, -1.2);

  const railL = box(`${name}_RailL`, 0.1, 0.55, 2.7, mats.steel, root);
  railL.position.set(-0.9, 1.15, -1.2);
  const railR = box(`${name}_RailR`, 0.1, 0.55, 2.7, mats.steel, root);
  railR.position.set(0.9, 1.15, -1.2);

  for (const [wx, wz] of [
    [-0.85, 1.5],
    [0.85, 1.5],
    [-0.85, -1.8],
    [0.85, -1.8],
  ] as const) {
    addWheel(`${name}_Wheel_${wx}_${wz}`, root, mats.wheel, wx, wz);
  }
  return root;
}

function createFlatbed(
  name: string,
  mats: SharedMaterials,
  bodyMat: MeshStandardMaterial
): Object3D {
  const root = group(name);
  const cab = box(`${name}_Cab`, 2.3, 1.7, 2.4, bodyMat, root);
  cab.position.set(0, 1.35, 2.0);

  const glass = box(`${name}_Glass`, 1.9, 0.75, 0.12, mats.glassDark, root);
  glass.position.set(0, 1.65, 3.15);

  const deck = box(`${name}_Deck`, 2.4, 0.35, 4.2, mats.steel, root);
  deck.position.set(0, 0.85, -1.2);

  for (const [wx, wz] of [
    [-1.05, 2.2],
    [1.05, 2.2],
    [-1.05, -0.2],
    [1.05, -0.2],
    [-1.05, -2.6],
    [1.05, -2.6],
  ] as const) {
    addWheel(`${name}_Wheel_${wx}_${wz}`, root, mats.wheel, wx, wz, 0.5);
  }
  return root;
}

function createBoxTruck(name: string, mats: SharedMaterials): Object3D {
  const root = group(name);
  const cab = box(`${name}_Cab`, 2.4, 2.0, 2.2, mats.craneYellow, root);
  cab.position.set(0, 1.5, 2.6);

  const glass = box(`${name}_Glass`, 2.0, 0.9, 0.12, mats.glassDark, root);
  glass.position.set(0, 1.85, 3.65);

  const boxBody = box(`${name}_Box`, 2.5, 2.8, 5.2, mats.truckBox, root);
  boxBody.position.set(0, 1.9, -0.8);

  for (const [wx, wz] of [
    [-1.1, 2.6],
    [1.1, 2.6],
    [-1.1, 0.2],
    [1.1, 0.2],
    [-1.1, -2.6],
    [1.1, -2.6],
  ] as const) {
    addWheel(`${name}_Wheel_${wx}_${wz}`, root, mats.wheel, wx, wz, 0.5);
  }
  return root;
}


function createMixer(name: string, mats: SharedMaterials): Object3D {
  // Overall ~9×2.6×3.5 (L×W×H); fat drum ~15° tilt (Graphics proportions).
  const root = group(name);

  const chassis = box(`${name}_Chassis`, 2.4, 0.45, 7.2, mats.steel, root);
  chassis.position.set(0, 0.75, -0.4);

  const cab = box(`${name}_Cab`, 2.5, 2.3, 2.5, mats.craneYellow, root);
  cab.position.set(0, 1.85, 2.9);

  const glass = box(`${name}_Glass`, 2.1, 0.95, 0.12, mats.glassDark, root);
  glass.position.set(0, 2.15, 4.1);

  const fender = box(`${name}_Fender`, 2.55, 0.35, 1.8, mats.steel, root);
  fender.position.set(0, 1.05, 3.0);

  // Fat drum: radius ~1.2, length ~4.0, tilted ~15° nose-up toward cab
  const drum = cyl(`${name}_Drum`, 1.2, 1.2, 4.0, mats.steel, root, 20);
  drum.rotation.x = Math.PI / 2 + (15 * Math.PI) / 180;
  drum.position.set(0, 2.15, -1.35);

  const drumCap = cyl(`${name}_DrumCap`, 1.05, 1.05, 0.2, mats.truckWhite, root, 16);
  drumCap.rotation.x = Math.PI / 2 + (15 * Math.PI) / 180;
  drumCap.position.set(0, 2.55, 0.55);

  const hopper = box(`${name}_Hopper`, 1.4, 0.7, 1.2, mats.truckWhite, root);
  hopper.position.set(0, 3.05, 0.9);
  hopper.rotation.x = 0.2;

  const chute = box(`${name}_Chute`, 0.45, 0.25, 1.6, mats.steel, root);
  chute.position.set(0.9, 1.35, -3.2);
  chute.rotation.z = -0.35;
  chute.rotation.x = 0.25;

  for (const [wx, wz] of [
    [-1.15, 3.0],
    [1.15, 3.0],
    [-1.15, 0.6],
    [1.15, 0.6],
    [-1.15, -2.0],
    [1.15, -2.0],
    [-1.15, -3.4],
    [1.15, -3.4],
  ] as const) {
    addWheel(`${name}_Wheel_${wx}_${wz}`, root, mats.wheel, wx, wz, 0.5);
  }
  return root;
}

function createParkedVan(mats: SharedMaterials, parent: Object3D): void {
  const van = group("AmbientVanParked", parent);
  van.position.set(-24, 0, 22);
  van.rotation.y = Math.PI * 0.15;

  const body = box("AmbientVanParked_Body", 2.1, 2.2, 5.0, mats.truckBlue, van);
  body.position.y = 1.4;

  const glass = box("AmbientVanParked_Glass", 1.8, 0.8, 0.1, mats.glassDark, van);
  glass.position.set(0, 1.7, 2.45);

  for (const [wx, wz] of [
    [-0.9, 1.6],
    [0.9, 1.6],
    [-0.9, -1.6],
    [0.9, -1.6],
  ] as const) {
    addWheel(`AmbientVanParked_Wheel_${wx}_${wz}`, van, mats.wheel, wx, wz);
  }
}

function createGravelRoad(mats: SharedMaterials, parent: Object3D): void {
  const roadRoot = group("GravelDriveway", parent);

  const westOuter = groundPlane("GravelWestOuter", 22, 7, mats.gravel, roadRoot);
  westOuter.position.set(-44, 0.05, 0);

  const westCenter = groundPlane("GravelWestCenter", 20, 3.2, mats.gravelLight, roadRoot);
  westCenter.position.set(-44, 0.06, 0);

  const edgeOuter = groundPlane("GravelEdgeOuter", 7, 44, mats.gravel, roadRoot);
  edgeOuter.position.set(-42, 0.05, 20);

  const edgeCenter = groundPlane("GravelEdgeCenter", 3.2, 42, mats.gravelLight, roadRoot);
  edgeCenter.position.set(-42, 0.06, 20);

  const spurOuter = groundPlane("GravelSpurOuter", 10, 7, mats.gravel, roadRoot);
  spurOuter.position.set(-36, 0.05, 24);

  const spurCenter = groundPlane("GravelSpurCenter", 7, 3.2, mats.gravelLight, roadRoot);
  spurCenter.position.set(-36, 0.06, 24);

  const northOuter = groundPlane("GravelNorthOuter", 7, 20, mats.gravel, roadRoot);
  northOuter.position.set(0, 0.05, 44);

  const northCenter = groundPlane("GravelNorthCenter", 3.2, 18, mats.gravelLight, roadRoot);
  northCenter.position.set(0, 0.06, 44);

  const connOuter = groundPlane("GravelConnOuter", 36, 7, mats.gravel, roadRoot);
  connOuter.position.set(-18, 0.05, 42);

  const connCenter = groundPlane("GravelConnCenter", 34, 3.2, mats.gravelLight, roadRoot);
  connCenter.position.set(-18, 0.06, 42);

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
    const strip = groundPlane(t.name, t.w, t.d, mats.tireTrack, roadRoot);
    strip.position.set(t.x, 0.065, t.z);
  }
}

export function createAmbientTraffic(
  scene: Scene,
  mats: SharedMaterials
): AmbientTraffic {
  const root = group("AmbientTrafficRoot");
  scene.add(root);
  createGravelRoad(mats, root);
  createParkedVan(mats, root);

  const totalLen = pathLength(EDGE_PATH);
  const pauseDist = distToIndex(EDGE_PATH, PAUSE_INDEX);

  const specs: {
    name: string;
    kind: TruckKind;
    build: () => Object3D;
    startWait: number;
    speed: number;
  }[] = [
    {
      name: "AmbientTruck1",
      kind: "pickup",
      build: () => createPickup("AmbientTruck1", mats, mats.truckWhite),
      startWait: 0.5,
      speed: 9.5,
    },
    {
      name: "AmbientTruck2",
      kind: "flatbed",
      build: () => createFlatbed("AmbientTruck2", mats, mats.truckBlue),
      startWait: 11,
      speed: 8.5,
    },
    {
      name: "AmbientTruck3",
      kind: "box",
      build: () => createBoxTruck("AmbientTruck3", mats),
      startWait: 22,
      speed: 7.5,
    },
    {
      name: "AmbientMixer1",
      kind: "mixer",
      build: () => createMixer("AmbientMixer1", mats),
      startWait: 33,
      speed: 7.0,
    },
  ];

  const trucks: AmbientTruck[] = specs.map((s) => {
    const node = s.build();
    root.add(node);
    node.visible = false;
    return {
      root: node,
      kind: s.kind,
      t: 0,
      speed: s.speed,
      pauseAt: pauseDist,
      pauseLeft: 0,
      waitLeft: s.startWait,
      dir: 1 as const,
      phase: "wait" as const,
    };
  });

  for (const truck of trucks) {
    const s = samplePath(EDGE_PATH, 0);
    truck.root.position.set(s.x, 0, s.z);
    truck.root.rotation.y = s.yaw;
  }

  const update = (dt: number): void => {
    for (const truck of trucks) {
      if (truck.phase === "wait") {
        truck.waitLeft -= dt;
        if (truck.waitLeft <= 0) {
          truck.phase = "drive";
          truck.t = 0;
          truck.dir = 1;
          truck.root.visible = true;
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

      truck.t += truck.speed * dt * truck.dir;

      if (truck.phase === "drive" && truck.t >= truck.pauseAt) {
        truck.t = truck.pauseAt;
        truck.phase = "pause";
        truck.pauseLeft = 2.5 + Math.random() * 2;
      }

      if (truck.t >= totalLen) {
        truck.root.visible = false;
        truck.phase = "wait";
        truck.waitLeft = 8 + Math.random() * 10;
        truck.t = 0;
        continue;
      }

      const s = samplePath(EDGE_PATH, Math.max(0, truck.t));
      truck.root.position.set(s.x, 0, s.z);
      truck.root.rotation.y = s.yaw;
    }
  };

  const getTruckPoses = (): AmbientTruckPose[] =>
    trucks.map((t) => ({
      x: t.root.position.x,
      z: t.root.position.z,
      visible: t.root.visible && t.phase !== "wait",
      kind: t.kind,
    }));

  return { root, update, getTruckPoses };
}
