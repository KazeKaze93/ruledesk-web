import {
  CSS_CLASS,
  EXPORT_FILENAME,
  EXPORT_MIME,
  PANEL_ROOT_ID,
  TAG_TYPE_INCLUDE,
  TOGGLE_BUTTON_ID,
  UI_TEXT,
  USERSCRIPT_VERSION,
} from "../config/constants";
import { FEATURES } from "../features/registry";
import {
  applyCssOnlyFeatureChoice,
  applyCssOnlyFeatureEnabled,
  getFeatureChoice,
  isFeatureEnabled,
} from "../features/runtime";
import { log } from "../log";
import { buildSearchUrl } from "../search/query";
import type { ArtistEntry } from "../storage/schema";
import {
  addArtist,
  exportJson,
  getFeatureState,
  getGridFavButtonsEnabled,
  getPlaylistChunkSize,
  getSeenPostId,
  getTweaksEnabled,
  getUpdatesGroupSize,
  importJson,
  load,
  removeArtist,
  setFeatureChoiceValue,
  setFeatureEnabled,
  setFeatureState,
  setGridFavButtonsEnabled,
  setPlaylistChunkSize,
  setTweaksEnabled,
  setUpdatesGroupSize,
} from "../storage/store";
import { getSiteTheme, setSiteTheme } from "../site/theme";
import { createBlacklistSection } from "./blacklist-section";
import { setGridFavButtonsVisible } from "./cards";
import { createCollectionsTab } from "./collections-tab";
import { createFavoritesSyncSection } from "./favorites-sync-section";
import { PANEL_CSS, PANEL_UI_CLASS } from "./styles";

const TWEAKS_CHECKBOX_ID = "rdw-tweaks-enabled";
const SITE_DARK_THEME_CHECKBOX_ID = "rdw-site-dark-theme";
const GRID_FAV_CHECKBOX_ID = "rdw-grid-fav-buttons";
const FEATURE_CHECKBOX_ID_PREFIX = "rdw-feature-";
const FEATURE_CHOICE_ID_PREFIX = "rdw-feature-choice-";
const UPDATES_GROUP_SIZE_ID = "rdw-updates-group-size";
const PLAYLIST_CHUNK_SIZE_ID = "rdw-playlist-chunk-size";
const ARTIST_FILTER_ID = "rdw-artist-filter";

const PANEL_FEATURE_STATE_ID = "panel";
const PANEL_TABS = [
  "collections",
  "artists",
  "favorites",
  "settings",
] as const;
type PanelTab = (typeof PANEL_TABS)[number];

const PANEL_TAB_LABELS: Record<PanelTab, string> = {
  collections: "Collections",
  artists: "Artists",
  favorites: "Favorites",
  settings: "Settings",
};

const ARTISTS_FILTER_THRESHOLD = 12;
const UNFOLLOW_UNDO_MS = 5000;
const SIZE_PERSIST_MS = 300;
const PANEL_MIN_WIDTH_PX = 320;
const PANEL_MIN_HEIGHT_PX = 240;
const PANEL_DEFAULT_WIDTH_PX = 360;
const PANEL_DEFAULT_HEIGHT_PX = 480;

const ARTISTS_EMPTY_HINT =
  "Follow artists with the Follow button next to their name in the tag list.";
const ARTIST_FILTER_LABEL = "Filter artists";
const UNFOLLOW_UNDO_LABEL = "Undo";
const UNFOLLOWED_PREFIX = "Unfollowed ";

type PanelPersistedState = {
  tab: PanelTab;
  width: number;
  height: number;
};

type PendingUnfollow = {
  tag: string;
  timer: ReturnType<typeof setTimeout>;
};

type PanelController = {
  getArtistFilter: () => string;
  setArtistFilter: (value: string) => void;
  getImportError: () => string;
  clearImportError: () => void;
  requestImport: () => void;
  downloadExport: () => void;
  close: () => void;
  render: () => void;
  getActiveTab: () => PanelTab;
  setActiveTab: (tab: PanelTab) => void;
  beginUnfollow: (tag: string) => void;
  undoUnfollow: (tag: string) => void;
  getPendingUnfollows: () => readonly PendingUnfollow[];
  focusTab: (tab: PanelTab) => void;
};

function isPanelTab(value: unknown): value is PanelTab {
  return typeof value === "string" && PANEL_TABS.some((tab) => tab === value);
}

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function clampSize(value: number, min: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.floor(value));
}

function readPersistedPanelState(): PanelPersistedState {
  const raw = getFeatureState(PANEL_FEATURE_STATE_ID);
  let tab: PanelTab = "collections";
  let width = PANEL_DEFAULT_WIDTH_PX;
  let height = PANEL_DEFAULT_HEIGHT_PX;
  if (isUnknownRecord(raw)) {
    if (isPanelTab(raw["tab"])) {
      tab = raw["tab"];
    }
    const rawWidth = raw["width"];
    const rawHeight = raw["height"];
    if (typeof rawWidth === "number") {
      width = clampSize(rawWidth, PANEL_MIN_WIDTH_PX);
    }
    if (typeof rawHeight === "number") {
      height = clampSize(rawHeight, PANEL_MIN_HEIGHT_PX);
    }
  }
  return { tab, width, height };
}

function writePersistedPanelState(next: PanelPersistedState): void {
  setFeatureState(PANEL_FEATURE_STATE_ID, {
    tab: next.tab,
    width: next.width,
    height: next.height,
  });
}

function buildSizeCssRule(width: number, height: number): string {
  return `.${CSS_CLASS.panel}{width:${String(width)}px;height:${String(height)}px;}`;
}

function displayArtistName(tag: string): string {
  return tag.replaceAll("_", " ");
}

function compareArtistTags(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function buildHeader(controller: PanelController): HTMLElement {
  const header = document.createElement("div");
  header.className = CSS_CLASS.header;

  const title = document.createElement("h2");
  title.className = CSS_CLASS.title;
  title.textContent = UI_TEXT.panelTitle;

  const close = document.createElement("button");
  close.type = "button";
  close.className = CSS_CLASS.close;
  close.textContent = "×";
  close.setAttribute("aria-label", UI_TEXT.toggleClose);
  close.addEventListener("click", () => {
    controller.close();
  });

  header.append(title, close);
  return header;
}

function buildTabList(controller: PanelController): HTMLElement {
  const tablist = document.createElement("div");
  tablist.className = PANEL_UI_CLASS.tabs;
  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-label", UI_TEXT.panelTitle);

  const active = controller.getActiveTab();

  for (const tab of PANEL_TABS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = PANEL_UI_CLASS.tab;
    button.id = `rdw-tab-${tab}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", `rdw-tabpanel-${tab}`);
    button.setAttribute("aria-selected", tab === active ? "true" : "false");
    button.tabIndex = tab === active ? 0 : -1;
    button.textContent = PANEL_TAB_LABELS[tab];
    button.addEventListener("click", () => {
      if (controller.getActiveTab() === tab) {
        return;
      }
      controller.setActiveTab(tab);
      controller.render();
      controller.focusTab(tab);
    });
    tablist.append(button);
  }

  tablist.addEventListener("keydown", (event: Event) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }
    event.preventDefault();
    const currentIndex = PANEL_TABS.indexOf(controller.getActiveTab());
    if (currentIndex < 0) {
      return;
    }
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex =
      (currentIndex + delta + PANEL_TABS.length) % PANEL_TABS.length;
    const nextTab = PANEL_TABS[nextIndex];
    if (nextTab === undefined) {
      return;
    }
    controller.setActiveTab(nextTab);
    controller.render();
    controller.focusTab(nextTab);
  });

  return tablist;
}

function buildFeatureSettingsRows(): HTMLElement[] {
  const rows: HTMLElement[] = [];
  for (const feature of FEATURES) {
    if (feature.choice !== undefined) {
      const choiceField = document.createElement("div");
      choiceField.className = CSS_CLASS.field;

      const choiceLabel = document.createElement("label");
      choiceLabel.className = CSS_CLASS.label;
      choiceLabel.htmlFor = `${FEATURE_CHOICE_ID_PREFIX}${feature.id}`;
      choiceLabel.textContent = feature.label;

      const select = document.createElement("select");
      select.id = `${FEATURE_CHOICE_ID_PREFIX}${feature.id}`;
      select.className = CSS_CLASS.input;
      const selected = getFeatureChoice(feature.id);
      for (const option of feature.choice.options) {
        const optionEl = document.createElement("option");
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        if (option.value === selected) {
          optionEl.selected = true;
        }
        select.append(optionEl);
      }
      select.addEventListener("change", () => {
        setFeatureChoiceValue(feature.id, select.value);
        if (feature.cssOnly === true) {
          applyCssOnlyFeatureChoice(feature.id, select.value);
          return;
        }
        window.location.reload();
      });

      choiceField.append(choiceLabel, select);
      rows.push(choiceField);
      continue;
    }

    const row = document.createElement("div");
    row.className = CSS_CLASS.checkboxRow;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `${FEATURE_CHECKBOX_ID_PREFIX}${feature.id}`;
    checkbox.className = CSS_CLASS.checkbox;
    checkbox.checked = isFeatureEnabled(feature.id);
    checkbox.addEventListener("change", () => {
      setFeatureEnabled(feature.id, checkbox.checked);
      if (feature.cssOnly === true) {
        applyCssOnlyFeatureEnabled(feature.id, checkbox.checked);
        return;
      }
      window.location.reload();
    });

    const label = document.createElement("label");
    label.className = CSS_CLASS.label;
    label.htmlFor = checkbox.id;
    label.textContent = feature.label;

    row.append(checkbox, label);
    rows.push(row);
  }
  return rows;
}

function buildSettingsTab(
  controller: PanelController,
  onThemeChange: () => void,
): HTMLElement {
  const scroll = document.createElement("div");
  scroll.className = PANEL_UI_CLASS.scrollRegion;

  const section = document.createElement("section");
  section.className = CSS_CLASS.section;

  const tweaksRow = document.createElement("div");
  tweaksRow.className = CSS_CLASS.checkboxRow;

  const tweaksCheckbox = document.createElement("input");
  tweaksCheckbox.type = "checkbox";
  tweaksCheckbox.id = TWEAKS_CHECKBOX_ID;
  tweaksCheckbox.className = CSS_CLASS.checkbox;
  tweaksCheckbox.checked = getTweaksEnabled();
  tweaksCheckbox.addEventListener("change", () => {
    setTweaksEnabled(tweaksCheckbox.checked);
    window.location.reload();
  });

  const tweaksLabel = document.createElement("label");
  tweaksLabel.className = CSS_CLASS.label;
  tweaksLabel.htmlFor = tweaksCheckbox.id;
  tweaksLabel.textContent = UI_TEXT.enablePageTweaksLabel;

  tweaksRow.append(tweaksCheckbox, tweaksLabel);
  section.append(tweaksRow);

  const themeRow = document.createElement("div");
  themeRow.className = CSS_CLASS.checkboxRow;

  const themeCheckbox = document.createElement("input");
  themeCheckbox.type = "checkbox";
  themeCheckbox.id = SITE_DARK_THEME_CHECKBOX_ID;
  themeCheckbox.className = CSS_CLASS.checkbox;
  themeCheckbox.checked = getSiteTheme() === "dark";
  themeCheckbox.addEventListener("change", () => {
    setSiteTheme(themeCheckbox.checked ? "dark" : "light");
    onThemeChange();
  });

  const themeLabel = document.createElement("label");
  themeLabel.className = CSS_CLASS.label;
  themeLabel.htmlFor = themeCheckbox.id;
  themeLabel.textContent = UI_TEXT.siteDarkThemeLabel;

  themeRow.append(themeCheckbox, themeLabel);
  section.append(themeRow);

  const themeHint = document.createElement("p");
  themeHint.className = CSS_CLASS.hint;
  themeHint.textContent = UI_TEXT.siteDarkThemeHint;
  section.append(themeHint);

  for (const row of buildFeatureSettingsRows()) {
    section.append(row);
  }

  const groupField = document.createElement("div");
  groupField.className = CSS_CLASS.field;
  const groupLabel = document.createElement("label");
  groupLabel.className = CSS_CLASS.label;
  groupLabel.htmlFor = UPDATES_GROUP_SIZE_ID;
  groupLabel.textContent = UI_TEXT.updatesGroupSizeLabel;
  const groupInput = document.createElement("input");
  groupInput.id = UPDATES_GROUP_SIZE_ID;
  groupInput.className = CSS_CLASS.input;
  groupInput.type = "number";
  groupInput.min = "0";
  groupInput.step = "1";
  groupInput.value = String(getUpdatesGroupSize());
  groupInput.addEventListener("change", () => {
    const value = Number(groupInput.value);
    setUpdatesGroupSize(Number.isFinite(value) ? value : 0);
    controller.render();
  });
  groupField.append(groupLabel, groupInput);
  section.append(groupField);

  const playlistField = document.createElement("div");
  playlistField.className = CSS_CLASS.field;
  const playlistLabel = document.createElement("label");
  playlistLabel.className = CSS_CLASS.label;
  playlistLabel.htmlFor = PLAYLIST_CHUNK_SIZE_ID;
  playlistLabel.textContent = UI_TEXT.playlistChunkSizeLabel;
  const playlistInput = document.createElement("input");
  playlistInput.id = PLAYLIST_CHUNK_SIZE_ID;
  playlistInput.className = CSS_CLASS.input;
  playlistInput.type = "number";
  playlistInput.min = "1";
  playlistInput.step = "1";
  playlistInput.value = String(getPlaylistChunkSize());
  playlistInput.addEventListener("change", () => {
    const value = Number(playlistInput.value);
    setPlaylistChunkSize(Number.isFinite(value) ? value : 0);
    controller.render();
  });
  playlistField.append(playlistLabel, playlistInput);
  section.append(playlistField);

  section.append(createBlacklistSection());

  const toolbar = document.createElement("div");
  toolbar.className = CSS_CLASS.toolbar;

  const exportBtn = document.createElement("button");
  exportBtn.type = "button";
  exportBtn.className = CSS_CLASS.secondaryButton;
  exportBtn.textContent = UI_TEXT.export;
  exportBtn.addEventListener("click", () => {
    controller.downloadExport();
  });

  const importBtn = document.createElement("button");
  importBtn.type = "button";
  importBtn.className = CSS_CLASS.secondaryButton;
  importBtn.textContent = UI_TEXT.import;
  importBtn.addEventListener("click", () => {
    controller.clearImportError();
    controller.requestImport();
  });

  toolbar.append(exportBtn, importBtn);
  section.append(toolbar);

  if (controller.getImportError().length > 0) {
    const error = document.createElement("p");
    error.className = CSS_CLASS.error;
    error.textContent = `${UI_TEXT.importErrorPrefix} ${controller.getImportError()}`;
    section.append(error);
  }

  scroll.append(section);
  return scroll;
}

function buildArtistUndoRow(
  tag: string,
  controller: PanelController,
): HTMLElement {
  const item = document.createElement("li");
  item.className = PANEL_UI_CLASS.artistRow;
  item.dataset.tag = tag;

  const row = document.createElement("div");
  row.className = PANEL_UI_CLASS.artistUndo;

  const message = document.createElement("span");
  message.textContent = `${UNFOLLOWED_PREFIX}${displayArtistName(tag)}`;

  const undoBtn = document.createElement("button");
  undoBtn.type = "button";
  undoBtn.className = CSS_CLASS.secondaryButton;
  undoBtn.textContent = UNFOLLOW_UNDO_LABEL;
  undoBtn.addEventListener("click", () => {
    controller.undoUnfollow(tag);
  });

  row.append(message, undoBtn);
  item.append(row);
  return item;
}

function buildArtistRow(
  artist: ArtistEntry,
  controller: PanelController,
): HTMLElement {
  const item = document.createElement("li");
  item.className = PANEL_UI_CLASS.artistRow;
  item.dataset.tag = artist.tag;

  const link = document.createElement("a");
  link.className = PANEL_UI_CLASS.artistLink;
  link.href = buildSearchUrl([{ tag: artist.tag, type: TAG_TYPE_INCLUDE }]);
  link.textContent = displayArtistName(artist.tag);
  link.title = artist.tag;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = CSS_CLASS.iconButton;
  removeBtn.textContent = "×";
  removeBtn.setAttribute("aria-label", `Unfollow ${artist.tag}`);
  removeBtn.addEventListener("click", () => {
    controller.beginUnfollow(artist.tag);
  });

  item.append(link, removeBtn);
  return item;
}

function buildArtistsTab(
  artists: ArtistEntry[],
  controller: PanelController,
): HTMLElement {
  const root = document.createElement("div");
  root.className = PANEL_UI_CLASS.scrollRegion;

  const meta = document.createElement("div");
  meta.className = PANEL_UI_CLASS.artistMeta;

  const countLine = document.createElement("p");
  countLine.className = CSS_CLASS.hint;
  const count = artists.length;
  countLine.textContent = `${String(count)} artist${count === 1 ? "" : "s"}`;

  const seen = getSeenPostId();
  const seenHint = document.createElement("p");
  seenHint.className = CSS_CLASS.hint;
  seenHint.textContent =
    seen > 0 ? `${UI_TEXT.seenUpTo}${String(seen)}` : UI_TEXT.seenNothing;

  meta.append(countLine, seenHint);
  root.append(meta);

  const pending = controller.getPendingUnfollows();
  const pendingTags = new Set(pending.map((entry) => entry.tag));
  const sorted = [...artists].sort((a, b) =>
    compareArtistTags(a.tag, b.tag),
  );

  if (sorted.length === 0 && pending.length === 0) {
    const empty = document.createElement("p");
    empty.className = CSS_CLASS.hint;
    empty.textContent = ARTISTS_EMPTY_HINT;
    root.append(empty);
    return root;
  }

  const showFilter = sorted.length + pending.length > ARTISTS_FILTER_THRESHOLD;
  let filterValue = controller.getArtistFilter().trim().toLowerCase();

  if (showFilter) {
    const filterField = document.createElement("div");
    filterField.className = `${CSS_CLASS.field} ${PANEL_UI_CLASS.artistFilter}`;

    const filterLabel = document.createElement("label");
    filterLabel.className = CSS_CLASS.label;
    filterLabel.htmlFor = ARTIST_FILTER_ID;
    filterLabel.textContent = ARTIST_FILTER_LABEL;

    const filterInput = document.createElement("input");
    filterInput.id = ARTIST_FILTER_ID;
    filterInput.className = CSS_CLASS.input;
    filterInput.type = "search";
    filterInput.value = controller.getArtistFilter();
    filterInput.addEventListener("input", () => {
      controller.setArtistFilter(filterInput.value);
      controller.render();
    });

    filterField.append(filterLabel, filterInput);
    root.append(filterField);
  } else if (controller.getArtistFilter().length > 0) {
    controller.setArtistFilter("");
    filterValue = "";
  }

  const list = document.createElement("ul");
  list.className = PANEL_UI_CLASS.artistList;

  const matchesFilter = (tag: string): boolean => {
    if (filterValue.length === 0) {
      return true;
    }
    return (
      tag.toLowerCase().includes(filterValue) ||
      displayArtistName(tag).toLowerCase().includes(filterValue)
    );
  };

  const pendingSorted = [...pending].sort((a, b) =>
    compareArtistTags(a.tag, b.tag),
  );
  for (const entry of pendingSorted) {
    if (!matchesFilter(entry.tag)) {
      continue;
    }
    list.append(buildArtistUndoRow(entry.tag, controller));
  }

  for (const artist of sorted) {
    if (pendingTags.has(artist.tag)) {
      continue;
    }
    if (!matchesFilter(artist.tag)) {
      continue;
    }
    list.append(buildArtistRow(artist, controller));
  }

  root.append(list);
  return root;
}

function buildFavoritesTab(): HTMLElement {
  const scroll = document.createElement("div");
  scroll.className = PANEL_UI_CLASS.scrollRegion;

  const favRow = document.createElement("div");
  favRow.className = CSS_CLASS.checkboxRow;

  const favCheckbox = document.createElement("input");
  favCheckbox.type = "checkbox";
  favCheckbox.id = GRID_FAV_CHECKBOX_ID;
  favCheckbox.className = CSS_CLASS.checkbox;
  favCheckbox.checked = getGridFavButtonsEnabled();
  favCheckbox.addEventListener("change", () => {
    const enabled = favCheckbox.checked;
    setGridFavButtonsEnabled(enabled);
    setGridFavButtonsVisible(enabled);
  });

  const favLabel = document.createElement("label");
  favLabel.className = CSS_CLASS.label;
  favLabel.htmlFor = favCheckbox.id;
  favLabel.textContent = UI_TEXT.gridFavButtonsLabel;

  favRow.append(favCheckbox, favLabel);

  const favoritesSyncSection = createFavoritesSyncSection({
    includeHeading: true,
  });

  scroll.append(favRow, favoritesSyncSection);
  return scroll;
}

function buildFooter(): HTMLElement {
  const footer = document.createElement("div");
  footer.className = PANEL_UI_CLASS.footer;
  footer.textContent = `v${USERSCRIPT_VERSION}`;
  return footer;
}

export function mountPanel(target: ParentNode = document.body): void {
  if (document.getElementById(PANEL_ROOT_ID) !== null) {
    return;
  }

  const host = document.createElement("div");
  host.id = PANEL_ROOT_ID;
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = PANEL_CSS;
  shadow.append(style);

  const sizeStyle = document.createElement("style");
  shadow.append(sizeStyle);

  const root = document.createElement("div");
  root.className = CSS_CLASS.host;
  shadow.append(root);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.id = TOGGLE_BUTTON_ID;
  toggle.className = CSS_CLASS.toggle;
  toggle.textContent = "RD";
  toggle.setAttribute("aria-label", UI_TEXT.toggleOpen);
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "ruledesk-web-panel");

  const panel = document.createElement("section");
  panel.id = "ruledesk-web-panel";
  panel.className = CSS_CLASS.panel;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-label", UI_TEXT.panelTitle);
  panel.hidden = true;

  root.append(panel, toggle);
  target.append(host);

  let open = false;
  let importError = "";
  let artistFilter = "";
  let persisted = readPersistedPanelState();
  let activeTab: PanelTab = persisted.tab;
  const pendingUnfollows: PendingUnfollow[] = [];

  sizeStyle.textContent = buildSizeCssRule(persisted.width, persisted.height);

  function applyThemeClass(): void {
    host.classList.toggle(
      PANEL_UI_CLASS.themeDark,
      getSiteTheme() === "dark",
    );
  }
  applyThemeClass();

  let sizePersistTimer: ReturnType<typeof setTimeout> | null = null;
  let lastWrittenWidth = persisted.width;
  let lastWrittenHeight = persisted.height;

  function scheduleSizePersist(width: number, height: number): void {
    const nextWidth = clampSize(width, PANEL_MIN_WIDTH_PX);
    const nextHeight = clampSize(height, PANEL_MIN_HEIGHT_PX);
    if (
      nextWidth === lastWrittenWidth &&
      nextHeight === lastWrittenHeight
    ) {
      return;
    }
    if (sizePersistTimer !== null) {
      clearTimeout(sizePersistTimer);
    }
    sizePersistTimer = setTimeout(() => {
      sizePersistTimer = null;
      lastWrittenWidth = nextWidth;
      lastWrittenHeight = nextHeight;
      persisted = {
        tab: activeTab,
        width: nextWidth,
        height: nextHeight,
      };
      writePersistedPanelState(persisted);
      sizeStyle.textContent = buildSizeCssRule(nextWidth, nextHeight);
    }, SIZE_PERSIST_MS);
  }

  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver((entries) => {
          if (!open) {
            return;
          }
          const entry = entries[0];
          if (entry === undefined) {
            return;
          }
          const { width, height } = entry.contentRect;
          scheduleSizePersist(width, height);
        })
      : null;
  resizeObserver?.observe(panel);

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json,application/json";
  fileInput.className = CSS_CLASS.hidden;
  fileInput.setAttribute("aria-hidden", "true");
  fileInput.tabIndex = -1;
  root.append(fileInput);

  function clearPendingUnfollow(tag: string): void {
    const index = pendingUnfollows.findIndex((entry) => entry.tag === tag);
    if (index < 0) {
      return;
    }
    const [removed] = pendingUnfollows.splice(index, 1);
    if (removed !== undefined) {
      clearTimeout(removed.timer);
    }
  }

  const controller: PanelController = {
    getArtistFilter: () => artistFilter,
    setArtistFilter: (value) => {
      artistFilter = value;
    },
    getImportError: () => importError,
    clearImportError: () => {
      importError = "";
    },
    requestImport: () => {
      fileInput.value = "";
      fileInput.click();
    },
    downloadExport: () => {
      const payload = exportJson();
      const blob = new Blob([payload], { type: EXPORT_MIME });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = EXPORT_FILENAME;
      anchor.rel = "noopener";
      root.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    },
    close: () => {
      setOpen(false);
    },
    render: () => {
      render();
    },
    getActiveTab: () => activeTab,
    setActiveTab: (tab) => {
      activeTab = tab;
      persisted = {
        tab: activeTab,
        width: lastWrittenWidth,
        height: lastWrittenHeight,
      };
      writePersistedPanelState(persisted);
    },
    beginUnfollow: (tag) => {
      clearPendingUnfollow(tag);
      removeArtist(tag);
      const timer = setTimeout(() => {
        clearPendingUnfollow(tag);
        render();
      }, UNFOLLOW_UNDO_MS);
      pendingUnfollows.push({ tag, timer });
      render();
    },
    undoUnfollow: (tag) => {
      clearPendingUnfollow(tag);
      try {
        addArtist(tag);
      } catch (error) {
        log.warn("Undo unfollow failed", error);
      }
      render();
    },
    getPendingUnfollows: () => pendingUnfollows,
    focusTab: (tab) => {
      const el = panel.querySelector(`#rdw-tab-${tab}`);
      if (el instanceof HTMLElement) {
        el.focus();
      }
    },
  };

  function setOpen(next: boolean): void {
    open = next;
    panel.classList.toggle(CSS_CLASS.panelOpen, open);
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute(
      "aria-label",
      open ? UI_TEXT.toggleClose : UI_TEXT.toggleOpen,
    );
    if (open) {
      render();
      const focusTarget = panel.querySelector(
        `[role="tab"][aria-selected="true"]`,
      );
      if (focusTarget instanceof HTMLElement) {
        focusTarget.focus();
      }
    } else {
      importError = "";
      toggle.focus();
    }
  }

  function render(): void {
    const data = load();
    panel.replaceChildren();

    const body = document.createElement("div");
    body.className = CSS_CLASS.body;

    for (const tab of PANEL_TABS) {
      const panelEl = document.createElement("div");
      panelEl.className = PANEL_UI_CLASS.tabPanel;
      panelEl.id = `rdw-tabpanel-${tab}`;
      panelEl.setAttribute("role", "tabpanel");
      panelEl.setAttribute("aria-labelledby", `rdw-tab-${tab}`);
      const isActive = tab === activeTab;
      panelEl.hidden = !isActive;

      if (tab === "collections") {
        panelEl.append(createCollectionsTab());
      } else if (tab === "artists") {
        panelEl.append(buildArtistsTab(data.artists, controller));
      } else if (tab === "favorites") {
        panelEl.append(buildFavoritesTab());
      } else {
        panelEl.append(buildSettingsTab(controller, applyThemeClass));
      }
      body.append(panelEl);
    }

    panel.append(
      buildHeader(controller),
      buildTabList(controller),
      body,
      buildFooter(),
    );
  }

  toggle.addEventListener("click", () => {
    setOpen(!open);
  });

  shadow.addEventListener("keydown", (event: Event) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
    }
  });

  document.addEventListener(
    "click",
    (event: MouseEvent) => {
      if (!open) {
        return;
      }
      const path = event.composedPath();
      if (path.includes(host)) {
        return;
      }
      setOpen(false);
    },
    true,
  );

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.item(0);
    if (file === null || file === undefined) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        const text = typeof reader.result === "string" ? reader.result : "";
        importJson(text);
        importError = "";
        render();
      } catch (error) {
        importError =
          error instanceof Error ? error.message : "Unknown import error";
        log.warn("Import failed", importError);
        render();
      }
    });
    reader.addEventListener("error", () => {
      importError = "Could not read file";
      render();
    });
    reader.readAsText(file);
  });
}
