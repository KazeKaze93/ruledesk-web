import { maybeResumeFavoritesSync } from "../site/favorites-sync-runner";

/**
 * Run `callback` once the document is interactive enough for body mounts.
 * At document-start, waits for DOMContentLoaded; if already past that, runs now.
 *
 * After the primary callback, {@link onDomReadySideEffects} runs once so Package H
 * can resume favorites sync without racing panel/page mount order.
 */
export function whenDomReady(callback: () => void): void {
  const run = (): void => {
    callback();
    onDomReadySideEffects();
  };
  if (
    document.readyState === "interactive" ||
    document.readyState === "complete"
  ) {
    run();
    return;
  }
  document.addEventListener("DOMContentLoaded", run, { once: true });
}

/**
 * Side effects after the main app callback on DOM ready.
 * Resumes abandoned favorites sync when the lock is stale.
 */
export function onDomReadySideEffects(): void {
  maybeResumeFavoritesSync();
}
