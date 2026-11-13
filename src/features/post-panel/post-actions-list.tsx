import type { JSX } from "preact";

import { Button } from "../../ui/kit";
import type { MoreLink, MoreLinkText } from "./site-reads";

const LABEL_REPORT = "Report";

const CLASS_WRAP = "rdw-post-panel-post-actions";
const CLASS_ITEM = "rdw-post-panel-post-action";

export type PostActionsListProps = {
  readonly links: readonly MoreLink[];
};

function buttonLabel(text: MoreLinkText): string {
  if (text === "Report to moderation") {
    return LABEL_REPORT;
  }
  return text;
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
          {buttonLabel(link.text)}
        </Button>
      ))}
    </div>
  );
}

export { CLASS_ITEM as CLASS_POST_ACTION_BTN, LABEL_REPORT };
