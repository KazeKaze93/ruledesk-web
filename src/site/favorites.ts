import {
  ADDFAV_PARAM_ID,
  ADDFAV_PATH,
  ADDFAV_RESPONSE_ADDED,
  ADDFAV_RESPONSE_ALREADY,
  ADDFAV_RESPONSE_NOT_LOGGED_IN,
  FETCH_CREDENTIALS,
  FETCH_METHOD_GET,
  SITE_ORIGIN,
  VOTE_PAGE,
  VOTE_PARAM_ID,
  VOTE_PARAM_PAGE,
  VOTE_PARAM_SECTION,
  VOTE_PARAM_TYPE,
  VOTE_PATH,
  VOTE_SECTION,
  VOTE_TYPE_UP,
} from "../config/constants";
import { log } from "../log";

export type FavoriteResult =
  | { status: "added"; score?: number }
  | { status: "already" }
  | { status: "not_logged_in" }
  | { status: "error" };

function buildAddFavUrl(postId: string): string {
  const params = new URLSearchParams();
  params.set(ADDFAV_PARAM_ID, postId);
  return `${SITE_ORIGIN}${ADDFAV_PATH}?${params.toString()}`;
}

function buildVoteUrl(postId: string): string {
  const params = new URLSearchParams();
  params.set(VOTE_PARAM_PAGE, VOTE_PAGE);
  params.set(VOTE_PARAM_SECTION, VOTE_SECTION);
  params.set(VOTE_PARAM_ID, postId);
  params.set(VOTE_PARAM_TYPE, VOTE_TYPE_UP);
  return `${SITE_ORIGIN}${VOTE_PATH}?${params.toString()}`;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    method: FETCH_METHOD_GET,
    credentials: FETCH_CREDENTIALS,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)}`);
  }
  return (await response.text()).trim();
}

function parseVoteScore(raw: string): number | undefined {
  if (raw.length === 0) {
    return undefined;
  }
  const score = Number(raw);
  if (!Number.isFinite(score)) {
    return undefined;
  }
  return score;
}

export async function addFavorite(postId: string): Promise<FavoriteResult> {
  let addResponse: string;
  try {
    addResponse = await fetchText(buildAddFavUrl(postId));
  } catch (error) {
    log.warn("addfav request failed", postId, error);
    return { status: "error" };
  }

  if (addResponse === ADDFAV_RESPONSE_ALREADY) {
    return { status: "already" };
  }
  if (addResponse === ADDFAV_RESPONSE_NOT_LOGGED_IN) {
    return { status: "not_logged_in" };
  }
  if (addResponse !== ADDFAV_RESPONSE_ADDED) {
    log.warn("Unexpected addfav response", postId, addResponse);
    return { status: "error" };
  }

  try {
    const voteRaw = await fetchText(buildVoteUrl(postId));
    const score = parseVoteScore(voteRaw);
    if (score === undefined) {
      return { status: "added" };
    }
    return { status: "added", score };
  } catch (error) {
    log.warn("vote request failed after addfav", postId, error);
    return { status: "added" };
  }
}
