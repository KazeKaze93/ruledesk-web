import { ensureStyleElement } from "../boot/appearance-dom";
import {
  HEADER_SELECTOR,
  RDW_HASH_PREFIX,
  RDW_OWN_PAGE_CLASS,
  RDW_OWN_PAGE_STYLE_ID,
  buildOwnPageCss,
  parseRdwHash,
  type RdwRoute,
} from "./constants";
import { hideRdwPage, showRdwPage } from "./host";
import {
  clearOwnPageCurrentHighlight,
  installSiteMenu,
  setOwnPageCurrentHighlight,
} from "./menu";

const EVENT_HASHCHANGE = "hashchange";
const EVENT_POPSTATE = "popstate";
const EVENT_CLICK = "click";
const HISTORY_STATE_TITLE = "";

let routerBound = false;

export { isRdwRoute, parseRdwHash } from "./constants";

export function ensureOwnPageStyle(): void {
  const style = ensureStyleElement(RDW_OWN_PAGE_STYLE_ID);
  style.textContent = buildOwnPageCss();
}

function findHeader(): HTMLElement | null {
  const header = document.querySelector(HEADER_SELECTOR);
  return header instanceof HTMLElement ? header : null;
}

function enterRoute(route: RdwRoute): void {
  const header = findHeader();
  if (header === null) {
    return;
  }
  document.documentElement.classList.add(RDW_OWN_PAGE_CLASS);
  showRdwPage(route, header);
  setOwnPageCurrentHighlight(route);
}

function leaveRoute(): void {
  document.documentElement.classList.remove(RDW_OWN_PAGE_CLASS);
  hideRdwPage();
  clearOwnPageCurrentHighlight();
}

function syncFromHash(): void {
  const header = findHeader();
  if (header === null) {
    leaveRoute();
    return;
  }
  const route = parseRdwHash(window.location.hash);
  if (route === null) {
    leaveRoute();
    return;
  }
  enterRoute(route);
}

function onHashChange(): void {
  syncFromHash();
}

function onPopState(): void {
  syncFromHash();
}

function isModifiedClick(event: MouseEvent): boolean {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

/**
 * First visit to a #rdw/* route pushes history; switching among script pages
 * replaces so Back returns to the underlying site page.
 */
export function navigateToRdwRoute(route: RdwRoute): void {
  const nextHash = `${RDW_HASH_PREFIX}${route}`;
  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
  const alreadyOnScriptPage = parseRdwHash(window.location.hash) !== null;
  if (alreadyOnScriptPage) {
    window.history.replaceState(window.history.state, HISTORY_STATE_TITLE, nextUrl);
  } else {
    window.history.pushState(window.history.state, HISTORY_STATE_TITLE, nextUrl);
  }
  syncFromHash();
}

function onDocumentClick(event: MouseEvent): void {
  if (event.defaultPrevented || isModifiedClick(event)) {
    return;
  }
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const anchor = target.closest("a");
  if (!(anchor instanceof HTMLAnchorElement)) {
    return;
  }
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return;
  }
  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return;
  }
  if (url.origin !== window.location.origin) {
    return;
  }
  if (
    url.pathname !== window.location.pathname ||
    url.search !== window.location.search
  ) {
    return;
  }
  const route = parseRdwHash(url.hash);
  if (route === null) {
    return;
  }
  event.preventDefault();
  navigateToRdwRoute(route);
}

/**
 * Install navbar items + hash router. No menu / no page when div#header is absent.
 */
export function startRdwPages(): void {
  ensureOwnPageStyle();
  const header = findHeader();
  if (header === null) {
    leaveRoute();
    return;
  }
  installSiteMenu();
  if (!routerBound) {
    routerBound = true;
    window.addEventListener(EVENT_HASHCHANGE, onHashChange);
    window.addEventListener(EVENT_POPSTATE, onPopState);
    document.addEventListener(EVENT_CLICK, onDocumentClick);
  }
  syncFromHash();
}
