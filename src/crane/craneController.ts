import type { CraneParts } from "./placeholderCrane";
import { placeHoist } from "./placeholderCrane";
import {
  createCranePhysics,
  hoistSpeedFactorForMass,
  type CranePhysics,
} from "./cranePhysics";

/** Radians per second for slew. */
export const SLEW_SPEED = 0.55;
/** Meters per second for trolley travel. */
export const TROLLEY_SPEED = 8;
/** Meters per second for hoist (cable length change) when empty. */
export const HOIST_SPEED = 6;

/** Soft hook clearance above ground (m). */
export const HOOK_GROUND_CLEARANCE = 0.6;

export interface CraneInput {
  /** -1 left (A), +1 right (D) */
  slew: number;
  /** -1 in toward mast (S), +1 out toward tip (W) */
  trolley: number;
  /** -1 lower (F / lengthen), +1 raise (R / shorten) */
  hoist: number;
}

export interface CraneController {
  parts: CraneParts;
  /** Cable / hook pendulum + boom flex + wind stub. */
  physics: CranePhysics;
  /** Current slew yaw (radians). */
  slewYaw: number;
  /** Current trolley Z along boom (local). */
  trolleyZ: number;
  /** Current cable length (m). */
  cableLength: number;
  applyInput(input: CraneInput, dt: number): void;
  /**
   * Re-apply kinematic pose from state, then overlay sway.
   * Pass dt when available so pendulum integrates; 0 = visuals only.
   */
  sync(dt?: number): void;
  /** Notify physics of attached load mass (kg). 0 = empty. */
  setAttachedLoadMass(kg: number): void;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Max cable length so the hook (bottom of ring ~ cableLength+1.0) stays
 * above ground clearance. BoomWorldY is attachment height.
 */
function maxCableForGround(boomWorldY: number): number {
  // hookRing at local y = -cableLength - 1.0 → world ≈ boomWorldY - cableLength - 1
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

      // Slew — free rotation (no hard yaw limits)
      if (input.slew !== 0) {
        ctrl.slewYaw += input.slew * SLEW_SPEED * dt;
        if (ctrl.slewYaw > Math.PI * 4 || ctrl.slewYaw < -Math.PI * 4) {
          ctrl.slewYaw = ((ctrl.slewYaw + Math.PI) % (Math.PI * 2)) - Math.PI;
        }
      }

      // Trolley along boom
      if (input.trolley !== 0) {
        ctrl.trolleyZ = clamp(
          ctrl.trolleyZ + input.trolley * TROLLEY_SPEED * dt,
          parts.trolleyZMin,
          parts.trolleyZMax
        );
      }

      // Hoist: +raise shortens cable, +lower lengthens (slower when loaded)
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

      // Ideal kinematic hoist; physics overlays sway / cable lean
      placeHoist(parts.cable, parts.hook, parts.hookRing, ctrl.cableLength);
      parts.cable.rotationQuaternion = null;
      parts.cable.rotation.set(0, 0, 0);

      physics.update(dt > 0 ? dt : 1 / 60, parts, ctrl.cableLength);
    },
  };

  ctrl.sync(0);
  return ctrl;
}
