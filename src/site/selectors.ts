import { CSS_CLASS } from "../config/constants";

export const SITE_SELECTORS = {
  thumb: "span.thumb",
  thumbLink: 'a[href*="s=view"]',
  previewImage: "img.preview",
  thumbWrap: `span.${CSS_CLASS.thumbWrap}`,
  cardFavButton: `button.${CSS_CLASS.cardFav}`,
  nativeAddFavLink: 'a[onclick*="addFav("]',
  favoritesDeleteLink: "a[onclick]",
} as const;

export const THUMB_ID_PATTERN = /^s(\d+)$/;
export const FAVORITES_DELETE_ID_PATTERN = /s=delete&id=(\d+)/;
export function extractPostIdFromThumb(thumb: Element): string | null {
  const match = THUMB_ID_PATTERN.exec(thumb.id);
  if (match === null) {
    return null;
  }
  const postId = match[1];
  return postId === undefined ? null : postId;
}

export function extractPostIdFromFavoritesDeleteOnclick(
  onclick: string,
): string | null {
  const match = FAVORITES_DELETE_ID_PATTERN.exec(onclick);
  if (match === null) {
    return null;
  }
  const postId = match[1];
  return postId === undefined ? null : postId;
}
