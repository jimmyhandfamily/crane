import { PerspectiveCamera, Vector3 } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  CAMERA_BETA,
  CAMERA_BETA_MAX,
  CAMERA_BETA_MIN,
  CAMERA_RADIUS_MAX,
  CAMERA_RADIUS_MIN,
  CAMERA_START_RADIUS,
} from "../config/units";

/**
 * OrbitControls ≈ ArcRotateCamera: ~60° look-down, orbit + zoom only.
 */
export function createOrbitCamera(
  canvas: HTMLCanvasElement
): { camera: PerspectiveCamera; controls: OrbitControls } {
  const camera = new PerspectiveCamera(
    45,
    canvas.clientWidth / Math.max(canvas.clientHeight, 1),
    0.5,
    500
  );
  camera.name = "OrbitCam";

  const target = new Vector3(0, 12, 0);
  const alpha = -Math.PI / 4;
  const beta = CAMERA_BETA;
  const r = CAMERA_START_RADIUS;
  camera.position.set(
    target.x + r * Math.sin(beta) * Math.sin(alpha),
    target.y + r * Math.cos(beta),
    target.z + r * Math.sin(beta) * Math.cos(alpha)
  );

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(target);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minPolarAngle = CAMERA_BETA_MIN;
  controls.maxPolarAngle = CAMERA_BETA_MAX;
  controls.minDistance = CAMERA_RADIUS_MIN;
  controls.maxDistance = CAMERA_RADIUS_MAX;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 0.9;
  controls.update();

  return { camera, controls };
}
