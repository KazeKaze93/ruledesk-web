import type { JSX } from "preact";
import { render } from "preact";
import { useState } from "preact/hooks";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";

import { Dialog } from "../../../src/ui/kit/dialog";
import { flushEffects } from "../../kit/render";

const HOST_ID = "rdw-dialog-test-host";
const DIALOG_ARIA = "Bulk confirm dialog";
const DIALOG_MAX_WIDTH_PX = 360;

function DialogHarness(): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        id="dialog-trigger"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open
      </button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        aria-label={DIALOG_ARIA}
      >
        <button type="button" id="dialog-first">
          First
        </button>
        <button type="button" id="dialog-last">
          Last
        </button>
      </Dialog>
    </div>
  );
}

describe("Dialog", () => {
  afterEach(() => {
    const host = document.getElementById(HOST_ID);
    if (host !== null) {
      act(() => {
        render(null, host);
      });
      host.remove();
    }
  });

  it("renders a centered modal with role=dialog, aria-modal, and max-width 360px", async () => {
    const host = document.createElement("div");
    host.id = HOST_ID;
    document.body.append(host);
    act(() => {
      render(<DialogHarness />, host);
    });
    clickOpen();
    await flushEffects();

    const panel = document.querySelector(
      `[role="dialog"][aria-label="${DIALOG_ARIA}"]`,
    );
    expect(panel).not.toBeNull();
    expect(panel?.getAttribute("aria-modal")).toBe("true");
    expect(document.querySelector(".rdw-dialog-backdrop")).not.toBeNull();

    const style = [...host.querySelectorAll("style")].find((node) =>
      (node.textContent ?? "").includes(".rdw-dialog"),
    );
    expect(style?.textContent).toContain(
      `max-width: ${String(DIALOG_MAX_WIDTH_PX)}px`,
    );
    expect(style?.textContent).toContain("position: fixed");
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const host = document.createElement("div");
    host.id = HOST_ID;
    document.body.append(host);
    act(() => {
      render(<DialogHarness />, host);
    });

    const trigger = document.getElementById("dialog-trigger");
    expect(trigger).toBeInstanceOf(HTMLButtonElement);
    if (!(trigger instanceof HTMLButtonElement)) {
      return;
    }
    trigger.focus();
    act(() => {
      trigger.click();
    });
    await flushEffects();

    expect(
      document.querySelector(`[role="dialog"][aria-label="${DIALOG_ARIA}"]`),
    ).not.toBeNull();

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(
      document.querySelector(`[role="dialog"][aria-label="${DIALOG_ARIA}"]`),
    ).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("traps Tab focus inside the dialog panel", async () => {
    const host = document.createElement("div");
    host.id = HOST_ID;
    document.body.append(host);
    act(() => {
      render(<DialogHarness />, host);
    });
    clickOpen();
    await flushEffects();

    const first = document.getElementById("dialog-first");
    const last = document.getElementById("dialog-last");
    expect(first).toBeInstanceOf(HTMLButtonElement);
    expect(last).toBeInstanceOf(HTMLButtonElement);
    if (
      !(first instanceof HTMLButtonElement) ||
      !(last instanceof HTMLButtonElement)
    ) {
      return;
    }

    last.focus();
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    expect(document.activeElement).toBe(first);

    first.focus();
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          bubbles: true,
          cancelable: true,
          shiftKey: true,
        }),
      );
    });
    expect(document.activeElement).toBe(last);
  });
});

function clickOpen(): void {
  const trigger = document.getElementById("dialog-trigger");
  if (!(trigger instanceof HTMLButtonElement)) {
    throw new Error("dialog trigger missing");
  }
  act(() => {
    trigger.click();
  });
}
