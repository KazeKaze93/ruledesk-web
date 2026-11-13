import {
  FAVORITES_PAGE,
  FAVORITES_SECTION_VIEW,
  SEARCH_PARAM_ID,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_PATH,
} from "../config/constants";
import { extractUserIdFromDocument } from "../site/favorites-sync";
import { getSyncState } from "../storage/favs";
import {
  CURRENT_PAGE_CLASS,
  FEED_MENU_ITEM_ID,
  HEADER_SELECTOR,
  MENU_ITEM_ID,
  MENU_LABEL,
  MY_FAVORITES_CONTAINER_ID,
  MY_FAVORITES_LINK_SELECTOR,
  NAVBAR_SELECTOR,
  POSTS_LINK_TEXT,
  RDW_HASH_COLLECTIONS,
  RDW_HASH_FOLLOWING,
  RDW_HASH_SETTINGS,
  RDW_ROUTE_COLLECTIONS,
  RDW_ROUTE_FOLLOWING,
  RDW_ROUTE_SETTINGS,
  type RdwRoute,
} from "./constants";

const CONTENT_ID = "content";

let savedSiteCurrent: HTMLLIElement | null = null;
let siteCurrentCaptured = false;

function isHeaderMenuListItem(listItem: Element, content: Element | null): boolean {
  if (content !== null && content.contains(listItem)) {
    return false;
  }
  return true;
}

function findPostsMenuItem(): HTMLLIElement | null {
  const content = document.getElementById(CONTENT_ID);
  const anchors = document.querySelectorAll("a");
  for (const node of anchors) {
    if (!(node instanceof HTMLAnchorElement)) {
      continue;
    }
    if ((node.textContent?.trim() ?? "") !== POSTS_LINK_TEXT) {
      continue;
    }
    const listItem = node.closest("li");
    if (listItem === null || !(listItem instanceof HTMLLIElement)) {
      continue;
    }
    if (!isHeaderMenuListItem(listItem, content)) {
      continue;
    }
    return listItem;
  }
  return null;
}

function findNavbar(): HTMLUListElement | null {
  const navbar = document.querySelector(NAVBAR_SELECTOR);
  return navbar instanceof HTMLUListElement ? navbar : null;
}

function findHeader(): HTMLElement | null {
  const header = document.querySelector(HEADER_SELECTOR);
  return header instanceof HTMLElement ? header : null;
}

/** Saved favorites user id from sync state (Package E). */
function readSavedFavoritesUserId(): number | null {
  const userId = getSyncState()?.userId;
  if (userId === undefined || !Number.isFinite(userId) || userId <= 0) {
    return null;
  }
  return userId;
}

function buildFavoritesHrefFromUserId(userId: number): string {
  const params = new URLSearchParams();
  params.set(SEARCH_PARAM_PAGE, FAVORITES_PAGE);
  params.set(SEARCH_PARAM_SECTION, FAVORITES_SECTION_VIEW);
  params.set(SEARCH_PARAM_ID, String(userId));
  return `${SEARCH_PATH}?${params.toString()}`;
}

/** Favorites → site page; null when user id is unknown. */
export function resolveFavoritesHref(root: ParentNode = document): string | null {
  const link = root.querySelector(MY_FAVORITES_LINK_SELECTOR);
  if (link instanceof HTMLAnchorElement) {
    const href = link.getAttribute("href");
    if (href !== null && href.length > 0) {
      return link.href;
    }
  }
  const fromDoc = extractUserIdFromDocument(root);
  if (fromDoc !== null) {
    return buildFavoritesHrefFromUserId(fromDoc);
  }
  const saved = readSavedFavoritesUserId();
  if (saved !== null) {
    return buildFavoritesHrefFromUserId(saved);
  }
  return null;
}

function ensureMenuLink(
  id: string,
  label: string,
  href: string,
): HTMLLIElement {
  const existing = document.getElementById(id);
  if (existing instanceof HTMLLIElement) {
    const anchor = existing.querySelector("a");
    if (anchor instanceof HTMLAnchorElement) {
      anchor.textContent = label;
      anchor.href = href;
    }
    return existing;
  }
  const item = document.createElement("li");
  item.id = id;
  const anchor = document.createElement("a");
  anchor.textContent = label;
  anchor.href = href;
  item.append(anchor);
  return item;
}

function hideNativeMyFavorites(): void {
  const container = document.getElementById(MY_FAVORITES_CONTAINER_ID);
  if (container instanceof HTMLLIElement) {
    container.hidden = true;
  }
}

function insertionAnchorAfterFeedOrPosts(): HTMLLIElement | null {
  const feed = document.getElementById(FEED_MENU_ITEM_ID);
  if (feed instanceof HTMLLIElement) {
    return feed;
  }
  return findPostsMenuItem();
}

/**
 * Navbar: after Posts/Feed → Collections, Following, Favorites; end → RuleDesk.
 * No-op when div#header / ul#navbar missing.
 */
export function installSiteMenu(): void {
  if (findHeader() === null) {
    return;
  }
  const navbar = findNavbar();
  if (navbar === null) {
    return;
  }

  const anchor = insertionAnchorAfterFeedOrPosts();
  if (anchor === null) {
    return;
  }

  const collections = ensureMenuLink(
    MENU_ITEM_ID.collections,
    MENU_LABEL.collections,
    RDW_HASH_COLLECTIONS,
  );
  const following = ensureMenuLink(
    MENU_ITEM_ID.following,
    MENU_LABEL.following,
    RDW_HASH_FOLLOWING,
  );

  if (collections.parentElement !== navbar) {
    anchor.after(collections);
  } else if (collections.previousElementSibling !== anchor) {
    anchor.after(collections);
  }
  if (following.previousElementSibling !== collections) {
    collections.after(following);
  }

  const favoritesHref = resolveFavoritesHref();
  const existingFavorites = document.getElementById(MENU_ITEM_ID.favorites);
  if (favoritesHref === null) {
    if (existingFavorites !== null) {
      existingFavorites.remove();
    }
  } else {
    const favorites = ensureMenuLink(
      MENU_ITEM_ID.favorites,
      MENU_LABEL.favorites,
      favoritesHref,
    );
    if (favorites.previousElementSibling !== following) {
      following.after(favorites);
    }
  }

  hideNativeMyFavorites();

  const settings = ensureMenuLink(
    MENU_ITEM_ID.settings,
    MENU_LABEL.settings,
    RDW_HASH_SETTINGS,
  );
  if (settings.parentElement !== navbar || navbar.lastElementChild !== settings) {
    navbar.append(settings);
  }
}

function menuItemIdForRoute(route: RdwRoute): string {
  if (route === RDW_ROUTE_COLLECTIONS) {
    return MENU_ITEM_ID.collections;
  }
  if (route === RDW_ROUTE_FOLLOWING) {
    return MENU_ITEM_ID.following;
  }
  return MENU_ITEM_ID.settings;
}

function captureSiteCurrentIfNeeded(): void {
  if (siteCurrentCaptured) {
    return;
  }
  siteCurrentCaptured = true;
  const navbar = findNavbar();
  if (navbar === null) {
    savedSiteCurrent = null;
    return;
  }
  const current = navbar.querySelector(`li.${CURRENT_PAGE_CLASS}`);
  savedSiteCurrent =
    current instanceof HTMLLIElement &&
    current.id !== MENU_ITEM_ID.collections &&
    current.id !== MENU_ITEM_ID.following &&
    current.id !== MENU_ITEM_ID.favorites &&
    current.id !== MENU_ITEM_ID.settings
      ? current
      : null;
}

function clearAllOwnCurrent(): void {
  for (const id of Object.values(MENU_ITEM_ID)) {
    const item = document.getElementById(id);
    if (item instanceof HTMLLIElement) {
      item.classList.remove(CURRENT_PAGE_CLASS);
    }
  }
}

/** Mark the own-page nav item; remember site current-page for restore. */
export function setOwnPageCurrentHighlight(route: RdwRoute): void {
  captureSiteCurrentIfNeeded();
  const navbar = findNavbar();
  if (navbar !== null) {
    for (const child of navbar.querySelectorAll(`li.${CURRENT_PAGE_CLASS}`)) {
      child.classList.remove(CURRENT_PAGE_CLASS);
    }
  }
  clearAllOwnCurrent();
  const item = document.getElementById(menuItemIdForRoute(route));
  if (item instanceof HTMLLIElement) {
    item.classList.add(CURRENT_PAGE_CLASS);
  }
}

/** Restore site current-page after leaving #rdw/ routes. */
export function clearOwnPageCurrentHighlight(): void {
  clearAllOwnCurrent();
  if (savedSiteCurrent !== null && savedSiteCurrent.isConnected) {
    savedSiteCurrent.classList.add(CURRENT_PAGE_CLASS);
  }
  savedSiteCurrent = null;
  siteCurrentCaptured = false;
}
