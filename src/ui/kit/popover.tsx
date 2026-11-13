import type { ComponentChildren, JSX } from "preact";
import { useEffect, useRef } from "preact/hooks";

import { KIT_FOCUS_CSS } from "./shared";

export type PopoverProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly children?: ComponentChildren;
  readonly className?: string;
  readonly "aria-label"?: string;
};

export const POPOVER_CSS = `
${KIT_FOCUS_CSS}
.rdw-popover {
  position: absolute;
  z-index: 30;
  min-width: 180px;
  padding: 8px;
  display: grid;
  gap: 4px;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-2);
  color: var(--rdw-text);
  font: 12px/1.35 var(--rdw-font);
}
`;

export function Popover(props: PopoverProps): JSX.Element | null {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!props.open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        props.onClose();
      }
    };
    const onPointerDown = (event: MouseEvent): void => {
      const root = rootRef.current;
      if (root === null) {
        return;
      }
      // Shadow DOM retargets event.target to the host; composedPath keeps the real nodes.
      if (!event.composedPath().includes(root)) {
        props.onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [props.open, props.onClose]);

  if (!props.open) {
    return null;
  }

  const className = ["rdw-popover", props.className]
    .filter((part) => part !== undefined && part.length > 0)
    .join(" ");

  return (
    <>
      <style>{POPOVER_CSS}</style>
      <div
        ref={rootRef}
        className={className}
        role="dialog"
        aria-label={props["aria-label"]}
      >
        {props.children}
      </div>
    </>
  );
}
