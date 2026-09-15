/**
 * Fence gate sections at west entry + north exit.
 * Open when AmbientTruck/Mixer near; close after they pass.
 */
import { Object3D, Scene } from "three";
import { YARD_SIZE } from "../config/units";
import type { SharedMaterials } from "./materials";
import { box, group } from "./meshHelpers";
import type { GateOpenAmounts } from "./ambientTraffic";

export interface TruckXZ {
  x: number;
  z: number;
  visible: boolean;
}

export interface YardGates {
  root: Object3D;
  update(trucks: TruckXZ[], dt: number): void;
  getOpenAmounts(): GateOpenAmounts;
}

const OPEN_NEAR = 14;
const CLOSE_FAR = 22;
const OPEN_ANGLE = Math.PI * 0.72; // ~130°
const SWING_SPEED = 1.8; // rad/s → amount rate = SWING_SPEED / OPEN_ANGLE

function createGateLeaf(
  name: string,
  mats: SharedMaterials,
  parent: Object3D,
  hingeX: number,
  hingeZ: number,
  leafLen: number,
  baseYaw: number,
  openSign: number
): Object3D {
  const hinge = group(name, parent);
  hinge.position.set(hingeX, 0, hingeZ);

  const postH = 1.35;
  const postW = 0.28;
  const railH = 0.16;
  const railD = 0.2;

  const post = box(`${name}_Post`, postW, postH, postW, mats.fence, hinge);
  post.position.set(0, postH / 2, 0);

  // Fence cap
  const cap = box(`${name}_Cap`, postW * 1.25, 0.1, postW * 1.25, mats.steelDark, hinge);
  cap.position.set(0, postH + 0.05, 0);

  const panel = box(
    `${name}_Panel`,
    railD,
    1.05,
    leafLen - 0.15,
    mats.fence,
    hinge
  );
  panel.position.set(0, 0.7, leafLen / 2);

  for (const railY of [0.4, 1.0] as const) {
    const rail = box(
      `${name}_Rail_${railY}`,
      railD * 0.9,
      railH,
      leafLen - 0.2,
      mats.fence,
      hinge
    );
    rail.position.set(0, railY, leafLen / 2);
  }

  hinge.userData.baseYaw = baseYaw;
  hinge.userData.openSign = openSign;
  hinge.rotation.y = baseYaw;
  return hinge;
}

export function createYardGates(scene: Scene, mats: SharedMaterials): YardGates {
  const root = group("YardGates");
  scene.add(root);

  const half = YARD_SIZE / 2 - 1.5; // matches fence
  const gateHalf = 5.5;
  const leafLen = gateHalf - 0.15;

  // West entry (x = -half): leaves swing open for trucks on gravel path
  const westLeaves = [
    createGateLeaf("GateWest_L", mats, root, -half, -gateHalf, leafLen, 0, 1),
    createGateLeaf("GateWest_R", mats, root, -half, gateHalf, leafLen, Math.PI, -1),
  ];

  // North exit (z = +half)
  const northLeaves = [
    createGateLeaf(
      "GateNorth_L",
      mats,
      root,
      -gateHalf,
      half,
      leafLen,
      Math.PI / 2,
      1
    ),
    createGateLeaf(
      "GateNorth_R",
      mats,
      root,
      gateHalf,
      half,
      leafLen,
      -Math.PI / 2,
      -1
    ),
  ];

  let westOpen = 0;
  let northOpen = 0;
  const rate = SWING_SPEED / OPEN_ANGLE;

  const nearestDist = (trucks: TruckXZ[], gx: number, gz: number): number => {
    let best = Infinity;
    for (const t of trucks) {
      if (!t.visible) continue;
      const d = Math.hypot(t.x - gx, t.z - gz);
      if (d < best) best = d;
    }
    return best;
  };

  const applyLeaves = (leaves: Object3D[], amount: number): void => {
    for (const hinge of leaves) {
      const base = hinge.userData.baseYaw as number;
      const sign = hinge.userData.openSign as number;
      hinge.rotation.y = base + sign * OPEN_ANGLE * amount;
    }
  };

  const approach = (cur: number, target: number, step: number): number => {
    if (cur < target) return Math.min(target, cur + step);
    if (cur > target) return Math.max(target, cur - step);
    return cur;
  };

  const update = (trucks: TruckXZ[], dt: number): void => {
    const dWest = nearestDist(trucks, -half, 0);
    const dNorth = nearestDist(trucks, 0, half);

    const westTarget =
      dWest < OPEN_NEAR ? 1 : dWest > CLOSE_FAR ? 0 : westOpen >= 0.5 ? 1 : 0;
    const northTarget =
      dNorth < OPEN_NEAR
        ? 1
        : dNorth > CLOSE_FAR
          ? 0
          : northOpen >= 0.5
            ? 1
            : 0;

    const step = rate * dt;
    westOpen = approach(westOpen, westTarget, step);
    northOpen = approach(northOpen, northTarget, step);

    applyLeaves(westLeaves, westOpen);
    applyLeaves(northLeaves, northOpen);
  };

  applyLeaves(westLeaves, 0);
  applyLeaves(northLeaves, 0);

  const getOpenAmounts = (): GateOpenAmounts => ({
    west: westOpen,
    north: northOpen,
  });

  return { root, update, getOpenAmounts };
}
