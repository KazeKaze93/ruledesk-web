import { THUMB_ANCHOR_NAME, THUMB_CLASS } from "../features/types";

export const BASE_GRID_CSS = `
.${THUMB_CLASS} {
  position: relative;
  anchor-scope: ${THUMB_ANCHOR_NAME};
}

.${THUMB_CLASS} img.preview {
  anchor-name: ${THUMB_ANCHOR_NAME};
}
`;

/** Grid thumbnail CDN host (rule34.xxx). */
export const THUMB_IMAGE_HOST = "wimg.rule34.xxx";

/**
 * Video CDN origin. Path after origin starts with `//images/` (verified double
 * slash on ws-cdn-video.rule34.xxx).
 */
export const VIDEO_CDN_ORIGIN = "https://ws-cdn-video.rule34.xxx";

const THUMB_PATH_PATTERN =
  /^\/thumbnails\/([^/]+)\/thumbnail_([^/]+)\.jpg$/i;

export function ensureThumbAnchor(thumb: HTMLElement): void {
  thumb.classList.add(THUMB_CLASS);
}

/**
 * Build the CDN mp4 URL from a grid webm thumb `img.preview` src.
 * Thumb: `https://wimg.rule34.xxx/thumbnails/<dir>/thumbnail_<hash>.jpg?<id>`
 * Video: `https://ws-cdn-video.rule34.xxx//images/<dir>/<hash>.mp4?<id>`
 * Unparseable input → null (no guessing).
 */
export function buildVideoUrlFromThumbUrl(thumbUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(thumbUrl);
  } catch {
    return null;
  }
  if (parsed.hostname !== THUMB_IMAGE_HOST) {
    return null;
  }
  const match = THUMB_PATH_PATTERN.exec(parsed.pathname);
  if (match === null) {
    return null;
  }
  const dir = match[1];
  const hash = match[2];
  if (dir === undefined || hash === undefined || dir.length === 0 || hash.length === 0) {
    return null;
  }
  return `${VIDEO_CDN_ORIGIN}//images/${dir}/${hash}.mp4${parsed.search}`;
}
