import { Mesh, Object3D, Scene } from "three";
import { CRANE_HEIGHT } from "../config/units";
import type { SharedMaterials } from "../scene/materials";
import { box, cyl, group, torus } from "../scene/meshHelpers";

/**
 * Procedural placeholder tower crane (~40 m) — Three.js.
 * REQUIRED mesh/node names (exact):
 * CraneRoot, Tracks, Turntable, Counterweight, Cab, CabGlass,
 * BoomRoot, Boom, JibTip, Cable, Hook,
 * OutriggerN, OutriggerE, OutriggerS, OutriggerW
 */

export const BOOM_LENGTH = 36;
export const TROLLEY_Z_MIN = 6;
export const TROLLEY_Z_MAX = BOOM_LENGTH + 0.5;
export const CABLE_LENGTH_MIN = 2;
export const CABLE_LENGTH_MAX = 38;

export interface CraneParts {
  root: Object3D;
  slewing: Object3D;
  turntable: Mesh;
  boomRoot: Object3D;
  boom: Mesh;
  jibTip: Mesh;
  trolley: Object3D;
  cable: Mesh;
  hook: Mesh;
  hookRing: Mesh;
  boomWorldY: number;
  trolleyZMin: number;
  trolleyZMax: number;
  cableLengthMin: number;
  cableLengthMax: number;
  initialTrolleyZ: number;
  initialCableLength: number;
}

export function createPlaceholderCrane(
  scene: Scene,
  mats: SharedMaterials
): CraneParts {
  const CraneRoot = group("CraneRoot");
  scene.add(CraneRoot);

  const Tracks = box("Tracks", 6.2, 0.85, 8.4, mats.steel, CraneRoot);
  Tracks.position.set(0, 0.42, 0);

  for (const side of [-1, 1] as const) {
    const shoe = box(
      `TrackShoe_${side > 0 ? "R" : "L"}`,
      1.35,
      0.55,
      8.6,
      mats.steel,
      Tracks
    );
    shoe.position.set(side * 2.55, 0.28, 0);

    for (let g = 0; g < 11; g++) {
      const ridge = box(
        `TrackGrouser_${side > 0 ? "R" : "L"}_${g}`,
        1.45,
        0.12,
        0.18,
        mats.craneYellow,
        Tracks
      );
      ridge.position.set(side * 2.55, 0.58, -3.8 + g * 0.76);
    }
  }

  const outriggerLen = 5.2;
  const outriggerSpec: { name: string; x: number; z: number; rotY: number }[] = [
    { name: "OutriggerN", x: 0, z: 5, rotY: 0 },
    { name: "OutriggerE", x: 5, z: 0, rotY: Math.PI / 2 },
    { name: "OutriggerS", x: 0, z: -5, rotY: 0 },
    { name: "OutriggerW", x: -5, z: 0, rotY: Math.PI / 2 },
  ];
  for (const o of outriggerSpec) {
    const root = group(o.name, CraneRoot);
    root.position.set(o.x, 0.25, o.z);
    root.rotation.y = o.rotY;

    box(`${o.name}_Beam`, 0.55, 0.4, outriggerLen, mats.steel, root);
    const outer = box(
      `${o.name}_Outer`,
      0.7,
      0.28,
      1.4,
      mats.craneYellow,
      root
    );
    outer.position.set(0, -0.02, outriggerLen * 0.35);

    const pad = box(
      `${o.name}_Pad`,
      1.5,
      0.22,
      1.5,
      mats.craneYellow,
      root
    );
    pad.position.set(0, -0.18, outriggerLen * 0.48);

    const padLip = box(
      `${o.name}_PadLip`,
      1.65,
      0.08,
      1.65,
      mats.steel,
      root
    );
    padLip.position.set(0, -0.05, outriggerLen * 0.48);
  }

  const mastHeight = CRANE_HEIGHT - 4;
  const sectionH = 4;
  const sections = Math.floor(mastHeight / sectionH);
  for (let i = 0; i < sections; i++) {
    const section = box(
      `MastSection_${i}`,
      2.35,
      sectionH * 0.92,
      2.35,
      i % 2 === 0 ? mats.craneYellow : mats.steel,
      CraneRoot
    );
    section.position.set(0, 0.8 + i * sectionH + sectionH / 2, 0);

    const brace = box(
      `MastBrace_${i}`,
      2.55,
      0.18,
      0.18,
      mats.steel,
      CraneRoot
    );
    brace.position.set(0, 0.8 + i * sectionH + sectionH * 0.92, 0);
  }

  const mastTopY = 0.8 + sections * sectionH;

  const Turntable = cyl("Turntable", 1.75, 1.75, 1.2, mats.steel, CraneRoot, 24);
  Turntable.position.set(0, mastTopY + 0.6, 0);

  const collar = cyl("TurntableCollar", 2.075, 2.075, 0.18, mats.craneYellow, Turntable, 28);
  collar.position.set(0, 0.55, 0);

  const collarInner = cyl(
    "TurntableCollarInner",
    1.875,
    1.875,
    0.12,
    mats.steel,
    Turntable,
    28
  );
  collarInner.position.set(0, 0.62, 0);

  const slewing = group("SlewingAssembly", CraneRoot);
  slewing.position.set(0, mastTopY + 1.2, 0);

  const Cab = box("Cab", 2.5, 2.25, 2.7, mats.craneYellow, slewing);
  Cab.position.set(0, 1.3, 1.85);

  const cabRoof = box("CabRoofOverhang", 2.85, 0.16, 3.05, mats.craneYellow, slewing);
  cabRoof.position.set(0, 2.52, 1.9);

  const CabGlass = box("CabGlass", 1.85, 1.25, 0.07, mats.glassDark, slewing);
  CabGlass.position.set(0, 1.55, 3.05);

  for (const sx of [-1, 1] as const) {
    const sideGlass = box(
      `CabSideGlass_${sx > 0 ? "R" : "L"}`,
      0.06,
      1.1,
      1.6,
      mats.glassDark,
      slewing
    );
    sideGlass.position.set(sx * 1.28, 1.55, 1.9);
  }

  const Counterweight = box("Counterweight", 3.3, 0.45, 2.5, mats.steel, slewing);
  Counterweight.position.set(0, 0.45, -6);

  for (let p = 1; p <= 3; p++) {
    const plate = box(
      `CounterPlate_${p}`,
      3.15 - p * 0.08,
      0.38,
      2.35 - p * 0.06,
      p % 2 === 0 ? mats.craneYellow : mats.steel,
      Counterweight
    );
    plate.position.set(0, 0.45 + p * 0.42, 0);
  }

  const counterBeam = box("CounterBeam", 0.7, 0.55, 8.2, mats.craneYellow, slewing);
  counterBeam.position.set(0, 2.25, -4);

  const BoomRoot = group("BoomRoot", slewing);
  BoomRoot.position.set(0, 2.4, 0);

  const boomLength = BOOM_LENGTH;
  const Boom = box("Boom", 1.25, 1.25, boomLength, mats.craneYellow, BoomRoot);
  Boom.position.set(0, 0, boomLength / 2 + 1);

  for (const [cx, cy] of [
    [-0.62, 0.62],
    [0.62, 0.62],
    [-0.62, -0.62],
    [0.62, -0.62],
  ] as const) {
    const chord = box(
      `BoomChord_${cx}_${cy}`,
      0.16,
      0.16,
      boomLength * 0.98,
      mats.steel,
      Boom
    );
    chord.position.set(cx, cy, 0);
  }

  const xFrames = 4;
  for (let i = 0; i < xFrames; i++) {
    const zLocal = -boomLength / 2 + 4 + i * ((boomLength - 6) / (xFrames - 1));
    const x1 = box(`BoomXBraceA_${i}`, 0.11, 0.11, 1.55, mats.steel, Boom);
    x1.position.set(0, 0, zLocal);
    x1.rotation.z = Math.PI / 4;

    const x2 = box(`BoomXBraceB_${i}`, 0.11, 0.11, 1.55, mats.steel, Boom);
    x2.position.set(0, 0, zLocal);
    x2.rotation.z = -Math.PI / 4;

    const post = box(`BoomBayPost_${i}`, 0.1, 1.15, 0.1, mats.steel, Boom);
    post.position.set(0, 0, zLocal);
  }

  const JibTip = box("JibTip", 1.35, 1.35, 1.35, mats.steel, BoomRoot);
  JibTip.position.set(0, 0, boomLength + 1.5);

  const initialTrolleyZ = 22;
  const initialCableLength = 18;
  const boomWorldY = mastTopY + 1.2 + 2.4;

  const trolley = group("Trolley", BoomRoot);
  trolley.position.set(0, 0, initialTrolleyZ);

  const trolleyBody = box("TrolleyBody", 1.05, 0.4, 1.05, mats.steel, trolley);
  trolleyBody.position.set(0, -0.55, 0);

  const trolleyWheels = box("TrolleyWheels", 1.2, 0.18, 0.35, mats.craneYellow, trolley);
  trolleyWheels.position.set(0, -0.28, 0);

  const Cable = cyl("Cable", 0.07, 0.07, 1, mats.steel, trolley, 10);

  for (const ox of [-0.07, 0.07] as const) {
    const strand = cyl(
      `CableStrand_${ox > 0 ? "R" : "L"}`,
      0.035,
      0.035,
      1,
      mats.steel,
      Cable,
      8
    );
    strand.position.set(ox, 0, 0);
  }

  const Hook = box("Hook", 0.55, 0.95, 0.45, mats.craneYellow, trolley);

  for (const sx of [-1, 1] as const) {
    const cheek = box(
      `HookCheek_${sx > 0 ? "R" : "L"}`,
      0.12,
      1.05,
      0.55,
      mats.steel,
      Hook
    );
    cheek.position.set(sx * 0.34, 0, 0);
  }

  const hookSheave = cyl("HookSheave", 0.21, 0.21, 0.2, mats.steel, Hook, 14);
  hookSheave.rotation.z = Math.PI / 2;
  hookSheave.position.set(0, 0.35, 0);

  const hookRing = torus("HookRing", 0.275, 0.06, mats.steel, trolley, 16);

  placeHoist(Cable, Hook, hookRing, initialCableLength);

  return {
    root: CraneRoot,
    slewing,
    turntable: Turntable,
    boomRoot: BoomRoot,
    boom: Boom,
    jibTip: JibTip,
    trolley,
    cable: Cable,
    hook: Hook,
    hookRing,
    boomWorldY,
    trolleyZMin: TROLLEY_Z_MIN,
    trolleyZMax: TROLLEY_Z_MAX,
    cableLengthMin: CABLE_LENGTH_MIN,
    cableLengthMax: CABLE_LENGTH_MAX,
    initialTrolleyZ,
    initialCableLength,
  };
}

export function placeHoist(
  cable: Mesh,
  hook: Mesh,
  hookRing: Mesh,
  cableLength: number
): void {
  cable.scale.set(1, Math.max(cableLength, 0.05), 1);
  cable.position.set(0, -cableLength / 2, 0);
  hook.position.set(0, -cableLength - 0.45, 0);
  hookRing.position.set(0, -cableLength - 1.0, 0);
}
