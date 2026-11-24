export const runnerWidth = 960;
export const runnerHeight = 460;
export const runnerGround = 386;
export const stageCount = 6;
export const runnerLaneCount = 3;
export const missionTarget = 3;

export const runnerStageLength = 3_240;
const courseLength = stageCount * runnerStageLength;
const startingSpeed = 302;
const speedPerStage = 22;
const jumpVelocity = 675;
const gravity = 1_820;
const laneSpeed = 6.4;
const hitGrace = 1.05;
const jumpBufferTime = 0.12;
const tokenPoints = 150;
const bonusPoints = 30;
const missionPoints = 60;
const completedMissionPoints = 150;
const holdSeconds = 0.18;

export type RunnerPhase = "running" | "crashed" | "finished";
export type MissionAction = "route" | "ground" | "air" | "hold";

export type RunnerObject = {
  id: number;
  kind: "obstacle" | "token" | "bonus" | "mission";
  variant: number;
  stage: number;
  lane: number;
  x: number;
  y: number;
  width: number;
  height: number;
  action?: MissionAction;
  activation?: number;
};

export type RunnerPlayer = Pick<RunnerObject, "x" | "y" | "width" | "height" | "lane"> & {
  depth: number;
  vy: number;
  jumpBuffer: number;
};

type CourseObject = Omit<RunnerObject, "id">;

export type RunnerState = {
  phase: RunnerPhase;
  time: number;
  distance: number;
  stage: number;
  stageProgress: number;
  speed: number;
  lives: number;
  score: number;
  collected: number[];
  missions: number[];
  bonuses: number;
  combo: number;
  bestCombo: number;
  player: RunnerPlayer;
  objects: RunnerObject[];
  hitTimer: number;
  nextObject: number;
  course: CourseObject[];
  pickupScore: number;
};

const playerStart: RunnerPlayer = {
  x: 140,
  y: runnerGround - 64,
  width: 45,
  height: 64,
  lane: 1,
  depth: 1,
  vy: 0,
  jumpBuffer: 0,
};
const obstacleSizes = [
  { width: 38, height: 43 },
  { width: 52, height: 52 },
  { width: 63, height: 59 },
];
const lanes = [0, 1, 2] as const;
const stagePatterns = [
  ["weave", "policy", "gate", "leap"],
  ["gate", "weave", "policy", "leap"],
  ["policy", "weave", "leap", "gate"],
  ["weave", "leap", "gate", "policy"],
  ["gate", "policy", "leap", "weave"],
  ["leap", "gate", "policy", "weave"],
] as const;

type CoursePattern = (typeof stagePatterns)[number][number];

// Objectives share the obstacle groups' safe lanes. The empty fourth slot
// leaves room to approach the next block, except for FIX's closing signal.
const stageMissions: readonly (readonly (MissionAction | null)[])[] = [
  ["route", "route", "route"],
  ["ground", "ground", "ground"],
  ["hold", "hold", "hold"],
  ["air", "air", "air"],
  ["ground", "route", "air"],
  ["ground", "hold", null, "air"],
];

const approachOffsets: Record<CoursePattern, number> = {
  weave: 102,
  policy: -274,
  gate: 70,
  leap: -217,
};

const jumpOffsets: Record<CoursePattern, number> = {
  weave: 222,
  policy: 2,
  gate: 100,
  leap: -18,
};

function createMission(stage: number, lane: number, x: number, pattern: CoursePattern, action: MissionAction): CourseObject {
  const airborne = action === "air";
  const isZone = action === "hold";
  const width = isZone ? 166 : airborne ? 40 : 36;
  const height = isZone ? 28 : width;
  const offset = airborne ? jumpOffsets[pattern] : approachOffsets[pattern];

  return {
    kind: "mission",
    variant: stage,
    action,
    stage,
    lane,
    x: x + offset - width / 2,
    y: runnerGround - (airborne ? 150 : 47),
    width,
    height,
  };
}

function createCourse(seed: number) {
  let randomState = seed >>> 0;
  function choose(limit: number) {
    randomState = (Math.imul(randomState, 1_664_525) + 1_013_904_223) >>> 0;
    return Math.floor(randomState / 0x1_0000_0000 * limit);
  }

  const course: CourseObject[] = [];
  let previousLane = playerStart.lane;
  for (let stage = 0; stage < stageCount; stage++) {
    const offsets = stage === 0 ? [820, 1_500, 2_180, 2_800] : [510, 1_220, 1_960, 2_700];

    stagePatterns[stage].forEach((pattern, index) => {
      const x = stage * runnerStageLength + playerStart.x + offsets[index] + choose(101) - 50;
      const targetLane = (previousLane + 1 + choose(2)) % runnerLaneCount;
      const adjacentLane = (targetLane + 1 + choose(2)) % runnerLaneCount;
      previousLane = targetLane;

      function obstacle(lane: number, offset: number, variant: number) {
        const size = obstacleSizes[variant];
        course.push({
          kind: "obstacle", variant, stage, lane, x: x + offset, y: runnerGround - size.height, ...size,
        });
      }

      function bonus(lane: number, offset: number, inAir = false) {
        const size = 23;
        course.push({
          kind: "bonus", variant: stage, stage, lane, x: x + offset - size / 2,
          y: runnerGround - (inAir ? 133 : 42), width: size, height: size,
        });
      }

      if (pattern === "policy") {
        const variant = choose(2);
        const size = 46;
        obstacle(targetLane, 0, variant);
        obstacle(adjacentLane, choose(81) - 40, 0);
        bonus(targetLane, -210);
        course.push({
          kind: "token", variant: stage, stage, lane: targetLane,
          x: x + (obstacleSizes[variant].width - size) / 2, y: runnerGround - 143,
          width: size, height: size,
        });
      } else if (pattern === "gate") {
        for (const lane of lanes) {
          if (lane !== targetLane) obstacle(lane, choose(71) - 35, choose(3));
        }
        for (const offset of [-152, 12, 164]) bonus(targetLane, offset);
      } else if (pattern === "leap") {
        obstacle(targetLane, 0, 2);
        obstacle(adjacentLane, 108, choose(2));
        bonus(targetLane, 18, true);
        bonus(targetLane, 72, true);
      } else {
        const blockingLane = stage === 0 && index === 0 ? playerStart.lane : adjacentLane;
        obstacle(blockingLane, 0, choose(3));
        obstacle(targetLane, 218, choose(2));
        bonus(targetLane, 17);
        bonus(blockingLane, 236);
      }

      const action = stageMissions[stage][index];
      if (action) course.push(createMission(stage, targetLane, x, pattern, action));
    });
  }
  return course.sort((a, b) => a.x - b.x);
}

export function createRunner(seed = Math.floor(Math.random() * 0x1_0000_0000)): RunnerState {
  return {
    phase: "running",
    time: 0,
    distance: 0,
    stage: 0,
    stageProgress: 0,
    speed: startingSpeed,
    lives: 3,
    score: 0,
    collected: [],
    missions: Array<number>(stageCount).fill(0),
    bonuses: 0,
    combo: 0,
    bestCombo: 0,
    player: { ...playerStart },
    objects: [],
    hitTimer: 0,
    nextObject: 0,
    course: createCourse(seed),
    pickupScore: 0,
  };
}

export function jumpRunner(state: RunnerState) {
  if (state.phase !== "running") return false;

  const { player } = state;
  if (player.y === playerStart.y && player.vy === 0) {
    player.vy = -jumpVelocity;
    return true;
  }

  if (player.vy > 0) player.jumpBuffer = jumpBufferTime;
  return false;
}

export function moveRunnerLane(state: RunnerState, direction: -1 | 1) {
  if (state.phase !== "running") return false;
  const nextLane = state.player.lane + direction;
  if (nextLane < 0 || nextLane >= runnerLaneCount) return false;
  state.player.lane = nextLane;
  return true;
}

function movePlayer(player: RunnerPlayer, delta: number) {
  const depthDelta = player.lane - player.depth;
  player.depth += Math.sign(depthDelta) * Math.min(Math.abs(depthDelta), delta * laneSpeed);

  if (player.y === playerStart.y && player.vy === 0) return;

  player.jumpBuffer = Math.max(0, player.jumpBuffer - delta);
  player.y += player.vy * delta + gravity * delta * delta / 2;
  player.vy += gravity * delta;

  if (player.y >= playerStart.y) {
    player.y = playerStart.y;
    player.vy = player.jumpBuffer > 0 ? -jumpVelocity : 0;
    player.jumpBuffer = 0;
  }
}

function touches(player: RunnerPlayer, target: RunnerObject, margin: number) {
  return Math.abs(player.depth - target.lane) < 0.4
    && player.x + player.width - 7 > target.x + margin
    && player.x + 7 < target.x + target.width - margin
    && player.y + player.height - 4 > target.y + margin
    && player.y + 5 < target.y + target.height - margin;
}

function collect(state: RunnerState, object: CourseObject) {
  if (object.kind === "token") state.collected.push(object.stage);
  else state.bonuses += 1;

  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const bonusMultiplier = Math.min(3, 1 + Math.floor((state.combo - 1) / 3) * 0.25);
  state.pickupScore += Math.round((object.kind === "token" ? tokenPoints : bonusPoints) * bonusMultiplier);
}

function collectMission(state: RunnerState, object: RunnerObject, delta: number) {
  const { player } = state;
  const grounded = player.y === playerStart.y && player.vy === 0;
  const aligned = touches(player, object, 1);

  if (object.action === "hold") {
    object.activation = aligned && grounded
      ? Math.min(1, (object.activation ?? 0) + delta / holdSeconds)
      : 0;
    if (object.activation < 1) return false;
  } else {
    if (!aligned) return false;
    if (object.action === "ground" && !grounded) return false;
    if (object.action === "air" && player.y >= playerStart.y - 12) return false;
  }

  const progress = ++state.missions[object.stage];
  state.pickupScore += missionPoints + (progress === missionTarget ? completedMissionPoints : 0);
  return true;
}

export function tickRunner(state: RunnerState, seconds: number, visibleWidth = runnerWidth) {
  if (state.phase !== "running" || !Number.isFinite(seconds) || seconds <= 0) return;

  const delta = Math.min(seconds, 0.05);
  const travel = Math.min(state.speed * delta, courseLength - state.distance);
  state.time += delta;
  state.distance += travel;
  state.stage = Math.min(Math.floor(state.distance / runnerStageLength), stageCount - 1);
  state.stageProgress = (state.distance - state.stage * runnerStageLength) / runnerStageLength;
  state.speed = startingSpeed + state.stage * speedPerStage + state.stageProgress * 11;
  state.hitTimer = Math.max(0, state.hitTimer - delta);

  movePlayer(state.player, delta);

  for (const object of state.objects) object.x -= travel;
  const horizon = Math.max(runnerWidth, visibleWidth) * 1.14;
  while (state.nextObject < state.course.length) {
    const entry = state.course[state.nextObject];
    const x = entry.x - state.distance;
    // The far lane is drawn at a smaller scale and enters the visible area sooner.
    if (x > horizon) break;

    state.objects.push({ ...entry, id: state.nextObject, x });
    state.nextObject += 1;
  }

  if (state.hitTimer === 0 && state.objects.some((object) =>
    object.kind === "obstacle" && touches(state.player, object, 5))) {
    state.lives -= 1;
    state.combo = 0;
    state.hitTimer = hitGrace;
    if (state.lives === 0) state.phase = "crashed";
  }

  state.objects = state.objects.filter((object) => {
    if (object.x + object.width < -30) return false;
    if (state.phase !== "running" || object.kind === "obstacle") return true;
    if (object.kind === "mission") return !collectMission(state, object, delta);
    if (!touches(state.player, object, 1)) return true;
    collect(state, object);
    return false;
  });

  state.score = Math.floor(state.distance / 10) + state.pickupScore;
  if (state.phase === "running" && state.distance >= courseLength) state.phase = "finished";
}
