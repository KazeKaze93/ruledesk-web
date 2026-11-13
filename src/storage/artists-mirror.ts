import { log } from "../log";

/** localStorage key for the followed-artists tag list mirror (not a cookie). */
export const ARTISTS_MIRROR_KEY = "ruledesk-web.artists-mirror";

/**
 * Writes the followed artist tags to localStorage.
 * Store calls this on every artists-list save (authoritative), and seeds once
 * on load only when the mirror is missing/unparseable — never replace-from-GM
 * over an existing fresher mirror (bfcache).
 * Swallows localStorage errors and logs them.
 */
export function writeArtistsMirror(tags: readonly string[]): void {
  try {
    localStorage.setItem(ARTISTS_MIRROR_KEY, JSON.stringify([...tags]));
  } catch (error) {
    log.error("artists-mirror: write failed", error);
  }
}

/**
 * Reads the mirrored artist tags.
 * @returns tag list, or null if missing / unparseable
 */
export function readArtistsMirror(): readonly string[] | null {
  try {
    const raw = localStorage.getItem(ARTISTS_MIRROR_KEY);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    for (const item of parsed) {
      if (typeof item !== "string") {
        return null;
      }
    }
    return parsed;
  } catch (error) {
    log.error("artists-mirror: read failed", error);
    return null;
  }
}

/** Removes the mirror key (tests / reset). Swallows localStorage errors. */
export function clearArtistsMirror(): void {
  try {
    localStorage.removeItem(ARTISTS_MIRROR_KEY);
  } catch (error) {
    log.error("artists-mirror: clear failed", error);
  }
}
