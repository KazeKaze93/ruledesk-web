import {
  CSS_CLASS,
  POST_FAV_BUTTON_ID,
  UI_TEXT,
} from "../config/constants";
import { log } from "../log";
import { detectPageKind, readPostIdFromSearch } from "../site/pages";
import { SITE_SELECTORS } from "../site/selectors";
import { load } from "../storage/store";
import { createFavButton } from "./fav-button";
import { ensureDocumentStyles } from "./cards";

export function mountPostPageToggle(
  root: ParentNode = document,
  search: string = window.location.search,
): void {
  if (detectPageKind(search) !== "post") {
    return;
  }

  const postId = readPostIdFromSearch(search);
  if (postId === null) {
    return;
  }

  if (root.querySelector(`#${POST_FAV_BUTTON_ID}`) !== null) {
    return;
  }

  const nativeLink = root.querySelector(SITE_SELECTORS.nativeAddFavLink);
  if (!(nativeLink instanceof HTMLAnchorElement)) {
    log.warn(UI_TEXT.postFavMissingNative);
    return;
  }

  const nativeItem = nativeLink.closest("li");
  if (!(nativeItem instanceof HTMLLIElement)) {
    log.warn(UI_TEXT.postFavMissingNative);
    return;
  }

  ensureDocumentStyles();
  const marked = load().marks[postId]?.fav === true;
  const button = createFavButton(postId, marked, CSS_CLASS.postFavButton);
  button.id = POST_FAV_BUTTON_ID;

  const item = document.createElement("li");
  item.className = CSS_CLASS.postFavItem;
  item.append(button);
  nativeItem.after(item);
}
