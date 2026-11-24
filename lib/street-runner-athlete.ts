import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { runnerGround, type RunnerState } from "./street-runner";

type Vector = readonly [number, number, number];

const shirt = "#fff3df";
const seam = "#dfd8c3";
const skin = "#eab797";
const skinShade = "#ca8e76";
const hair = "#342927";
const pants = "#363736";
const teal = "#548b7d";
const deepTeal = "#365f59";
const walnut = "#4a3734";
const leather = "#bd8558";
const frames = "#393432";

export function createRunnerAthlete() {
  const ellipsoid = new THREE.SphereGeometry(1, 14, 10);
  const stud = new THREE.SphereGeometry(1, 8, 5);
  const rounded = new RoundedBoxGeometry(1, 1, 1, 1, 0.19);
  const trunk = new THREE.LatheGeometry([
    new THREE.Vector2(0, 0.043),
    new THREE.Vector2(0.153, 0.043),
    new THREE.Vector2(0.17, 0.088),
    new THREE.Vector2(0.166, 0.18),
    new THREE.Vector2(0.184, 0.275),
    new THREE.Vector2(0.197, 0.342),
    new THREE.Vector2(0.172, 0.385),
    new THREE.Vector2(0.09, 0.414),
    new THREE.Vector2(0, 0.414),
  ], 18);
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65 });
  const geometry = new Set<THREE.BufferGeometry>();
  const transform = new THREE.Object3D();
  const body = new THREE.Group();
  body.rotation.y = 1.07;

  function part(
    shape: THREE.BufferGeometry,
    ink: string,
    position: Vector,
    size: Vector,
    rotation: Vector = [0, 0, 0],
  ) {
    const copy = shape.index ? shape.toNonIndexed() : shape.clone();
    copy.deleteAttribute("uv");
    transform.position.set(...position);
    transform.scale.set(...size);
    transform.rotation.set(...rotation);
    transform.updateMatrix();
    copy.applyMatrix4(transform.matrix);
    const tint = new THREE.Color(ink);
    const colors = new Float32Array(copy.getAttribute("position").count * 3);
    for (let index = 0; index < colors.length; index += 3) tint.toArray(colors, index);
    copy.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return copy;
  }

  const round = (ink: string, position: Vector, size: Vector, rotation?: Vector) =>
    part(ellipsoid, ink, position, size, rotation);
  const panel = (ink: string, position: Vector, size: Vector, rotation?: Vector) =>
    part(rounded, ink, position, size, rotation);

  function attach(parent: THREE.Group, pieces: THREE.BufferGeometry[]) {
    // One draw per moving joint, with the garment and trim colors stored in the mesh.
    const merged = mergeGeometries(pieces);
    for (const piece of pieces) piece.dispose();
    geometry.add(merged);
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
  }

  const shoulder = new THREE.Group();
  shoulder.position.y = 0.57;
  body.add(shoulder);
  const sides = [-1, 1] as const;
  attach(shoulder, [
    part(trunk, shirt, [0, 0, 0], [1, 1, 0.78]),
    panel(pants, [0, 0.047, 0], [0.34, 0.115, 0.226]),
    panel(seam, [0, 0.214, 0.132], [0.023, 0.318, 0.022]),
    panel("#e3d6bc", [0.063, 0.268, 0.137], [0.086, 0.07, 0.017]),
    panel("#fff8eb", [0.063, 0.271, 0.144], [0.074, 0.065, 0.016]),
    ...[0.105, 0.207, 0.302].map(y => part(stud, "#eee5cd", [0, y, 0.148], [0.013, 0.013, 0.006])),
    round(skin, [0, 0.426, 0.02], [0.069, 0.081, 0.068]),
    panel(deepTeal, [0.014, 0.198, -0.16], [0.28, 0.36, 0.148]),
    panel(teal, [0.014, 0.2, -0.22], [0.235, 0.31, 0.062]),
    panel("#8db09a", [0.014, 0.267, -0.246], [0.18, 0.097, 0.017]),
    panel(leather, [0.014, 0.211, -0.255], [0.041, 0.059, 0.014]),
    panel(teal, [0.112, 0.248, 0.131], [0.043, 0.313, 0.03], [0, 0, -0.26]),
    panel(deepTeal, [0.107, 0.228, 0.151], [0.051, 0.033, 0.019], [0, 0, -0.26]),
    panel(leather, [0.107, 0.228, 0.159], [0.038, 0.023, 0.01], [0, 0, -0.26]),
    ...sides.map(side => panel("#fffbef", [side * 0.057, 0.38, 0.112], [0.1, 0.061, 0.048], [0.12, 0, side * 0.47])),
  ]);

  const head = new THREE.Group();
  head.position.set(0, 0.58, 0.037);
  head.rotation.y = -0.20;
  shoulder.add(head);

  function glassesRim(side: number) {
    const rim = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.043, 0.019, 0.132),
      new THREE.Vector3(-0.041, -0.018, 0.135),
      new THREE.Vector3(-0.021, -0.027, 0.132),
      new THREE.Vector3(0.028, -0.025, 0.118),
      new THREE.Vector3(0.043, -0.015, 0.11),
      new THREE.Vector3(0.047, 0.018, 0.109),
      new THREE.Vector3(0.026, 0.025, 0.115),
      new THREE.Vector3(-0.026, 0.024, 0.13),
    ], true);
    if (side < 0) rim.points.forEach(point => { point.x *= -1; });
    const tube = new THREE.TubeGeometry(rim, 28, 0.009, 5, true);
    const piece = part(tube, frames, [side * 0.064, 0.031, 0], [1, 1, 1]);
    tube.dispose();
    return piece;
  }

  attach(head, [
    round(skin, [0, 0.003, 0], [0.139, 0.165, 0.133]),
    round(skin, [0.004, -0.085, 0.035], [0.1, 0.081, 0.096]),
    round(skin, [0, -0.014, 0.129], [0.027, 0.042, 0.033]),
    round("#9d6158", [0, -0.067, 0.128], [0.028, 0.007, 0.008]),
    round(hair, [0, 0.088, -0.038], [0.15, 0.114, 0.129]),
    round(hair, [-0.074, 0.063, 0.026], [0.085, 0.112, 0.105], [0, 0, -0.29]),
    round(hair, [0.071, 0.075, 0.028], [0.085, 0.106, 0.111], [0, 0, 0.34]),
    round("#513a31", [-0.061, 0.135, 0.047], [0.072, 0.052, 0.097], [0.13, 0, 0.53]),
    round("#45332d", [0.067, 0.131, 0.046], [0.081, 0.054, 0.096], [0.12, 0, -0.54]),
    panel(frames, [0, 0.04, 0.139], [0.037, 0.012, 0.018]),
    ...sides.flatMap(side => [
      round(skin, [side * 0.13, -0.019, -0.003], [0.029, 0.044, 0.037]),
      round(skinShade, [side * 0.146, -0.018, 0.015], [0.012, 0.027, 0.014]),
      round("#fff0d9", [side * 0.061, 0.029, 0.116], [0.029, 0.013, 0.011]),
      round(walnut, [side * 0.06, 0.029, 0.127], [0.012, 0.013, 0.006]),
      part(stud, "#f8ead9", [side * 0.058, 0.033, 0.132], [0.0035, 0.004, 0.003]),
      round("#4b3538", [side * 0.062, 0.058, 0.122], [0.032, 0.008, 0.012], [0, side * 0.19, side * 0.09]),
      panel(frames, [side * 0.12, 0.043, 0.063], [0.012, 0.012, 0.101], [0, -side * 0.20, 0]),
      glassesRim(side),
    ]),
  ]);

  const limbs = sides.map((side) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.214, 0.331, 0.016);
    shoulder.add(arm);
    attach(arm, [
      round(shirt, [0, -0.085, 0], [0.092, 0.147, 0.089]),
      panel(seam, [0, -0.187, 0], [0.138, 0.053, 0.14]),
    ]);
    const elbow = new THREE.Group();
    elbow.position.y = -0.204;
    arm.add(elbow);
    attach(elbow, [
      round(skin, [0, -0.075, 0], [0.056, 0.106, 0.058]),
      round(skin, [0, -0.155, 0.024], [0.058, 0.057, 0.072]),
      round(skin, [-side * 0.035, -0.136, 0.055], [0.03, 0.038, 0.041]),
      ...(side === 1 ? [
        panel(walnut, [0, -0.124, 0.008], [0.114, 0.03, 0.116]),
        panel("#4d5d59", [0.047, -0.12, 0.03], [0.025, 0.052, 0.051]),
      ] : []),
    ]);

    const hip = new THREE.Group();
    hip.position.set(side * 0.103, 0.603, 0);
    body.add(hip);
    attach(hip, [
      round(pants, [0, -0.125, 0], [0.091, 0.176, 0.095]),
      round("#54524a", [side * 0.071, -0.108, 0.016], [0.018, 0.111, 0.017], [0, 0, side * -0.045]),
    ]);
    const knee = new THREE.Group();
    knee.position.y = -0.247;
    hip.add(knee);
    attach(knee, [
      round(pants, [0, -0.115, 0], [0.067, 0.162, 0.077]),
      panel(seam, [0, -0.248, 0.005], [0.108, 0.047, 0.114]),
      round(shirt, [0, -0.282, 0.054], [0.077, 0.054, 0.13]),
      panel(deepTeal, [0, -0.327, 0.052], [0.143, 0.027, 0.26]),
      panel("#debc95", [0, -0.306, 0.053], [0.154, 0.023, 0.273]),
      panel(teal, [0, -0.284, -0.028], [0.136, 0.042, 0.089]),
      panel("#f8e3bd", [0, -0.258, 0.102], [0.089, 0.017, 0.027], [0.18, 0, 0]),
    ]);
    return { side, arm, elbow, hip, knee };
  });
  for (const source of [ellipsoid, stud, rounded, trunk]) source.dispose();

  function animate(state: RunnerState, reducedMotion: boolean) {
    const running = !reducedMotion && state.time > 0 && state.phase === "running";
    const airborne = state.player.y + state.player.height < runnerGround - 0.5;
    const gait = running ? Math.sin(state.time * 17.5) : 0.45;
    shoulder.rotation.x = airborne ? 0.17 : 0.11;
    shoulder.rotation.z = running ? gait * 0.037 : 0;
    body.position.y = running && !airborne ? Math.abs(gait) * 0.034 : 0;

    for (const { side, arm, elbow, hip, knee } of limbs) {
      const stride = gait * side;
      arm.rotation.x = airborne ? -0.89 + side * 0.15 : stride * 0.66 - 0.29;
      elbow.rotation.x = -0.88 - Math.max(0, stride) * 0.29;
      hip.rotation.x = airborne ? 0.64 + side * 0.28 : -stride * 0.62;
      knee.rotation.x = airborne ? -1.16 - side * 0.2 : -Math.max(0.06, stride * 0.69 + 0.18);
    }
  }

  function dispose() {
    for (const shape of geometry) shape.dispose();
    material.dispose();
  }

  return { body, animate, dispose };
}
