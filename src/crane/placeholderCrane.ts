import { Mesh, Object3D, Scene } from "three";
import { CRANE_HEIGHT } from "../config/units";
import type { SharedMaterials } from "../scene/materials";
import { box, cyl, group, strut, torus } from "../scene/meshHelpers";

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
  cab: Mesh;
  turntable: Mesh;
  boomRoot: Object3D;
  boom: Object3D;
  jibTip: Object3D;
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

  // --- Open square lattice mast (no solid MastSection boxes) ---
  const mastBaseY = 0.8;
  const bayH = 3.0;
  // ~12 bays × 3 m ≈ CRANE_HEIGHT - 4 so Turntable/Cab/~40 m stay valid
  const bayCount = Math.round((CRANE_HEIGHT - 4) / bayH);
  const mastHeight = bayCount * bayH;
  const mastTopY = mastBaseY + mastHeight;
  const chordHalf = 1.1; // footprint 2.2×2.2, chords at ±1.1
  const chordSize = 0.18;
  const braceSize = 0.1;
  const corners: [number, number][] = [
    [-chordHalf, -chordHalf],
    [chordHalf, -chordHalf],
    [chordHalf, chordHalf],
    [-chordHalf, chordHalf],
  ];

  const Mast = group("Mast", CraneRoot);

  for (let c = 0; c < corners.length; c++) {
    const [cx, cz] = corners[c];
    const chord = box(
      `MastChord_${c}`,
      chordSize,
      mastHeight,
      chordSize,
      mats.craneYellow,
      Mast
    );
    chord.position.set(cx, mastBaseY + mastHeight / 2, cz);
  }

  // Face edge pairs for rings / X-braces: +Z, -Z, +X, -X
  const faces: { a: number; b: number; label: string }[] = [
    { a: 3, b: 2, label: "PZ" }, // +Z
    { a: 0, b: 1, label: "MZ" }, // -Z
    { a: 1, b: 2, label: "PX" }, // +X
    { a: 0, b: 3, label: "MX" }, // -X
  ];

  for (let i = 0; i < bayCount; i++) {
    const y0 = mastBaseY + i * bayH;
    const y1 = y0 + bayH;

    // Horizontal ring at top of each bay (and base ring on first bay)
    const ringYs = i === 0 ? [y0, y1] : [y1];
    for (const ry of ringYs) {
      for (const face of faces) {
        const [ax, az] = corners[face.a];
        const [bx, bz] = corners[face.b];
        strut(
          `MastRing_${i}_${face.label}_${ry === y0 ? "bot" : "top"}`,
          ax,
          ry,
          az,
          bx,
          ry,
          bz,
          braceSize,
          mats.steel,
          Mast
        );
      }
    }

    // X-brace pair per face per bay
    for (const face of faces) {
      const [ax, az] = corners[face.a];
      const [bx, bz] = corners[face.b];
      strut(
        `MastXBraceA_${i}_${face.label}`,
        ax,
        y0,
        az,
        bx,
        y1,
        bz,
        braceSize,
        mats.steel,
        Mast
      );
      strut(
        `MastXBraceB_${i}_${face.label}`,
        bx,
        y0,
        bz,
        ax,
        y1,
        az,
        braceSize,
        mats.steel,
        Mast
      );
    }
  }

  // Ladder / walkway on +Z face
  const ladderZ = chordHalf + 0.12;
  const railHalf = 0.22;
  const railSize = 0.06;
  const MastLadder = group("MastLadder", Mast);

  for (const side of [-1, 1] as const) {
    const rail = box(
      `MastLadderRail_${side > 0 ? "R" : "L"}`,
      railSize,
      mastHeight,
      railSize,
      mats.steel,
      MastLadder
    );
    rail.position.set(side * railHalf, mastBaseY + mastHeight / 2, ladderZ);
  }

  const rungSpacing = 0.45;
  const rungCount = Math.floor(mastHeight / rungSpacing);
  for (let r = 0; r < rungCount; r++) {
    const ry = mastBaseY + 0.2 + r * rungSpacing;
    if (ry > mastTopY - 0.15) break;
    const rung = box(
      `MastLadderRung_${r}`,
      railHalf * 2 + 0.04,
      railSize,
      railSize,
      mats.steel,
      MastLadder
    );
    rung.position.set(0, ry, ladderZ);
  }

  const CabWalkway = box(
    "CabWalkway",
    2.4,
    0.08,
    1.6,
    mats.steel,
    Mast
  );
  CabWalkway.position.set(0, mastTopY - 0.04, chordHalf + 0.85);

  const walkRailL = box("CabWalkwayRail_L", 0.06, 0.55, 1.5, mats.steel, Mast);
  walkRailL.position.set(-1.1, mastTopY + 0.25, chordHalf + 0.85);
  const walkRailR = box("CabWalkwayRail_R", 0.06, 0.55, 1.5, mats.steel, Mast);
  walkRailR.position.set(1.1, mastTopY + 0.25, chordHalf + 0.85);

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
  // Hollow lattice boom (group, not solid box)
  const Boom = group("Boom", BoomRoot);
  Boom.position.set(0, 0, boomLength / 2 + 1);

  const boomHalf = 0.45; // 0.9×0.9 section
  const boomChord = 0.12;
  const boomBrace = 0.09;
  const boomZ0 = -boomLength / 2;
  const boomCorners: [number, number][] = [
    [-boomHalf, -boomHalf],
    [boomHalf, -boomHalf],
    [boomHalf, boomHalf],
    [-boomHalf, boomHalf],
  ];

  for (let c = 0; c < boomCorners.length; c++) {
    const [cx, cy] = boomCorners[c];
    const chord = box(
      `BoomChord_${c}`,
      boomChord,
      boomChord,
      boomLength * 0.98,
      mats.craneYellow,
      Boom
    );
    chord.position.set(cx, cy, 0);
  }

  const xFrames = 7;
  const frameZs: number[] = [];
  for (let i = 0; i < xFrames; i++) {
    const z =
      boomZ0 + 1.5 + i * ((boomLength - 3) / Math.max(xFrames - 1, 1));
    frameZs.push(z);

    // Cross X in the bay plane (perpendicular to boom)
    strut(
      `BoomXBraceA_${i}`,
      -boomHalf,
      -boomHalf,
      z,
      boomHalf,
      boomHalf,
      z,
      boomBrace,
      mats.steel,
      Boom
    );
    strut(
      `BoomXBraceB_${i}`,
      boomHalf,
      -boomHalf,
      z,
      -boomHalf,
      boomHalf,
      z,
      boomBrace,
      mats.steel,
      Boom
    );

    // Vertical + horizontal posts at frame
    strut(
      `BoomFrameV_L_${i}`,
      -boomHalf,
      -boomHalf,
      z,
      -boomHalf,
      boomHalf,
      z,
      boomBrace,
      mats.steel,
      Boom
    );
    strut(
      `BoomFrameV_R_${i}`,
      boomHalf,
      -boomHalf,
      z,
      boomHalf,
      boomHalf,
      z,
      boomBrace,
      mats.steel,
      Boom
    );
    strut(
      `BoomFrameH_T_${i}`,
      -boomHalf,
      boomHalf,
      z,
      boomHalf,
      boomHalf,
      z,
      boomBrace,
      mats.steel,
      Boom
    );
    strut(
      `BoomFrameH_B_${i}`,
      -boomHalf,
      -boomHalf,
      z,
      boomHalf,
      -boomHalf,
      z,
      boomBrace,
      mats.steel,
      Boom
    );
  }

  // Side diagonals between consecutive frames (±X faces)
  for (let i = 0; i < frameZs.length - 1; i++) {
    const zA = frameZs[i];
    const zB = frameZs[i + 1];
    for (const sx of [-boomHalf, boomHalf] as const) {
      const side = sx > 0 ? "R" : "L";
      strut(
        `BoomSideDiagA_${side}_${i}`,
        sx,
        -boomHalf,
        zA,
        sx,
        boomHalf,
        zB,
        boomBrace,
        mats.steel,
        Boom
      );
      strut(
        `BoomSideDiagB_${side}_${i}`,
        sx,
        boomHalf,
        zA,
        sx,
        -boomHalf,
        zB,
        boomBrace,
        mats.steel,
        Boom
      );
    }
    // Top/bottom longitudinal diagonals lightly
    strut(
      `BoomTopDiag_${i}`,
      -boomHalf,
      boomHalf,
      zA,
      boomHalf,
      boomHalf,
      zB,
      boomBrace * 0.9,
      mats.steel,
      Boom
    );
  }

  // JibTip — open 0.9 end frame (not solid cube)
  const JibTip = group("JibTip", BoomRoot);
  JibTip.position.set(0, 0, boomLength + 1.5);
  const tipHalf = 0.45;
  const tipT = 0.1;
  const tipEdges: [number, number, number, number, number, number, string][] = [
    [-tipHalf, -tipHalf, 0, tipHalf, -tipHalf, 0, "B"],
    [-tipHalf, tipHalf, 0, tipHalf, tipHalf, 0, "T"],
    [-tipHalf, -tipHalf, 0, -tipHalf, tipHalf, 0, "L"],
    [tipHalf, -tipHalf, 0, tipHalf, tipHalf, 0, "R"],
  ];
  for (const [ax, ay, az, bx, by, bz, lab] of tipEdges) {
    strut(`JibTip_${lab}`, ax, ay, az, bx, by, bz, tipT, mats.steel, JibTip);
  }
  // Depth ring (open frame depth ~0.35)
  const tipDepth = 0.35;
  for (const [cx, cy] of boomCorners) {
    strut(
      `JibTipDepth_${cx}_${cy}`,
      cx,
      cy,
      -tipDepth / 2,
      cx,
      cy,
      tipDepth / 2,
      tipT,
      mats.steel,
      JibTip
    );
  }
  for (const [ax, ay, , bx, by, , lab] of tipEdges) {
    strut(
      `JibTipBack_${lab}`,
      ax,
      ay,
      -tipDepth / 2,
      bx,
      by,
      -tipDepth / 2,
      tipT,
      mats.steel,
      JibTip
    );
  }

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
    cab: Cab,
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
