import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  Mesh,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  type Material,
} from "three";

export function box(
  name: string,
  w: number,
  h: number,
  d: number,
  mat: Material,
  parent?: Object3D
): Mesh {
  const m = new Mesh(new BoxGeometry(w, h, d), mat);
  m.name = name;
  if (parent) parent.add(m);
  return m;
}

export function cyl(
  name: string,
  radiusTop: number,
  radiusBottom: number,
  height: number,
  mat: Material,
  parent?: Object3D,
  segments = 16
): Mesh {
  const m = new Mesh(
    new CylinderGeometry(radiusTop, radiusBottom, height, segments),
    mat
  );
  m.name = name;
  if (parent) parent.add(m);
  return m;
}

export function sphere(
  name: string,
  radius: number,
  mat: Material,
  parent?: Object3D,
  segments = 8
): Mesh {
  const m = new Mesh(new SphereGeometry(radius, segments, segments), mat);
  m.name = name;
  if (parent) parent.add(m);
  return m;
}

export function ellipsoid(
  name: string,
  dx: number,
  dy: number,
  dz: number,
  mat: Material,
  parent?: Object3D,
  segments = 8
): Mesh {
  const m = new Mesh(new SphereGeometry(0.5, segments, segments), mat);
  m.name = name;
  m.scale.set(dx, dy, dz);
  if (parent) parent.add(m);
  return m;
}

export function groundPlane(
  name: string,
  width: number,
  depth: number,
  mat: Material,
  parent?: Object3D
): Mesh {
  const m = new Mesh(new PlaneGeometry(width, depth), mat);
  m.name = name;
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

export function disc(
  name: string,
  radius: number,
  mat: Material,
  parent?: Object3D,
  segments = 36
): Mesh {
  const m = new Mesh(new CircleGeometry(radius, segments), mat);
  m.name = name;
  m.rotation.x = -Math.PI / 2;
  if (parent) parent.add(m);
  return m;
}

export function torus(
  name: string,
  radius: number,
  tube: number,
  mat: Material,
  parent?: Object3D,
  segments = 16
): Mesh {
  const m = new Mesh(new TorusGeometry(radius, tube, 8, segments), mat);
  m.name = name;
  // Torus lies in XY; rotate flat-ish for hook ring (Babylon used rot.x = π/2)
  m.rotation.x = Math.PI / 2;
  if (parent) parent.add(m);
  return m;
}

export function group(name: string, parent?: Object3D): Object3D {
  const g = new Object3D();
  g.name = name;
  if (parent) parent.add(g);
  return g;
}

