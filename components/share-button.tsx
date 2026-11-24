"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      data-icon="inline-end"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 10.5 6.8-4" />
      <path d="m8.6 13.5 6.8 4" />
    </svg>
  );
}

export function ShareButton() {
  const [label, setLabel] = useState("分享 6F 政見");

  async function handleShare() {
    const shareData = {
      title: "劉文軒｜6F 行動政見",
      text: "FAST、FAMILY、FAIR、FUTURE、FRESH、FIX——六個 F，讓改變真正發生。",
      url: new URL("#policies", window.location.href).href,
    };

    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if ((error as DOMException).name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareData.url);
      setLabel("已複製網址");
    } catch {
      setLabel("請從瀏覽器分享");
    }
    window.setTimeout(() => setLabel("分享 6F 政見"), 2200);
  }

  return (
    <>
      <Button type="button" className="editorial-share-button" onClick={handleShare}>
        <ShareIcon />
        {label}
      </Button>
      <span className="sr-only" aria-live="polite">
        {label}
      </span>
    </>
  );
}
