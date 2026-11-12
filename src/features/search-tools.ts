import {
  EXCLUDE_PREFIX,
  FAVORITES_PAGE,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_TAGS,
  SITE_ORIGIN,
  TAG_SEPARATOR,
  UPDATES_OR_CLOSE,
  UPDATES_OR_JOIN,
  UPDATES_OR_OPEN,
} from "../config/constants";
import { log } from "../log";
import {
  buildFeedUrl,
  buildPlaylistQueries,
  buildSearchUrl,
  buildUpdatesSearchUrl,
  isFullUpdatesQuery,
  isPartialUpdatesQuery,
  parseTags,
} from "../search/query";
import { isPlaylist } from "../storage/schema";
import {
  addCollection,
  getPlaylistChunkSize,
  getUpdatesGroupSize,
  listArtistTags,
  load,
} from "../storage/store";
import { featureBodyClass, type Feature, type FeatureContext } from "./types";

const FEATURE_ID = "search-tools";
const FEATURE_LABEL = "Search tools";
const FEATURE_PAGES = ["list", "post"] as const;

const TAGS_INPUT_SELECTOR = 'input[name="tags"]';
const TAG_SIDEBAR_SELECTOR = "ul#tag-sidebar";
const MY_FAVORITES_LINK_SELECTOR =
  'li#my-favorites-container a[href*="page=favorites"]';

const ROOT_ID = "rdw-search-tools";
const ROOT_CLASS = "rdw-search-tools";
const CHIPS_CLASS = "rdw-search-tools-chips";
const CHIPS_HIDDEN_CLASS = "rdw-search-tools-chips--hidden";
const CHIP_CLASS = "rdw-search-tools-chip";
const CHIP_EXCLUDE_CLASS = "rdw-search-tools-chip--exclude";
const CHIP_LABEL_CLASS = "rdw-search-tools-chip-label";
const CHIP_TOGGLE_CLASS = "rdw-search-tools-chip-toggle";
const CHIP_REMOVE_CLASS = "rdw-search-tools-chip-remove";
const ROW_CLASS = "rdw-search-tools-row";
const MEDIA_CLASS = "rdw-search-tools-media";
const MEDIA_BTN_CLASS = "rdw-search-tools-media-btn";
const MEDIA_PRESSED_CLASS = "rdw-search-tools-media-btn--pressed";
const SORT_CLASS = "rdw-search-tools-sort";
const SCORE_CLASS = "rdw-search-tools-score";
const SCORE_INPUT_CLASS = "rdw-search-tools-score-input";
const SOURCE_CLASS = "rdw-search-tools-source";
const COLLECTIONS_CLASS = "rdw-search-tools-collections";
const SAVE_CLASS = "rdw-search-tools-save";
const SAVE_BTN_CLASS = "rdw-search-tools-save-btn";
const SAVE_FORM_CLASS = "rdw-search-tools-save-form";
const SAVE_NAME_CLASS = "rdw-search-tools-save-name";
const SAVE_CONFIRM_CLASS = "rdw-search-tools-save-confirm";
const SAVE_CANCEL_CLASS = "rdw-search-tools-save-cancel";
const SELECT_CLASS = "rdw-search-tools-select";
const LABEL_CLASS = "rdw-search-tools-label";

const TOKEN_SPLIT_RE = /\s+/;
const MULTI_SPACE_RE = /\s+/g;
const POLL_INTERVAL_MS = 700;
const META_SEP = ":";
const SCORE_TOKEN_PREFIX = "score:>=";
const SCORE_TOKEN_RE = /^score:>=(\d+)$/;
const SORT_TOKEN_PREFIX = "sort:";
const MEDIA_VIDEO = "video";
const MEDIA_IMAGES = `${EXCLUDE_PREFIX}${MEDIA_VIDEO}`;
const TAG_TYPE_CLASS_PREFIX = "tag-type-";

const EVENT_INPUT = "input";
const EVENT_CHANGE = "change";
const EVENT_CLICK = "click";
const EVENT_BLUR = "blur";
const EVENT_KEYDOWN = "keydown";
const EVENT_AWESOMPLETE_SELECT = "awesomplete-selectcomplete";
const KEY_ENTER = "Enter";

const WARN_NO_FORM = "search-tools: search form not found; not mounted";

const BODY_CLASS = featureBodyClass(FEATURE_ID);

const TAG_TYPES = [
  "artist",
  "character",
  "copyright",
  "general",
  "metadata",
] as const;

type TagType = (typeof TAG_TYPES)[number];

function isTagType(value: string): value is TagType {
  for (const entry of TAG_TYPES) {
    if (entry === value) {
      return true;
    }
  }
  return false;
}

const PAREN_TOKENS: ReadonlySet<string> = new Set([
  UPDATES_OR_OPEN,
  UPDATES_OR_CLOSE,
  UPDATES_OR_JOIN,
]);

type MediaMode = "all" | "images" | "videos";
type SortMode =
  | "newest"
  | "oldest"
  | "score"
  | "updated"
  | "random";
type SourceMode = "all" | "followed" | "favorites";

const MEDIA_OPTIONS: ReadonlyArray<{ value: MediaMode; label: string }> = [
  { value: "all", label: "All" },
  { value: "images", label: "Images" },
  { value: "videos", label: "Videos" },
];

const SORT_OPTIONS: ReadonlyArray<{
  value: SortMode;
  label: string;
  token: string | null;
}> = [
  { value: "newest", label: "Newest", token: null },
  { value: "oldest", label: "Oldest", token: "sort:id:asc" },
  { value: "score", label: "Top score", token: "sort:score:desc" },
  {
    value: "updated",
    label: "Recently updated",
    token: "sort:updated:desc",
  },
  { value: "random", label: "Random", token: "sort:random" },
];

const SORT_TOKEN_TO_MODE = new Map<string, SortMode>();
for (const option of SORT_OPTIONS) {
  if (option.token !== null) {
    SORT_TOKEN_TO_MODE.set(option.token, option.value);
  }
}

const FEATURE_CSS = [
  `body.${BODY_CLASS} .${ROOT_CLASS} {`,
  "  display: flex;",
  "  flex-direction: column;",
  "  gap: 0.35rem;",
  "  max-width: 100%;",
  "  margin: 0.35rem 0;",
  "  box-sizing: border-box;",
  "}",
  `body.${BODY_CLASS} .${CHIPS_CLASS} {`,
  "  display: flex;",
  "  flex-wrap: wrap;",
  "  gap: 0.25rem;",
  "  max-width: 100%;",
  "}",
  `body.${BODY_CLASS} .${CHIPS_CLASS}.${CHIPS_HIDDEN_CLASS} {`,
  "  display: none;",
  "}",
  `body.${BODY_CLASS} .${CHIP_CLASS} {`,
  "  display: inline-flex;",
  "  align-items: center;",
  "  max-width: 100%;",
  "  gap: 0.15rem;",
  "  padding: 0.1rem 0.2rem 0.1rem 0.35rem;",
  "  border: 1px solid #666;",
  "  border-radius: 2px;",
  "  background: #f0f0f0;",
  "  color: inherit;",
  "  box-sizing: border-box;",
  "}",
  `body.${BODY_CLASS} .${CHIP_CLASS}.${CHIP_EXCLUDE_CLASS} {`,
  "  background: #f5e0e0;",
  "  border-color: #a66;",
  "}",
  `body.${BODY_CLASS} .${CHIP_CLASS}--artist {`,
  "  background: #fde8e8;",
  "  border-color: #a00;",
  "  color: #a00;",
  "}",
  `body.${BODY_CLASS} .${CHIP_CLASS}--character {`,
  "  background: #e8fde8;",
  "  border-color: #0a0;",
  "  color: #0a0;",
  "}",
  `body.${BODY_CLASS} .${CHIP_CLASS}--copyright {`,
  "  background: #f8e8fd;",
  "  border-color: #a0a;",
  "  color: #a0a;",
  "}",
  `body.${BODY_CLASS} .${CHIP_CLASS}--general {`,
  "  background: #e8f0fd;",
  "  border-color: #07f;",
  "  color: #07f;",
  "}",
  `body.${BODY_CLASS} .${CHIP_CLASS}--metadata {`,
  "  background: #eee;",
  "  border-color: #666;",
  "  color: #444;",
  "}",
  `body.${BODY_CLASS} .${CHIP_CLASS}.${CHIP_EXCLUDE_CLASS}.${CHIP_CLASS}--artist,`,
  `body.${BODY_CLASS} .${CHIP_CLASS}.${CHIP_EXCLUDE_CLASS}.${CHIP_CLASS}--character,`,
  `body.${BODY_CLASS} .${CHIP_CLASS}.${CHIP_EXCLUDE_CLASS}.${CHIP_CLASS}--copyright,`,
  `body.${BODY_CLASS} .${CHIP_CLASS}.${CHIP_EXCLUDE_CLASS}.${CHIP_CLASS}--general,`,
  `body.${BODY_CLASS} .${CHIP_CLASS}.${CHIP_EXCLUDE_CLASS}.${CHIP_CLASS}--metadata {`,
  "  background: #f5e0e0;",
  "  border-color: #a66;",
  "  color: inherit;",
  "}",
  `body.${BODY_CLASS} .${CHIP_LABEL_CLASS},`,
  `body.${BODY_CLASS} button.${CHIP_TOGGLE_CLASS} {`,
  "  max-width: 100%;",
  "  overflow-wrap: anywhere;",
  "  word-break: break-word;",
  "  font: inherit;",
  "  line-height: 1.2;",
  "  padding: 0;",
  "  border: none;",
  "  background: transparent;",
  "  color: inherit;",
  "  cursor: pointer;",
  "  text-align: left;",
  "}",
  `body.${BODY_CLASS} .${CHIP_LABEL_CLASS} {`,
  "  cursor: default;",
  "}",
  `body.${BODY_CLASS} button.${CHIP_REMOVE_CLASS} {`,
  "  flex: 0 0 auto;",
  "  font: inherit;",
  "  line-height: 1;",
  "  padding: 0 0.2rem;",
  "  border: none;",
  "  border-radius: 2px;",
  "  background: transparent;",
  "  color: inherit;",
  "  cursor: pointer;",
  "}",
  `body.${BODY_CLASS} button.${CHIP_TOGGLE_CLASS}:focus-visible,`,
  `body.${BODY_CLASS} button.${CHIP_REMOVE_CLASS}:focus-visible,`,
  `body.${BODY_CLASS} button.${MEDIA_BTN_CLASS}:focus-visible,`,
  `body.${BODY_CLASS} button.${SAVE_BTN_CLASS}:focus-visible,`,
  `body.${BODY_CLASS} button.${SAVE_CONFIRM_CLASS}:focus-visible,`,
  `body.${BODY_CLASS} button.${SAVE_CANCEL_CLASS}:focus-visible,`,
  `body.${BODY_CLASS} .${SELECT_CLASS}:focus-visible,`,
  `body.${BODY_CLASS} .${SCORE_INPUT_CLASS}:focus-visible,`,
  `body.${BODY_CLASS} .${SAVE_NAME_CLASS}:focus-visible {`,
  "  outline: 2px solid #4c8bf5;",
  "  outline-offset: 2px;",
  "}",
  `body.${BODY_CLASS} .${ROW_CLASS} {`,
  "  display: flex;",
  "  flex-wrap: wrap;",
  "  align-items: center;",
  "  gap: 0.35rem;",
  "  max-width: 100%;",
  "}",
  `body.${BODY_CLASS} .${LABEL_CLASS} {`,
  "  flex: 0 0 auto;",
  "  font: inherit;",
  "}",
  `body.${BODY_CLASS} .${MEDIA_CLASS} {`,
  "  display: flex;",
  "  flex-wrap: wrap;",
  "  gap: 0.25rem;",
  "  max-width: 100%;",
  "}",
  `body.${BODY_CLASS} button.${MEDIA_BTN_CLASS} {`,
  "  font: inherit;",
  "  line-height: 1.2;",
  "  padding: 0.15rem 0.4rem;",
  "  border: 1px solid #666;",
  "  border-radius: 2px;",
  "  background: #f7f7f7;",
  "  color: inherit;",
  "  cursor: pointer;",
  "}",
  `body.${BODY_CLASS} button.${MEDIA_BTN_CLASS}.${MEDIA_PRESSED_CLASS} {`,
  "  background: #dbe7fb;",
  "  border-color: #4c8bf5;",
  "}",
  `body.${BODY_CLASS} .${SELECT_CLASS},`,
  `body.${BODY_CLASS} .${SCORE_INPUT_CLASS},`,
  `body.${BODY_CLASS} .${SAVE_NAME_CLASS} {`,
  "  max-width: 100%;",
  "  min-width: 0;",
  "  flex: 1 1 8rem;",
  "  font: inherit;",
  "  box-sizing: border-box;",
  "}",
  `body.${BODY_CLASS} .${SCORE_INPUT_CLASS} {`,
  "  flex: 0 1 5rem;",
  "  width: 5rem;",
  "}",
  `body.${BODY_CLASS} button.${SAVE_BTN_CLASS},`,
  `body.${BODY_CLASS} button.${SAVE_CONFIRM_CLASS},`,
  `body.${BODY_CLASS} button.${SAVE_CANCEL_CLASS} {`,
  "  font: inherit;",
  "  line-height: 1.2;",
  "  padding: 0.15rem 0.4rem;",
  "  border: 1px solid #666;",
  "  border-radius: 2px;",
  "  background: #f7f7f7;",
  "  color: inherit;",
  "  cursor: pointer;",
  "  flex: 0 0 auto;",
  "}",
  `body.${BODY_CLASS} button.${SAVE_BTN_CLASS}:disabled {`,
  "  opacity: 0.5;",
  "  cursor: default;",
  "}",
  `body.${BODY_CLASS} .${SAVE_FORM_CLASS} {`,
  "  display: flex;",
  "  flex-wrap: wrap;",
  "  gap: 0.25rem;",
  "  max-width: 100%;",
  "  flex: 1 1 100%;",
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

function joinTokens(tokens: readonly string[]): string {
  return tokens.join(TAG_SEPARATOR);
}

function bareTag(token: string): string {
  if (token.startsWith(EXCLUDE_PREFIX) && token.length > EXCLUDE_PREFIX.length) {
    return token.slice(EXCLUDE_PREFIX.length);
  }
  return token;
}

function normalizeTagKey(raw: string): string {
  return raw.trim().toLowerCase().replaceAll(" ", "_");
}

function isMetaToken(token: string): boolean {
  return bareTag(token).includes(META_SEP);
}

function isParenToken(token: string): boolean {
  return PAREN_TOKENS.has(token);
}

function isToggleableToken(token: string): boolean {
  if (isParenToken(token)) {
    return false;
  }
  if (isMetaToken(token)) {
    return false;
  }
  return true;
}

function isMediaToken(token: string): boolean {
  return token === MEDIA_VIDEO || token === MEDIA_IMAGES;
}

function isSortToken(token: string): boolean {
  return bareTag(token).startsWith(SORT_TOKEN_PREFIX);
}

function isScoreToken(token: string): boolean {
  return SCORE_TOKEN_RE.test(bareTag(token));
}

function isControlledToken(token: string): boolean {
  return isMediaToken(token) || isSortToken(token) || isScoreToken(token);
}

function readMediaMode(tokens: readonly string[]): MediaMode {
  let hasVideo = false;
  let hasImages = false;
  for (const token of tokens) {
    if (token === MEDIA_VIDEO) {
      hasVideo = true;
    } else if (token === MEDIA_IMAGES) {
      hasImages = true;
    }
  }
  if (hasVideo) {
    return "videos";
  }
  if (hasImages) {
    return "images";
  }
  return "all";
}

function readSortMode(tokens: readonly string[]): SortMode {
  for (const token of tokens) {
    const bare = bareTag(token);
    const mode = SORT_TOKEN_TO_MODE.get(bare);
    if (mode !== undefined) {
      return mode;
    }
  }
  return "newest";
}

function readMinScore(tokens: readonly string[]): number | null {
  for (const token of tokens) {
    const match = SCORE_TOKEN_RE.exec(bareTag(token));
    if (match === null) {
      continue;
    }
    const raw = match[1];
    if (raw === undefined) {
      continue;
    }
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }
  return null;
}

function freeTokens(tokens: readonly string[]): string[] {
  return tokens.filter((token) => !isControlledToken(token));
}

function sortTokenForMode(mode: SortMode): string | null {
  const option = SORT_OPTIONS.find((entry) => entry.value === mode);
  return option?.token ?? null;
}

function buildTokenSet(
  current: readonly string[],
  media: MediaMode,
  sort: SortMode,
  minScore: number | null,
): string[] {
  const next = freeTokens(current);
  if (media === "images") {
    next.push(MEDIA_IMAGES);
  } else if (media === "videos") {
    next.push(MEDIA_VIDEO);
  }
  const sortToken = sortTokenForMode(sort);
  if (sortToken !== null) {
    next.push(sortToken);
  }
  if (minScore !== null && minScore > 0) {
    next.push(`${SCORE_TOKEN_PREFIX}${String(minScore)}`);
  }
  return next;
}

function navigateTokens(tokens: readonly string[]): void {
  window.location.assign(buildSearchUrl(parseTags(joinTokens(tokens))));
}

function toggleExclude(token: string): string {
  if (token.startsWith(EXCLUDE_PREFIX) && token.length > EXCLUDE_PREFIX.length) {
    return token.slice(EXCLUDE_PREFIX.length);
  }
  return `${EXCLUDE_PREFIX}${token}`;
}

function removeTokenAt(tokens: readonly string[], index: number): string[] {
  if (index < 0 || index >= tokens.length) {
    return [...tokens];
  }
  return tokens.filter((_, tokenIndex) => tokenIndex !== index);
}

function replaceTokenAt(
  tokens: readonly string[],
  index: number,
  nextToken: string,
): string[] {
  return tokens.map((token, tokenIndex) =>
    tokenIndex === index ? nextToken : token,
  );
}

function chipTypeClass(tagType: TagType | null): string | null {
  if (tagType === null) {
    return null;
  }
  return `${CHIP_CLASS}--${tagType}`;
}

function readTagTypeFromClassList(classList: DOMTokenList): TagType | null {
  for (const className of classList) {
    if (!className.startsWith(TAG_TYPE_CLASS_PREFIX)) {
      continue;
    }
    const typeName = className.slice(TAG_TYPE_CLASS_PREFIX.length);
    if (isTagType(typeName)) {
      return typeName;
    }
  }
  return null;
}

function extractSidebarTag(li: Element): string | null {
  const links = li.querySelectorAll("a[href]");
  for (const node of links) {
    if (!(node instanceof HTMLAnchorElement)) {
      continue;
    }
    const href = node.getAttribute("href");
    if (href === null || href.length === 0) {
      continue;
    }
    let url: URL;
    try {
      url = new URL(href, SITE_ORIGIN);
    } catch {
      continue;
    }
    const tags = url.searchParams.get(SEARCH_PARAM_TAGS);
    if (tags !== null && tags.trim().length > 0) {
      const first = parseTokens(tags)[0];
      if (first !== undefined) {
        return normalizeTagKey(bareTag(first));
      }
    }
    const text = node.textContent?.trim() ?? "";
    if (text.length > 0) {
      return normalizeTagKey(text);
    }
  }
  return null;
}

function buildSidebarTagTypes(): Map<string, TagType> {
  const map = new Map<string, TagType>();
  const sidebar = document.querySelector(TAG_SIDEBAR_SELECTOR);
  if (!(sidebar instanceof HTMLUListElement)) {
    return map;
  }
  for (const child of sidebar.children) {
    if (!(child instanceof HTMLLIElement)) {
      continue;
    }
    const tagType = readTagTypeFromClassList(child.classList);
    if (tagType === null) {
      continue;
    }
    const tag = extractSidebarTag(child);
    if (tag === null) {
      continue;
    }
    map.set(tag, tagType);
  }
  return map;
}

function findFavoritesHref(): string | null {
  const anchor = document.querySelector(MY_FAVORITES_LINK_SELECTOR);
  if (!(anchor instanceof HTMLAnchorElement)) {
    return null;
  }
  const href = anchor.getAttribute("href");
  if (href === null || href.trim().length === 0) {
    return null;
  }
  return href;
}

function detectSourceMode(search: string): SourceMode {
  const params = new URLSearchParams(search);
  if (params.get(SEARCH_PARAM_PAGE) === FAVORITES_PAGE) {
    return "favorites";
  }
  const tagsRaw = params.get(SEARCH_PARAM_TAGS) ?? "";
  const artists = listArtistTags();
  if (
    isFullUpdatesQuery(tagsRaw, artists) ||
    isPartialUpdatesQuery(tagsRaw, artists)
  ) {
    return "followed";
  }
  return "all";
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

function setInputTokens(input: HTMLInputElement, tokens: readonly string[]): void {
  input.value = normalizeSpaces(joinTokens(tokens));
  input.dispatchEvent(new Event(EVENT_INPUT, { bubbles: true }));
}

type MountRefs = {
  input: HTMLInputElement;
  chips: HTMLDivElement;
  mediaButtons: Map<MediaMode, HTMLButtonElement>;
  sortSelect: HTMLSelectElement;
  scoreInput: HTMLInputElement;
  sourceSelect: HTMLSelectElement;
  collectionsSelect: HTMLSelectElement;
  saveBtn: HTMLButtonElement;
  saveForm: HTMLDivElement;
  saveName: HTMLInputElement;
};

function renderChips(refs: MountRefs): void {
  const tokens = parseTokens(refs.input.value);
  const tagTypes = buildSidebarTagTypes();
  refs.chips.replaceChildren();

  let visibleCount = 0;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === undefined) {
      continue;
    }
    if (isControlledToken(token)) {
      continue;
    }
    visibleCount += 1;

    const chip = document.createElement("span");
    chip.className = CHIP_CLASS;
    if (token.startsWith(EXCLUDE_PREFIX) && token.length > EXCLUDE_PREFIX.length) {
      chip.classList.add(CHIP_EXCLUDE_CLASS);
    }
    const typeClass = chipTypeClass(
      tagTypes.get(normalizeTagKey(bareTag(token))) ?? null,
    );
    if (typeClass !== null) {
      chip.classList.add(typeClass);
    }

    const tokenIndex = index;
    if (isToggleableToken(token)) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = CHIP_TOGGLE_CLASS;
      toggle.textContent = token;
      toggle.addEventListener(EVENT_CLICK, () => {
        const current = parseTokens(refs.input.value);
        const currentToken = current[tokenIndex];
        if (currentToken === undefined) {
          return;
        }
        setInputTokens(
          refs.input,
          replaceTokenAt(current, tokenIndex, toggleExclude(currentToken)),
        );
        syncFromInput(refs);
      });
      chip.append(toggle);
    } else {
      const label = document.createElement("span");
      label.className = CHIP_LABEL_CLASS;
      label.textContent = token;
      chip.append(label);
    }

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = CHIP_REMOVE_CLASS;
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Remove ${token}`);
    remove.addEventListener(EVENT_CLICK, () => {
      const current = parseTokens(refs.input.value);
      setInputTokens(refs.input, removeTokenAt(current, tokenIndex));
      syncFromInput(refs);
    });
    chip.append(remove);
    refs.chips.append(chip);
  }

  refs.chips.classList.toggle(CHIPS_HIDDEN_CLASS, visibleCount === 0);
}

function syncControls(refs: MountRefs): void {
  const tokens = parseTokens(refs.input.value);
  const media = readMediaMode(tokens);
  for (const [value, button] of refs.mediaButtons) {
    const pressed = value === media;
    button.setAttribute("aria-pressed", pressed ? "true" : "false");
    button.classList.toggle(MEDIA_PRESSED_CLASS, pressed);
  }

  refs.sortSelect.value = readSortMode(tokens);
  const minScore = readMinScore(tokens);
  refs.scoreInput.value = minScore === null ? "" : String(minScore);

  const artists = listArtistTags();
  const followedOption = refs.sourceSelect.querySelector(
    'option[value="followed"]',
  );
  if (followedOption instanceof HTMLOptionElement) {
    followedOption.disabled = artists.length === 0;
  }
  refs.sourceSelect.value = detectSourceMode(window.location.search);

  const queryEmpty = normalizeSpaces(refs.input.value).length === 0;
  refs.saveBtn.disabled = queryEmpty;
}

function syncFromInput(refs: MountRefs): void {
  renderChips(refs);
  syncControls(refs);
}

function applyControlNavigation(
  refs: MountRefs,
  media: MediaMode,
  sort: SortMode,
  minScore: number | null,
): void {
  const next = buildTokenSet(parseTokens(refs.input.value), media, sort, minScore);
  setInputTokens(refs.input, next);
  syncFromInput(refs);
  navigateTokens(next);
}

function appendCollectionOptions(
  host: HTMLElement,
  collections: ReturnType<typeof load>["collections"],
): void {
  for (const collection of collections) {
    const option = document.createElement("option");
    option.value = collection.id;
    option.textContent = collection.name;
    host.append(option);
  }
}

function rebuildCollectionsSelect(select: HTMLSelectElement): void {
  const previous = select.value;
  select.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Collections";
  placeholder.disabled = true;
  placeholder.selected = true;
  select.append(placeholder);

  const collections = load().collections;
  const searches = collections.filter((entry) => !isPlaylist(entry));
  const playlists = collections.filter((entry) => isPlaylist(entry));

  if (searches.length > 0) {
    const group = document.createElement("optgroup");
    group.label = "Saved searches";
    appendCollectionOptions(group, searches);
    select.append(group);
  }

  if (playlists.length > 0) {
    const group = document.createElement("optgroup");
    group.label = "Playlists";
    appendCollectionOptions(group, playlists);
    select.append(group);
  }

  if (
    previous.length > 0 &&
    collections.some((collection) => collection.id === previous)
  ) {
    select.value = previous;
  }
}

function buildMediaRow(refs: MountRefs): HTMLDivElement {
  const row = document.createElement("div");
  row.className = `${ROW_CLASS} ${MEDIA_CLASS}`;

  const label = document.createElement("span");
  label.className = LABEL_CLASS;
  label.textContent = "Media";
  row.append(label);

  for (const option of MEDIA_OPTIONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = MEDIA_BTN_CLASS;
    button.textContent = option.label;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener(EVENT_CLICK, () => {
      const tokens = parseTokens(refs.input.value);
      applyControlNavigation(
        refs,
        option.value,
        readSortMode(tokens),
        readMinScore(tokens),
      );
    });
    refs.mediaButtons.set(option.value, button);
    row.append(button);
  }
  return row;
}

function buildSortScoreRow(refs: MountRefs): HTMLDivElement {
  const row = document.createElement("div");
  row.className = ROW_CLASS;

  const sortLabel = document.createElement("label");
  sortLabel.className = LABEL_CLASS;
  sortLabel.textContent = "Sort";
  sortLabel.htmlFor = `${ROOT_ID}-sort`;

  refs.sortSelect.id = `${ROOT_ID}-sort`;
  refs.sortSelect.className = `${SELECT_CLASS} ${SORT_CLASS}`;
  for (const option of SORT_OPTIONS) {
    const el = document.createElement("option");
    el.value = option.value;
    el.textContent = option.label;
    refs.sortSelect.append(el);
  }
  refs.sortSelect.addEventListener(EVENT_CHANGE, () => {
    const tokens = parseTokens(refs.input.value);
    const sort = refs.sortSelect.value;
    const mode = SORT_OPTIONS.find((entry) => entry.value === sort)?.value;
    if (mode === undefined) {
      return;
    }
    applyControlNavigation(
      refs,
      readMediaMode(tokens),
      mode,
      readMinScore(tokens),
    );
  });

  const scoreLabel = document.createElement("label");
  scoreLabel.className = LABEL_CLASS;
  scoreLabel.textContent = "Min score";
  scoreLabel.htmlFor = `${ROOT_ID}-score`;

  refs.scoreInput.id = `${ROOT_ID}-score`;
  refs.scoreInput.className = `${SCORE_INPUT_CLASS} ${SCORE_CLASS}`;
  refs.scoreInput.type = "number";
  refs.scoreInput.min = "1";
  refs.scoreInput.step = "1";
  refs.scoreInput.inputMode = "numeric";
  refs.scoreInput.placeholder = "Min";

  const applyScore = (): void => {
    const tokens = parseTokens(refs.input.value);
    const raw = refs.scoreInput.value.trim();
    let minScore: number | null = null;
    if (raw.length > 0) {
      const value = Number(raw);
      if (Number.isFinite(value) && value > 0) {
        minScore = Math.floor(value);
      }
    }
    const current = readMinScore(tokens);
    if (current === minScore) {
      syncControls(refs);
      return;
    }
    applyControlNavigation(
      refs,
      readMediaMode(tokens),
      readSortMode(tokens),
      minScore,
    );
  };

  refs.scoreInput.addEventListener(EVENT_BLUR, applyScore);
  refs.scoreInput.addEventListener(EVENT_KEYDOWN, (event: KeyboardEvent) => {
    if (event.key !== KEY_ENTER) {
      return;
    }
    event.preventDefault();
    refs.scoreInput.blur();
  });

  row.append(sortLabel, refs.sortSelect, scoreLabel, refs.scoreInput);
  return row;
}

function buildSourceRow(refs: MountRefs): HTMLDivElement {
  const row = document.createElement("div");
  row.className = ROW_CLASS;

  const label = document.createElement("label");
  label.className = LABEL_CLASS;
  label.textContent = "Source";
  label.htmlFor = `${ROOT_ID}-source`;

  refs.sourceSelect.id = `${ROOT_ID}-source`;
  refs.sourceSelect.className = `${SELECT_CLASS} ${SOURCE_CLASS}`;

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All posts";
  refs.sourceSelect.append(allOption);

  const followedOption = document.createElement("option");
  followedOption.value = "followed";
  followedOption.textContent = "Followed artists";
  refs.sourceSelect.append(followedOption);

  const favoritesHref = findFavoritesHref();
  if (favoritesHref !== null) {
    const favoritesOption = document.createElement("option");
    favoritesOption.value = "favorites";
    favoritesOption.textContent = "My favorites";
    refs.sourceSelect.append(favoritesOption);
  }

  refs.sourceSelect.addEventListener(EVENT_CHANGE, () => {
    const value = refs.sourceSelect.value;
    if (value === "followed") {
      const artists = listArtistTags();
      if (artists.length === 0) {
        refs.sourceSelect.value = detectSourceMode(window.location.search);
        return;
      }
      window.location.assign(buildFeedUrl(artists, getUpdatesGroupSize()));
      return;
    }
    if (value === "favorites") {
      const href = findFavoritesHref();
      if (href === null) {
        refs.sourceSelect.value = detectSourceMode(window.location.search);
        return;
      }
      window.location.assign(href);
      return;
    }
    navigateTokens(parseTokens(refs.input.value));
  });

  row.append(label, refs.sourceSelect);
  return row;
}

function buildCollectionsRow(refs: MountRefs): HTMLDivElement {
  const row = document.createElement("div");
  row.className = `${ROW_CLASS} ${COLLECTIONS_CLASS}`;

  const label = document.createElement("label");
  label.className = LABEL_CLASS;
  label.textContent = "Collections";
  label.htmlFor = `${ROOT_ID}-collections`;

  refs.collectionsSelect.id = `${ROOT_ID}-collections`;
  refs.collectionsSelect.className = SELECT_CLASS;
  rebuildCollectionsSelect(refs.collectionsSelect);
  refs.collectionsSelect.addEventListener(EVENT_CHANGE, () => {
    const id = refs.collectionsSelect.value;
    if (id.length === 0) {
      return;
    }
    const collection = load().collections.find((entry) => entry.id === id);
    refs.collectionsSelect.value = "";
    if (collection === undefined) {
      return;
    }
    if (isPlaylist(collection)) {
      const queries = buildPlaylistQueries(
        collection.postIds ?? [],
        getPlaylistChunkSize(),
      );
      const first = queries[0];
      if (first === undefined) {
        return;
      }
      window.location.assign(buildUpdatesSearchUrl(first));
      return;
    }
    window.location.assign(buildSearchUrl(collection.tags));
  });

  refs.saveBtn.type = "button";
  refs.saveBtn.className = `${SAVE_BTN_CLASS} ${SAVE_CLASS}`;
  refs.saveBtn.textContent = "Save search";
  refs.saveForm.className = SAVE_FORM_CLASS;
  refs.saveForm.hidden = true;

  refs.saveName.type = "text";
  refs.saveName.className = SAVE_NAME_CLASS;
  refs.saveName.placeholder = "Name";
  refs.saveName.autocomplete = "off";

  const confirm = document.createElement("button");
  confirm.type = "button";
  confirm.className = SAVE_CONFIRM_CLASS;
  confirm.textContent = "Save";

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = SAVE_CANCEL_CLASS;
  cancel.textContent = "Cancel";

  const closeSaveForm = (): void => {
    refs.saveForm.hidden = true;
    refs.saveName.value = "";
    refs.saveBtn.hidden = false;
  };

  refs.saveBtn.addEventListener(EVENT_CLICK, () => {
    if (refs.saveBtn.disabled) {
      return;
    }
    refs.saveBtn.hidden = true;
    refs.saveForm.hidden = false;
    refs.saveName.value = normalizeSpaces(refs.input.value);
    queueMicrotask(() => {
      refs.saveName.focus();
      refs.saveName.select();
    });
  });

  confirm.addEventListener(EVENT_CLICK, () => {
    const name = refs.saveName.value.trim();
    const tags = parseTags(refs.input.value);
    if (name.length === 0 || tags.length === 0) {
      return;
    }
    addCollection(name, tags);
    rebuildCollectionsSelect(refs.collectionsSelect);
    closeSaveForm();
    syncControls(refs);
  });

  cancel.addEventListener(EVENT_CLICK, () => {
    closeSaveForm();
  });

  refs.saveForm.append(refs.saveName, confirm, cancel);
  row.append(label, refs.collectionsSelect, refs.saveBtn, refs.saveForm);
  return row;
}

function mountSearchTools(_ctx: FeatureContext): void {
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
  root.replaceChildren();

  const chips = document.createElement("div");
  chips.className = CHIPS_CLASS;

  const refs: MountRefs = {
    input,
    chips,
    mediaButtons: new Map(),
    sortSelect: document.createElement("select"),
    scoreInput: document.createElement("input"),
    sourceSelect: document.createElement("select"),
    collectionsSelect: document.createElement("select"),
    saveBtn: document.createElement("button"),
    saveForm: document.createElement("div"),
    saveName: document.createElement("input"),
  };

  root.append(
    chips,
    buildMediaRow(refs),
    buildSortScoreRow(refs),
    buildSourceRow(refs),
    buildCollectionsRow(refs),
  );

  let lastValue = input.value;
  syncFromInput(refs);

  const refresh = (): void => {
    lastValue = input.value;
    syncFromInput(refs);
  };

  input.addEventListener(EVENT_INPUT, refresh);
  input.addEventListener(EVENT_CHANGE, refresh);
  input.addEventListener(EVENT_AWESOMPLETE_SELECT, refresh);

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

export const searchToolsFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: true,
  css: FEATURE_CSS,
  mount: mountSearchTools,
};
