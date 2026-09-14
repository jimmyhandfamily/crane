import {
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { YARD_SIZE } from "../config/units";
import type { SharedMaterials } from "./materials";

interface WalkLoop {
  root: TransformNode;
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
  scale = 1
): void {
  const berm = new TransformNode(name, scene);
  berm.parent = parent;
  berm.position = new Vector3(x, 0, z);
  berm.rotation.y = Math.random() * Math.PI * 2;

  // Chunky mound: flattened sphere + darker base lumps
  const main = MeshBuilder.CreateSphere(
    `${name}_Main`,
    { diameterX: 5.5 * scale, diameterY: 2.2 * scale, diameterZ: 4.2 * scale, segments: 8 },
    scene
  );
  main.position.y = 0.7 * scale;
  main.material = mats.berm;
  main.parent = berm;

  const lump = MeshBuilder.CreateSphere(
    `${name}_Lump`,
    { diameterX: 3.2 * scale, diameterY: 1.4 * scale, diameterZ: 2.8 * scale, segments: 6 },
    scene
  );
  lump.position = new Vector3(1.4 * scale, 0.45 * scale, -0.8 * scale);
  lump.material = mats.bermDark;
  lump.parent = berm;

  const lump2 = MeshBuilder.CreateSphere(
    `${name}_Lump2`,
    { diameterX: 2.4 * scale, diameterY: 1.1 * scale, diameterZ: 2.2 * scale, segments: 6 },
    scene
  );
  lump2.position = new Vector3(-1.2 * scale, 0.35 * scale, 0.9 * scale);
  lump2.material = mats.bermDark;
  lump2.parent = berm;
}

function createWorker(
  name: string,
  scene: Scene,
  mats: SharedMaterials,
  coveralls: StandardMaterial,
  hardhat: StandardMaterial,
  withVest: boolean
): TransformNode {
  const root = new TransformNode(name, scene);

  // Low-poly box/capsule body
  const torso = MeshBuilder.CreateBox(
    `${name}_Torso`,
    { width: 0.55, height: 0.85, depth: 0.35 },
    scene
  );
  torso.position.y = 1.15;
  torso.material = coveralls;
  torso.parent = root;

  const legs = MeshBuilder.CreateBox(
    `${name}_Legs`,
    { width: 0.45, height: 0.75, depth: 0.3 },
    scene
  );
  legs.position.y = 0.4;
  legs.material = coveralls;
  legs.parent = root;

  const head = MeshBuilder.CreateSphere(
    `${name}_Head`,
    { diameter: 0.38, segments: 8 },
    scene
  );
  head.position.y = 1.75;
  head.material = mats.skin;
  head.parent = root;

  // Hardhat = small dome (hemisphere via flattened sphere sitting on head)
  const hat = MeshBuilder.CreateSphere(
    `${name}_Hardhat`,
    { diameterX: 0.48, diameterY: 0.28, diameterZ: 0.48, segments: 8 },
    scene
  );
  hat.position.y = 1.95;
  hat.material = hardhat;
  hat.parent = root;

  const brim = MeshBuilder.CreateCylinder(
    `${name}_HatBrim`,
    { height: 0.06, diameter: 0.55, tessellation: 10 },
    scene
  );
  brim.position.y = 1.86;
  brim.material = hardhat;
  brim.parent = root;

  if (withVest) {
    const vest = MeshBuilder.CreateBox(
      `${name}_Vest`,
      { width: 0.58, height: 0.55, depth: 0.12 },
      scene
    );
    vest.position = new Vector3(0, 1.25, 0.18);
    vest.material = mats.vest;
    vest.parent = root;
  }

  return root;
}

/**
 * Dirt berms + 2–4 kinematic hardhat workers on edge walk loops.
 * Stay clear of crane center / Pad A–B work.
 */
export function createYardDressing(
  scene: Scene,
  mats: SharedMaterials
): YardDressing {
  const root = new TransformNode("YardDressingRoot", scene);
  const half = YARD_SIZE / 2 - 6;

  // Berms near fence corners / edges — not blocking pads or gravel path
  createBerm("DirtBerm1", scene, mats, root, half - 4, half - 8, 1.15);
  createBerm("DirtBerm2", scene, mats, root, -half + 6, -half + 10, 1.0);
  createBerm("DirtBerm3", scene, mats, root, half - 10, -half + 6, 0.9);
  createBerm("DirtBerm4", scene, mats, root, 28, 32, 0.75); // NE, away from shed path
  createBerm("DirtBerm5", scene, mats, root, -8, -half + 5, 0.85);

  const workerDefs: {
    name: string;
    coveralls: StandardMaterial;
    hat: StandardMaterial;
    vest: boolean;
    waypoints: Vector3[];
    speed: number;
    startU: number;
  }[] = [
    {
      // Near shed / west fence — clear of crane
      name: "AmbientWorker1",
      coveralls: mats.coverallsBlue,
      hat: mats.hardhatYellow,
      vest: true,
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
      // Along north fence edge
      name: "AmbientWorker2",
      coveralls: mats.coverallsGreen,
      hat: mats.hardhatOrange,
      vest: false,
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
      // Near Pad A edge (south of pad, not on pad) — stays z≈6, x west of pad work
      name: "AmbientWorker3",
      coveralls: mats.coverallsBlue,
      hat: mats.hardhatOrange,
      vest: true,
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
      // East fence near Pad B but outside work area
      name: "AmbientWorker4",
      coveralls: mats.coverallsGreen,
      hat: mats.hardhatYellow,
      vest: false,
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
    const worker = createWorker(
      def.name,
      scene,
      mats,
      def.coveralls,
      def.hat,
      def.vest
    );
    worker.parent = root;
    const start = def.waypoints[0]!;
    worker.position.copyFrom(start);
    return {
      root: worker,
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
        // Occasional brief pause at corners
        if (Math.random() < 0.35) {
          loop.pauseLeft = 0.8 + Math.random() * 1.5;
        }
        continue;
      }

      const pos = Vector3.Lerp(a, b, loop.u);
      loop.root.position.copyFrom(pos);
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      if (dx * dx + dz * dz > 0.001) {
        loop.root.rotation.y = Math.atan2(dx, dz);
      }
    }
  };

  return { root, update };
}
