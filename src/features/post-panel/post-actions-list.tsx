import type { JSX } from "preact";

import {
  Button,
  IconFlag,
  IconImage,
  IconNote,
  IconPencil,
} from "../../ui/kit";
import type { MoreLink, MoreLinkText } from "./site-reads";

const DISPLAY_EDIT = "Edit";
const DISPLAY_RESIZE = "Resize image";
const DISPLAY_REPORT = "Report to moderation";
const DISPLAY_ADD_NOTE = "Add note";

const CLASS_WRAP = "rdw-post-panel-post-actions";
const CLASS_ITEM = "rdw-post-panel-post-action";
const ICON_SIZE = 14;

export type PostActionsListProps = {
  readonly links: readonly MoreLink[];
};

function buttonLabel(text: MoreLinkText): string {
  if (text === "Edit") {
    return DISPLAY_EDIT;
  }
  if (text === "Resize image") {
    return DISPLAY_RESIZE;
  }
  if (text === "Report to moderation") {
    return DISPLAY_REPORT;
  }
  return DISPLAY_ADD_NOTE;
}

function actionIcon(text: MoreLinkText): JSX.Element {
  if (text === "Edit") {
    return <IconPencil size={ICON_SIZE} />;
  }
  if (text === "Resize image") {
    return <IconImage size={ICON_SIZE} />;
  }
  if (text === "Report to moderation") {
    return <IconFlag size={ICON_SIZE} />;
  }
  return <IconNote size={ICON_SIZE} />;
}

/** Full-width open buttons that proxy native link-list clicks. No Popover. */
export function PostActionsList(
  props: PostActionsListProps,
): JSX.Element | null {
  if (props.links.length === 0) {
    return null;
  }

  return (
    <div className={CLASS_WRAP}>
      {props.links.map((link) => (
        <Button
          key={link.text}
          variant="secondary"
          size="m"
          className={CLASS_ITEM}
          aria-label={buttonLabel(link.text)}
          onClick={() => {
            link.anchor.click();
          }}
        >
          {actionIcon(link.text)}
          {buttonLabel(link.text)}
        </Button>
      ))}
    </div>
  );
}

export {
  CLASS_ITEM as CLASS_POST_ACTION_BTN,
  DISPLAY_REPORT as LABEL_REPORT,
  DISPLAY_ADD_NOTE,
  DISPLAY_EDIT,
  DISPLAY_RESIZE,
};
