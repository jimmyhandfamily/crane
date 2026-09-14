import {
  Color3,
  Scene,
  StandardMaterial,
} from "@babylonjs/core";
import { Palette } from "../config/palette";

function hexToColor3(hex: string): Color3 {
  return Color3.FromHexString(hex);
}

/**
 * Soft diffuse StandardMaterial (cartoon-real).
 * REALISM REFINE: emissive 0–0.015, specular via white scale, ambient ≈ diffuse*0.55.
 */
export function makeMat(
  name: string,
  scene: Scene,
  hex: string,
  opts?: { alpha?: number; specular?: number; emissive?: number }
): StandardMaterial {
  const mat = new StandardMaterial(name, scene);
  const c = hexToColor3(hex);
  const specular = opts?.specular ?? 0.08;
  const emissive = opts?.emissive ?? 0.01;
  mat.diffuseColor = c;
  mat.specularColor = Color3.White().scale(specular);
  mat.emissiveColor = c.scale(Math.min(Math.max(emissive, 0), 0.015));
  mat.ambientColor = c.scale(0.55);
  if (opts?.alpha !== undefined) {
    mat.alpha = opts.alpha;
    mat.transparencyMode = StandardMaterial.MATERIAL_ALPHABLEND;
  }
  return mat;
}

export function createSharedMaterials(scene: Scene) {
  return {
    dirt: makeMat("matDirt", scene, Palette.dirt, { specular: 0.03 }),
    dirtMottle: makeMat("matDirtMottle", scene, Palette.dirtMottle, {
      specular: 0.03,
    }),
    dirtMottle2: makeMat("matDirtMottle2", scene, Palette.dirtMottle2, {
      specular: 0.025,
    }),
    packed: makeMat("matPacked", scene, Palette.packed, { specular: 0.04 }),
    grass: makeMat("matGrass", scene, Palette.grass, { specular: 0.03 }),
    grassDark: makeMat("matGrassDark", scene, Palette.grassDark, {
      specular: 0.03,
    }),
    concrete: makeMat("matConcrete", scene, Palette.concrete, {
      specular: 0.18,
    }),
    craneYellow: makeMat("matCraneYellow", scene, Palette.craneYellow, {
      specular: 0.3,
    }),
    steel: makeMat("matSteel", scene, Palette.steel, { specular: 0.5 }),
    glass: makeMat("matGlass", scene, Palette.glass, {
      alpha: 0.4,
      specular: 0.5,
      emissive: 0,
    }),
    glassDark: makeMat("matGlassDark", scene, Palette.glassDark, {
      alpha: 0.55,
      specular: 0.45,
      emissive: 0.01,
    }),
    cones: makeMat("matCones", scene, Palette.cones, { specular: 0.2 }),
    shedWall: makeMat("matShedWall", scene, Palette.shedWall, {
      specular: 0.14,
    }),
    shedRoof: makeMat("matShedRoof", scene, Palette.shedRoof, {
      specular: 0.12,
    }),
    shedDoor: makeMat("matShedDoor", scene, Palette.shedDoor, {
      specular: 0.15,
    }),
    shedWindow: makeMat("matShedWindow", scene, Palette.shedWindow, {
      alpha: 0.5,
      specular: 0.4,
      emissive: 0,
    }),
    fence: makeMat("matFence", scene, Palette.fence, { specular: 0.16 }),
    crate: makeMat("matCrate", scene, Palette.crate, { specular: 0.12 }),
    barrel: makeMat("matBarrel", scene, Palette.barrel, { specular: 0.35 }),
    markerA: makeMat("matMarkerA", scene, Palette.markerA, { specular: 0.18 }),
    markerB: makeMat("matMarkerB", scene, Palette.markerB, { specular: 0.18 }),
    // Ambient traffic / yard dressing
    gravel: makeMat("matGravel", scene, Palette.gravel, { specular: 0.04 }),
    gravelLight: makeMat("matGravelLight", scene, Palette.gravelLight, {
      specular: 0.04,
    }),
    tireTrack: makeMat("matTireTrack", scene, Palette.tireTrack, {
      specular: 0.02,
    }),
    berm: makeMat("matBerm", scene, Palette.berm, { specular: 0.03 }),
    bermDark: makeMat("matBermDark", scene, Palette.bermDark, {
      specular: 0.03,
    }),
    truckWhite: makeMat("matTruckWhite", scene, Palette.truckWhite, {
      specular: 0.18,
    }),
    truckBlue: makeMat("matTruckBlue", scene, Palette.truckBlue, {
      specular: 0.18,
    }),
    truckBox: makeMat("matTruckBox", scene, Palette.truckBox, {
      specular: 0.14,
    }),
    wheel: makeMat("matWheel", scene, Palette.wheel, { specular: 0.05 }),
    coverallsBlue: makeMat("matCoverallsBlue", scene, Palette.coverallsBlue, {
      specular: 0.12,
    }),
    coverallsGreen: makeMat("matCoverallsGreen", scene, Palette.coverallsGreen, {
      specular: 0.12,
    }),
    hardhatOrange: makeMat("matHardhatOrange", scene, Palette.hardhatOrange, {
      specular: 0.3,
    }),
    hardhatYellow: makeMat("matHardhatYellow", scene, Palette.hardhatYellow, {
      specular: 0.3,
    }),
    vest: makeMat("matVest", scene, Palette.vest, { specular: 0.2 }),
    skin: makeMat("matSkin", scene, Palette.skin, { specular: 0.08 }),
    boots: makeMat("matBoots", scene, Palette.boots, { specular: 0.06 }),
  };
}

export type SharedMaterials = ReturnType<typeof createSharedMaterials>;
