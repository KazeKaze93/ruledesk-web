import type { JSX } from "preact";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";

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
import { PostActionsList } from "./post-actions-list";
import {
  SOURCE_LINK_REL,
  collectMoreLinks,
  findICameTarget,
  findOriginalAnchor,
  findPostComments,
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
const TEXT_COMMENTS = "Comments";
const LABEL_ORIGINAL = "Open original image";
const LABEL_VOTE_UP = "Vote up";
const LABEL_ICAME = "I came";
const WARN_ICAME_COUNT =
  "post-actions: I came counter — нужна разметка";

const CLASS_ROOT = "rdw-post-panel";
const CLASS_CARD = "rdw-post-panel-card";
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
const CLASS_COMMENTS = "rdw-post-panel-comments";
const CLASS_COMMENTS_HOST = "rdw-post-panel-comments-host";

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
  const [hasComments] = useState(() => findPostComments() !== null);

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

  const showScoreCard = props.postId !== null || iCame !== null;

  return (
    <div className={CLASS_ROOT}>
      <Card className={CLASS_CARD} as="section">
        <div className={CLASS_ACTIONS}>
          {props.postId !== null ? (
            <Button
              variant={favorited ? "primary" : "secondary"}
              size="m"
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
      </Card>

      {showScoreCard ? (
        <Card className={CLASS_CARD} as="section">
          {props.postId !== null ? (
            <div className={CLASS_SCORE}>
              <div>
                <SectionLabel>{TEXT_SCORE}</SectionLabel>
                <b className={CLASS_SCORE_VALUE}>{scoreText}</b>
              </div>
              <Button
                variant="secondary"
                size="m"
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

          {iCame !== null ? (
            <div className={CLASS_ICAME}>
              <Button
                variant="secondary"
                size="m"
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
        </Card>
      ) : null}

      {moreLinks.length > 0 ? (
        <Card className={CLASS_CARD} as="section">
          <PostActionsList links={moreLinks} />
        </Card>
      ) : null}

      {stats.length > 0 ? (
        <Card className={`${CLASS_CARD} ${CLASS_STATS}`} as="section">
          {stats.map((row) => (
            <StatRowView key={row.label} row={row} />
          ))}
        </Card>
      ) : null}

      {hasComments ? <CommentsCard /> : null}
    </div>
  );
}

function CommentsCard(): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    const comments = findPostComments();
    if (host === null || comments === null) {
      return;
    }
    if (comments.parentElement === host) {
      return;
    }
    const originParent = comments.parentNode;
    const originNext = comments.nextSibling;
    host.append(comments);
    return (): void => {
      if (originParent === null) {
        return;
      }
      if (comments.parentElement === host || comments.parentNode === null) {
        originParent.insertBefore(comments, originNext);
      }
    };
  }, []);

  return (
    <Card className={`${CLASS_CARD} ${CLASS_COMMENTS}`} as="section">
      <SectionLabel>{TEXT_COMMENTS}</SectionLabel>
      <div className={CLASS_COMMENTS_HOST} ref={hostRef} />
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
  CLASS_CARD,
  CLASS_FAV,
  CLASS_ORIGINAL,
  CLASS_SCORE_VALUE,
  CLASS_VOTE,
  CLASS_STATS,
  CLASS_ICAME,
  CLASS_ICAME_COUNT,
  CLASS_SOURCE,
  CLASS_COMMENTS,
  CLASS_COMMENTS_HOST,
  TEXT_FAVORITE,
  TEXT_IN_FAVORITES,
  TEXT_ORIGINAL,
  TEXT_VOTE_UP,
  TEXT_ICAME,
  TEXT_COMMENTS,
  TEXT_SCORE_UNKNOWN,
};
