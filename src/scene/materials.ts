import {
  Color3,
  Scene,
  StandardMaterial,
} from "@babylonjs/core";
import { Palette } from "../config/palette";

function hexToColor3(hex: string): Color3 {
  return Color3.FromHexString(hex);
}

/** Soft diffuse StandardMaterial (cartoon-real, not grim). */
export function makeMat(
  name: string,
  scene: Scene,
  hex: string,
  opts?: { alpha?: number; specular?: number; emissive?: number }
): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  const c = hexToColor3(hex);
  mat.diffuseColor = c;
  mat.specularColor = Color3.Black().scale(opts?.specular ?? 0.08);
  mat.emissiveColor = c.scale(opts?.emissive ?? 0.04);
  if (opts?.alpha !== undefined) {
    mat.alpha = opts.alpha;
    mat.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
  }
  return mat;
}

export function createSharedMaterials(scene: Scene) {
  return {
    dirt: makeMat("matDirt", scene, Palette.dirt, { specular: 0.04 }),
    packed: makeMat("matPacked", scene, Palette.packed, { specular: 0.05 }),
    grass: makeMat("matGrass", scene, Palette.grass, { specular: 0.03 }),
    concrete: makeMat("matConcrete", scene, Palette.concrete, { specular: 0.12 }),
    craneYellow: makeMat("matCraneYellow", scene, Palette.craneYellow, {
      specular: 0.25,
    }),
    steel: makeMat("matSteel", scene, Palette.steel, { specular: 0.35 }),
    glass: makeMat("matGlass", scene, Palette.glass, {
      alpha: 0.4,
      specular: 0.5,
    }),
    glassDark: makeMat("matGlassDark", scene, Palette.glassDark, {
      alpha: 0.55,
      specular: 0.45,
      emissive: 0.02,
    }),
    cones: makeMat("matCones", scene, Palette.cones, { specular: 0.2 }),
    shedWall: makeMat("matShedWall", scene, Palette.shedWall, { specular: 0.08 }),
    shedRoof: makeMat("matShedRoof", scene, Palette.shedRoof, { specular: 0.1 }),
    shedDoor: makeMat("matShedDoor", scene, Palette.shedDoor, { specular: 0.1 }),
    shedWindow: makeMat("matShedWindow", scene, Palette.shedWindow, {
      alpha: 0.5,
      specular: 0.4,
    }),
    fence: makeMat("matFence", scene, Palette.fence, { specular: 0.12 }),
    crate: makeMat("matCrate", scene, Palette.crate, { specular: 0.1 }),
    barrel: makeMat("matBarrel", scene, Palette.barrel, { specular: 0.3 }),
    markerA: makeMat("matMarkerA", scene, Palette.markerA, { specular: 0.15 }),
    markerB: makeMat("matMarkerB", scene, Palette.markerB, { specular: 0.15 }),
    // Ambient traffic / yard dressing
    gravel: makeMat("matGravel", scene, Palette.gravel, { specular: 0.05 }),
    gravelLight: makeMat("matGravelLight", scene, Palette.gravelLight, {
      specular: 0.06,
    }),
    berm: makeMat("matBerm", scene, Palette.berm, { specular: 0.04 }),
    bermDark: makeMat("matBermDark", scene, Palette.bermDark, { specular: 0.04 }),
    truckWhite: makeMat("matTruckWhite", scene, Palette.truckWhite, {
      specular: 0.18,
    }),
    truckBlue: makeMat("matTruckBlue", scene, Palette.truckBlue, {
      specular: 0.18,
    }),
    truckBox: makeMat("matTruckBox", scene, Palette.truckBox, {
      specular: 0.12,
    }),
    wheel: makeMat("matWheel", scene, Palette.wheel, { specular: 0.05 }),
    coverallsBlue: makeMat("matCoverallsBlue", scene, Palette.coverallsBlue, {
      specular: 0.1,
    }),
    coverallsGreen: makeMat("matCoverallsGreen", scene, Palette.coverallsGreen, {
      specular: 0.1,
    }),
    hardhatOrange: makeMat("matHardhatOrange", scene, Palette.hardhatOrange, {
      specular: 0.25,
    }),
    hardhatYellow: makeMat("matHardhatYellow", scene, Palette.hardhatYellow, {
      specular: 0.25,
    }),
    vest: makeMat("matVest", scene, Palette.vest, { specular: 0.2 }),
    skin: makeMat("matSkin", scene, Palette.skin, { specular: 0.08 }),
  };
}

export type SharedMaterials = ReturnType<typeof createSharedMaterials>;
