"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Active-time timer, PRD 6.2/13.4: counts only foreground time (pauses while
 * the tab/app is backgrounded) and tracks how many times it paused.
 */
export function useActiveTimer() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const accumulatedRef = useRef(0);
  const runningSinceRef = useRef<number | null>(performance.now());
  const pauseCountRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (runningSinceRef.current !== null && !doneRef.current) {
        setElapsedMs(accumulatedRef.current + (performance.now() - runningSinceRef.current));
      }
    }, 250);

    function handleVisibility() {
      if (doneRef.current) return;
      if (document.hidden) {
        if (runningSinceRef.current !== null) {
          accumulatedRef.current += performance.now() - runningSinceRef.current;
          runningSinceRef.current = null;
          pauseCountRef.current += 1;
        }
      } else if (runningSinceRef.current === null) {
        runningSinceRef.current = performance.now();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  function finish(): { activeTimeMs: number; pauseCount: number } {
    doneRef.current = true;
    if (runningSinceRef.current !== null) {
      accumulatedRef.current += performance.now() - runningSinceRef.current;
      runningSinceRef.current = null;
    }
    return { activeTimeMs: Math.round(accumulatedRef.current), pauseCount: pauseCountRef.current };
  }

  return { elapsedMs, finish };
}
