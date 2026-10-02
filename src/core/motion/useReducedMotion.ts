import { useState, useEffect } from 'react';

/**
 * useReducedMotion: Reactively returns whether reduced motion is active.
 * Checks both system media query and Toiloki's data-motion setting.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    const mode = document.documentElement.getAttribute('data-motion');
    if (mode === 'on') return true;
    if (mode === 'off') return false;
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const check = () => {
      const mode = document.documentElement.getAttribute('data-motion');
      if (mode === 'on') {
        setReduced(true);
      } else if (mode === 'off') {
        setReduced(false);
      } else {
        setReduced(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
      }
    };

    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    mediaQuery?.addEventListener?.('change', check);

    // MutationObserver to track data-motion attribute changes on root
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-motion') {
          check();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });

    return () => {
      mediaQuery?.removeEventListener?.('change', check);
      observer.disconnect();
    };
  }, []);

  return reduced;
}
