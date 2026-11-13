import type { JSX } from "preact";
import { useCallback, useMemo, useRef, useState } from "preact/hooks";

import type { Collection } from "../../storage/schema";
import {
  addPostToPlaylist,
  createPlaylist,
  listPlaylists,
  playlistsContaining,
  removePostFromPlaylist,
} from "../../storage/store";
import {
  ANCHORED_POPOVER_WIDTH_PX,
  Button,
  IconCheck,
  IconPlus,
  Popover,
  TextField,
} from "../../ui/kit";

const TEXT_COLLECTIONS = "Collections";
const TEXT_FILTER_PLACEHOLDER = "Filter collections…";
const TEXT_NEW = "New custom collection";
const TEXT_CREATE = "Create";
const TEXT_NEW_NAME_LABEL = "New collection name";
const ARIA_COLLECTIONS = "Custom collections";
const LABEL_TOGGLE_PREFIX = "Toggle collection";

const KEY_ENTER = "Enter";

const CLASS_WRAP = "rdw-post-panel-collections";
const CLASS_TRIGGER = "rdw-post-panel-collections-btn";
const CLASS_ITEM = "rdw-post-panel-collection-item";
const CLASS_CHECK = "rdw-post-panel-collection-check";
const CLASS_NAME = "rdw-post-panel-collection-name";
const CLASS_NEW = "rdw-post-panel-collection-new";
const CLASS_NEW_FORM = "rdw-post-panel-collection-new-form";

export type CollectionsMenuProps = {
  readonly postId: number;
};

function memberIdSet(postId: number): Set<string> {
  return new Set(playlistsContaining(postId).map((item) => item.id));
}

function filterPlaylists(
  playlists: readonly Collection[],
  query: string,
): Collection[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) {
    return [...playlists];
  }
  return playlists.filter((item) =>
    item.name.toLowerCase().includes(trimmed),
  );
}

export function CollectionsMenu(
  props: CollectionsMenuProps,
): JSX.Element {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [revision, setRevision] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const playlists = useMemo(() => {
    void revision;
    return listPlaylists();
  }, [revision]);

  const members = useMemo(() => {
    void revision;
    return memberIdSet(props.postId);
  }, [props.postId, revision]);

  const visible = useMemo(
    () => filterPlaylists(playlists, filter),
    [playlists, filter],
  );

  const bump = useCallback((): void => {
    setRevision((value) => value + 1);
  }, []);

  const close = useCallback((): void => {
    setOpen(false);
    setCreating(false);
    setNewName("");
    setFilter("");
  }, []);

  const bindTrigger = useCallback((node: HTMLDivElement | null): void => {
    const button = node?.querySelector("button");
    triggerRef.current = button instanceof HTMLButtonElement ? button : null;
  }, []);

  const toggleMembership = useCallback(
    (playlistId: string): void => {
      if (members.has(playlistId)) {
        removePostFromPlaylist(playlistId, props.postId);
      } else {
        addPostToPlaylist(playlistId, props.postId);
      }
      bump();
    },
    [bump, members, props.postId],
  );

  const commitNew = useCallback((): void => {
    const name = newName.trim();
    if (name.length === 0) {
      return;
    }
    const playlist = createPlaylist(name);
    addPostToPlaylist(playlist.id, props.postId);
    bump();
    setCreating(false);
    setNewName("");
  }, [bump, newName, props.postId]);

  return (
    <div className={CLASS_WRAP} ref={bindTrigger}>
      <Button
        variant="secondary"
        size="m"
        className={CLASS_TRIGGER}
        aria-label={TEXT_COLLECTIONS}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        <IconPlus size={14} />
        {TEXT_COLLECTIONS}
      </Button>
      <Popover
        open={open}
        onClose={close}
        anchorRef={triggerRef}
        widthPx={ANCHORED_POPOVER_WIDTH_PX}
        aria-label={ARIA_COLLECTIONS}
      >
        <TextField
          value={filter}
          onChange={setFilter}
          placeholder={TEXT_FILTER_PLACEHOLDER}
          aria-label={TEXT_FILTER_PLACEHOLDER}
        />
        {visible.map((playlist) => {
          const checked = members.has(playlist.id);
          return (
            <button
              key={playlist.id}
              type="button"
              className={CLASS_ITEM}
              role="menuitemcheckbox"
              aria-checked={checked}
              aria-label={`${LABEL_TOGGLE_PREFIX} ${playlist.name}`}
              onClick={() => {
                toggleMembership(playlist.id);
              }}
            >
              <span className={CLASS_CHECK} aria-hidden="true">
                {checked ? <IconCheck size={14} /> : null}
              </span>
              <span className={CLASS_NAME}>{playlist.name}</span>
            </button>
          );
        })}
        {creating ? (
          <div
            className={CLASS_NEW_FORM}
            onKeyDown={(event) => {
              if (event.key === KEY_ENTER) {
                event.preventDefault();
                commitNew();
              }
            }}
          >
            <TextField
              value={newName}
              onChange={setNewName}
              label={TEXT_NEW_NAME_LABEL}
              aria-label={TEXT_NEW_NAME_LABEL}
            />
            <Button variant="primary" size="s" onClick={commitNew}>
              {TEXT_CREATE}
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="s"
            className={CLASS_NEW}
            onClick={() => {
              setCreating(true);
            }}
          >
            <IconPlus size={14} />
            {TEXT_NEW}
          </Button>
        )}
      </Popover>
    </div>
  );
}

export { TEXT_COLLECTIONS, CLASS_TRIGGER as CLASS_COLLECTIONS_BTN };
