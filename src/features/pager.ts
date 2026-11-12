import { PANEL_ROOT_ID, SEARCH_PARAM_PID } from "../config/constants";
import { log } from "../log";
import {
  featureBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

const PAGER_ID = "pager";
const PAGER_ROOT_ID = "rdw-pager";
const PAGER_CLASS = "rdw-pager";
const PAGER_LINK_CLASS = "rdw-pager-link";
const PAGER_LINK_DISABLED_CLASS = "rdw-pager-link--disabled";
const PAGER_PAGE_CLASS = "rdw-pager-page";
const PAGER_SEP_CLASS = "rdw-pager-sep";

const SELECTOR_PAGINATION = "div.pagination";
const SELECTOR_NEXT_LINK = 'a[alt="next"]';
const SELECTOR_IMAGE_LIST = "div.image-list";

const DEFAULT_STEP = 42;

const TEXT_PREV = "‹ Prev";
const TEXT_NEXT = "Next ›";
const TEXT_SEP = "|";
const LABEL_PREV = "Previous page";
const LABEL_NEXT = "Next page";

const WARN_NO_HOST = "pager: image-list missing; pager not mounted";

const BODY_CLASS = featureBodyClass(PAGER_ID);

function readPid(search: string): number {
  const rawSearch = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(rawSearch);
  const raw = params.get(SEARCH_PARAM_PID);
  if (raw === null || raw.trim().length === 0) {
    return 0;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.floor(value);
}

function readPidFromHref(href: string): number | null {
  try {
    const url = new URL(href, window.location.href);
    const raw = url.searchParams.get(SEARCH_PARAM_PID);
    if (raw === null || raw.trim().length === 0) {
      return null;
    }
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      return null;
    }
    return Math.floor(value);
  } catch {
    return null;
  }
}

function hrefForPid(baseSearch: string, pid: number): string {
  const rawSearch = baseSearch.startsWith("?") ? baseSearch.slice(1) : baseSearch;
  const params = new URLSearchParams(rawSearch);
  if (pid <= 0) {
    params.delete(SEARCH_PARAM_PID);
  } else {
    params.set(SEARCH_PARAM_PID, String(pid));
  }
  const query = params.toString();
  const path = window.location.pathname;
  return query.length > 0 ? `${path}?${query}` : path;
}

function findNextLink(): HTMLAnchorElement | null {
  const pagination = document.querySelector(SELECTOR_PAGINATION);
  if (pagination === null) {
    return null;
  }
  const link = pagination.querySelector(SELECTOR_NEXT_LINK);
  return link instanceof HTMLAnchorElement ? link : null;
}

function resolveStep(currentPid: number, nextLink: HTMLAnchorElement | null): {
  step: number;
  hasNext: boolean;
  nextPid: number | null;
} {
  if (nextLink === null) {
    return { step: DEFAULT_STEP, hasNext: false, nextPid: null };
  }
  const parsed = readPidFromHref(nextLink.getAttribute("href") ?? "");
  if (parsed === null) {
    const step = DEFAULT_STEP;
    return { step, hasNext: true, nextPid: currentPid + step };
  }
  const delta = parsed - currentPid;
  const step = delta > 0 ? delta : DEFAULT_STEP;
  return { step, hasNext: true, nextPid: parsed };
}

function isEditableOrPanelEvent(event: KeyboardEvent): boolean {
  for (const node of event.composedPath()) {
    if (!(node instanceof Element)) {
      continue;
    }
    if (node.id === PANEL_ROOT_ID) {
      return true;
    }
    const tag = node.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
      return true;
    }
    if (node instanceof HTMLElement && node.isContentEditable) {
      return true;
    }
  }
  return false;
}

function createDisabledControl(text: string, label: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.className = `${PAGER_LINK_CLASS} ${PAGER_LINK_DISABLED_CLASS}`;
  span.setAttribute("aria-disabled", "true");
  span.setAttribute("aria-label", label);
  span.textContent = text;
  return span;
}

function createLinkControl(
  text: string,
  label: string,
  href: string,
): HTMLAnchorElement {
  const anchor = document.createElement("a");
  anchor.className = PAGER_LINK_CLASS;
  anchor.href = href;
  anchor.setAttribute("aria-label", label);
  anchor.textContent = text;
  return anchor;
}

function createSep(): HTMLSpanElement {
  const sep = document.createElement("span");
  sep.className = PAGER_SEP_CLASS;
  sep.setAttribute("aria-hidden", "true");
  sep.textContent = TEXT_SEP;
  return sep;
}

function buildPagerRoot(
  pageNumber: number,
  prevHref: string | null,
  nextHref: string | null,
): HTMLElement {
  const root = document.createElement("nav");
  root.id = PAGER_ROOT_ID;
  root.className = PAGER_CLASS;
  root.setAttribute("aria-label", "Pagination");

  const prev =
    prevHref === null
      ? createDisabledControl(TEXT_PREV, LABEL_PREV)
      : createLinkControl(TEXT_PREV, LABEL_PREV, prevHref);

  const page = document.createElement("span");
  page.className = PAGER_PAGE_CLASS;
  page.textContent = `Page ${pageNumber}`;

  const next =
    nextHref === null
      ? createDisabledControl(TEXT_NEXT, LABEL_NEXT)
      : createLinkControl(TEXT_NEXT, LABEL_NEXT, nextHref);

  root.append(prev, createSep(), page, createSep(), next);
  return root;
}

function findImageList(): Element | null {
  const imageList = document.querySelector(SELECTOR_IMAGE_LIST);
  if (imageList === null || imageList.parentNode === null) {
    return null;
  }
  return imageList;
}

function removeExistingPager(): void {
  const existing = document.getElementById(PAGER_ROOT_ID);
  if (existing !== null) {
    existing.remove();
  }
}

let keyboardHandler: ((event: KeyboardEvent) => void) | null = null;

function detachKeyboardNav(): void {
  if (keyboardHandler !== null) {
    document.removeEventListener("keydown", keyboardHandler);
    keyboardHandler = null;
  }
}

function attachKeyboardNav(prevHref: string | null, nextHref: string | null): void {
  detachKeyboardNav();
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) {
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }
    if (isEditableOrPanelEvent(event)) {
      return;
    }
    const targetHref =
      event.key === "ArrowLeft" ? prevHref : nextHref;
    if (targetHref === null) {
      return;
    }
    event.preventDefault();
    window.location.assign(targetHref);
  };
  keyboardHandler = onKeyDown;
  document.addEventListener("keydown", onKeyDown);
}

function mountPager(ctx: FeatureContext): void {
  const currentPid = readPid(ctx.search);
  const nextLink = findNextLink();
  const { step, hasNext, nextPid } = resolveStep(currentPid, nextLink);

  const hasPrev = currentPid > 0;
  const prevPid = hasPrev ? Math.max(0, currentPid - step) : null;
  const pageNumber = Math.floor(currentPid / step) + 1;

  const prevHref =
    prevPid === null ? null : hrefForPid(ctx.search, prevPid);
  const nextHref =
    hasNext && nextPid !== null ? hrefForPid(ctx.search, nextPid) : null;

  const imageList = findImageList();
  if (imageList === null) {
    detachKeyboardNav();
    log.warn(WARN_NO_HOST);
    return;
  }

  removeExistingPager();
  const root = buildPagerRoot(pageNumber, prevHref, nextHref);
  imageList.parentNode?.insertBefore(root, imageList);

  attachKeyboardNav(prevHref, nextHref);
}

export const pagerFeature: Feature = {
  id: PAGER_ID,
  label: "Top pagination",
  pages: ["list"],
  defaultEnabled: true,
  css: `
body.${BODY_CLASS} .${PAGER_CLASS} {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.3;
}
body.${BODY_CLASS} .${PAGER_LINK_CLASS} {
  color: inherit;
  text-decoration: none;
  border-radius: 2px;
}
body.${BODY_CLASS} .${PAGER_LINK_CLASS}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}
body.${BODY_CLASS} .${PAGER_LINK_DISABLED_CLASS} {
  opacity: 0.45;
  pointer-events: none;
  cursor: default;
}
body.${BODY_CLASS} .${PAGER_PAGE_CLASS} {
  font-variant-numeric: tabular-nums;
}
body.${BODY_CLASS} .${PAGER_SEP_CLASS} {
  opacity: 0.55;
  user-select: none;
}
`.trim(),
  mount: mountPager,
};
