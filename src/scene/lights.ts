import {
  Color3,
  DirectionalLight,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { Palette } from "../config/palette";

/** Soft hemisphere + warm directional — REALISM REFINE intensities / sun dir. */
export function createLights(scene: Scene): void {
  const hemi = new HemisphericLight(
    "HemiSky",
    new Vector3(0, 1, 0),
    scene
  );
  hemi.intensity = 0.7;
  hemi.diffuse = Color3.FromHexString(Palette.haze);
  hemi.groundColor = Color3.FromHexString(Palette.dirt).scale(0.45);
  hemi.specular = Color3.Black();

  const sun = new DirectionalLight(
    "WarmSun",
    new Vector3(-0.55, -0.75, -0.35),
    scene
  );
  sun.position = new Vector3(40, 80, 30);
  sun.intensity = 1.05;
  sun.diffuse = Color3.FromHexString(Palette.warmSun);
  sun.specular = Color3.FromHexString("#FFE8C0").scale(0.4);
}
