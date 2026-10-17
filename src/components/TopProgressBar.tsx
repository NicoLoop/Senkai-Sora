"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Global triggers callable from anywhere in the app
export function startTopPreloader() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("senkai:start-preloader"));
  }
}

export function finishTopPreloader() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("senkai:finish-preloader"));
  }
}

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = () => {
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setIsVisible(true);
    setProgress(20);

    // Incrementally crawl up while waiting
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 85;
        }
        const step = Math.max(1, (90 - prev) * 0.15);
        return Math.min(85, prev + step);
      });
    }, 120);
  };

  const completeLoading = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);

    finishTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setProgress(0);
      }, 200);
    }, 300);
  };

  // Listen for route changes
  useEffect(() => {
    completeLoading();
  }, [pathname, searchParams]);

  // Intercept link clicks and global custom events
  useEffect(() => {
    const handleStart = () => startLoading();
    const handleFinish = () => completeLoading();

    window.addEventListener("senkai:start-preloader", handleStart);
    window.addEventListener("senkai:finish-preloader", handleFinish);

    // Global click listener to immediately catch internal link navigations
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (
        href &&
        !href.startsWith("#") &&
        !href.startsWith("http://") &&
        !href.startsWith("https://") &&
        !href.startsWith("mailto:") &&
        target.target !== "_blank"
      ) {
        startLoading();
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });

    return () => {
      window.removeEventListener("senkai:start-preloader", handleStart);
      window.removeEventListener("senkai:finish-preloader", handleFinish);
      document.removeEventListener("click", handleAnchorClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none transition-opacity duration-200"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {/* 2px Purple Progress Line */}
      <div
        className="h-[2px] bg-gradient-to-r from-purple-600 via-purple-400 to-fuchsia-400 shadow-[0_0_10px_rgba(168,85,247,0.9),0_0_4px_rgba(217,70,239,0.8)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "180ms" : "280ms",
        }}
      >
        {/* Glow point at the front edge */}
        <div className="absolute right-0 top-0 h-[2px] w-12 bg-white/80 shadow-[0_0_8px_#fff] blur-[0.5px]" />
      </div>
    </div>
  );
}
