import { useState, useEffect, useRef } from 'react';

/**
 * useNumberTween: Tweens a numeric value smoothly over a duration using requestAnimationFrame.
 * Skips animation if prefers-reduced-motion is active.
 */
export function useNumberTween(targetValue: number, durationMs = 200): number {
  const [currentValue, setCurrentValue] = useState(targetValue);
  const startValueRef = useRef(targetValue);
  const startTimeRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for reduced motion
    const isReduced =
      typeof document !== 'undefined' &&
      (document.documentElement.getAttribute('data-motion') === 'on' ||
        (document.documentElement.getAttribute('data-motion') !== 'off' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));

    if (isReduced || durationMs <= 0) {
      setCurrentValue(targetValue);
      startValueRef.current = targetValue;
      return;
    }

    startValueRef.current = currentValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(1, elapsed / durationMs);

      // Ease-out cubic: 1 - pow(1 - progress, 3)
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextVal = Math.round(startValueRef.current + (targetValue - startValueRef.current) * eased);

      setCurrentValue(nextVal);

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
      }
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [targetValue, durationMs]);

  return currentValue;
}
