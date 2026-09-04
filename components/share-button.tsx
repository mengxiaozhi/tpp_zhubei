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
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setLabel("已複製網址");
      window.setTimeout(() => setLabel("分享 6F 政見"), 2200);
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") {
        setLabel("請從瀏覽器分享");
        window.setTimeout(() => setLabel("分享 6F 政見"), 2200);
      }
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button type="button" variant="dark" onClick={handleShare}>
        {label}
        <ShareIcon />
      </Button>
      <span className="sr-only" aria-live="polite">
        {label}
      </span>
    </div>
  );
}
