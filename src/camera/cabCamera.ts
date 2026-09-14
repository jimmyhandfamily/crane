/**
 * Cab camera toggle: orbit jobsite ↔ cab-ish view near Cab looking along boom.
 */
import { PerspectiveCamera, Vector3 } from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { CraneParts } from "../crane/placeholderCrane";

export interface CabCameraToggle {
  /** true = cab view */
  isCab(): boolean;
  toggle(): void;
  /** Call each frame when in cab mode (follows slewing). */
  update(): void;
}

const _cabWorld = new Vector3();
const _look = new Vector3();
const _fwd = new Vector3();
const _savedPos = new Vector3();
const _savedTarget = new Vector3();

export function createCabCameraToggle(
  camera: PerspectiveCamera,
  controls: OrbitControls,
  parts: CraneParts
): CabCameraToggle {
  let cabMode = false;

  const enterCab = (): void => {
    _savedPos.copy(camera.position);
    _savedTarget.copy(controls.target);
    controls.enabled = false;
    cabMode = true;
    syncCabPose();
  };

  const exitCab = (): void => {
    camera.position.copy(_savedPos);
    controls.target.copy(_savedTarget);
    controls.enabled = true;
    controls.update();
    cabMode = false;
  };

  const syncCabPose = (): void => {
    parts.cab.updateWorldMatrix(true, false);
    parts.cab.getWorldPosition(_cabWorld);

    // Forward along boom = slewing local +Z
    parts.slewing.updateWorldMatrix(true, false);
    _fwd.set(0, 0, 1).transformDirection(parts.slewing.matrixWorld);

    // Sit slightly inside/above cab glass, look out along boom
    camera.position.set(
      _cabWorld.x + _fwd.x * 0.35,
      _cabWorld.y + 0.55,
      _cabWorld.z + _fwd.z * 0.35
    );
    _look.set(
      camera.position.x + _fwd.x * 28,
      camera.position.y - 2.5,
      camera.position.z + _fwd.z * 28
    );
    camera.lookAt(_look);
    camera.updateMatrixWorld();
  };

  return {
    isCab: () => cabMode,
    toggle: () => {
      if (cabMode) exitCab();
      else enterCab();
    },
    update: () => {
      if (cabMode) syncCabPose();
    },
  };
}
