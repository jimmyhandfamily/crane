import {
  AmbientLight,
  Color,
  DirectionalLight,
  HemisphereLight,
  Scene,
} from "three";
import { Palette } from "../config/palette";

/** Hemisphere + warm directional with soft shadow maps for depth. */
export function createLights(scene: Scene): DirectionalLight {
  const hemi = new HemisphereLight(
    new Color("#B8D4E8"),
    new Color(Palette.dirt).multiplyScalar(0.5),
    0.55
  );
  hemi.name = "HemiSky";
  hemi.position.set(0, 1, 0);
  scene.add(hemi);

  const ambient = new AmbientLight(new Color(Palette.haze), 0.18);
  ambient.name = "AmbientHaze";
  scene.add(ambient);

  const sun = new DirectionalLight(new Color(Palette.warmSun), 1.35);
  sun.name = "WarmSun";
  sun.position.set(55, 90, 35);
  sun.target.position.set(0, 8, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 220;
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 2.5;
  scene.add(sun);
  scene.add(sun.target);
  return sun;
}
