import {
  MeshBuilder,
  Scene,
  TransformNode,
  Vector3,
  Mesh,
} from "@babylonjs/core";
import { CRANE_HEIGHT } from "../config/units";
import type { SharedMaterials } from "../scene/materials";

/**
 * Procedural placeholder tower crane (~40 m) — M3 visual upgrade.
 * REQUIRED mesh/node names (exact):
 * CraneRoot, Tracks, Turntable, Counterweight, Cab, CabGlass,
 * BoomRoot, Boom, JibTip, Cable, Hook,
 * OutriggerN, OutriggerE, OutriggerS, OutriggerW
 */

/** Boom local-Z span for trolley travel (meters along BoomRoot). */
export const BOOM_LENGTH = 36;
export const TROLLEY_Z_MIN = 6;
export const TROLLEY_Z_MAX = BOOM_LENGTH + 0.5; // near JibTip
export const CABLE_LENGTH_MIN = 2;
/** Soft max — also limited by ground clearance in the controller. */
export const CABLE_LENGTH_MAX = 38;

export interface CraneParts {
  root: TransformNode;
  /** Rotates for slew (yaw). Holds cab, boom, counterweight. */
  slewing: TransformNode;
  turntable: Mesh;
  boomRoot: TransformNode;
  boom: Mesh;
  jibTip: Mesh;
  /** Moves along boom local +Z (trolley). */
  trolley: TransformNode;
  cable: Mesh;
  hook: Mesh;
  hookRing: Mesh;
  /** World Y of BoomRoot (trolley attachment height). */
  boomWorldY: number;
  trolleyZMin: number;
  trolleyZMax: number;
  cableLengthMin: number;
  cableLengthMax: number;
  /** Initial trolley Z / cable length used at spawn. */
  initialTrolleyZ: number;
  initialCableLength: number;
}

export function createPlaceholderCrane(
  scene: Scene,
  mats: SharedMaterials
): CraneParts {
  const CraneRoot = new TransformNode("CraneRoot", scene);
  CraneRoot.position = new Vector3(0, 0, 0);

  // --- Tracks (base carriage) + thin grouser ridges ---
  const Tracks = MeshBuilder.CreateBox(
    "Tracks",
    { width: 6.2, height: 0.85, depth: 8.4 },
    scene
  );
  Tracks.position = new Vector3(0, 0.42, 0);
  Tracks.material = mats.steel;
  Tracks.parent = CraneRoot;

  // Left / right track shoes with grouser ridges (readable from high camera)
  for (const side of [-1, 1] as const) {
    const shoe = MeshBuilder.CreateBox(
      `TrackShoe_${side > 0 ? "R" : "L"}`,
      { width: 1.35, height: 0.55, depth: 8.6 },
      scene
    );
    shoe.position = new Vector3(side * 2.55, 0.28, 0);
    shoe.material = mats.steel;
    shoe.parent = Tracks;

    for (let g = 0; g < 11; g++) {
      const ridge = MeshBuilder.CreateBox(
        `TrackGrouser_${side > 0 ? "R" : "L"}_${g}`,
        { width: 1.45, height: 0.12, depth: 0.18 },
        scene
      );
      ridge.position = new Vector3(side * 2.55, 0.58, -3.8 + g * 0.76);
      ridge.material = mats.craneYellow;
      ridge.parent = Tracks;
    }
  }

  // --- Outriggers: beam + pad under each required node ---
  const outriggerLen = 5.2;
  const outriggerSpec: { name: string; pos: Vector3; rotY: number }[] = [
    { name: "OutriggerN", pos: new Vector3(0, 0.25, 5), rotY: 0 },
    { name: "OutriggerE", pos: new Vector3(5, 0.25, 0), rotY: Math.PI / 2 },
    { name: "OutriggerS", pos: new Vector3(0, 0.25, -5), rotY: 0 },
    { name: "OutriggerW", pos: new Vector3(-5, 0.25, 0), rotY: Math.PI / 2 },
  ];
  for (const o of outriggerSpec) {
    const root = new TransformNode(o.name, scene);
    root.position = o.pos;
    root.rotation.y = o.rotY;
    root.parent = CraneRoot;

    const beam = MeshBuilder.CreateBox(
      `${o.name}_Beam`,
      { width: 0.55, height: 0.4, depth: outriggerLen },
      scene
    );
    beam.position = new Vector3(0, 0, 0);
    beam.material = mats.steel;
    beam.parent = root;

    // Outer telescope hint
    const outer = MeshBuilder.CreateBox(
      `${o.name}_Outer`,
      { width: 0.7, height: 0.28, depth: 1.4 },
      scene
    );
    outer.position = new Vector3(0, -0.02, outriggerLen * 0.35);
    outer.material = mats.craneYellow;
    outer.parent = root;

    // Foot pad at outer end (local +Z)
    const pad = MeshBuilder.CreateBox(
      `${o.name}_Pad`,
      { width: 1.5, height: 0.22, depth: 1.5 },
      scene
    );
    pad.position = new Vector3(0, -0.18, outriggerLen * 0.48);
    pad.material = mats.craneYellow;
    pad.parent = root;

    const padLip = MeshBuilder.CreateBox(
      `${o.name}_PadLip`,
      { width: 1.65, height: 0.08, depth: 1.65 },
      scene
    );
    padLip.position = new Vector3(0, -0.05, outriggerLen * 0.48);
    padLip.material = mats.steel;
    padLip.parent = root;
  }

  // Mast (yellow tower sections up to ~40 m)
  const mastHeight = CRANE_HEIGHT - 4; // room for cab/jib at top
  const sectionH = 4;
  const sections = Math.floor(mastHeight / sectionH);
  for (let i = 0; i < sections; i++) {
    const section = MeshBuilder.CreateBox(
      `MastSection_${i}`,
      { width: 2.35, height: sectionH * 0.92, depth: 2.35 },
      scene
    );
    section.position = new Vector3(0, 0.8 + i * sectionH + sectionH / 2, 0);
    section.material = i % 2 === 0 ? mats.craneYellow : mats.steel;
    section.parent = CraneRoot;

    // Cross brace hint
    const brace = MeshBuilder.CreateBox(
      `MastBrace_${i}`,
      { width: 2.55, height: 0.18, depth: 0.18 },
      scene
    );
    brace.position = new Vector3(0, 0.8 + i * sectionH + sectionH * 0.92, 0);
    brace.material = mats.steel;
    brace.parent = CraneRoot;
  }

  const mastTopY = 0.8 + sections * sectionH;

  // --- Turntable + thin collar ring ---
  const Turntable = MeshBuilder.CreateCylinder(
    "Turntable",
    { height: 1.2, diameter: 3.5, tessellation: 24 },
    scene
  );
  Turntable.position = new Vector3(0, mastTopY + 0.6, 0);
  Turntable.material = mats.steel;
  Turntable.parent = CraneRoot;

  const collar = MeshBuilder.CreateCylinder(
    "TurntableCollar",
    { height: 0.18, diameter: 4.15, tessellation: 28 },
    scene
  );
  collar.position = new Vector3(0, 0.55, 0);
  collar.material = mats.craneYellow;
  collar.parent = Turntable;

  const collarInner = MeshBuilder.CreateCylinder(
    "TurntableCollarInner",
    { height: 0.12, diameter: 3.75, tessellation: 28 },
    scene
  );
  collarInner.position = new Vector3(0, 0.62, 0);
  collarInner.material = mats.steel;
  collarInner.parent = Turntable;

  const slewing = new TransformNode("SlewingAssembly", scene);
  slewing.parent = CraneRoot;
  slewing.position = new Vector3(0, mastTopY + 1.2, 0);

  // --- Cab + roof overhang ---
  const Cab = MeshBuilder.CreateBox(
    "Cab",
    { width: 2.5, height: 2.25, depth: 2.7 },
    scene
  );
  Cab.position = new Vector3(0, 1.3, 1.85);
  Cab.material = mats.craneYellow;
  Cab.parent = slewing;

  const cabRoof = MeshBuilder.CreateBox(
    "CabRoofOverhang",
    { width: 2.85, height: 0.16, depth: 3.05 },
    scene
  );
  cabRoof.position = new Vector3(0, 2.52, 1.9);
  cabRoof.material = mats.craneYellow;
  cabRoof.parent = slewing;

  // CabGlass — slightly inset, darker tint
  const CabGlass = MeshBuilder.CreateBox(
    "CabGlass",
    { width: 1.85, height: 1.25, depth: 0.07 },
    scene
  );
  CabGlass.position = new Vector3(0, 1.55, 3.05);
  CabGlass.material = mats.glassDark;
  CabGlass.parent = slewing;

  // Side glass hints (decorative)
  for (const sx of [-1, 1] as const) {
    const sideGlass = MeshBuilder.CreateBox(
      `CabSideGlass_${sx > 0 ? "R" : "L"}`,
      { width: 0.06, height: 1.1, depth: 1.6 },
      scene
    );
    sideGlass.position = new Vector3(sx * 1.28, 1.55, 1.9);
    sideGlass.material = mats.glassDark;
    sideGlass.parent = slewing;
  }

  // --- Counterweight: stacked plates ---
  const Counterweight = MeshBuilder.CreateBox(
    "Counterweight",
    { width: 3.3, height: 0.45, depth: 2.5 },
    scene
  );
  Counterweight.position = new Vector3(0, 0.45, -6);
  Counterweight.material = mats.steel;
  Counterweight.parent = slewing;

  for (let p = 1; p <= 3; p++) {
    const plate = MeshBuilder.CreateBox(
      `CounterPlate_${p}`,
      { width: 3.15 - p * 0.08, height: 0.38, depth: 2.35 - p * 0.06 },
      scene
    );
    plate.position = new Vector3(0, 0.45 + p * 0.42, 0);
    plate.material = p % 2 === 0 ? mats.craneYellow : mats.steel;
    plate.parent = Counterweight;
  }

  // Counter jib beam
  const counterBeam = MeshBuilder.CreateBox(
    "CounterBeam",
    { width: 0.7, height: 0.55, depth: 8.2 },
    scene
  );
  counterBeam.position = new Vector3(0, 2.25, -4);
  counterBeam.material = mats.craneYellow;
  counterBeam.parent = slewing;

  // --- BoomRoot / Boom / JibTip ---
  const BoomRoot = new TransformNode("BoomRoot", scene);
  BoomRoot.parent = slewing;
  BoomRoot.position = new Vector3(0, 2.4, 0);

  const boomLength = BOOM_LENGTH;
  // Thick outer silhouette for readable boom from ~60° camera
  const Boom = MeshBuilder.CreateBox(
    "Boom",
    { width: 1.25, height: 1.25, depth: boomLength },
    scene
  );
  Boom.position = new Vector3(0, 0, boomLength / 2 + 1);
  Boom.material = mats.craneYellow;
  Boom.parent = BoomRoot;

  // Chord rails (outer silhouette thickening)
  for (const [cx, cy] of [
    [-0.62, 0.62],
    [0.62, 0.62],
    [-0.62, -0.62],
    [0.62, -0.62],
  ] as const) {
    const chord = MeshBuilder.CreateBox(
      `BoomChord_${cx}_${cy}`,
      { width: 0.16, height: 0.16, depth: boomLength * 0.98 },
      scene
    );
    chord.position = new Vector3(cx, cy, 0);
    chord.material = mats.steel;
    chord.parent = Boom;
  }

  // 2–4 X-frame cross-bracing child boxes under Boom
  const xFrames = 4;
  for (let i = 0; i < xFrames; i++) {
    const zLocal = -boomLength / 2 + 4 + i * ((boomLength - 6) / (xFrames - 1));
    // Diagonal / (local XZ plane of boom side)
    const x1 = MeshBuilder.CreateBox(
      `BoomXBraceA_${i}`,
      { width: 0.11, height: 0.11, depth: 1.55 },
      scene
    );
    x1.position = new Vector3(0, 0, zLocal);
    x1.rotation.z = Math.PI / 4;
    x1.material = mats.steel;
    x1.parent = Boom;

    const x2 = MeshBuilder.CreateBox(
      `BoomXBraceB_${i}`,
      { width: 0.11, height: 0.11, depth: 1.55 },
      scene
    );
    x2.position = new Vector3(0, 0, zLocal);
    x2.rotation.z = -Math.PI / 4;
    x2.material = mats.steel;
    x2.parent = Boom;

    // Vertical bay post
    const post = MeshBuilder.CreateBox(
      `BoomBayPost_${i}`,
      { width: 0.1, height: 1.15, depth: 0.1 },
      scene
    );
    post.position = new Vector3(0, 0, zLocal);
    post.material = mats.steel;
    post.parent = Boom;
  }

  const JibTip = MeshBuilder.CreateBox(
    "JibTip",
    { width: 1.35, height: 1.35, depth: 1.35 },
    scene
  );
  JibTip.position = new Vector3(0, 0, boomLength + 1.5);
  JibTip.material = mats.steel;
  JibTip.parent = BoomRoot;

  // --- Trolley + thicker multi-segment Cable + Hook block/cheeks ---
  const initialTrolleyZ = 22;
  const initialCableLength = 18;
  const boomWorldY = mastTopY + 1.2 + 2.4; // ~40.4 m

  const trolley = new TransformNode("Trolley", scene);
  trolley.parent = BoomRoot;
  trolley.position = new Vector3(0, 0, initialTrolleyZ);

  const trolleyBody = MeshBuilder.CreateBox(
    "TrolleyBody",
    { width: 1.05, height: 0.4, depth: 1.05 },
    scene
  );
  trolleyBody.position = new Vector3(0, -0.55, 0);
  trolleyBody.material = mats.steel;
  trolleyBody.parent = trolley;

  const trolleyWheels = MeshBuilder.CreateBox(
    "TrolleyWheels",
    { width: 1.2, height: 0.18, depth: 0.35 },
    scene
  );
  trolleyWheels.position = new Vector3(0, -0.28, 0);
  trolleyWheels.material = mats.craneYellow;
  trolleyWheels.parent = trolley;

  // Primary Cable (unit height; placeHoist scales Y) — thicker for M3
  const Cable = MeshBuilder.CreateCylinder(
    "Cable",
    { height: 1, diameter: 0.14, tessellation: 10 },
    scene
  );
  Cable.material = mats.steel;
  Cable.parent = trolley;

  // Parallel strands — children of Cable so they stretch with hoist scale
  for (const ox of [-0.07, 0.07] as const) {
    const strand = MeshBuilder.CreateCylinder(
      `CableStrand_${ox > 0 ? "R" : "L"}`,
      { height: 1, diameter: 0.07, tessellation: 8 },
      scene
    );
    strand.position = new Vector3(ox, 0, 0);
    strand.material = mats.steel;
    strand.parent = Cable;
  }

  // Hook = block + cheek plates (cheeks parented so placeHoist keeps working)
  const Hook = MeshBuilder.CreateBox(
    "Hook",
    { width: 0.55, height: 0.95, depth: 0.45 },
    scene
  );
  Hook.material = mats.craneYellow;
  Hook.parent = trolley;

  for (const sx of [-1, 1] as const) {
    const cheek = MeshBuilder.CreateBox(
      `HookCheek_${sx > 0 ? "R" : "L"}`,
      { width: 0.12, height: 1.05, depth: 0.55 },
      scene
    );
    cheek.position = new Vector3(sx * 0.34, 0, 0);
    cheek.material = mats.steel;
    cheek.parent = Hook;
  }

  const hookSheave = MeshBuilder.CreateCylinder(
    "HookSheave",
    { height: 0.2, diameter: 0.42, tessellation: 14 },
    scene
  );
  hookSheave.rotation.z = Math.PI / 2;
  hookSheave.position = new Vector3(0, 0.35, 0);
  hookSheave.material = mats.steel;
  hookSheave.parent = Hook;

  const hookRing = MeshBuilder.CreateTorus(
    "HookRing",
    { diameter: 0.55, thickness: 0.12, tessellation: 16 },
    scene
  ) as Mesh;
  hookRing.rotation.x = Math.PI / 2;
  hookRing.material = mats.steel;
  hookRing.parent = trolley;

  // Place cable/hook for initial length
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

/** Position Cable / Hook / HookRing under the trolley for a given cable length. */
export function placeHoist(
  cable: Mesh,
  hook: Mesh,
  hookRing: Mesh,
  cableLength: number
): void {
  // Cable is unit-height cylinder; scale Y and center it between boom and hook top
  cable.scaling.y = Math.max(cableLength, 0.05);
  cable.position = new Vector3(0, -cableLength / 2, 0);

  hook.position = new Vector3(0, -cableLength - 0.45, 0);
  hookRing.position = new Vector3(0, -cableLength - 1.0, 0);
}
