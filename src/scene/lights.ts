import {
  AmbientLight,
  Color,
  DirectionalLight,
  HemisphereLight,
  Scene,
} from "three";
import { Palette } from "../config/palette";

/** Soft hemisphere + warm directional. */
export function createLights(scene: Scene): void {
  const hemi = new HemisphereLight(
    new Color(Palette.haze),
    new Color(Palette.dirt).multiplyScalar(0.45),
    0.7
  );
  hemi.name = "HemiSky";
  hemi.position.set(0, 1, 0);
  scene.add(hemi);

  const ambient = new AmbientLight(new Color(Palette.haze), 0.25);
  ambient.name = "AmbientHaze";
  scene.add(ambient);

  const sun = new DirectionalLight(new Color(Palette.warmSun), 1.05);
  sun.name = "WarmSun";
  sun.position.set(40, 80, 30);
  sun.target.position.set(0, 0, 0);
  scene.add(sun);
  scene.add(sun.target);
}
