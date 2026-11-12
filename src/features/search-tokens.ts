import { log } from "../log";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";

const FEATURE_ID = "search-tokens";
const FEATURE_LABEL =
  "Show search tags as a list under the search field";
const FEATURE_PAGES = ["list", "post"] as const;

const TAGS_INPUT_SELECTOR = 'input[name="tags"]';
const TAG_SIDEBAR_SELECTOR = "ul#tag-sidebar";

const ROOT_ID = "rdw-search-tokens";
const ROOT_CLASS = "rdw-search-tokens";
const TOKEN_CLASS = "rdw-search-token";
const TOKEN_EXCLUDE_CLASS = "rdw-search-token--exclude";
const HIDDEN_CLASS = "rdw-search-tokens--hidden";

const EXCLUDE_PREFIX = "-";
const TOKEN_SPLIT_RE = /\s+/;
const MULTI_SPACE_RE = /\s+/g;
const POLL_INTERVAL_MS = 700;

const EVENT_INPUT = "input";
const EVENT_CHANGE = "change";
const EVENT_AWESOMPLETE_SELECT = "awesomplete-selectcomplete";
const EVENT_AWESOMPLETE_CLOSE = "awesomplete-close";
const EVENT_CLICK = "click";

const WARN_NO_FORM = "search-tokens: search form not found; not mounted";

const BODY_CLASS = featureBodyClass(FEATURE_ID);

const FEATURE_CSS = [
  `body.${BODY_CLASS} .${ROOT_CLASS} {`,
  "  display: flex;",
  "  flex-wrap: wrap;",
  "  gap: 0.25rem;",
  "  max-width: 100%;",
  "  margin: 0.25rem 0;",
  "}",
  `body.${BODY_CLASS} .${ROOT_CLASS}.${HIDDEN_CLASS} {`,
  "  display: none;",
  "}",
  `body.${BODY_CLASS} button.${TOKEN_CLASS} {`,
  "  max-width: 100%;",
  "  overflow-wrap: anywhere;",
  "  word-break: break-word;",
  "  font: inherit;",
  "  line-height: 1.2;",
  "  padding: 0.1rem 0.35rem;",
  "  border: 1px solid #666;",
  "  border-radius: 2px;",
  "  background: #f0f0f0;",
  "  color: inherit;",
  "  cursor: pointer;",
  "}",
  `body.${BODY_CLASS} button.${TOKEN_CLASS}.${TOKEN_EXCLUDE_CLASS} {`,
  "  background: #f5e0e0;",
  "  border-color: #a66;",
  "}",
  `body.${BODY_CLASS} button.${TOKEN_CLASS}:focus-visible {`,
  "  outline: 2px solid #4c8bf5;",
  "  outline-offset: 2px;",
  "}",
].join("\n");

function findTagsInput(): HTMLInputElement | null {
  const input = document.querySelector(TAGS_INPUT_SELECTOR);
  return input instanceof HTMLInputElement ? input : null;
}

function findSearchForm(input: HTMLInputElement): HTMLFormElement | null {
  const form = input.closest("form");
  return form instanceof HTMLFormElement ? form : null;
}

function parseTokens(value: string): string[] {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return [];
  }
  return trimmed.split(TOKEN_SPLIT_RE).filter((token) => token.length > 0);
}

function normalizeSpaces(value: string): string {
  return value.replace(MULTI_SPACE_RE, " ").trim();
}

function removeTokenAt(value: string, index: number): string {
  const tokens = parseTokens(value);
  if (index < 0 || index >= tokens.length) {
    return normalizeSpaces(value);
  }
  tokens.splice(index, 1);
  return tokens.join(" ");
}

function ariaLabelForToken(token: string): string {
  return `Remove ${token} from search`;
}

function ensureRoot(form: HTMLFormElement): HTMLDivElement {
  const existing = document.getElementById(ROOT_ID);
  if (existing instanceof HTMLDivElement) {
    if (existing.previousElementSibling !== form) {
      form.after(existing);
    }
    return existing;
  }
  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = ROOT_CLASS;
  form.after(root);
  return root;
}

function renderTokens(root: HTMLDivElement, input: HTMLInputElement): void {
  const tokens = parseTokens(input.value);
  root.replaceChildren();
  if (tokens.length === 0) {
    root.classList.add(HIDDEN_CLASS);
    return;
  }
  root.classList.remove(HIDDEN_CLASS);

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === undefined) {
      continue;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = TOKEN_CLASS;
    if (token.startsWith(EXCLUDE_PREFIX)) {
      button.classList.add(TOKEN_EXCLUDE_CLASS);
    }
    button.textContent = token;
    button.setAttribute("aria-label", ariaLabelForToken(token));
    const tokenIndex = index;
    button.addEventListener(EVENT_CLICK, () => {
      input.value = removeTokenAt(input.value, tokenIndex);
      input.dispatchEvent(new Event(EVENT_INPUT, { bubbles: true }));
      input.focus();
      renderTokens(root, input);
    });
    root.append(button);
  }
}

function mountSearchTokens(_ctx: FeatureContext): void {
  const input = findTagsInput();
  if (input === null) {
    log.warn(WARN_NO_FORM);
    return;
  }
  const form = findSearchForm(input);
  if (form === null) {
    log.warn(WARN_NO_FORM);
    return;
  }

  const root = ensureRoot(form);
  let lastValue = input.value;
  renderTokens(root, input);

  const refresh = (): void => {
    lastValue = input.value;
    renderTokens(root, input);
  };

  const onInputLike = (): void => {
    refresh();
  };

  input.addEventListener(EVENT_INPUT, onInputLike);
  input.addEventListener(EVENT_CHANGE, onInputLike);
  input.addEventListener(EVENT_AWESOMPLETE_SELECT, onInputLike);
  input.addEventListener(EVENT_AWESOMPLETE_CLOSE, onInputLike);

  const sidebar = document.querySelector(TAG_SIDEBAR_SELECTOR);
  if (sidebar !== null) {
    sidebar.addEventListener(EVENT_CLICK, () => {
      window.setTimeout(() => {
        refresh();
      }, 0);
    });
  }

  window.setInterval(() => {
    if (document.hidden) {
      return;
    }
    if (input.value === lastValue) {
      return;
    }
    refresh();
  }, POLL_INTERVAL_MS);
}

export const searchTokensFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  mount: mountSearchTokens,
};
