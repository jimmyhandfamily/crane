import {
  CanvasTexture,
  Color,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import { Palette } from "../config/palette";

function hexColor(hex: string): Color {
  return new Color(hex);
}

/** Procedural noise canvas for albedo / roughness (CC0-free, no downloads). */
function makeNoiseCanvas(
  size: number,
  base: [number, number, number],
  variance: number,
  seed: number,
  opts?: { speckles?: number; grit?: boolean }
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  let s = seed >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  for (let i = 0; i < size * size; i++) {
    const n = (rnd() - 0.5) * variance;
    const o = i * 4;
    img.data[o] = Math.max(0, Math.min(255, base[0] + n));
    img.data[o + 1] = Math.max(0, Math.min(255, base[1] + n * 0.92));
    img.data[o + 2] = Math.max(0, Math.min(255, base[2] + n * 0.8));
    img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  if (opts?.grit) {
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < (opts.speckles ?? 400); i++) {
      const x = rnd() * size;
      const y = rnd() * size;
      const r = 0.4 + rnd() * 1.8;
      ctx.fillStyle =
        rnd() > 0.5
          ? `rgb(${base[0] - 30},${base[1] - 25},${base[2] - 20})`
          : `rgb(${base[0] + 25},${base[1] + 20},${base[2] + 15})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  return canvas;
}

function texFromCanvas(
  canvas: HTMLCanvasElement,
  repeat: number,
  srgb = true
): CanvasTexture {
  const tex = new CanvasTexture(canvas);
  if (srgb) tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function makeRoughMap(size: number, base: number, variance: number, seed: number): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  let s = seed >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  for (let i = 0; i < size * size; i++) {
    const v = Math.max(0, Math.min(255, base + (rnd() - 0.5) * variance));
    const o = i * 4;
    img.data[o] = img.data[o + 1] = img.data[o + 2] = v;
    img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.needsUpdate = true;
  return tex;
}

/**
 * MeshStandardMaterial PBR helpers — outdoor jobsite, not flat unlit.
 */
export function makeMat(
  name: string,
  hex: string,
  opts?: {
    opacity?: number;
    roughness?: number;
    metalness?: number;
    emissive?: number;
    map?: CanvasTexture;
    roughnessMap?: CanvasTexture;
  }
): MeshStandardMaterial {
  const c = hexColor(hex);
  const roughness = opts?.roughness ?? 0.85;
  const metalness = opts?.metalness ?? 0.05;
  const emissive = opts?.emissive ?? 0.008;
  const mat = new MeshStandardMaterial({
    name,
    color: c,
    roughness,
    metalness,
    emissive: c.clone().multiplyScalar(Math.min(Math.max(emissive, 0), 0.012)),
    map: opts?.map,
    roughnessMap: opts?.roughnessMap,
  });
  if (opts?.opacity !== undefined && opts.opacity < 1) {
    mat.transparent = true;
    mat.opacity = opts.opacity;
    mat.depthWrite = false;
  }
  return mat;
}

export function createSharedMaterials() {
  const dirtMap = texFromCanvas(
    makeNoiseCanvas(128, [196, 165, 116], 28, 11, { grit: true, speckles: 500 }),
    14
  );
  const grassMap = texFromCanvas(
    makeNoiseCanvas(128, [110, 148, 78], 32, 22, { grit: true, speckles: 600 }),
    18
  );
  const grassDarkMap = texFromCanvas(
    makeNoiseCanvas(128, [90, 120, 65], 26, 33, { grit: true, speckles: 450 }),
    16
  );
  const gravelMap = texFromCanvas(
    makeNoiseCanvas(128, [154, 143, 122], 40, 44, { grit: true, speckles: 900 }),
    22
  );
  const packedMap = texFromCanvas(
    makeNoiseCanvas(128, [168, 144, 106], 18, 55, { grit: true, speckles: 300 }),
    10
  );
  const dirtRough = makeRoughMap(64, 220, 40, 71);
  const grassRough = makeRoughMap(64, 210, 50, 82);
  const gravelRough = makeRoughMap(64, 230, 35, 93);

  return {
    dirt: makeMat("matDirt", Palette.dirt, {
      roughness: 0.96,
      metalness: 0.02,
      map: dirtMap,
      roughnessMap: dirtRough,
    }),
    dirtMottle: makeMat("matDirtMottle", Palette.dirtMottle, {
      roughness: 0.97,
      map: dirtMap,
    }),
    dirtMottle2: makeMat("matDirtMottle2", Palette.dirtMottle2, {
      roughness: 0.97,
      map: dirtMap,
    }),
    packed: makeMat("matPacked", Palette.packed, {
      roughness: 0.9,
      map: packedMap,
      roughnessMap: dirtRough,
    }),
    grass: makeMat("matGrass", Palette.grass, {
      roughness: 0.94,
      map: grassMap,
      roughnessMap: grassRough,
    }),
    grassDark: makeMat("matGrassDark", Palette.grassDark, {
      roughness: 0.95,
      map: grassDarkMap,
      roughnessMap: grassRough,
    }),
    concrete: makeMat("matConcrete", Palette.concrete, {
      roughness: 0.72,
      metalness: 0.06,
    }),
    oilStain: makeMat("matOilStain", Palette.oilStain, {
      roughness: 0.48,
      metalness: 0.18,
    }),
    craneYellow: makeMat("matCraneYellow", Palette.craneYellow, {
      roughness: 0.38,
      metalness: 0.28,
    }),
    steel: makeMat("matSteel", Palette.steel, {
      roughness: 0.28,
      metalness: 0.72,
    }),
    steelDark: makeMat("matSteelDark", Palette.steelDark, {
      roughness: 0.32,
      metalness: 0.68,
    }),
    glass: makeMat("matGlass", Palette.glass, {
      opacity: 0.4,
      roughness: 0.12,
      metalness: 0.15,
      emissive: 0,
    }),
    glassDark: makeMat("matGlassDark", Palette.glassDark, {
      opacity: 0.55,
      roughness: 0.18,
      metalness: 0.12,
      emissive: 0.008,
    }),
    cones: makeMat("matCones", Palette.cones, { roughness: 0.55 }),
    coneStripe: makeMat("matConeStripe", Palette.coneStripe, { roughness: 0.65 }),
    shedWall: makeMat("matShedWall", Palette.shedWall, { roughness: 0.78 }),
    shedRoof: makeMat("matShedRoof", Palette.shedRoof, { roughness: 0.82 }),
    shedDoor: makeMat("matShedDoor", Palette.shedDoor, { roughness: 0.72 }),
    shedWindow: makeMat("matShedWindow", Palette.shedWindow, {
      opacity: 0.5,
      roughness: 0.28,
      emissive: 0,
    }),
    fence: makeMat("matFence", Palette.fence, { roughness: 0.72 }),
    crate: makeMat("matCrate", Palette.crate, { roughness: 0.82 }),
    crateLabel: makeMat("matCrateLabel", Palette.crateLabel, { roughness: 0.75 }),
    barrel: makeMat("matBarrel", Palette.barrel, {
      roughness: 0.35,
      metalness: 0.45,
    }),
    barrelLid: makeMat("matBarrelLid", Palette.barrelLid, {
      roughness: 0.4,
      metalness: 0.5,
    }),
    markerA: makeMat("matMarkerA", Palette.markerA, { roughness: 0.65 }),
    markerB: makeMat("matMarkerB", Palette.markerB, { roughness: 0.65 }),
    gravel: makeMat("matGravel", Palette.gravel, {
      roughness: 0.97,
      map: gravelMap,
      roughnessMap: gravelRough,
    }),
    gravelLight: makeMat("matGravelLight", Palette.gravelLight, {
      roughness: 0.96,
      map: gravelMap,
    }),
    gravelEdge: makeMat("matGravelEdge", Palette.gravelEdge, {
      roughness: 0.97,
      map: gravelMap,
    }),
    tireTrack: makeMat("matTireTrack", Palette.tireTrack, { roughness: 0.98 }),
    berm: makeMat("matBerm", Palette.berm, {
      roughness: 0.96,
      map: dirtMap,
    }),
    bermDark: makeMat("matBermDark", Palette.bermDark, {
      roughness: 0.96,
      map: dirtMap,
    }),
    truckWhite: makeMat("matTruckWhite", Palette.truckWhite, {
      roughness: 0.42,
      metalness: 0.22,
    }),
    truckBlue: makeMat("matTruckBlue", Palette.truckBlue, {
      roughness: 0.4,
      metalness: 0.25,
    }),
    truckBox: makeMat("matTruckBox", Palette.truckBox, { roughness: 0.68 }),
    wheel: makeMat("matWheel", Palette.wheel, {
      roughness: 0.88,
      metalness: 0.12,
    }),
    brakeLight: makeMat("matBrakeLight", Palette.brakeLight, {
      roughness: 0.5,
      metalness: 0.2,
      emissive: 0.015,
    }),
    brakeLightOn: makeMat("matBrakeLightOn", Palette.brakeLight, {
      roughness: 0.45,
      metalness: 0.15,
      emissive: 0.015,
    }),
    coverallsBlue: makeMat("matCoverallsBlue", Palette.coverallsBlue, {
      roughness: 0.8,
    }),
    coverallsGreen: makeMat("matCoverallsGreen", Palette.coverallsGreen, {
      roughness: 0.8,
    }),
    hardhatOrange: makeMat("matHardhatOrange", Palette.hardhatOrange, {
      roughness: 0.38,
    }),
    hardhatYellow: makeMat("matHardhatYellow", Palette.hardhatYellow, {
      roughness: 0.38,
    }),
    vest: makeMat("matVest", Palette.vest, { roughness: 0.55 }),
    skin: makeMat("matSkin", Palette.skin, { roughness: 0.85 }),
    boots: makeMat("matBoots", Palette.boots, { roughness: 0.9 }),
    glyph: makeMat("matGlyph", "#FFFFFF", { roughness: 0.9, emissive: 0.015 }),
    bark: makeMat("matBark", "#5A4634", { roughness: 0.92, metalness: 0.02 }),
    foliage: makeMat("matFoliage", "#4F7A3A", {
      roughness: 0.88,
      metalness: 0.02,
    }),
    foliageDark: makeMat("matFoliageDark", "#3A5F2C", {
      roughness: 0.9,
      metalness: 0.02,
    }),
  };
}

export type SharedMaterials = ReturnType<typeof createSharedMaterials>;
