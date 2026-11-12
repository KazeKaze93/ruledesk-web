import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PANEL_ROOT_ID, SEARCH_PARAM_PID } from "../../src/config/constants";
import { pagerFeature } from "../../src/features/pager";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
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

function makeCtx(search: string): FeatureContext {
  return {
    pageKind: "list",
    search,
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

function buildPagination(nextPid: number | null): void {
  const pagination = document.createElement("div");
  pagination.className = "pagination";
  const current = document.createElement("b");
  current.textContent = "1";
  pagination.append(current);
  if (nextPid !== null) {
    const page2 = document.createElement("a");
    page2.href = `?page=post&s=list&tags=T&${SEARCH_PARAM_PID}=${nextPid}`;
    page2.textContent = "2";
    pagination.append(page2);
    const next = document.createElement("a");
    next.href = `?page=post&s=list&tags=T&${SEARCH_PARAM_PID}=${nextPid}`;
    next.setAttribute("alt", "next");
    next.textContent = ">";
    pagination.append(next);
  }
  document.body.append(pagination);
}

function buildImageList(): HTMLDivElement {
  const list = document.createElement("div");
  list.className = "image-list";
  document.body.append(list);
  return list;
}

function pagerRoot(): HTMLElement | null {
  return document.getElementById("rdw-pager");
}

describe("pagerFeature", () => {
  let assignMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    document.body.className = "";
    window.history.replaceState(
      {},
      "",
      "/index.php?page=post&s=list&tags=T",
    );
    assignMock = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      get pathname() {
        return "/index.php";
      },
      get search() {
        return window.location.search;
      },
      get href() {
        return `http://localhost${window.location.pathname}${window.location.search}`;
      },
      assign: assignMock,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports Feature metadata for list page", () => {
    expect(pagerFeature.id).toBe("pager");
    expect(pagerFeature.pages).toEqual(["list"]);
    expect(pagerFeature.defaultEnabled).toBe(true);
    expect(pagerFeature.label.length).toBeGreaterThan(0);
  });

  it("scopes every css rule under body.rdw-f-pager", () => {
    const bodyClass = featureBodyClass("pager");
    expect(bodyClass).toBe("rdw-f-pager");
    const rules = pagerFeature.css
      .split("}")
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      const selector = rule.split("{")[0]?.trim() ?? "";
      expect(selector.startsWith(`body.${bodyClass}`)).toBe(true);
    }
  });

  it("parses missing pid as 0 and shows Page 1", () => {
    buildImageList();
    buildPagination(42);
    pagerFeature.mount(makeCtx("?page=post&s=list&tags=T"));
    const root = pagerRoot();
    expect(root).not.toBeNull();
    expect(root?.textContent).toContain("Page 1");
    expect(root?.querySelector("a[aria-label='Previous page']")).toBeNull();
    expect(
      root?.querySelector("span[aria-disabled='true'][aria-label='Previous page']"),
    ).not.toBeNull();
    const next = root?.querySelector("a[aria-label='Next page']");
    expect(next).not.toBeNull();
    expect(next?.getAttribute("href")).toContain(`${SEARCH_PARAM_PID}=42`);
  });

  it("derives step from next link and shows Page N", () => {
    buildImageList();
    buildPagination(84);
    window.history.replaceState(
      {},
      "",
      "/index.php?page=post&s=list&tags=T&pid=42",
    );
    pagerFeature.mount(makeCtx("?page=post&s=list&tags=T&pid=42"));
    const root = pagerRoot();
    expect(root?.textContent).toContain("Page 2");
    const prev = root?.querySelector("a[aria-label='Previous page']");
    const next = root?.querySelector("a[aria-label='Next page']");
    expect(prev?.getAttribute("href")).not.toContain(`${SEARCH_PARAM_PID}=`);
    expect(next?.getAttribute("href")).toContain(`${SEARCH_PARAM_PID}=84`);
  });

  it("always inserts before image-list", () => {
    const list = buildImageList();
    buildPagination(42);
    pagerFeature.mount(makeCtx("?page=post&s=list&tags=T"));
    const root = pagerRoot();
    expect(root).not.toBeNull();
    expect(root?.nextElementSibling).toBe(list);
    expect(list.previousElementSibling).toBe(root);
  });

  it("navigates with ArrowLeft/ArrowRight via location.assign", () => {
    buildImageList();
    buildPagination(84);
    pagerFeature.mount(makeCtx("?page=post&s=list&tags=T&pid=42"));
    assignMock.mockClear();

    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(assignMock).toHaveBeenCalledTimes(1);
    expect(String(assignMock.mock.calls[0]?.[0])).toContain(
      `${SEARCH_PARAM_PID}=84`,
    );

    assignMock.mockClear();
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowLeft",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(assignMock).toHaveBeenCalledTimes(1);
    expect(String(assignMock.mock.calls[0]?.[0])).not.toContain(
      `${SEARCH_PARAM_PID}=`,
    );
  });

  it("ignores arrow keys from input and userscript panel", () => {
    buildImageList();
    buildPagination(42);
    pagerFeature.mount(makeCtx("?page=post&s=list&tags=T"));

    const input = document.createElement("input");
    document.body.append(input);
    const inputEvent = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
    });
    Object.defineProperty(inputEvent, "composedPath", {
      value: () => [input, document.body, document],
    });
    input.dispatchEvent(inputEvent);
    expect(assignMock).not.toHaveBeenCalled();

    const panel = document.createElement("div");
    panel.id = PANEL_ROOT_ID;
    const inner = document.createElement("div");
    panel.append(inner);
    document.body.append(panel);
    const panelEvent = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
    });
    Object.defineProperty(panelEvent, "composedPath", {
      value: () => [inner, panel, document.body, document],
    });
    inner.dispatchEvent(panelEvent);
    expect(assignMock).not.toHaveBeenCalled();
  });

  it("does not throw on empty DOM and warns when host is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => {
      pagerFeature.mount(makeCtx("?page=post&s=list&tags=T"));
    }).not.toThrow();
    expect(pagerRoot()).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("shows inactive Next when pagination is missing and pid is 0", () => {
    buildImageList();
    expect(() => {
      pagerFeature.mount(makeCtx("?page=post&s=list&tags=T"));
    }).not.toThrow();
    const root = pagerRoot();
    expect(root?.textContent).toContain("Page 1");
    expect(
      root?.querySelector("span[aria-disabled='true'][aria-label='Next page']"),
    ).not.toBeNull();
    expect(root?.querySelector("a[aria-label='Next page']")).toBeNull();
  });
});
