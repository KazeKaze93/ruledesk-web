import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CSS_CLASS } from "../src/config/constants";
import {
  clearArtistsMirror,
  readArtistsMirror,
  writeArtistsMirror,
} from "../src/storage/artists-mirror";
import { createDefaultStorage } from "../src/storage/schema";
import { clearStorageCache, load, save } from "../src/storage/store";
import { mountArtistSidebar } from "../src/ui/artists-sidebar";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearStorageCache();
  clearArtistsMirror();
  vi.stubGlobal(
    "GM_getValue",
    (key: string, defaultValue?: unknown): unknown => {
      if (!memory.has(key)) {
        return defaultValue;
      }
      return memory.get(key);
    },
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

function listSidebarMarkup(): string {
  return `
<ul id="tag-sidebar">
  <li class="tag-type-artist">
    <a href="#">?</a>
    <a href="index.php?page=post&s=list&tags=nyx_x" onclick="include()">+</a>
    <a href="index.php?page=post&s=list&tags=-nyx_x" onclick="exclude()">-</a>
    <a href="index.php?page=post&s=list&tags=nyx_x">nyx x</a>
    <span class="tag-count">9</span>
  </li>
</ul>`;
}

function postSidebarMarkup(): string {
  return `
<ul id="tag-sidebar">
  <li class="tag-type-artist tag">
    <a href="index.php?page=wiki&amp;query=nyx_x">?</a>
    <a href="index.php?page=post&s=list&tags=nyx_x">nyx x</a>
    <span class="tag-count">9</span>
  </li>
</ul>`;
}

describe("mountArtistSidebar", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    document.head.querySelectorAll("style").forEach((node) => node.remove());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads the tag from the list href on list markup", () => {
    document.body.innerHTML = listSidebarMarkup();
    mountArtistSidebar(document, "?page=post&s=list&tags=cat");
    mountArtistSidebar(document, "?page=post&s=list&tags=cat");

    const buttons = document.querySelectorAll(`button.${CSS_CLASS.artistFollow}`);
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.textContent).toBe("Follow");
    expect(buttons[0]?.getAttribute("aria-pressed")).toBe("false");
    expect(buttons[0]?.getAttribute("aria-label")).toContain("nyx_x");
    expect(buttons[0]?.hasAttribute("title")).toBe(false);
  });

  it("reads the tag from the list href on post markup and reflects marks", () => {
    const data = createDefaultStorage();
    data.artists = [{ tag: "nyx_x" }];
    save(data);

    document.body.innerHTML = postSidebarMarkup();
    mountArtistSidebar(document, "?page=post&s=view&id=1");

    const button = document.querySelector(`button.${CSS_CLASS.artistFollow}`);
    expect(button?.textContent).toBe("Following");
    expect(button?.getAttribute("aria-pressed")).toBe("true");
    expect(button?.hasAttribute("title")).toBe(false);
    expect(load().artists).toEqual([{ tag: "nyx_x" }]);
  });

  it("merges mirror-only artists into storage on Follow so other-page follows are kept", () => {
    const data = createDefaultStorage();
    data.artists = [{ tag: "already" }];
    save(data);
    writeArtistsMirror(["already", "from_other_page"]);

    document.body.innerHTML = listSidebarMarkup();
    mountArtistSidebar(document, "?page=post&s=list&tags=cat");

    const button = document.querySelector(`button.${CSS_CLASS.artistFollow}`);
    expect(button?.textContent).toBe("Follow");
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(button?.textContent).toBe("Following");
    expect(load().artists.map((entry) => entry.tag).sort()).toEqual([
      "already",
      "from_other_page",
      "nyx_x",
    ]);
    expect([...(readArtistsMirror() ?? [])].sort()).toEqual([
      "already",
      "from_other_page",
      "nyx_x",
    ]);
  });

  it("marks Following when the artist is only present in the mirror", () => {
    writeArtistsMirror(["nyx_x"]);
    document.body.innerHTML = postSidebarMarkup();
    mountArtistSidebar(document, "?page=post&s=view&id=1");

    const button = document.querySelector(`button.${CSS_CLASS.artistFollow}`);
    expect(button?.textContent).toBe("Following");
    expect(button?.getAttribute("aria-pressed")).toBe("true");
  });
});

