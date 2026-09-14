/**
 * Brief dust puffs: expanding translucent discs that auto-fade on load place.
 */
import {
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Scene,
} from "three";
import { disc } from "./meshHelpers";

interface Puff {
  mesh: Mesh;
  mat: MeshBasicMaterial;
  age: number;
  life: number;
  startScale: number;
  endScale: number;
}

export interface DustPuffs {
  root: Object3D;
  spawn(x: number, y: number, z: number): void;
  update(dt: number): void;
}

export function createDustPuffs(scene: Scene): DustPuffs {
  const root = new Object3D();
  root.name = "DustPuffsRoot";
  scene.add(root);

  const puffs: Puff[] = [];
  let seq = 0;

  const spawn = (x: number, y: number, z: number): void => {
    const count = 3;
    for (let i = 0; i < count; i++) {
      const mat = new MeshBasicMaterial({
        name: `matDustPuff_${seq}`,
        color: new Color(0xc4b49a),
        transparent: true,
        opacity: 0.45 - i * 0.08,
        depthWrite: false,
        side: DoubleSide,
        toneMapped: false,
      });
      const mesh = disc(`DustPuff_${seq++}`, 0.55 + i * 0.15, mat, root, 20);
      mesh.position.set(
        x + (Math.random() - 0.5) * 0.35,
        y + 0.04 + i * 0.02,
        z + (Math.random() - 0.5) * 0.35
      );
      mesh.renderOrder = 2;
      puffs.push({
        mesh,
        mat,
        age: 0,
        life: 0.55 + i * 0.12,
        startScale: 0.35 + i * 0.1,
        endScale: 2.2 + i * 0.55,
      });
      mesh.scale.setScalar(0.35 + i * 0.1);
    }
  };

  const update = (dt: number): void => {
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i]!;
      p.age += dt;
      const u = Math.min(1, p.age / p.life);
      const s = p.startScale + (p.endScale - p.startScale) * u;
      p.mesh.scale.setScalar(s);
      p.mat.opacity = (1 - u) * (1 - u) * 0.42;
      if (u >= 1) {
        root.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mat.dispose();
        puffs.splice(i, 1);
      }
    }
  };

  return { root, spawn, update };
}
