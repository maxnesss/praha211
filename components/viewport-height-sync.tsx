"use client";

import { useEffect } from "react";

function readViewportHeight() {
  return Math.round(window.visualViewport?.height ?? window.innerHeight);
}

export function ViewportHeightSync() {
  useEffect(() => {
    const root = document.documentElement;
    let frameId = 0;

    const updateHeight = () => {
      root.style.setProperty("--app-min-height", `${readViewportHeight()}px`);
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateHeight);
    };

    scheduleUpdate();
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);
    window.visualViewport?.addEventListener("resize", scheduleUpdate);
    window.visualViewport?.addEventListener("scroll", scheduleUpdate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      window.visualViewport?.removeEventListener("resize", scheduleUpdate);
      window.visualViewport?.removeEventListener("scroll", scheduleUpdate);
    };
  }, []);

  return null;
}
