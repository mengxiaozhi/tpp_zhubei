import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { addRunnerSidewalk } from "./street-runner-world";

export const runnerConnectorLength = 8;

type Shape = "slab" | "box" | "rounded" | "cylinder" | "leaf" | "bud";
type Dimensions = readonly [width: number, height: number, depth: number];
type Location = readonly [x: number, y: number, z: number];

const colors = {
  limestone: "#dfc5a2",
  plaster: "#f0dfc5",
  clay: "#d0a581",
  timber: "#b27c54",
  endGrain: "#8f654e",
  sage: "#87a479",
  lightLeaf: "#acb78a",
  shadeLeaf: "#68836c",
  teal: "#6d9689",
  blush: "#d49a88",
};

export function createRunnerConnector() {
  const group = new THREE.Group();
  group.name = "runner-connector-pocket-garden";
  const batches = new Map<Shape, { color: string; transform: THREE.Matrix4 }[]>();
  const piece = new THREE.Object3D();

  function place(shape: Shape, color: string, at: Location, size: Dimensions, roll = 0) {
    piece.position.set(...at);
    piece.scale.set(...size);
    piece.rotation.z = roll;
    piece.updateMatrix();
    const instance = { color, transform: piece.matrix.clone() };
    const batch = batches.get(shape);
    if (batch) batch.push(instance);
    else batches.set(shape, [instance]);
  }

  const size = runnerConnectorLength;
  place("slab", "#a5ac83", [0, -0.16, -8.65], [size, 0.3, 10.1]);
  addRunnerSidewalk(size, (color, at, dimensions) => place("slab", color, at, dimensions));

  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 3; col++) {
      const color = (row + col) % 3 === 0 ? colors.limestone : "#e5cfae";
      place("slab", color, [(col - 1) * 0.65, 0.021, -5.7 - row * 0.59], [0.634, 0.062, 0.572]);
    }
  }
  place("rounded", colors.plaster, [0, 0.07, -9.7], [3, 0.16, 2.1]);
  place("slab", "#aeb48a", [0, 0.015, -11.5], [7.8, 0.07, 2.12]);

  for (const side of [-1, 1]) {
    const x = side * 2.78;
    const z = side === -1 ? -9.65 : -10.8;
    place("cylinder", colors.endGrain, [x, 0.045, z], [0.53, 0.09, 0.48]);
    place("cylinder", colors.timber, [x, 0.93, z], [0.19, 1.86, 0.17], side * 0.06);
    place("cylinder", colors.timber, [x + 0.14, 1.49, z - 0.04], [0.105, 0.9, 0.12], -0.37);
    place("cylinder", colors.endGrain, [x - 0.13, 1.46, z], [0.092, 0.76, 0.11], 0.41);
    place("leaf", colors.sage, [x, 2.15, z], [1.42, 1.29, 1.44]);
    place("leaf", colors.lightLeaf, [x - 0.34, 2.52, z - 0.1], [1.09, 0.89, 0.98]);
    place("leaf", colors.shadeLeaf, [x + 0.49, 1.98, z + 0.18], [0.93, 0.74, 0.92]);
    place("leaf", colors.sage, [x + 0.49, 2.49, z - 0.31], [0.9, 0.85, 0.91]);

    const benchX = side * 2.52;
    const benchZ = -6.45;
    for (const dx of [-0.49, 0.49]) {
      place("box", colors.teal, [benchX + dx, 0.203, benchZ], [0.13, 0.4, 0.37]);
      place("box", colors.teal, [benchX + dx, 0.53, benchZ - 0.192], [0.073, 0.51, 0.08]);
    }
    place("rounded", colors.timber, [benchX, 0.41, benchZ], [1.38, 0.112, 0.43]);
    place("rounded", colors.timber, [benchX, 0.664, benchZ - 0.208], [1.38, 0.22, 0.078]);
    place("slab", colors.clay, [benchX, 0.468, benchZ + 0.055], [1.18, 0.008, 0.02]);
    place("slab", colors.endGrain, [benchX, 0.669, benchZ - 0.166], [1.24, 0.014, 0.007]);

    const potX = side * 3.25;
    place("rounded", colors.clay, [potX, 0.16, -5.69], [0.66, 0.28, 0.57]);
    place("box", colors.limestone, [potX, 0.296, -5.69], [0.69, 0.045, 0.6]);
    place("leaf", colors.sage, [potX, 0.38, -5.69], [0.53, 0.26, 0.44]);
    for (const [dx, y, dz] of [[-0.17, 0.5, -0.03], [0.03, 0.55, 0.04], [0.16, 0.49, 0.11]]) {
      place("bud", side === -1 ? colors.blush : colors.plaster, [potX + dx, y, -5.69 + dz], [0.12, 0.115, 0.11]);
    }
  }

  // A neighborhood book exchange with visible shelves and a softly pitched wooden roof.
  const cabinetZ = -9.67;
  place("rounded", colors.teal, [0, 0.49, cabinetZ], [1.68, 0.58, 0.77]);
  place("box", colors.plaster, [0, 0.53, cabinetZ + 0.391], [1.42, 0.4, 0.059]);
  place("box", colors.timber, [0, 0.53, cabinetZ + 0.426], [0.03, 0.35, 0.018]);
  for (const x of [-0.105, 0.105]) {
    place("bud", colors.endGrain, [x, 0.547, cabinetZ + 0.446], [0.06, 0.057, 0.045]);
  }
  place("box", colors.plaster, [0, 1.32, cabinetZ - 0.34], [1.75, 1.12, 0.143]);
  for (const x of [-0.84, 0.84]) {
    place("rounded", colors.timber, [x, 1.32, cabinetZ], [0.12, 1.12, 0.74]);
  }
  for (const y of [0.79, 1.21, 1.64]) {
    place("box", colors.timber, [0, y, cabinetZ], [1.82, 0.074, 0.8]);
  }
  for (const shelf of [0.83, 1.25]) {
    const books = [colors.teal, colors.blush, colors.clay, colors.lightLeaf, colors.limestone, colors.teal];
    for (const [index, book] of books.entries()) {
      const height = index % 3 === 0 ? 0.27 : 0.32;
      const x = -0.48 + index * 0.165 + (index > 2 ? 0.11 : 0);
      place("slab", book, [x, shelf + height / 2, cabinetZ + 0.095], [0.116, height, 0.36], index === 5 ? -0.1 : 0);
    }
  }
  place("box", colors.plaster, [0, 1.78, cabinetZ], [1.94, 0.18, 0.88]);
  for (const side of [-1, 1]) {
    place("rounded", colors.endGrain, [side * 0.51, 1.985, cabinetZ], [1.13, 0.114, 1.035], side * -0.29);
    place("box", colors.clay, [side * 0.51, 2.047, cabinetZ], [1.124, 0.05, 0.99], side * -0.29);
    for (const dx of [0.27, 0.58, 0.89]) {
      place("slab", colors.limestone, [side * dx, 2.198 - dx * 0.29, cabinetZ], [0.015, 0.011, 1.002], side * -0.29);
    }
  }
  place("rounded", colors.timber, [0, 2.20, cabinetZ], [0.113, 0.101, 1.07]);

  const geometryFor = {
    slab: () => new THREE.BoxGeometry(),
    box: () => new THREE.BoxGeometry(),
    rounded: () => new RoundedBoxGeometry(1, 1, 1, 1, 0.12),
    cylinder: () => new THREE.CylinderGeometry(0.5, 0.55, 1, 9),
    leaf: () => new THREE.SphereGeometry(0.5, 12, 7),
    bud: () => new THREE.SphereGeometry(0.5, 6, 4),
  };
  const material = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  const color = new THREE.Color();
  for (const [shape, batch] of batches) {
    const mesh = new THREE.InstancedMesh(geometryFor[shape](), material, batch.length);
    mesh.name = `runner-connector-${shape}`;
    batch.forEach(({ transform, color: tint }, index) => {
      mesh.setMatrixAt(index, transform);
      mesh.setColorAt(index, color.set(tint));
    });
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
    mesh.castShadow = shape !== "slab" && shape !== "bud";
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}
