import { log } from "../log";
import { load, setPostSeenMark } from "../storage/store";
import { readPostIdFromSearch } from "../site/pages";
import {
  SITE_SELECTORS,
  extractPostIdFromThumb,
} from "../site/selectors";
import {
  featureBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

const SEEN_DIM_FEATURE_ID = "seen-dim";
const SEEN_CLASS = "rdw-seen";
const SEEN_DIM_LABEL = "Dim seen posts";
const SEEN_DIM_OPACITY = "0.4";
const SEEN_DIM_HOVER_OPACITY = "1";

function mountSeenDim(ctx: FeatureContext): void {
  if (ctx.pageKind === "post") {
    const postId = readPostIdFromSearch(ctx.search);
    if (postId === null) {
      log.warn("seen-dim: missing post id in search", ctx.search);
      return;
    }
    setPostSeenMark(postId);
    return;
  }

  if (ctx.pageKind !== "list") {
    return;
  }

  const marks = load().marks;
  const thumbs = document.querySelectorAll(SITE_SELECTORS.thumb);
  for (const thumb of thumbs) {
    if (!(thumb instanceof HTMLElement)) {
      continue;
    }
    const postId = extractPostIdFromThumb(thumb);
    if (postId === null) {
      continue;
    }
    if (marks[postId]?.seen === true) {
      thumb.classList.add(SEEN_CLASS);
    }
  }
}

export const seenDimFeature: Feature = {
  id: SEEN_DIM_FEATURE_ID,
  label: SEEN_DIM_LABEL,
  pages: ["list", "post"],
  defaultEnabled: true,
  cssOnly: true,
  css: `
body.${featureBodyClass(SEEN_DIM_FEATURE_ID)} .${SEEN_CLASS} img.preview {
  opacity: ${SEEN_DIM_OPACITY};
}

body.${featureBodyClass(SEEN_DIM_FEATURE_ID)} .${SEEN_CLASS}:hover img.preview {
  opacity: ${SEEN_DIM_HOVER_OPACITY};
}
`,
  mount: mountSeenDim,
};
