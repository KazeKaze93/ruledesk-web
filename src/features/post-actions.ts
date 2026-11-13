import { h, render } from "preact";

import { log } from "../log";
import { readPostIdFromSearch } from "../site/pages";
import { PostPanel } from "./post-panel/post-panel";
import {
  findFlexi,
  findMediaWrapper,
  measureHeaderOffsetPx,
} from "./post-panel/site-reads";
import {
  POST_ACTIONS_ID,
  featureBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

const FEATURE_ID = "post-actions";
const FEATURE_LABEL = "Post side panel";
const FEATURE_PAGES = ["post"] as const;

/** Body class while the panel host is in the document — CSS hide handoff for G. */
export const POST_PANEL_MOUNTED_CLASS = "rdw-post-panel-mounted";

const NARROW_BREAKPOINT_PX = 1100;
const NARROW_MEDIA_QUERY = `(max-width: ${String(NARROW_BREAKPOINT_PX - 1)}px)`;
const PANEL_WIDTH_PX = 220;
const PANEL_STICKY_GAP_PX = 12;
const PANEL_Z_INDEX = 100;
const STICKY_TOP_VAR = "--rdw-post-panel-sticky-top";

const CLASS_PANEL = "rdw-post-actions";
const CLASS_MODE_WIDE = "rdw-post-actions--wide";
const CLASS_MODE_NARROW = "rdw-post-actions--narrow";

const WARN_NO_FLEXI =
  "post-actions: div.flexi missing; panel not mounted";

const BODY_CLASS = featureBodyClass(FEATURE_ID);
const BODY_SELECTOR = `body.${BODY_CLASS}`;

const FEATURE_CSS = `
${BODY_SELECTOR} #fit-to-screen div.flexi,
${BODY_SELECTOR} div#right-col div.flexi,
${BODY_SELECTOR} div.flexi {
  flex-wrap: wrap;
  align-items: flex-start;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_PANEL} {
  box-sizing: border-box;
  width: ${String(PANEL_WIDTH_PX)}px;
  max-width: 100%;
  flex: 0 0 ${String(PANEL_WIDTH_PX)}px;
  z-index: ${String(PANEL_Z_INDEX)};
  font: 12px/1.35 var(--rdw-font);
  color: var(--rdw-text);
}
${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_MODE_WIDE} {
  position: sticky;
  top: var(${STICKY_TOP_VAR}, ${String(PANEL_STICKY_GAP_PX)}px);
  align-self: flex-start;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_MODE_NARROW} {
  position: static;
  width: 100%;
  flex: 1 1 100%;
  margin: 0.75rem 0 0;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel {
  padding: 10px;
  display: grid;
  gap: 10px;
  position: relative;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-fav {
  grid-column: 1 / -1;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-original {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-sizing: border-box;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  text-decoration: none;
  font: inherit;
  font-size: 12px;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-score {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: var(--rdw-surface-2);
  border-radius: var(--rdw-radius-m);
  padding: 6px 8px;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-score-value {
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-stats {
  display: grid;
  grid-template-columns: 62px 1fr;
  gap: 3px 8px;
  font-size: 12px;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-stat-label {
  color: var(--rdw-muted);
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-source {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rdw-accent);
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-icame {
  display: flex;
  align-items: center;
  gap: 8px;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-collections,
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-more {
  position: relative;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-collection-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 5px 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-collection-item:hover,
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-collection-item:focus-visible {
  background: var(--rdw-surface-2);
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-collection-check {
  width: 15px;
  height: 15px;
  flex: 0 0 15px;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--rdw-border);
  border-radius: 4px;
  color: var(--rdw-surface);
  background: transparent;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-collection-item[aria-checked="true"] .rdw-post-panel-collection-check {
  background: var(--rdw-accent);
  border-color: var(--rdw-accent);
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-collection-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .rdw-post-panel-collection-new-form {
  display: grid;
  gap: 6px;
}
@media ${NARROW_MEDIA_QUERY} {
  ${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_MODE_WIDE} {
    position: static;
  }
}
`.trim();

let layoutCleanup: (() => void) | null = null;
let panelHost: HTMLElement | null = null;

function removeExistingPanel(): void {
  if (layoutCleanup !== null) {
    layoutCleanup();
    layoutCleanup = null;
  }
  if (panelHost !== null) {
    render(null, panelHost);
    panelHost.remove();
    panelHost = null;
  }
  const existing = document.getElementById(POST_ACTIONS_ID);
  if (existing !== null) {
    existing.remove();
  }
  document.body.classList.remove(POST_PANEL_MOUNTED_CLASS);
}

function isNarrowViewport(): boolean {
  if (typeof window.matchMedia === "function") {
    return window.matchMedia(NARROW_MEDIA_QUERY).matches;
  }
  return window.innerWidth < NARROW_BREAKPOINT_PX;
}

function applyStickyTop(panel: HTMLElement): void {
  const topPx = measureHeaderOffsetPx(PANEL_STICKY_GAP_PX);
  panel.style.setProperty(STICKY_TOP_VAR, `${String(topPx)}px`);
}

function placePanel(panel: HTMLElement, flexi: HTMLElement): void {
  const narrow = isNarrowViewport();
  panel.classList.toggle(CLASS_MODE_WIDE, !narrow);
  panel.classList.toggle(CLASS_MODE_NARROW, narrow);
  applyStickyTop(panel);

  const media = findMediaWrapper(flexi, POST_ACTIONS_ID);
  if (media !== null) {
    media.after(panel);
    return;
  }
  flexi.append(panel);
}

function bindLayout(panel: HTMLElement, flexi: HTMLElement): void {
  const sync = (): void => {
    placePanel(panel, flexi);
  };
  sync();

  const onResize = (): void => {
    sync();
  };
  window.addEventListener("resize", onResize);

  let mediaCleanup: (() => void) | null = null;
  if (typeof window.matchMedia === "function") {
    const media = window.matchMedia(NARROW_MEDIA_QUERY);
    const onChange = (): void => {
      sync();
    };
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      mediaCleanup = (): void => {
        media.removeEventListener("change", onChange);
      };
    } else if (typeof media.addListener === "function") {
      media.addListener(onChange);
      mediaCleanup = (): void => {
        media.removeListener(onChange);
      };
    }
  }

  layoutCleanup = (): void => {
    window.removeEventListener("resize", onResize);
    if (mediaCleanup !== null) {
      mediaCleanup();
    }
  };
}

function mountPostActions(ctx: FeatureContext): void {
  removeExistingPanel();

  const flexi = findFlexi();
  if (flexi === null) {
    log.warn(WARN_NO_FLEXI);
    return;
  }

  const host = document.createElement("div");
  host.id = POST_ACTIONS_ID;
  host.className = CLASS_PANEL;
  host.setAttribute("role", "complementary");
  host.setAttribute("aria-label", FEATURE_LABEL);

  const postId = readPostIdFromSearch(ctx.search);
  panelHost = host;
  document.body.classList.add(POST_PANEL_MOUNTED_CLASS);
  placePanel(host, flexi);
  bindLayout(host, flexi);
  render(h(PostPanel, { postId }), host);
}

export const postActionsFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  mount: mountPostActions,
};

export { mountPostActions };
