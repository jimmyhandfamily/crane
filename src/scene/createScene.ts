import {
  Color,
  FogExp2,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Palette } from "../config/palette";
import { createOrbitCamera } from "../camera/orbitCamera";
import {
  createPlaceholderCrane,
  createCraneController,
  type CraneController,
} from "../crane";
import { createLoadManager, type LoadManager } from "../loads";
import { createAmbientTraffic, type AmbientTraffic } from "./ambientTraffic";
import { createBlobShadows, type BlobShadows } from "./blobShadows";
import { createGround } from "./ground";
import { createLights } from "./lights";
import { createSharedMaterials } from "./materials";
import { createProps } from "./props";
import { createYardDressing, type YardDressing } from "./yardDressing";

export interface CraneScene {
  scene: Scene;
  renderer: WebGLRenderer;
  camera: PerspectiveCamera;
  controls: OrbitControls;
  crane: CraneController;
  loads: LoadManager;
  blobShadows: BlobShadows;
  ambientTraffic: AmbientTraffic;
  yardDressing: YardDressing;
}

export function createCraneScene(
  renderer: WebGLRenderer,
  canvas: HTMLCanvasElement
): CraneScene {
  const scene = new Scene();
  scene.background = new Color(Palette.sky);
  scene.fog = new FogExp2(Palette.haze, 0.004);

  createLights(scene);
  const { camera, controls } = createOrbitCamera(canvas);

  const mats = createSharedMaterials();
  createGround(scene, mats);
  const parts = createPlaceholderCrane(scene, mats);
  const crane = createCraneController(parts);
  const { loads: loadItems, pads, root: propsRoot } = createProps(scene, mats);
  const loads = createLoadManager(loadItems, pads, propsRoot);
  const blobShadows = createBlobShadows(scene);
  const ambientTraffic = createAmbientTraffic(scene, mats);
  const yardDressing = createYardDressing(scene, mats);

  return {
    scene,
    renderer,
    camera,
    controls,
    crane,
    loads,
    blobShadows,
    ambientTraffic,
    yardDressing,
  };
}
