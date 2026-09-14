import {
  Color3,
  Color4,
  Engine,
  Scene,
} from "@babylonjs/core";
import { Palette } from "../config/palette";
import { createOrbitCamera } from "../camera/orbitCamera";
import { createPlaceholderCrane } from "../crane/placeholderCrane";
import { createGround } from "./ground";
import { createLights } from "./lights";
import { createSharedMaterials } from "./materials";
import { createProps } from "./props";

export interface CraneScene {
  scene: Scene;
  engine: Engine;
}

export function createCraneScene(
  engine: Engine,
  canvas: HTMLCanvasElement
): CraneScene {
  const scene = new Scene(engine);
  scene.clearColor = Color4.FromColor3(
    Color3.FromHexString(Palette.sky),
    1
  );
  scene.ambientColor = Color3.FromHexString(Palette.haze).scale(0.35);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.004;
  scene.fogColor = Color3.FromHexString(Palette.haze);

  createLights(scene);
  createOrbitCamera(scene, canvas);

  const mats = createSharedMaterials(scene);
  createGround(scene, mats);
  createPlaceholderCrane(scene, mats);
  createProps(scene, mats);

  return { scene, engine };
}
