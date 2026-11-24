import { Mesh, OrthographicCamera, WebGLRenderer, type BufferGeometry, type Material } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { createNeighborhoodScene } from "./neighborhood-scene";

const rotationStep = Math.PI / 6;

export function mountNeighborhoodViewer(canvas: HTMLCanvasElement, onUnavailable: () => void) {
  const context = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  if (!context) throw new Error("The street model requires WebGL 2.");

  const scene = createNeighborhoodScene();
  const renderer = new WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);

  const camera = new OrthographicCamera(-7, 7, 4, -4, 0.1, 80);
  camera.position.set(8.5, 7.4, 10.5);

  const orbit = new OrbitControls(camera, canvas);
  orbit.target.set(0, 0.95, 0);
  orbit.enablePan = false;
  orbit.enableZoom = false;
  orbit.minPolarAngle = Math.PI / 3;
  orbit.maxPolarAngle = Math.PI / 2.45;
  orbit.rotateSpeed = 0.55;
  orbit.update();
  orbit.saveState();
  canvas.style.touchAction = "pan-y";

  let frame = 0;
  let disposed = false;

  function requestRender() {
    if (frame || disposed) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      renderer.render(scene, camera);
    });
  }

  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    const viewHeight = Math.max(8.9, 13.6 / aspect);
    camera.left = (-viewHeight * aspect) / 2;
    camera.right = (viewHeight * aspect) / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    requestRender();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  orbit.addEventListener("change", requestRender);
  canvas.addEventListener("webglcontextlost", handleContextLoss);
  resize();

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    canvas.removeEventListener("webglcontextlost", handleContextLoss);
    orbit.removeEventListener("change", requestRender);
    orbit.dispose();

    const geometries = new Set<BufferGeometry>();
    const materials = new Set<Material>();
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      geometries.add(object.geometry);
      const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of meshMaterials) materials.add(material);
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    renderer.dispose();
  }

  function handleContextLoss() {
    dispose();
    onUnavailable();
  }

  return {
    rotateLeft: () => orbit.rotateLeft(rotationStep),
    rotateRight: () => orbit.rotateLeft(-rotationStep),
    reset: () => orbit.reset(),
    dispose,
  };
}
