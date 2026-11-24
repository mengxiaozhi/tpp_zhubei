"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

import styles from "./runner-joystick.module.css";

type Direction = -1 | 1;
type Input = {
  pointer: number;
  x: number;
  y: number;
  localY: (dx: number, dy: number) => number;
  direction: Direction | 0;
  tap: Direction | 0;
  dragged: boolean;
};

const deadzone = 10;
const thumbTravel = 18;
const repeatDelay = 185;

function localYAxis(element: HTMLDivElement) {
  const board = element.closest("[data-runner-board]");
  const transform = board ? getComputedStyle(board).transform : "none";
  if (transform === "none") return (_dx: number, dy: number) => dy;

  const { c, d } = new DOMMatrixReadOnly(transform);
  const distance = c * c + d * d;
  if (!distance) return (_dx: number, dy: number) => dy;

  return (dx: number, dy: number) => (c * dx + d * dy) / distance;
}

export function RunnerJoystick({ disabled, onStep }: { disabled: boolean; onStep: (direction: Direction) => void }) {
  const padRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<Input | null>(null);
  const timerRef = useRef<number | null>(null);
  const stepRef = useRef(onStep);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const stopRepeat = useCallback(() => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    const input = inputRef.current;
    inputRef.current = null;
    stopRepeat();
    if (!input) return;

    const pad = padRef.current;
    if (pad?.hasPointerCapture(input.pointer)) pad.releasePointerCapture(input.pointer);
    setOffset(0);
    setDragging(false);
  }, [stopRepeat]);

  useEffect(() => {
    stepRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    if (disabled) reset();
  }, [disabled, reset]);

  useEffect(() => {
    window.addEventListener("resize", reset);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("resize", reset);
      window.removeEventListener("blur", reset);
      stopRepeat();
    };
  }, [reset, stopRepeat]);

  function start(event: PointerEvent<HTMLDivElement>) {
    if (disabled || inputRef.current || event.button !== 0) return;

    const pad = event.currentTarget;
    const bounds = pad.getBoundingClientRect();
    const localY = localYAxis(pad);
    const tap = localY(event.clientX - bounds.left - bounds.width / 2, event.clientY - bounds.top - bounds.height / 2);

    event.preventDefault();
    pad.setPointerCapture(event.pointerId);
    inputRef.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      localY,
      direction: 0,
      tap: tap < -deadzone ? -1 : tap > deadzone ? 1 : 0,
      dragged: false,
    };
    setDragging(true);
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const input = inputRef.current;
    if (disabled || !input || input.pointer !== event.pointerId) return;

    const dy = input.localY(event.clientX - input.x, event.clientY - input.y);
    const direction = dy < -deadzone ? -1 : dy > deadzone ? 1 : 0;
    setOffset(Math.round(Math.max(-thumbTravel, Math.min(thumbTravel, dy))));

    if (direction === input.direction) return;
    input.direction = direction;
    stopRepeat();
    if (!direction) return;

    input.dragged = true;
    stepRef.current(direction);
    timerRef.current = window.setInterval(() => stepRef.current(direction), repeatDelay);
  }

  function finish(event: PointerEvent<HTMLDivElement>) {
    const input = inputRef.current;
    if (!input || input.pointer !== event.pointerId) return;

    if (!disabled && event.type === "pointerup" && !input.dragged && input.tap) stepRef.current(input.tap);
    reset();
  }

  return (
    <div
      ref={padRef}
      className={styles.pad}
      role="group"
      aria-label="換道搖桿"
      data-dragging={dragging || undefined}
      data-disabled={disabled || undefined}
      style={{ "--runner-stick-y": `${offset}px` } as CSSProperties}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
      onKeyDown={(event) => {
        const direction = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
        if (disabled || !direction) return;
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) onStep(direction);
      }}
    >
      <button
        type="button"
        className={styles.up}
        aria-label="搖桿向上換道"
        disabled={disabled}
        onClick={(event) => { if (event.detail === 0) onStep(-1); }}
      >
        <span aria-hidden="true" className={styles.chevron} />
      </button>
      <button
        type="button"
        className={styles.down}
        aria-label="搖桿向下換道"
        disabled={disabled}
        onClick={(event) => { if (event.detail === 0) onStep(1); }}
      >
        <span aria-hidden="true" className={styles.chevron} />
      </button>
      <span className={styles.thumb} aria-hidden="true" />
    </div>
  );
}
