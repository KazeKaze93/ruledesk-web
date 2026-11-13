import type { JSX } from "preact";
import { useCallback, useRef, useState } from "preact/hooks";

import { Button, Popover, SectionLabel } from "../../ui/kit";
import type { MoreLink } from "./site-reads";

const TEXT_MORE = "More";
const ARIA_MORE = "More post actions";

const CLASS_WRAP = "rdw-post-panel-more";
const CLASS_TRIGGER = "rdw-post-panel-more-btn";
const CLASS_LIST = "rdw-post-panel-more-list";
const CLASS_ITEM = "rdw-post-panel-more-item";

export type MoreMenuProps = {
  readonly links: readonly MoreLink[];
};

export function MoreMenu(props: MoreMenuProps): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((): void => {
    setOpen(false);
  }, []);

  const bindTrigger = useCallback((node: HTMLDivElement | null): void => {
    const button = node?.querySelector("button");
    triggerRef.current = button instanceof HTMLButtonElement ? button : null;
  }, []);

  if (props.links.length === 0) {
    return null;
  }

  return (
    <div className={CLASS_WRAP} ref={bindTrigger}>
      <SectionLabel>{TEXT_MORE}</SectionLabel>
      <Button
        variant="secondary"
        size="s"
        className={CLASS_TRIGGER}
        aria-label={TEXT_MORE}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        {TEXT_MORE}
      </Button>
      <Popover
        open={open}
        onClose={close}
        anchorRef={triggerRef}
        aria-label={ARIA_MORE}
        className={CLASS_LIST}
      >
        {props.links.map((link) => (
          <Button
            key={link.text}
            variant="ghost"
            size="s"
            className={CLASS_ITEM}
            aria-label={link.text}
            onClick={() => {
              link.anchor.click();
              close();
            }}
          >
            {link.text}
          </Button>
        ))}
      </Popover>
    </div>
  );
}

export { TEXT_MORE, CLASS_TRIGGER as CLASS_MORE_BTN };
