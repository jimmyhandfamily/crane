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
 *
 * REALISTIC jobsite: open lattice mast/boom, sheaves, multi-part cable
 * (falls as Cable children — no sway ghost), richer cab, counter-jib.
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
      mats.steelDark,
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

    box(`${o.name}_Beam`, 0.45, 0.32, outriggerLen, mats.steel, root);
    const outer = box(
      `${o.name}_Outer`,
      0.55,
      0.22,
      1.2,
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
      mats.steelDark,
      root
    );
    padLip.position.set(0, -0.05, outriggerLen * 0.48);
  }

  // --- Open square lattice mast ---
  const mastBaseY = 0.8;
  const bayH = 3.0;
  const bayCount = Math.round((CRANE_HEIGHT - 4) / bayH);
  const mastHeight = bayCount * bayH;
  const mastTopY = mastBaseY + mastHeight;
  const chordHalf = 1.1;
  const chordSize = 0.2;
  const braceSize = 0.09; // readable lattice, not toy blocks
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

  const faces: { a: number; b: number; label: string }[] = [
    { a: 3, b: 2, label: "PZ" },
    { a: 0, b: 1, label: "MZ" },
    { a: 1, b: 2, label: "PX" },
    { a: 0, b: 3, label: "MX" },
  ];

  for (let i = 0; i < bayCount; i++) {
    const y0 = mastBaseY + i * bayH;
    const y1 = y0 + bayH;

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

  // --- Turntable + mast tie-ins to collar ---
  const Turntable = cyl("Turntable", 1.75, 1.75, 1.2, mats.steel, CraneRoot, 24);
  Turntable.position.set(0, mastTopY + 0.6, 0);

  const collar = cyl(
    "TurntableCollar",
    2.075,
    2.075,
    0.18,
    mats.craneYellow,
    Turntable,
    28
  );
  collar.position.set(0, 0.55, 0);

  const collarInner = cyl(
    "TurntableCollarInner",
    1.875,
    1.875,
    0.12,
    mats.steelDark,
    Turntable,
    28
  );
  collarInner.position.set(0, 0.62, 0);

  // Mast chords tie into collar with short yellow stubs + steel gussets
  for (let c = 0; c < corners.length; c++) {
    const [cx, cz] = corners[c];
    const tie = box(
      `MastCollarTie_${c}`,
      0.16,
      0.55,
      0.16,
      mats.craneYellow,
      Mast
    );
    tie.position.set(cx, mastTopY + 0.28, cz);
    const gusset = box(
      `MastCollarGusset_${c}`,
      0.28,
      0.1,
      0.28,
      mats.steelDark,
      Mast
    );
    gusset.position.set(cx * 0.92, mastTopY + 0.52, cz * 0.92);
  }

  const slewing = group("SlewingAssembly", CraneRoot);
  slewing.position.set(0, mastTopY + 1.2, 0);

  // --- Richer cab: frames, door, AC, interior hint, rails ---
  const Cab = box("Cab", 2.5, 2.25, 2.7, mats.craneYellow, slewing);
  Cab.position.set(0, 1.3, 1.85);

  // Window frames (dark steel mullions)
  const frameT = 0.07;
  for (const [fx, fy, fz, fw, fh, fd, n] of [
    [0, 1.55, 3.08, 2.0, frameT, 0.06, "CabFrameTop"],
    [0, 1.0, 3.08, 2.0, frameT, 0.06, "CabFrameBot"],
    [-0.95, 1.55, 3.08, frameT, 1.2, 0.06, "CabFrameL"],
    [0.95, 1.55, 3.08, frameT, 1.2, 0.06, "CabFrameR"],
    [0, 1.55, 3.08, frameT, 1.2, 0.06, "CabFrameMid"],
  ] as const) {
    const fr = box(n, fw, fh, fd, mats.steelDark, slewing);
    fr.position.set(fx, fy, fz);
  }

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

  // Door hint (side panel + handle)
  const door = box("CabDoor", 0.08, 1.7, 1.05, mats.steelDark, slewing);
  door.position.set(-1.3, 1.35, 1.55);
  const doorHandle = box("CabDoorHandle", 0.1, 0.08, 0.22, mats.steel, slewing);
  doorHandle.position.set(-1.36, 1.35, 1.35);

  // Roof AC unit
  const ac = box("CabAC", 0.9, 0.35, 0.7, mats.steelDark, slewing);
  ac.position.set(0.55, 2.78, 1.5);
  const acVent = box("CabACVent", 0.7, 0.08, 0.55, mats.steel, slewing);
  acVent.position.set(0.55, 2.98, 1.5);

  // Interior seat / console hints (visible through glass)
  const seat = box("CabSeat", 0.55, 0.55, 0.55, mats.steelDark, slewing);
  seat.position.set(0.15, 1.05, 1.55);
  const console = box("CabConsole", 0.7, 0.35, 0.4, mats.steel, slewing);
  console.position.set(0.15, 1.15, 2.35);

  // Cab railings
  for (const sx of [-1, 1] as const) {
    const rail = box(
      `CabRail_${sx > 0 ? "R" : "L"}`,
      0.05,
      0.45,
      2.4,
      mats.steel,
      slewing
    );
    rail.position.set(sx * 1.4, 2.35, 1.85);
  }
  const railFront = box("CabRailFront", 2.7, 0.45, 0.05, mats.steel, slewing);
  railFront.position.set(0, 2.35, 3.2);

  // --- Lattice counter-jib + counterweight detail ---
  const CounterJib = group("CounterJib", slewing);
  CounterJib.position.set(0, 2.35, -4.2);

  const cjLen = 7.5;
  const cjHalf = 0.38;
  const cjChord = 0.1;
  const cjBrace = 0.07;
  const cjCorners: [number, number][] = [
    [-cjHalf, -cjHalf],
    [cjHalf, -cjHalf],
    [cjHalf, cjHalf],
    [-cjHalf, cjHalf],
  ];
  for (let c = 0; c < cjCorners.length; c++) {
    const [cx, cy] = cjCorners[c];
    const chord = box(
      `CounterJibChord_${c}`,
      cjChord,
      cjChord,
      cjLen,
      mats.craneYellow,
      CounterJib
    );
    chord.position.set(cx, cy, 0);
  }
  const cjFrames = 5;
  for (let i = 0; i < cjFrames; i++) {
    const z = -cjLen / 2 + 0.6 + i * ((cjLen - 1.2) / Math.max(cjFrames - 1, 1));
    strut(
      `CounterJibXA_${i}`,
      -cjHalf,
      -cjHalf,
      z,
      cjHalf,
      cjHalf,
      z,
      cjBrace,
      mats.steel,
      CounterJib
    );
    strut(
      `CounterJibXB_${i}`,
      cjHalf,
      -cjHalf,
      z,
      -cjHalf,
      cjHalf,
      z,
      cjBrace,
      mats.steel,
      CounterJib
    );
    strut(
      `CounterJibVT_${i}`,
      -cjHalf,
      cjHalf,
      z,
      cjHalf,
      cjHalf,
      z,
      cjBrace,
      mats.steel,
      CounterJib
    );
    strut(
      `CounterJibVB_${i}`,
      -cjHalf,
      -cjHalf,
      z,
      cjHalf,
      -cjHalf,
      z,
      cjBrace,
      mats.steel,
      CounterJib
    );
  }

  const Counterweight = box("Counterweight", 3.3, 0.45, 2.5, mats.steel, slewing);
  Counterweight.position.set(0, 0.45, -6.4);

  for (let p = 1; p <= 4; p++) {
    const plate = box(
      `CounterPlate_${p}`,
      3.15 - p * 0.06,
      0.36,
      2.35 - p * 0.05,
      p % 2 === 0 ? mats.craneYellow : mats.steelDark,
      Counterweight
    );
    plate.position.set(0, 0.4 + p * 0.4, 0);
  }
  // Straps / tie rods on stack
  for (const sx of [-1.2, 1.2] as const) {
    const strap = box("CounterStrap", 0.12, 1.7, 0.12, mats.steel, Counterweight);
    strap.position.set(sx, 1.0, 0);
  }
  const cwLabel = box("CounterLabel", 0.9, 0.35, 0.06, mats.craneYellow, Counterweight);
  cwLabel.position.set(0, 0.9, 1.28);

  const BoomRoot = group("BoomRoot", slewing);
  BoomRoot.position.set(0, 2.4, 0);

  const boomLength = BOOM_LENGTH;
  const Boom = group("Boom", BoomRoot);
  Boom.position.set(0, 0, boomLength / 2 + 1);

  const boomHalf = 0.45;
  const boomChord = 0.13;
  const boomBrace = 0.08;
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

  const xFrames = 10;
  const frameZs: number[] = [];
  for (let i = 0; i < xFrames; i++) {
    const z =
      boomZ0 + 1.5 + i * ((boomLength - 3) / Math.max(xFrames - 1, 1));
    frameZs.push(z);

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

  for (let i = 0; i < frameZs.length - 1; i++) {
    const zA = frameZs[i]!;
    const zB = frameZs[i + 1]!;
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

  // JibTip — open end frame + tip sheave
  const JibTip = group("JibTip", BoomRoot);
  JibTip.position.set(0, 0, boomLength + 1.5);
  const tipHalf = 0.45;
  const tipT = 0.07;
  const tipEdges: [number, number, number, number, number, number, string][] = [
    [-tipHalf, -tipHalf, 0, tipHalf, -tipHalf, 0, "B"],
    [-tipHalf, tipHalf, 0, tipHalf, tipHalf, 0, "T"],
    [-tipHalf, -tipHalf, 0, -tipHalf, tipHalf, 0, "L"],
    [tipHalf, -tipHalf, 0, tipHalf, tipHalf, 0, "R"],
  ];
  for (const [ax, ay, az, bx, by, bz, lab] of tipEdges) {
    strut(`JibTip_${lab}`, ax, ay, az, bx, by, bz, tipT, mats.steel, JibTip);
  }
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

  // Tip sheave / pulley (visible from high cam)
  const tipSheave = cyl("JibTipSheave", 0.28, 0.28, 0.14, mats.steelDark, JibTip, 16);
  tipSheave.rotation.z = Math.PI / 2;
  tipSheave.position.set(0, -0.55, 0.05);
  const tipSheaveRim = cyl("JibTipSheaveRim", 0.32, 0.32, 0.04, mats.steel, JibTip, 16);
  tipSheaveRim.rotation.z = Math.PI / 2;
  tipSheaveRim.position.set(0, -0.55, 0.05);
  const tipSheaveAxle = cyl("JibTipSheaveAxle", 0.05, 0.05, 0.4, mats.steel, JibTip, 8);
  tipSheaveAxle.rotation.z = Math.PI / 2;
  tipSheaveAxle.position.set(0, -0.55, 0.05);

  const initialTrolleyZ = 22;
  const initialCableLength = 18;
  const boomWorldY = mastTopY + 1.2 + 2.4;

  const trolley = group("Trolley", BoomRoot);
  trolley.position.set(0, 0, initialTrolleyZ);

  const trolleyBody = box("TrolleyBody", 1.05, 0.35, 1.05, mats.steelDark, trolley);
  trolleyBody.position.set(0, -0.55, 0);

  // Trolley wheels (ride on boom chords)
  for (const [wx, wz, n] of [
    [-0.42, 0.38, "FL"],
    [0.42, 0.38, "FR"],
    [-0.42, -0.38, "RL"],
    [0.42, -0.38, "RR"],
  ] as const) {
    const wh = cyl(`TrolleyWheel_${n}`, 0.12, 0.12, 0.1, mats.steel, trolley, 10);
    wh.rotation.z = Math.PI / 2;
    wh.position.set(wx, -0.22, wz);
  }

  // Trolley sheave / pulley block
  const trolSheave = cyl("TrolleySheave", 0.22, 0.22, 0.16, mats.steelDark, trolley, 14);
  trolSheave.rotation.z = Math.PI / 2;
  trolSheave.position.set(0, -0.85, 0);
  const trolSheave2 = cyl("TrolleySheave2", 0.18, 0.18, 0.12, mats.steel, trolley, 12);
  trolSheave2.rotation.z = Math.PI / 2;
  trolSheave2.position.set(0.14, -0.85, 0);

  // Multi-part hoist: Fall2/3 + strands are CHILDREN of Cable so sway/scale inherit
  // (sibling falls previously stayed vertical → double-cable ghost on sway).
  const Cable = cyl("Cable", 0.055, 0.055, 1, mats.steel, trolley, 10);

  const fall2 = cyl("CableFall2", 0.045, 0.045, 1, mats.steelDark, Cable, 8);
  fall2.position.set(0.11, 0, 0);
  const fall3 = cyl("CableFall3", 0.04, 0.04, 1, mats.steel, Cable, 8);
  fall3.position.set(-0.1, 0, 0.02);

  for (const ox of [-0.05, 0.05] as const) {
    const strand = cyl(
      `CableStrand_${ox > 0 ? "R" : "L"}`,
      0.028,
      0.028,
      1,
      mats.steelDark,
      Cable,
      8
    );
    strand.position.set(ox, 0, 0);
  }

  const Hook = box("Hook", 0.5, 0.9, 0.4, mats.craneYellow, trolley);

  for (const sx of [-1, 1] as const) {
    const cheek = box(
      `HookCheek_${sx > 0 ? "R" : "L"}`,
      0.1,
      0.95,
      0.48,
      mats.steelDark,
      Hook
    );
    cheek.position.set(sx * 0.3, 0, 0);
  }

  const hookSheave = cyl("HookSheave", 0.2, 0.2, 0.18, mats.steel, Hook, 14);
  hookSheave.rotation.z = Math.PI / 2;
  hookSheave.position.set(0, 0.32, 0);

  const hookRing = torus("HookRing", 0.275, 0.055, mats.steel, trolley, 16);

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
  const L = Math.max(cableLength, 0.05);
  // Falls/strands are children — inherit scale; keep identity local scale
  cable.scale.set(1, L, 1);
  cable.position.set(0, -L / 2, 0);
  for (const child of cable.children) {
    if (child instanceof Mesh) child.scale.set(1, 1, 1);
  }

  hook.position.set(0, -L - 0.45, 0);
  hookRing.position.set(0, -L - 1.0, 0);
}
