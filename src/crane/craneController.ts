import type { CraneParts } from "./placeholderCrane";
import { placeHoist } from "./placeholderCrane";

/** Radians per second for slew. */
export const SLEW_SPEED = 0.55;
/** Meters per second for trolley travel. */
export const TROLLEY_SPEED = 8;
/** Meters per second for hoist (cable length change). */
export const HOIST_SPEED = 6;

/** Soft hook clearance above ground (m). */
export const HOOK_GROUND_CLEARANCE = 0.6;
/** Extra margin so hook body / ring don't clip boom underside. */

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
  /** Current slew yaw (radians). */
  slewYaw: number;
  /** Current trolley Z along boom (local). */
  trolleyZ: number;
  /** Current cable length (m). */
  cableLength: number;
  applyInput(input: CraneInput, dt: number): void;
  /** Re-apply pose from state (e.g. after external change). */
  sync(): void;
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
  const ctrl: CraneController = {
    parts,
    slewYaw: 0,
    trolleyZ: parts.initialTrolleyZ,
    cableLength: parts.initialCableLength,
    applyInput(input: CraneInput, dt: number): void {
      if (dt <= 0) return;

      // Slew — free rotation (no hard yaw limits)
      if (input.slew !== 0) {
        ctrl.slewYaw += input.slew * SLEW_SPEED * dt;
        // Keep yaw bounded for numeric hygiene (optional soft wrap)
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

      // Hoist: +raise shortens cable, +lower lengthens
      if (input.hoist !== 0) {
        const groundMax = maxCableForGround(parts.boomWorldY);
        const lo = parts.cableLengthMin;
        const hi = Math.min(parts.cableLengthMax, groundMax);
        // input.hoist +1 = raise = shorten cable
        ctrl.cableLength = clamp(
          ctrl.cableLength - input.hoist * HOIST_SPEED * dt,
          lo,
          hi
        );
      }

      ctrl.sync();
    },
    sync(): void {
      parts.slewing.rotation.y = ctrl.slewYaw;
      // Spin turntable mesh with slewing for visual continuity
      parts.turntable.rotation.y = ctrl.slewYaw;

      parts.trolley.position.z = ctrl.trolleyZ;
      placeHoist(parts.cable, parts.hook, parts.hookRing, ctrl.cableLength);
    },
  };

  ctrl.sync();
  return ctrl;
}
