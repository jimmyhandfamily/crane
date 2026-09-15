import {
  Mesh,
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

type TruckPhase = "wait" | "drive" | "gateWait" | "shedPause" | "exit";

interface AmbientTruck {
  root: Object3D;
  kind: TruckKind;
  t: number;
  speed: number;
  maxSpeed: number;
  targetSpeed: number;
  waitLeft: number;
  shedPauseLeft: number;
  dir: 1 | -1;
  phase: TruckPhase;
  yaw: number;
  brakeL: Mesh | null;
  brakeR: Mesh | null;
  gateIndex: "west" | "north" | null;
}

export interface AmbientTruckPose {
  x: number;
  z: number;
  visible: boolean;
  kind: TruckKind;
}

export interface GateOpenAmounts {
  west: number;
  north: number;
}

export interface AmbientTraffic {
  root: Object3D;
  update(dt: number, gates?: GateOpenAmounts): void;
  /** World XZ of active (or waiting-offmap) trucks for gate proximity. */
  getTruckPoses(): AmbientTruckPose[];
}

/** Continuous site loop: W gate → west lane → N connector → N gate. */
const LOOP_PATH: Waypoint[] = [
  { x: -YARD_SIZE / 2 - 8, z: 0 }, // 0 approach west
  { x: -YARD_SIZE / 2 + 1.5, z: 0 }, // 1 west gate line (~-48.5)
  { x: -42, z: 0 }, // 2 inside west apron
  { x: -42, z: 12 }, // 3 west lane
  { x: -42, z: 24 }, // 4 approaching shed spur junction
  { x: -42, z: 32 }, // 5 past spur (shed pause nearby)
  { x: -42, z: 40 }, // 6 NW corner approach
  { x: -36, z: 42 }, // 7 onto N connector
  { x: -18, z: 42 }, // 8 N connector mid
  { x: -6, z: 42 }, // 9
  { x: 0, z: 42 }, // 10 inside north apron
  { x: 0, z: YARD_SIZE / 2 - 1.5 }, // 11 north gate (~48.5)
  { x: 0, z: YARD_SIZE / 2 + 8 }, // 12 exit north
];

const WEST_GATE_IDX = 1;
const SHED_PAUSE_IDX = 5;
const NORTH_GATE_IDX = 11;
const GATE_OPEN_NEED = 0.72;
const ACCEL = 2.2; // m/s²
const DECEL = 3.6;
const SHED_SLOW = 0.45; // fraction of max near shed

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

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function addWheel(
  name: string,
  parent: Object3D,
  mat: MeshStandardMaterial,
  x: number,
  z: number,
  y = 0.45,
  wellMat?: MeshStandardMaterial
): void {
  const wheel = cyl(name, 0.48, 0.48, 0.38, mat, parent, 12);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, y, z);
  const hub = cyl(`${name}_Hub`, 0.16, 0.16, 0.42, mat, parent, 8);
  hub.rotation.z = Math.PI / 2;
  hub.position.set(x, y, z);
  if (wellMat) {
    const fender = box(`${name}_Fender`, 0.5, 0.32, 0.9, wellMat, parent);
    fender.position.set(x > 0 ? x - 0.05 : x + 0.05, y + 0.38, z);
  }
}

function addBrakeLights(
  name: string,
  root: Object3D,
  mats: SharedMaterials,
  z: number,
  y = 0.85,
  spread = 0.7
): { l: Mesh; r: Mesh } {
  const matL = mats.brakeLight.clone();
  matL.name = `${name}_BrakeMatL`;
  matL.emissive.set("#A03028");
  matL.emissiveIntensity = 0.12;
  const matR = mats.brakeLight.clone();
  matR.name = `${name}_BrakeMatR`;
  matR.emissive.set("#A03028");
  matR.emissiveIntensity = 0.12;
  const l = box(`${name}_BrakeL`, 0.22, 0.14, 0.08, matL, root);
  l.position.set(-spread, y, z);
  const r = box(`${name}_BrakeR`, 0.22, 0.14, 0.08, matR, root);
  r.position.set(spread, y, z);
  return { l, r };
}

function setBrakeLit(truck: AmbientTruck, on: boolean, _mats: SharedMaterials): void {
  const intensity = on ? 1.5 : 0.12;
  for (const m of [truck.brakeL, truck.brakeR]) {
    if (!m) continue;
    const mat = m.material as MeshStandardMaterial;
    mat.emissive.set(on ? "#C04030" : "#A03028");
    mat.emissiveIntensity = intensity;
  }
}

function createPickup(
  name: string,
  mats: SharedMaterials,
  bodyMat: MeshStandardMaterial
): { root: Object3D; brakeL: Mesh; brakeR: Mesh } {
  const root = group(name);
  // Rounded cab: main + roof + nose chamfer volumes
  const cab = box(`${name}_Cab`, 1.95, 1.35, 2.0, bodyMat, root);
  cab.position.set(0, 1.25, 1.15);
  const cabRoof = box(`${name}_CabRoof`, 1.85, 0.22, 1.85, bodyMat, root);
  cabRoof.position.set(0, 2.0, 1.1);
  const nose = box(`${name}_Nose`, 1.9, 0.55, 0.7, bodyMat, root);
  nose.position.set(0, 0.85, 2.35);
  const hoodRound = cyl(`${name}_HoodRound`, 0.95, 0.95, 1.85, bodyMat, root, 12);
  hoodRound.rotation.z = Math.PI / 2;
  hoodRound.position.set(0, 0.95, 2.15);
  hoodRound.scale.set(1, 0.35, 0.55);

  const glass = box(`${name}_Glass`, 1.65, 0.65, 0.1, mats.glassDark, root);
  glass.position.set(0, 1.55, 2.12);
  for (const sx of [-1, 1] as const) {
    const sg = box(`${name}_SideGlass_${sx}`, 0.08, 0.55, 1.1, mats.glassDark, root);
    sg.position.set(sx * 1.0, 1.5, 1.15);
  }

  const bed = box(`${name}_Bed`, 1.9, 0.4, 2.7, mats.steel, root);
  bed.position.set(0, 0.8, -1.25);
  const railL = box(`${name}_RailL`, 0.08, 0.5, 2.6, mats.steel, root);
  railL.position.set(-0.92, 1.15, -1.25);
  const railR = box(`${name}_RailR`, 0.08, 0.5, 2.6, mats.steel, root);
  railR.position.set(0.92, 1.15, -1.25);

  for (const [wx, wz] of [
    [-0.88, 1.45],
    [0.88, 1.45],
    [-0.88, -1.75],
    [0.88, -1.75],
  ] as const) {
    addWheel(`${name}_Wheel_${wx}_${wz}`, root, mats.wheel, wx, wz, 0.45, bodyMat);
  }
  const brakes = addBrakeLights(name, root, mats, -2.55, 0.9, 0.75);
  return { root, brakeL: brakes.l, brakeR: brakes.r };
}

function createFlatbed(
  name: string,
  mats: SharedMaterials,
  bodyMat: MeshStandardMaterial
): { root: Object3D; brakeL: Mesh; brakeR: Mesh } {
  const root = group(name);
  const cab = box(`${name}_Cab`, 2.25, 1.55, 2.2, bodyMat, root);
  cab.position.set(0, 1.45, 2.0);
  const cabRoof = box(`${name}_CabRoof`, 2.15, 0.2, 2.05, bodyMat, root);
  cabRoof.position.set(0, 2.3, 1.95);
  const bumper = box(`${name}_Bumper`, 2.35, 0.35, 0.35, mats.steelDark, root);
  bumper.position.set(0, 0.65, 3.2);

  const glass = box(`${name}_Glass`, 1.85, 0.7, 0.1, mats.glassDark, root);
  glass.position.set(0, 1.75, 3.05);

  const deck = box(`${name}_Deck`, 2.4, 0.32, 4.2, mats.steel, root);
  deck.position.set(0, 0.9, -1.2);
  // Side rails
  for (const sx of [-1.15, 1.15] as const) {
    const rail = box(`${name}_DeckRail`, 0.08, 0.4, 4.0, mats.steelDark, root);
    rail.position.set(sx, 1.2, -1.2);
  }

  for (const [wx, wz] of [
    [-1.05, 2.2],
    [1.05, 2.2],
    [-1.05, -0.2],
    [1.05, -0.2],
    [-1.05, -2.6],
    [1.05, -2.6],
  ] as const) {
    addWheel(`${name}_Wheel_${wx}_${wz}`, root, mats.wheel, wx, wz, 0.5, bodyMat);
  }
  const brakes = addBrakeLights(name, root, mats, -3.25, 0.95, 0.95);
  return { root, brakeL: brakes.l, brakeR: brakes.r };
}

function createBoxTruck(
  name: string,
  mats: SharedMaterials
): { root: Object3D; brakeL: Mesh; brakeR: Mesh } {
  const root = group(name);
  const cab = box(`${name}_Cab`, 2.35, 1.85, 2.0, mats.craneYellow, root);
  cab.position.set(0, 1.55, 2.65);
  const cabRoof = box(`${name}_CabRoof`, 2.25, 0.22, 1.9, mats.craneYellow, root);
  cabRoof.position.set(0, 2.55, 2.6);
  const sleeper = box(`${name}_Sleeper`, 2.3, 1.2, 0.9, mats.craneYellow, root);
  sleeper.position.set(0, 2.1, 1.55);

  const glass = box(`${name}_Glass`, 1.95, 0.85, 0.1, mats.glassDark, root);
  glass.position.set(0, 1.9, 3.6);

  const boxBody = box(`${name}_Box`, 2.5, 2.7, 5.1, mats.truckBox, root);
  boxBody.position.set(0, 1.95, -0.85);
  const boxRib = box(`${name}_BoxRib`, 2.55, 0.12, 5.0, mats.steelDark, root);
  boxRib.position.set(0, 3.25, -0.85);

  for (const [wx, wz] of [
    [-1.1, 2.6],
    [1.1, 2.6],
    [-1.1, 0.2],
    [1.1, 0.2],
    [-1.1, -2.6],
    [1.1, -2.6],
  ] as const) {
    addWheel(`${name}_Wheel_${wx}_${wz}`, root, mats.wheel, wx, wz, 0.5, mats.craneYellow);
  }
  const brakes = addBrakeLights(name, root, mats, -3.35, 1.1, 1.0);
  return { root, brakeL: brakes.l, brakeR: brakes.r };
}

function createMixer(
  name: string,
  mats: SharedMaterials
): { root: Object3D; brakeL: Mesh; brakeR: Mesh } {
  const root = group(name);

  const chassis = box(`${name}_Chassis`, 2.4, 0.42, 7.2, mats.steel, root);
  chassis.position.set(0, 0.75, -0.4);

  const cab = box(`${name}_Cab`, 2.4, 2.1, 2.3, mats.craneYellow, root);
  cab.position.set(0, 1.9, 2.95);
  const cabRoof = box(`${name}_CabRoof`, 2.3, 0.22, 2.15, mats.craneYellow, root);
  cabRoof.position.set(0, 3.05, 2.9);
  const bumper = box(`${name}_Bumper`, 2.5, 0.4, 0.4, mats.steelDark, root);
  bumper.position.set(0, 0.7, 4.15);

  const glass = box(`${name}_Glass`, 2.05, 0.9, 0.1, mats.glassDark, root);
  glass.position.set(0, 2.2, 4.05);

  const fender = box(`${name}_Fender`, 2.55, 0.35, 1.8, mats.steel, root);
  fender.position.set(0, 1.05, 3.0);

  // Tapered drum (wider mid, narrower ends) + spiral fins
  const drum = cyl(`${name}_Drum`, 1.05, 1.25, 3.6, mats.steel, root, 24);
  drum.rotation.x = Math.PI / 2 + (15 * Math.PI) / 180;
  drum.position.set(0, 2.2, -1.2);
  const drumRear = cyl(`${name}_DrumRear`, 0.95, 1.05, 0.9, mats.steelDark, root, 20);
  drumRear.rotation.x = Math.PI / 2 + (15 * Math.PI) / 180;
  drumRear.position.set(0, 1.85, -3.0);
  for (let f = 0; f < 4; f++) {
    const fin = box(`${name}_DrumFin_${f}`, 0.08, 0.35, 3.2, mats.truckWhite, root);
    fin.position.set(0, 2.2, -1.25);
    fin.rotation.x = (15 * Math.PI) / 180;
    fin.rotation.z = (f * Math.PI) / 2;
  }

  const drumCap = cyl(`${name}_DrumCap`, 0.9, 0.9, 0.22, mats.truckWhite, root, 16);
  drumCap.rotation.x = Math.PI / 2 + (15 * Math.PI) / 180;
  drumCap.position.set(0, 2.55, 0.55);

  const hopper = box(`${name}_Hopper`, 1.35, 0.65, 1.1, mats.truckWhite, root);
  hopper.position.set(0, 3.1, 0.95);
  hopper.rotation.x = 0.2;

  const chute = box(`${name}_Chute`, 0.42, 0.22, 1.6, mats.steel, root);
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
    addWheel(`${name}_Wheel_${wx}_${wz}`, root, mats.wheel, wx, wz, 0.5, mats.craneYellow);
  }
  const brakes = addBrakeLights(name, root, mats, -4.0, 1.0, 1.05);
  return { root, brakeL: brakes.l, brakeR: brakes.r };
}

function createParkedVan(mats: SharedMaterials, parent: Object3D): void {
  // Parked on shed spur (not on the mover loop)
  const van = group("AmbientVanParked", parent);
  van.position.set(-33.5, 0.02, 28);
  van.rotation.y = Math.PI * 0.5; // nose toward west lane

  const body = box("AmbientVanParked_Body", 2.1, 2.0, 4.8, mats.truckBlue, van);
  body.position.y = 1.35;
  const roof = box("AmbientVanParked_Roof", 2.0, 0.25, 4.6, mats.truckBlue, van);
  roof.position.y = 2.45;
  const glass = box("AmbientVanParked_Glass", 1.8, 0.75, 0.1, mats.glassDark, van);
  glass.position.set(0, 1.75, 2.35);

  for (const [wx, wz] of [
    [-0.9, 1.6],
    [0.9, 1.6],
    [-0.9, -1.6],
    [0.9, -1.6],
  ] as const) {
    addWheel(`AmbientVanParked_Wheel_${wx}_${wz}`, van, mats.wheel, wx, wz);
  }
}

/**
 * Continuous gravel network:
 * W gate apron → west lane → NW corner → N connector → N gate apron + shed spur.
 * Lane ~6.5 m, center strip, shoulders; raised slightly; no gravel on pads.
 */
function createGravelRoad(mats: SharedMaterials, parent: Object3D): void {
  const roadRoot = group("GravelDriveway", parent);
  const laneW = 6.5;
  const centerW = 2.4;
  const shoulderW = 1.1;
  const yRoad = 0.055;
  const yCenter = 0.062;
  const yShoulder = 0.04;
  const yTrack = 0.068;

  const placeSeg = (
    name: string,
    cx: number,
    cz: number,
    alongX: number,
    alongZ: number,
    yaw: number
  ): void => {
    // Outer lane
    const outer = groundPlane(
      `${name}_Lane`,
      alongX,
      alongZ,
      mats.gravel,
      roadRoot
    );
    outer.position.set(cx, yRoad, cz);
    outer.rotation.z = 0;
    outer.rotation.y = yaw;

    // After rot.x=-π/2 on plane: local width→X, depth→Z; yaw rotates in horizontal.
    // For axis-aligned we pass width/depth already matching world axes when yaw=0.
  };

  // Helper: axis-aligned segments (yaw 0) — width along X, depth along Z
  const aa = (
    name: string,
    cx: number,
    cz: number,
    w: number,
    d: number
  ): void => {
    const outer = groundPlane(`${name}_Lane`, w, d, mats.gravel, roadRoot);
    outer.position.set(cx, yRoad, cz);
    const center = groundPlane(
      `${name}_Center`,
      Math.min(centerW, w * 0.4),
      d * 0.96,
      mats.gravelLight,
      roadRoot
    );
    center.position.set(cx, yCenter, cz);
    // Shoulders (edge gravel)
    const shL = groundPlane(
      `${name}_ShL`,
      shoulderW,
      d * 0.98,
      mats.gravelEdge,
      roadRoot
    );
    shL.position.set(cx - w / 2 - shoulderW / 2, yShoulder, cz);
    const shR = groundPlane(
      `${name}_ShR`,
      shoulderW,
      d * 0.98,
      mats.gravelEdge,
      roadRoot
    );
    shR.position.set(cx + w / 2 + shoulderW / 2, yShoulder, cz);
    // Tire tracks
    const trackOff = 1.35;
    const tL = groundPlane(
      `${name}_TrackL`,
      0.4,
      d * 0.9,
      mats.tireTrack,
      roadRoot
    );
    tL.position.set(cx - trackOff, yTrack, cz);
    const tR = groundPlane(
      `${name}_TrackR`,
      0.4,
      d * 0.9,
      mats.tireTrack,
      roadRoot
    );
    tR.position.set(cx + trackOff, yTrack, cz);
  };

  // Horizontal segment (road runs along X): width=length along X, depth=lane width along Z
  const hz = (
    name: string,
    cx: number,
    cz: number,
    len: number,
    w = laneW
  ): void => {
    const outer = groundPlane(`${name}_Lane`, len, w, mats.gravel, roadRoot);
    outer.position.set(cx, yRoad, cz);
    const center = groundPlane(
      `${name}_Center`,
      len * 0.96,
      centerW,
      mats.gravelLight,
      roadRoot
    );
    center.position.set(cx, yCenter, cz);
    const shN = groundPlane(
      `${name}_ShN`,
      len * 0.98,
      shoulderW,
      mats.gravelEdge,
      roadRoot
    );
    shN.position.set(cx, yShoulder, cz + w / 2 + shoulderW / 2);
    const shS = groundPlane(
      `${name}_ShS`,
      len * 0.98,
      shoulderW,
      mats.gravelEdge,
      roadRoot
    );
    shS.position.set(cx, yShoulder, cz - w / 2 - shoulderW / 2);
    const trackOff = 1.35;
    const tN = groundPlane(
      `${name}_TrackN`,
      len * 0.9,
      0.4,
      mats.tireTrack,
      roadRoot
    );
    tN.position.set(cx, yTrack, cz + trackOff);
    const tS = groundPlane(
      `${name}_TrackS`,
      len * 0.9,
      0.4,
      mats.tireTrack,
      roadRoot
    );
    tS.position.set(cx, yTrack, cz - trackOff);
  };

  // --- Gate aprons 10×8 ---
  const westApron = groundPlane("GateApronWest", 10, 8, mats.gravel, roadRoot);
  westApron.position.set(-YARD_SIZE / 2 + 1, yRoad + 0.005, 0);
  const westApronC = groundPlane(
    "GateApronWestCenter",
    8,
    3,
    mats.gravelLight,
    roadRoot
  );
  westApronC.position.set(-YARD_SIZE / 2 + 1, yCenter + 0.002, 0);

  const northApron = groundPlane("GateApronNorth", 8, 10, mats.gravel, roadRoot);
  northApron.position.set(0, yRoad + 0.005, YARD_SIZE / 2 - 1);
  const northApronC = groundPlane(
    "GateApronNorthCenter",
    3,
    8,
    mats.gravelLight,
    roadRoot
  );
  northApronC.position.set(0, yCenter + 0.002, YARD_SIZE / 2 - 1);

  // Outside approaches (short)
  hz("ApproachWest", -YARD_SIZE / 2 - 4, 0, 8, laneW);
  aa("ApproachNorth", 0, YARD_SIZE / 2 + 4, laneW, 8);

  // West lane: x=-42, z=0 → z=42 (clear of crane pad ±14 and Pad A)
  aa("WestLane", -42, 21, laneW, 42);

  // NW corner pad (connects west lane to N connector)
  const corner = groundPlane("CornerNW", 10, 10, mats.gravel, roadRoot);
  corner.position.set(-39, yRoad + 0.002, 39);
  const cornerC = groundPlane("CornerNWCenter", 4, 4, mats.gravelLight, roadRoot);
  cornerC.position.set(-39, yCenter + 0.002, 39);

  // North connector: z=42, x=-42 → x=0
  hz("NorthConn", -21, 42, 42, laneW);

  // Shed spur: from west lane east toward shed (van parks here) — stops short of shed
  hz("ShedSpur", -36.5, 28, 11, 5.5);

  // Soft dirt shoulders / berms along west lane outer edge
  const bermStrip = (
    name: string,
    cx: number,
    cz: number,
    w: number,
    d: number
  ): void => {
    const b = groundPlane(name, w, d, mats.berm, roadRoot);
    b.position.set(cx, 0.028, cz);
  };
  bermStrip("RoadBermWestOuter", -42 - laneW / 2 - 2.2, 21, 2.8, 40);
  bermStrip("RoadBermNorthOuter", -21, 42 + laneW / 2 + 2.2, 40, 2.8);

  void placeSeg;
}

export function createAmbientTraffic(
  scene: Scene,
  mats: SharedMaterials
): AmbientTraffic {
  const root = group("AmbientTrafficRoot");
  scene.add(root);
  createGravelRoad(mats, root);
  createParkedVan(mats, root);

  const totalLen = pathLength(LOOP_PATH);
  const westGateDist = distToIndex(LOOP_PATH, WEST_GATE_IDX);
  const shedPauseDist = distToIndex(LOOP_PATH, SHED_PAUSE_IDX);
  const northGateDist = distToIndex(LOOP_PATH, NORTH_GATE_IDX);

  const specs: {
    name: string;
    kind: TruckKind;
    build: () => { root: Object3D; brakeL: Mesh; brakeR: Mesh };
    startWait: number;
    maxSpeed: number;
  }[] = [
    {
      name: "AmbientTruck1",
      kind: "pickup",
      build: () => createPickup("AmbientTruck1", mats, mats.truckWhite),
      startWait: 1.5,
      maxSpeed: 7.0,
    },
    {
      name: "AmbientTruck2",
      kind: "flatbed",
      build: () => createFlatbed("AmbientTruck2", mats, mats.truckBlue),
      startWait: 18,
      maxSpeed: 6.2,
    },
    {
      name: "AmbientTruck3",
      kind: "box",
      build: () => createBoxTruck("AmbientTruck3", mats),
      startWait: 36,
      maxSpeed: 5.5,
    },
    {
      name: "AmbientMixer1",
      kind: "mixer",
      build: () => createMixer("AmbientMixer1", mats),
      startWait: 55,
      maxSpeed: 4.5,
    },
  ];

  const trucks: AmbientTruck[] = specs.map((s) => {
    const built = s.build();
    root.add(built.root);
    built.root.visible = false;
    return {
      root: built.root,
      kind: s.kind,
      t: 0,
      speed: 0,
      maxSpeed: s.maxSpeed,
      targetSpeed: 0,
      waitLeft: s.startWait,
      shedPauseLeft: 0,
      dir: 1 as const,
      phase: "wait" as const,
      yaw: 0,
      brakeL: built.brakeL,
      brakeR: built.brakeR,
      gateIndex: null,
    };
  });

  for (const truck of trucks) {
    const s = samplePath(LOOP_PATH, 0);
    truck.root.position.set(s.x, 0.02, s.z);
    truck.yaw = s.yaw;
    truck.root.rotation.y = s.yaw;
  }

  const nearShed = (t: number): boolean =>
    Math.abs(t - shedPauseDist) < 14 || (t > shedPauseDist - 18 && t < shedPauseDist + 6);

  const update = (dt: number, gates?: GateOpenAmounts): void => {
    const westOpen = gates?.west ?? 1;
    const northOpen = gates?.north ?? 1;

    for (const truck of trucks) {
      if (truck.phase === "wait") {
        truck.waitLeft -= dt;
        truck.speed = 0;
        setBrakeLit(truck, false, mats);
        if (truck.waitLeft <= 0) {
          truck.phase = "drive";
          truck.t = 0;
          truck.dir = 1;
          truck.speed = 0;
          truck.targetSpeed = truck.maxSpeed;
          truck.root.visible = true;
          truck.gateIndex = null;
        }
        continue;
      }

      if (truck.phase === "gateWait") {
        truck.targetSpeed = 0;
        truck.speed = Math.max(0, truck.speed - DECEL * dt);
        setBrakeLit(truck, true, mats);
        const open =
          truck.gateIndex === "west"
            ? westOpen
            : truck.gateIndex === "north"
              ? northOpen
              : 1;
        if (open >= GATE_OPEN_NEED) {
          truck.phase = truck.gateIndex === "west" ? "drive" : "exit";
          truck.gateIndex = null;
          truck.targetSpeed = nearShed(truck.t)
            ? truck.maxSpeed * SHED_SLOW
            : truck.maxSpeed;
        }
        // Hold position while waiting
        const s = samplePath(LOOP_PATH, Math.max(0, truck.t));
        truck.root.position.set(s.x, 0.02, s.z);
        truck.yaw = lerpAngle(truck.yaw, s.yaw, Math.min(1, 6 * dt));
        truck.root.rotation.y = truck.yaw;
        continue;
      }

      if (truck.phase === "shedPause") {
        truck.targetSpeed = 0;
        truck.speed = Math.max(0, truck.speed - DECEL * dt);
        setBrakeLit(truck, true, mats);
        truck.shedPauseLeft -= dt;
        if (truck.shedPauseLeft <= 0) {
          truck.phase = "drive";
          truck.shedPauseLeft = -1; // already paused this lap
          truck.targetSpeed = truck.maxSpeed * 0.85;
        }
        const s = samplePath(LOOP_PATH, Math.max(0, truck.t));
        truck.root.position.set(s.x, 0.02, s.z);
        continue;
      }

      // Desired speed
      let want = truck.maxSpeed;
      if (nearShed(truck.t)) want = truck.maxSpeed * SHED_SLOW;
      // Approach gates: decelerate early
      if (
        truck.phase === "drive" &&
        truck.t < westGateDist &&
        westGateDist - truck.t < 10
      ) {
        want = Math.min(want, 2.5);
      }
      if (
        (truck.phase === "drive" || truck.phase === "exit") &&
        truck.t < northGateDist &&
        northGateDist - truck.t < 12
      ) {
        want = Math.min(want, 2.5);
      }
      truck.targetSpeed = want;

      // Accel / decel toward target
      if (truck.speed < truck.targetSpeed) {
        truck.speed = Math.min(
          truck.targetSpeed,
          truck.speed + ACCEL * dt
        );
        setBrakeLit(truck, false, mats);
      } else if (truck.speed > truck.targetSpeed) {
        truck.speed = Math.max(
          truck.targetSpeed,
          truck.speed - DECEL * dt
        );
        setBrakeLit(truck, true, mats);
      } else {
        setBrakeLit(truck, false, mats);
      }

      truck.t += truck.speed * dt * truck.dir;

      // West gate wait
      if (
        truck.phase === "drive" &&
        truck.t >= westGateDist - 0.15 &&
        truck.t <= westGateDist + 1.5 &&
        westOpen < GATE_OPEN_NEED
      ) {
        truck.t = westGateDist;
        truck.phase = "gateWait";
        truck.gateIndex = "west";
        truck.speed = 0;
        continue;
      }

      // Shed pause (once past junction)
      if (
        truck.phase === "drive" &&
        truck.t >= shedPauseDist &&
        truck.shedPauseLeft === 0 &&
        truck.t < shedPauseDist + 1.2
      ) {
        truck.t = shedPauseDist;
        truck.phase = "shedPause";
        truck.shedPauseLeft = 2.2 + Math.random() * 1.8;
        truck.speed = 0;
        continue;
      }

      // North gate wait
      if (
        (truck.phase === "drive" || truck.phase === "exit") &&
        truck.t >= northGateDist - 0.15 &&
        truck.t <= northGateDist + 1.5 &&
        northOpen < GATE_OPEN_NEED
      ) {
        truck.t = northGateDist;
        truck.phase = "gateWait";
        truck.gateIndex = "north";
        truck.speed = 0;
        continue;
      }

      if (truck.phase === "drive" && truck.t >= northGateDist - 2) {
        truck.phase = "exit";
      }

      if (truck.t >= totalLen) {
        truck.root.visible = false;
        truck.phase = "wait";
        truck.waitLeft = 14 + Math.random() * 12;
        truck.t = 0;
        truck.speed = 0;
        truck.shedPauseLeft = 0;
        setBrakeLit(truck, false, mats);
        continue;
      }

      const s = samplePath(LOOP_PATH, Math.max(0, truck.t));
      truck.root.position.set(s.x, 0.02, s.z);
      truck.yaw = lerpAngle(truck.yaw, s.yaw, Math.min(1, 5 * dt));
      truck.root.rotation.y = truck.yaw;
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
