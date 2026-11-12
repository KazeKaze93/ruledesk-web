import { CSS_CLASS } from "../config/constants";
import {
  readSiteBlacklist,
  writeSiteBlacklist,
} from "../site/blacklist";

const SECTION_CLASS = "rdw-blacklist";
const CHIPS_CLASS = "rdw-blacklist-chips";
const CHIP_CLASS = "rdw-blacklist-chip";
const CHIP_LABEL_CLASS = "rdw-blacklist-chip-label";
const CHIP_REMOVE_CLASS = "rdw-blacklist-chip-remove";
const ADD_ROW_CLASS = "rdw-blacklist-add-row";
const SAVED_ROW_CLASS = "rdw-blacklist-saved-row";
const HINT_CLASS = "rdw-blacklist-hint";

const HEADING = "Blacklist";
const ADD_LABEL = "Add tag";
const ADD_BUTTON = "Add";
const SAVED_TEXT = "Saved. Reload the page to apply.";
const RELOAD_BUTTON = "Reload";
const PERMANENT_HINT =
  "Stored in this browser's site cookie. The list in your account settings is not changed and may overwrite this one after you log in again.";
const REMOVE_ARIA = (tag: string): string =>
  `Remove ${tag} from blacklist`;

const ADD_INPUT_ID = "rdw-blacklist-add";
const TAG_SPLIT_PATTERN = /[, ]+/;
const KEY_ENTER = "Enter";
const REMOVE_SYMBOL = "×";

export const BLACKLIST_SECTION_CSS = `
.${SECTION_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.${SECTION_CLASS} .${CHIPS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.${SECTION_CLASS} .${CHIP_CLASS} {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 2px 4px 2px 8px;
  border: 1px solid var(--rdw-border, #ccc);
  border-radius: 999px;
  background: var(--rdw-bg-item, #fff);
}

.${SECTION_CLASS} .${CHIP_LABEL_CLASS} {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}

.${SECTION_CLASS} .${CHIP_REMOVE_CLASS} {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--rdw-fg-muted, #555);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.${SECTION_CLASS} .${CHIP_REMOVE_CLASS}:focus-visible {
  outline: 2px solid var(--rdw-focus, #4c8bf5);
  outline-offset: 1px;
}

.${SECTION_CLASS} .${ADD_ROW_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-end;
}

.${SECTION_CLASS} .${ADD_ROW_CLASS} .${CSS_CLASS.field} {
  flex: 1 1 12rem;
  margin: 0;
}

.${SECTION_CLASS} .${SAVED_ROW_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.${SECTION_CLASS} .${SAVED_ROW_CLASS} .${CSS_CLASS.hint} {
  margin: 0;
}

.${SECTION_CLASS} .${HINT_CLASS} {
  margin: 0;
  color: var(--rdw-fg-muted, #555);
  font-size: 12px;
}
`.trim();

type BlacklistUiRefs = {
  chips: HTMLUListElement;
  input: HTMLInputElement;
};

function parseAddTokens(raw: string): string[] {
  const result: string[] = [];
  for (const part of raw.split(TAG_SPLIT_PATTERN)) {
    const trimmed = part.trim();
    if (trimmed.length === 0) {
      continue;
    }
    result.push(trimmed);
  }
  return result;
}

function persistTags(tags: readonly string[]): string[] {
  writeSiteBlacklist([...tags]);
  return readSiteBlacklist();
}

function renderChips(refs: BlacklistUiRefs, tags: readonly string[]): void {
  refs.chips.replaceChildren();
  for (const tag of tags) {
    const item = document.createElement("li");
    item.className = CHIP_CLASS;

    const label = document.createElement("span");
    label.className = CHIP_LABEL_CLASS;
    label.textContent = tag;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = CHIP_REMOVE_CLASS;
    removeBtn.textContent = REMOVE_SYMBOL;
    removeBtn.setAttribute("aria-label", REMOVE_ARIA(tag));
    removeBtn.addEventListener("click", () => {
      const next = readSiteBlacklist().filter((entry) => entry !== tag);
      renderChips(refs, persistTags(next));
    });

    item.append(label, removeBtn);
    refs.chips.append(item);
  }
}

function addFromInput(refs: BlacklistUiRefs): void {
  const tokens = parseAddTokens(refs.input.value);
  if (tokens.length === 0) {
    return;
  }
  const merged = [...readSiteBlacklist(), ...tokens];
  renderChips(refs, persistTags(merged));
  refs.input.value = "";
}

/**
 * Settings-tab editor for the site `tag_blacklist` cookie (browser only).
 */
export function createBlacklistSection(): HTMLElement {
  const section = document.createElement("section");
  section.className = `${CSS_CLASS.section} ${SECTION_CLASS}`;

  const title = document.createElement("h3");
  title.className = CSS_CLASS.sectionTitle;
  title.textContent = HEADING;

  const chips = document.createElement("ul");
  chips.className = CHIPS_CLASS;

  const addRow = document.createElement("div");
  addRow.className = ADD_ROW_CLASS;

  const field = document.createElement("div");
  field.className = CSS_CLASS.field;

  const label = document.createElement("label");
  label.className = CSS_CLASS.label;
  label.htmlFor = ADD_INPUT_ID;
  label.textContent = ADD_LABEL;

  const input = document.createElement("input");
  input.id = ADD_INPUT_ID;
  input.className = CSS_CLASS.input;
  input.type = "text";
  input.autocomplete = "off";
  input.spellcheck = false;

  field.append(label, input);

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = CSS_CLASS.primaryButton;
  addBtn.textContent = ADD_BUTTON;

  addRow.append(field, addBtn);

  const savedRow = document.createElement("div");
  savedRow.className = SAVED_ROW_CLASS;

  const savedText = document.createElement("p");
  savedText.className = CSS_CLASS.hint;
  savedText.textContent = SAVED_TEXT;

  const reloadBtn = document.createElement("button");
  reloadBtn.type = "button";
  reloadBtn.className = CSS_CLASS.secondaryButton;
  reloadBtn.textContent = RELOAD_BUTTON;
  reloadBtn.addEventListener("click", () => {
    window.location.reload();
  });

  savedRow.append(savedText, reloadBtn);

  const hint = document.createElement("p");
  hint.className = HINT_CLASS;
  hint.textContent = PERMANENT_HINT;

  section.append(title, chips, addRow, savedRow, hint);

  const refs: BlacklistUiRefs = { chips, input };
  renderChips(refs, readSiteBlacklist());

  addBtn.addEventListener("click", () => {
    addFromInput(refs);
  });
  input.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key !== KEY_ENTER) {
      return;
    }
    event.preventDefault();
    addFromInput(refs);
  });

  return section;
}
