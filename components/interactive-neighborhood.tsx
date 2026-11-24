"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import neighborhood from "@/public/images/liu-neighborhood-day.webp";

import type { mountNeighborhoodViewer } from "./neighborhood-viewer";
import styles from "./interactive-neighborhood.module.css";

type Status = "idle" | "loading" | "ready" | "unavailable";
type Viewer = ReturnType<typeof mountNeighborhoodViewer>;

const actions = [
  { label: "向左旋轉", command: "rotateLeft", path: "M19 12H5m6 6-6-6 6-6" },
  { label: "向右旋轉", command: "rotateRight", path: "M5 12h14m-6-6 6 6-6 6" },
  { label: "重設視角", command: "reset", path: "M4 10a8 8 0 1 1 2 8m-2-8V4m0 6h6" },
] as const;

export function InteractiveNeighborhood() {
  const [status, setStatus] = useState<Status>("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const titleId = useId();

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas?.parentElement;
    if (!canvas || !stage) return;

    let active = true;

    async function loadViewer(surface: HTMLCanvasElement) {
      if (!active) return;
      setStatus("loading");
      try {
        const { mountNeighborhoodViewer } = await import("./neighborhood-viewer");
        if (!active) return;
        viewerRef.current = mountNeighborhoodViewer(surface, () => {
          if (active) setStatus("unavailable");
        });
        setStatus("ready");
      } catch {
        if (active) setStatus("unavailable");
      }
    }

    const observer = typeof IntersectionObserver === "function"
      ? new IntersectionObserver((entries, watcher) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          watcher.disconnect();
          void loadViewer(canvas);
        }, { rootMargin: "160px 0px" })
      : null;

    if (observer) observer.observe(stage);
    else void loadViewer(canvas);

    return () => {
      active = false;
      observer?.disconnect();
      viewerRef.current?.dispose();
      viewerRef.current = null;
    };
  }, []);

  return (
    <figure className={styles.figure} aria-labelledby={titleId}>
      <div className={styles.stage} data-renderer={status}>
        <Image
          src={neighborhood}
          alt=""
          sizes="(max-width: 767px) 90vw, 42vw"
          className={styles.poster}
        />
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          role="img"
          aria-label="立體街景，包含街屋、公車、路樹和行人穿越道"
          aria-hidden={status !== "ready"}
        />
      </div>

      <figcaption className={styles.toolbar}>
        <div>
          <p id={titleId} className={styles.title}>互動 3D 街景</p>
          <p className={styles.hint} aria-live="polite">
            {status === "loading" && "載入街景中"}
            {status === "ready" && "拖曳或使用按鈕旋轉"}
            {status === "unavailable" && "此瀏覽器無法顯示 3D，目前顯示街景插圖。"}
          </p>
        </div>

        {status === "ready" && (
          <div className={styles.controls} role="group" aria-label="街景視角">
            {actions.map(({ label, command, path }) => (
              <button
                key={command}
                type="button"
                aria-label={label}
                title={label}
                onClick={() => viewerRef.current?.[command]()}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={path} />
                </svg>
              </button>
            ))}
          </div>
        )}
      </figcaption>
    </figure>
  );
}
