import type { Mesh, TransformNode, Vector3 } from "@babylonjs/core";

export type LoadKind = "crate" | "barrel";

export interface LoadItem {
  id: string;
  kind: LoadKind;
  mesh: Mesh;
  /** Half-height used for ground / hang offset (m). */
  halfHeight: number;
  /** Horizontal footprint radius for pad checks (m). */
  radius: number;
  /** True while parented / following the hook. */
  attached: boolean;
  /** True after a successful place on a pad. */
  placed: boolean;
}

export interface PadZone {
  id: string;
  /** Display label, e.g. "Pad A" / "Pad B" / "Pad 3". */
  label: string;
  /** World XZ center. */
  center: Vector3;
  /** Half-extent of square pad on XZ (m). */
  halfSize: number;
  /** True for marked Pad A / Pad B. */
  marked: boolean;
}

export interface YardLoads {
  loads: LoadItem[];
  pads: PadZone[];
  root: TransformNode;
}
