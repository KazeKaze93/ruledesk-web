import { detectPageKind } from "./pages";
import {
  SITE_SELECTORS,
  extractPostIdFromFavoritesDeleteOnclick,
  extractPostIdFromThumb,
} from "./selectors";
import { addFavs, removeFav } from "../storage/favs";

let removeClickBound = false;

export type FavoriteThumbEntry = {
  readonly thumb: HTMLElement;
  readonly postId: string;
};

const POST_LINK_ID_PREFIX = "p";

/**
 * Resolve a favorites-page thumb's post id from Remove onclick, thumb id, or a#p{ID}.
 */
export function resolveFavoriteThumbPostId(thumb: Element): string | null {
  const removeLinks = thumb.querySelectorAll(SITE_SELECTORS.favoritesDeleteLink);
  for (const link of removeLinks) {
    if (!(link instanceof HTMLAnchorElement)) {
      continue;
    }
    const onclick = link.getAttribute("onclick");
    if (onclick === null) {
      continue;
    }
    const fromOnclick = extractPostIdFromFavoritesDeleteOnclick(onclick);
    if (fromOnclick !== null) {
      return fromOnclick;
    }
  }

  const fromThumbId = extractPostIdFromThumb(thumb);
  if (fromThumbId !== null) {
    return fromThumbId;
  }

  const postLinks = thumb.querySelectorAll(`a[id^="${POST_LINK_ID_PREFIX}"]`);
  for (const link of postLinks) {
    if (!(link instanceof HTMLAnchorElement)) {
      continue;
    }
    const id = link.id;
    if (!id.startsWith(POST_LINK_ID_PREFIX)) {
      continue;
    }
    const postId = id.slice(POST_LINK_ID_PREFIX.length);
    if (/^\d+$/.test(postId)) {
      return postId;
    }
  }

  return null;
}

/** Current-page favorite thumbs that have a resolvable post id. */
export function listFavoriteThumbEntries(
  root: ParentNode = document,
): FavoriteThumbEntry[] {
  const entries: FavoriteThumbEntry[] = [];
  const seen = new Set<string>();
  const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
  for (const node of thumbs) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    const postId = resolveFavoriteThumbPostId(node);
    if (postId === null || seen.has(postId)) {
      continue;
    }
    seen.add(postId);
    entries.push({ thumb: node, postId });
  }
  return entries;
}

const CELL_SEPARATOR_TAGS = new Set(["BR", "HR", "WBR"]);
const CELL_SEPARATOR_TEXT_PATTERN = /^[|\u00b7•·,\s]*$/;

/**
 * True for Remove links / light separators that belong to a favorites cell.
 * Stops adjacency walks before paginator, scripts, and other page chrome.
 */
function isFavoriteCellResidue(
  node: ChildNode,
  postId: string | null,
): boolean {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    return CELL_SEPARATOR_TEXT_PATTERN.test(text);
  }
  if (!(node instanceof HTMLElement)) {
    return false;
  }
  if (CELL_SEPARATOR_TAGS.has(node.tagName)) {
    return true;
  }
  if (!(node instanceof HTMLAnchorElement)) {
    return false;
  }
  const onclick = node.getAttribute("onclick");
  if (onclick === null) {
    return false;
  }
  const removeId = extractPostIdFromFavoritesDeleteOnclick(onclick);
  if (removeId === null) {
    return false;
  }
  return postId === null || removeId === postId;
}

/**
 * Remove a favorites cell from the DOM: the thumb and, when Remove / separators
 * sit between this thumb and the next `span.thumb`, those siblings too.
 * Never injects into `a#p{ID}`; never deletes paginator/other non-cell nodes.
 */
export function removeFavoriteCell(thumb: HTMLElement): void {
  const postId = resolveFavoriteThumbPostId(thumb);
  const nodesToRemove: ChildNode[] = [thumb];
  let sibling: ChildNode | null = thumb.nextSibling;
  while (sibling !== null) {
    if (
      sibling instanceof HTMLElement &&
      sibling.matches(SITE_SELECTORS.thumb)
    ) {
      break;
    }
    if (!isFavoriteCellResidue(sibling, postId)) {
      break;
    }
    nodesToRemove.push(sibling);
    sibling = sibling.nextSibling;
  }
  for (const node of nodesToRemove) {
    node.remove();
  }
}

export function collectFavoritePostIds(root: ParentNode): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const links = root.querySelectorAll(SITE_SELECTORS.favoritesDeleteLink);

  for (const link of links) {
    if (!(link instanceof HTMLAnchorElement)) {
      continue;
    }
    const onclick = link.getAttribute("onclick");
    if (onclick === null) {
      continue;
    }
    const postId = extractPostIdFromFavoritesDeleteOnclick(onclick);
    if (postId === null || seen.has(postId)) {
      continue;
    }
    seen.add(postId);
    ids.push(postId);
  }

  return ids;
}

function bindRemoveClickCapture(): void {
  if (removeClickBound) {
    return;
  }
  removeClickBound = true;

  document.addEventListener(
    "click",
    (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      const link = target.closest("a");
      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }
      const onclick = link.getAttribute("onclick");
      if (onclick === null) {
        return;
      }
      const postId = extractPostIdFromFavoritesDeleteOnclick(onclick);
      if (postId === null) {
        return;
      }
      removeFav(postId);
    },
    true,
  );
}

export function syncFavoritesPage(
  root: ParentNode = document,
  search: string = window.location.search,
): void {
  if (detectPageKind(search) !== "favorites") {
    return;
  }

  const ids = collectFavoritePostIds(root);
  const numericIds: number[] = [];
  for (const postId of ids) {
    const parsed = Number(postId);
    if (Number.isFinite(parsed)) {
      numericIds.push(Math.trunc(parsed));
    }
  }
  addFavs(numericIds);
  bindRemoveClickCapture();
}
