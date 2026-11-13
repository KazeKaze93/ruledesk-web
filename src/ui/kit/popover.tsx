import type { ComponentChildren, JSX, RefObject } from "preact";
import { useEffect, useRef } from "preact/hooks";

import { KIT_FOCUS_CSS } from "./shared";

export type PopoverProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly children?: ComponentChildren;
  readonly className?: string;
  readonly "aria-label"?: string;
  /** Trigger (and optional extra roots) excluded from outside-click close; focus returns here. */
  readonly anchorRef?: RefObject<HTMLElement | null>;
};

const KEY_ESCAPE = "Escape";
const EVENT_KEYDOWN = "keydown";
const EVENT_MOUSEDOWN = "mousedown";

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

function pathIncludesNode(
  path: readonly EventTarget[],
  node: Node | null,
): boolean {
  if (node === null) {
    return false;
  }
  for (const entry of path) {
    if (entry === node) {
      return true;
    }
  }
  return false;
}

export function Popover(props: PopoverProps): JSX.Element | null {
  const rootRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!props.open) {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        const anchor = props.anchorRef?.current ?? null;
        if (anchor !== null && typeof anchor.focus === "function") {
          anchor.focus();
        }
      }
      return;
    }
    wasOpenRef.current = true;

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === KEY_ESCAPE) {
        event.preventDefault();
        props.onClose();
      }
    };
    const onPointerDown = (event: MouseEvent): void => {
      const root = rootRef.current;
      if (root === null) {
        return;
      }
      // Shadow DOM retargets event.target to the host; composedPath keeps the real nodes.
      const path = event.composedPath();
      if (pathIncludesNode(path, root)) {
        return;
      }
      if (pathIncludesNode(path, props.anchorRef?.current ?? null)) {
        return;
      }
      props.onClose();
    };
    document.addEventListener(EVENT_KEYDOWN, onKeyDown);
    document.addEventListener(EVENT_MOUSEDOWN, onPointerDown);
    return () => {
      document.removeEventListener(EVENT_KEYDOWN, onKeyDown);
      document.removeEventListener(EVENT_MOUSEDOWN, onPointerDown);
    };
  }, [props.open, props.onClose, props.anchorRef]);

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
