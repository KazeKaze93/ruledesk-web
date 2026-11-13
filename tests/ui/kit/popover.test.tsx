import type { JSX } from "preact";
import { render } from "preact";
import { useRef, useState } from "preact/hooks";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";

import { Popover } from "../../../src/ui/kit/popover";
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
});
