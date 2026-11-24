"use client";

import type { ComponentPropsWithoutRef } from "react";

import { shareCardDialogId, shareCardHash, shareCardOpenEvent } from "@/lib/share-card";

type ShareCardLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href">;

export function ShareCardLink({ onClick, ...props }: ShareCardLinkProps) {
  return (
    <a
      {...props}
      href={shareCardHash}
      aria-haspopup="dialog"
      aria-controls={shareCardDialogId}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
          event.shiftKey || event.altKey || props.target === "_blank") return;

        const request = new CustomEvent(shareCardOpenEvent, {
          cancelable: true,
          detail: event.currentTarget,
        });
        if (!window.dispatchEvent(request)) event.preventDefault();
      }}
    />
  );
}
