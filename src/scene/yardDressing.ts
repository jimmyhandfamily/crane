import {
  Color,
  MeshBasicMaterial,
  Object3D,
  Scene,
  Vector3,
} from "three";
import { YARD_SIZE } from "../config/units";
import type { SharedMaterials } from "./materials";
import type { MeshStandardMaterial } from "three";
import { box, cyl, disc, ellipsoid, group, sphere } from "./meshHelpers";

interface WorkerLimbs {
  hips: Object3D;
  thighL: Object3D;
  thighR: Object3D;
  shinL: Object3D;
  shinR: Object3D;
  armL: Object3D;
  armR: Object3D;
  baseHipY: number;
  walkTime: number;
}

interface WalkLoop {
  root: Object3D;
  limbs: WorkerLimbs;
  waypoints: Vector3[];
  segment: number;
  u: number;
  speed: number;
  pauseLeft: number;
}

export interface YardDressing {
  root: Object3D;
  update(dt: number): void;
}

function createBerm(
  name: string,
  mats: SharedMaterials,
  parent: Object3D,
  x: number,
  z: number,
  height: number
): void {
  const berm = group(name, parent);
  berm.position.set(x, 0, z);
  berm.rotation.y = Math.random() * Math.PI * 2;

  const h = Math.min(1.2, Math.max(0.4, height));
  const span = 3.2 + h * 2.2;

  const main = ellipsoid(`${name}_Main`, span, h * 2, span * 0.78, mats.berm, berm, 8);
  main.position.y = h * 0.55;

  const lump = ellipsoid(
    `${name}_Lump`,
    span * 0.55,
    h * 1.15,
    span * 0.48,
    mats.bermDark,
    berm,
    6
  );
  lump.position.set(span * 0.22, h * 0.35, -span * 0.12);

  const lump2 = ellipsoid(
    `${name}_Lump2`,
    span * 0.42,
    h * 0.95,
    span * 0.4,
    mats.bermDark,
    berm,
    6
  );
  lump2.position.set(-span * 0.2, h * 0.28, span * 0.14);
}

function makeWorkerShadowMat(): MeshBasicMaterial {
  return new MeshBasicMaterial({
    name: "matWorkerBlobShadow",
    color: new Color(0.08, 0.06, 0.05),
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    toneMapped: false,
  });
}

type WorkerVariant = "A" | "B" | "C";

function variantMats(
  variant: WorkerVariant,
  mats: SharedMaterials
): {
  coveralls: MeshStandardMaterial;
  hardhat: MeshStandardMaterial;
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

function createWorker(
  name: string,
  mats: SharedMaterials,
  variant: WorkerVariant,
  shadowMat: MeshBasicMaterial,
  shadowDiam: number
): { root: Object3D; limbs: WorkerLimbs } {
  const { coveralls, hardhat, withVest } = variantMats(variant, mats);
  const root = group(name);

  const shadow = disc(`${name}_Shadow`, 0.5, shadowMat, root, 24);
  shadow.position.y = 0.025;
  shadow.scale.set(shadowDiam, shadowDiam, 1);

  const hips = group(`${name}_Hips`, root);
  const baseHipY = 0.92;
  hips.position.y = baseHipY;

  box(`${name}_Pelvis`, 0.42, 0.28, 0.28, coveralls, hips);

  const torso = group(`${name}_Torso`, hips);
  torso.position.y = 0.14 + 0.22;

  box(`${name}_TorsoMesh`, 0.48, 0.55, 0.28, coveralls, torso);

  if (withVest) {
    const vest = box(`${name}_Vest`, 0.5, 0.42, 0.1, mats.vest, torso);
    vest.position.set(0, 0.02, 0.16);
  }

  const head = sphere(`${name}_Head`, 0.14, mats.skin, torso, 8);
  head.position.y = 0.22 + 0.02 + 0.14;

  const hat = ellipsoid(`${name}_Hardhat`, 0.36, 0.18, 0.36, hardhat, torso, 8);
  hat.position.y = head.position.y + 0.1;

  const brim = cyl(`${name}_HatBrim`, 0.21, 0.21, 0.04, hardhat, torso, 12);
  brim.position.y = head.position.y + 0.04;

  const shoulderY = 0.2;
  const shoulderX = 0.3;

  const armL = group(`${name}_ArmL`, torso);
  armL.position.set(-shoulderX, shoulderY, 0);
  const upperL = box(`${name}_UpperArmL`, 0.11, 0.3, 0.11, coveralls, armL);
  upperL.position.y = -0.15;
  const foreL = box(`${name}_ForeArmL`, 0.1, 0.28, 0.1, mats.skin, armL);
  foreL.position.y = -0.42;

  const armR = group(`${name}_ArmR`, torso);
  armR.position.set(shoulderX, shoulderY, 0);
  const upperR = box(`${name}_UpperArmR`, 0.11, 0.3, 0.11, coveralls, armR);
  upperR.position.y = -0.15;
  const foreR = box(`${name}_ForeArmR`, 0.1, 0.28, 0.1, mats.skin, armR);
  foreR.position.y = -0.42;

  const hipX = 0.12;

  const legL = group(`${name}_LegL`, hips);
  legL.position.set(-hipX, -0.14, 0);
  const thighL = group(`${name}_ThighL`, legL);
  const thighLMesh = box(`${name}_ThighLMesh`, 0.15, 0.38, 0.15, coveralls, thighL);
  thighLMesh.position.y = -0.19;
  const shinL = group(`${name}_ShinL`, thighL);
  shinL.position.y = -0.38;
  const shinLMesh = box(`${name}_ShinLMesh`, 0.13, 0.34, 0.13, coveralls, shinL);
  shinLMesh.position.y = -0.17;
  const bootL = box(`${name}_BootL`, 0.16, 0.12, 0.26, mats.boots, shinL);
  bootL.position.set(0, -0.38, 0.04);

  const legR = group(`${name}_LegR`, hips);
  legR.position.set(hipX, -0.14, 0);
  const thighR = group(`${name}_ThighR`, legR);
  const thighRMesh = box(`${name}_ThighRMesh`, 0.15, 0.38, 0.15, coveralls, thighR);
  thighRMesh.position.y = -0.19;
  const shinR = group(`${name}_ShinR`, thighR);
  shinR.position.y = -0.38;
  const shinRMesh = box(`${name}_ShinRMesh`, 0.13, 0.34, 0.13, coveralls, shinR);
  shinRMesh.position.y = -0.17;
  const bootR = box(`${name}_BootR`, 0.16, 0.12, 0.26, mats.boots, shinR);
  bootR.position.set(0, -0.38, 0.04);

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
  if (moving) limbs.walkTime += dt;
  const phase = limbs.walkTime * 7;
  const sin = Math.sin(phase);
  const sinOpp = Math.sin(phase + Math.PI);

  limbs.thighL.rotation.x = sin * 0.45;
  limbs.thighR.rotation.x = sinOpp * 0.45;
  limbs.shinL.rotation.x = Math.max(0, -sin) * 0.35;
  limbs.shinR.rotation.x = Math.max(0, -sinOpp) * 0.35;
  limbs.armL.rotation.x = sinOpp * 0.45;
  limbs.armR.rotation.x = sin * 0.45;

  const bob = moving ? Math.abs(Math.sin(phase * 2)) * 0.04 : 0;
  limbs.hips.position.y = limbs.baseHipY + bob;
}

export function createYardDressing(
  scene: Scene,
  mats: SharedMaterials
): YardDressing {
  const root = group("YardDressingRoot");
  scene.add(root);
  const half = YARD_SIZE / 2 - 6;
  const shadowMat = makeWorkerShadowMat();

  createBerm("DirtBerm1", mats, root, half - 4, half - 8, 1.15);
  createBerm("DirtBerm2", mats, root, -half + 6, -half + 10, 0.95);
  createBerm("DirtBerm3", mats, root, half - 10, -half + 6, 0.7);
  createBerm("DirtBerm4", mats, root, 28, 32, 0.55);
  createBerm("DirtBerm5", mats, root, -8, -half + 5, 1.05);

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
      mats,
      def.variant,
      shadowMat,
      def.shadowDiam
    );
    root.add(worker);
    const start = def.waypoints[0]!;
    worker.position.copy(start);
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
      const segLen = a.distanceTo(b);
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

      loop.root.position.lerpVectors(a, b, loop.u);
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
