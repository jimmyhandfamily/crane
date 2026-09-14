import { Color, MeshStandardMaterial } from "three";
import { Palette } from "../config/palette";

function hexColor(hex: string): Color {
  return new Color(hex);
}

/**
 * Soft MeshStandardMaterial (cartoon-real).
 * specular ≈ low roughness / modest metalness.
 */
export function makeMat(
  name: string,
  hex: string,
  opts?: { opacity?: number; roughness?: number; metalness?: number; emissive?: number }
): MeshStandardMaterial {
  const c = hexColor(hex);
  const roughness = opts?.roughness ?? 0.85;
  const metalness = opts?.metalness ?? 0.05;
  const emissive = opts?.emissive ?? 0.01;
  const mat = new MeshStandardMaterial({
    name,
    color: c,
    roughness,
    metalness,
    emissive: c.clone().multiplyScalar(Math.min(Math.max(emissive, 0), 0.015)),
  });
  if (opts?.opacity !== undefined && opts.opacity < 1) {
    mat.transparent = true;
    mat.opacity = opts.opacity;
    mat.depthWrite = false;
  }
  return mat;
}

export function createSharedMaterials() {
  return {
    dirt: makeMat("matDirt", Palette.dirt, { roughness: 0.95, metalness: 0.02 }),
    dirtMottle: makeMat("matDirtMottle", Palette.dirtMottle, { roughness: 0.95 }),
    dirtMottle2: makeMat("matDirtMottle2", Palette.dirtMottle2, { roughness: 0.96 }),
    packed: makeMat("matPacked", Palette.packed, { roughness: 0.92 }),
    grass: makeMat("matGrass", Palette.grass, { roughness: 0.95 }),
    grassDark: makeMat("matGrassDark", Palette.grassDark, { roughness: 0.95 }),
    concrete: makeMat("matConcrete", Palette.concrete, { roughness: 0.7, metalness: 0.08 }),
    craneYellow: makeMat("matCraneYellow", Palette.craneYellow, {
      roughness: 0.45,
      metalness: 0.15,
    }),
    steel: makeMat("matSteel", Palette.steel, { roughness: 0.35, metalness: 0.55 }),
    glass: makeMat("matGlass", Palette.glass, {
      opacity: 0.4,
      roughness: 0.2,
      metalness: 0.1,
      emissive: 0,
    }),
    glassDark: makeMat("matGlassDark", Palette.glassDark, {
      opacity: 0.55,
      roughness: 0.25,
      metalness: 0.1,
      emissive: 0.01,
    }),
    cones: makeMat("matCones", Palette.cones, { roughness: 0.6 }),
    shedWall: makeMat("matShedWall", Palette.shedWall, { roughness: 0.75 }),
    shedRoof: makeMat("matShedRoof", Palette.shedRoof, { roughness: 0.8 }),
    shedDoor: makeMat("matShedDoor", Palette.shedDoor, { roughness: 0.7 }),
    shedWindow: makeMat("matShedWindow", Palette.shedWindow, {
      opacity: 0.5,
      roughness: 0.3,
      emissive: 0,
    }),
    fence: makeMat("matFence", Palette.fence, { roughness: 0.7 }),
    crate: makeMat("matCrate", Palette.crate, { roughness: 0.8 }),
    barrel: makeMat("matBarrel", Palette.barrel, { roughness: 0.4, metalness: 0.35 }),
    markerA: makeMat("matMarkerA", Palette.markerA, { roughness: 0.65 }),
    markerB: makeMat("matMarkerB", Palette.markerB, { roughness: 0.65 }),
    gravel: makeMat("matGravel", Palette.gravel, { roughness: 0.95 }),
    gravelLight: makeMat("matGravelLight", Palette.gravelLight, { roughness: 0.95 }),
    tireTrack: makeMat("matTireTrack", Palette.tireTrack, { roughness: 0.98 }),
    berm: makeMat("matBerm", Palette.berm, { roughness: 0.96 }),
    bermDark: makeMat("matBermDark", Palette.bermDark, { roughness: 0.96 }),
    truckWhite: makeMat("matTruckWhite", Palette.truckWhite, { roughness: 0.55 }),
    truckBlue: makeMat("matTruckBlue", Palette.truckBlue, { roughness: 0.55 }),
    truckBox: makeMat("matTruckBox", Palette.truckBox, { roughness: 0.7 }),
    wheel: makeMat("matWheel", Palette.wheel, { roughness: 0.9, metalness: 0.1 }),
    coverallsBlue: makeMat("matCoverallsBlue", Palette.coverallsBlue, { roughness: 0.8 }),
    coverallsGreen: makeMat("matCoverallsGreen", Palette.coverallsGreen, {
      roughness: 0.8,
    }),
    hardhatOrange: makeMat("matHardhatOrange", Palette.hardhatOrange, {
      roughness: 0.4,
    }),
    hardhatYellow: makeMat("matHardhatYellow", Palette.hardhatYellow, {
      roughness: 0.4,
    }),
    vest: makeMat("matVest", Palette.vest, { roughness: 0.55 }),
    skin: makeMat("matSkin", Palette.skin, { roughness: 0.85 }),
    boots: makeMat("matBoots", Palette.boots, { roughness: 0.9 }),
    glyph: makeMat("matGlyph", "#FFFFFF", { roughness: 0.9, emissive: 0.015 }),
  };
}

export type SharedMaterials = ReturnType<typeof createSharedMaterials>;
