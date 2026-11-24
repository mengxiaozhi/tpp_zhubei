"use client";

import { useEffect, useRef, useState } from "react";

import { shareCardDialogId, shareCardHash, shareCardOpenEvent } from "@/lib/share-card";

import { ShareCardMaker } from "./share-card-maker";
import styles from "./share-card.module.css";

const historyKey = "zhubeiShareCardEntry";

export function ShareCardDrawer() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const backdropPointer = useRef(false);
  const closingRef = useRef(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function syncLocation() {
      if (!dialog) return;

      closingRef.current = false;
      if (window.location.hash === shareCardHash) {
        if (dialog.open) return;
        dialog.showModal();
        setOpen(true);
        closeRef.current?.focus({ preventScroll: true });
      } else if (dialog.open) {
        dialog.close();
        setOpen(false);
        const opener = openerRef.current;
        const restore = opener?.getClientRects().length
          ? opener
          : document.querySelector<HTMLElement>("[aria-controls='mobile-navigation']");
        if (restore?.getClientRects().length) restore.focus({ preventScroll: true });
      }
    }

    function handleOpen(event: Event) {
      event.preventDefault();
      openerRef.current = (event as CustomEvent<HTMLElement>).detail;
      if (window.location.hash !== shareCardHash) {
        window.history.pushState({ ...window.history.state, [historyKey]: true }, "", shareCardHash);
      }
      syncLocation();
    }

    window.addEventListener(shareCardOpenEvent, handleOpen);
    window.addEventListener("popstate", syncLocation);
    window.addEventListener("hashchange", syncLocation);
    syncLocation();

    return () => {
      window.removeEventListener(shareCardOpenEvent, handleOpen);
      window.removeEventListener("popstate", syncLocation);
      window.removeEventListener("hashchange", syncLocation);
      if (dialog.open) dialog.close();
    };
  }, []);

  function closeDrawer() {
    if (closingRef.current) return;
    closingRef.current = true;

    if (window.history.state?.[historyKey]) {
      window.history.back();
    } else {
      const url = new URL(window.location.href);
      url.hash = "";
      window.history.replaceState(window.history.state, "", url);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  }

  return (
    <dialog
      ref={dialogRef}
      id={shareCardDialogId}
      aria-labelledby="zhubei-share-title"
      className={styles.drawer}
      onCancel={(event) => {
        event.preventDefault();
        closeDrawer();
      }}
      onPointerDown={(event) => {
        backdropPointer.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (backdropPointer.current && event.target === event.currentTarget) closeDrawer();
        backdropPointer.current = false;
      }}
    >
      <header className={styles.drawerHeader}>
        <h2 id="zhubei-share-title">竹北分享小卡</h2>
        <button
          ref={closeRef}
          type="button"
          className={styles.close}
          aria-label="關閉竹北分享小卡"
          onClick={closeDrawer}
        >
          <span>關閉</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </header>
      <div className={styles.drawerBody}>{open && <ShareCardMaker />}</div>
    </dialog>
  );
}
