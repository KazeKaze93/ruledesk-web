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

export function ensureThumbAnchor(thumb: HTMLElement): void {
  thumb.classList.add(THUMB_CLASS);
}
