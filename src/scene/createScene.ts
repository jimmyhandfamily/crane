import {
  FogExp2,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createOrbitCamera } from "../camera/orbitCamera";
import {
  createPlaceholderCrane,
  createCraneController,
  type CraneController,
} from "../crane";
import { createLoadManager, type LoadManager } from "../loads";
import { createAmbientTraffic, type AmbientTraffic } from "./ambientTraffic";
import { createBlobShadows, type BlobShadows } from "./blobShadows";
import { createDustPuffs, type DustPuffs } from "./dustPuffs";
import { createGround } from "./ground";
import { createLights } from "./lights";
import { createSharedMaterials } from "./materials";
import { createProps } from "./props";
import { createYardDressing, type YardDressing } from "./yardDressing";
import { createYardGates, type YardGates } from "./yardGates";
import { createSky } from "./sky";

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
  yardGates: YardGates;
  dustPuffs: DustPuffs;
  /** Crane parts for cab camera (Cab node). */
  craneParts: ReturnType<typeof createPlaceholderCrane>;
}

export function createCraneScene(
  renderer: WebGLRenderer,
  canvas: HTMLCanvasElement
): CraneScene {
  const scene = new Scene();
  scene.fog = new FogExp2(0xe8f4f8, 0.004);
  createSky(scene);

  createLights(scene);
  const { camera, controls } = createOrbitCamera(canvas);

  const mats = createSharedMaterials();
  createGround(scene, mats);
  const parts = createPlaceholderCrane(scene, mats);
  const crane = createCraneController(parts);
  const { loads: loadItems, pads, root: propsRoot } = createProps(scene, mats);
  const dustPuffs = createDustPuffs(scene);
  const loads = createLoadManager(loadItems, pads, propsRoot, (x, y, z) =>
    dustPuffs.spawn(x, y, z)
  );
  const blobShadows = createBlobShadows(scene);
  const ambientTraffic = createAmbientTraffic(scene, mats);
  const yardDressing = createYardDressing(scene, mats);
  const yardGates = createYardGates(scene, mats);

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
    yardGates,
    dustPuffs,
    craneParts: parts,
  };
}
