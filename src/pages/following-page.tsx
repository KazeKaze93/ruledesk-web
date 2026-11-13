import type { JSX } from "preact";
import { render as preactRender } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import {
  SEARCH_PAGE,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SECTION,
  SEARCH_PATH,
  SEARCH_SECTION,
  TAG_TYPE_INCLUDE,
  UI_TEXT,
} from "../config/constants";
import { log } from "../log";
import { buildSearchUrl, normalizeArtistTag } from "../search/query";
import type { ArtistEntry } from "../storage/schema";
import {
  addArtist,
  getSeenPostId,
  isFollowingArtist,
  load,
  removeArtist,
} from "../storage/store";
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  TextField,
} from "../ui/kit";
import { IconX } from "../ui/kit/icons";
import {
  ARTIST_FILTER_ID,
  ARTIST_FILTER_LABEL,
  ARTISTS_EMPTY_HINT,
  ARTISTS_EMPTY_TITLE,
  ARTISTS_FILTER_THRESHOLD,
  PANEL_UI_CLASS,
  UNFOLLOW_UNDO_LABEL,
  UNFOLLOW_UNDO_MS,
  UNFOLLOWED_PREFIX,
} from "./constants";

const ADD_FORM_CLASS = "rdw-following-add";
const ADD_INPUT_ID = "rdw-following-add-tag";
const OPEN_POSTS_LABEL = "Open Posts";

const OPEN_POSTS_HREF = `${SEARCH_PATH}?${SEARCH_PARAM_PAGE}=${SEARCH_PAGE}&${SEARCH_PARAM_SECTION}=${SEARCH_SECTION}`;

const FOLLOWING_PAGE_CSS = `
.${ADD_FORM_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-end;
}
.${ADD_FORM_CLASS} .rdw-field {
  flex: 1 1 12rem;
  margin: 0;
}
`.trim();

type PendingUnfollow = {
  readonly tag: string;
  readonly timer: ReturnType<typeof setTimeout>;
};

function displayArtistName(tag: string): string {
  return tag.replaceAll("_", " ");
}

function compareArtistTags(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

function readArtists(): ArtistEntry[] {
  return [...load().artists];
}

function AddArtistForm(props: {
  readonly draft: string;
  readonly error: string;
  readonly onDraftChange: (value: string) => void;
  readonly onSubmit: () => void;
}): JSX.Element {
  return (
    <form
      className={ADD_FORM_CLASS}
      onSubmit={(event) => {
        event.preventDefault();
        props.onSubmit();
      }}
    >
      <TextField
        id={ADD_INPUT_ID}
        label={UI_TEXT.artistTagLabel}
        value={props.draft}
        onChange={props.onDraftChange}
      />
      <Button type="submit" variant="primary">
        {UI_TEXT.artistAdd}
      </Button>
      {props.error.length > 0 ? (
        <p className="rdw-error">{props.error}</p>
      ) : null}
    </form>
  );
}

export function FollowingPage(): JSX.Element {
  const [artists, setArtists] = useState<ArtistEntry[]>(() => readArtists());
  const [pending, setPending] = useState<PendingUnfollow[]>([]);
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [addError, setAddError] = useState("");
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  useEffect(() => {
    return () => {
      for (const entry of pendingRef.current) {
        clearTimeout(entry.timer);
      }
    };
  }, []);

  const clearPendingUnfollow = (tag: string): void => {
    setPending((current) => {
      const index = current.findIndex((entry) => entry.tag === tag);
      if (index < 0) {
        return current;
      }
      const removed = current[index];
      if (removed !== undefined) {
        clearTimeout(removed.timer);
      }
      return current.filter((entry) => entry.tag !== tag);
    });
  };

  const onUnfollow = (tag: string): void => {
    const existing = pendingRef.current.find((entry) => entry.tag === tag);
    if (existing !== undefined) {
      clearTimeout(existing.timer);
    }
    removeArtist(tag);
    const timer = setTimeout(() => {
      clearPendingUnfollow(tag);
      setArtists(readArtists());
    }, UNFOLLOW_UNDO_MS);
    setPending([
      ...pendingRef.current.filter((entry) => entry.tag !== tag),
      { tag, timer },
    ]);
    setArtists(readArtists());
  };

  const onUndo = (tag: string): void => {
    clearPendingUnfollow(tag);
    try {
      addArtist(tag);
    } catch (error) {
      log.warn("Undo unfollow failed", error);
    }
    setArtists(readArtists());
  };

  const onAdd = (): void => {
    const normalized = normalizeArtistTag(draft);
    if (normalized === null) {
      setAddError(UI_TEXT.artistInvalid);
      return;
    }
    if (isFollowingArtist(normalized)) {
      setAddError(UI_TEXT.artistDuplicate);
      return;
    }
    try {
      addArtist(normalized);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : UI_TEXT.artistDuplicate;
      setAddError(
        message.toLowerCase().includes("duplicate")
          ? UI_TEXT.artistDuplicate
          : UI_TEXT.artistInvalid,
      );
      return;
    }
    setDraft("");
    setAddError("");
    setArtists(readArtists());
  };

  const pendingTags = new Set(pending.map((entry) => entry.tag));
  const sorted = [...artists].sort((a, b) => compareArtistTags(a.tag, b.tag));
  const showFilter =
    sorted.length + pending.length > ARTISTS_FILTER_THRESHOLD;
  const filterValue = showFilter ? filter.trim().toLowerCase() : "";

  useEffect(() => {
    if (!showFilter && filter.length > 0) {
      setFilter("");
    }
  }, [showFilter, filter]);

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

  const seen = getSeenPostId();
  const count = artists.length;
  const empty = sorted.length === 0 && pending.length === 0;

  return (
    <>
      <style>{FOLLOWING_PAGE_CSS}</style>
      <Card className={PANEL_UI_CLASS.pageCard}>
        <div className={PANEL_UI_CLASS.scrollRegion}>
          <div className={PANEL_UI_CLASS.artistMeta}>
            <p className="rdw-hint">
              {`${String(count)} artist${count === 1 ? "" : "s"}`}
            </p>
            <p className="rdw-hint">
              {seen > 0
                ? `${UI_TEXT.seenUpTo}${String(seen)}`
                : UI_TEXT.seenNothing}
            </p>
          </div>

          <AddArtistForm
            draft={draft}
            error={addError}
            onDraftChange={(value) => {
              setDraft(value);
              if (addError.length > 0) {
                setAddError("");
              }
            }}
            onSubmit={onAdd}
          />

          {empty ? (
            <>
              <EmptyState
                title={ARTISTS_EMPTY_TITLE}
                description={ARTISTS_EMPTY_HINT}
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      window.location.assign(OPEN_POSTS_HREF);
                    }}
                  >
                    {OPEN_POSTS_LABEL}
                  </Button>
                }
              />
            </>
          ) : (
            <>
              {showFilter ? (
                <div className={PANEL_UI_CLASS.artistFilter}>
                  <TextField
                    id={ARTIST_FILTER_ID}
                    label={ARTIST_FILTER_LABEL}
                    value={filter}
                    onChange={setFilter}
                  />
                </div>
              ) : null}
              <ul className={PANEL_UI_CLASS.artistList}>
                {pendingSorted.map((entry) => {
                  if (!matchesFilter(entry.tag)) {
                    return null;
                  }
                  return (
                    <li
                      key={`undo-${entry.tag}`}
                      className={PANEL_UI_CLASS.artistRow}
                      data-tag={entry.tag}
                    >
                      <div className={PANEL_UI_CLASS.artistUndo}>
                        <span>
                          {`${UNFOLLOWED_PREFIX}${displayArtistName(entry.tag)}`}
                        </span>
                        <Button
                          variant="secondary"
                          size="s"
                          onClick={() => {
                            onUndo(entry.tag);
                          }}
                        >
                          {UNFOLLOW_UNDO_LABEL}
                        </Button>
                      </div>
                    </li>
                  );
                })}
                {sorted.map((artist) => {
                  if (
                    pendingTags.has(artist.tag) ||
                    !matchesFilter(artist.tag)
                  ) {
                    return null;
                  }
                  return (
                    <li
                      key={artist.tag}
                      className={PANEL_UI_CLASS.artistRow}
                      data-tag={artist.tag}
                    >
                      <a
                        className={PANEL_UI_CLASS.artistLink}
                        href={buildSearchUrl([
                          { tag: artist.tag, type: TAG_TYPE_INCLUDE },
                        ])}
                        title={artist.tag}
                      >
                        {displayArtistName(artist.tag)}
                      </a>
                      <IconButton
                        label={`Unfollow ${artist.tag}`}
                        onClick={() => {
                          onUnfollow(artist.tag);
                        }}
                      >
                        <IconX size={14} />
                      </IconButton>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </Card>
    </>
  );
}

export function createFollowingPage(): HTMLElement {
  const root = document.createElement("div");
  preactRender(<FollowingPage />, root);
  return root;
}
