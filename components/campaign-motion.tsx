"use client";

import { useEffect } from "react";

const revealSelector = [
  "#about .editorial-profile__label",
  "#about-heading",
  "#about .editorial-profile__summary",
  "#about .editorial-profile__credentials",
  "#policies-heading",
  "#policies-heading + p",
  "#policies nav",
  "#policies article",
  "#action-heading",
  "#action-heading + p",
].join(", ");

export function CampaignMotion() {
  useEffect(() => {
    const main = document.getElementById("top");
    if (!main) return;

    let disposed = false;
    let revertMotion: (() => void) | undefined;

    async function setupMotion(root: HTMLElement) {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed) return;

      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia(root);
      revertMotion = () => media.revert();

      media.add("(prefers-reduced-motion: no-preference)", (context) => {
        // Start from visible HTML and leave in-view content alone if this chunk arrives late.
        const elements = Array.from(root.querySelectorAll<HTMLElement>(revealSelector))
          .filter((element) => element.getBoundingClientRect().top >= window.innerHeight);
        if (!elements.length) return;

        const active = new Set<gsap.core.Tween>();
        const reveal = context.add("reveal", (batch: Element[]) => {
          const destination = document.querySelector(":target");
          const focus = document.activeElement;
          const targets = batch.filter((element) =>
            !destination?.contains(element) && !element.contains(destination) && !element.contains(focus),
          );
          if (!targets.length) return;

          const tween = gsap.from(targets, {
            y: (_index: number, element: Element) => element.matches("nav") ? 0 : 14,
            opacity: 0.82,
            duration: 0.27,
            stagger: 0.045,
            ease: "power3.out",
            clearProps: "transform,opacity",
            onComplete: () => { active.delete(tween); },
          });
          active.add(tween);
        });

        ScrollTrigger.batch(elements, {
          start: "top bottom",
          once: true,
          interval: 0.04,
          batchMax: 3,
          onEnter: (batch) => reveal(batch),
        });

        function finishFocusedMotion(event: Event) {
          const destination = event.type === "hashchange"
            ? document.querySelector(":target")
            : document.activeElement;
          if (!destination) return;

          for (const tween of active) {
            if (tween.targets().some((element) =>
              element instanceof Element &&
              (element.contains(destination) || destination.contains(element)),
            )) {
              tween.progress(1);
            }
          }
        }

        root.addEventListener("focusin", finishFocusedMotion);
        window.addEventListener("hashchange", finishFocusedMotion);

        return () => {
          root.removeEventListener("focusin", finishFocusedMotion);
          window.removeEventListener("hashchange", finishFocusedMotion);
          active.clear();
        };
      });
    }

    void setupMotion(main).catch(() => revertMotion?.());

    return () => {
      disposed = true;
      revertMotion?.();
    };
  }, []);

  return null;
}
