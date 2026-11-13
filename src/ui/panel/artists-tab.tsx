import type { JSX } from "preact";
import { useEffect } from "preact/hooks";

import { TAG_TYPE_INCLUDE, UI_TEXT } from "../../config/constants";
import { buildSearchUrl } from "../../search/query";
import type { ArtistEntry } from "../../storage/schema";
import { getSeenPostId } from "../../storage/store";
import { Button, EmptyState, IconButton, TextField } from "../kit";
import { IconX } from "../kit/icons";
import {
  ARTIST_FILTER_ID,
  ARTIST_FILTER_LABEL,
  ARTISTS_EMPTY_HINT,
  ARTISTS_FILTER_THRESHOLD,
  PANEL_UI_CLASS,
  UNFOLLOW_UNDO_LABEL,
  UNFOLLOWED_PREFIX,
} from "./constants";

export type PendingUnfollow = {
  readonly tag: string;
  readonly timer: ReturnType<typeof setTimeout>;
};

export type ArtistsTabProps = {
  readonly artists: readonly ArtistEntry[];
  readonly pending: readonly PendingUnfollow[];
  readonly filter: string;
  readonly onFilterChange: (value: string) => void;
  readonly onUnfollow: (tag: string) => void;
  readonly onUndo: (tag: string) => void;
};

function displayArtistName(tag: string): string {
  return tag.replaceAll("_", " ");
}

function compareArtistTags(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function ArtistsTab(props: ArtistsTabProps): JSX.Element {
  const pendingTags = new Set(props.pending.map((entry) => entry.tag));
  const sorted = [...props.artists].sort((a, b) =>
    compareArtistTags(a.tag, b.tag),
  );
  const showFilter =
    sorted.length + props.pending.length > ARTISTS_FILTER_THRESHOLD;
  const filterValue = showFilter ? props.filter.trim().toLowerCase() : "";

  useEffect(() => {
    if (!showFilter && props.filter.length > 0) {
      props.onFilterChange("");
    }
  }, [showFilter, props.filter, props.onFilterChange]);

  const matchesFilter = (tag: string): boolean => {
    if (filterValue.length === 0) {
      return true;
    }
    return (
      tag.toLowerCase().includes(filterValue) ||
      displayArtistName(tag).toLowerCase().includes(filterValue)
    );
  };

  const pendingSorted = [...props.pending].sort((a, b) =>
    compareArtistTags(a.tag, b.tag),
  );

  const seen = getSeenPostId();
  const count = props.artists.length;
  const empty = sorted.length === 0 && props.pending.length === 0;

  return (
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

      {empty ? (
        <EmptyState title={ARTISTS_EMPTY_HINT} />
      ) : (
        <>
          {showFilter ? (
            <div className={PANEL_UI_CLASS.artistFilter}>
              <TextField
                id={ARTIST_FILTER_ID}
                label={ARTIST_FILTER_LABEL}
                value={props.filter}
                onChange={props.onFilterChange}
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
                        props.onUndo(entry.tag);
                      }}
                    >
                      {UNFOLLOW_UNDO_LABEL}
                    </Button>
                  </div>
                </li>
              );
            })}
            {sorted.map((artist) => {
              if (pendingTags.has(artist.tag) || !matchesFilter(artist.tag)) {
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
                      props.onUnfollow(artist.tag);
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
  );
}
