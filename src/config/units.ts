/**
 * World scale: 1 Three.js unit = 1 meter.
 */
export const UNIT = 1; // meters
export const YARD_SIZE = 100; // ~100×100 m training yard
export const CRANE_HEIGHT = 40; // placeholder tower crane ~40 m tall
export const CAMERA_START_RADIUS = 100; // within 80–120
export const CAMERA_BETA = Math.PI / 3; // ~60° look-down (polar from +Y)
export const CAMERA_RADIUS_MIN = 40;
export const CAMERA_RADIUS_MAX = 180;
export const CAMERA_BETA_MIN = 0.35; // keep camera high (not under ground / flat)
export const CAMERA_BETA_MAX = Math.PI / 2.2; // clamp look-down, stay elevated
