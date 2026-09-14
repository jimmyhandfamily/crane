/**
 * Kinematic cable/hook pendulum + light boom flex (Three.js).
 * Spring-damper integration (no PhysX). Wind stub for future weather.
 *
 * Tuned MILD — real crane cable feel, not playground swing:
 * - SWAY_ACCEL_GAIN ~0.30, SWAY_DAMPING_ZETA ~0.48
 * - Max angle ~7°, boom flex nearly invisible
 * - Loaded sway only modestly more than empty
 */

import { Mesh, Vector3 } from "three";
import type { CraneParts } from "./placeholderCrane";

/** Gravity (m/s²). */
export const PHYS_G = 9.81;

/** Hook block mass when empty (kg). */
export const HOOK_EMPTY_MASS_KG = 85;

/** Reference load mass for “heavy” HUD / hoist slowdown (kg). */
export const LOAD_HEAVY_REF_KG = 450;

/**
 * Underdamped zeta at empty hook. Higher = faster settle.
 * ~0.48 → settle roughly 0.8–1.5 s after stop (milder than Babylon M3).
 */
export const SWAY_DAMPING_ZETA = 0.48;

/** How strongly support acceleration couples into pendulum. Mild. */
export const SWAY_ACCEL_GAIN = 0.3;

/** Extra sway amplitude from attached mass (modest). */
export const SWAY_LOAD_GAIN = 0.12;

/** Mass factor that lengthens settle time when loaded (small). */
export const SWAY_LOAD_DAMP_SOFTEN = 0.25;

/** Max pendulum angle from vertical (radians) ≈ 7°. */
export const SWAY_MAX_ANGLE = (7 * Math.PI) / 180;

/** Boom tip flex spring (rad/s² per rad). */
export const BOOM_FLEX_STIFFNESS = 40;
/** Boom tip flex damping (1/s). */
export const BOOM_FLEX_DAMPING = 14;
/** Boom flex from support accel — nearly invisible. */
export const BOOM_FLEX_GAIN = 0.00012;
/** Clamp boom flex (radians) ≈ 0.23°. */
export const BOOM_FLEX_MAX = 0.004;

/** Hoist speed multiplier when carrying LOAD_HEAVY_REF_KG (empty = 1). */
export const HOIST_LOADED_SPEED_FACTOR = 0.72;

export interface CranePhysics {
  windForce: Vector3;
  setWind(dir: Vector3, strength: number): void;
  setLoadMass(kg: number): void;
  getLoadMass(): number;
  getTotalMass(): number;
  update(dt: number, parts: CraneParts, cableLength: number): void;
  reset(): void;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

const _up = new Vector3(0, 1, 0);
const _dir = new Vector3();
const _axis = new Vector3();
const _attach = new Vector3();

function alignCylinderYToDir(mesh: Mesh, dir: Vector3): void {
  _dir.copy(dir);
  if (_dir.lengthSq() < 1e-10) _dir.set(0, -1, 0);
  else _dir.normalize();
  const dot = clamp(_up.dot(_dir), -1, 1);
  if (1 - Math.abs(dot) < 1e-6) {
    if (dot > 0) mesh.quaternion.identity();
    else mesh.quaternion.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI);
    return;
  }
  _axis.crossVectors(_up, _dir).normalize();
  const angle = Math.acos(dot);
  mesh.quaternion.setFromAxisAngle(_axis, angle);
}

export function createCranePhysics(): CranePhysics {
  const windForce = new Vector3(0, 0, 0);
  let loadMassKg = 0;

  let ox = 0;
  let oz = 0;
  let vx = 0;
  let vz = 0;

  let prevAttachX = 0;
  let prevAttachZ = 0;
  let prevSupportVx = 0;
  let prevSupportVz = 0;
  let primed = false;

  let flexX = 0;
  let flexZ = 0;
  let flexVx = 0;
  let flexVz = 0;
  let boomRestX = 0;
  let boomRestZ = 0;
  let boomRestCaptured = false;

  const api: CranePhysics = {
    windForce,
    setWind(dir: Vector3, strength: number): void {
      if (strength <= 0 || dir.lengthSq() < 1e-10) {
        windForce.set(0, 0, 0);
        return;
      }
      _dir.copy(dir).normalize();
      windForce.copy(_dir).multiplyScalar(strength);
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
      if (dt > 0.1) primed = false;

      parts.trolley.updateWorldMatrix(true, false);
      parts.trolley.getWorldPosition(_attach);

      if (!boomRestCaptured) {
        boomRestX = parts.boomRoot.rotation.x;
        boomRestZ = parts.boomRoot.rotation.z;
        boomRestCaptured = true;
      }

      if (!primed || dt <= 0 || dt > 0.1) {
        prevAttachX = _attach.x;
        prevAttachZ = _attach.z;
        prevSupportVx = 0;
        prevSupportVz = 0;
        primed = true;
        applyVisuals(parts, cableLength, ox, oz);
        applyBoomFlex(parts, 0, 0);
        return;
      }

      const supportVx = (_attach.x - prevAttachX) / dt;
      const supportVz = (_attach.z - prevAttachZ) / dt;
      let supportAx = (supportVx - prevSupportVx) / dt;
      let supportAz = (supportVz - prevSupportVz) / dt;
      supportAx = clamp(supportAx, -40, 40);
      supportAz = clamp(supportAz, -40, 40);

      const L = Math.max(cableLength, 1.5);
      const m = HOOK_EMPTY_MASS_KG + loadMassKg;
      const loadT = clamp(loadMassKg / LOAD_HEAVY_REF_KG, 0, 1.4);

      const omega = Math.sqrt(PHYS_G / L);
      const zeta =
        SWAY_DAMPING_ZETA / Math.sqrt(1 + loadT * SWAY_LOAD_DAMP_SOFTEN);
      const accelGain = SWAY_ACCEL_GAIN * (1 + loadT * SWAY_LOAD_GAIN);

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
        const radialV = (vx * ox + vz * oz) / (mag * mag);
        if (radialV > 0) {
          vx -= radialV * ox;
          vz -= radialV * oz;
        }
      }

      prevAttachX = _attach.x;
      prevAttachZ = _attach.z;
      prevSupportVx = supportVx;
      prevSupportVz = supportVz;

      const yaw = parts.slewing.rotation.y;
      const cos = Math.cos(yaw);
      const sin = Math.sin(yaw);
      const localAx = supportAx * cos + supportAz * sin;
      const localAz = -supportAx * sin + supportAz * cos;
      const targetFlexX = clamp(
        -localAz * BOOM_FLEX_GAIN,
        -BOOM_FLEX_MAX,
        BOOM_FLEX_MAX
      );
      const targetFlexZ = clamp(
        localAx * BOOM_FLEX_GAIN,
        -BOOM_FLEX_MAX,
        BOOM_FLEX_MAX
      );
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
    const localX = worldOx * cos + worldOz * sin;
    const localZ = -worldOx * sin + worldOz * cos;

    const L = Math.max(cableLength, 0.05);
    const r = Math.hypot(localX, localZ);
    const hang = -Math.sqrt(Math.max(L * L - r * r, L * L * 0.25));

    const hookY = hang - 0.45;
    const ringY = hang - 1.0;
    parts.hook.position.set(localX, hookY, localZ);
    parts.hookRing.position.set(localX, ringY, localZ);

    _dir.set(localX, hang, localZ);
    const len = Math.max(_dir.length(), 0.05);
    parts.cable.scale.set(1, len, 1);
    parts.cable.position.set(localX * 0.5, hang * 0.5, localZ * 0.5);
    alignCylinderYToDir(parts.cable, _dir);
  }

  return api;
}

export function hoistSpeedFactorForMass(loadMassKg: number): number {
  const t = clamp(loadMassKg / LOAD_HEAVY_REF_KG, 0, 1.25);
  return 1 - (1 - HOIST_LOADED_SPEED_FACTOR) * Math.min(t, 1);
}

export type LoadMeterBand = "empty" | "light" | "heavy";

export function loadMeterBand(loadMassKg: number): LoadMeterBand {
  if (loadMassKg <= 0) return "empty";
  if (loadMassKg < LOAD_HEAVY_REF_KG * 0.75) return "light";
  return "heavy";
}
