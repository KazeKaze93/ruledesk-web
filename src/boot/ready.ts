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
