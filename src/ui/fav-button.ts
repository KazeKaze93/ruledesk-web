import {
  CSS_CLASS,
  KEY_ENTER,
  KEY_SPACE,
  UI_TEXT,
} from "../config/constants";
import { log } from "../log";
import { addFavorite, removeFavorite } from "../site/favorites";
import { setPostFavMark } from "../storage/store";

function stopLinkActivation(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
}

export type FavButtonState =
  | "idle"
  | "pending"
  | "marked"
  | "error"
  | "marked_error";

export function favAriaLabel(postId: string, marked: boolean): string {
  const action = marked
    ? UI_TEXT.cardFavRemoveLabel
    : UI_TEXT.cardFavAddLabel;
  return `${action} ${postId}`;
}

export function applyFavButtonState(
  button: HTMLButtonElement,
  state: FavButtonState,
  postId: string,
  errorTitle?: string,
): void {
  if (state === "pending") {
    button.disabled = true;
    button.classList.add(CSS_CLASS.cardFavPending);
    return;
  }

  button.classList.remove(
    CSS_CLASS.cardFavMarked,
    CSS_CLASS.cardFavError,
    CSS_CLASS.cardFavPending,
  );
  button.disabled = false;
  button.removeAttribute("title");

  if (state === "marked") {
    button.setAttribute("aria-pressed", "true");
    button.setAttribute("aria-label", favAriaLabel(postId, true));
    button.classList.add(CSS_CLASS.cardFavMarked);
    return;
  }

  if (state === "marked_error") {
    button.setAttribute("aria-pressed", "true");
    button.setAttribute("aria-label", favAriaLabel(postId, true));
    button.classList.add(CSS_CLASS.cardFavMarked, CSS_CLASS.cardFavError);
    button.title = errorTitle ?? UI_TEXT.cardFavErrorRequest;
    return;
  }

  if (state === "error") {
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", favAriaLabel(postId, false));
    button.classList.add(CSS_CLASS.cardFavError);
    button.title = errorTitle ?? UI_TEXT.cardFavErrorRequest;
    return;
  }

  button.setAttribute("aria-pressed", "false");
  button.setAttribute("aria-label", favAriaLabel(postId, false));
}

export function createFavButton(
  postId: string,
  marked: boolean,
  className: string = CSS_CLASS.cardFav,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = UI_TEXT.cardFavGlyph;
  applyFavButtonState(button, marked ? "marked" : "idle", postId);
  button.addEventListener("click", (event: Event) => {
    stopLinkActivation(event);
    void handleFavToggleClick(button, postId);
  });
  button.addEventListener("keydown", (event: Event) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    if (event.key !== KEY_ENTER && event.key !== KEY_SPACE) {
      return;
    }
    stopLinkActivation(event);
    void handleFavToggleClick(button, postId);
  });
  return button;
}

export async function handleFavToggleClick(
  button: HTMLButtonElement,
  postId: string,
): Promise<void> {
  if (button.disabled) {
    return;
  }

  const currentlyMarked = button.getAttribute("aria-pressed") === "true";
  applyFavButtonState(button, "pending", postId);

  if (currentlyMarked) {
    const result = await removeFavorite(postId);
    if (result.status === "removed") {
      setPostFavMark(postId, false);
      applyFavButtonState(button, "idle", postId);
      return;
    }
    applyFavButtonState(
      button,
      "marked_error",
      postId,
      UI_TEXT.cardFavErrorRequest,
    );
    log.warn("Remove favorite failed", postId, result);
    return;
  }

  const result = await addFavorite(postId);
  if (result.status === "added" || result.status === "already") {
    setPostFavMark(postId, true);
    applyFavButtonState(button, "marked", postId);
    return;
  }
  if (result.status === "not_logged_in") {
    applyFavButtonState(
      button,
      "error",
      postId,
      UI_TEXT.cardFavErrorNotLoggedIn,
    );
    log.warn("Favorite requires login", postId);
    return;
  }
  applyFavButtonState(button, "error", postId, UI_TEXT.cardFavErrorRequest);
  log.warn("Favorite failed", postId, result);
}
