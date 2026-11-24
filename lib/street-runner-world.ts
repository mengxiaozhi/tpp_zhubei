import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const runnerDistrictLength = 20;

type Form = "box" | "rounded" | "cylinder" | "crown" | "canopy" | "oval" | "lightPool";
type Finish = "matte" | "glass" | "metal" | "water" | "wood" | "glow" | "lightPool";

type Surface = {
  color: string;
  casts?: boolean;
  finish?: Finish;
};

function lightPoolGeometry() {
  const geometry = new THREE.CircleGeometry(0.5, 24).rotateX(-Math.PI / 2);
  const colors = new Float32Array(geometry.attributes.position.count * 4);
  for (let index = 0; index < colors.length; index += 4) {
    colors.set([1, 1, 1, index === 0 ? 0.49 : 0], index);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 4));
  return geometry;
}

function woodGrain() {
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const grain = y + Math.sin(x * 0.11 + y * 0.08) * 1.4 + Math.sin(x * 0.075) * 1.7;
      const shade = 237 + 10 * Math.sin(grain * 0.68) + 6 * Math.sin(grain * 1.57);
      const offset = (y * size + x) * 4;
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = shade;
      pixels[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function districtModel(stage: number) {
  const group = new THREE.Group();
  group.name = `runner-district-${stage}`;
  const batches = new Map<string, {
    form: Form;
    finish: Finish;
    casts: boolean;
    placements: { transform: THREE.Matrix4; color: string }[];
  }>();
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const size = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const rotation = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const color = new THREE.Color();

  function queue(form: Form, surface: Surface | string) {
    const { color, finish = "matte", casts = true } = typeof surface === "string" ? { color: surface } : surface;
    const key = `${form}:${finish}:${casts}`;
    let batch = batches.get(key);
    if (!batch) {
      batch = { form, finish, casts, placements: [] };
      batches.set(key, batch);
    }
    const transform = matrix.compose(position, rotation, size).clone();
    batch.placements.push({ transform, color });
  }

  function place(
    form: Form,
    x: number, y: number, z: number,
    w: number, h: number, d: number,
    surface: Surface | string,
    rotateX = 0,
    rotateY = 0,
    rotateZ = 0,
  ) {
    position.set(x, y, z);
    size.set(w, h, d);
    rotation.setFromEuler(euler.set(rotateX, rotateY, rotateZ));
    queue(form, surface);
  }

  function box(
    x: number, y: number, z: number, w: number, h: number, d: number,
    surface: Surface | string, angle = 0,
  ) {
    place("box", x, y, z, w, h, d, surface, 0, 0, angle);
  }

  function rounded(
    x: number, y: number, z: number, w: number, h: number, d: number,
    surface: Surface | string, angle = 0,
  ) {
    place("rounded", x, y, z, w, h, d, surface, 0, 0, angle);
  }

  function post(x: number, y: number, z: number, thickness: number, height: number, surface: Surface | string) {
    place("cylinder", x, y, z, thickness, height, thickness, surface);
  }

  function rail(
    x: number, y: number, z: number, toX: number, toY: number, toZ: number,
    thickness: number, surface: Surface | string,
  ) {
    direction.set(toX - x, toY - y, toZ - z);
    const length = direction.length();
    if (length === 0) return;

    position.set((x + toX) / 2, (y + toY) / 2, (z + toZ) / 2);
    size.set(thickness, length, thickness);
    rotation.setFromUnitVectors(up, direction.normalize());
    queue("cylinder", surface);
  }

  function build() {
    const geometries = new Map<Form, THREE.BufferGeometry>();
    const materials = new Map<string, THREE.Material>();
    const geometryFor = {
      box: () => new THREE.BoxGeometry(1, 1, 1),
      rounded: () => new RoundedBoxGeometry(1, 1, 1, 1, 0.11),
      cylinder: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
      crown: () => new THREE.SphereGeometry(0.5, 12, 8),
      canopy: () => new THREE.ConeGeometry(Math.SQRT1_2, 1, 4),
      oval: () => new THREE.SphereGeometry(0.5, 10, 6),
      lightPool: lightPoolGeometry,
    };
    const roughness = { matte: 0.88, glass: 0.24, metal: 0.39, water: 0.3, wood: 0.62 };
    const metalness = { matte: 0, glass: 0.14, metal: 0.44, water: 0.12, wood: 0 };

    for (const { form, finish, casts, placements } of batches.values()) {
      let geometry = geometries.get(form);
      if (!geometry) {
        geometry = geometryFor[form]();
        geometries.set(form, geometry);
      }

      let material = materials.get(finish);
      if (!material) {
        if (finish === "lightPool") {
          material = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
          });
        } else if (finish === "glow") {
          material = new THREE.MeshBasicMaterial({ toneMapped: false });
        } else {
          material = new THREE.MeshStandardMaterial({
            roughness: roughness[finish],
            metalness: metalness[finish],
            map: finish === "wood" ? woodGrain() : null,
          });
        }
        materials.set(finish, material);
      }

      const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
      for (const [index, placement] of placements.entries()) {
        mesh.setMatrixAt(index, placement.transform);
        mesh.setColorAt(index, color.set(placement.color));
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
      mesh.castShadow = casts;
      mesh.receiveShadow = finish !== "glow" && finish !== "lightPool";
      group.add(mesh);
    }

    return group;
  }

  return { place, box, rounded, post, rail, build };
}

type Model = ReturnType<typeof districtModel>;

const noShadow = (color: string): Surface => ({ color, casts: false });
const lit = (color: string): Surface => ({ color, finish: "glow", casts: false });
const glazing = (color: string): Surface => ({ color, finish: "glass", casts: false });
const metal = (color: string): Surface => ({ color, finish: "metal" });
const wood = (color: string): Surface => ({ color, finish: "wood" });
const bark = "#8f674d";
const honey = "#bc8b62";
const lightWood = "#d4ac7d";
const leaves = "#82a388";
const leafLight = "#a7bd91";
const leafShade = "#688b73";
const trim = "#efdbc1";
const plaster = "#f6e7d4";
const blush = "#d89984";
const sage = "#789888";
const glass = "#587d7d";
const glassLight = "#89aaa4";
const dark = "#465d59";
const cream = "#f7e8ca";

type Dimensions = readonly [number, number, number];

export function addRunnerSidewalk(length: number, tile: (color: string, at: Dimensions, size: Dimensions) => void) {
  tile("#e6d1b4", [0, -0.035, -4.5], [length, 0.12, 1.8]);
  tile("#e3c6a3", [0, 0.03, -3.61], [length, 0.16, 0.17]);
  tile("#bca58a", [0, 0.028, -4.11], [length, 0.014, 0.025]);
  tile("#c2ad94", [0, 0.029, -4.9], [length, 0.014, 0.023]);
  for (let x = -length / 2 + 0.5; x < length / 2; x++) {
    tile("#c6b098", [x, 0.029, -3.91], [0.021, 0.014, 0.39]);
    tile("#c6b098", [x - 0.38, 0.029, -4.5], [0.021, 0.014, 0.78]);
    tile("#c6b098", [x, 0.029, -5.12], [0.021, 0.014, 0.43]);
  }
}

function sidewalk(model: Model) {
  addRunnerSidewalk(runnerDistrictLength, (color, at, size) => model.box(...at, ...size, noShadow(color)));
}

function yard(model: Model, ground: string) {
  model.box(0, -0.16, -8.65, 20, 0.3, 10.1, noShadow(ground));
  sidewalk(model);
}

function tree(model: Model, x: number, z: number, height: number, tint = leaves) {
  const edge = runnerDistrictLength / 2 - height * 0.64;
  x = THREE.MathUtils.clamp(x, -edge, edge);
  model.place("cylinder", x, 0.026, z, height * 0.55, 0.045, height * 0.42, noShadow("#8d805c"));
  model.post(x, height * 0.33, z, height * 0.095, height * 0.69, bark);
  model.rail(x, height * 0.32, z, x - height * 0.22, height * 0.71, z + 0.1, height * 0.06, bark);
  model.rail(x, height * 0.46, z, x + height * 0.23, height * 0.78, z - 0.14, height * 0.055, bark);
  model.place("crown", x, height * 0.81, z, height * 0.69, height * 0.61, height * 0.69, tint, 0, 0.46);
  model.place("crown", x - height * 0.23, height * 0.72, z + 0.1, height * 0.53, height * 0.47, height * 0.55, leafShade, 0, 0.8);
  model.place("crown", x + height * 0.21, height * 0.8, z - 0.14, height * 0.52, height * 0.51, height * 0.51, leafLight, 0, 0.29);
  model.place("oval", x - height * 0.13, height * 0.98, z - 0.12, height * 0.41, height * 0.37, height * 0.42, tint, 0, 0.64);
}

function planter(model: Model, x: number, z: number, width = 1.4) {
  model.rounded(x, 0.16, z, width, 0.32, 0.64, "#b8826c");
  model.rounded(x, 0.33, z, width + 0.05, 0.08, 0.69, trim);
  model.box(x, 0.373, z, width * 0.88, 0.018, 0.51, noShadow("#706452"));
  for (const [offset, color] of [[-0.29, leaves], [0, leafLight], [0.29, leaves]] as const) {
    model.place("oval", x + width * offset, 0.45, z, width * 0.38, 0.25, 0.43, color);
    model.place("oval", x + width * offset + 0.05, 0.568, z + 0.06, 0.07, 0.066, 0.067, noShadow(blush));
  }
}

function bench(model: Model, x: number, z: number) {
  for (const dz of [-0.14, 0, 0.14]) model.box(x, 0.38, z + dz, 1.42, 0.076, 0.126, honey);
  for (const y of [0.52, 0.62, 0.72]) model.box(x, y, z - 0.22, 1.42, 0.083, 0.064, lightWood);
  for (const offset of [-0.47, 0.47]) {
    model.rounded(x + offset, 0.17, z, 0.13, 0.34, 0.33, sage);
    model.box(x + offset, 0.52, z - 0.24, 0.075, 0.49, 0.077, bark);
    model.box(x + offset, 0.735, z - 0.184, 0.028, 0.028, 0.012, noShadow(trim));
  }
}

function lamp(model: Model, x: number, z: number, evening: boolean) {
  model.post(x, 1.12, z, 0.115, 2.24, dark);
  model.post(x, 0.12, z, 0.27, 0.24, dark);
  model.rail(x, 2.18, z, x, 2.23, z + 0.4, 0.085, dark);
  model.place("rounded", x, 2.24, z + 0.4, 0.29, 0.14, 0.38, dark);
  model.box(x, 2.173, z + 0.45, 0.22, 0.041, 0.26, evening ? lit("#ffda93") : cream);
  if (evening) {
    model.place("lightPool", x, 0.038, z + 0.12, 1.64, 1, 1.22, { color: "#ffc483", finish: "lightPool", casts: false });
  }
}

function townhouse(
  model: Model, x: number, z: number, width: number, floors: number, color: string, evening: boolean,
) {
  const height = floors * 1.13 + 0.95;
  const near = z + 1.45;
  model.rounded(x, height / 2, z, width, height, 2.9, color);
  model.rounded(x, height + 0.08, z, width + 0.13, 0.16, 3.01, honey);
  for (const roofZ of [z - 1.36, near - 0.09]) model.box(x, height + 0.24, roofZ, width + 0.02, 0.18, 0.13, color);
  for (const side of [-1, 1]) model.box(x + side * width * 0.486, height + 0.24, z, 0.13, 0.18, 2.77, color);
  model.box(x - width * 0.24, height + 0.33, z - 0.59, width * 0.27, 0.34, 0.77, color);
  const tankX = x + width * 0.24;
  model.box(tankX, height + 0.21, z - 0.52, 0.66, 0.12, 0.57, dark);
  model.post(tankX, height + 0.49, z - 0.52, 0.49, 0.51, metal("#a0ada8"));
  for (const y of [0.33, 0.5, 0.67]) model.post(tankX, height + y, z - 0.52, 0.51, 0.036, metal("#758a89"));
  model.box(x, 0.38, near + 0.02, width * 0.75, 0.75, 0.08, dark);
  model.box(x + width * 0.14, 0.47, near + 0.067, width * 0.32, 0.71, 0.035, glazing(glass));
  model.box(x - width * 0.2, 0.43, near + 0.067, width * 0.23, 0.72, 0.035, glazing(glassLight));
  model.box(x - width * 0.18, 0.42, near + 0.091, 0.035, 0.58, 0.018, noShadow(trim));
  model.box(x + width * 0.16, 0.37, near + 0.093, width * 0.35, 0.045, 0.025, noShadow(trim));
  model.rounded(x, 0.98, near + 0.19, width * 0.82, 0.13, 0.48, sage);
  model.box(x, 0.91, near + 0.42, width * 0.82, 0.13, 0.065, honey);
  for (const side of [-1, 1]) {
    model.box(x + side * width * 0.48, height * 0.51, near + 0.02, 0.11, height * 0.96, 0.095, trim);
  }

  for (let floor = 0; floor < floors; floor++) {
    const y = 1.54 + floor * 1.13;
    model.box(x, y - 0.42, near + 0.15, width + 0.04, 0.14, 0.38, trim);
    for (let bay = -1; bay <= 1; bay++) {
      const paneX = x + bay * width * 0.28;
      const occupied = evening && (floor + bay + floors) % 3 !== 1;
      const window = occupied ? lit((floor + bay) % 2 === 0 ? "#ffd493" : "#eeb16e") : glazing(bay === 1 ? glassLight : glass);
      model.box(paneX, y, near + 0.026, width * 0.195, 0.61, 0.063, lightWood);
      model.box(paneX, y + 0.013, near + 0.068, width * 0.155, 0.51, 0.021, window);
      model.box(paneX, y + 0.01, near + 0.083, 0.038, 0.52, 0.024, noShadow(honey));
      model.box(paneX, y + 0.03, near + 0.084, width * 0.155, 0.034, 0.025, noShadow(honey));
      model.box(paneX, y - 0.28, near + 0.1, width * 0.21, 0.065, 0.17, trim);
      if (occupied) model.box(paneX, y - 0.14, near + 0.085, width * 0.153, 0.034, 0.026, noShadow("#a37f64"));
    }

    if (floor % 2 === 0) {
      const acX = x + width * 0.39;
      model.box(acX, y - 0.28, near + 0.18, 0.32, 0.25, 0.22, trim);
      model.box(acX, y - 0.28, near + 0.295, 0.16, 0.13, 0.016, noShadow("#897c75"));
    } else {
      model.box(x, y - 0.17, near + 0.38, width * 0.85, 0.067, 0.06, dark);
      for (const offset of [-0.34, -0.17, 0, 0.17, 0.34]) {
        model.box(x + width * offset, y - 0.29, near + 0.38, 0.038, 0.23, 0.047, dark);
      }
    }
  }
}

function transit(model: Model) {
  yard(model, "#b9bc95");
  for (const x of [-7, 0, 7]) {
    model.rounded(x, 1.6, -10.5, 0.61, 3.2, 0.79, "#c6b79f");
    model.rounded(x, 0.15, -10.5, 1.14, 0.3, 1.35, lightWood);
    model.box(x - 0.24, 1.62, -10.09, 0.092, 2.89, 0.065, trim);
    model.box(x, 3.16, -10.5, 1.52, 0.24, 2.06, "#d5c5b0");
  }
  model.box(0, 3.45, -10.5, 20, 0.39, 2.1, "#c7b399");
  model.box(0, 3.68, -9.48, 20, 0.2, 0.18, "#e4ceb4");
  model.box(0, 3.69, -11.47, 20, 0.15, 0.12, dark);
  model.box(0, 3.4, -9.424, 20, 0.075, 0.054, "#948c80");
  for (const z of [-10.88, -9.99]) model.box(0, 3.66, z, 20, 0.063, 0.056, metal("#727f7c"));

  for (const x of [-4.55, 0, 4.55]) {
    model.place("rounded", x, 4.15, -10.42, 4.44, 0.88, 1.02, cream);
    model.box(x, 3.97, -9.9, 4.27, 0.1, 0.046, "#bf7a60");
    model.box(x, 3.87, -9.894, 4.24, 0.035, 0.021, noShadow("#846254"));
    model.box(x, 4.3, -9.899, 4.18, 0.31, 0.038, "#d3c7ae");
    for (let n = -3; n <= 3; n++) {
      model.box(x + n * 0.51, 4.32, -9.87, 0.37, 0.22, 0.027, glazing(n % 2 === 0 ? glass : glassLight));
    }
    model.box(x + 1.9, 4.2, -9.863, 0.035, 0.59, 0.025, noShadow("#aa9d8a"));
    model.box(x, 4.62, -10.42, 1.64, 0.105, 0.5, metal("#c1bcac"));
    for (const offset of [-0.59, -0.39, 0.39, 0.59]) {
      model.box(x + offset, 4.675, -10.42, 0.055, 0.018, 0.36, noShadow("#807a72"));
    }
  }
  for (const x of [-2.275, 2.275]) {
    model.box(x, 4.12, -10.42, 0.14, 0.7, 0.91, dark);
  }
  for (const side of [-1, 1]) {
    model.place("oval", side * 6.78, 4.11, -10.42, 2.23, 0.73, 1, cream);
    model.place("rounded", side * 7.15, 4.247, -9.965, 0.61, 0.22, 0.07, glazing(glass), 0, side * -0.12);
    model.box(side * 7.48, 4.029, -9.983, 0.16, 0.048, 0.02, lit("#fff2c4"));
  }

  model.rounded(-3.9, 0.12, -7.1, 6.96, 0.19, 2.87, wood(lightWood));
  model.rounded(-3.9, 1.13, -7.55, 6.4, 2.1, 2.3, plaster);
  model.rounded(-3.9, 2.23, -7.47, 7.2, 0.29, 3.1, cream);
  model.rounded(-3.9, 2.42, -7.57, 6.35, 0.12, 2.1, "#9bb5a4");
  for (const z of [-8.3, -7.83, -7.36, -6.89]) model.box(-3.9, 2.482, z, 6.05, 0.018, 0.035, noShadow("#d5e0c6"));
  model.box(-3.9, 2.194, -5.882, 7.13, 0.067, 0.051, honey);
  for (const x of [-6.65, -5.7, -4.8, -3.85, -2.9, -1.98, -1.08]) {
    model.box(x, 1.37, -6.35, 0.8, 0.92, 0.07, glazing(x > -4 ? glass : glassLight));
    model.box(x, 0.93, -6.305, 0.8, 0.06, 0.047, lightWood);
    model.box(x, 1.52, -6.305, 0.8, 0.033, 0.038, noShadow(trim));
    model.box(x + 0.48, 1.16, -6.27, 0.095, 1.97, 0.12, lightWood);
    model.box(x + 0.48, 0.28, -6.25, 0.154, 0.19, 0.17, trim);
  }
  model.box(-4, 1.9, -6.17, 3.4, 0.14, 0.125, dark);
  for (const x of [-5.43, -5.19, -4.95]) model.box(x, 1.904, -6.099, 0.105, 0.056, 0.013, lit("#edcf8d"));

  const busX = 4.4;
  model.rounded(busX + 0.3, 1.88, -6.1, 5.7, 0.16, 2.15, honey);
  for (const x of [1.9, 7]) {
    model.rounded(x, 0.91, -6.76, 0.135, 1.83, 0.135, lightWood);
    model.box(x, 0.16, -6.76, 0.2, 0.29, 0.2, trim);
  }
  model.rounded(busX + 0.3, 1.961, -6.1, 5.48, 0.05, 1.99, "#aabda5");
  for (const x of [2.12, 3.15, 4.18, 5.21, 6.24, 7.27]) {
    model.box(x, 1.805, -6.1, 0.071, 0.1, 2.06, noShadow(bark));
  }
  model.rounded(busX, 0.76, -5.91, 4.33, 1.16, 1.18, "#81aa95");
  model.place("rounded", busX, 1.345, -5.92, 4.12, 0.14, 1.15, cream);
  model.box(busX, 0.555, -5.305, 4.1, 0.13, 0.042, cream);
  model.box(busX, 0.336, -5.306, 4.13, 0.08, 0.06, "#47786f");
  for (const x of [2.78, 3.4, 4.05, 4.7, 5.35, 6]) {
    model.box(x, 1.01, -5.303, 0.53, 0.34, 0.037, glazing(x < 4.2 ? glassLight : glass));
  }
  model.box(6.22, 0.81, -5.296, 0.044, 0.8, 0.027, "#527c6f");
  model.box(6.515, 1.05, -5.948, 0.051, 0.4, 0.88, glazing(glassLight));
  for (const z of [-6.29, -5.53]) model.box(6.56, 0.59, z, 0.03, 0.115, 0.19, lit("#fff0c2"));
  model.box(6.561, 0.417, -5.91, 0.064, 0.1, 0.94, dark);
  for (const x of [3.02, 5.69]) {
    model.place("cylinder", x, 0.24, -5.24, 0.45, 0.17, 0.45, dark, Math.PI / 2);
    model.place("cylinder", x, 0.24, -5.145, 0.2, 0.045, 0.2, trim, Math.PI / 2);
  }
  tree(model, 8.5, -7.2, 2.7);
  planter(model, -7.7, -5.6);
  bench(model, 8.7, -4.8);
}

function dioramaWindow(model: Model, x: number, y: number, z: number, width: number) {
  model.rounded(x, y, z, width, 0.84, 0.081, honey);
  model.box(x, y, z + 0.046, width - 0.12, 0.72, 0.03, lit("#e8dfc7"));
  model.box(x, y, z + 0.066, 0.045, 0.74, 0.027, lightWood);
  model.box(x, y, z + 0.066, width - 0.09, 0.041, 0.028, lightWood);
  model.rounded(x, y - 0.42, z + 0.047, width + 0.12, 0.077, 0.2, lightWood);
}

function cutawayHome(model: Model, x: number, z: number) {
  const floor = 0.31;
  const back = z - 1.56;
  model.rounded(x, 0.125, z, 6.15, 0.25, 3.35, bark);
  model.rounded(x, 0.241, z, 6.17, 0.18, 3.38, wood("#dfb386"));
  for (let row = 0; row < 7; row++) {
    const seam = z - 1.35 + row * 0.451;
    model.box(x, 0.333, seam, 6.02, 0.013, 0.022, noShadow("#b68e66"));
    for (let column = 0; column < 4; column++) {
      const joint = x - 2.41 + column * 1.48 + (row % 2) * 0.61;
      model.box(joint, 0.334, seam - 0.224, 0.024, 0.012, 0.45, noShadow("#b68e66"));
    }
  }
  model.rounded(x, 1.51, back, 6.13, 2.39, 0.16, plaster);
  model.rounded(x, 2.72, back, 6.19, 0.12, 0.22, wood(honey));
  model.box(x, 0.426, back + 0.101, 6.07, 0.15, 0.087, lightWood);
  for (const side of [-1, 1]) {
    const wallX = x + side * 3;
    model.rounded(wallX, 1.51, z - 0.14, 0.16, 2.39, 2.95, plaster);
    model.rounded(wallX, 2.72, z - 0.14, 0.21, 0.114, 2.99, wood(honey));
    model.box(wallX - side * 0.098, 0.426, z - 0.14, 0.061, 0.15, 2.94, lightWood);
  }
  model.rounded(x, 1.52, z - 0.95, 0.15, 2.38, 1.17, plaster);
  model.rounded(x, 2.724, z - 0.953, 0.205, 0.11, 1.21, honey);
  model.rounded(x, 2.41, z - 0.13, 0.17, 0.58, 0.59, plaster);
  model.rounded(x, 2.716, z - 0.127, 0.212, 0.11, 0.61, honey);
  model.rounded(x - 0.025, 1.277, z - 0.24, 0.11, 1.9, 0.11, honey);
  model.rounded(x + 0.24, 1.201, z - 0.075, 0.078, 1.754, 0.68, honey);
  model.box(x + 0.284, 1.57, z - 0.087, 0.021, 0.54, 0.43, noShadow(lightWood));
  model.box(x + 0.284, 0.84, z - 0.087, 0.021, 0.49, 0.43, noShadow(lightWood));
  model.place("oval", x + 0.306, 1.257, z + 0.19, 0.09, 0.08, 0.08, metal("#c49249"));
  dioramaWindow(model, x - 1.43, 1.87, back + 0.094, 1.07);
  dioramaWindow(model, x + 1.82, 1.94, back + 0.094, 1.19);

  const bedX = x - 1.55;
  model.place("lightPool", bedX, 0.335, z + 0.13, 2.18, 1, 2.73, { color: "#785b42", finish: "lightPool", casts: false });
  model.rounded(bedX, floor + 0.32, z + 0.043, 1.42, 0.34, 1.91, sage);
  model.rounded(bedX, floor + 0.81, z - 0.88, 1.42, 0.91, 0.15, lightWood);
  model.rounded(bedX, floor + 0.55, z + 0.04, 1.34, 0.25, 1.86, cream);
  model.rounded(bedX, floor + 0.686, z + 0.38, 1.38, 0.126, 1.21, "#e8ad97");
  model.rounded(bedX, floor + 0.57, z + 1.005, 1.38, 0.33, 0.12, "#d6907b");
  model.rounded(bedX, floor + 0.702, z + 0.07, 1.39, 0.131, 0.137, "#f0c2aa");
  for (const dx of [-0.55, 0.55]) {
    model.rounded(bedX + dx, floor + 0.118, z + 0.78, 0.15, 0.24, 0.15, honey);
    model.rounded(bedX + dx, floor + 0.151, z - 0.72, 0.15, 0.29, 0.15, honey);
  }
  for (const dx of [-0.32, 0.32]) {
    model.place("rounded", bedX + dx, floor + 0.765, z - 0.59, 0.51, 0.17, 0.35, plaster, 0.13, dx * 0.2);
  }
  const cabinetX = x - 2.57;
  model.rounded(cabinetX, 0.956, z - 0.47, 0.62, 1.31, 0.72, sage);
  model.rounded(cabinetX, 1.625, z - 0.47, 0.65, 0.098, 0.75, "#88a594");
  for (const dx of [-0.145, 0.145]) {
    model.box(cabinetX + dx, 1.007, z - 0.1, 0.257, 1.03, 0.047, "#969e7d");
    model.box(cabinetX + dx, 1.119, z - 0.072, 0.194, 0.63, 0.027, noShadow(cream));
    model.place("oval", cabinetX + dx * 0.50, 0.918, z - 0.04, 0.054, 0.054, 0.05, metal("#c59147"));
  }

  const sofaX = x + 1.25;
  model.place("lightPool", sofaX, 0.335, z - 0.61, 2.64, 1, 1.39, { color: "#705443", finish: "lightPool", casts: false });
  model.rounded(sofaX, 0.635, z - 0.71, 1.93, 0.37, 0.83, "#e5c3a6");
  model.rounded(sofaX, 1.072, z - 1.01, 1.97, 0.65, 0.26, "#edceae");
  for (const side of [-1, 1]) {
    model.rounded(sofaX + side * 0.87, 0.9, z - 0.66, 0.27, 0.47, 0.77, "#edceae");
    model.rounded(sofaX + side * 0.403, 0.836, z - 0.62, 0.745, 0.15, 0.56, cream);
    for (const sideZ of [-0.92, -0.44]) {
      model.rounded(sofaX + side * 0.74, 0.416, z + sideZ, 0.14, 0.2, 0.12, honey);
    }
  }
  for (const [dx, angle, color] of [[-0.57, -0.2, blush], [-0.14, 0.12, sage], [0.55, 0.26, "#e5b49f"]] as const) {
    model.place("rounded", sofaX + dx, 1.078, z - 0.787, 0.37, 0.39, 0.17, color, -0.28, angle, angle);
  }
  const rugX = x + 1.21;
  model.place("cylinder", rugX, 0.35, z + 0.59, 1.86, 0.035, 1.37, "#e3b9a0");
  model.place("cylinder", rugX, 0.368, z + 0.59, 1.55, 0.016, 1.10, cream);
  model.place("cylinder", rugX, 0.378, z + 0.59, 1.14, 0.01, 0.806, "#dba68f");
  model.place("cylinder", rugX, 0.385, z + 0.59, 0.82, 0.008, 0.583, cream);
  model.place("cylinder", rugX, 0.662, z + 0.42, 0.83, 0.12, 0.67, lightWood);
  for (const dx of [-0.22, 0.22]) {
    model.post(rugX + dx, 0.497, z + 0.45, 0.069, 0.24, honey);
  }
  model.place("oval", rugX + 0.21, 0.755, z + 0.41, 0.13, 0.17, 0.135, "#b18674");
  model.box(rugX - 0.105, 0.739, z + 0.43, 0.2, 0.048, 0.19, noShadow(sage), 0.08);

  const drawerX = x + 2.51;
  model.rounded(drawerX, 0.677, z + 0.22, 0.7, 0.51, 0.64, sage);
  model.rounded(drawerX, 0.945, z + 0.22, 0.74, 0.088, 0.69, "#94ada0");
  for (const level of [0.592, 0.777]) {
    model.rounded(drawerX, level, z + 0.555, 0.575, 0.154, 0.07, lightWood);
    model.place("oval", drawerX, level, z + 0.594, 0.093, 0.039, 0.03, metal("#ba8b52"));
  }
  for (const dx of [-0.25, 0.25]) for (const dz of [0.006, 0.44]) {
    model.rounded(drawerX + dx, 0.405, z + dz, 0.085, 0.18, 0.08, honey);
  }
  model.post(drawerX, 1.02, z + 0.22, 0.24, 0.048, metal("#bf935d"));
  model.post(drawerX, 1.19, z + 0.22, 0.056, 0.34, metal("#bf935d"));
  model.place("oval", drawerX - 0.048, 1.414, z + 0.22, 0.33, 0.24, 0.286, blush);
  model.place("oval", drawerX - 0.06, 1.354, z + 0.235, 0.28, 0.092, 0.225, lit("#f8d79c"));

  for (const [dx, y, hue] of [[0.44, 2.14, "#dcb18d"], [0.86, 2.09, blush], [0.6, 1.72, sage]] as const) {
    model.box(x + dx, y, back + 0.107, 0.33, 0.39, 0.06, honey);
    model.box(x + dx, y, back + 0.144, 0.278, 0.322, 0.022, noShadow(cream));
    model.box(x + dx, y, back + 0.162, 0.124, 0.174, 0.018, noShadow(hue), 0.12);
  }
}

function neighborhood(model: Model) {
  yard(model, "#b0ab8e");
  townhouse(model, -7.3, -8.2, 3.7, 3, "#dfc7b0", true);
  townhouse(model, -4.13, -8.75, 2.22, 2, "#d9aea0", true);
  cutawayHome(model, -0.06, -7.76);
  townhouse(model, 6.25, -7.95, 4.24, 3, "#dfc4b0", true);
  bench(model, 4.45, -4.9);
  tree(model, -8.18, -5.75, 2.12, "#87ab91");
  tree(model, 8.16, -6.0, 2.13, "#87ab91");
  for (const x of [-8.95, -3.65, 3.48, 8.24]) lamp(model, x, -4.33, true);
  for (const x of [-7.29, -4.55, 7.5]) planter(model, x, -4.8, 0.78);
  for (const x of [-5.57, 5.32]) {
    model.box(x, 0.47, -4.89, 0.46, 0.74, 0.35, "#698077");
    model.box(x, 0.824, -4.89, 0.52, 0.11, 0.41, "#9ca791");
    model.box(x, 0.653, -4.703, 0.25, 0.043, 0.022, noShadow(dark));
  }
}

function publicHall(model: Model) {
  yard(model, "#c4c49e");
  model.rounded(0, 0.32, -7.7, 13.4, 0.64, 4.3, "#ccb49c");
  model.rounded(0, 2.08, -8.15, 12.2, 3.02, 3.65, plaster);
  model.rounded(3.1, 3.98, -8.64, 6.22, 0.82, 2.4, "#e9cdac");
  model.rounded(3.1, 4.434, -8.64, 6.38, 0.13, 2.54, trim);
  model.rounded(-3.89, 3.78, -8.14, 2.7, 0.39, 1.7, "#e2cbb0");
  model.rounded(-3.89, 4.004, -8.14, 2.77, 0.12, 1.76, trim);
  model.rounded(0, 3.19, -6.4, 13.77, 0.3, 2.7, lightWood);
  model.rounded(0, 3.38, -6.45, 11.85, 0.12, 2.25, trim);
  model.box(0, 3.184, -5.025, 13.75, 0.097, 0.072, "#ae8c73");
  model.box(0, 3.29, -5.021, 13.73, 0.045, 0.06, cream);
  for (const x of [-4.2, 0, 4.2]) model.box(x, 3.027, -5.29, 0.5, 0.045, 0.18, lit("#f5da9e"));

  for (const x of [-6.5, -4.63, -2.77, 2.77, 4.63, 6.5]) {
    model.rounded(x, 1.88, -5.55, 0.27, 2.52, 0.35, cream);
    model.rounded(x, 0.64, -5.52, 0.43, 0.15, 0.52, lightWood);
    model.rounded(x, 2.95, -5.54, 0.35, 0.19, 0.43, lightWood);
  }

  for (let x = -5.8; x <= 5.8; x += 0.69) {
    model.box(x, 2.303, -6.3, 0.63, 0.39, 0.08, glazing(glassLight));
    model.box(x, 1.46, -6.3, 0.63, 1.29, 0.08, glazing(glass));
    model.box(x - 0.32, 1.6, -6.24, 0.042, 1.77, 0.046, noShadow(trim));
  }
  model.box(0, 2.106, -6.24, 11.69, 0.065, 0.05, noShadow(trim));
  model.box(0, 2.72, -6.2, 3.4, 0.28, 0.12, "#83a69d");
  for (const [x, width] of [[-1.17, 0.32], [-0.43, 0.38], [0.31, 0.4], [1.09, 0.32]]) {
    model.box(x, 2.723, -6.134, width, 0.084, 0.02, noShadow(cream));
  }
  model.box(0, 1.43, -6.14, 1.64, 1.53, 0.14, "#7ca799");
  model.box(0, 1.43, -6.055, 1.39, 1.37, 0.048, glazing(glassLight));
  model.box(0, 1.34, -6.067, 0.055, 1.31, 0.054, trim);
  model.box(0, 1.29, -6.021, 0.48, 0.043, 0.055, noShadow(cream));
  for (const x of [-5.9, 5.9]) {
    model.rounded(x, 0.79, -6.18, 0.4, 0.28, 0.42, "#d6a287");
    model.place("oval", x, 1.04, -6.18, 0.3, 0.39, 0.33, sage);
  }
  for (const x of [0.58, 1.32, 2.06, 2.8, 3.54, 4.28, 5.02, 5.76]) {
    model.box(x, 4.024, -7.422, 0.61, 0.39, 0.034, glazing(glassLight));
  }

  for (let step = 0; step < 3; step++) {
    model.box(2.05, (step + 1) * 0.106, -4.5 - step * 0.41, 4.27, (step + 1) * 0.212, 0.42, trim);
    model.box(2.05, (step + 1) * 0.213, -4.36 - step * 0.41, 4.2, 0.018, 0.065, noShadow("#a7886b"));
  }

  const rampStart = -7.85;
  const rampEnd = -2.31;
  const rise = 0.6;
  const angle = Math.atan2(rise, rampEnd - rampStart);
  const rampMiddle = (rampStart + rampEnd) / 2;
  const rampLength = Math.hypot(rise, rampEnd - rampStart);
  model.box(rampMiddle, 0.29, -4.9, rampLength, 0.16, 1.17, cream, angle);
  model.box(rampEnd + 0.36, 0.56, -4.9, 0.74, 0.15, 1.17, cream);
  for (const z of [-5.49, -4.31]) {
    model.box(rampMiddle, 0.398, z, rampLength, 0.085, 0.08, "#c29d77", angle);
    model.rail(rampStart, 0.69, z, rampEnd, 1.29, z, 0.062, metal("#739792"));
    model.rail(rampStart, 0.46, z, rampEnd, 1.06, z, 0.045, metal("#7e9e96"));
    for (let i = 0; i < 4; i++) model.post(rampStart + i * 1.84, 0.34 + i * 0.2, z, 0.057, 0.71, metal("#739792"));
  }
  for (const x of [-8.48, -8.34, -8.2]) model.box(x, 0.031, -4.9, 0.062, 0.014, 0.72, noShadow("#d2a656"));
  for (const x of [-8.9, 8.75]) tree(model, x, -7.15, 3.1);
  planter(model, 5.9, -4.95);
  bench(model, 8.26, -4.78);
}

function canopy(model: Model, x: number, z: number) {
  model.place("canopy", x, 2.9, z, 1.94, 0.9, 1.77, "#88aa93", 0, Math.PI / 4);
  model.rounded(x, 2.455, z, 1.94, 0.09, 1.77, "#668b79");
  model.rounded(x, 2.38, z, 1.74, 0.083, 1.59, lightWood);
  for (const dx of [-0.68, 0.68]) for (const dz of [-0.63, 0.63]) {
    model.rounded(x + dx, 1.29, z + dz, 0.14, 2.58, 0.14, honey);
    model.rounded(x + dx, 0.18, z + dz, 0.19, 0.36, 0.19, bark);
  }
  model.box(x, 1.13, z, 1.55, 0.17, 1.48, "#dbad70");
  for (const dx of [-0.65, 0.65]) {
    model.rail(x + dx, 1.61, z - 0.67, x + dx, 1.61, z + 0.67, 0.07, cream);
    model.rail(x + dx, 1.37, z - 0.67, x + dx, 1.37, z + 0.67, 0.05, cream);
  }
  model.box(x, 1.411, z + 0.69, 0.74, 0.37, 0.13, "#d59e61");
  for (const dx of [-0.22, 0, 0.22]) {
    model.box(x + dx, 1.417, z + 0.762, 0.116, 0.116, 0.021, noShadow("#f2d2a0"));
  }
}

function inclusivePark(model: Model) {
  yard(model, "#a8b797");
  model.rounded(0.9, 0.036, -7.65, 12.1, 0.12, 4.7, noShadow("#a5baa5"));
  model.place("cylinder", -5.3, 0.104, -7.4, 3.5, 0.035, 3.5, noShadow("#b6cb97"));
  model.place("cylinder", 4.7, 0.104, -7.4, 3.9, 0.035, 3.9, noShadow("#ddaa86"));
  for (const x of [-3.8, -0.66, 2.5, 5.62]) {
    model.box(x, 0.102, -5.58, 1.89, 0.012, 0.045, noShadow("#baceb0"));
  }
  for (const x of [-8.6, -4.53, 1.2, 5.86, 8.86]) tree(model, x, -12, 3.6 + Math.abs(x) % 1.3);
  tree(model, -8.6, -6.2, 2.1);
  tree(model, 8.6, -6.5, 2.3);

  canopy(model, 0.7, -7.4);
  canopy(model, 4.1, -8.3);
  const rampStart = -5.45;
  const rampEnd = -0.05;
  const rise = 1.02;
  const rampAngle = Math.atan2(rise, rampEnd - rampStart);
  model.box((rampStart + rampEnd) / 2, 0.61, -7.4, Math.hypot(rise, rampEnd - rampStart), 0.126, 1.08, "#dfb97f", rampAngle);
  for (let i = 0; i < 12; i++) {
    model.box(rampStart + i * 0.45 + 0.23, 0.207 + i * 0.085, -7.4, 0.032, 0.021, 0.94, noShadow("#bc955f"), rampAngle);
  }
  for (const z of [-7.97, -6.83]) {
    for (let i = 0; i <= 4; i++) model.post(rampStart + i * 1.35, 0.34 + i * rise / 4, z, 0.076, 0.66, "#d29755");
    model.rail(rampStart, 0.72, z, rampEnd, 1.74, z, 0.072, "#d29755");
    model.rail(rampStart, 0.5, z, rampEnd, 1.52, z, 0.051, cream);
  }

  model.box(2.41, 1.13, -7.82, 2.34, 0.145, 0.79, "#dbad70");
  model.rail(1.31, 1.53, -7.42, 3.49, 1.53, -7.42, 0.073, "#7cae9c");
  model.rail(1.31, 1.53, -8.19, 3.49, 1.53, -8.19, 0.073, "#7cae9c");

  model.rounded(5.89, 0.61, -8.3, 2.5, 0.12, 0.55, blush, -0.43);
  model.rounded(7.11, 0.135, -8.3, 0.56, 0.095, 0.57, blush);
  for (const z of [-8.6, -8]) {
    model.rail(4.75, 1.21, z, 7.02, 0.18, z, 0.071, "#b66156");
    model.rail(4.75, 1.33, z, 4.65, 1.68, z, 0.075, "#b66156");
  }
  for (const x of [-7.2, -6.82, -6.44]) {
    model.post(x, 0.56, -6.25, 0.2, 0.82 + 0.29 * (x + 7.2), "#95aea0");
    model.post(x, 0.984 + 0.145 * (x + 7.2), -6.25, 0.32, 0.075, "#d5bc8a");
  }
  model.post(7.47, 0.3, -6.41, 0.1, 0.59, metal("#688176"));
  model.place("rounded", 7.47, 0.652, -6.41, 0.91, 0.14, 0.32, "#daa462");

  bench(model, 6.52, -4.72);
  bench(model, -7.85, -4.84);
}

function monitoringPole(model: Model, x: number, z: number, height: number) {
  model.post(x, height * 0.5, z, 0.12, height, metal("#607e84"));
  model.post(x, 0.103, z, 0.29, 0.19, "#9a9d90");
  model.box(x, height - 0.46, z + 0.11, 0.31, 0.3, 0.26, cream);
  model.place("box", x, height + 0.06, z, 0.68, 0.075, 0.48, "#416e83", -0.34);
  for (const offset of [-0.179, 0, 0.179]) {
    model.place("box", x + offset, height + 0.105, z + 0.012, 0.166, 0.026, 0.35, glazing("#729aab"), -0.34);
  }
  model.box(x, height - 0.45, z + 0.244, 0.09, 0.078, 0.019, lit("#9ed1b4"));
  model.rail(x, height - 0.69, z + 0.2, x, height - 1.12, z + 0.13, 0.055, metal("#607e84"));
}

function riverside(model: Model) {
  model.box(0, -0.21, -9.38, 20, 0.25, 7.8, { color: "#83b1ad", finish: "water", casts: false });
  model.box(0, -0.12, -4.8, 20, 0.25, 2.45, noShadow("#adbd9b"));
  model.box(0, -0.11, -13.16, 20, 0.27, 1.64, noShadow("#a9b895"));
  sidewalk(model);
  model.box(0, 0.033, -5.099, 20, 0.055, 0.12, noShadow(trim));
  model.box(0, -0.044, -6.01, 20, 0.21, 0.24, "#978e74");
  for (let wave = 0; wave < 19; wave++) {
    const x = ((wave * 11.37) % 17.7) - 8.8;
    const z = -6.43 - (wave * 0.79 % 5.3);
    model.box(x, -0.079, z, 0.46 + wave % 4 * 0.36, 0.01, 0.068, noShadow(wave % 2 ? "#82b0b5" : "#a2bfc0"));
    model.box(x + 0.29, -0.081, z - 0.14, 0.28 + wave % 4 * 0.3, 0.01, 0.043, noShadow("#73a6ae"));
  }

  for (const x of [-9.15, -6.1, -3.05, 0, 3.05, 6.1, 9.15]) {
    model.box(x, 0.32, -5.75, 0.13, 0.69, 0.13, "#b7b2a3");
    model.box(x, 0.668, -5.75, 0.18, 0.058, 0.17, trim);
  }
  for (const y of [0.27, 0.57]) model.box(0, y, -5.74, 20, 0.063, 0.072, y === 0.57 ? lightWood : metal("#7b8b7b"));
  for (const x of [-8.8, -4.9, 2.8, 7.75]) tree(model, x, -13.12, 2.7 + Math.abs(x) % 1.5);
  monitoringPole(model, -5.5, -6.9, 2.1);
  monitoringPole(model, 5.2, -7.7, 2.35);

  const bridgeY = (x: number) => 0.62 + 1.18 * (1 - (x / 8.5) ** 2);
  for (let i = 0; i < 7; i++) {
    const start = -8.2 + i * 2.34;
    const end = start + 2.34;
    const a = bridgeY(start);
    const b = bridgeY(end);
    const length = Math.hypot(end - start, b - a);
    const angle = Math.atan2(b - a, end - start);
    model.rounded((start + end) / 2, (a + b) / 2, -11.35, length + 0.03, 0.22, 1.22, lightWood, angle);
    model.box((start + end) / 2, (a + b) / 2 - 0.035, -10.718, length + 0.01, 0.075, 0.065, "#93836f", angle);
    for (const z of [-11.95, -10.72]) {
      model.post(start, a + 0.18, z, 0.085, 0.36, trim);
      model.rail(start, a + 0.35, z, end, b + 0.35, z, 0.075, trim);
      model.rail(start, a + 0.18, z, end, b + 0.18, z, 0.043, trim);
    }
  }
  for (const x of [-5.2, 0, 5.2]) {
    const height = bridgeY(x);
    model.box(x, height / 2, -11.35, 0.37, height, 0.63, "#bba491");
    model.box(x, height - 0.16, -11.35, 1.2, 0.18, 0.91, "#a99382");
  }
  for (const [x, z] of [[-7.45, -7.3], [2.2, -8.75], [7.35, -9.42]]) {
    model.place("cylinder", x, -0.032, z, 0.36, 0.085, 0.36, "#e6aa70");
    model.place("cylinder", x, 0.027, z, 0.19, 0.098, 0.19, cream);
  }
  bench(model, -7.8, -4.46);
}

function signal(model: Model, x: number, z: number, side: -1 | 1) {
  const pole = metal("#596c6d");
  const headX = x + side * 1.81;
  model.post(x, 1.55, z, 0.16, 3.1, pole);
  model.rail(x, 2.98, z, x + side * 1.9, 2.98, z, 0.095, pole);
  model.rail(x, 2.56, z, x + side * 0.54, 2.98, z, 0.061, pole);
  model.place("rounded", headX, 2.72, z, 0.36, 0.91, 0.24, dark);
  for (const [i, color] of ["#db856e", "#cfa462", "#89be9a"].entries()) {
    const y = 2.99 - i * 0.27;
    model.place("cylinder", headX, y, z + 0.131, 0.22, 0.051, 0.22, dark, Math.PI / 2);
    model.place("cylinder", headX, y, z + 0.163, 0.163, 0.026, 0.163, i === 2 ? lit(color) : glazing(color), Math.PI / 2);
    model.box(headX, y + 0.093, z + 0.179, 0.225, 0.035, 0.165, dark);
  }
  model.box(x, 0.13, z, 0.25, 0.26, 0.26, "#7d7972");
  model.box(x + side * 0.19, 1.63, z + 0.033, 0.26, 0.3, 0.22, dark);
  model.box(x + side * 0.19, 1.638, z + 0.15, 0.155, 0.183, 0.025, glazing("#527676"));
  model.box(x + side * 0.19, 1.628, z + 0.167, 0.073, 0.083, 0.016, lit("#a0d797"));
}

function junction(model: Model) {
  yard(model, "#b8ad96");
  const sideStreet = "#737b7b";
  model.box(0, 0.041, -8.65, 4.7, 0.024, 10.15, noShadow(sideStreet));
  for (let i = 0; i < 7; i++) model.box(-1.95 + i * 0.65, 0.057, -4.67, 0.26, 0.013, 0.82, noShadow(cream));
  for (const z of [-7, -8.35, -9.7, -11.05]) model.box(0, 0.057, z, 0.08, 0.015, 0.62, noShadow("#e9dbae"));
  model.box(0, 0.057, -5.72, 4.17, 0.012, 0.079, noShadow(cream));
  for (const side of [-1, 1]) {
    model.box(side * 2.426, 0.063, -9.77, 0.15, 0.121, 7.71, "#c8b6a2");
    for (let i = 0; i < 5; i++) {
      model.box(side * 2.51, 0.036, -5.015 + i * 0.135, 0.33, 0.028, 0.055, noShadow("#d1a964"));
    }
  }
  townhouse(model, -6.96, -9.15, 4.2, 3, "#d8b7a7", false);
  townhouse(model, 7.05, -8.75, 4.5, 3, "#e4c7ab", false);
  signal(model, -3.15, -5.1, 1);
  signal(model, 3.1, -7, -1);
  tree(model, -9, -5.65, 2.2, "#81927b");
  tree(model, 8.9, -5.64, 2.4, "#81927b");

  for (const x of [4.28, 5.23]) {
    model.place("rounded", x, 0.5, -5.34, 0.76, 0.99, 0.62, "#73998b");
    model.place("rounded", x, 1.02, -5.34, 0.79, 0.095, 0.66, "#a2bca4");
    model.box(x, 0.092, -5.34, 0.81, 0.15, 0.68, "#8c8f80");
    model.box(x, 0.52, -5.013, 0.55, 0.77, 0.046, "#86a891");
    model.box(x + 0.18, 0.63, -4.983, 0.055, 0.13, 0.038, dark);
    for (const y of [0.27, 0.34, 0.41]) model.box(x - 0.05, y, -4.983, 0.26, 0.03, 0.025, noShadow(dark));
  }
  model.rail(4.23, 0.85, -4.98, 4.13, 0.68, -4.98, 0.038, cream);
  model.rail(4.13, 0.68, -4.98, 4.29, 0.68, -4.98, 0.038, cream);
  model.rail(4.29, 0.68, -4.98, 4.19, 0.54, -4.98, 0.038, cream);
  bench(model, -5.35, -4.75);
  planter(model, 7.05, -4.77, 1.45);
}

const districts = [transit, neighborhood, publicHall, inclusivePark, riverside, junction];

export function createRunnerDistrict(stage: number): THREE.Group {
  const district = districts[stage] ?? transit;
  const model = districtModel(stage);
  district(model);
  return model.build();
}
