import {
  ArcRotateCamera,
  Scene,
  Vector3,
} from "@babylonjs/core";
import {
  CAMERA_BETA,
  CAMERA_BETA_MAX,
  CAMERA_BETA_MIN,
  CAMERA_RADIUS_MAX,
  CAMERA_RADIUS_MIN,
  CAMERA_START_RADIUS,
} from "../config/units";

/**
 * ArcRotateCamera: ~60° look-down (beta ≈ π/3),
 * orbit + zoom only, start radius ~80–120, clamped high.
 */
export function createOrbitCamera(
  scene: Scene,
  canvas: HTMLCanvasElement
): ArcRotateCamera {
  const target = new Vector3(0, 12, 0); // aim at mid-mast

  const camera = new ArcRotateCamera(
    "OrbitCam",
    -Math.PI / 4, // alpha — nice 3/4 view
    CAMERA_BETA, // beta ≈ π/3 (~60° from vertical / look-down)
    CAMERA_START_RADIUS,
    target,
    scene
  );

  camera.attachControl(canvas, true);

  // Orbit + zoom only — disable panning
  camera.panningSensibility = 0;
  camera.allowUpsideDown = false;

  // Keep camera high / sensible zoom
  camera.lowerBetaLimit = CAMERA_BETA_MIN;
  camera.upperBetaLimit = CAMERA_BETA_MAX;
  camera.lowerRadiusLimit = CAMERA_RADIUS_MIN;
  camera.upperRadiusLimit = CAMERA_RADIUS_MAX;

  camera.wheelPrecision = 20;
  camera.angularSensibilityX = 2000;
  camera.angularSensibilityY = 2000;

  camera.minZ = 0.5;
  camera.maxZ = 500;

  return camera;
}
