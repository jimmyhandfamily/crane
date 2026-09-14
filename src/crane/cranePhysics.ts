/**
 * Kinematic cable/hook pendulum + light boom flex.
 * Spring-damper integration (no PhysX). Wind stub for future weather.
 *
 * Tuning (see STATUS.md):
 * - SWAY_DAMPING_ZETA ≈ 0.20 empty → settle ~1.5–2.5 s
 * - LOAD_MASS slows damping & boosts sway amplitude slightly
 * - BOOM_FLEX_* kept very small (≤ ~0.8°)
 */

import { Mesh, Quaternion, Vector3 } from "@babylonjs/core";
import type { CraneParts } from "./placeholderCrane";

/** Gravity (m/s²). */
export const PHYS_G = 9.81;

/** Hook block mass when empty (kg). */
export const HOOK_EMPTY_MASS_KG = 85;

/** Reference load mass for “heavy” HUD / hoist slowdown (kg). */
export const LOAD_HEAVY_REF_KG = 450;

/**
 * Underdamped zeta at empty hook. Higher = faster settle.
 * ~0.20 with L≈18 m → settle roughly 1.5–2.5 s after stop.
 */
export const SWAY_DAMPING_ZETA = 0.20;

/** How strongly support acceleration couples into pendulum (1 = textbook). */
export const SWAY_ACCEL_GAIN = 0.92;

/** Extra sway amplitude from attached mass (0–1 scale at LOAD_HEAVY_REF_KG). */
export const SWAY_LOAD_GAIN = 0.38;

/** Mass factor that lengthens settle time when loaded. */
export const SWAY_LOAD_DAMP_SOFTEN = 0.55;

/** Max pendulum angle from vertical (radians) ≈ 18°. */
export const SWAY_MAX_ANGLE = (18 * Math.PI) / 180;

/** Boom tip flex spring (rad/s² per rad). */
export const BOOM_FLEX_STIFFNESS = 28;
/** Boom tip flex damping (1/s). */
export const BOOM_FLEX_DAMPING = 9;
/** Boom flex from support accel (rad per m/s²) — keep tiny. */
export const BOOM_FLEX_GAIN = 0.00055;
/** Clamp boom flex (radians) ≈ 0.8°. */
export const BOOM_FLEX_MAX = 0.014;

/** Hoist speed multiplier when carrying LOAD_HEAVY_REF_KG (empty = 1). */
export const HOIST_LOADED_SPEED_FACTOR = 0.72;

export interface CranePhysics {
  /** World-space wind force stub (N). Default zero — future weather. */
  windForce: Vector3;
  /**
   * Stub for future weather systems.
   * Sets `windForce = normalize(dir) * strength`. Pass strength 0 to clear.
   * Currently no-op beyond storing the vector (applied in integration).
   */
  setWind(dir: Vector3, strength: number): void;
  /** Attached load mass in kg (0 = empty hook). */
  setLoadMass(kg: number): void;
  getLoadMass(): number;
  /** Total hanging mass (hook + load) kg. */
  getTotalMass(): number;
  /**
   * Integrate sway + boom flex and apply visual offsets.
   * Call after kinematic sync (slew/trolley/cable setpoints applied).
   */
  update(dt: number, parts: CraneParts, cableLength: number): void;
  /** Reset pendulum state (e.g. teleport). */
  reset(): void;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function alignCylinderYToDir(mesh: Mesh, dir: Vector3): void {
  const d = dir.lengthSquared() < 1e-10 ? new Vector3(0, -1, 0) : dir.normalize();
  const up = Vector3.Up();
  const dot = clamp(Vector3.Dot(up, d), -1, 1);
  if (1 - Math.abs(dot) < 1e-6) {
    mesh.rotationQuaternion =
      dot > 0
        ? Quaternion.Identity()
        : Quaternion.RotationAxis(Vector3.Right(), Math.PI);
    return;
  }
  const axis = Vector3.Cross(up, d).normalize();
  const angle = Math.acos(dot);
  mesh.rotationQuaternion = Quaternion.RotationAxis(axis, angle);
}

export function createCranePhysics(): CranePhysics {
  const windForce = new Vector3(0, 0, 0);
  let loadMassKg = 0;

  // Pendulum offset in world XZ (hook horizontal lag from vertical hang)
  let ox = 0;
  let oz = 0;
  let vx = 0;
  let vz = 0;

  let prevAttachX = 0;
  let prevAttachZ = 0;
  let prevSupportVx = 0;
  let prevSupportVz = 0;
  let primed = false;

  // Boom flex (additive euler on BoomRoot)
  let flexX = 0;
  let flexZ = 0;
  let flexVx = 0;
  let flexVz = 0;
  let boomRestX = 0;
  let boomRestZ = 0;
  let boomRestCaptured = false;

  const tmpDir = new Vector3();

  const api: CranePhysics = {
    windForce,
    setWind(dir: Vector3, strength: number): void {
      if (strength <= 0 || dir.lengthSquared() < 1e-10) {
        windForce.set(0, 0, 0);
        return;
      }
      const n = dir.normalize();
      windForce.set(n.x * strength, n.y * strength, n.z * strength);
    },
    setLoadMass(kg: number): void {
      loadMassKg = Math.max(0, kg);
    },
    getLoadMass(): number {
      return loadMassKg;
    },
    getTotalMass(): number {
      return HOOK_EMPTY_MASS_KG + loadMassKg;
    },
    reset(): void {
      ox = oz = vx = vz = 0;
      primed = false;
      flexX = flexZ = flexVx = flexVz = 0;
    },
    update(dt: number, parts: CraneParts, cableLength: number): void {
      if (dt <= 0 || dt > 0.1) {
        // Spikes / pause — keep visuals consistent, skip integration
        if (dt > 0.1) primed = false;
      }

      parts.trolley.computeWorldMatrix(true);
      const attach = parts.trolley.getAbsolutePosition();

      if (!boomRestCaptured) {
        boomRestX = parts.boomRoot.rotation.x;
        boomRestZ = parts.boomRoot.rotation.z;
        boomRestCaptured = true;
      }

      if (!primed || dt <= 0 || dt > 0.1) {
        prevAttachX = attach.x;
        prevAttachZ = attach.z;
        prevSupportVx = 0;
        prevSupportVz = 0;
        primed = true;
        applyVisuals(parts, cableLength, ox, oz);
        applyBoomFlex(parts, 0, 0);
        return;
      }

      const supportVx = (attach.x - prevAttachX) / dt;
      const supportVz = (attach.z - prevAttachZ) / dt;
      // Clamp accel spikes from discrete input edges
      let supportAx = (supportVx - prevSupportVx) / dt;
      let supportAz = (supportVz - prevSupportVz) / dt;
      supportAx = clamp(supportAx, -40, 40);
      supportAz = clamp(supportAz, -40, 40);

      const L = Math.max(cableLength, 1.5);
      const m = HOOK_EMPTY_MASS_KG + loadMassKg;
      const loadT = clamp(loadMassKg / LOAD_HEAVY_REF_KG, 0, 1.4);

      const omega = Math.sqrt(PHYS_G / L);
      const zeta =
        SWAY_DAMPING_ZETA /
        Math.sqrt(1 + loadT * SWAY_LOAD_DAMP_SOFTEN);
      const accelGain = SWAY_ACCEL_GAIN * (1 + loadT * SWAY_LOAD_GAIN);

      // Non-inertial frame: fictitious -a_support; wind as force/mass
      const windAx = windForce.x / m;
      const windAz = windForce.z / m;

      const ax =
        -omega * omega * ox -
        2 * zeta * omega * vx -
        accelGain * supportAx +
        windAx;
      const az =
        -omega * omega * oz -
        2 * zeta * omega * vz -
        accelGain * supportAz +
        windAz;

      vx += ax * dt;
      vz += az * dt;
      ox += vx * dt;
      oz += vz * dt;

      const maxOff = L * Math.tan(SWAY_MAX_ANGLE);
      const mag = Math.hypot(ox, oz);
      if (mag > maxOff && mag > 1e-8) {
        const s = maxOff / mag;
        ox *= s;
        oz *= s;
        // Kill outward radial velocity
        const radialV = (vx * ox + vz * oz) / (mag * mag);
        if (radialV > 0) {
          vx -= radialV * ox;
          vz -= radialV * oz;
        }
      }

      prevAttachX = attach.x;
      prevAttachZ = attach.z;
      prevSupportVx = supportVx;
      prevSupportVz = supportVz;

      // --- Light boom flex (trolley-local accel via slewing yaw) ---
      const yaw = parts.slewing.rotation.y;
      const cos = Math.cos(yaw);
      const sin = Math.sin(yaw);
      // World accel → boom-local (same as trolley parent)
      const localAx = supportAx * cos + supportAz * sin;
      const localAz = -supportAx * sin + supportAz * cos;
      const targetFlexX = clamp(-localAz * BOOM_FLEX_GAIN, -BOOM_FLEX_MAX, BOOM_FLEX_MAX);
      const targetFlexZ = clamp(localAx * BOOM_FLEX_GAIN, -BOOM_FLEX_MAX, BOOM_FLEX_MAX);
      // Spring-damper toward target (lag feel)
      const fAx =
        BOOM_FLEX_STIFFNESS * (targetFlexX - flexX) - BOOM_FLEX_DAMPING * flexVx;
      const fAz =
        BOOM_FLEX_STIFFNESS * (targetFlexZ - flexZ) - BOOM_FLEX_DAMPING * flexVz;
      flexVx += fAx * dt;
      flexVz += fAz * dt;
      flexX += flexVx * dt;
      flexZ += flexVz * dt;
      flexX = clamp(flexX, -BOOM_FLEX_MAX, BOOM_FLEX_MAX);
      flexZ = clamp(flexZ, -BOOM_FLEX_MAX, BOOM_FLEX_MAX);

      applyBoomFlex(parts, flexX, flexZ);
      applyVisuals(parts, cableLength, ox, oz);
    },
  };

  function applyBoomFlex(parts: CraneParts, fx: number, fz: number): void {
    parts.boomRoot.rotation.x = boomRestX + fx;
    parts.boomRoot.rotation.z = boomRestZ + fz;
  }

  function applyVisuals(
    parts: CraneParts,
    cableLength: number,
    worldOx: number,
    worldOz: number
  ): void {
    const yaw = parts.slewing.rotation.y;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    // World XZ offset → trolley local
    const localX = worldOx * cos + worldOz * sin;
    const localZ = -worldOx * sin + worldOz * cos;

    const L = Math.max(cableLength, 0.05);
    const r = Math.hypot(localX, localZ);
    // Preserve cable length: drop Y slightly when swayed
    const hang = -Math.sqrt(Math.max(L * L - r * r, L * L * 0.25));

    const hookY = hang - 0.45;
    const ringY = hang - 1.0;
    parts.hook.position.set(localX, hookY, localZ);
    parts.hookRing.position.set(localX, ringY, localZ);

    // Cable from trolley origin toward hook top (hang)
    tmpDir.set(localX, hang, localZ);
    const len = Math.max(tmpDir.length(), 0.05);
    parts.cable.scaling.set(1, len, 1);
    parts.cable.position.set(localX * 0.5, hang * 0.5, localZ * 0.5);
    parts.cable.rotationQuaternion = null;
    alignCylinderYToDir(parts.cable, tmpDir);
  }

  return api;
}

/** Hoist speed scale given attached load mass (kg). Empty → 1. */
export function hoistSpeedFactorForMass(loadMassKg: number): number {
  const t = clamp(loadMassKg / LOAD_HEAVY_REF_KG, 0, 1.25);
  return 1 - (1 - HOIST_LOADED_SPEED_FACTOR) * Math.min(t, 1);
}

/** HUD band from mass. */
export type LoadMeterBand = "empty" | "light" | "heavy";

export function loadMeterBand(loadMassKg: number): LoadMeterBand {
  if (loadMassKg <= 0) return "empty";
  if (loadMassKg < LOAD_HEAVY_REF_KG * 0.75) return "light";
  return "heavy";
}
