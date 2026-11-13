import type { JSX } from "preact";
import { render as preactRender } from "preact";
import { useEffect, useState } from "preact/hooks";

import { UI_TEXT } from "../../config/constants";
import {
  buildPlaylistQueries,
  buildSearchUrl,
  buildUpdatesSearchUrl,
  readTagsFromLocation,
  serialize,
} from "../../search/query";
import { isPlaylist, type Collection } from "../../storage/schema";
import {
  addCollection,
  createPlaylist,
  deleteCollection,
  getPlaylistChunkSize,
  listPlaylists,
  load,
  renameCollection,
} from "../../storage/store";
import { Button, EmptyState, IconButton, SectionLabel, TextField } from "../kit";
import { IconTrash } from "../kit/icons";
import { PANEL_UI_CLASS } from "./constants";

const TAB_CLASS = "rdw-collections-tab";
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
.${TAB_CLASS} .${ROW_MAIN_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.${TAB_CLASS} .${PLAYLIST_META_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
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
  color: var(--rdw-accent);
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
}
.${TAB_CLASS} .${PLAYLIST_PART_CLASS}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
`.trim();

type TabMode =
  | { kind: "list" }
  | { kind: "save-search" }
  | { kind: "create-playlist" }
  | { kind: "rename"; id: string }
  | { kind: "confirm-delete"; id: string };

let sharedMode: TabMode = { kind: "list" };
let sharedNameDraft = "";

/** Clears transient rename/save UI state (tests and remount hygiene). */
export function resetCollectionsTabState(): void {
  sharedMode = { kind: "list" };
  sharedNameDraft = "";
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

function NameForm(props: {
  readonly inputId: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
}): JSX.Element {
  useEffect(() => {
    const input = document.getElementById(props.inputId);
    if (input instanceof HTMLInputElement) {
      input.focus();
      input.select();
    }
  }, [props.inputId]);

  return (
    <form
      className="rdw-form"
      onSubmit={(event) => {
        event.preventDefault();
        props.onSubmit();
      }}
    >
      <TextField
        id={props.inputId}
        label={UI_TEXT.nameLabel}
        value={props.value}
        onChange={props.onChange}
      />
      <div className="rdw-form-actions">
        <Button type="submit" variant="primary">
          {UI_TEXT.save}
        </Button>
        <Button type="button" variant="secondary" onClick={props.onCancel}>
          {UI_TEXT.cancel}
        </Button>
      </div>
    </form>
  );
}

function RenameDeleteActions(props: {
  readonly collection: Collection;
  readonly onRename: () => void;
  readonly onDelete: () => void;
}): JSX.Element {
  return (
    <div className="rdw-item-actions">
      <Button
        variant="secondary"
        size="s"
        aria-label={`${UI_TEXT.rename}: ${props.collection.name}`}
        onClick={props.onRename}
      >
        {UI_TEXT.rename}
      </Button>
      <IconButton
        label={`${UI_TEXT.delete}: ${props.collection.name}`}
        onClick={props.onDelete}
      >
        <IconTrash size={14} />
      </IconButton>
    </div>
  );
}

export function CollectionsTab(): JSX.Element {
  const [mode, setMode] = useState<TabMode>(sharedMode);
  const [nameDraft, setNameDraft] = useState(sharedNameDraft);
  const [, setTick] = useState(0);
  const refresh = (): void => {
    setTick((value) => value + 1);
  };

  const setModeBoth = (next: TabMode): void => {
    sharedMode = next;
    setMode(next);
  };
  const setDraftBoth = (next: string): void => {
    sharedNameDraft = next;
    setNameDraft(next);
  };

  const saved = listSavedSearches();
  const playlists = listPlaylists();
  const searchTags = readTagsFromLocation(window.location.search);
  const canSave = searchTags !== null && searchTags.length > 0;

  return (
    <>
      <style>{COLLECTIONS_TAB_CSS}</style>
      <div className={`${PANEL_UI_CLASS.scrollRegion} ${TAB_CLASS}`}>
        <section className="rdw-section">
          <SectionLabel>{SAVED_SEARCHES_HEADING}</SectionLabel>
          {mode.kind === "save-search" ? (
            <NameForm
              inputId={SAVE_NAME_ID}
              value={nameDraft}
              onChange={setDraftBoth}
              onSubmit={() => {
                const tags = readTagsFromLocation(window.location.search);
                if (tags === null || tags.length === 0) {
                  setModeBoth({ kind: "list" });
                  refresh();
                  return;
                }
                const name = nameDraft.trim();
                if (name.length === 0) {
                  return;
                }
                addCollection(name, tags);
                setModeBoth({ kind: "list" });
                setDraftBoth("");
                refresh();
              }}
              onCancel={() => {
                setModeBoth({ kind: "list" });
              }}
            />
          ) : (
            <>
              <Button
                variant="primary"
                disabled={!canSave}
                onClick={() => {
                  const tags = readTagsFromLocation(window.location.search);
                  if (tags === null || tags.length === 0) {
                    return;
                  }
                  setDraftBoth(serialize(tags));
                  setModeBoth({ kind: "save-search" });
                }}
              >
                {UI_TEXT.saveCurrent}
              </Button>
              {!canSave ? (
                <p className="rdw-hint">{UI_TEXT.notOnSearchPage}</p>
              ) : null}
            </>
          )}
          {saved.length === 0 ? (
            <p className="rdw-hint">{EMPTY_SAVED_SEARCHES}</p>
          ) : (
            <ul className="rdw-list">
              {saved.map((collection) => (
                <li key={collection.id} className="rdw-list-item">
                  {mode.kind === "rename" && mode.id === collection.id ? (
                    <NameForm
                      inputId={`rdw-rename-${collection.id}`}
                      value={nameDraft}
                      onChange={setDraftBoth}
                      onSubmit={() => {
                        const nextName = nameDraft.trim();
                        if (nextName.length === 0) {
                          return;
                        }
                        renameCollection(collection.id, nextName);
                        setModeBoth({ kind: "list" });
                        setDraftBoth("");
                        refresh();
                      }}
                      onCancel={() => {
                        setModeBoth({ kind: "list" });
                      }}
                    />
                  ) : mode.kind === "confirm-delete" &&
                    mode.id === collection.id ? (
                    <>
                      <p className="rdw-hint">
                        {`${UI_TEXT.confirmDelete} (${collection.name})`}
                      </p>
                      <div className="rdw-confirm-row">
                        <Button
                          variant="danger"
                          onClick={() => {
                            deleteCollection(collection.id);
                            setModeBoth({ kind: "list" });
                            setDraftBoth("");
                            refresh();
                          }}
                        >
                          {UI_TEXT.confirm}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setModeBoth({ kind: "list" });
                          }}
                        >
                          {UI_TEXT.cancel}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className={ROW_MAIN_CLASS}>
                      <button
                        type="button"
                        className="rdw-item-name"
                        aria-label={`${UI_TEXT.openCollection}: ${collection.name}`}
                        onClick={() => {
                          window.location.assign(
                            buildSearchUrl(collection.tags),
                          );
                        }}
                      >
                        {collection.name}
                      </button>
                      <RenameDeleteActions
                        collection={collection}
                        onRename={() => {
                          setDraftBoth(collection.name);
                          setModeBoth({ kind: "rename", id: collection.id });
                        }}
                        onDelete={() => {
                          setModeBoth({
                            kind: "confirm-delete",
                            id: collection.id,
                          });
                        }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rdw-section">
          <SectionLabel>{PLAYLISTS_HEADING}</SectionLabel>
          {mode.kind === "create-playlist" ? (
            <NameForm
              inputId={PLAYLIST_NAME_ID}
              value={nameDraft}
              onChange={setDraftBoth}
              onSubmit={() => {
                const name = nameDraft.trim();
                if (name.length === 0) {
                  return;
                }
                createPlaylist(name);
                setModeBoth({ kind: "list" });
                setDraftBoth("");
                refresh();
              }}
              onCancel={() => {
                setModeBoth({ kind: "list" });
              }}
            />
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                setDraftBoth("");
                setModeBoth({ kind: "create-playlist" });
              }}
            >
              {NEW_PLAYLIST}
            </Button>
          )}
          {playlists.length === 0 ? (
            <EmptyState
              title={EMPTY_PLAYLISTS}
              description={EMPTY_PLAYLISTS_HINT}
            />
          ) : (
            <ul className="rdw-list">
              {playlists.map((playlist) => {
                const count = playlistPostCount(playlist);
                const queries = buildPlaylistQueries(
                  playlist.postIds ?? [],
                  getPlaylistChunkSize(),
                );
                const canOpen = count > 0 && queries.length > 0;
                return (
                  <li key={playlist.id} className="rdw-list-item">
                    {mode.kind === "rename" && mode.id === playlist.id ? (
                      <NameForm
                        inputId={`rdw-rename-${playlist.id}`}
                        value={nameDraft}
                        onChange={setDraftBoth}
                        onSubmit={() => {
                          const nextName = nameDraft.trim();
                          if (nextName.length === 0) {
                            return;
                          }
                          renameCollection(playlist.id, nextName);
                          setModeBoth({ kind: "list" });
                          setDraftBoth("");
                          refresh();
                        }}
                        onCancel={() => {
                          setModeBoth({ kind: "list" });
                        }}
                      />
                    ) : mode.kind === "confirm-delete" &&
                      mode.id === playlist.id ? (
                      <>
                        <p className="rdw-hint">
                          {`${UI_TEXT.confirmDelete} (${playlist.name})`}
                        </p>
                        <div className="rdw-confirm-row">
                          <Button
                            variant="danger"
                            onClick={() => {
                              deleteCollection(playlist.id);
                              setModeBoth({ kind: "list" });
                              setDraftBoth("");
                              refresh();
                            }}
                          >
                            {UI_TEXT.confirm}
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setModeBoth({ kind: "list" });
                            }}
                          >
                            {UI_TEXT.cancel}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={ROW_MAIN_CLASS}>
                          <button
                            type="button"
                            className="rdw-item-name"
                            aria-label={`${OPEN_PLAYLIST}: ${playlist.name}`}
                            disabled={!canOpen}
                            onClick={() => {
                              const first = queries[0];
                              if (first === undefined) {
                                return;
                              }
                              window.location.assign(
                                buildUpdatesSearchUrl(first),
                              );
                            }}
                          >
                            {playlist.name}
                          </button>
                          <RenameDeleteActions
                            collection={playlist}
                            onRename={() => {
                              setDraftBoth(playlist.name);
                              setModeBoth({
                                kind: "rename",
                                id: playlist.id,
                              });
                            }}
                            onDelete={() => {
                              setModeBoth({
                                kind: "confirm-delete",
                                id: playlist.id,
                              });
                            }}
                          />
                        </div>
                        <p className={PLAYLIST_META_CLASS}>
                          {postsLabel(count)}
                        </p>
                        {queries.length > 1 ? (
                          <ul
                            className={PLAYLIST_PARTS_CLASS}
                            aria-label="Playlist parts"
                          >
                            {queries.map((query, index) => (
                              <li key={`${playlist.id}-${String(index)}`}>
                                <a
                                  className={PLAYLIST_PART_CLASS}
                                  href={buildUpdatesSearchUrl(query)}
                                >
                                  {String(index + 1)}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

export function createCollectionsTab(): HTMLElement {
  const root = document.createElement("div");
  preactRender(<CollectionsTab />, root);
  return root;
}
