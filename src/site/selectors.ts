import { CSS_CLASS } from "../config/constants";

export const SITE_SELECTORS = {
  thumb: "span.thumb",
  thumbLink: 'a[href*="s=view"]',
  previewImage: "img.preview",
  cardFavButton: `button.${CSS_CLASS.cardFav}`,
  favoritesDeleteLink: "a[onclick]",
  tagSidebar: "ul#tag-sidebar",
  tagTypeArtist: "li.tag-type-artist",
  imageList: "div.image-list",
  postListContent: "#post-list div.content",
  contentRoot: "#content",
  artistFollowButton: `button.${CSS_CLASS.artistFollow}`,
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
