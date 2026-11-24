import * as THREE from "three";

import { runnerGround, runnerHeight, runnerStageLength, runnerWidth, type RunnerObject, type RunnerState } from "./street-runner";
import { createRunnerAthlete } from "./street-runner-athlete";
import { createRunnerConnector, runnerConnectorLength } from "./street-runner-connector";
import { createRunnerProps } from "./street-runner-props";
import { getRunnerDistrictBlend } from "./street-runner-transition";
import { createRunnerDistrict, runnerDistrictLength } from "./street-runner-world";

const unit = 0.0165;
const laneSpacing = 1.65;
const laneOrigin = 1;
const cameraTilt = 0.44;
const cameraHeight = 1.66;
const cameraDepth = -1.55;
const cameraSide = 1.05;
const viewAngle = 36;
const backCurb = -2.79;
const frontCurb = 2.79;
const asphaltTileSize = 3.8;
const sectionLength = runnerDistrictLength * 2 + runnerConnectorLength;
const connector = "connector";

const districts = [
  {
    sky: "#e3dbd0", road: "#756f65", curb: "#e3c6a5", skyline: 1.1,
    skyLight: "#e4edfb", bounce: "#bfa37d", key: "#ffe5c2", fill: "#dae5ef",
    ambient: 1.47, sunlight: 3.15, rim: 0.48, angle: [-8.4, 9.6, 6.4],
  },
  {
    sky: "#c8b0ae", road: "#776970", curb: "#d8b4a3", skyline: 0.94,
    skyLight: "#cad3ef", bounce: "#bc9c8d", key: "#ffd0a4", fill: "#c3cbe7",
    ambient: 1.28, sunlight: 2.28, rim: 0.55, angle: [-8.2, 6.5, 6.9],
  },
  {
    sky: "#d6dfdd", road: "#74776f", curb: "#e2ceb5", skyline: 1.02,
    skyLight: "#e2ebf0", bounce: "#beaa8b", key: "#fff2da", fill: "#d2e4e6",
    ambient: 1.54, sunlight: 2.88, rim: 0.50, angle: [-7.6, 10.1, 7.3],
  },
  {
    sky: "#e4e3ce", road: "#717868", curb: "#e3cba6", skyline: 0.66,
    skyLight: "#e2edd9", bounce: "#b1b084", key: "#ffeac5", fill: "#d2e3d9",
    ambient: 1.49, sunlight: 3.06, rim: 0.51, angle: [-7.1, 10, 7.1],
  },
  {
    sky: "#cbdcdd", road: "#65777c", curb: "#dbd6bc", skyline: 0.79,
    skyLight: "#dcecee", bounce: "#a6b0a4", key: "#f7f0d9", fill: "#c5dfea",
    ambient: 1.53, sunlight: 2.77, rim: 0.50, angle: [-7.8, 9.4, 6.6],
  },
  {
    sky: "#dbc4b9", road: "#736b70", curb: "#dcc0a8", skyline: 1.12,
    skyLight: "#d3ddec", bounce: "#c1a18c", key: "#ffdfb8", fill: "#c8d4e9",
    ambient: 1.40, sunlight: 2.80, rim: 0.47, angle: [-8.6, 7.8, 6.7],
  },
].map((district) => ({
  ...district,
  sky: new THREE.Color(district.sky),
  road: new THREE.Color(district.road),
  curb: new THREE.Color(district.curb),
  skyLight: new THREE.Color(district.skyLight),
  bounce: new THREE.Color(district.bounce),
  key: new THREE.Color(district.key),
  fill: new THREE.Color(district.fill),
}));

type SceneryTile = { center: number; halfWidth: number; kind: number | typeof connector };

function createRoute(): SceneryTile[] {
  const result: SceneryTile[] = [];
  const halfDistrict = runnerDistrictLength / 2;
  const halfConnector = runnerConnectorLength / 2;
  const routeEnd = districts.length * sectionLength;
  // Extend both ends so the camera has scenery before the start and beyond the finish.
  for (let index = 5; index > 0; index--) {
    result.push({ center: halfConnector + halfDistrict - index * runnerDistrictLength, halfWidth: halfDistrict, kind: 0 });
  }
  for (let stage = 0; stage < districts.length; stage++) {
    const boundary = stage * sectionLength;
    if (stage > 0) result.push({ center: boundary, halfWidth: halfConnector, kind: connector });
    for (let index = 0; index < 2; index++) {
      const center = boundary + halfConnector + halfDistrict + index * runnerDistrictLength;
      result.push({ center, halfWidth: halfDistrict, kind: stage });
    }
  }
  for (let index = 0; index < 5; index++) {
    const center = routeEnd - halfConnector + halfDistrict + index * runnerDistrictLength;
    result.push({ center, halfWidth: halfDistrict, kind: districts.length - 1 });
  }
  return result;
}

function surfaceTexture(size: number, fill: (x: number, y: number) => readonly [number, number]) {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [shade, alpha] = fill(x / size, y / size);
      const offset = (y * size + x) * 4;
      pixels[offset] = shade;
      pixels[offset + 1] = shade;
      pixels[offset + 2] = shade;
      pixels[offset + 3] = alpha;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function createAsphaltTexture() {
  let seed = 4397;
  const texture = surfaceTexture(128, (x, y) => {
    seed = Math.imul(seed, 1664525) + 1013904223 | 0;
    const grain = (seed >>> 24) / 255;
    const wear = Math.sin(2 * Math.PI * (x * 3 + y)) * Math.cos(2 * Math.PI * (y * 4 - x * 2));
    return [234 + 7 * wear - 22 * Math.pow(grain, 3), 255];
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function createGroundFades() {
  const contact = surfaceTexture(32, (x, y) => {
    const radius = Math.min(1, 2 * Math.hypot(x - 0.5, y - 0.5));
    return [255, 255 * (1 - radius * radius) ** 4];
  });
  const lane = surfaceTexture(64, (x, y) => {
    const ends = Math.min(1, x * 4, (1 - x) * 4);
    const edges = Math.min(1, y * 7, (1 - y) * 7);
    return [255, 255 * ends * edges];
  });
  return { contact, lane };
}

type Vector = readonly [number, number, number];

class ModelKit {
  readonly box = new THREE.BoxGeometry(1, 1, 1);
  readonly cylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
  readonly crystal = new THREE.OctahedronGeometry(0.65);
  readonly ring = new THREE.RingGeometry(0.69, 0.83, 32);
  readonly coinRim = new THREE.TorusGeometry(0.308, 0.016, 5, 32);
  private materials = new Map<string, THREE.MeshStandardMaterial>();

  surface(color: string, glow = false) {
    const key = glow ? `${color}-light` : color;
    let material = this.materials.get(key);
    if (!material) {
      material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.82,
        emissive: glow ? color : "#000000",
        emissiveIntensity: glow ? 0.31 : 0,
        flatShading: true,
      });
      this.materials.set(key, material);
    }
    return material;
  }

  part(parent: THREE.Object3D, shape: THREE.BufferGeometry, material: THREE.Material, at: Vector, size: Vector, shadows = true) {
    const mesh = new THREE.Mesh(shape, material);
    mesh.position.set(...at);
    mesh.scale.set(...size);
    mesh.castShadow = shadows;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  block(parent: THREE.Object3D, color: string, at: Vector, size: Vector, shadows = true) {
    return this.part(parent, this.box, this.surface(color), at, size, shadows);
  }

  dispose() {
    for (const geometry of [this.box, this.cylinder, this.crystal, this.ring, this.coinRim]) {
      geometry.dispose();
    }
    for (const material of this.materials.values()) material.dispose();
  }
}

const skylineStep = 3.3;
const skylineHeights = [3.6, 6.7, 4.3, 8.5, 5.3, 3.1, 9.4, 6.0, 4.8];

function createSkyline(geometry: THREE.BufferGeometry, material: THREE.Material) {
  const columns = 45;
  const mesh = new THREE.InstancedMesh(geometry, material, columns * 2);
  const tower = new THREE.Object3D();
  const shade = new THREE.Color();
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < columns; col++) {
      const pattern = (col + row * 4) % skylineHeights.length;
      const height = skylineHeights[pattern];
      tower.position.set((col - columns / 2 + row * 0.5) * skylineStep, height / 2, -23 - row * 7);
      tower.scale.set(2.25 + pattern % 3 * 0.31, height, 1.7);
      tower.updateMatrix();
      const index = row * columns + col;
      mesh.setMatrixAt(index, tower.matrix);
      mesh.setColorAt(index, shade.setScalar(0.84 + pattern % 3 * 0.055));
    }
  }
  mesh.computeBoundingSphere();
  return mesh;
}

function createTextTexture(text: string, ink: string, width: number, height: number, size: number) {
  const paper = document.createElement("canvas");
  paper.width = width;
  paper.height = height;
  const painter = paper.getContext("2d");
  if (painter) {
    painter.clearRect(0, 0, width, height);
    painter.fillStyle = ink;
    painter.font = `900 ${size}px system-ui, sans-serif`;
    painter.textAlign = "center";
    painter.textBaseline = "middle";
    painter.fillText(text, width / 2, height / 2 + 1);
  }
  const texture = new THREE.CanvasTexture(paper);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

type VisibleObject = {
  group: THREE.Group;
  model: THREE.Group;
  contact: THREE.Mesh;
  zone?: THREE.Mesh;
  charge?: THREE.Mesh;
};

export function createRunner3D(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("webgl2", { alpha: false, antialias: true, powerPreference: "low-power" });
  if (!context) throw new Error("The 3D street runner requires WebGL 2.");

  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: false, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  const sky = new THREE.Color();
  scene.background = sky;
  const haze = new THREE.Fog(districts[0].sky, 21, 47);
  scene.fog = haze;
  const camera = new THREE.PerspectiveCamera(viewAngle, runnerWidth / runnerHeight, 0.1, 72);
  const hemisphere = new THREE.HemisphereLight();
  const sun = new THREE.DirectionalLight();
  const rimLight = new THREE.DirectionalLight();
  rimLight.position.set(5.3, 3.7, -6.8);
  sun.castShadow = true;
  sun.shadow.camera.near = 0.25;
  sun.shadow.camera.far = 36;
  sun.shadow.camera.top = 11;
  sun.shadow.camera.bottom = -11;
  sun.shadow.bias = -0.00022;
  sun.shadow.normalBias = 0.015;
  sun.shadow.intensity = 0.89;
  scene.add(hemisphere, sun, sun.target, rimLight);

  const kit = new ModelKit();
  const asphalt = createAsphaltTexture();
  const fades = createGroundFades();
  const floorGeometry = new THREE.PlaneGeometry(1, 1);
  const roadMaterial = new THREE.MeshStandardMaterial({
    map: asphalt,
    bumpMap: asphalt,
    bumpScale: 0.032,
    roughness: 0.93,
  });
  const curbMaterial = new THREE.MeshStandardMaterial({ roughness: 0.84 });
  const jointMaterial = new THREE.MeshStandardMaterial({ roughness: 0.94 });
  const skylineMaterial = new THREE.MeshBasicMaterial({ toneMapped: false });
  const horizonLand = new THREE.MeshBasicMaterial({ toneMapped: false });
  const highlightMaterial = new THREE.MeshBasicMaterial({
    map: fades.lane,
    color: "#8dc8a5",
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  const contactMaterial = new THREE.MeshBasicMaterial({
    map: fades.contact,
    color: "#1c232b",
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const actorContactMaterial = contactMaterial.clone();
  const zoneMaterial = new THREE.MeshBasicMaterial({
    color: "#b799ea",
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  const chargeMaterial = new THREE.MeshBasicMaterial({ color: "#ebe0ff" });
  const laneMaterial = kit.surface("#e5d5ad");
  const glowRing = new THREE.MeshBasicMaterial({
    color: "#c4e4b4",
    transparent: true,
    opacity: 0.74,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  function floor(parent: THREE.Object3D, material: THREE.Material, y: number, width: number, depth: number) {
    const mesh = kit.part(parent, floorGeometry, material, [0, y, 0], [width, depth, 1], false);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  const road = floor(scene, roadMaterial, 0.001, 50, 5.60);
  const strips = [backCurb, frontCurb].map(z => kit.part(scene, kit.box, curbMaterial, [0, 0.023, z], [50, 0.15, 0.39], false));
  const curbLips = strips.map(({ position }) => kit.part(
    scene, kit.box, curbMaterial, [0, 0.083, position.z], [50, 0.043, 0.439], false,
  ));
  const sidewalkLip = kit.block(scene, "#d4bda1", [0, -0.065, -3.25], [62, 0.18, 0.60], false);
  const nearGround = kit.block(scene, "#cdb499", [0, -0.122, 5.81], [62, 0.23, 6.22], false);
  const distantGround = kit.part(scene, kit.box, horizonLand, [0, -0.28, -23.45], [150, 0.23, 42], false);
  const skyline = createSkyline(kit.box, skylineMaterial);
  scene.add(skyline);
  const laneHighlight = floor(scene, highlightMaterial, 0.015, 5.1, 1.49);
  const playerRing = kit.part(scene, kit.ring, glowRing, [0, 0.021, 0], [0.69, 0.54, 1], false);
  playerRing.rotation.x = -Math.PI / 2;

  function streetPattern(material: THREE.Material, step: number, count: number, rows: readonly number[], y: number, size: Vector) {
    const mesh = new THREE.InstancedMesh(kit.box, material, count * rows.length);
    const item = new THREE.Object3D();
    item.scale.set(...size);
    for (const [row, z] of rows.entries()) {
      for (let index = 0; index < count; index++) {
        item.position.set(index * step - 8, y, z);
        item.updateMatrix();
        mesh.setMatrixAt(row * count + index, item.matrix);
      }
    }
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
    return mesh;
  }

  const stripes = streetPattern(laneMaterial, 2.2, 36, [-laneSpacing / 2, laneSpacing / 2], 0.010, [0.99, 0.009, 0.043]);
  const curbJoints = streetPattern(jointMaterial, 1.1, 72, [backCurb, frontCurb], 0.107, [0.024, 0.006, 0.418]);
  const athlete = createRunnerAthlete();
  const props = createRunnerProps();
  const actor = new THREE.Group();
  actor.add(athlete.body);
  scene.add(actor);
  const actorContact = floor(scene, actorContactMaterial, 0.009, 1.58, 1.35);

  const markers = new Map<string, THREE.Group>();
  const activeObjects = new Map<number, VisibleObject>();
  const freeObjects = new Map<string, VisibleObject[]>();
  const coinMetal = new THREE.MeshStandardMaterial({ color: "#d99245", roughness: 0.32, metalness: 0.26 });
  const coinEdge = new THREE.MeshStandardMaterial({ color: "#ffe2a0", roughness: 0.27, metalness: 0.15 });
  const textures = new Set<THREE.Texture>([asphalt, fades.lane, fades.contact]);
  const extraMaterials = new Set<THREE.Material>([
    roadMaterial, curbMaterial, jointMaterial, highlightMaterial, contactMaterial, actorContactMaterial,
    zoneMaterial, chargeMaterial, glowRing, coinMetal, coinEdge, skylineMaterial, horizonLand,
  ]);

  function modelKey(item: RunnerObject) {
    if (item.kind === "mission") return `mission-${item.stage}-${item.action ?? "route"}`;
    return item.kind === "bonus" ? "bonus" : `${item.kind}-${item.variant}`;
  }

  function makeMarker(item: RunnerObject) {
    if (item.kind === "obstacle") return props.obstacle(item.variant);
    if (item.kind === "mission") return props.mission(item.stage, item.action);
    const model = new THREE.Group();
    if (item.kind === "bonus") {
      kit.part(model, kit.crystal, kit.surface("#83c785", true), [0, 0, 0], [0.32, 0.33, 0.32]);
      return model;
    }

    const coin = kit.part(model, kit.cylinder, coinMetal, [0, 0, 0], [0.7, 0.108, 0.7]);
    coin.rotation.x = Math.PI / 2;
    const face = kit.part(model, kit.cylinder, kit.surface("#ffd16e", true), [0, 0, 0.064], [0.61, 0.042, 0.61], false);
    face.rotation.x = Math.PI / 2;
    kit.part(model, kit.coinRim, coinEdge, [0, 0, 0.077], [1, 1, 0.68], false);
    const text = createTextTexture(`F${item.stage + 1}`, "#63432f", 128, 128, 64);
    textures.add(text);
    const material = new THREE.MeshBasicMaterial({ map: text, transparent: true, depthWrite: false });
    extraMaterials.add(material);
    kit.part(model, floorGeometry, material, [0, 0, 0.088], [0.57, 0.57, 1], false);
    return model;
  }

  function getObject(item: RunnerObject, key: string) {
    const free = freeObjects.get(key)?.pop();
    if (free) return free;
    let template = markers.get(key);
    if (!template) {
      template = makeMarker(item);
      markers.set(key, template);
    }
    const group = new THREE.Group();
    group.userData.modelKey = key;
    const model = template.clone(true);
    const contact = floor(group, contactMaterial, 0.008, 1, 1);
    group.add(model);
    if (item.action !== "hold") return { group, model, contact };
    const zone = kit.part(group, kit.box, zoneMaterial, [0, 0.022, 0], [1, 0.007, 1.42], false);
    const charge = kit.part(group, kit.box, chargeMaterial, [0, 0.031, 0], [1, 0.007, 0.048], false);
    return { group, model, contact, zone, charge };
  }

  const route = createRoute();
  const templates = new Map<SceneryTile["kind"], THREE.Group>();
  const tiles = new Map<SceneryTile, THREE.Group>();
  let disposed = false;

  function placeScenery(distance: number, width: number, playerX: number) {
    const origin = playerX - distance;
    // Perspective shows more sidewalk and roofing than the width of the playable road.
    const left = -width * 0.46 - 9;
    const right = width * 1.47 + 9;
    for (const tile of route) {
      const x = origin + tile.center;
      let node = tiles.get(tile);
      if (x + tile.halfWidth < left || x - tile.halfWidth > right) {
        if (node?.parent) scene.remove(node);
        continue;
      }
      if (!node) {
        let template = templates.get(tile.kind);
        if (!template) {
          template = tile.kind === connector ? createRunnerConnector() : createRunnerDistrict(tile.kind);
          templates.set(tile.kind, template);
        }
        node = template.clone(true);
        tiles.set(tile, node);
      }
      node.position.x = x;
      if (!node.parent) scene.add(node);
    }
  }

  function lightScenery(distance: number, center: number) {
    const { outgoing, incoming, blend } = getRunnerDistrictBlend(distance);
    const from = districts[outgoing];
    const to = districts[incoming];
    const lerp = THREE.MathUtils.lerp;
    sky.lerpColors(from.sky, to.sky, blend);
    haze.color.copy(sky);
    hemisphere.groundColor.lerpColors(from.bounce, to.bounce, blend);
    skylineMaterial.color.copy(sky).lerp(hemisphere.groundColor, 0.37);
    horizonLand.color.copy(sky).lerp(hemisphere.groundColor, 0.57);
    skyline.scale.y = lerp(from.skyline, to.skyline, blend);
    roadMaterial.color.lerpColors(from.road, to.road, blend);
    curbMaterial.color.lerpColors(from.curb, to.curb, blend);
    jointMaterial.color.copy(curbMaterial.color).multiplyScalar(0.76);
    hemisphere.color.lerpColors(from.skyLight, to.skyLight, blend);
    hemisphere.intensity = lerp(from.ambient, to.ambient, blend);
    rimLight.color.lerpColors(from.fill, to.fill, blend);
    rimLight.intensity = lerp(from.rim, to.rim, blend);
    sun.color.lerpColors(from.key, to.key, blend);
    sun.intensity = lerp(from.sunlight, to.sunlight, blend);
    sun.position.set(
      center + lerp(from.angle[0], to.angle[0], blend),
      lerp(from.angle[1], to.angle[1], blend),
      lerp(from.angle[2], to.angle[2], blend) - 3.6,
    );
    sun.target.position.set(center, 0, -3.6);
  }

  function resize(width: number, height: number, dpr: number) {
    if (disposed || width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(dpr, 1.6));
    renderer.setSize(width, height, false);
    const shadowWidth = height < 300 ? 1536 : 2048;
    if (sun.shadow.mapSize.x !== shadowWidth) {
      sun.shadow.mapSize.set(shadowWidth, height < 300 ? 1024 : 1536);
      if (sun.shadow.map) {
        sun.shadow.map.dispose();
        sun.shadow.map = null;
      }
      sun.shadow.radius = shadowWidth / 500;
    }
  }

  function draw(state: RunnerState, visibleWidth: number, reducedMotion: boolean) {
    if (disposed) return;
    const worldWidth = visibleWidth * unit;
    const center = worldWidth / 2;
    const playerX = (state.player.x + state.player.width / 2) * unit;
    const previousDepth = Math.cos(cameraTilt) * -cameraDepth - Math.sin(cameraTilt) * cameraHeight;
    const distance = runnerHeight * unit / (2 * Math.tan(THREE.MathUtils.degToRad(viewAngle) / 2)) + previousDepth + 0.42;
    camera.position.set(center + cameraSide, cameraHeight + Math.sin(cameraTilt) * distance, cameraDepth + Math.cos(cameraTilt) * distance);
    camera.lookAt(center, cameraHeight, cameraDepth);

    const sceneryDistance = reducedMotion && state.stage > 0
      ? state.stage * sectionLength + runnerConnectorLength
      : (reducedMotion ? 0 : state.distance * sectionLength / runnerStageLength);
    placeScenery(sceneryDistance, worldWidth, playerX);
    lightScenery(state.distance, center);
    const offset = reducedMotion ? 0 : state.distance * unit;

    for (const surface of [road, nearGround, sidewalkLip, ...strips, ...curbLips]) {
      surface.position.x = center;
      surface.scale.x = worldWidth + 60;
    }
    distantGround.position.x = center;
    skyline.position.x = center - (offset * 0.15 % (skylineStep * skylineHeights.length));
    asphalt.repeat.set(road.scale.x / asphaltTileSize, road.scale.y / asphaltTileSize);
    asphalt.offset.x = (offset / asphaltTileSize) % 1;
    const shadowSpan = Math.max(12, worldWidth * 0.56 + 3.4);
    if (sun.shadow.camera.right !== shadowSpan) {
      sun.shadow.camera.left = -shadowSpan;
      sun.shadow.camera.right = shadowSpan;
      sun.shadow.camera.updateProjectionMatrix();
    }
    stripes.position.x = -(offset % 2.2);
    curbJoints.position.x = -(offset % 1.1);

    const playerZ = (state.player.depth - laneOrigin) * laneSpacing;
    const lift = Math.max(0, runnerGround - state.player.y - state.player.height) * unit;
    actor.position.set(playerX, lift, playerZ);
    athlete.animate(state, reducedMotion);
    actor.visible = state.hitTimer < 0.18 || reducedMotion || Math.floor(state.time * 18) % 3 !== 0;
    actorContact.position.set(playerX, 0.009, playerZ);
    actorContact.scale.set(1.58 + lift * 0.33, 1.35 + lift * 0.29, 1);
    actorContactMaterial.opacity = 0.51 / (1 + lift * 1.9);
    playerRing.position.set(playerX, 0.021, playerZ);
    laneHighlight.position.set(playerX + 1.05, 0.015, (state.player.lane - laneOrigin) * laneSpacing);

    const drawIds = new Set<number>();
    for (const item of state.objects) {
      if (item.x > visibleWidth + 140 || item.x + item.width < -110) continue;
      drawIds.add(item.id);
      const key = modelKey(item);
      let node = activeObjects.get(item.id);
      if (!node || node.group.userData.modelKey !== key) {
        if (node) scene.remove(node.group);
        node = getObject(item, key);
        scene.add(node.group);
        activeObjects.set(item.id, node);
      }
      const width = item.width * unit;
      const height = item.height * unit;
      const x = (item.x + item.width / 2) * unit;
      node.group.position.set(x, 0, (item.lane - laneOrigin) * laneSpacing);
      if (item.kind === "obstacle") {
        node.model.scale.set(width, height, width);
        node.contact.scale.set(width * 1.75, width * 1.45, 1);
      } else {
        const altitude = (runnerGround - item.y - item.height / 2) * unit;
        const bob = reducedMotion ? 0 : Math.sin(state.time * 5.5 + item.id * 0.84) * 0.06;
        node.model.position.y = altitude + bob;
        node.model.rotation.y = reducedMotion ? 0 : Math.sin(state.time * 3.1 + item.id) * (item.kind === "token" ? 0.36 : 0.24);
        const footprint = item.kind === "bonus" ? 0.60 : 0.91;
        node.contact.scale.set(footprint, footprint * 0.82, 1);
        node.contact.visible = altitude < 1.35;
      }
      if (node.zone && node.charge) {
        const progress = item.activation ?? 0;
        node.zone.scale.x = width;
        node.charge.visible = progress > 0;
        node.charge.scale.x = width * progress;
        node.charge.position.set(-width / 2 + width * progress / 2, 0.031, 0.64);
      }
    }

    for (const [id, node] of activeObjects) {
      if (drawIds.has(id)) continue;
      scene.remove(node.group);
      activeObjects.delete(id);
      const key = node.group.userData.modelKey as string;
      const free = freeObjects.get(key);
      if (free) free.push(node);
      else freeObjects.set(key, [node]);
    }

    renderer.render(scene, camera);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    stripes.dispose();
    curbJoints.dispose();
    skyline.dispose();
    floorGeometry.dispose();
    const geometry = new Set<THREE.BufferGeometry>();
    const material = new Set<THREE.Material>();
    const instanced = new Set<THREE.InstancedMesh>();
    for (const district of [...tiles.values(), ...templates.values()]) {
      district.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometry.add(object.geometry);
        for (const item of Array.isArray(object.material) ? object.material : [object.material]) {
          material.add(item);
          if (item instanceof THREE.MeshStandardMaterial && item.map) textures.add(item.map);
        }
        if (object instanceof THREE.InstancedMesh) instanced.add(object);
      });
    }
    for (const object of instanced) object.dispose();
    for (const item of geometry) item.dispose();
    for (const item of material) item.dispose();
    for (const texture of textures) texture.dispose();
    for (const item of extraMaterials) item.dispose();
    athlete.dispose();
    props.dispose();
    kit.dispose();
    sun.shadow.dispose();
    renderer.dispose();
  }

  return { resize, draw, dispose };
}
