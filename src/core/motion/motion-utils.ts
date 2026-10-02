/**
 * motion-utils.ts: Shared helper utilities for FLIP transitions, staggered animations,
 * and SVG self-drawing animations in Toiloki.
 */

export interface RectMap {
  [key: string]: DOMRect;
}

/**
 * Snapshot bounding rectangles of elements by data-flip-id
 */
export function snapshotFlipRects(container: HTMLElement): RectMap {
  const map: RectMap = {};
  const elements = container.querySelectorAll<HTMLElement>('[data-flip-id]');
  elements.forEach((el) => {
    const id = el.getAttribute('data-flip-id');
    if (id) {
      map[id] = el.getBoundingClientRect();
    }
  });
  return map;
}

/**
 * Perform FLIP animation (First, Last, Invert, Play) on container elements
 */
export function playFlipAnimation(container: HTMLElement, previousRects: RectMap, durationMs = 160) {
  if (typeof document === 'undefined') return;
  const isReduced =
    document.documentElement.getAttribute('data-motion') === 'on' ||
    (document.documentElement.getAttribute('data-motion') !== 'off' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  if (isReduced) return;

  const elements = container.querySelectorAll<HTMLElement>('[data-flip-id]');
  elements.forEach((el) => {
    const id = el.getAttribute('data-flip-id');
    if (!id || !previousRects[id]) return;

    const first = previousRects[id];
    const last = el.getBoundingClientRect();

    const deltaX = first.left - last.left;
    const deltaY = first.top - last.top;

    if (deltaX !== 0 || deltaY !== 0) {
      el.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: 'translate(0, 0)' },
        ],
        {
          duration: durationMs,
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        }
      );
    }
  });
}
