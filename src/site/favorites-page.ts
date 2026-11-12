import { detectPageKind } from "./pages";
import {
  SITE_SELECTORS,
  extractPostIdFromFavoritesDeleteOnclick,
} from "./selectors";
import { addFavs, removeFav } from "../storage/favs";

let removeClickBound = false;

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
