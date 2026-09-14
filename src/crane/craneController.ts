import type { CraneParts } from "./placeholderCrane";
import { placeHoist } from "./placeholderCrane";
import {
  createCranePhysics,
  hoistSpeedFactorForMass,
  type CranePhysics,
} from "./cranePhysics";

export const SLEW_SPEED = 0.55;
export const TROLLEY_SPEED = 8;
export const HOIST_SPEED = 6;
export const HOOK_GROUND_CLEARANCE = 0.6;

export interface CraneInput {
  slew: number;
  trolley: number;
  hoist: number;
}

export interface CraneController {
  parts: CraneParts;
  physics: CranePhysics;
  slewYaw: number;
  trolleyZ: number;
  cableLength: number;
  applyInput(input: CraneInput, dt: number): void;
  sync(dt?: number): void;
  setAttachedLoadMass(kg: number): void;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function maxCableForGround(boomWorldY: number): number {
  return boomWorldY - 1.0 - HOOK_GROUND_CLEARANCE;
}

export function createCraneController(parts: CraneParts): CraneController {
  const physics = createCranePhysics();

  const ctrl: CraneController = {
    parts,
    physics,
    slewYaw: 0,
    trolleyZ: parts.initialTrolleyZ,
    cableLength: parts.initialCableLength,
    setAttachedLoadMass(kg: number): void {
      physics.setLoadMass(kg);
    },
    applyInput(input: CraneInput, dt: number): void {
      if (dt <= 0) return;

      if (input.slew !== 0) {
        ctrl.slewYaw += input.slew * SLEW_SPEED * dt;
        if (ctrl.slewYaw > Math.PI * 4 || ctrl.slewYaw < -Math.PI * 4) {
          ctrl.slewYaw = ((ctrl.slewYaw + Math.PI) % (Math.PI * 2)) - Math.PI;
        }
      }

      if (input.trolley !== 0) {
        ctrl.trolleyZ = clamp(
          ctrl.trolleyZ + input.trolley * TROLLEY_SPEED * dt,
          parts.trolleyZMin,
          parts.trolleyZMax
        );
      }

      if (input.hoist !== 0) {
        const groundMax = maxCableForGround(parts.boomWorldY);
        const lo = parts.cableLengthMin;
        const hi = Math.min(parts.cableLengthMax, groundMax);
        const hoistMul = hoistSpeedFactorForMass(physics.getLoadMass());
        ctrl.cableLength = clamp(
          ctrl.cableLength - input.hoist * HOIST_SPEED * hoistMul * dt,
          lo,
          hi
        );
      }

      ctrl.sync(dt);
    },
    sync(dt = 0): void {
      parts.slewing.rotation.y = ctrl.slewYaw;
      parts.turntable.rotation.y = ctrl.slewYaw;
      parts.trolley.position.z = ctrl.trolleyZ;

      placeHoist(parts.cable, parts.hook, parts.hookRing, ctrl.cableLength);
      parts.cable.quaternion.identity();
      parts.cable.rotation.set(0, 0, 0);

      physics.update(dt > 0 ? dt : 1 / 60, parts, ctrl.cableLength);
    },
  };

  ctrl.sync(0);
  return ctrl;
}
