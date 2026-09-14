import {
  MeshBuilder,
  Scene,
  TransformNode,
  Vector3,
  Color3,
  StandardMaterial,
} from "@babylonjs/core";
import type { SharedMaterials } from "./materials";

function createConcretePad(
  name: string,
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode,
  x: number,
  z: number,
  size = 8
): void {
  const pad = MeshBuilder.CreateBox(
    name,
    { width: size, height: 0.15, depth: size },
    scene
  );
  pad.position = new Vector3(x, 0.075, z);
  pad.material = mats.concrete;
  pad.parent = parent;
  pad.receiveShadows = true;
}

function createShed(
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode,
  x: number,
  z: number
): void {
  const shed = new TransformNode("SchoolShed", scene);
  shed.parent = parent;
  shed.position = new Vector3(x, 0, z);

  const wall = MeshBuilder.CreateBox(
    "ShedBody",
    { width: 6, height: 3.2, depth: 4.5 },
    scene
  );
  wall.position.y = 1.6;
  wall.material = mats.shedWall;
  wall.parent = shed;

  // Simple pitched roof (two boxes)
  const roofL = MeshBuilder.CreateBox(
    "ShedRoofL",
    { width: 6.4, height: 0.2, depth: 2.6 },
    scene
  );
  roofL.position = new Vector3(0, 3.5, -0.7);
  roofL.rotation.x = 0.35;
  roofL.material = mats.shedRoof;
  roofL.parent = shed;

  const roofR = MeshBuilder.CreateBox(
    "ShedRoofR",
    { width: 6.4, height: 0.2, depth: 2.6 },
    scene
  );
  roofR.position = new Vector3(0, 3.5, 0.7);
  roofR.rotation.x = -0.35;
  roofR.material = mats.shedRoof;
  roofR.parent = shed;
}

function createCrate(
  name: string,
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode,
  pos: Vector3,
  scale = 1
): void {
  const crate = MeshBuilder.CreateBox(
    name,
    { width: 1.2 * scale, height: 1.0 * scale, depth: 1.2 * scale },
    scene
  );
  crate.position = pos.add(new Vector3(0, 0.5 * scale, 0));
  crate.material = mats.crate;
  crate.parent = parent;
  crate.rotation.y = Math.random() * 0.4 - 0.2;
}

function createBarrel(
  name: string,
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode,
  pos: Vector3
): void {
  const barrel = MeshBuilder.CreateCylinder(
    name,
    { height: 1.1, diameter: 0.7, tessellation: 16 },
    scene
  );
  barrel.position = pos.add(new Vector3(0, 0.55, 0));
  barrel.material = mats.barrel;
  barrel.parent = parent;
}

function createCone(
  name: string,
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode,
  x: number,
  z: number
): void {
  const cone = MeshBuilder.CreateCylinder(
    name,
    { height: 0.7, diameterTop: 0.05, diameterBottom: 0.35, tessellation: 12 },
    scene
  );
  cone.position = new Vector3(x, 0.35, z);
  cone.material = mats.cones;
  cone.parent = parent;
}

function createPadMarker(
  label: "A" | "B",
  scene: Scene,
  mats: SharedMaterials,
  parent: TransformNode,
  x: number,
  z: number
): void {
  const node = new TransformNode(`PadMarker${label}`, scene);
  node.parent = parent;
  node.position = new Vector3(x, 0, z);

  const disc = MeshBuilder.CreateCylinder(
    `MarkerDisc${label}`,
    { height: 0.08, diameter: 2.2, tessellation: 24 },
    scene
  );
  disc.position.y = 0.06;
  disc.material = label === "A" ? mats.markerA : mats.markerB;
  disc.parent = node;

  // Letter stub as a raised bar/cross (readable from orbit)
  const bar = MeshBuilder.CreateBox(
    `MarkerGlyph${label}`,
    { width: label === "A" ? 0.15 : 0.9, height: 0.12, depth: label === "A" ? 1.1 : 0.15 },
    scene
  );
  bar.position.y = 0.16;
  const glyphMat = new StandardMaterial(`matGlyph${label}`, scene);
  glyphMat.diffuseColor = Color3.White();
  glyphMat.emissiveColor = Color3.White().scale(0.3);
  glyphMat.specularColor = Color3.Black();
  bar.material = glyphMat;
  bar.parent = node;

  if (label === "A") {
    const cross = MeshBuilder.CreateBox(
      "MarkerGlyphA_cross",
      { width: 0.9, height: 0.12, depth: 0.15 },
      scene
    );
    cross.position.y = 0.16;
    cross.material = glyphMat;
    cross.parent = node;
  }
}

/**
 * Yard props: concrete pads, school shed, crates, barrels, cones, pad markers A/B.
 */
export function createProps(scene: Scene, mats: SharedMaterials): TransformNode {
  const root = new TransformNode("PropsRoot", scene);

  createConcretePad("Pad1", scene, mats, root, -18, 12, 10);
  createConcretePad("Pad2", scene, mats, root, 22, -8, 8);
  createConcretePad("Pad3", scene, mats, root, -12, -22, 7);

  createShed(scene, mats, root, -28, 28);

  createCrate("Crate1", scene, mats, root, new Vector3(-16, 0, 10));
  createCrate("Crate2", scene, mats, root, new Vector3(-14.5, 0, 11.2), 0.85);
  createCrate("Crate3", scene, mats, root, new Vector3(20, 0, -6), 1.1);
  createCrate("Crate4", scene, mats, root, new Vector3(21.5, 0, -7.5), 0.7);

  createBarrel("Barrel1", scene, mats, root, new Vector3(-10, 0, -20));
  createBarrel("Barrel2", scene, mats, root, new Vector3(-9.1, 0, -20.8));
  createBarrel("Barrel3", scene, mats, root, new Vector3(24, 0, -10));

  // Safety cones around crane pad
  const coneRing: [number, number][] = [
    [14, 14],
    [14, -14],
    [-14, 14],
    [-14, -14],
    [0, 16],
    [0, -16],
    [16, 0],
    [-16, 0],
  ];
  coneRing.forEach(([cx, cz], i) => {
    createCone(`Cone${i}`, scene, mats, root, cx, cz);
  });

  createPadMarker("A", scene, mats, root, -18, 12);
  createPadMarker("B", scene, mats, root, 22, -8);

  return root;
}
