import { PANEL_ROOT_ID } from "../config/constants";
import {
  TOPBAR_ID,
  TOPBAR_SLOT_LEFT_ID,
  TOPBAR_SLOT_PAGER_ID,
  featureBodyClass,
  type Feature,
} from "./types";

const FEATURE_ID = "dark-theme";
const SCOPE = `body.${featureBodyClass(FEATURE_ID)}`;

const LINK_COLOR = "#8ab4f8";
const VISITED_LINK_COLOR = "#b39ddb";
const BODY_BG = "#16181c";
const BODY_COLOR = "#d7d9dc";
const BORDER_COLOR = "#3a3f45";
const INPUT_BG = "#22262b";
const INPUT_COLOR = "#e3e5e8";
const CURRENT_PAGE_BG = "#2a2f36";
const TAG_ARTIST = "#f28b82";
const TAG_CHARACTER = "#81c995";
const TAG_COPYRIGHT = "#c58af9";
const TAG_METADATA = "#fcad70";

const css = `
${SCOPE} {
  background: ${BODY_BG};
  color: ${BODY_COLOR};
}

${SCOPE} *:not(
  img,
  video,
  canvas,
  input,
  textarea,
  select,
  button,
  .switch,
  .switch *,
  [class^="rdw-"],
  [class*=" rdw-"],
  [class^="rdw-"] *,
  [class*=" rdw-"] *,
  #${TOPBAR_ID},
  #${TOPBAR_ID} *,
  #${TOPBAR_SLOT_LEFT_ID},
  #${TOPBAR_SLOT_LEFT_ID} *,
  #${TOPBAR_SLOT_PAGER_ID},
  #${TOPBAR_SLOT_PAGER_ID} *,
  #${PANEL_ROOT_ID},
  #${PANEL_ROOT_ID} *
) {
  background-color: transparent !important;
}

${SCOPE} a {
  color: ${LINK_COLOR};
}

${SCOPE} a:visited {
  color: ${VISITED_LINK_COLOR};
}

${SCOPE} li[class*="tag-type-"] a {
  color: ${LINK_COLOR};
}

${SCOPE} li.tag-type-artist a {
  color: ${TAG_ARTIST};
}

${SCOPE} li.tag-type-character a {
  color: ${TAG_CHARACTER};
}

${SCOPE} li.tag-type-copyright a {
  color: ${TAG_COPYRIGHT};
}

${SCOPE} li.tag-type-metadata a {
  color: ${TAG_METADATA};
}

${SCOPE} input,
${SCOPE} textarea,
${SCOPE} select {
  background-color: ${INPUT_BG};
  color: ${INPUT_COLOR};
  border-color: ${BORDER_COLOR};
}

${SCOPE} li.current-page {
  background-color: ${CURRENT_PAGE_BG};
}

${SCOPE} hr,
${SCOPE} * {
  border-color: ${BORDER_COLOR};
}
`.trim();

export const darkThemeFeature: Feature = {
  id: FEATURE_ID,
  label: "Dark theme",
  pages: ["list", "post", "favorites", "other"],
  defaultEnabled: false,
  css,
  mount: () => {},
};
