"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { policyPillars } from "@/lib/policies";
import {
  createRunner,
  jumpRunner,
  missionTarget,
  moveRunnerLane,
  runnerGround,
  runnerHeight,
  runnerWidth,
  stageCount,
  tickRunner,
  type RunnerState,
} from "@/lib/street-runner";
import { drawRunner, loadRunnerArt, type RunnerArt } from "@/lib/street-runner-view";

import { RunnerJoystick } from "./runner-joystick";
import styles from "./street-runner.module.css";

type Mode = "ready" | "running" | "paused" | "lost" | "won";
type Graphics = "loading" | "3d" | "compatibility" | "unavailable";
type Runner3D = ReturnType<typeof import("@/lib/street-runner-3d")["createRunner3D"]>;
const bestScoreKey = "zhubei-6f-runner-mission-high-score";
const firstCourse = 6;
const stages = [
  {
    scene: "公車轉乘站",
    mission: "轉乘接力",
    instruction: "跟著站牌標記換道，串起三個轉乘點。",
    takeaway: "合作推動在公車轉乘點增設 YouBike。",
    policy: 2,
  },
  {
    scene: "晚歸巷弄",
    mission: "點亮巷弄",
    instruction: "保持在地面，通過三盞待點亮的路燈。",
    takeaway: "推動盤點照明死角，改善夜間通行。",
    policy: 2,
  },
  {
    scene: "市公所",
    mission: "臨櫃溝通",
    instruction: "留在櫃檯車道，等字幕進度填滿。",
    takeaway: "推動臨櫃語音轉文字，協助民眾溝通。",
    policy: 0,
  },
  {
    scene: "共融公園",
    mission: "共融遊具",
    instruction: "跳起收集三枚遊具標記。",
    takeaway: "監督共融遊具、防護地墊與排水改善。",
    policy: 2,
  },
  {
    scene: "河岸步道",
    mission: "河岸監測",
    instruction: "依標記位置換道或跳躍，取得三筆水情資料。",
    takeaway: "合作爭取河段水位、水質感測。",
    policy: 0,
  },
  {
    scene: "街區路口",
    mission: "號誌備援",
    instruction: "通過電源與備援區，再跳起接上號誌。",
    takeaway: "合作爭取重要路口設置號誌 UPS 備援。",
    policy: 0,
  },
];

function snapshot(state: RunnerState) {
  return {
    score: state.score,
    stage: state.stage,
    progress: state.stageProgress,
    lives: state.lives,
    lane: state.player.lane,
    combo: state.combo,
    bestCombo: state.bestCombo,
    bonuses: state.bonuses,
    collected: [...state.collected],
    missions: [...state.missions],
  };
}

function previewRunner(state: RunnerState, visibleWidth: number): RunnerState {
  return {
    ...state,
    objects: [
      { id: 0, kind: "obstacle", variant: 0, stage: 0, lane: 1, x: visibleWidth * 0.69, y: runnerGround - 43, width: 38, height: 43 },
      { id: 1, kind: "token", variant: 0, stage: 0, lane: 0, x: visibleWidth * 0.83, y: runnerGround - 135, width: 46, height: 46 },
      { id: 2, kind: "mission", action: "route", variant: 0, stage: 0, lane: 2, x: visibleWidth * 0.76, y: runnerGround - 48, width: 36, height: 36 },
      { id: 3, kind: "bonus", variant: 0, stage: 0, lane: 2, x: visibleWidth * 0.85, y: runnerGround - 48, width: 24, height: 24 },
    ],
  };
}

async function requestMobileLandscape(frame: HTMLDivElement) {
  if (getComputedStyle(frame).position !== "fixed" || !document.fullscreenEnabled || document.fullscreenElement) return;

  try {
    await frame.requestFullscreen({ navigationUI: "hide" });
    if (document.fullscreenElement !== frame) return;
    const orientation = window.screen.orientation as
      | (ScreenOrientation & { lock?: (value: "landscape") => Promise<void> })
      | undefined;
    await orientation?.lock?.("landscape");
  } catch {
    // The game frame already fills the viewport and rotates in portrait.
  }
}

export function StreetRunner() {
  const [initial] = useState(() => createRunner(firstCourse));
  const [mode, setMode] = useState<Mode>("ready");
  const [hud, setHud] = useState(() => snapshot(initial));
  const [best, setBest] = useState(0);
  const [graphics, setGraphics] = useState<Graphics>("loading");
  const frameRef = useRef<HTMLDivElement>(null);
  const canvas3dRef = useRef<HTMLCanvasElement>(null);
  const fallbackCanvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(initial);
  const modeRef = useRef<Mode>("ready");
  const bestRef = useRef(0);
  const visibleWidthRef = useRef(runnerWidth);
  const renderRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(bestScoreKey));
      if (Number.isSafeInteger(stored) && stored > 0) {
        bestRef.current = stored;
        setBest(stored);
      }
    } catch {
      // The runner still works when the browser blocks storage.
    }

    const frame = frameRef.current;
    let wasFullscreen = false;

    function suspend() {
      if (modeRef.current !== "running") return;
      modeRef.current = "paused";
      setMode("paused");
      setHud(snapshot(stateRef.current));
    }

    function pauseInBackground() {
      if (document.hidden) suspend();
    }

    function handleFullscreenChange() {
      const isFullscreen = Boolean(frame && document.fullscreenElement === frame);
      if (wasFullscreen && !isFullscreen) suspend();
      wasFullscreen = isFullscreen;
    }

    document.addEventListener("visibilitychange", pauseInBackground);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", pauseInBackground);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (frame && document.fullscreenElement === frame) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    const canvas3d = canvas3dRef.current;
    const fallbackCanvas = fallbackCanvasRef.current;
    const scene = sceneRef.current;
    if (!canvas3d || !fallbackCanvas || !scene) {
      setGraphics("unavailable");
      return;
    }

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let active = true;
    let renderer: Runner3D | undefined;
    let fallbackContext: CanvasRenderingContext2D | null = null;
    let fallbackArt: RunnerArt | undefined;
    let scale = 1;
    let visibleWidth = runnerWidth;

    function render() {
      if (!active) return;
      const current = stateRef.current;
      const world = modeRef.current === "ready" ? previewRunner(current, visibleWidth) : current;

      if (renderer) {
        renderer.draw(world, visibleWidth, motion.matches);
      } else if (fallbackContext && fallbackArt) {
        fallbackContext.setTransform(scale, 0, 0, scale, 0, 0);
        drawRunner(fallbackContext, world, visibleWidth, fallbackArt, motion.matches);
      }
    }

    function resize() {
      if (!scene || !fallbackCanvas) return;
      const { clientWidth, clientHeight } = scene;
      if (!clientWidth || !clientHeight) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.65);
      visibleWidth = clientWidth * runnerHeight / clientHeight;
      visibleWidthRef.current = visibleWidth;

      if (renderer) {
        renderer.resize(clientWidth, clientHeight, dpr);
      } else if (fallbackContext) {
        fallbackCanvas.width = Math.round(clientWidth * dpr);
        fallbackCanvas.height = Math.round(clientHeight * dpr);
        scale = fallbackCanvas.height / runnerHeight;
      }
      render();
    }

    function switchToFallback() {
      if (!active || !fallbackCanvas) return;

      const previousRenderer = renderer;
      renderer = undefined;
      previousRenderer?.dispose();
      fallbackContext = fallbackCanvas.getContext("2d", { alpha: false });
      if (!fallbackContext) {
        setGraphics("unavailable");
        return;
      }

      fallbackArt ??= loadRunnerArt(render);
      setGraphics("compatibility");
      resize();
    }

    function handleContextLoss(event: Event) {
      event.preventDefault();
      switchToFallback();
    }

    renderRef.current = render;
    const observer = new ResizeObserver(resize);
    observer.observe(scene);
    motion.addEventListener("change", render);
    canvas3d.addEventListener("webglcontextlost", handleContextLoss);
    resize();

    void import("@/lib/street-runner-3d").then(({ createRunner3D }) => {
      if (!active) return;
      renderer = createRunner3D(canvas3d);
      resize();
      setGraphics("3d");
    }).catch(switchToFallback);

    return () => {
      active = false;
      observer.disconnect();
      motion.removeEventListener("change", render);
      canvas3d.removeEventListener("webglcontextlost", handleContextLoss);
      renderRef.current = null;
      renderer?.dispose();
    };
  }, []);

  useEffect(() => {
    if (mode !== "running") {
      renderRef.current?.();
      return;
    }

    let frame = 0;
    let previous: number | undefined;
    let lastUpdate = 0;
    let lastHud = snapshot(stateRef.current);

    function animate(now: number) {
      if (modeRef.current !== "running") return;
      const runner = stateRef.current;
      if (previous !== undefined) tickRunner(runner, (now - previous) / 1000, visibleWidthRef.current);
      previous = now;
      renderRef.current?.();

      if (now - lastUpdate >= 90 || lastHud.stage !== runner.stage ||
        lastHud.lives !== runner.lives || lastHud.combo !== runner.combo ||
        lastHud.missions[runner.stage] !== runner.missions[runner.stage] ||
        lastHud.collected.length !== runner.collected.length) {
        lastUpdate = now;
        lastHud = snapshot(runner);
        setHud(lastHud);
      }

      if (runner.phase !== "running") {
        const result = runner.phase === "finished" ? "won" : "lost";
        modeRef.current = result;
        setMode(result);
        setHud(snapshot(runner));
        if (runner.score > bestRef.current) {
          bestRef.current = runner.score;
          setBest(runner.score);
          try {
            localStorage.setItem(bestScoreKey, String(runner.score));
          } catch {
            // Keep this session's score even when storage is disabled.
          }
        }
        return;
      }

      frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [mode]);

  function start() {
    if (graphics === "loading" || graphics === "unavailable") return;
    const previousMode = modeRef.current;
    if (previousMode !== "paused") {
      stateRef.current = createRunner(previousMode === "ready" ? firstCourse : undefined);
      setHud(snapshot(stateRef.current));
    }
    modeRef.current = "running";
    setMode("running");
    renderRef.current?.();
    sceneRef.current?.focus({ preventScroll: true });
    if (previousMode !== "paused" && frameRef.current) {
      void requestMobileLandscape(frameRef.current);
    }
  }

  function pause() {
    if (modeRef.current !== "running") return;
    modeRef.current = "paused";
    setMode("paused");
    setHud(snapshot(stateRef.current));
  }

  function jump() {
    if (modeRef.current === "running") jumpRunner(stateRef.current);
  }

  function shiftLane(direction: -1 | 1) {
    if (modeRef.current === "running" && moveRunnerLane(stateRef.current, direction)) {
      setHud(snapshot(stateRef.current));
    }
  }

  function handleKeys(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && modeRef.current === "running") {
      event.preventDefault();
      pause();
      return;
    }

    if (event.key !== " " && event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    if (event.target !== sceneRef.current) return;

    event.preventDefault();
    if (event.repeat || graphics === "loading" || graphics === "unavailable") return;
    if (modeRef.current !== "running") {
      if (event.key === " ") start();
    } else if (event.key === " ") jump();
    else shiftLane(event.key === "ArrowUp" ? -1 : 1);
  }

  const pillar = policyPillars[hud.stage];
  const stage = stages[hud.stage];
  const featuredPolicy = pillar.policies[stage.policy];
  const missionProgress = hud.missions[hud.stage];
  const missionComplete = missionProgress >= missionTarget;
  const missionsComplete = hud.missions.filter((count) => count >= missionTarget).length;
  const stopped = mode === "lost" || mode === "won";
  const stateTitle = mode === "ready" ? "準備好了嗎？" : mode === "paused" ? "休息一下" : mode === "won" ? "跑完竹北六個街區！" : "這趟先到這裡";
  const buttonLabel = mode === "ready" ? "開始跑酷" : mode === "paused" ? "繼續跑酷" : "再跑一次";
  const canPause = mode === "running" || mode === "paused";
  const canStart = graphics === "3d" || graphics === "compatibility";

  return (
    <div ref={frameRef} className={styles.frame}>
      <section className={styles.game} aria-label="6F 街區跑酷遊戲" data-runner-board="" onKeyDown={handleKeys}>
        <div className={styles.mobileBar}>
          <Link href="/" aria-label="離開遊戲，回網站"><span aria-hidden="true">‹</span> 回網站</Link>
          <strong>{mode === "ready" ? "竹北 6F 街區跑酷" : `${pillar.chinese}・${stage.scene}`}</strong>
          <button type="button" onClick={mode === "paused" ? start : pause} disabled={!canPause}>{mode === "paused" ? "繼續" : "暫停"}</button>
        </div>
        <div className={styles.cabinet}>
          <div className={styles.hud}>
            <span className={styles.hearts}>
              <span className="sr-only">愛心 {hud.lives}／3</span>
              <span aria-hidden="true">
                {Array.from({ length: 3 }, (_, index) => (
                  <span key={index} className={index < hud.lives ? styles.heartFull : styles.heartEmpty}>♥</span>
                ))}
              </span>
            </span>
            <span className={styles.hudCenter}>
              <span className={styles.tokens} aria-label={`已收集 ${hud.collected.length} 枚政見標記，共 ${stageCount} 枚`}>
                <span className={styles.tokenIcon} aria-hidden="true">F</span><strong>{hud.collected.length} / {stageCount}</strong>
              </span>
              {hud.combo > 1 && <strong className={styles.combo}>連收 {hud.combo}</strong>}
            </span>
            <span className={styles.score}><span>分數</span><strong>{String(hud.score).padStart(4, "0")}</strong></span>
          </div>
          <progress className={styles.progress} max={1} value={hud.progress} aria-label={`${pillar.chinese}街區進度`} />
          <div
            ref={sceneRef}
            className={styles.scene}
            data-mode={mode}
            data-graphics={graphics}
            tabIndex={0}
            aria-label="街區跑道"
            aria-describedby="runner-controls"
            onPointerDown={(event) => {
              if (modeRef.current !== "running" || event.button !== 0) return;
              if (event.pointerType === "mouse") sceneRef.current?.focus({ preventScroll: true });
              jump();
            }}
          >
            <canvas ref={canvas3dRef} hidden={graphics !== "3d"} aria-hidden="true" />
            <canvas ref={fallbackCanvasRef} hidden={graphics !== "compatibility"} aria-hidden="true" />
            {graphics === "compatibility" && <span className={styles.graphicsNotice}>2D 相容模式</span>}
            <aside className={styles.missionBrief} aria-label="目前街區任務" data-complete={missionComplete || undefined}>
              <div className={styles.missionHeading}>
                <span className={styles.missionStage}>{pillar.english}</span>
                <strong>{stage.mission}</strong>
                <span className={styles.missionCount} role="status" aria-label={`${stage.mission}任務進度 ${missionProgress}／${missionTarget}`}>
                  {missionComplete ? "完成" : `${missionProgress} / ${missionTarget}`}
                </span>
              </div>
              <p>{missionComplete ? stage.takeaway : stage.instruction}</p>
            </aside>
            {mode !== "running" && (
              <div className={styles.overlay}>
                <div className={styles.panel}>
                  <h2>{graphics === "loading" ? "正在建立 3D 街區…" : graphics === "unavailable" ? "這個瀏覽器無法開啟遊戲" : stateTitle}</h2>
                  {mode === "ready" && canStart && (
                    <p>
                      <span className={styles.turnHint}>請橫握手機。</span>
                      <span className={styles.desktopHint}>跟著街區任務換道、跳躍，收集六個 F。</span>
                      <span className={styles.touchHint}>用搖桿換道，按右側的跳躍鍵起跳。</span>
                    </p>
                  )}
                  {stopped && (
                    <p>
                      本次 {hud.score} 分 · {hud.collected.length} / {stageCount} 個 F · 任務 {missionsComplete} / {stageCount}
                      <span className={styles.resultDetails}>補給 {hud.bonuses} · 最長連收 {hud.bestCombo}</span>
                    </p>
                  )}
                  <button className={styles.primary} type="button" onClick={start} disabled={!canStart}>{buttonLabel}</button>
                  {mode !== "ready" && <Link className={styles.mobilePolicy} href={`/#${pillar.id}`}>閱讀{pillar.chinese}政見 ↗</Link>}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.controls}>
          <p id="runner-controls"><span><kbd>↑</kbd> <kbd>↓</kbd> 換道</span><span><kbd>空白鍵</kbd> 跳躍</span></p>
          <div className={styles.laneControls} role="group" aria-label="換道">
            <button type="button" className={styles.laneButton} aria-label="往上換道" disabled={mode !== "running"} onClick={() => shiftLane(-1)}>
              <span aria-hidden="true">↑</span> 上移
            </button>
            <span className={styles.laneNumber} aria-label={`目前車道 ${hud.lane + 1}／3`}>{hud.lane + 1} / 3</span>
            <button type="button" className={styles.laneButton} aria-label="往下換道" disabled={mode !== "running"} onClick={() => shiftLane(1)}>
              <span aria-hidden="true">↓</span> 下移
            </button>
          </div>
          <div className={styles.touchLaneControls}>
            <RunnerJoystick disabled={mode !== "running"} onStep={shiftLane} />
            <span className={styles.laneNumber} aria-label={`目前車道 ${hud.lane + 1}／3`}>{hud.lane + 1} / 3</span>
          </div>
          <div className={styles.actions}>
            {best > 0 && <span className={styles.best}>最高 {best}</span>}
            <button type="button" className={styles.pause} onClick={mode === "paused" ? start : pause} disabled={!canPause}>
              {mode === "paused" ? "繼續" : "暫停"}
            </button>
            <button type="button" className={styles.jump} disabled={mode !== "running"} onClick={jump}>跳躍 <span aria-hidden="true">↑</span></button>
          </div>
        </div>

        <div className={styles.policies}>
          <nav aria-label="六個街區的政見">
            <ol className={styles.stageList}>
              {policyPillars.map((entry, index) => (
                <li key={entry.id}>
                  <Link
                    href={`/#${entry.id}`}
                    aria-current={hud.stage === index ? "step" : undefined}
                    data-mission-done={hud.missions[index] >= missionTarget || undefined}
                    aria-label={`${entry.english} ${entry.chinese}${hud.collected.includes(index) ? "，已收集" : ""}${hud.missions[index] >= missionTarget ? "，任務完成" : ""}，閱讀完整政見`}
                    className={hud.collected.includes(index) ? styles.collected : undefined}
                  >
                    {entry.chinese}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          <div className={styles.policyCopy} aria-live="polite">
            <h2><span>區段政見</span> {stage.scene}</h2>
            <Link href={`/#${pillar.id}`}>{featuredPolicy.action}{featuredPolicy.text} <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <p className="sr-only" role="status">
          {mode === "paused" ? "遊戲已暫停" : stopped ? `${stateTitle}，${hud.score} 分，收集 ${hud.collected.length} 枚標記，完成 ${missionsComplete} 段任務` :
            hud.collected.length > 0 ? `已收集 ${policyPillars[hud.collected[hud.collected.length - 1]].chinese}標記` : ""}
        </p>
      </section>
    </div>
  );
}
