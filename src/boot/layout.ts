/**
 * DOM-ready, still before first paint yield: layout-affecting body classes + CSS.
 * Does not mount thumb buttons, search Preact panel, feed, marks, etc.
 */

import { ensureStyleElement } from "./appearance-dom";
import {
  peekLayoutSettings,
  resolveFeatureChoice,
  resolveFeatureEnabled,
} from "./cheap-appearance";
import { gridDensityFeature } from "../features/grid-density";
import { menuCleanupFeature } from "../features/menu-cleanup";
import { applyFeatureChrome } from "../features/runtime";
import { featureBodyClass, type Feature } from "../features/types";
import { detectPageKind } from "../site/pages";

/** Must match search-tools root id/class (feature owns mount; we only reserve). */
const SEARCH_TOOLS_FEATURE_ID = "search-tools";
const SEARCH_TOOLS_ROOT_ID = "rdw-search-tools";
const SEARCH_TOOLS_ROOT_CLASS = "rdw-search-tools";
const SEARCH_TOOLS_RESERVE_STYLE_ID = "rdw-search-tools-reserve";
/** Approx panel height (chips + media + sort + source + foot) to avoid layout jump. */
const SEARCH_TOOLS_RESERVE_MIN_HEIGHT_PX = 168;
const SEARCH_TOOLS_RESERVE_MARGIN_TOP_PX = 8;
const TAGS_INPUT_SELECTOR = 'input[name="tags"]';

const LAYOUT_FEATURES: readonly Feature[] = [
  menuCleanupFeature,
  gridDensityFeature,
];

function buildSearchReserveCss(bodyClass: string): string {
  return [
    `body.${bodyClass} #${SEARCH_TOOLS_ROOT_ID} {`,
    `  min-height: ${String(SEARCH_TOOLS_RESERVE_MIN_HEIGHT_PX)}px;`,
    `  margin-top: ${String(SEARCH_TOOLS_RESERVE_MARGIN_TOP_PX)}px;`,
    "  box-sizing: border-box;",
    "}",
  ].join("\n");
}

function ensureSearchToolsPlaceholder(): void {
  const input = document.querySelector(TAGS_INPUT_SELECTOR);
  if (!(input instanceof HTMLInputElement)) {
    return;
  }
  const form = input.closest("form");
  if (!(form instanceof HTMLFormElement)) {
    return;
  }
  const existing = document.getElementById(SEARCH_TOOLS_ROOT_ID);
  if (existing instanceof HTMLDivElement) {
    if (existing.previousElementSibling !== form) {
      form.after(existing);
    }
    return;
  }
  const root = document.createElement("div");
  root.id = SEARCH_TOOLS_ROOT_ID;
  root.className = SEARCH_TOOLS_ROOT_CLASS;
  form.after(root);
}

/**
 * Apply grid-density / menu-cleanup chrome (+ menu mount) and reserve search
 * panel space. Uses cached cheap layout settings (no store.load / zod).
 */
export function applyLayoutBeforePaint(): void {
  const pageKind = detectPageKind(window.location.search);
  const search = window.location.search;
  const layout = peekLayoutSettings();

  for (const feature of LAYOUT_FEATURES) {
    if (!feature.pages.includes(pageKind)) {
      continue;
    }
    if (!resolveFeatureEnabled(layout, feature.id, feature.defaultEnabled)) {
      continue;
    }
    const choiceValue =
      feature.choice !== undefined
        ? resolveFeatureChoice(
            layout,
            feature.id,
            feature.choice.defaultValue,
            feature.choice.options.map((option) => option.value),
          )
        : undefined;
    applyFeatureChrome(feature, pageKind, search, {
      ...(choiceValue !== undefined ? { choiceValue } : {}),
    });
  }

  if (
    (pageKind === "list" || pageKind === "post") &&
    resolveFeatureEnabled(layout, SEARCH_TOOLS_FEATURE_ID, true)
  ) {
    const bodyClass = featureBodyClass(SEARCH_TOOLS_FEATURE_ID);
    document.body.classList.add(bodyClass);
    const style = ensureStyleElement(SEARCH_TOOLS_RESERVE_STYLE_ID);
    style.textContent = buildSearchReserveCss(bodyClass);
    ensureSearchToolsPlaceholder();
  }
}
