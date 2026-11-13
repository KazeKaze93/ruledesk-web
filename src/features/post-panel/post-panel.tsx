import type { JSX } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

import { UI_TEXT } from "../../config/constants";
import { log } from "../../log";
import { addFavorite, removeFavorite, voteUp } from "../../site/favorites";
import { addFav, isFav, removeFav } from "../../storage/favs";
import {
  Button,
  Card,
  IconExternalLink,
  IconStar,
  IconStarFilled,
  SectionLabel,
} from "../../ui/kit";
import { CollectionsMenu } from "./collections-menu";
import { MoreMenu } from "./more-menu";
import {
  SOURCE_LINK_REL,
  collectMoreLinks,
  findICameTarget,
  findOriginalAnchor,
  observeScoreSpan,
  readScoreText,
  readStatRows,
  writeScoreText,
  type ICameTarget,
  type MoreLink,
  type StatRow,
} from "./site-reads";

const TEXT_FAVORITE = "Favorite";
const TEXT_IN_FAVORITES = "In favorites";
const TEXT_ORIGINAL = "Original";
const TEXT_SCORE = "Score";
const TEXT_VOTE_UP = "Vote up";
const TEXT_SCORE_UNKNOWN = "—";
const TEXT_ICAME = "I came";
const LABEL_ORIGINAL = "Open original image";
const LABEL_VOTE_UP = "Vote up";
const LABEL_ICAME = "I came";
const WARN_ICAME_COUNT =
  "post-actions: I came counter — нужна разметка";

const CLASS_ROOT = "rdw-post-panel";
const CLASS_ACTIONS = "rdw-post-panel-actions";
const CLASS_FAV = "rdw-post-panel-fav";
const CLASS_ORIGINAL = "rdw-post-panel-original";
const CLASS_SCORE = "rdw-post-panel-score";
const CLASS_SCORE_VALUE = "rdw-post-panel-score-value";
const CLASS_VOTE = "rdw-post-panel-vote";
const CLASS_STATS = "rdw-post-panel-stats";
const CLASS_STAT_LABEL = "rdw-post-panel-stat-label";
const CLASS_STAT_VALUE = "rdw-post-panel-stat-value";
const CLASS_SOURCE = "rdw-post-panel-source";
const CLASS_ICAME = "rdw-post-panel-icame";
const CLASS_ICAME_COUNT = "rdw-post-panel-icame-count";

export type PostPanelProps = {
  readonly postId: string | null;
};

function parseNumericPostId(postId: string | null): number | null {
  if (postId === null || postId.length === 0) {
    return null;
  }
  const parsed = Number(postId);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const truncated = Math.trunc(parsed);
  return truncated < 0 ? null : truncated;
}

export function PostPanel(props: PostPanelProps): JSX.Element {
  const numericId = parseNumericPostId(props.postId);
  const [favorited, setFavorited] = useState(
    () => (props.postId !== null ? isFav(props.postId) : false),
  );
  const [favPending, setFavPending] = useState(false);
  const [scoreText, setScoreText] = useState(() => {
    if (props.postId === null) {
      return TEXT_SCORE_UNKNOWN;
    }
    return readScoreText(props.postId) ?? TEXT_SCORE_UNKNOWN;
  });
  const [votePending, setVotePending] = useState(false);
  const [stats] = useState<readonly StatRow[]>(() => readStatRows());
  const [moreLinks] = useState<readonly MoreLink[]>(() => collectMoreLinks());
  const [originalHref] = useState<string | null>(() => {
    const anchor = findOriginalAnchor();
    return anchor?.href ?? null;
  });
  const [iCame] = useState<ICameTarget | null>(() => findICameTarget());

  useEffect(() => {
    if (props.postId === null) {
      return;
    }
    return observeScoreSpan(props.postId, (text) => {
      setScoreText(text.length > 0 ? text : TEXT_SCORE_UNKNOWN);
    });
  }, [props.postId]);

  useEffect(() => {
    if (iCame !== null && iCame.count === null) {
      log.warn(WARN_ICAME_COUNT);
    }
  }, [iCame]);

  const onFavClick = useCallback(async (): Promise<void> => {
    if (props.postId === null || favPending) {
      return;
    }
    setFavPending(true);
    try {
      if (favorited) {
        const result = await removeFavorite(props.postId);
        if (result.status === "removed") {
          removeFav(props.postId);
          setFavorited(false);
          return;
        }
        log.warn("post-actions: remove favorite failed", props.postId, result);
        return;
      }
      const result = await addFavorite(props.postId);
      if (result.status === "added" || result.status === "already") {
        addFav(props.postId);
        setFavorited(true);
        if (result.status === "added" && result.score !== undefined) {
          writeScoreText(props.postId, result.score);
          setScoreText(String(result.score));
        }
        return;
      }
      if (result.status === "not_logged_in") {
        log.warn("post-actions: favorite requires login", props.postId);
        return;
      }
      log.warn("post-actions: favorite failed", props.postId, result);
    } finally {
      setFavPending(false);
    }
  }, [favPending, favorited, props.postId]);

  const onVoteClick = useCallback(async (): Promise<void> => {
    if (props.postId === null || votePending) {
      return;
    }
    setVotePending(true);
    try {
      const score = await voteUp(props.postId);
      if (score !== null) {
        writeScoreText(props.postId, score);
        setScoreText(String(score));
      }
    } finally {
      setVotePending(false);
    }
  }, [props.postId, votePending]);

  const onICameClick = useCallback((): void => {
    iCame?.anchor.click();
  }, [iCame]);

  return (
    <Card className={CLASS_ROOT} as="section">
      <div className={CLASS_ACTIONS}>
        {props.postId !== null ? (
          <Button
            variant={favorited ? "primary" : "secondary"}
            size="s"
            className={CLASS_FAV}
            loading={favPending}
            aria-label={
              favorited
                ? `${UI_TEXT.cardFavRemoveLabel} ${props.postId}`
                : `${UI_TEXT.cardFavAddLabel} ${props.postId}`
            }
            onClick={() => {
              void onFavClick();
            }}
          >
            {favorited ? (
              <IconStarFilled size={14} />
            ) : (
              <IconStar size={14} />
            )}
            {favorited ? TEXT_IN_FAVORITES : TEXT_FAVORITE}
          </Button>
        ) : null}

        {numericId !== null ? <CollectionsMenu postId={numericId} /> : null}

        {originalHref !== null ? (
          <a
            className={CLASS_ORIGINAL}
            href={originalHref}
            target="_blank"
            rel="noopener"
            aria-label={LABEL_ORIGINAL}
          >
            {TEXT_ORIGINAL}
            <IconExternalLink size={12} />
          </a>
        ) : null}
      </div>

      {props.postId !== null ? (
        <div className={CLASS_SCORE}>
          <div>
            <SectionLabel>{TEXT_SCORE}</SectionLabel>
            <b className={CLASS_SCORE_VALUE}>{scoreText}</b>
          </div>
          <Button
            variant="secondary"
            size="s"
            className={CLASS_VOTE}
            loading={votePending}
            aria-label={LABEL_VOTE_UP}
            onClick={() => {
              void onVoteClick();
            }}
          >
            {TEXT_VOTE_UP}
          </Button>
        </div>
      ) : null}

      {stats.length > 0 ? (
        <div className={CLASS_STATS}>
          {stats.map((row) => (
            <StatRowView key={row.label} row={row} />
          ))}
        </div>
      ) : null}

      {iCame !== null ? (
        <div className={CLASS_ICAME}>
          <Button
            variant="secondary"
            size="s"
            aria-label={LABEL_ICAME}
            onClick={onICameClick}
          >
            {TEXT_ICAME}
          </Button>
          {iCame.count !== null ? (
            <span className={CLASS_ICAME_COUNT}>{iCame.count}</span>
          ) : null}
        </div>
      ) : null}

      <MoreMenu links={moreLinks} />
    </Card>
  );
}

function StatRowView(props: { readonly row: StatRow }): JSX.Element {
  const { row } = props;
  return (
    <>
      <span className={CLASS_STAT_LABEL}>{row.label}</span>
      {row.label === "Source" && row.href !== null ? (
        <a
          className={`${CLASS_STAT_VALUE} ${CLASS_SOURCE}`}
          href={row.href}
          title={row.href}
          rel={SOURCE_LINK_REL}
        >
          {row.value}
        </a>
      ) : row.href !== null ? (
        <a className={CLASS_STAT_VALUE} href={row.href}>
          {row.value}
        </a>
      ) : (
        <div className={CLASS_STAT_VALUE}>{row.value}</div>
      )}
    </>
  );
}

export {
  CLASS_ROOT,
  CLASS_FAV,
  CLASS_ORIGINAL,
  CLASS_SCORE_VALUE,
  CLASS_VOTE,
  CLASS_STATS,
  CLASS_ICAME,
  CLASS_ICAME_COUNT,
  CLASS_SOURCE,
  TEXT_FAVORITE,
  TEXT_IN_FAVORITES,
  TEXT_ORIGINAL,
  TEXT_VOTE_UP,
  TEXT_ICAME,
  TEXT_SCORE_UNKNOWN,
};
