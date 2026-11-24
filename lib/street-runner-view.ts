import { runnerGround, runnerHeight, type RunnerState } from "./street-runner";
import { getRunnerDistrictBlend } from "./street-runner-transition";
import { policyPillars } from "./policies";

export type RunnerArt = {
  district: (stage: number) => HTMLImageElement | undefined;
  skyline: HTMLImageElement;
  runner: HTMLImageElement;
  runnerStep: HTMLImageElement;
};

type Painter = CanvasRenderingContext2D;
type RunnerObject = RunnerState["objects"][number];
type DistrictBlend = ReturnType<typeof getRunnerDistrictBlend>;

const ink = "#213d3a";
const ivory = "#fff7e7";
const gold = "#f9c96c";
const amber = "#c76a48";
const districts = [
  { image: "fast", sky: ["#f9cfac", "#fff2dc"], road: ["#62766d", "#263f3b"], curb: "#d1c6a4" },
  { image: "family", sky: ["#514c73", "#c88d88"], road: ["#625369", "#352e48"], curb: "#c3a08e" },
  { image: "fair", sky: ["#b9d2c6", "#fff0cf"], road: ["#6a7770", "#3b5354"], curb: "#dccaac" },
  { image: "future", sky: ["#cbdab7", "#fff0cb"], road: ["#687a61", "#33554c"], curb: "#d5bd8c" },
  { image: "fresh", sky: ["#9dc9d1", "#e5ecd3"], road: ["#587975", "#304c50"], curb: "#b9c8a9" },
  { image: "fix", sky: ["#b3a4c0", "#f2c6ac"], road: ["#5b6570", "#333b4d"], curb: "#c3b6ad" },
] as const;
const backdropHeight = 304;
const roadTop = -0.6;
const roadBottom = 2.65;

export function projectRunnerPoint(x: number, y: number, depth: number) {
  const scaleX = 0.91 + depth * 0.09;
  const scaleY = 0.8 + depth * 0.185;
  const projectedX = 140 + (x - 140) * scaleX + (depth - 1) * 8;
  const laneY = 304 + depth * 50 + depth * depth * 3.65;
  const skew = (projectedX - 140) * (-0.029 + depth * 0.011);

  return { x: projectedX, y: laneY + skew + (y - runnerGround) * scaleY, scaleX, scaleY };
}

function onLane(context: Painter, anchor: number, depth: number) {
  const projected = projectRunnerPoint(anchor, runnerGround, depth);
  context.translate(projected.x, projected.y);
  context.scale(projected.scaleX, projected.scaleY);
  context.translate(-anchor, -runnerGround);
}

export function loadRunnerArt(onReady: () => void): RunnerArt {
  function load(source: string) {
    const image = new Image();
    image.addEventListener("load", onReady, { once: true });
    image.src = source;
    return image;
  }

  const districtImages = new Map<number, HTMLImageElement>();
  function district(stage: number) {
    const scene = districts[stage];
    if (!scene) return;
    const cached = districtImages.get(stage);
    if (cached) return cached;

    const image = load(`/images/runner/6f-${scene.image}.webp`);
    districtImages.set(stage, image);
    return image;
  }

  district(0);
  return {
    district,
    skyline: load("/images/liu-neighborhood-day.webp"),
    runner: load("/images/runner/liu-runner.webp"),
    runnerStep: load("/images/runner/liu-runner-step.webp"),
  };
}

function ready(image?: HTMLImageElement) {
  return Boolean(image?.complete && image.naturalWidth > 0);
}

function box(context: Painter, x: number, y: number, width: number, height: number, radius: number, fill: string) {
  context.fillStyle = fill;
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function oval(context: Painter, x: number, y: number, radiusX: number, radiusY: number, fill: string) {
  context.fillStyle = fill;
  context.beginPath();
  context.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
  context.fill();
}

function line(context: Painter, points: readonly (readonly [number, number])[], stroke: string, width: number) {
  context.beginPath();
  context.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) context.lineTo(x, y);
  context.strokeStyle = stroke;
  context.lineWidth = width;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.stroke();
}

function mountainSilhouette(context: Painter, width: number, offset: number) {
  const step = 215;
  context.fillStyle = "#bcd0c4";
  context.beginPath();
  context.moveTo(0, backdropHeight);
  for (let x = -step - offset % step; x < width + step; x += step) {
    context.lineTo(x, 208);
    context.quadraticCurveTo(x + 56, 151, x + 105, 173);
    context.quadraticCurveTo(x + 159, 204, x + step, 208);
  }
  context.lineTo(width, backdropHeight);
  context.closePath();
  context.fill();
}

function blendColor(from: string, to: string, weight: number) {
  if (weight === 0) return from;
  if (weight === 1) return to;
  const start = Number.parseInt(from.slice(1), 16);
  const end = Number.parseInt(to.slice(1), 16);
  const channels = [16, 8, 0].map((shift) => {
    const a = start >> shift & 255;
    const b = end >> shift & 255;
    return Math.round(a + (b - a) * weight);
  });
  return `rgb(${channels.join(",")})`;
}

function drawBackdropTiles(context: Painter, image: HTMLImageElement, width: number, offset: number, alpha: number) {
  const curbDepth = roadTop - 0.09;
  const curb = projectRunnerPoint(0, runnerGround, curbDepth);
  const facadeSlope = -0.029 + curbDepth * 0.011;
  const height = curb.y - facadeSlope * curb.x + 1;
  const tileWidth = height * image.naturalWidth / image.naturalHeight;
  const first = Math.floor(offset / tileWidth);
  const remaining = offset % tileWidth;
  context.save();
  context.globalAlpha = alpha;
  context.transform(1, facadeSlope, 0, 1, 0, 0);
  // Alternating the image orientation makes the joining edges match exactly.
  for (let i = 0; i * tileWidth - remaining < width; i++) {
    const tileLeft = i * tileWidth - remaining;
    context.save();
    if ((first + i) % 2 === 1) {
      context.translate(tileLeft + tileWidth, 0);
      context.scale(-1, 1);
      context.drawImage(image, 0, 0, tileWidth, height);
    } else {
      context.drawImage(image, tileLeft, 0, tileWidth, height);
    }
    context.restore();
  }
  context.restore();
}

function cityBackground(context: Painter, state: RunnerState, width: number, art: RunnerArt | null, reduced: boolean, lighting: DistrictBlend) {
  const from = districts[lighting.outgoing];
  const to = districts[lighting.incoming];
  const { blend } = lighting;
  const sky = context.createLinearGradient(0, 0, 0, backdropHeight);
  sky.addColorStop(0, blendColor(from.sky[0], to.sky[0], blend));
  sky.addColorStop(1, blendColor(from.sky[1], to.sky[1], blend));
  context.fillStyle = sky;
  context.fillRect(0, 0, width, runnerHeight);

  const tileOffset = reduced ? 0 : state.distance * 0.145;
  const background = art?.district(blend === 1 ? lighting.incoming : lighting.outgoing);
  const next = art?.district(lighting.incoming);
  art?.district(state.stage + 1);
  if (background && ready(background)) {
    drawBackdropTiles(context, background, width, tileOffset, 1);
  } else {
    const offset = reduced ? 0 : state.distance * 0.18;
    oval(context, width * 0.77, 111, 54, 54, "#ffdb9f");
    mountainSilhouette(context, width, offset * 0.48);
    if (art && ready(art.skyline)) {
      const tileWidth = 830;
      const height = tileWidth * art.skyline.naturalHeight / art.skyline.naturalWidth;
      for (let x = -offset % tileWidth; x < width; x += tileWidth) {
        context.drawImage(art.skyline, x, backdropHeight - height + 9, tileWidth, height);
      }
    }
  }
  if (next && next !== background && blend > 0 && ready(next)) {
    drawBackdropTiles(context, next, width, tileOffset, blend);
  }
}

function roadBand(
  context: Painter,
  start: number,
  end: number,
  far: number,
  near: number,
  fill: string | CanvasGradient,
) {
  const a = projectRunnerPoint(start, runnerGround, far);
  const b = projectRunnerPoint(end, runnerGround, far);
  const c = projectRunnerPoint(end, runnerGround, near);
  const d = projectRunnerPoint(start, runnerGround, near);
  context.beginPath();
  context.moveTo(a.x, a.y);
  context.lineTo(b.x, b.y);
  context.lineTo(c.x, c.y);
  context.lineTo(d.x, d.y);
  context.closePath();
  context.fillStyle = fill;
  context.fill();
}

function street(context: Painter, state: RunnerState, width: number, reduced: boolean, lighting: DistrictBlend) {
  // Extend the tilted plane beyond the camera so a narrow or wide crop stays solid.
  const left = -220;
  const right = width * 1.28 + 230;
  const from = districts[lighting.outgoing];
  const to = districts[lighting.incoming];
  const { blend } = lighting;
  const surface = context.createLinearGradient(0, 265, 0, runnerHeight);
  surface.addColorStop(0, blendColor(from.road[0], to.road[0], blend));
  surface.addColorStop(1, blendColor(from.road[1], to.road[1], blend));
  roadBand(context, left, right, roadTop, roadBottom + 0.45, surface);
  roadBand(context, left, right, roadTop - 0.09, roadTop, blendColor(from.curb, to.curb, blend));
  roadBand(context, left, right, roadTop, roadTop + 0.06, "#a08768");
  roadBand(context, left, right, roadTop + 0.06, roadTop + 0.11, "#1b37354f");
  roadBand(context, left, right, roadBottom - 0.13, roadBottom - 0.075, "#89a99d");
  roadBand(context, left, right, roadBottom - 0.075, roadBottom + 0.42, "#1d3534");

  const lane = state.player.lane;
  const accent = context.createLinearGradient(60, 0, Math.max(300, width * 0.78), 0);
  accent.addColorStop(0, "#103c3582");
  accent.addColorStop(0.2, "#76c7a54f");
  accent.addColorStop(1, "#96d5aa00");
  roadBand(context, left, right, lane - 0.475, lane + 0.475, accent);

  const offset = reduced ? 0 : state.distance % 155;
  for (let x = -offset - 155; x < right; x += 155) {
    roadBand(context, x, x + 62, 0.487, 0.522, "#ddcda0ae");
    roadBand(context, x, x + 69, 1.487, 1.526, "#f9dfacae");
    roadBand(context, x + 98, x + 119, 2.28, 2.295, "#9bb2a757");
  }

  const cue = projectRunnerPoint(64, runnerGround, lane);
  line(context, [[cue.x - 14, cue.y - 4], [cue.x, cue.y], [cue.x - 14, cue.y + 4]], "#c2e5b4bd", 2.5);
  line(context, [[cue.x - 29, cue.y - 4], [cue.x - 15, cue.y], [cue.x - 29, cue.y + 4]], "#c2e5b46f", 2.5);
}

function districtIcon(context: Painter, stage: number, color: string, cutout: string) {
  switch (stage) {
    case 0:
      box(context, 10, 8, 20, 20, 4, color);
      box(context, 12.5, 10.5, 15, 8, 2, cutout);
      oval(context, 15, 23, 1.8, 1.8, cutout);
      oval(context, 25, 23, 1.8, 1.8, cutout);
      box(context, 12, 26, 4, 5, 1.5, color);
      box(context, 24, 26, 4, 5, 1.5, color);
      break;
    case 1:
      line(context, [[12, 30], [12, 15], [16, 10], [26, 10]], color, 3);
      box(context, 21, 10, 10, 6, 2.5, color);
      line(context, [[20, 20], [17, 24]], color, 2);
      line(context, [[25, 20], [25, 27]], color, 2);
      line(context, [[30, 20], [33, 24]], color, 2);
      break;
    case 2:
      box(context, 9, 9, 22, 17, 5, color);
      line(context, [[15, 23], [15, 29], [21, 23]], color, 2.5);
      line(context, [[14, 15], [26, 15]], cutout, 2);
      line(context, [[14, 20], [23, 20]], cutout, 2);
      break;
    case 3:
      line(context, [[10, 27], [15, 11], [21, 11], [25, 19], [30, 24], [34, 25]], color, 3);
      line(context, [[12, 22], [16, 22]], color, 2);
      line(context, [[13.5, 17], [17.5, 17]], color, 2);
      line(context, [[9, 29], [33, 29]], color, 2);
      break;
    case 4:
      context.fillStyle = color;
      context.beginPath();
      context.moveTo(20, 6);
      context.quadraticCurveTo(3, 26, 20, 30);
      context.quadraticCurveTo(37, 26, 20, 6);
      context.fill();
      line(context, [[15, 21], [18, 24]], cutout, 2);
      break;
    case 5:
      box(context, 12, 10, 16, 21, 3, color);
      box(context, 17, 7, 6, 4, 1, color);
      line(context, [[21, 14], [17, 21], [23, 21], [19, 27]], cutout, 2);
      break;
  }
}

function districtSign(context: Painter, state: RunnerState, width: number, reduced: boolean) {
  const x = width * 0.71 - (reduced ? 0 : state.stageProgress * 42);
  const y = projectRunnerPoint(x, runnerGround, roadTop - 0.15).y - 112;
  context.save();
  context.translate(x, y);
  box(context, 18, 33, 4, 82, 2, "#536760");
  box(context, 10, 110, 20, 5, 2, "#536760");
  box(context, 0, 2, 40, 40, 9, "#213d3a76");
  box(context, 0, 0, 40, 38, 8, ink);
  box(context, 2, 2, 36, 34, 6, "#e8ecd6");
  districtIcon(context, state.stage, ink, "#e8ecd6");
  context.restore();
}

function obstacle(context: Painter, item: RunnerObject) {
  const { x, y, width, height, variant } = item;
  oval(context, x + width / 2, runnerGround + 2, width * 0.56, 3.5, "#162a2670");

  if (variant === 0) {
    context.fillStyle = amber;
    context.beginPath();
    context.moveTo(x + width * 0.41, y);
    context.lineTo(x + width * 0.59, y);
    context.lineTo(x + width * 0.86, y + height * 0.9);
    context.lineTo(x + width * 0.14, y + height * 0.9);
    context.closePath();
    context.fill();
    context.save();
    context.clip();
    context.fillStyle = ivory;
    context.fillRect(x, y + height * 0.43, width, height * 0.18);
    context.restore();
    box(context, x, y + height * 0.86, width, height * 0.14, 3, "#714c3d");
  } else if (variant === 1) {
    box(context, x, y + 2, width, height - 2, 4, "#9b5944");
    box(context, x + 3, y, width - 6, height - 6, 4, "#d68859");
    box(context, x + 6, y + 5, width - 12, height - 16, 2, "#f4c080");
    line(context, [[x + 9, y + height - 15], [x + width - 9, y + 10]], "#a96b4c", 3);
  } else {
    const left = x + width * 0.18;
    const postWidth = width * 0.64;
    box(context, x, y + height - 6, width, 6, 2, "#754935");
    box(context, left, y, postWidth, height - 3, 5, amber);
    box(context, left + 2, y + 6, postWidth - 4, 7, 2, gold);
    box(context, left + 2, y + 16, postWidth - 4, 5, 1, ivory);
  }
}

function token(context: Painter, item: RunnerObject) {
  const cx = item.x + item.width / 2;
  const cy = item.y + item.height / 2;
  const radius = Math.min(item.width, item.height) / 2;

  const plumb = context.createLinearGradient(0, cy, 0, runnerGround);
  plumb.addColorStop(0, "#ffd47e26");
  plumb.addColorStop(1, "#ffd47ea8");
  context.fillStyle = plumb;
  context.fillRect(cx - 1, cy, 2, runnerGround - cy);
  oval(context, cx, runnerGround + 1, radius * 0.76, 2.65, "#ffd47e8b");

  oval(context, cx, cy + 2.4, radius + 1.6, radius + 1.6, "#774723ad");
  oval(context, cx, cy, radius, radius, "#815829");
  oval(context, cx, cy, radius - 1.5, radius - 1.5, gold);
  oval(context, cx, cy, radius - 4.7, radius - 4.7, "#ffdf8c");

  context.fillStyle = "#513b26";
  context.font = `900 ${radius * 0.97}px ui-monospace, monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(`F${item.stage + 1}`, cx, cy + 0.7);
}

function bonus(context: Painter, item: RunnerObject) {
  const cx = item.x + item.width / 2;
  const cy = item.y + item.height / 2;
  const radius = Math.min(item.width, item.height) / 2;

  oval(context, cx, runnerGround + 1, radius * 0.7, 2.35, "#b6e2bc87");
  oval(context, cx, cy, radius + 1, radius + 1, "#154438");
  oval(context, cx, cy, radius - 1.3, radius - 1.3, "#b8ddb1");
  context.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = Math.PI * (i / 4 - 0.5);
    const distance = radius * (i % 2 === 0 ? 0.76 : 0.29);
    const x = cx + Math.cos(angle) * distance;
    const y = cy + Math.sin(angle) * distance;
    if (i === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fillStyle = "#145d49";
  context.fill();
}

function missionZone(context: Painter, item: RunnerObject) {
  const end = item.x + item.width;
  const far = item.lane - 0.29;
  const near = item.lane + 0.29;
  roadBand(context, item.x, end, far, near, "#bd9cf15a");
  roadBand(context, item.x, end, far, far + 0.04, "#e5d1ffa8");
  roadBand(context, item.x, end, near - 0.04, near, "#e5d1ffa8");
  const progress = item.activation ?? 0;
  if (progress > 0) {
    roadBand(context, item.x, item.x + item.width * progress, far, near, "#e3caffa8");
  }
}

function mission(context: Painter, item: RunnerObject) {
  const cx = item.x + item.width / 2;
  const cy = item.y + item.height / 2;
  const size = Math.min(46, item.height);
  const plate = "#e8d8ff";
  const outline = "#423062";
  const shadow = "#d5aaff7c";

  if (item.action !== "hold") {
    line(context, [[cx, cy], [cx, runnerGround - 3]], shadow, 2);
    oval(context, cx, runnerGround - 1, 13, 3.2, shadow);
  }

  if (item.action === "air") {
    line(context, [[cx - 5, cy - size / 2 - 5], [cx, cy - size / 2 - 9], [cx + 5, cy - size / 2 - 5]], "#faeaff", 2.5);
  }

  box(context, cx - size / 2 - 1, cy - size / 2 + 3, size + 2, size + 2, 10, "#1d183bb3");
  box(context, cx - size / 2, cy - size / 2, size, size, 9, outline);
  box(context, cx - size / 2 + 2.5, cy - size / 2 + 2.5, size - 5, size - 5, 7, plate);

  context.save();
  context.translate(cx - size / 2, cy - size / 2 + size * 0.035);
  context.scale(size / 40, size / 40);
  districtIcon(context, item.stage, outline, plate);
  context.restore();
}

function fallbackRunner(context: Painter, phase: number, airborne: boolean) {
  const gait = airborne ? 6 : Math.sin(phase) * 8;
  line(context, [[19, 44], [23 + gait, 53], [20 + gait, 62]], "#48605d", 6);
  line(context, [[22, 44], [24 - gait, 53], [28 - gait, 62]], ink, 6);
  line(context, [[18 + gait, 62], [24 + gait, 62]], "#bad5bf", 4);
  line(context, [[26 - gait, 62], [32 - gait, 62]], ivory, 4);
  box(context, 12, 23, 22, 24, 7, "#f8ecd9");
  line(context, [[15, 25], [28, 40]], "#638b7c", 3.5);
  line(context, [[27, 28], [32, 35], [38, 32 - gait / 4]], ivory, 5);
  oval(context, 34, 32 - gait / 4, 3, 3, "#d9a583");
  oval(context, 24, 14, 10, 11, "#dba681");
  oval(context, 22, 9, 10, 8, "#293735");
  line(context, [[24, 13], [32, 13], [32, 17], [27, 17]], ink, 1.5);
}

function athlete(context: Painter, state: RunnerState, art: RunnerArt | null, reduced: boolean) {
  const { x, y, width, height } = state.player;
  const airborne = y + height < runnerGround - 2;
  const phase = reduced ? 0 : state.time * 23;
  const bob = airborne ? 0 : Math.sin(phase) * 1.1;

  context.save();
  const lift = Math.min(1, Math.max(0, (runnerGround - y - height) / 100));
  context.globalAlpha = 1 - lift * 0.58;
  oval(context, x + width / 2, runnerGround + 2, width * 0.63, 5.5, "#9de4a899");
  oval(context, x + width / 2, runnerGround + 2, width * (0.52 - lift * 0.16), 3.5, "#122c2657");
  context.restore();

  context.save();
  context.translate(x, y + bob);
  if (state.hitTimer > 0) {
    context.globalAlpha = 0.56 + 0.44 * Math.max(0, 1 - state.hitTimer);
  }

  if (art && ready(art.runner)) {
    const activeStep = !reduced && !airborne && Math.floor(state.time * 9) % 2 === 1;
    const sprite = activeStep && ready(art.runnerStep) ? art.runnerStep : art.runner;
    const displayWidth = height * sprite.naturalWidth / sprite.naturalHeight;
    context.translate(width / 2, height);
    context.rotate(airborne ? -0.09 : Math.sin(phase) * 0.021);
    context.drawImage(sprite, -displayWidth / 2, -height, displayWidth, height);
  } else {
    fallbackRunner(context, phase, airborne);
  }
  context.restore();
}

function upcomingCheckpoint(context: Painter, state: RunnerState, width: number) {
  const visibleStart = 0.84;
  if (state.stageProgress < visibleStart) return;
  const remaining = (1 - state.stageProgress) / (1 - visibleStart);
  const x = state.player.x + remaining * (width + 80);
  const checkpoint = projectRunnerPoint(x, runnerGround, roadTop - 0.22);
  const next = policyPillars[state.stage + 1];
  const label = next ? `下一區 · ${next.chinese}` : "終點";
  const labelWidth = next ? 97 : 71;

  roadBand(context, x - 9, x + 9, roadTop + 0.12, roadBottom - 0.16, "#f7ebcf45");
  for (let lane = -0.44; lane < 2.46; lane += 0.2) {
    roadBand(context, x - 8, x + 8, lane, lane + 0.09, "#f8edc6ba");
  }

  const y = checkpoint.y - 100;
  box(context, checkpoint.x - 2, y + 19, 4, 81, 2, "#31584f");
  box(context, checkpoint.x - labelWidth / 2, y, labelWidth, 25, 5, ink);
  context.fillStyle = ivory;
  context.font = "800 13px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, checkpoint.x, y + 13);
}

export function drawRunner(
  context: Painter,
  state: RunnerState,
  visibleWidth: number,
  art: RunnerArt | null,
  isReducedMotion: boolean,
) {
  context.save();
  const lighting = getRunnerDistrictBlend(state.distance);
  cityBackground(context, state, visibleWidth, art, isReducedMotion, lighting);
  districtSign(context, state, visibleWidth, isReducedMotion);
  street(context, state, visibleWidth, isReducedMotion, lighting);
  upcomingCheckpoint(context, state, visibleWidth);

  const { player } = state;
  const drawPlayer = () => {
    context.save();
    onLane(context, player.x, player.depth);
    athlete(context, state, art, isReducedMotion);
    context.restore();
  };
  const objects = state.objects
    .filter((item) => {
      const start = projectRunnerPoint(item.x, runnerGround, item.lane);
      return start.x <= visibleWidth + 4 && start.x + item.width * start.scaleX >= -4;
    })
    .sort((a, b) => a.lane - b.lane || b.x - a.x);
  for (const item of objects) {
    if (item.kind === "mission" && item.action === "hold") missionZone(context, item);
  }

  let drawnPlayer = false;
  for (const item of objects) {
    if (!drawnPlayer && (item.lane > player.depth || (item.lane === player.depth && item.x < player.x))) {
      drawPlayer();
      drawnPlayer = true;
    }
    context.save();
    onLane(context, item.x, item.lane);
    if (item.kind === "token") token(context, item);
    else if (item.kind === "bonus") bonus(context, item);
    else if (item.kind === "mission") mission(context, item);
    else obstacle(context, item);
    context.restore();
  }
  if (!drawnPlayer) drawPlayer();
  context.restore();
}
