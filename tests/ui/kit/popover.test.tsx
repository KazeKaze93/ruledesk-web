import type { JSX } from "preact";
import { render } from "preact";
import { useRef, useState } from "preact/hooks";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ANCHORED_POPOVER_WIDTH_PX,
  Popover,
} from "../../../src/ui/kit/popover";
import { flushEffects } from "../../kit/render";

const HOST_ID = "rdw-popover-test-host";

function PopoverHarness(): JSX.Element {
  const [open, setOpen] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        id="popover-trigger"
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        Open
      </button>
      <Popover
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        anchorRef={triggerRef}
        aria-label="Test popover"
      >
        <span>Inside</span>
      </Popover>
    </div>
  );
}

describe("Popover", () => {
  afterEach(() => {
    const host = document.getElementById(HOST_ID);
    if (host !== null) {
      act(() => {
        render(null, host);
      });
      host.remove();
    }
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const host = document.createElement("div");
    host.id = HOST_ID;
    document.body.append(host);
    act(() => {
      render(<PopoverHarness />, host);
    });

    const trigger = document.getElementById("popover-trigger");
    expect(trigger).toBeInstanceOf(HTMLButtonElement);
    if (!(trigger instanceof HTMLButtonElement)) {
      return;
    }
    trigger.focus();
    expect(
      document.querySelector('[role="dialog"][aria-label="Test popover"]'),
    ).not.toBeNull();

    await flushEffects();

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });

    expect(
      document.querySelector('[role="dialog"][aria-label="Test popover"]'),
    ).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("closes on outside mousedown via composedPath", async () => {
    const host = document.createElement("div");
    host.id = HOST_ID;
    document.body.append(host);
    act(() => {
      render(<PopoverHarness />, host);
    });

    expect(
      document.querySelector('[role="dialog"][aria-label="Test popover"]'),
    ).not.toBeNull();

    await flushEffects();

    act(() => {
      const event = new MouseEvent("mousedown", { bubbles: true });
      Object.defineProperty(event, "composedPath", {
        configurable: true,
        value: (): EventTarget[] => [
          document.body,
          document.documentElement,
          document,
        ],
      });
      document.body.dispatchEvent(event);
    });

    expect(
      document.querySelector('[role="dialog"][aria-label="Test popover"]'),
    ).toBeNull();
  });

  it("ports an anchored list to the body and keeps its right edge in the window", () => {
    const VIEWPORT_WIDTH_PX = 800;
    const ANCHOR_TOP_PX = 10;
    const ANCHOR_HEIGHT_PX = 20;
    const ANCHOR_GAP_PX = 4;
    let anchorLeft = 700;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: VIEWPORT_WIDTH_PX,
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        if (this.id === "popover-anchor") {
          return new DOMRect(anchorLeft, ANCHOR_TOP_PX, 40, ANCHOR_HEIGHT_PX);
        }
        return new DOMRect(0, 0, 0, 0);
      },
    );

    const host = document.createElement("div");
    host.id = HOST_ID;
    document.body.append(host);
    const triggerRef: { current: HTMLButtonElement | null } = { current: null };
    function Anchored(): JSX.Element {
      const [open, setOpen] = useState(true);
      return (
        <div id="clip" style={{ overflow: "auto" }}>
          <button
            ref={(node: HTMLButtonElement | null) => {
              triggerRef.current = node;
            }}
            type="button"
            id="popover-anchor"
            onClick={() => {
              setOpen(false);
            }}
          >
            Open
          </button>
          <Popover
            open={open}
            onClose={() => {
              setOpen(false);
            }}
            anchorRef={triggerRef}
            widthPx={ANCHORED_POPOVER_WIDTH_PX}
            aria-label="Collections"
          >
            <span>List</span>
          </Popover>
        </div>
      );
    }
    act(() => {
      render(<Anchored />, host);
    });

    const dialog = document.querySelector('[role="dialog"][aria-label="Collections"]');
    expect(dialog).toBeInstanceOf(HTMLElement);
    if (!(dialog instanceof HTMLElement)) {
      return;
    }
    expect(dialog.parentElement).toBe(document.body);
    expect(host.querySelector('[role="dialog"]')).toBeNull();
    expect(dialog.style.position).toBe("fixed");
    expect(dialog.style.width).toBe(`${String(ANCHORED_POPOVER_WIDTH_PX)}px`);
    const left = Number(dialog.style.left.replace("px", ""));
    expect(left + ANCHORED_POPOVER_WIDTH_PX).toBeLessThanOrEqual(VIEWPORT_WIDTH_PX);
    expect(dialog.style.top).toBe(
      `${String(ANCHOR_TOP_PX + ANCHOR_HEIGHT_PX + ANCHOR_GAP_PX)}px`,
    );

    anchorLeft = 40;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(dialog.style.left).toBe("40px");
    vi.restoreAllMocks();
  });
});
