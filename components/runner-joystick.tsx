"use client";

import { useCallback, useEffect, useRef, type PointerEvent } from "react";

import styles from "./runner-joystick.module.css";

type Direction = -1 | 1;
type Input = {
  pointer: number;
  x: number;
  y: number;
  thumbTravel: number;
  localY: (dx: number, dy: number) => number;
  direction: Direction | 0;
  tap: Direction | 0;
};

const engageDistance = 8;
const releaseDistance = 4;
const tapSlop = 6;
const holdDelay = 280;

function localYAxis(element: HTMLDivElement) {
  const board = element.closest("[data-runner-board]");
  const transform = board ? getComputedStyle(board).transform : "none";
  if (transform === "none" || typeof DOMMatrixReadOnly === "undefined") return (_dx: number, dy: number) => dy;

  const { c, d } = new DOMMatrixReadOnly(transform);
  const distance = c * c + d * d;
  if (!distance) return (_dx: number, dy: number) => dy;

  return (dx: number, dy: number) => (c * dx + d * dy) / distance;
}

function moveDirection(y: number, cross: number, previous: Direction | 0): Direction | 0 {
  const distance = Math.abs(y);
  const sign = y < 0 ? -1 : 1;
  if (distance <= releaseDistance || distance < cross * 0.32) return 0;
  if (previous === sign) return previous;
  return distance >= engageDistance && distance >= cross * 0.55 ? sign : 0;
}

export function RunnerJoystick({ disabled, onStep }: { disabled: boolean; onStep: (direction: Direction) => void }) {
  const padRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<Input | null>(null);
  const timerRef = useRef<number | null>(null);
  const stepRef = useRef(onStep);

  const cancelHold = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    const input = inputRef.current;
    inputRef.current = null;
    cancelHold();
    if (!input) return;

    const pad = padRef.current;
    if (!pad) return;
    delete pad.dataset.dragging;
    delete pad.dataset.direction;
    pad.style.removeProperty("--runner-stick-y");
    if (pad.hasPointerCapture(input.pointer)) pad.releasePointerCapture(input.pointer);
  }, [cancelHold]);

  useEffect(() => {
    stepRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    if (disabled) reset();
  }, [disabled, reset]);

  useEffect(() => {
    const hide = () => {
      if (document.hidden) reset();
    };
    window.addEventListener("resize", reset);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("resize", reset);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", hide);
      reset();
    };
  }, [reset]);

  function start(event: PointerEvent<HTMLDivElement>) {
    if (disabled || inputRef.current || event.button !== 0) return;

    const pad = event.currentTarget;
    const bounds = pad.getBoundingClientRect();
    const tapZone = pad.clientHeight * 0.17;
    const localY = localYAxis(pad);
    const y = localY(event.clientX - bounds.left - bounds.width / 2, event.clientY - bounds.top - bounds.height / 2);
    const tap = y < -tapZone ? -1 : y > tapZone ? 1 : 0;

    event.preventDefault();
    try {
      pad.setPointerCapture(event.pointerId);
    } catch {
      // A pointer whose capture was refused can still be used inside the pad.
    }
    inputRef.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      thumbTravel: Math.min(16, pad.clientHeight * 0.23),
      localY,
      direction: 0,
      tap,
    };
    pad.dataset.dragging = "true";
    if (tap) pad.dataset.direction = tap < 0 ? "up" : "down";
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const input = inputRef.current;
    if (disabled || !input || input.pointer !== event.pointerId) return;

    const dx = event.clientX - input.x;
    const dy = event.clientY - input.y;
    const y = input.localY(dx, dy);
    const travel = Math.hypot(dx, dy);
    const cross = Math.sqrt(Math.max(0, travel * travel - y * y));
    if (travel > tapSlop) input.tap = 0;
    const direction = moveDirection(y, cross, input.direction);
    const pad = event.currentTarget;
    const offset = Math.round(Math.max(-input.thumbTravel, Math.min(input.thumbTravel, y)));
    pad.style.setProperty("--runner-stick-y", `${offset}px`);
    const highlight = direction || input.tap;
    if (highlight) pad.dataset.direction = highlight < 0 ? "up" : "down";
    else delete pad.dataset.direction;

    if (direction === input.direction) return;
    input.direction = direction;
    cancelHold();
    if (!direction) return;

    stepRef.current(direction);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      if (inputRef.current === input && input.direction === direction) stepRef.current(direction);
    }, holdDelay);
  }

  function finish(event: PointerEvent<HTMLDivElement>) {
    const input = inputRef.current;
    if (!input || input.pointer !== event.pointerId) return;

    const travel = Math.hypot(event.clientX - input.x, event.clientY - input.y);
    if (!disabled && event.type === "pointerup" && input.tap && travel <= tapSlop) stepRef.current(input.tap);
    reset();
  }

  return (
    <div
      ref={padRef}
      className={styles.pad}
      role="group"
      aria-label="換道搖桿"
      data-disabled={disabled || undefined}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
      onPointerLeave={(event) => {
        if (event.pointerId === inputRef.current?.pointer && !event.currentTarget.hasPointerCapture(event.pointerId)) reset();
      }}
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
