/**
 * Perimeter tree clusters — high-detail procedural (CC0 GLBs too heavy /
 * unavailable this pass). Cone foliage + tapered trunks kill empty void.
 */
import { type Object3D, Scene } from "three";
import { YARD_SIZE } from "../config/units";
import type { SharedMaterials } from "./materials";
import { terrainHeight } from "./ground";
import { box, cyl, group } from "./meshHelpers";

function createTree(
  name: string,
  mats: SharedMaterials,
  parent: Object3D,
  x: number,
  z: number,
  scale: number,
  variant: number
): void {
  const root = group(name, parent);
  const y0 = terrainHeight(x, z);
  root.position.set(x, y0, z);
  root.rotation.y = variant * 1.7;
  root.scale.setScalar(scale);

  const trunkH = 2.4 + (variant % 3) * 0.35;
  const trunkR = 0.18 + (variant % 2) * 0.04;
  const trunk = cyl(`${name}_Trunk`, trunkR * 0.75, trunkR, trunkH, mats.bark, root, 8);
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;

  const foliageMat = variant % 2 === 0 ? mats.foliage : mats.foliageDark;
  const layers = 3 + (variant % 2);
  for (let i = 0; i < layers; i++) {
    const t = i / Math.max(layers - 1, 1);
    const r = 1.55 - t * 0.95 + (variant % 3) * 0.08;
    const h = 1.35 - t * 0.15;
    const cone = cyl(
      `${name}_Foliage_${i}`,
      0.05,
      r,
      h,
      foliageMat,
      root,
      10
    );
    cone.position.y = trunkH * 0.55 + i * 0.85 + h * 0.15;
    cone.castShadow = true;
  }

  // Small branch stubs
  if (variant % 3 !== 0) {
    const stub = box(`${name}_Stub`, 0.08, 0.08, 0.55, mats.bark, root);
    stub.position.set(0.35, trunkH * 0.7, 0);
    stub.rotation.z = -0.5;
  }
}

export function createPerimeterTrees(scene: Scene, mats: SharedMaterials): Object3D {
  const root = group("PerimeterTrees");
  scene.add(root);
  const half = YARD_SIZE / 2;

  // Clusters around fence line / background — avoid roads & crane pad
  const clusters: { cx: number; cz: number; count: number; spread: number }[] = [
    { cx: half - 3, cz: -half + 8, count: 7, spread: 5 },
    { cx: half - 4, cz: 12, count: 6, spread: 4.5 },
    { cx: half - 5, cz: half - 12, count: 8, spread: 5.5 },
    { cx: 20, cz: half - 3, count: 5, spread: 4 },
    { cx: -18, cz: half - 4, count: 4, spread: 3.5 },
    { cx: -half + 4, cz: half - 10, count: 6, spread: 4 },
    { cx: -half + 5, cz: -20, count: 7, spread: 5 },
    { cx: -half + 6, cz: -half + 10, count: 8, spread: 5.5 },
    { cx: -10, cz: -half + 3, count: 6, spread: 4.5 },
    { cx: 25, cz: -half + 4, count: 7, spread: 5 },
    { cx: half - 8, cz: -25, count: 5, spread: 4 },
    { cx: 42, cz: 40, count: 4, spread: 3.5 },
  ];

  let idx = 0;
  for (const c of clusters) {
    for (let i = 0; i < c.count; i++) {
      const a = (i / c.count) * Math.PI * 2 + c.cx * 0.01;
      const r = (0.3 + ((i * 17) % 10) / 10) * c.spread;
      const x = c.cx + Math.cos(a) * r;
      const z = c.cz + Math.sin(a) * r;
      // Skip road corridors
      if (Math.abs(x + 42) < 8 && z > -2 && z < 48) continue;
      if (Math.abs(z - 42) < 8 && x > -48 && x < 10) continue;
      if (Math.abs(x) < 16 && Math.abs(z) < 16) continue;
      const scale = 0.85 + ((i * 13 + idx) % 7) * 0.08;
      createTree(`Tree_${idx}`, mats, root, x, z, scale, idx + i);
      idx++;
    }
  }

  return root;
}
