import {
  BoxGeometry,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  HemisphereLight,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Scene,
  Shape,
  SphereGeometry,
  type BufferGeometry,
} from "three";

const colors = {
  clay: "#c89e8f",
  blush: "#debcac",
  mauve: "#bb9d9c",
  plaster: "#e7cec0",
  cream: "#f5dfbf",
  light: "#fff0d5",
  base: "#d0ad95",
  grout: "#cbb49c",
  trim: "#987e77",
  timber: "#86766b",
  asphalt: "#617c76",
  teal: "#467e77",
  glass: "#a6cac3",
  litGlass: "#f6d3a0",
  darkGlass: "#51716e",
  sage: "#8eab86",
  olive: "#779b7d",
  newLeaf: "#adc5a0",
  tires: "#454c47",
};

type Color = keyof typeof colors;
type Vector = [x: number, y: number, z: number];
type Part = { position: Vector; scale: Vector; rotation?: Vector };
type Batch = Map<Color, Part[]>;

type Building = {
  x: number;
  z: number;
  width: number;
  depth: number;
  floors: number;
  columns: number;
  floorHeight: number;
  wall: Color;
  accent: Color;
};

const buildings: Building[] = [
  { x: -3.45, z: -1.85, width: 1.65, depth: 1.72, floors: 3, columns: 3, floorHeight: 0.51, wall: "blush", accent: "teal" },
  { x: -1.57, z: -1.88, width: 1.72, depth: 1.9, floors: 2, columns: 2, floorHeight: 0.53, wall: "plaster", accent: "clay" },
  { x: 0.58, z: -1.93, width: 2.22, depth: 2, floors: 4, columns: 4, floorHeight: 0.55, wall: "mauve", accent: "teal" },
  { x: 2.96, z: -1.76, width: 2.06, depth: 1.66, floors: 3, columns: 3, floorHeight: 0.56, wall: "blush", accent: "clay" },
];

function addPart(batch: Batch, color: Color, position: Vector, scale: Vector, rotation?: Vector) {
  const part = { position, scale, rotation };
  const parts = batch.get(color);
  if (parts) parts.push(part);
  else batch.set(color, [part]);
}

function mountParts(scene: Scene, geometry: BufferGeometry, batch: Batch, materials: Map<Color, MeshStandardMaterial>) {
  const transform = new Object3D();
  for (const [color, parts] of batch) {
    const mesh = new InstancedMesh(geometry, materials.get(color), parts.length);
    parts.forEach(({ position, scale, rotation }, index) => {
      transform.position.set(...position);
      transform.scale.set(...scale);
      transform.rotation.set(...(rotation ?? [0, 0, 0]));
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
  }
}

function platformGeometry() {
  const halfX = 4.86;
  const halfZ = 3.29;
  const corner = 0.25;
  const outline = new Shape();
  outline.moveTo(-halfX + corner, -halfZ);
  outline.lineTo(halfX - corner, -halfZ);
  outline.quadraticCurveTo(halfX, -halfZ, halfX, -halfZ + corner);
  outline.lineTo(halfX, halfZ - corner);
  outline.quadraticCurveTo(halfX, halfZ, halfX - corner, halfZ);
  outline.lineTo(-halfX + corner, halfZ);
  outline.quadraticCurveTo(-halfX, halfZ, -halfX, halfZ - corner);
  outline.lineTo(-halfX, -halfZ + corner);
  outline.quadraticCurveTo(-halfX, -halfZ, -halfX + corner, -halfZ);

  const geometry = new ExtrudeGeometry(outline, {
    depth: 0.26,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.045,
    bevelThickness: 0.04,
    curveSegments: 5,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -0.30, 0);
  return geometry;
}

function buildStreet(boxes: Batch) {
  addPart(boxes, "asphalt", [0, 0.015, 1.45], [9.59, 0.04, 2.55]);
  addPart(boxes, "cream", [0, 0.05, -1.45], [9.57, 0.15, 3.33]);
  addPart(boxes, "cream", [0, 0.045, 2.99], [9.57, 0.14, 0.54]);
  addPart(boxes, "light", [0, 0.087, 0.20], [9.59, 0.075, 0.12]);
  addPart(boxes, "light", [0, 0.082, 2.72], [9.59, 0.06, 0.1]);
  addPart(boxes, "grout", [0, 0.126, -0.48], [9.52, 0.006, 0.015]);

  for (let slot = 0; slot < 15; slot++) {
    const x = -4.60 + slot * 0.655;
    addPart(boxes, "grout", [x, 0.126, -0.16], [0.014, 0.006, 0.57]);
    addPart(boxes, "grout", [x, 0.116, 2.98], [0.014, 0.006, 0.47]);
  }

  for (let slot = 0; slot < 7; slot++) {
    addPart(boxes, "cream", [-4.21 + slot * 1.03, 0.036, 1.42], [0.53, 0.009, 0.032]);
  }

  for (let stripe = 0; stripe < 9; stripe++) {
    addPart(boxes, "light", [3.15, 0.042, 0.43 + stripe * 0.255], [0.91, 0.014, 0.138]);
  }

  addPart(boxes, "clay", [3.16, 0.128, -0.018], [0.86, 0.008, 0.25]);
  for (let dot = 0; dot < 5; dot++) {
    addPart(boxes, "cream", [2.86 + dot * 0.145, 0.137, -0.018], [0.04, 0.008, 0.14]);
  }
}

function buildBuilding(boxes: Batch, rods: Batch, building: Building, index: number) {
  const { x, z, width, depth, floors, columns, wall, accent, floorHeight } = building;
  const sidewalk = 0.125;
  const ground = 0.68;
  const height = ground + floors * floorHeight;
  const front = z + depth / 2;
  const rear = z - depth / 2;
  const wallTop = sidewalk + height;
  const half = width / 2;

  addPart(boxes, wall, [x, sidewalk + height / 2, z], [width, height, depth]);
  addPart(boxes, "grout", [x, sidewalk + 0.11, front + 0.025], [width + 0.02, 0.21, 0.07]);
  addPart(boxes, "trim", [x, sidewalk + 0.30, front + 0.04], [width - 0.16, 0.59, 0.08]);
  addPart(boxes, "darkGlass", [x, sidewalk + 0.31, front + 0.091], [width - 0.37, 0.48, 0.035]);
  for (const offset of [-0.27, 0.10, 0.31]) {
    addPart(boxes, "cream", [x + width * offset, sidewalk + 0.31, front + 0.118], [0.033, 0.49, 0.026]);
  }

  addPart(boxes, accent, [x, sidewalk + 0.62, front + 0.105], [width + 0.01, 0.075, 0.245]);
  addPart(boxes, "light", [x, sidewalk + 0.65, front + 0.08], [width - 0.19, 0.04, 0.08]);
  addPart(boxes, "trim", [x, sidewalk + ground + 0.037, front + 0.02], [width + 0.06, 0.045, 0.11]);
  addPart(boxes, "trim", [x - half * 0.40, sidewalk + 0.25, rear - 0.031], [0.39, 0.5, 0.055]);
  addPart(boxes, "grout", [x - half * 0.40, sidewalk + 0.25, rear - 0.066], [0.3, 0.43, 0.026]);
  addPart(rods, "grout", [x + half * 0.76, sidewalk + height / 2, rear - 0.027], [0.036, height, 0.036]);

  const mullionSpacing = (width - 0.23) / columns;
  const windowWidth = mullionSpacing * 0.72;
  for (let floor = 0; floor < floors; floor++) {
    const y = sidewalk + ground + (floor + 0.58) * floorHeight;
    for (let column = 0; column < columns; column++) {
      const cx = x - half + 0.115 + (column + 0.5) * mullionSpacing;
      const glass = (floor * 3 + column + index) % 5 < 2 ? "litGlass" : "glass";
      addPart(boxes, "trim", [cx, y, front + 0.021], [windowWidth + 0.055, 0.31, 0.07]);
      addPart(boxes, glass, [cx, y, front + 0.062], [windowWidth, 0.251, 0.025]);
      addPart(boxes, "cream", [cx, y, front + 0.08], [0.024, 0.255, 0.018]);
      addPart(boxes, "cream", [cx, y - 0.171, front + 0.043], [windowWidth + 0.094, 0.035, 0.12]);
      addPart(boxes, "trim", [cx, y, rear - 0.026], [windowWidth * 0.9, 0.264, 0.065]);
      addPart(boxes, glass, [cx, y, rear - 0.066], [windowWidth * 0.76, 0.207, 0.024]);
    }
    for (const side of [-1, 1]) {
      const edge = x + side * (half + 0.025);
      addPart(boxes, "trim", [edge, y, z - 0.28], [0.06, 0.30, 0.49]);
      addPart(boxes, "glass", [edge + side * 0.041, y, z - 0.28], [0.026, 0.24, 0.407]);
      addPart(boxes, "trim", [edge, y, z + 0.35], [0.06, 0.30, 0.32]);
      addPart(boxes, "litGlass", [edge + side * 0.041, y, z + 0.35], [0.026, 0.24, 0.238]);
    }
  }

  addPart(boxes, "cream", [x, wallTop + 0.039, z], [width + 0.14, 0.1, depth + 0.14]);
  addPart(boxes, "trim", [x, wallTop + 0.12, front + 0.005], [width + 0.1, 0.088, 0.077]);
  addPart(boxes, "trim", [x, wallTop + 0.12, rear], [width + 0.1, 0.088, 0.077]);
  for (const side of [-1, 1]) {
    addPart(boxes, "trim", [x + side * (half + 0.012), wallTop + 0.12, z], [0.077, 0.088, depth]);
  }
  addPart(boxes, wall, [x + 0.12, wallTop + 0.17, z - 0.20], [width * 0.40, 0.26, depth * 0.43]);
  addPart(boxes, "light", [x + 0.12, wallTop + 0.30, z - 0.20], [width * 0.44, 0.04, depth * 0.47]);
  if (index === 0 || index === 2) {
    addPart(rods, "trim", [x - width * 0.31, wallTop + 0.265, z + 0.09], [0.028, 0.39, 0.028]);
  }
}

function buildTree(boxes: Batch, rods: Batch, foliage: Batch, x: number, z: number, size: number) {
  addPart(boxes, "clay", [x, 0.182, z], [0.84 * size, 0.115, 0.62 * size]);
  addPart(boxes, "olive", [x, 0.25, z], [0.71 * size, 0.045, 0.5 * size]);
  addPart(rods, "timber", [x, 0.26 + 0.4 * size, z], [0.09 * size, 0.80 * size, 0.09 * size]);
  addPart(foliage, "olive", [x, 0.32 + 0.93 * size, z], [0.79 * size, 0.91 * size, 0.79 * size]);
  addPart(foliage, "sage", [x - 0.28 * size, 0.27 + 0.89 * size, z + 0.04], [0.705 * size, 0.66 * size, 0.72 * size]);
  addPart(foliage, "sage", [x + 0.27 * size, 0.31 + 0.87 * size, z + 0.05], [0.68 * size, 0.62 * size, 0.66 * size]);
  addPart(foliage, "newLeaf", [x - 0.14 * size, 0.34 + 1.20 * size, z + 0.05], [0.65 * size, 0.69 * size, 0.65 * size]);
}

function buildLamp(boxes: Batch, rods: Batch, x: number, z: number) {
  addPart(rods, "timber", [x, 0.75, z], [0.042, 1.31, 0.042]);
  addPart(rods, "trim", [x, 0.19, z], [0.09, 0.13, 0.09]);
  addPart(boxes, "timber", [x, 1.397, z + 0.117], [0.042, 0.042, 0.25]);
  addPart(boxes, "trim", [x, 1.386, z + 0.242], [0.106, 0.06, 0.18]);
  addPart(boxes, "litGlass", [x, 1.354, z + 0.25], [0.079, 0.018, 0.14]);
}

function buildBus(boxes: Batch, rods: Batch) {
  const x = -1.55;
  const z = 2.04;
  addPart(boxes, "teal", [x, 0.33, z], [1.57, 0.38, 0.57]);
  addPart(boxes, "cream", [x, 0.55, z], [1.56, 0.22, 0.56]);
  addPart(boxes, "light", [x, 0.665, z], [1.51, 0.07, 0.53]);
  addPart(boxes, "darkGlass", [x + 0.786, 0.55, z], [0.021, 0.18, 0.44]);
  addPart(boxes, "darkGlass", [x - 0.786, 0.54, z], [0.021, 0.16, 0.4]);
  for (const side of [-1, 1]) {
    for (let window = 0; window < 4; window++) {
      addPart(boxes, "darkGlass", [x - 0.56 + window * 0.352, 0.552, z + side * 0.281], [0.28, 0.159, 0.017]);
    }
    for (const wheel of [-0.49, 0.49]) {
      addPart(rods, "tires", [x + wheel, 0.161, z + side * 0.275], [0.246, 0.095, 0.246], [Math.PI / 2, 0, 0]);
      addPart(rods, "grout", [x + wheel, 0.161, z + side * 0.329], [0.096, 0.012, 0.096], [Math.PI / 2, 0, 0]);
    }
    addPart(boxes, "light", [x + 0.793, 0.285, z + side * 0.188], [0.02, 0.047, 0.09]);
    addPart(boxes, "clay", [x - 0.793, 0.282, z + side * 0.18], [0.02, 0.047, 0.083]);
  }
}

export function createNeighborhoodScene(): Scene {
  const scene = new Scene();
  const boxes: Batch = new Map();
  const rods: Batch = new Map();
  const foliage: Batch = new Map();
  const materials = new Map(
    (Object.entries(colors) as [Color, string][]).map(([color, hex]) => [
      color,
      new MeshStandardMaterial({ color: hex, roughness: 0.94 }),
    ]),
  );

  const platform = new Mesh(platformGeometry(), materials.get("base"));
  scene.add(platform);
  buildStreet(boxes);
  buildings.forEach((building, index) => buildBuilding(boxes, rods, building, index));
  buildTree(boxes, rods, foliage, -4.06, -0.12, 1.02);
  buildTree(boxes, rods, foliage, -0.37, -0.06, 0.82);
  buildTree(boxes, rods, foliage, 4.08, -0.05, 1.0);
  buildLamp(boxes, rods, -2.51, -0.11);
  buildLamp(boxes, rods, 2.12, -0.10);
  buildBus(boxes, rods);
  mountParts(scene, new BoxGeometry(1, 1, 1), boxes, materials);
  mountParts(scene, new CylinderGeometry(0.49, 0.50, 1, 12), rods, materials);
  mountParts(scene, new SphereGeometry(0.5, 12, 9), foliage, materials);

  scene.add(new HemisphereLight("#fff2dd", "#96b1a3", 2.3));
  const sun = new DirectionalLight("#fff1dc", 2.2);
  sun.position.set(-4.5, 8, 5.6);
  scene.add(sun);

  return scene;
}
