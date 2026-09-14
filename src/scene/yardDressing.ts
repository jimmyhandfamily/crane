import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { YARD_SIZE } from "../config/units";
import type { SharedMaterials } from "./materials";

interface WorkerLimbs {
  hips: TransformNode;
  thighL: TransformNode;
  thighR: TransformNode;
  shinL: TransformNode;
  shinR: TransformNode;
  armL: TransformNode;
  armR: TransformNode;
  baseHipY: number;
  walkTime: number;
}

interface WalkLoop {
  root: TransformNode;
  limbs: WorkerLimbs;
  waypoints: Vector3[];
  segment: number;
  u: number;
  speed: number;
  pauseLeft: number;
}

export interface YardDressing {
  root: TransformNode;
  update(dt: number): void;
}

function createBerm(
  name: string,
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode,
  x: number,
  z: number,
  /** Peak height in meters (0.4–1.2). */
  height: number
): void {
  const berm = new TransformNode(name, scene);
  berm.parent = parent;
  berm.position = new Vector3(x, 0, z);
  berm.rotation.y = Math.random() * Math.PI * 2;

  const h = Math.min(1.2, Math.max(0.4, height));
  const span = 3.2 + h * 2.2;

  const main = MeshBuilder.CreateSphere(
    `${name}_Main`,
    {
      diameterX: span,
      diameterY: h * 2,
      diameterZ: span * 0.78,
      segments: 8,
    },
    scene
  );
  main.position.y = h * 0.55;
  main.material = mats.berm;
  main.parent = berm;

  const lump = MeshBuilder.CreateSphere(
    `${name}_Lump`,
    {
      diameterX: span * 0.55,
      diameterY: h * 1.15,
      diameterZ: span * 0.48,
      segments: 6,
    },
    scene
  );
  lump.position = new Vector3(span * 0.22, h * 0.35, -span * 0.12);
  lump.material = mats.bermDark;
  lump.parent = berm;

  const lump2 = MeshBuilder.CreateSphere(
    `${name}_Lump2`,
    {
      diameterX: span * 0.42,
      diameterY: h * 0.95,
      diameterZ: span * 0.4,
      segments: 6,
    },
    scene
  );
  lump2.position = new Vector3(-span * 0.2, h * 0.28, span * 0.14);
  lump2.material = mats.bermDark;
  lump2.parent = berm;
}

function makeWorkerShadowMat(scene: Scene): StandardMaterial {
  const mat = new StandardMaterial("matWorkerBlobShadow", scene);
  mat.diffuseColor = new Color3(0.08, 0.06, 0.05);
  mat.specularColor = Color3.Black();
  mat.emissiveColor = Color3.Black();
  mat.ambientColor = Color3.Black();
  mat.alpha = 0.38;
  mat.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
  mat.disableLighting = true;
  mat.backFaceCulling = false;
  mat.zOffset = -1;
  return mat;
}

type WorkerVariant = "A" | "B" | "C";

function variantMats(
  variant: WorkerVariant,
  mats: SharedMaterials
): {
  coveralls: StandardMaterial;
  hardhat: StandardMaterial;
  withVest: boolean;
} {
  switch (variant) {
    case "A":
      return {
        coveralls: mats.coverallsBlue,
        hardhat: mats.hardhatYellow,
        withVest: true,
      };
    case "B":
      return {
        coveralls: mats.coverallsGreen,
        hardhat: mats.hardhatOrange,
        withVest: false,
      };
    case "C":
      return {
        coveralls: mats.coverallsBlue,
        hardhat: mats.hardhatOrange,
        withVest: true,
      };
  }
}

/**
 * Articulated hardhat worker ~1.75–1.85 m.
 * Hierarchy: WorkerRoot → Hips → Torso/Head/Hat; Hips → LegL/R; Torso → ArmL/R.
 */
function createWorker(
  name: string,
  scene: Scene,
  mats: SharedMaterials,
  variant: WorkerVariant,
  shadowMat: StandardMaterial,
  shadowDiam: number
): { root: TransformNode; limbs: WorkerLimbs } {
  const { coveralls, hardhat, withVest } = variantMats(variant, mats);
  const root = new TransformNode(name, scene);

  // Blob shadow under feet (Ø 0.9–1.1)
  const shadow = MeshBuilder.CreateDisc(
    `${name}_Shadow`,
    { radius: 0.5, tessellation: 24 },
    scene
  );
  shadow.rotation.x = Math.PI / 2;
  shadow.position.y = 0.025;
  shadow.scaling.set(shadowDiam, shadowDiam, 1);
  shadow.material = shadowMat;
  shadow.isPickable = false;
  shadow.parent = root;

  const hips = new TransformNode(`${name}_Hips`, scene);
  hips.parent = root;
  const baseHipY = 0.92;
  hips.position.y = baseHipY;

  // Pelvis 0.42 × 0.28 × 0.28
  const pelvis = MeshBuilder.CreateBox(
    `${name}_Pelvis`,
    { width: 0.42, height: 0.28, depth: 0.28 },
    scene
  );
  pelvis.position.y = 0;
  pelvis.material = coveralls;
  pelvis.parent = hips;

  const torso = new TransformNode(`${name}_Torso`, scene);
  torso.parent = hips;
  torso.position.y = 0.14 + 0.22; // slight overlap with pelvis for ~1.8 m height

  // Torso 0.48 × 0.55 × 0.28
  const torsoMesh = MeshBuilder.CreateBox(
    `${name}_TorsoMesh`,
    { width: 0.48, height: 0.55, depth: 0.28 },
    scene
  );
  torsoMesh.material = coveralls;
  torsoMesh.parent = torso;

  if (withVest) {
    const vest = MeshBuilder.CreateBox(
      `${name}_Vest`,
      { width: 0.5, height: 0.42, depth: 0.1 },
      scene
    );
    vest.position = new Vector3(0, 0.02, 0.16);
    vest.material = mats.vest;
    vest.parent = torso;
  }

  // Head sphere Ø0.28
  const head = MeshBuilder.CreateSphere(
    `${name}_Head`,
    { diameter: 0.28, segments: 8 },
    scene
  );
  head.position.y = 0.22 + 0.02 + 0.14; // torso half + neck + radius
  head.material = mats.skin;
  head.parent = torso;

  // Hardhat dome + brim
  const hat = MeshBuilder.CreateSphere(
    `${name}_Hardhat`,
    { diameterX: 0.36, diameterY: 0.18, diameterZ: 0.36, segments: 8 },
    scene
  );
  hat.position.y = head.position.y + 0.1;
  hat.material = hardhat;
  hat.parent = torso;

  const brim = MeshBuilder.CreateCylinder(
    `${name}_HatBrim`,
    { height: 0.04, diameter: 0.42, tessellation: 12 },
    scene
  );
  brim.position.y = head.position.y + 0.04;
  brim.material = hardhat;
  brim.parent = torso;

  // Arms — pivot at shoulder; upper + forearm
  const shoulderY = 0.2;
  const shoulderX = 0.3;

  const armL = new TransformNode(`${name}_ArmL`, scene);
  armL.parent = torso;
  armL.position = new Vector3(-shoulderX, shoulderY, 0);

  const upperL = MeshBuilder.CreateBox(
    `${name}_UpperArmL`,
    { width: 0.11, height: 0.3, depth: 0.11 },
    scene
  );
  upperL.position.y = -0.15;
  upperL.material = coveralls;
  upperL.parent = armL;

  const foreL = MeshBuilder.CreateBox(
    `${name}_ForeArmL`,
    { width: 0.1, height: 0.28, depth: 0.1 },
    scene
  );
  foreL.position.y = -0.42;
  foreL.material = mats.skin;
  foreL.parent = armL;

  const armR = new TransformNode(`${name}_ArmR`, scene);
  armR.parent = torso;
  armR.position = new Vector3(shoulderX, shoulderY, 0);

  const upperR = MeshBuilder.CreateBox(
    `${name}_UpperArmR`,
    { width: 0.11, height: 0.3, depth: 0.11 },
    scene
  );
  upperR.position.y = -0.15;
  upperR.material = coveralls;
  upperR.parent = armR;

  const foreR = MeshBuilder.CreateBox(
    `${name}_ForeArmR`,
    { width: 0.1, height: 0.28, depth: 0.1 },
    scene
  );
  foreR.position.y = -0.42;
  foreR.material = mats.skin;
  foreR.parent = armR;

  // Legs — thigh + shin + boot; pivots at hip / knee
  const hipX = 0.12;

  const legL = new TransformNode(`${name}_LegL`, scene);
  legL.parent = hips;
  legL.position = new Vector3(-hipX, -0.14, 0);

  const thighL = new TransformNode(`${name}_ThighL`, scene);
  thighL.parent = legL;

  const thighLMesh = MeshBuilder.CreateBox(
    `${name}_ThighLMesh`,
    { width: 0.15, height: 0.38, depth: 0.15 },
    scene
  );
  thighLMesh.position.y = -0.19;
  thighLMesh.material = coveralls;
  thighLMesh.parent = thighL;

  const shinL = new TransformNode(`${name}_ShinL`, scene);
  shinL.parent = thighL;
  shinL.position.y = -0.38;

  const shinLMesh = MeshBuilder.CreateBox(
    `${name}_ShinLMesh`,
    { width: 0.13, height: 0.34, depth: 0.13 },
    scene
  );
  shinLMesh.position.y = -0.17;
  shinLMesh.material = coveralls;
  shinLMesh.parent = shinL;

  const bootL = MeshBuilder.CreateBox(
    `${name}_BootL`,
    { width: 0.16, height: 0.12, depth: 0.26 },
    scene
  );
  bootL.position = new Vector3(0, -0.38, 0.04);
  bootL.material = mats.boots;
  bootL.parent = shinL;

  const legR = new TransformNode(`${name}_LegR`, scene);
  legR.parent = hips;
  legR.position = new Vector3(hipX, -0.14, 0);

  const thighR = new TransformNode(`${name}_ThighR`, scene);
  thighR.parent = legR;

  const thighRMesh = MeshBuilder.CreateBox(
    `${name}_ThighRMesh`,
    { width: 0.15, height: 0.38, depth: 0.15 },
    scene
  );
  thighRMesh.position.y = -0.19;
  thighRMesh.material = coveralls;
  thighRMesh.parent = thighR;

  const shinR = new TransformNode(`${name}_ShinR`, scene);
  shinR.parent = thighR;
  shinR.position.y = -0.38;

  const shinRMesh = MeshBuilder.CreateBox(
    `${name}_ShinRMesh`,
    { width: 0.13, height: 0.34, depth: 0.13 },
    scene
  );
  shinRMesh.position.y = -0.17;
  shinRMesh.material = coveralls;
  shinRMesh.parent = shinR;

  const bootR = MeshBuilder.CreateBox(
    `${name}_BootR`,
    { width: 0.16, height: 0.12, depth: 0.26 },
    scene
  );
  bootR.position = new Vector3(0, -0.38, 0.04);
  bootR.material = mats.boots;
  bootR.parent = shinR;

  return {
    root,
    limbs: {
      hips,
      thighL,
      thighR,
      shinL,
      shinR,
      armL,
      armR,
      baseHipY,
      walkTime: Math.random() * Math.PI * 2,
    },
  };
}

function applyWalkPose(limbs: WorkerLimbs, moving: boolean, dt: number): void {
  if (moving) {
    limbs.walkTime += dt;
  }
  const phase = limbs.walkTime * 7;
  const sin = Math.sin(phase);
  const sinOpp = Math.sin(phase + Math.PI);

  limbs.thighL.rotation.x = sin * 0.45;
  limbs.thighR.rotation.x = sinOpp * 0.45;
  limbs.shinL.rotation.x = Math.max(0, -sin) * 0.35;
  limbs.shinR.rotation.x = Math.max(0, -sinOpp) * 0.35;
  // Arms opposite to thighs
  limbs.armL.rotation.x = sinOpp * 0.45;
  limbs.armR.rotation.x = sin * 0.45;

  const bob = moving ? Math.abs(Math.sin(phase * 2)) * 0.04 : 0;
  limbs.hips.position.y = limbs.baseHipY + bob;
}

/**
 * Dirt berms (0.4–1.2 m) + kinematic articulated hardhat workers on edge walk loops.
 * Stay clear of crane center / Pad A–B work. No berms inside ~25 m of CraneRoot.
 */
export function createYardDressing(
  scene: Scene,
  mats: SharedMaterials
): YardDressing {
  const root = new TransformNode("YardDressingRoot", scene);
  const half = YARD_SIZE / 2 - 6;
  const shadowMat = makeWorkerShadowMat(scene);

  // Berms near fence corners / edges — heights 0.4–1.2 m, outside work pads
  createBerm("DirtBerm1", scene, mats, root, half - 4, half - 8, 1.15);
  createBerm("DirtBerm2", scene, mats, root, -half + 6, -half + 10, 0.95);
  createBerm("DirtBerm3", scene, mats, root, half - 10, -half + 6, 0.7);
  createBerm("DirtBerm4", scene, mats, root, 28, 32, 0.55);
  createBerm("DirtBerm5", scene, mats, root, -8, -half + 5, 1.05);

  const workerDefs: {
    name: string;
    variant: WorkerVariant;
    shadowDiam: number;
    waypoints: Vector3[];
    speed: number;
    startU: number;
  }[] = [
    {
      name: "AmbientWorker1",
      variant: "A",
      shadowDiam: 1.0,
      waypoints: [
        new Vector3(-32, 0, 20),
        new Vector3(-30, 0, 28),
        new Vector3(-24, 0, 30),
        new Vector3(-28, 0, 22),
      ],
      speed: 1.4,
      startU: 0,
    },
    {
      name: "AmbientWorker2",
      variant: "B",
      shadowDiam: 0.95,
      waypoints: [
        new Vector3(-20, 0, 40),
        new Vector3(-5, 0, 40),
        new Vector3(8, 0, 38),
        new Vector3(-8, 0, 38),
      ],
      speed: 1.2,
      startU: 0.3,
    },
    {
      name: "AmbientWorker3",
      variant: "C",
      shadowDiam: 1.05,
      waypoints: [
        new Vector3(-26, 0, 6),
        new Vector3(-22, 0, 4),
        new Vector3(-28, 0, 2),
        new Vector3(-30, 0, 8),
      ],
      speed: 1.1,
      startU: 0.6,
    },
    {
      name: "AmbientWorker4",
      variant: "B",
      shadowDiam: 1.1,
      waypoints: [
        new Vector3(32, 0, -4),
        new Vector3(36, 0, -12),
        new Vector3(34, 0, -20),
        new Vector3(30, 0, -10),
      ],
      speed: 1.3,
      startU: 0.15,
    },
  ];

  const loops: WalkLoop[] = workerDefs.map((def) => {
    const { root: worker, limbs } = createWorker(
      def.name,
      scene,
      mats,
      def.variant,
      shadowMat,
      def.shadowDiam
    );
    worker.parent = root;
    const start = def.waypoints[0]!;
    worker.position.copyFrom(start);
    return {
      root: worker,
      limbs,
      waypoints: def.waypoints,
      segment: Math.floor(def.startU * def.waypoints.length) % def.waypoints.length,
      u: def.startU,
      speed: def.speed,
      pauseLeft: 0,
    };
  });

  const update = (dt: number): void => {
    for (const loop of loops) {
      if (loop.pauseLeft > 0) {
        loop.pauseLeft -= dt;
        applyWalkPose(loop.limbs, false, dt);
        continue;
      }

      const a = loop.waypoints[loop.segment]!;
      const b = loop.waypoints[(loop.segment + 1) % loop.waypoints.length]!;
      const segLen = Vector3.Distance(a, b);
      const step = segLen > 0.01 ? (loop.speed * dt) / segLen : 1;
      loop.u += step;

      if (loop.u >= 1) {
        loop.u = 0;
        loop.segment = (loop.segment + 1) % loop.waypoints.length;
        if (Math.random() < 0.35) {
          loop.pauseLeft = 0.8 + Math.random() * 1.5;
        }
        applyWalkPose(loop.limbs, false, dt);
        continue;
      }

      const pos = Vector3.Lerp(a, b, loop.u);
      loop.root.position.copyFrom(pos);
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      if (dx * dx + dz * dz > 0.001) {
        loop.root.rotation.y = Math.atan2(dx, dz);
      }
      applyWalkPose(loop.limbs, true, dt);
    }
  };

  return { root, update };
}
