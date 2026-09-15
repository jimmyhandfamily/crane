/**
 * Realistic-leaning gradient sky + soft cloud planes (canvas, no HDRI).
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

function makeGradientSkyTexture(): CanvasTexture {
  const w = 8;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  // Zenith → horizon: deeper blue, atmospheric haze
  grad.addColorStop(0, "#3A6FA0");
  grad.addColorStop(0.28, "#5A98C4");
  grad.addColorStop(0.55, "#8EBED8");
  grad.addColorStop(0.78, "#C5DCE8");
  grad.addColorStop(0.92, "#E2EEF2");
  grad.addColorStop(1, "#F0E8DC");
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

  const blobs = [
    { x: 0.32, y: 0.5, r: 0.3, a: 0.5 },
    { x: 0.5, y: 0.44, r: 0.34, a: 0.45 },
    { x: 0.68, y: 0.52, r: 0.26, a: 0.4 },
    { x: 0.44, y: 0.58, r: 0.24, a: 0.35 },
    { x: 0.58, y: 0.36, r: 0.2, a: 0.3 },
    { x: 0.4, y: 0.4, r: 0.16, a: 0.28 },
  ];
  for (const b of blobs) {
    const gx = b.x * size + (seed % 7) * 2;
    const gy = b.y * size;
    const gr = b.r * size;
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    g.addColorStop(0, `rgba(255,255,255,${b.a})`);
    g.addColorStop(0.5, `rgba(245,248,252,${b.a * 0.4})`);
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
  scene.background = makeGradientSkyTexture();
  if (scene.fog && "color" in scene.fog) {
    (scene.fog as { color: Color }).color.set("#D8E6EC");
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
    { name: "CloudA", x: -60, y: 52, z: -75, w: 48, h: 15, rotY: 0.12, seed: 1, opacity: 0.72 },
    { name: "CloudB", x: 45, y: 60, z: -95, w: 58, h: 17, rotY: -0.22, seed: 4, opacity: 0.65 },
    { name: "CloudC", x: 12, y: 46, z: 90, w: 40, h: 13, rotY: 0.35, seed: 9, opacity: 0.6 },
    { name: "CloudD", x: -40, y: 70, z: 50, w: 36, h: 11, rotY: -0.5, seed: 14, opacity: 0.5 },
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
    mesh.rotation.x = -0.06;
    mesh.renderOrder = -1;
    scene.add(mesh);
  }
}
