import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import type { RunnerObject } from "./street-runner";

type Vector = readonly [number, number, number];
type Finish = "paint" | "gloss" | "reflector";

const violet = "#8c6aad";
const shadow = "#453946";
const pale = "#e9d7f5";
const glass = "#abd7c6";
const amber = "#ffd492";
const orange = "#df795a";
const cream = "#fff0d6";
const walnut = "#624841";
const brass = "#c89863";

class PropModel {
  readonly parts = new Map<Finish, THREE.BufferGeometry[]>();

  constructor(private readonly boxGeometry: THREE.BufferGeometry, private readonly cylinderGeometry: THREE.BufferGeometry) {}

  place(shape: THREE.BufferGeometry, color: string, at: Vector, size: Vector, finish: Finish = "paint", rotation: Vector = [0, 0, 0]) {
    const geometry = shape.index ? shape.toNonIndexed() : shape.clone();
    const transform = new THREE.Object3D();
    transform.position.set(...at);
    transform.scale.set(...size);
    transform.rotation.set(...rotation);
    transform.updateMatrix();
    geometry.applyMatrix4(transform.matrix);

    const tint = new THREE.Color(color);
    const colors = new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3);
    for (let index = 0; index < colors.count; index += 1) {
      colors.setXYZ(index, tint.r, tint.g, tint.b);
    }
    geometry.setAttribute("color", colors);
    const batch = this.parts.get(finish) ?? [];
    batch.push(geometry);
    this.parts.set(finish, batch);
  }

  box(color: string, at: Vector, size: Vector, finish?: Finish, rotation?: Vector) {
    this.place(this.boxGeometry, color, at, size, finish, rotation);
  }

  cylinder(color: string, at: Vector, size: Vector, finish?: Finish, rotation?: Vector) {
    this.place(this.cylinderGeometry, color, at, size, finish, rotation);
  }
}

export function createRunnerProps() {
  const box = new RoundedBoxGeometry(1, 1, 1, 1, 0.105);
  const cylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
  const sphere = new THREE.SphereGeometry(1, 16, 10);
  const cone = new THREE.LatheGeometry([
    [0, -0.4375], [0.389, -0.4375], [0.41, -0.419], [0.408, -0.399],
    [0.05, 0.408], [0.042, 0.424], [0.029, 0.4375], [0, 0.4375],
  ].map(([x, y]) => new THREE.Vector2(x, y)), 20);
  const coneBands = [
    new THREE.CylinderGeometry(0.251, 0.306, 0.13, 20),
    new THREE.CylinderGeometry(0.127, 0.179, 0.122, 20),
  ];
  const lampArm = new THREE.TubeGeometry(new THREE.CubicBezierCurve3(
    new THREE.Vector3(-0.11, 0.13, 0),
    new THREE.Vector3(-0.11, 0.30, 0),
    new THREE.Vector3(-0.06, 0.285, 0),
    new THREE.Vector3(0.12, 0.285, 0),
  ), 11, 0.025, 8, false);
  const dropProfile = [
    [0, -0.203], [0.079, -0.188], [0.14, -0.147], [0.177, -0.091],
    [0.181, -0.039], [0.163, 0.026], [0.124, 0.091], [0.077, 0.166],
    [0.036, 0.235], [0.009, 0.278], [0, 0.283],
  ];
  const drop = new THREE.LatheGeometry(dropProfile.map(([x, y]) => new THREE.Vector2(x, y)), 20);
  const boltPath = new THREE.Shape();
  boltPath.moveTo(0.026, 0.104);
  boltPath.lineTo(-0.078, -0.014);
  boltPath.lineTo(-0.015, -0.014);
  boltPath.lineTo(-0.037, -0.102);
  boltPath.lineTo(0.078, 0.025);
  boltPath.lineTo(0.014, 0.025);
  boltPath.closePath();
  const bolt = new THREE.ExtrudeGeometry(boltPath, { bevelSize: 0.003, bevelThickness: 0.002, bevelSegments: 1, depth: 0.012 });
  const shapes = [box, cylinder, sphere, cone, ...coneBands, lampArm, drop, bolt];
  const materials = {
    paint: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72 }),
    gloss: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.34, metalness: 0.085 }),
    reflector: new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.29,
      emissive: "#ffe5bc",
      emissiveIntensity: 0.12,
    }),
  };
  const models = new Set<THREE.BufferGeometry>();

  function assemble(prop: PropModel) {
    const group = new THREE.Group();
    // Pieces with the same finish share a draw call and one shadow caster per solid finish.
    for (const [finish, parts] of prop.parts) {
      const geometry = mergeGeometries(parts);
      for (const part of parts) part.dispose();
      models.add(geometry);
      const mesh = new THREE.Mesh(geometry, materials[finish]);
      mesh.castShadow = finish !== "reflector";
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    return group;
  }

  function obstacle(variant: number) {
    const prop = new PropModel(box, cylinder);
    if (variant === 0) {
      prop.box(walnut, [0, 0.067, 0], [1, 0.134, 0.84]);
      prop.box("#9c6353", [0, 0.122, 0], [0.86, 0.072, 0.74]);
      prop.place(cone, orange, [0, 0.569, 0], [1, 1, 0.9]);
      prop.place(coneBands[0], cream, [0, 0.461, 0], [1, 1, 0.9], "reflector");
      prop.place(coneBands[1], cream, [0, 0.764, 0], [1, 1, 0.9], "reflector");
      for (const x of [-0.372, 0.372]) {
        prop.box("#ae6554", [x, 0.092, 0.4], [0.112, 0.033, 0.03]);
      }
    } else if (variant === 1) {
      prop.box("#a2684d", [0, 0.484, 0], [1, 0.968, 0.8]);
      for (const [x, wood] of [[-0.28, "#ca9167"], [0, "#d6a378"], [0.28, "#c48c64"]] as const) {
        prop.box(wood, [x, 0.509, 0.403], [0.277, 0.76, 0.04]);
      }
      for (const y of [0.12, 0.883]) prop.box("#bf815c", [0, y, 0.418], [0.94, 0.158, 0.081]);
      for (const x of [-0.413, 0.413]) prop.box("#b47856", [x, 0.482, 0.42], [0.146, 0.682, 0.083]);
      const warningTilt = -0.53;
      prop.box("#bb6d52", [0, 0.485, 0.446], [0.185, 0.78, 0.077], "paint", [0, 0, warningTilt]);
      for (const [x, y] of [[-0.122, 0.276], [0, 0.485], [0.122, 0.694]]) {
        prop.box(cream, [x, y, 0.486], [0.157, 0.092, 0.025], "reflector", [0, 0, warningTilt]);
      }
      for (const y of [0.116, 0.882]) {
        for (const x of [-0.384, 0.384]) prop.cylinder(brass, [x, y, 0.466], [0.052, 0.023, 0.052], "gloss", [Math.PI / 2, 0, 0]);
      }
    } else {
      prop.box(walnut, [0, 0.082, 0], [1, 0.164, 0.79]);
      prop.box("#875342", [0, 0.16, 0], [0.76, 0.14, 0.64]);
      prop.box(orange, [0, 0.546, 0], [0.64, 0.9, 0.56]);
      prop.box("#eb9371", [0, 0.953, 0], [0.66, 0.103, 0.58]);
      prop.box(cream, [0, 0.489, 0], [0.659, 0.145, 0.578], "reflector");
      prop.box("#ffbc6d", [0, 0.747, 0], [0.659, 0.13, 0.578], "reflector");
      prop.box("#d9694c", [0, 0.297, 0.281], [0.38, 0.079, 0.032]);
    }
    return assemble(prop);
  }

  function mission(stage: number, action?: RunnerObject["action"]) {
    const prop = new PropModel(box, cylinder);
    prop.cylinder("#6f507f", [0, -0.302, 0], [0.75, 0.031, 0.52]);
    prop.cylinder(violet, [0, -0.27, 0], [0.8, 0.055, 0.56]);
    prop.cylinder(pale, [0, -0.239, 0], [0.72, 0.018, 0.47], "reflector");

    switch (stage) {
      case 0:
        prop.box(violet, [0, 0.004, 0], [0.58, 0.389, 0.355]);
        prop.box(shadow, [0, -0.117, 0], [0.567, 0.137, 0.364]);
        prop.box("#ccb2d6", [0, 0.186, -0.006], [0.51, 0.062, 0.32]);
        prop.box(shadow, [-0.006, 0.084, 0.172], [0.51, 0.17, 0.05]);
        for (const x of [-0.127, 0.117]) {
          prop.box(glass, [x, 0.082, 0.199], [0.221, 0.124, 0.018], "gloss");
        }
        prop.box(pale, [0, -0.038, 0.181], [0.561, 0.058, 0.039]);
        for (const x of [-0.188, 0.188]) {
          prop.cylinder(shadow, [x, -0.167, 0.132], [0.127, 0.113, 0.127], "paint", [Math.PI / 2, 0, 0]);
          prop.cylinder(brass, [x, -0.167, 0.193], [0.061, 0.016, 0.061], "gloss", [Math.PI / 2, 0, 0]);
          prop.box(amber, [x * 1.23, -0.087, 0.194], [0.072, 0.041, 0.024], "reflector");
        }
        break;
      case 1:
        prop.cylinder(violet, [-0.11, -0.201, 0], [0.149, 0.08, 0.135]);
        prop.cylinder("#74544d", [-0.11, -0.012, 0], [0.071, 0.39, 0.07], "gloss");
        prop.place(lampArm, shadow, [0, 0, 0], [1, 1, 1], "gloss");
        prop.box(violet, [0.137, 0.248, 0], [0.269, 0.121, 0.23]);
        prop.box(amber, [0.141, 0.184, 0.012], [0.225, 0.034, 0.191], "reflector");
        prop.box(brass, [0.176, 0.309, -0.025], [0.109, 0.027, 0.095]);
        break;
      case 2:
        prop.box(shadow, [0, -0.104, 0], [0.31, 0.268, 0.206]);
        prop.box(violet, [0, 0.106, 0.019], [0.579, 0.332, 0.212]);
        prop.box("#4f576f", [0, 0.114, 0.132], [0.503, 0.243, 0.035]);
        prop.box(glass, [0, 0.119, 0.155], [0.449, 0.188, 0.017], "gloss");
        prop.box("#4e776d", [-0.043, 0.154, 0.165], [0.29, 0.029, 0.012]);
        prop.box("#4e776d", [-0.108, 0.083, 0.166], [0.16, 0.03, 0.012]);
        prop.cylinder(amber, [0.164, 0.09, 0.17], [0.047, 0.012, 0.047], "reflector", [Math.PI / 2, 0, 0]);
        break;
      case 3: {
        const slope = -0.54;
        prop.box(violet, [-0.129, 0.113, 0], [0.264, 0.086, 0.32]);
        prop.box("#abc4ad", [-0.126, 0.163, 0], [0.211, 0.033, 0.274]);
        for (const z of [-0.123, 0.123]) {
          prop.box("#94684f", [-0.196, -0.042, z], [0.042, 0.403, 0.046]);
          prop.box(violet, [-0.26, 0.104, z], [0.043, 0.361, 0.05]);
          prop.box("#b05f57", [0.111, -0.016, z * 0.86], [0.51, 0.064, 0.034], "paint", [0, 0, slope]);
        }
        for (const y of [-0.154, -0.047, 0.052]) prop.box(pale, [-0.227, y, 0], [0.071, 0.033, 0.259]);
        prop.box("#e69a7c", [0.112, -0.045, 0], [0.48, 0.059, 0.218], "gloss", [0, 0, slope]);
        prop.box("#e69a7c", [0.323, -0.159, 0], [0.134, 0.061, 0.221], "gloss");
        break;
      }
      case 4:
        prop.place(drop, "#65b8aa", [0, 0, 0], [1, 1, 0.78], "gloss");
        prop.place(sphere, "#dcf7e5", [-0.065, -0.052, 0.125], [0.04, 0.078, 0.019], "reflector", [0, 0.37, -0.3]);
        break;
      default:
        if (action === "air") {
          prop.box(violet, [0, 0.033, 0], [0.252, 0.545, 0.243]);
          prop.box(shadow, [0, 0.036, 0.113], [0.229, 0.495, 0.074]);
          for (const [y, color] of [[0.189, "#e8725d"], [0.041, amber], [-0.109, "#9cdb9a"]] as const) {
            prop.box(shadow, [0, y + 0.052, 0.154], [0.177, 0.048, 0.151]);
            prop.place(sphere, color, [0, y, 0.158], [0.066, 0.068, 0.039], "reflector");
          }
        } else {
          prop.box(violet, [0, 0.016, 0], [0.45, 0.438, 0.293]);
          prop.box(pale, [0, -0.021, 0.152], [0.335, 0.274, 0.033]);
          prop.box(shadow, [0, 0.153, 0.153], [0.32, 0.064, 0.031]);
          prop.box(glass, [0.077, 0.154, 0.176], [0.093, 0.025, 0.022], "reflector");
          prop.box(shadow, [-0.052, 0.244, 0], [0.185, 0.054, 0.128]);
          prop.place(bolt, "#a67245", [0, -0.018, 0.176], [1, 1, 1], "gloss");
        }
    }
    return assemble(prop);
  }

  function dispose() {
    for (const shape of shapes) shape.dispose();
    for (const geometry of models) geometry.dispose();
    for (const material of Object.values(materials)) material.dispose();
    models.clear();
  }

  return { obstacle, mission, dispose };
}
