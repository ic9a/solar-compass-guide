import { useLayoutEffect, type RefObject } from "react";

export function useStepFocus(step: number, containerRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const frame = window.requestAnimationFrame(() => {
      const heading = container.querySelector<HTMLElement>("[data-step-heading]");
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      container.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
      heading?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [step, containerRef]);
}
