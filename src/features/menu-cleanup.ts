import { log } from "../log";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";

const FEATURE_ID = "menu-cleanup";
const FEATURE_LABEL = "Clean header menu";
const CONTENT_ID = "content";
const HIDDEN_CLASS = "rdw-menu-hidden";
const BODY_FEATURE_CLASS = featureBodyClass(FEATURE_ID);
const MISSING_MENU_WARN = "Header menu not found";

const HIDE_LINK_TEXTS = [
  "iCame Top 100",
  "Discord",
  "X",
  "Other Sites",
  "Contact Us",
  "DMCA",
  "About",
  "TOS",
] as const;

const HIDE_LINK_TEXT_SET: ReadonlySet<string> = new Set(HIDE_LINK_TEXTS);

const FEATURE_PAGES = ["list", "post", "favorites", "other"] as const;

const FEATURE_CSS = `body.${BODY_FEATURE_CLASS} li.${HIDDEN_CLASS} { display:none !important; }`;

function isHeaderMenuLink(anchor: HTMLAnchorElement, content: Element | null): boolean {
  const listItem = anchor.closest("li");
  if (listItem === null) {
    return false;
  }
  if (content !== null && content.contains(listItem)) {
    return false;
  }
  return true;
}

function collectHeaderMenuLinks(): HTMLAnchorElement[] {
  const content = document.getElementById(CONTENT_ID);
  const anchors = document.querySelectorAll("a");
  const headerLinks: HTMLAnchorElement[] = [];
  for (const node of anchors) {
    if (!(node instanceof HTMLAnchorElement)) {
      continue;
    }
    if (!isHeaderMenuLink(node, content)) {
      continue;
    }
    headerLinks.push(node);
  }
  return headerLinks;
}

function mountMenuCleanup(_ctx: FeatureContext): void {
  const headerLinks = collectHeaderMenuLinks();
  if (headerLinks.length === 0) {
    log.warn(MISSING_MENU_WARN);
    return;
  }

  for (const anchor of headerLinks) {
    const text = anchor.textContent?.trim() ?? "";
    if (!HIDE_LINK_TEXT_SET.has(text)) {
      continue;
    }
    const listItem = anchor.closest("li");
    if (listItem === null) {
      continue;
    }
    listItem.classList.add(HIDDEN_CLASS);
  }
}

export const menuCleanupFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  mount: mountMenuCleanup,
};
