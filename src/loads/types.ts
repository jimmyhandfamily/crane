import type { Mesh, Object3D, Vector3 } from "three";

export type LoadKind = "crate" | "barrel";

export interface LoadItem {
  id: string;
  kind: LoadKind;
  mesh: Mesh;
  halfHeight: number;
  radius: number;
  massKg: number;
  attached: boolean;
  placed: boolean;
}

export interface PadZone {
  id: string;
  label: string;
  center: Vector3;
  halfSize: number;
  marked: boolean;
}

export interface YardLoads {
  loads: LoadItem[];
  pads: PadZone[];
  root: Object3D;
}

export const CRATE_MASS_KG = 480;
export const BARREL_MASS_KG = 260;
