import { log } from "../log";
import {
  buildSearchUrl,
  buildUpdatesQueries,
  buildUpdatesSearchUrl,
} from "../search/query";
import type { Collection } from "../storage/schema";
import {
  getSeenPostId,
  getUpdatesGroupSize,
  listArtistTags,
  load,
} from "../storage/store";
import {
  TOPBAR_ID,
  TOPBAR_SLOT_LEFT_ID,
  TOPBAR_SLOT_PAGER_ID,
  featureBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

const FEATURE_ID = "top-bar";
const FEATURE_LABEL = "Top bar";
const FEATURE_PAGES = ["list", "post", "favorites"] as const;

const BAR_HEIGHT_PX = 44;
const BAR_Z_INDEX = 2147483640;
const FOCUS_OUTLINE = "2px solid #4c8bf5";
const FOCUS_OUTLINE_OFFSET = "2px";

const TAGS_INPUT_SELECTOR = 'input[name="tags"]';

const CLASS_BAR = "rdw-topbar";
const CLASS_SLOT = "rdw-topbar-slot";
const CLASS_SEARCH = "rdw-topbar-search";
const CLASS_COLLECTIONS = "rdw-topbar-collections";
const CLASS_UPDATES = "rdw-topbar-updates";

const TEXT_COLLECTIONS_ARIA = "Collections";
const TEXT_COLLECTIONS_PLACEHOLDER = "Collections";
const TEXT_UPDATES = "Updates";
const TEXT_UPDATES_ARIA = "Updates";
const WARN_MISSING_BODY = "top bar host missing; not mounted";
const WARN_MISSING_FORM = "site search form not found; top bar mounted without search";

const PLACEHOLDER_VALUE = "";

const BODY_FEATURE_CLASS = featureBodyClass(FEATURE_ID);
const BODY_SELECTOR = `body.${BODY_FEATURE_CLASS}`;

const FEATURE_CSS = `
${BODY_SELECTOR} {
  padding-top: ${String(BAR_HEIGHT_PX)}px;
}
${BODY_SELECTOR} #${TOPBAR_ID} {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: ${String(BAR_HEIGHT_PX)}px;
  z-index: ${String(BAR_Z_INDEX)};
  overflow: visible;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  padding: 0 8px;
  background: #111;
  color: #fff;
  border-bottom: 1px solid #333;
}
${BODY_SELECTOR} #${TOPBAR_ID} .${CLASS_SLOT} {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
${BODY_SELECTOR} #${TOPBAR_SLOT_PAGER_ID} {
  margin-left: auto;
}
${BODY_SELECTOR} #${TOPBAR_ID} form.${CLASS_SEARCH} {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  overflow: visible;
}
${BODY_SELECTOR} #${TOPBAR_ID} form.${CLASS_SEARCH} br {
  display: none;
}
${BODY_SELECTOR} #${TOPBAR_ID} .${CLASS_COLLECTIONS},
${BODY_SELECTOR} #${TOPBAR_ID} .${CLASS_UPDATES} {
  flex-shrink: 0;
}
${BODY_SELECTOR} #${TOPBAR_ID} .${CLASS_COLLECTIONS}:focus-visible,
${BODY_SELECTOR} #${TOPBAR_ID} .${CLASS_UPDATES}:focus-visible {
  outline: ${FOCUS_OUTLINE};
  outline-offset: ${FOCUS_OUTLINE_OFFSET};
}
`.trim();

function findSiteSearchForm(): HTMLFormElement | null {
  const input = document.querySelector(TAGS_INPUT_SELECTOR);
  if (!(input instanceof HTMLInputElement)) {
    return null;
  }
  const form = input.closest("form");
  if (!(form instanceof HTMLFormElement)) {
    return null;
  }
  return form;
}

function createSlot(id: string): HTMLDivElement {
  const slot = document.createElement("div");
  slot.id = id;
  slot.className = CLASS_SLOT;
  return slot;
}

function createCollectionsSelect(collections: Collection[]): HTMLSelectElement {
  const select = document.createElement("select");
  select.className = CLASS_COLLECTIONS;
  select.setAttribute("aria-label", TEXT_COLLECTIONS_ARIA);

  const placeholder = document.createElement("option");
  placeholder.value = PLACEHOLDER_VALUE;
  placeholder.textContent = TEXT_COLLECTIONS_PLACEHOLDER;
  select.append(placeholder);

  for (const collection of collections) {
    const option = document.createElement("option");
    option.value = collection.id;
    option.textContent = collection.name;
    select.append(option);
  }

  if (collections.length === 0) {
    select.hidden = true;
  }

  select.addEventListener("change", () => {
    const selectedId = select.value;
    if (selectedId === PLACEHOLDER_VALUE) {
      return;
    }
    const match = collections.find((entry) => entry.id === selectedId);
    if (match === undefined) {
      return;
    }
    window.location.assign(buildSearchUrl(match.tags));
  });

  return select;
}

function createUpdatesButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = CLASS_UPDATES;
  button.textContent = TEXT_UPDATES;
  button.setAttribute("aria-label", TEXT_UPDATES_ARIA);

  const queries = buildUpdatesQueries(
    listArtistTags(),
    getSeenPostId(),
    getUpdatesGroupSize(),
  );
  const firstQuery = queries[0];
  if (firstQuery === undefined) {
    button.disabled = true;
    return button;
  }

  button.addEventListener("click", () => {
    window.location.assign(buildUpdatesSearchUrl(firstQuery));
  });
  return button;
}

function mountTopBar(_ctx: FeatureContext): void {
  const body = document.body;
  if (body === null) {
    log.warn(WARN_MISSING_BODY);
    return;
  }

  if (document.getElementById(TOPBAR_ID) !== null) {
    return;
  }

  const bar = document.createElement("div");
  bar.id = TOPBAR_ID;
  bar.className = CLASS_BAR;

  const leftSlot = createSlot(TOPBAR_SLOT_LEFT_ID);
  bar.append(leftSlot);

  const form = findSiteSearchForm();
  if (form === null) {
    log.warn(WARN_MISSING_FORM);
  } else {
    form.classList.add(CLASS_SEARCH);
    bar.append(form);
  }

  const collections = load().collections;
  bar.append(createCollectionsSelect(collections));
  bar.append(createUpdatesButton());
  bar.append(createSlot(TOPBAR_SLOT_PAGER_ID));

  body.prepend(bar);
}

export const topBarFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  mount: mountTopBar,
};
