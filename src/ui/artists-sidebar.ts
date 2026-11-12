import {
  CSS_CLASS,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_PARAM_TAGS,
  SEARCH_PAGE,
  SEARCH_SECTION,
  SITE_ORIGIN,
  UI_TEXT,
} from "../config/constants";
import { normalizeArtistTag } from "../search/query";
import { detectPageKind } from "../site/pages";
import { SITE_SELECTORS } from "../site/selectors";
import {
  addArtist,
  isFollowingArtist,
  removeArtist,
} from "../storage/store";
import { ensureDocumentStyles } from "./cards";

function extractArtistTagFromLi(li: Element): string | null {
  const links = li.querySelectorAll("a[href]");
  for (const node of links) {
    if (!(node instanceof HTMLAnchorElement)) {
      continue;
    }
    if (node.hasAttribute("onclick")) {
      continue;
    }
    const href = node.getAttribute("href");
    if (href === null || href.length === 0) {
      continue;
    }
    let url: URL;
    try {
      url = new URL(href, SITE_ORIGIN);
    } catch {
      continue;
    }
    if (url.searchParams.get(SEARCH_PARAM_PAGE) !== SEARCH_PAGE) {
      continue;
    }
    if (url.searchParams.get(SEARCH_PARAM_SECTION) !== SEARCH_SECTION) {
      continue;
    }
    const tags = url.searchParams.get(SEARCH_PARAM_TAGS);
    if (tags === null) {
      continue;
    }
    return normalizeArtistTag(tags);
  }
  return null;
}

function applyFollowState(button: HTMLButtonElement, following: boolean): void {
  button.setAttribute("aria-pressed", following ? "true" : "false");
  button.classList.toggle(CSS_CLASS.artistFollowMarked, following);
  const label = following ? UI_TEXT.artistFollowing : UI_TEXT.artistFollow;
  const tag = button.dataset.rdwArtistTag ?? "";
  button.setAttribute("aria-label", `${label}: ${tag}`);
  button.textContent = label;
  button.title = label;
}

function attachFollowButton(li: HTMLElement, tag: string): void {
  if (li.querySelector(SITE_SELECTORS.artistFollowButton) !== null) {
    return;
  }
  const button = document.createElement("button");
  button.type = "button";
  button.className = CSS_CLASS.artistFollow;
  button.dataset.rdwArtistTag = tag;
  applyFollowState(button, isFollowingArtist(tag));
  button.addEventListener("click", (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    const following = button.getAttribute("aria-pressed") === "true";
    try {
      if (following) {
        removeArtist(tag);
        applyFollowState(button, false);
      } else {
        addArtist(tag);
        applyFollowState(button, true);
      }
    } catch {
      applyFollowState(button, isFollowingArtist(tag));
    }
  });
  li.append(button);
}

export function mountArtistSidebar(
  root: ParentNode = document,
  search: string = window.location.search,
): void {
  const kind = detectPageKind(search);
  if (kind !== "list" && kind !== "post") {
    return;
  }

  ensureDocumentStyles();
  const sidebar = root.querySelector(SITE_SELECTORS.tagSidebar);
  if (sidebar === null) {
    return;
  }

  const rows = sidebar.querySelectorAll(SITE_SELECTORS.tagTypeArtist);
  for (const row of rows) {
    if (!(row instanceof HTMLElement)) {
      continue;
    }
    const tag = extractArtistTagFromLi(row);
    if (tag === null) {
      continue;
    }
    attachFollowButton(row, tag);
  }
}
