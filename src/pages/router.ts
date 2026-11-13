import { ensureStyleElement } from "../boot/appearance-dom";
import {
  HEADER_SELECTOR,
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
  }
  syncFromHash();
}
