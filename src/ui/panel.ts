import {
  CSS_CLASS,
  EXPORT_FILENAME,
  EXPORT_MIME,
  PANEL_ROOT_ID,
  TAG_TYPE_INCLUDE,
  TOGGLE_BUTTON_ID,
  UI_TEXT,
} from "../config/constants";
import { FEATURES } from "../features/registry";
import {
  getFeatureChoice,
  isFeatureEnabled,
} from "../features/runtime";
import { log } from "../log";
import {
  buildSearchUrl,
  buildUpdatesQueries,
  buildUpdatesSearchUrl,
  normalizeArtistTag,
  readTagsFromLocation,
  serialize,
} from "../search/query";
import type { ArtistEntry, Collection } from "../storage/schema";
import {
  addArtist,
  addCollection,
  deleteCollection,
  exportJson,
  getGridFavButtonsEnabled,
  getSeenPostId,
  getTweaksEnabled,
  getUpdatesGroupSize,
  importJson,
  load,
  removeArtist,
  renameCollection,
  setFeatureChoiceValue,
  setFeatureEnabled,
  setGridFavButtonsEnabled,
  setTweaksEnabled,
  setUpdatesGroupSize,
} from "../storage/store";
import { getSiteTheme, setSiteTheme } from "../site/theme";
import { setGridFavButtonsVisible } from "./cards";
import { createFavoritesSyncSection } from "./favorites-sync-section";
import { PANEL_CSS } from "./styles";

const TWEAKS_CHECKBOX_ID = "rdw-tweaks-enabled";
const SITE_DARK_THEME_CHECKBOX_ID = "rdw-site-dark-theme";
const GRID_FAV_CHECKBOX_ID = "rdw-grid-fav-buttons";
const FEATURE_CHECKBOX_ID_PREFIX = "rdw-feature-";
const FEATURE_CHOICE_ID_PREFIX = "rdw-feature-choice-";

type PanelMode =
  | { kind: "list" }
  | { kind: "save" }
  | { kind: "rename"; id: string }
  | { kind: "confirm-delete"; id: string };

type PanelController = {
  getMode: () => PanelMode;
  setMode: (mode: PanelMode) => void;
  getNameDraft: () => string;
  setNameDraft: (value: string) => void;
  getArtistDraft: () => string;
  setArtistDraft: (value: string) => void;
  getArtistError: () => string;
  setArtistError: (value: string) => void;
  getImportError: () => string;
  clearImportError: () => void;
  requestImport: () => void;
  downloadExport: () => void;
  close: () => void;
  render: () => void;
  currentSearchTags: () => ReturnType<typeof readTagsFromLocation>;
};

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

function buildSaveSection(controller: PanelController): HTMLElement {
  const saveSection = document.createElement("section");
  saveSection.className = CSS_CLASS.section;

  const searchTags = controller.currentSearchTags();
  const canSave = searchTags !== null && searchTags.length > 0;
  const mode = controller.getMode();

  if (mode.kind === "save") {
    const form = document.createElement("form");
    form.className = CSS_CLASS.form;

    const field = document.createElement("div");
    field.className = CSS_CLASS.field;

    const label = document.createElement("label");
    label.className = CSS_CLASS.label;
    label.htmlFor = "rdw-save-name";
    label.textContent = UI_TEXT.nameLabel;

    const input = document.createElement("input");
    input.id = "rdw-save-name";
    input.className = CSS_CLASS.input;
    input.type = "text";
    input.required = true;
    input.value = controller.getNameDraft();
    input.addEventListener("input", () => {
      controller.setNameDraft(input.value);
    });

    field.append(label, input);

    const actions = document.createElement("div");
    actions.className = CSS_CLASS.formActions;

    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.className = CSS_CLASS.primaryButton;
    saveBtn.textContent = UI_TEXT.save;

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = CSS_CLASS.secondaryButton;
    cancelBtn.textContent = UI_TEXT.cancel;
    cancelBtn.addEventListener("click", () => {
      controller.setMode({ kind: "list" });
      controller.render();
    });

    actions.append(saveBtn, cancelBtn);
    form.append(field, actions);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const tags = controller.currentSearchTags();
      if (tags === null || tags.length === 0) {
        controller.setMode({ kind: "list" });
        controller.render();
        return;
      }
      const name = controller.getNameDraft().trim();
      if (name.length === 0) {
        return;
      }
      addCollection(name, tags);
      controller.setMode({ kind: "list" });
      controller.render();
    });
    saveSection.append(form);
    queueMicrotask(() => {
      input.focus();
      input.select();
    });
    return saveSection;
  }

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = CSS_CLASS.primaryButton;
  saveBtn.textContent = UI_TEXT.saveCurrent;
  saveBtn.disabled = !canSave;
  saveBtn.addEventListener("click", () => {
    const tags = controller.currentSearchTags();
    if (tags === null || tags.length === 0) {
      return;
    }
    controller.setNameDraft(serialize(tags));
    controller.setMode({ kind: "save" });
    controller.render();
  });
  saveSection.append(saveBtn);
  if (!canSave) {
    const hint = document.createElement("p");
    hint.className = CSS_CLASS.hint;
    hint.textContent = UI_TEXT.notOnSearchPage;
    saveSection.append(hint);
  }
  return saveSection;
}

function buildCollectionRow(
  collection: Collection,
  controller: PanelController,
): HTMLElement {
  const item = document.createElement("li");
  item.className = CSS_CLASS.listItem;
  const mode = controller.getMode();

  if (mode.kind === "rename" && mode.id === collection.id) {
    const form = document.createElement("form");
    form.className = CSS_CLASS.form;

    const field = document.createElement("div");
    field.className = CSS_CLASS.field;

    const label = document.createElement("label");
    label.className = CSS_CLASS.label;
    label.htmlFor = `rdw-rename-${collection.id}`;
    label.textContent = UI_TEXT.nameLabel;

    const input = document.createElement("input");
    input.id = `rdw-rename-${collection.id}`;
    input.className = CSS_CLASS.input;
    input.type = "text";
    input.required = true;
    input.value = controller.getNameDraft();
    input.addEventListener("input", () => {
      controller.setNameDraft(input.value);
    });

    field.append(label, input);

    const actions = document.createElement("div");
    actions.className = CSS_CLASS.formActions;

    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.className = CSS_CLASS.primaryButton;
    saveBtn.textContent = UI_TEXT.save;

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = CSS_CLASS.secondaryButton;
    cancelBtn.textContent = UI_TEXT.cancel;
    cancelBtn.addEventListener("click", () => {
      controller.setMode({ kind: "list" });
      controller.render();
    });

    actions.append(saveBtn, cancelBtn);
    form.append(field, actions);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const nextName = controller.getNameDraft().trim();
      if (nextName.length === 0) {
        return;
      }
      renameCollection(collection.id, nextName);
      controller.setMode({ kind: "list" });
      controller.render();
    });
    item.append(form);
    queueMicrotask(() => {
      input.focus();
      input.select();
    });
    return item;
  }

  if (mode.kind === "confirm-delete" && mode.id === collection.id) {
    const prompt = document.createElement("p");
    prompt.className = CSS_CLASS.hint;
    prompt.textContent = `${UI_TEXT.confirmDelete} (${collection.name})`;

    const actions = document.createElement("div");
    actions.className = CSS_CLASS.confirmRow;

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = CSS_CLASS.dangerButton;
    confirmBtn.textContent = UI_TEXT.confirm;
    confirmBtn.addEventListener("click", () => {
      deleteCollection(collection.id);
      controller.setMode({ kind: "list" });
      controller.render();
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = CSS_CLASS.secondaryButton;
    cancelBtn.textContent = UI_TEXT.cancel;
    cancelBtn.addEventListener("click", () => {
      controller.setMode({ kind: "list" });
      controller.render();
    });

    actions.append(confirmBtn, cancelBtn);
    item.append(prompt, actions);
    return item;
  }

  const nameBtn = document.createElement("button");
  nameBtn.type = "button";
  nameBtn.className = CSS_CLASS.itemName;
  nameBtn.textContent = collection.name;
  nameBtn.setAttribute(
    "aria-label",
    `${UI_TEXT.openCollection}: ${collection.name}`,
  );
  nameBtn.addEventListener("click", () => {
    window.location.assign(buildSearchUrl(collection.tags));
  });

  const actions = document.createElement("div");
  actions.className = CSS_CLASS.itemActions;

  const renameBtn = document.createElement("button");
  renameBtn.type = "button";
  renameBtn.className = CSS_CLASS.iconButton;
  renameBtn.textContent = UI_TEXT.rename;
  renameBtn.setAttribute(
    "aria-label",
    `${UI_TEXT.rename}: ${collection.name}`,
  );
  renameBtn.addEventListener("click", () => {
    controller.setNameDraft(collection.name);
    controller.setMode({ kind: "rename", id: collection.id });
    controller.render();
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = CSS_CLASS.iconButton;
  deleteBtn.textContent = UI_TEXT.delete;
  deleteBtn.setAttribute(
    "aria-label",
    `${UI_TEXT.delete}: ${collection.name}`,
  );
  deleteBtn.addEventListener("click", () => {
    controller.setMode({ kind: "confirm-delete", id: collection.id });
    controller.render();
  });

  actions.append(renameBtn, deleteBtn);
  item.append(nameBtn, actions);
  return item;
}

function buildCollectionsSection(
  collections: Collection[],
  controller: PanelController,
): HTMLElement {
  const collectionsSection = document.createElement("section");
  collectionsSection.className = CSS_CLASS.section;

  const collectionsTitle = document.createElement("h3");
  collectionsTitle.className = CSS_CLASS.sectionTitle;
  collectionsTitle.textContent = UI_TEXT.collectionsHeading;
  collectionsSection.append(collectionsTitle);

  if (collections.length === 0) {
    const empty = document.createElement("p");
    empty.className = CSS_CLASS.hint;
    empty.textContent = UI_TEXT.emptyCollections;
    collectionsSection.append(empty);
    return collectionsSection;
  }

  const list = document.createElement("ul");
  list.className = CSS_CLASS.list;
  for (const collection of collections) {
    list.append(buildCollectionRow(collection, controller));
  }
  collectionsSection.append(list);
  return collectionsSection;
}

function buildFeatureSettingsRows(): HTMLElement[] {
  const rows: HTMLElement[] = [];
  for (const feature of FEATURES) {
    const row = document.createElement("div");
    row.className = CSS_CLASS.checkboxRow;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `${FEATURE_CHECKBOX_ID_PREFIX}${feature.id}`;
    checkbox.className = CSS_CLASS.checkbox;
    checkbox.checked = isFeatureEnabled(feature.id);
    checkbox.addEventListener("change", () => {
      setFeatureEnabled(feature.id, checkbox.checked);
    });

    const label = document.createElement("label");
    label.className = CSS_CLASS.label;
    label.htmlFor = checkbox.id;
    label.textContent = feature.label;

    row.append(checkbox, label);
    rows.push(row);

    if (feature.choice === undefined) {
      continue;
    }

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
    });

    choiceField.append(choiceLabel, select);
    rows.push(choiceField);
  }
  return rows;
}

function buildSettingsSection(): HTMLElement {
  const section = document.createElement("section");
  section.className = CSS_CLASS.section;

  const title = document.createElement("h3");
  title.className = CSS_CLASS.sectionTitle;
  title.textContent = UI_TEXT.settingsHeading;

  const tweaksRow = document.createElement("div");
  tweaksRow.className = CSS_CLASS.checkboxRow;

  const tweaksCheckbox = document.createElement("input");
  tweaksCheckbox.type = "checkbox";
  tweaksCheckbox.id = TWEAKS_CHECKBOX_ID;
  tweaksCheckbox.className = CSS_CLASS.checkbox;
  tweaksCheckbox.checked = getTweaksEnabled();
  tweaksCheckbox.addEventListener("change", () => {
    setTweaksEnabled(tweaksCheckbox.checked);
  });

  const tweaksLabel = document.createElement("label");
  tweaksLabel.className = CSS_CLASS.label;
  tweaksLabel.htmlFor = tweaksCheckbox.id;
  tweaksLabel.textContent = UI_TEXT.enablePageTweaksLabel;

  tweaksRow.append(tweaksCheckbox, tweaksLabel);
  section.append(title, tweaksRow);

  const themeRow = document.createElement("div");
  themeRow.className = CSS_CLASS.checkboxRow;

  const themeCheckbox = document.createElement("input");
  themeCheckbox.type = "checkbox";
  themeCheckbox.id = SITE_DARK_THEME_CHECKBOX_ID;
  themeCheckbox.className = CSS_CLASS.checkbox;
  themeCheckbox.checked = getSiteTheme() === "dark";
  themeCheckbox.addEventListener("change", () => {
    setSiteTheme(themeCheckbox.checked ? "dark" : "light");
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

  const reloadHint = document.createElement("p");
  reloadHint.className = CSS_CLASS.hint;
  reloadHint.textContent = UI_TEXT.reloadToApplyHint;
  section.append(reloadHint);

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
  section.append(favRow);
  return section;
}

function buildArtistsSection(
  artists: ArtistEntry[],
  controller: PanelController,
): HTMLElement {
  const section = document.createElement("section");
  section.className = CSS_CLASS.section;

  const title = document.createElement("h3");
  title.className = CSS_CLASS.sectionTitle;
  title.textContent = UI_TEXT.artistsHeading;
  section.append(title);

  const form = document.createElement("form");
  form.className = CSS_CLASS.form;

  const field = document.createElement("div");
  field.className = CSS_CLASS.field;

  const label = document.createElement("label");
  label.className = CSS_CLASS.label;
  label.htmlFor = "rdw-artist-tag";
  label.textContent = UI_TEXT.artistTagLabel;

  const input = document.createElement("input");
  input.id = "rdw-artist-tag";
  input.className = CSS_CLASS.input;
  input.type = "text";
  input.value = controller.getArtistDraft();
  input.addEventListener("input", () => {
    controller.setArtistDraft(input.value);
  });

  field.append(label, input);

  const actions = document.createElement("div");
  actions.className = CSS_CLASS.formActions;

  const addBtn = document.createElement("button");
  addBtn.type = "submit";
  addBtn.className = CSS_CLASS.primaryButton;
  addBtn.textContent = UI_TEXT.artistAdd;
  actions.append(addBtn);

  form.append(field, actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const normalized = normalizeArtistTag(controller.getArtistDraft());
    if (normalized === null) {
      controller.setArtistError(UI_TEXT.artistInvalid);
      controller.render();
      return;
    }
    try {
      addArtist(normalized);
      controller.setArtistDraft("");
      controller.setArtistError("");
      controller.render();
    } catch {
      controller.setArtistError(UI_TEXT.artistDuplicate);
      controller.render();
    }
  });
  section.append(form);

  if (controller.getArtistError().length > 0) {
    const error = document.createElement("p");
    error.className = CSS_CLASS.error;
    error.textContent = controller.getArtistError();
    section.append(error);
  }

  if (artists.length === 0) {
    const empty = document.createElement("p");
    empty.className = CSS_CLASS.hint;
    empty.textContent = UI_TEXT.artistsEmpty;
    section.append(empty);
  } else {
    const list = document.createElement("ul");
    list.className = CSS_CLASS.list;
    for (const artist of artists) {
      const item = document.createElement("li");
      item.className = CSS_CLASS.listItem;

      const nameBtn = document.createElement("button");
      nameBtn.type = "button";
      nameBtn.className = CSS_CLASS.itemName;
      nameBtn.textContent = artist.tag;
      nameBtn.setAttribute(
        "aria-label",
        `${UI_TEXT.artistOpenSearch}: ${artist.tag}`,
      );
      nameBtn.addEventListener("click", () => {
        window.location.assign(
          buildSearchUrl([{ tag: artist.tag, type: TAG_TYPE_INCLUDE }]),
        );
      });

      const itemActions = document.createElement("div");
      itemActions.className = CSS_CLASS.itemActions;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = CSS_CLASS.iconButton;
      removeBtn.textContent = UI_TEXT.artistRemove;
      removeBtn.setAttribute(
        "aria-label",
        `${UI_TEXT.artistUnfollow}: ${artist.tag}`,
      );
      removeBtn.addEventListener("click", () => {
        removeArtist(artist.tag);
        controller.render();
      });

      itemActions.append(removeBtn);
      item.append(nameBtn, itemActions);
      list.append(item);
    }
    section.append(list);
  }

  const groupField = document.createElement("div");
  groupField.className = CSS_CLASS.field;
  const groupLabel = document.createElement("label");
  groupLabel.className = CSS_CLASS.label;
  groupLabel.htmlFor = "rdw-updates-group-size";
  groupLabel.textContent = UI_TEXT.updatesGroupSizeLabel;
  const groupInput = document.createElement("input");
  groupInput.id = "rdw-updates-group-size";
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

  const seen = getSeenPostId();
  const seenHint = document.createElement("p");
  seenHint.className = CSS_CLASS.hint;
  seenHint.textContent =
    seen > 0 ? `${UI_TEXT.seenUpTo}${String(seen)}` : UI_TEXT.seenNothing;
  section.append(seenHint);

  const updatesActions = document.createElement("div");
  updatesActions.className = CSS_CLASS.toolbar;
  const tags = artists.map((entry) => entry.tag);
  const queries = buildUpdatesQueries(tags, seen, getUpdatesGroupSize());
  if (queries.length === 0) {
    const disabled = document.createElement("button");
    disabled.type = "button";
    disabled.className = CSS_CLASS.primaryButton;
    disabled.textContent = UI_TEXT.openUpdates;
    disabled.disabled = true;
    updatesActions.append(disabled);
  } else if (queries.length === 1) {
    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = CSS_CLASS.primaryButton;
    openBtn.textContent = UI_TEXT.openUpdates;
    const onlyQuery = queries[0];
    openBtn.addEventListener("click", () => {
      if (onlyQuery === undefined) {
        return;
      }
      window.location.assign(buildUpdatesSearchUrl(onlyQuery));
    });
    updatesActions.append(openBtn);
  } else {
    queries.forEach((query, index) => {
      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.className = CSS_CLASS.secondaryButton;
      openBtn.textContent = `${UI_TEXT.openUpdatesGroup} ${String(index + 1)}`;
      openBtn.addEventListener("click", () => {
        window.location.assign(buildUpdatesSearchUrl(query));
      });
      updatesActions.append(openBtn);
    });
  }
  section.append(updatesActions);

  return section;
}

function buildToolbar(controller: PanelController): HTMLElement {
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
  return toolbar;
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
  let mode: PanelMode = { kind: "list" };
  let importError = "";
  let nameDraft = "";
  let artistDraft = "";
  let artistError = "";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json,application/json";
  fileInput.className = CSS_CLASS.hidden;
  fileInput.setAttribute("aria-hidden", "true");
  fileInput.tabIndex = -1;
  root.append(fileInput);

  const controller: PanelController = {
    getMode: () => mode,
    setMode: (next) => {
      mode = next;
    },
    getNameDraft: () => nameDraft,
    setNameDraft: (value) => {
      nameDraft = value;
    },
    getArtistDraft: () => artistDraft,
    setArtistDraft: (value) => {
      artistDraft = value;
    },
    getArtistError: () => artistError,
    setArtistError: (value) => {
      artistError = value;
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
    currentSearchTags: () => readTagsFromLocation(window.location.search),
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
      const focusTarget = panel.querySelector("button, input");
      if (focusTarget instanceof HTMLElement) {
        focusTarget.focus();
      }
    } else {
      mode = { kind: "list" };
      importError = "";
      toggle.focus();
    }
  }

  function renderList(
    collections: Collection[],
    artists: ArtistEntry[],
  ): void {
    panel.replaceChildren();

    const body = document.createElement("div");
    body.className = CSS_CLASS.body;

    const saveSection = buildSaveSection(controller);
    const settingsSection = buildSettingsSection();
    const favoritesSyncSection = createFavoritesSyncSection();
    const artistsSection = buildArtistsSection(artists, controller);
    const collectionsSection = buildCollectionsSection(collections, controller);
    const toolbar = buildToolbar(controller);

    if (controller.getImportError().length > 0) {
      const error = document.createElement("p");
      error.className = CSS_CLASS.error;
      error.textContent = `${UI_TEXT.importErrorPrefix} ${controller.getImportError()}`;
      body.append(
        saveSection,
        settingsSection,
        favoritesSyncSection,
        artistsSection,
        collectionsSection,
        toolbar,
        error,
      );
    } else {
      body.append(
        saveSection,
        settingsSection,
        favoritesSyncSection,
        artistsSection,
        collectionsSection,
        toolbar,
      );
    }

    panel.append(buildHeader(controller), body);
  }

  function render(): void {
    const data = load();
    renderList(data.collections, data.artists);
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
        mode = { kind: "list" };
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
