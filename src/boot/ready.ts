/**
 * DOM-ready scheduling helpers. Favorites sync resume lives in deferred app start
 * so this module stays off the favs/storage import path.
 */

/**
 * Run `callback` once the document is interactive enough for body mounts.
 * At document-start, waits for DOMContentLoaded; if already past that, runs now.
 */
export function whenDomReady(callback: () => void): void {
  if (
    document.readyState === "interactive" ||
    document.readyState === "complete"
  ) {
    callback();
    return;
  }
  document.addEventListener("DOMContentLoaded", callback, { once: true });
}

/**
 * After first paint: rAF → zero-delay task → callback.
 * Use for feature mounts and heavy module work.
 */
export function scheduleAfterFirstPaint(callback: () => void): void {
  requestAnimationFrame(() => {
    setTimeout(callback, 0);
  });
}
