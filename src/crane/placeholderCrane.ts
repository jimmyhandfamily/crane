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
 * Procedural placeholder tower crane (~40 m).
 * REQUIRED mesh/node names (exact):
 * CraneRoot, Tracks, Turntable, Counterweight, Cab, CabGlass,
 * BoomRoot, Boom, JibTip, Cable, Hook,
 * OutriggerN, OutriggerE, OutriggerS, OutriggerW
 */
export function createPlaceholderCrane(
  scene: Scene,
  mats: SharedMaterials
): TransformNode {
  const CraneRoot = new TransformNode("CraneRoot", scene);
  CraneRoot.position = new Vector3(0, 0, 0);

  // --- Tracks (base carriage) ---
  const Tracks = MeshBuilder.CreateBox(
    "Tracks",
    { width: 6, height: 0.8, depth: 8 },
    scene
  );
  Tracks.position = new Vector3(0, 0.4, 0);
  Tracks.material = mats.steel;
  Tracks.parent = CraneRoot;

  // Outriggers (N/E/S/W)
  const outriggerLen = 5;
  const outriggerSpec: { name: string; pos: Vector3; rotY: number }[] = [
    { name: "OutriggerN", pos: new Vector3(0, 0.25, 5), rotY: 0 },
    { name: "OutriggerE", pos: new Vector3(5, 0.25, 0), rotY: Math.PI / 2 },
    { name: "OutriggerS", pos: new Vector3(0, 0.25, -5), rotY: 0 },
    { name: "OutriggerW", pos: new Vector3(-5, 0.25, 0), rotY: Math.PI / 2 },
  ];
  for (const o of outriggerSpec) {
    const arm = MeshBuilder.CreateBox(
      o.name,
      { width: 0.4, height: 0.35, depth: outriggerLen },
      scene
    );
    arm.position = o.pos;
    arm.rotation.y = o.rotY;
    arm.material = mats.steel;
    arm.parent = CraneRoot;

    // Foot pad
    const foot = MeshBuilder.CreateBox(
      `${o.name}_Foot`,
      { width: 1.2, height: 0.2, depth: 1.2 },
      scene
    );
    foot.position = new Vector3(
      o.pos.x * 1.55,
      0.1,
      o.pos.z * 1.55
    );
    foot.material = mats.craneYellow;
    foot.parent = CraneRoot;
  }

  // Mast (yellow tower sections up to ~40 m)
  const mastHeight = CRANE_HEIGHT - 4; // room for cab/jib at top
  const sectionH = 4;
  const sections = Math.floor(mastHeight / sectionH);
  for (let i = 0; i < sections; i++) {
    const section = MeshBuilder.CreateBox(
      `MastSection_${i}`,
      { width: 2.2, height: sectionH * 0.92, depth: 2.2 },
      scene
    );
    section.position = new Vector3(0, 0.8 + i * sectionH + sectionH / 2, 0);
    section.material = i % 2 === 0 ? mats.craneYellow : mats.steel;
    section.parent = CraneRoot;

    // Cross brace hint
    const brace = MeshBuilder.CreateBox(
      `MastBrace_${i}`,
      { width: 2.4, height: 0.15, depth: 0.15 },
      scene
    );
    brace.position = new Vector3(0, 0.8 + i * sectionH + sectionH * 0.92, 0);
    brace.material = mats.steel;
    brace.parent = CraneRoot;
  }

  const mastTopY = 0.8 + sections * sectionH;

  // --- Turntable ---
  const Turntable = MeshBuilder.CreateCylinder(
    "Turntable",
    { height: 1.2, diameter: 3.5, tessellation: 24 },
    scene
  );
  Turntable.position = new Vector3(0, mastTopY + 0.6, 0);
  Turntable.material = mats.steel;
  Turntable.parent = CraneRoot;

  const slewing = new TransformNode("SlewingAssembly", scene);
  slewing.parent = CraneRoot;
  slewing.position = new Vector3(0, mastTopY + 1.2, 0);

  // --- Cab ---
  const Cab = MeshBuilder.CreateBox(
    "Cab",
    { width: 2.4, height: 2.2, depth: 2.6 },
    scene
  );
  Cab.position = new Vector3(0, 1.3, 1.8);
  Cab.material = mats.craneYellow;
  Cab.parent = slewing;

  // CabGlass (front window panel)
  const CabGlass = MeshBuilder.CreateBox(
    "CabGlass",
    { width: 2.0, height: 1.4, depth: 0.08 },
    scene
  );
  CabGlass.position = new Vector3(0, 1.5, 3.12);
  CabGlass.material = mats.glass;
  CabGlass.parent = slewing;

  // --- Counterweight ---
  const Counterweight = MeshBuilder.CreateBox(
    "Counterweight",
    { width: 3.2, height: 1.6, depth: 2.4 },
    scene
  );
  Counterweight.position = new Vector3(0, 1.0, -6);
  Counterweight.material = mats.steel;
  Counterweight.parent = slewing;

  // Counter jib beam
  const counterBeam = MeshBuilder.CreateBox(
    "CounterBeam",
    { width: 0.6, height: 0.5, depth: 8 },
    scene
  );
  counterBeam.position = new Vector3(0, 2.2, -4);
  counterBeam.material = mats.craneYellow;
  counterBeam.parent = slewing;

  // --- BoomRoot / Boom / JibTip ---
  const BoomRoot = new TransformNode("BoomRoot", scene);
  BoomRoot.parent = slewing;
  BoomRoot.position = new Vector3(0, 2.4, 0);

  const boomLength = 36;
  const Boom = MeshBuilder.CreateBox(
    "Boom",
    { width: 1.0, height: 1.0, depth: boomLength },
    scene
  );
  Boom.position = new Vector3(0, 0, boomLength / 2 + 1);
  Boom.material = mats.craneYellow;
  Boom.parent = BoomRoot;

  // Lattice accents along boom
  for (let i = 0; i < 6; i++) {
    const lat = MeshBuilder.CreateBox(
      `BoomLattice_${i}`,
      { width: 1.3, height: 0.12, depth: 0.12 },
      scene
    );
    lat.position = new Vector3(0, 0.55, 4 + i * 5.5);
    lat.material = mats.steel;
    lat.parent = BoomRoot;
  }

  const JibTip = MeshBuilder.CreateBox(
    "JibTip",
    { width: 1.2, height: 1.2, depth: 1.2 },
    scene
  );
  JibTip.position = new Vector3(0, 0, boomLength + 1.5);
  JibTip.material = mats.steel;
  JibTip.parent = BoomRoot;

  // --- Cable + Hook (hanging near mid-jib for visibility) ---
  const cableDrop = 18;
  const cableX = 0;
  const cableZ = 22;

  const Cable = MeshBuilder.CreateCylinder(
    "Cable",
    { height: cableDrop, diameter: 0.08, tessellation: 8 },
    scene
  );
  Cable.position = new Vector3(cableX, -cableDrop / 2, cableZ);
  Cable.material = mats.steel;
  Cable.parent = BoomRoot;

  const Hook = MeshBuilder.CreateBox(
    "Hook",
    { width: 0.6, height: 0.9, depth: 0.4 },
    scene
  );
  Hook.position = new Vector3(cableX, -cableDrop - 0.45, cableZ);
  Hook.material = mats.craneYellow;
  Hook.parent = BoomRoot;

  // Hook throat (visual)
  const hookRing = MeshBuilder.CreateTorus(
    "HookRing",
    { diameter: 0.5, thickness: 0.1, tessellation: 16 },
    scene
  ) as Mesh;
  hookRing.position = new Vector3(cableX, -cableDrop - 1.0, cableZ);
  hookRing.rotation.x = Math.PI / 2;
  hookRing.material = mats.steel;
  hookRing.parent = BoomRoot;

  return CraneRoot;
}
