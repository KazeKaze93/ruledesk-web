import { CSS_CLASS, UI_TEXT } from "../config/constants";
import {
  buildPlaylistQueries,
  buildSearchUrl,
  buildUpdatesSearchUrl,
  readTagsFromLocation,
  serialize,
} from "../search/query";
import {
  isPlaylist,
  type Collection,
} from "../storage/schema";
import {
  addCollection,
  createPlaylist,
  deleteCollection,
  getPlaylistChunkSize,
  listPlaylists,
  load,
  renameCollection,
} from "../storage/store";
import { PANEL_UI_CLASS } from "./styles";

const TAB_CLASS = "rdw-collections-tab";
const SECTION_HEADING_CLASS = "rdw-collections-heading";
const PLAYLIST_META_CLASS = "rdw-playlist-meta";
const PLAYLIST_PARTS_CLASS = "rdw-playlist-parts";
const PLAYLIST_PART_CLASS = "rdw-playlist-part";
const ROW_MAIN_CLASS = "rdw-collections-row-main";

const SAVED_SEARCHES_HEADING = "Saved searches";
const PLAYLISTS_HEADING = "Playlists";
const EMPTY_SAVED_SEARCHES = "No saved searches yet.";
const EMPTY_PLAYLISTS = "No playlists yet.";
const EMPTY_PLAYLISTS_HINT = "Use the + button on a post";
const NEW_PLAYLIST = "New playlist";
const OPEN_PLAYLIST = "Open playlist";
const SAVE_NAME_ID = "rdw-save-name";
const PLAYLIST_NAME_ID = "rdw-playlist-name";

export const COLLECTIONS_TAB_CSS = `
.${TAB_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.${TAB_CLASS} .${SECTION_HEADING_CLASS} {
  margin: 0;
}

.${TAB_CLASS} .${ROW_MAIN_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.${TAB_CLASS} .${PLAYLIST_META_CLASS} {
  margin: 0;
  color: var(--rdw-fg-muted, #555);
  font-size: 12px;
}

.${TAB_CLASS} .${PLAYLIST_PARTS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}

.${TAB_CLASS} .${PLAYLIST_PART_CLASS} {
  color: var(--rdw-link, #0b57d0);
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
}

.${TAB_CLASS} .${PLAYLIST_PART_CLASS}:focus-visible {
  outline: 2px solid var(--rdw-focus, #4c8bf5);
  outline-offset: 2px;
}

.${TAB_CLASS} .${CSS_CLASS.itemName}:disabled {
  color: var(--rdw-fg-muted, #555);
  cursor: not-allowed;
}
`.trim();

type TabMode =
  | { kind: "list" }
  | { kind: "save-search" }
  | { kind: "create-playlist" }
  | { kind: "rename"; id: string }
  | { kind: "confirm-delete"; id: string };

let mode: TabMode = { kind: "list" };
let nameDraft = "";

/** Clears transient rename/save UI state (tests and remount hygiene). */
export function resetCollectionsTabState(): void {
  mode = { kind: "list" };
  nameDraft = "";
}

function postsLabel(count: number): string {
  return `${String(count)} post${count === 1 ? "" : "s"}`;
}

function listSavedSearches(): Collection[] {
  return load().collections.filter((entry) => !isPlaylist(entry));
}

function playlistPostCount(playlist: Collection): number {
  return playlist.postIds?.length ?? 0;
}

function openSearch(collection: Collection): void {
  window.location.assign(buildSearchUrl(collection.tags));
}

function openPlaylistPart(query: string): void {
  window.location.assign(buildUpdatesSearchUrl(query));
}

function buildNameForm(
  inputId: string,
  onSubmit: () => void,
  onCancel: () => void,
  render: () => void,
): HTMLFormElement {
  const form = document.createElement("form");
  form.className = CSS_CLASS.form;

  const field = document.createElement("div");
  field.className = CSS_CLASS.field;

  const label = document.createElement("label");
  label.className = CSS_CLASS.label;
  label.htmlFor = inputId;
  label.textContent = UI_TEXT.nameLabel;

  const input = document.createElement("input");
  input.id = inputId;
  input.className = CSS_CLASS.input;
  input.type = "text";
  input.required = true;
  input.value = nameDraft;
  input.addEventListener("input", () => {
    nameDraft = input.value;
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
    onCancel();
    render();
  });

  actions.append(saveBtn, cancelBtn);
  form.append(field, actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit();
  });
  queueMicrotask(() => {
    input.focus();
    input.select();
  });
  return form;
}

function buildConfirmDelete(
  collection: Collection,
  render: () => void,
): DocumentFragment {
  const fragment = document.createDocumentFragment();

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
    mode = { kind: "list" };
    nameDraft = "";
    render();
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = CSS_CLASS.secondaryButton;
  cancelBtn.textContent = UI_TEXT.cancel;
  cancelBtn.addEventListener("click", () => {
    mode = { kind: "list" };
    render();
  });

  actions.append(confirmBtn, cancelBtn);
  fragment.append(prompt, actions);
  return fragment;
}

function buildRenameDeleteActions(
  collection: Collection,
  render: () => void,
): HTMLDivElement {
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
    nameDraft = collection.name;
    mode = { kind: "rename", id: collection.id };
    render();
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
    mode = { kind: "confirm-delete", id: collection.id };
    render();
  });

  actions.append(renameBtn, deleteBtn);
  return actions;
}

function buildSavedSearchRow(
  collection: Collection,
  render: () => void,
): HTMLLIElement {
  const item = document.createElement("li");
  item.className = CSS_CLASS.listItem;

  if (mode.kind === "rename" && mode.id === collection.id) {
    item.append(
      buildNameForm(
        `rdw-rename-${collection.id}`,
        () => {
          const nextName = nameDraft.trim();
          if (nextName.length === 0) {
            return;
          }
          renameCollection(collection.id, nextName);
          mode = { kind: "list" };
          nameDraft = "";
          render();
        },
        () => {
          mode = { kind: "list" };
        },
        render,
      ),
    );
    return item;
  }

  if (mode.kind === "confirm-delete" && mode.id === collection.id) {
    item.append(buildConfirmDelete(collection, render));
    return item;
  }

  const main = document.createElement("div");
  main.className = ROW_MAIN_CLASS;

  const nameBtn = document.createElement("button");
  nameBtn.type = "button";
  nameBtn.className = CSS_CLASS.itemName;
  nameBtn.textContent = collection.name;
  nameBtn.setAttribute(
    "aria-label",
    `${UI_TEXT.openCollection}: ${collection.name}`,
  );
  nameBtn.addEventListener("click", () => {
    openSearch(collection);
  });

  main.append(nameBtn, buildRenameDeleteActions(collection, render));
  item.append(main);
  return item;
}

function buildSaveSearchControls(render: () => void): HTMLElement {
  const wrap = document.createElement("div");

  const searchTags = readTagsFromLocation(window.location.search);
  const canSave = searchTags !== null && searchTags.length > 0;

  if (mode.kind === "save-search") {
    wrap.append(
      buildNameForm(
        SAVE_NAME_ID,
        () => {
          const tags = readTagsFromLocation(window.location.search);
          if (tags === null || tags.length === 0) {
            mode = { kind: "list" };
            render();
            return;
          }
          const name = nameDraft.trim();
          if (name.length === 0) {
            return;
          }
          addCollection(name, tags);
          mode = { kind: "list" };
          nameDraft = "";
          render();
        },
        () => {
          mode = { kind: "list" };
        },
        render,
      ),
    );
    return wrap;
  }

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = CSS_CLASS.primaryButton;
  saveBtn.textContent = UI_TEXT.saveCurrent;
  saveBtn.disabled = !canSave;
  saveBtn.addEventListener("click", () => {
    const tags = readTagsFromLocation(window.location.search);
    if (tags === null || tags.length === 0) {
      return;
    }
    nameDraft = serialize(tags);
    mode = { kind: "save-search" };
    render();
  });
  wrap.append(saveBtn);
  if (!canSave) {
    const hint = document.createElement("p");
    hint.className = CSS_CLASS.hint;
    hint.textContent = UI_TEXT.notOnSearchPage;
    wrap.append(hint);
  }
  return wrap;
}

function buildSavedSearchesSection(render: () => void): HTMLElement {
  const section = document.createElement("section");
  section.className = CSS_CLASS.section;

  const heading = document.createElement("h3");
  heading.className = `${CSS_CLASS.sectionTitle} ${SECTION_HEADING_CLASS}`;
  heading.textContent = SAVED_SEARCHES_HEADING;
  section.append(heading, buildSaveSearchControls(render));

  const saved = listSavedSearches();
  if (saved.length === 0) {
    const empty = document.createElement("p");
    empty.className = CSS_CLASS.hint;
    empty.textContent = EMPTY_SAVED_SEARCHES;
    section.append(empty);
    return section;
  }

  const list = document.createElement("ul");
  list.className = CSS_CLASS.list;
  for (const collection of saved) {
    list.append(buildSavedSearchRow(collection, render));
  }
  section.append(list);
  return section;
}

function buildPlaylistParts(
  queries: string[],
): HTMLUListElement | null {
  if (queries.length <= 1) {
    return null;
  }
  const parts = document.createElement("ul");
  parts.className = PLAYLIST_PARTS_CLASS;
  parts.setAttribute("aria-label", "Playlist parts");
  for (let index = 0; index < queries.length; index += 1) {
    const query = queries[index];
    if (query === undefined) {
      continue;
    }
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = PLAYLIST_PART_CLASS;
    link.href = buildUpdatesSearchUrl(query);
    link.textContent = String(index + 1);
    item.append(link);
    parts.append(item);
  }
  return parts;
}

function buildPlaylistRow(
  playlist: Collection,
  render: () => void,
): HTMLLIElement {
  const item = document.createElement("li");
  item.className = CSS_CLASS.listItem;

  if (mode.kind === "rename" && mode.id === playlist.id) {
    item.append(
      buildNameForm(
        `rdw-rename-${playlist.id}`,
        () => {
          const nextName = nameDraft.trim();
          if (nextName.length === 0) {
            return;
          }
          renameCollection(playlist.id, nextName);
          mode = { kind: "list" };
          nameDraft = "";
          render();
        },
        () => {
          mode = { kind: "list" };
        },
        render,
      ),
    );
    return item;
  }

  if (mode.kind === "confirm-delete" && mode.id === playlist.id) {
    item.append(buildConfirmDelete(playlist, render));
    return item;
  }

  const count = playlistPostCount(playlist);
  const queries = buildPlaylistQueries(
    playlist.postIds ?? [],
    getPlaylistChunkSize(),
  );

  const main = document.createElement("div");
  main.className = ROW_MAIN_CLASS;

  const nameBtn = document.createElement("button");
  nameBtn.type = "button";
  nameBtn.className = CSS_CLASS.itemName;
  nameBtn.textContent = playlist.name;
  nameBtn.setAttribute(
    "aria-label",
    `${OPEN_PLAYLIST}: ${playlist.name}`,
  );
  const canOpen = count > 0 && queries.length > 0;
  nameBtn.disabled = !canOpen;
  nameBtn.addEventListener("click", () => {
    const first = queries[0];
    if (first === undefined) {
      return;
    }
    openPlaylistPart(first);
  });

  main.append(nameBtn, buildRenameDeleteActions(playlist, render));
  item.append(main);

  const meta = document.createElement("p");
  meta.className = PLAYLIST_META_CLASS;
  meta.textContent = postsLabel(count);
  item.append(meta);

  const parts = buildPlaylistParts(queries);
  if (parts !== null) {
    item.append(parts);
  }

  return item;
}

function buildCreatePlaylistControls(render: () => void): HTMLElement {
  const wrap = document.createElement("div");

  if (mode.kind === "create-playlist") {
    wrap.append(
      buildNameForm(
        PLAYLIST_NAME_ID,
        () => {
          const name = nameDraft.trim();
          if (name.length === 0) {
            return;
          }
          createPlaylist(name);
          mode = { kind: "list" };
          nameDraft = "";
          render();
        },
        () => {
          mode = { kind: "list" };
        },
        render,
      ),
    );
    return wrap;
  }

  const createBtn = document.createElement("button");
  createBtn.type = "button";
  createBtn.className = CSS_CLASS.primaryButton;
  createBtn.textContent = NEW_PLAYLIST;
  createBtn.addEventListener("click", () => {
    nameDraft = "";
    mode = { kind: "create-playlist" };
    render();
  });
  wrap.append(createBtn);
  return wrap;
}

function buildPlaylistsSection(render: () => void): HTMLElement {
  const section = document.createElement("section");
  section.className = CSS_CLASS.section;

  const heading = document.createElement("h3");
  heading.className = `${CSS_CLASS.sectionTitle} ${SECTION_HEADING_CLASS}`;
  heading.textContent = PLAYLISTS_HEADING;
  section.append(heading, buildCreatePlaylistControls(render));

  const playlists = listPlaylists();
  if (playlists.length === 0) {
    const empty = document.createElement("p");
    empty.className = CSS_CLASS.hint;
    empty.textContent = EMPTY_PLAYLISTS;
    const hint = document.createElement("p");
    hint.className = CSS_CLASS.hint;
    hint.textContent = EMPTY_PLAYLISTS_HINT;
    section.append(empty, hint);
    return section;
  }

  const list = document.createElement("ul");
  list.className = CSS_CLASS.list;
  for (const playlist of playlists) {
    list.append(buildPlaylistRow(playlist, render));
  }
  section.append(list);
  return section;
}

/**
 * Collections tab body: saved searches + playlists.
 * Phase C should mount this from panel Collections wiring.
 */
export function createCollectionsTab(): HTMLElement {
  const root = document.createElement("div");
  root.className = `${PANEL_UI_CLASS.scrollRegion} ${TAB_CLASS}`;

  const render = (): void => {
    root.replaceChildren(
      buildSavedSearchesSection(render),
      buildPlaylistsSection(render),
    );
  };
  render();
  return root;
}
