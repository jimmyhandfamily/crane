/**
 * Friendly gradient sky + simple cloud planes (canvas textures).
 * Keeps soft cartoon-real look; no HDRI.
 */

import {
  CanvasTexture,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
} from "three";
import { Palette } from "../config/palette";

function makeGradientSkyTexture(): CanvasTexture {
  const w = 4;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  // Top → horizon: deeper soft blue to warm haze
  grad.addColorStop(0, "#7EB8D8");
  grad.addColorStop(0.45, Palette.sky);
  grad.addColorStop(0.78, "#C5E2F0");
  grad.addColorStop(1, Palette.haze);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeCloudTexture(seed: number): CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);

  // Soft puffy blobs — friendly, not photoreal
  const blobs = [
    { x: 0.35, y: 0.5, r: 0.28, a: 0.55 },
    { x: 0.52, y: 0.45, r: 0.32, a: 0.5 },
    { x: 0.68, y: 0.52, r: 0.24, a: 0.45 },
    { x: 0.45, y: 0.58, r: 0.22, a: 0.4 },
    { x: 0.58, y: 0.38, r: 0.18, a: 0.35 },
  ];
  for (const b of blobs) {
    const gx = b.x * size + (seed % 7) * 2;
    const gy = b.y * size;
    const gr = b.r * size;
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    g.addColorStop(0, `rgba(255,255,255,${b.a})`);
    g.addColorStop(0.55, `rgba(255,255,255,${b.a * 0.45})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createSky(scene: Scene): void {
  // Gradient backdrop via scene.background canvas
  scene.background = makeGradientSkyTexture();
  // Warm haze fog stays; tint slightly toward sky mid
  if (scene.fog && "color" in scene.fog) {
    (scene.fog as { color: Color }).color.set(Palette.haze);
  }

  const cloudSpecs: {
    name: string;
    x: number;
    y: number;
    z: number;
    w: number;
    h: number;
    rotY: number;
    seed: number;
    opacity: number;
  }[] = [
    {
      name: "CloudA",
      x: -55,
      y: 48,
      z: -70,
      w: 42,
      h: 14,
      rotY: 0.15,
      seed: 1,
      opacity: 0.85,
    },
    {
      name: "CloudB",
      x: 40,
      y: 56,
      z: -90,
      w: 52,
      h: 16,
      rotY: -0.25,
      seed: 4,
      opacity: 0.75,
    },
    {
      name: "CloudC",
      x: 10,
      y: 42,
      z: 85,
      w: 36,
      h: 12,
      rotY: 0.4,
      seed: 9,
      opacity: 0.7,
    },
  ];

  for (const c of cloudSpecs) {
    const geo = new PlaneGeometry(c.w, c.h);
    const mat = new MeshBasicMaterial({
      map: makeCloudTexture(c.seed),
      transparent: true,
      opacity: c.opacity,
      depthWrite: false,
      side: DoubleSide,
      fog: false,
    });
    const mesh = new Mesh(geo, mat);
    mesh.name = c.name;
    mesh.position.set(c.x, c.y, c.z);
    mesh.rotation.y = c.rotY;
    // Slight tilt so they read as soft volume from orbit cam
    mesh.rotation.x = -0.08;
    mesh.renderOrder = -1;
    scene.add(mesh);
  }
}
