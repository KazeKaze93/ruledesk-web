export const SITE_SELECTORS = {
  thumb: "span.thumb",
  thumbLink: 'a[href*="s=view"]',
  previewImage: "img.preview",
  cardFavButton: "button.rdw-card-fav",
} as const;

export const THUMB_ID_PATTERN = /^s(\d+)$/;

export function extractPostIdFromThumb(thumb: Element): string | null {
  const match = THUMB_ID_PATTERN.exec(thumb.id);
  if (match === null) {
    return null;
  }
  const postId = match[1];
  return postId === undefined ? null : postId;
}
