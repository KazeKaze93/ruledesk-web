import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADDFAV_RESPONSE_ADDED,
  CSS_CLASS,
} from "../../src/config/constants";
import { postActionsFeature } from "../../src/features/post-actions";
import {
  POST_ACTIONS_ID,
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import { addFav, clearFavsCache, isFav } from "../../src/storage/favs";
import {
  addArtist,
  isFollowingArtist,
  load,
} from "../../src/storage/store";

const CLASS_FAV_BUTTON = "rdw-post-actions-fav";
const CLASS_FAV_LABEL = "rdw-post-actions-fav-label";
const CLASS_FOLLOW = "rdw-post-actions-follow";
const CLASS_ORIGINAL = "rdw-post-actions-original";
const CLASS_SCORE = "rdw-post-actions-score";

const POST_ID = "42";
const POST_SEARCH = `?page=post&s=view&id=${POST_ID}`;

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearFavsCache();
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

function makeCtx(search: string = POST_SEARCH): FeatureContext {
  return {
    pageKind: "post",
    search,
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

function mockFetchSequence(
  responses: Array<{ ok?: boolean; body: string } | Error>,
): void {
  const fetchMock = vi.fn();
  for (const item of responses) {
    if (item instanceof Error) {
      fetchMock.mockRejectedValueOnce(item);
    } else {
      fetchMock.mockResolvedValueOnce({
        ok: item.ok ?? true,
        status: item.ok === false ? 500 : 200,
        text: async () => item.body,
      });
    }
  }
  vi.stubGlobal("fetch", fetchMock);
}

function buildArtistSidebar(tags: string[]): HTMLUListElement {
  const sidebar = document.createElement("ul");
  sidebar.id = "tag-sidebar";
  for (const tag of tags) {
    const li = document.createElement("li");
    li.className = "tag-type-artist tag";
    const wiki = document.createElement("a");
    wiki.href = `index.php?page=wiki&query=${tag}`;
    wiki.textContent = "?";
    const list = document.createElement("a");
    list.href = `index.php?page=post&s=list&tags=${tag}`;
    list.textContent = tag.replaceAll("_", " ");
    li.append(wiki, list);
    sidebar.append(li);
  }
  return sidebar;
}

function buildStats(postId: string, score: string): HTMLDivElement {
  const stats = document.createElement("div");
  stats.id = "stats";
  const li = document.createElement("li");
  li.append("Score: ");
  const span = document.createElement("span");
  span.id = `psc${postId}`;
  span.textContent = score;
  li.append(span);
  stats.append(li);
  return stats;
}

function buildLinkList(originalHref: string | null): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "link-list";
  const ul = document.createElement("ul");
  if (originalHref !== null) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = originalHref;
    link.textContent = "Original image";
    link.setAttribute("onclick", "Post.highres();");
    li.append(link);
    ul.append(li);
  }
  const favLi = document.createElement("li");
  const fav = document.createElement("a");
  fav.href = "#";
  fav.textContent = "Add to favorites";
  favLi.append(fav);
  ul.append(favLi);
  wrap.append(ul);
  return wrap;
}

function buildPostDom(options: {
  host: "right-col" | "post-view";
  artists?: string[];
  score?: string;
  originalHref?: string | null;
}): HTMLElement {
  const postView = document.createElement("div");
  postView.id = "post-view";

  const sidebar = document.createElement("div");
  sidebar.className = "sidebar";
  sidebar.append(buildArtistSidebar(options.artists ?? ["nyx_x"]));
  sidebar.append(buildStats(POST_ID, options.score ?? "14"));
  sidebar.append(
    buildLinkList(
      options.originalHref === undefined
        ? "https://example.com/original.jpg"
        : options.originalHref,
    ),
  );
  postView.append(sidebar);

  if (options.host === "right-col") {
    const rightCol = document.createElement("div");
    rightCol.id = "right-col";
    rightCol.className = "content";
    const fit = document.createElement("div");
    fit.id = "fit-to-screen";
    fit.textContent = "image";
    rightCol.append(fit);
    postView.append(rightCol);
    document.body.append(postView);
    return rightCol;
  }

  document.body.append(postView);
  return postView;
}

function actionsBar(): HTMLElement | null {
  return document.getElementById(POST_ACTIONS_ID);
}

describe("postActionsFeature", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    document.body.className = "";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports Feature metadata for post page", () => {
    expect(postActionsFeature.id).toBe("post-actions");
    expect(postActionsFeature.pages).toEqual(["post"]);
    expect(postActionsFeature.defaultEnabled).toBe(true);
    expect(postActionsFeature.label.length).toBeGreaterThan(0);
  });

  it("scopes every css rule under body.rdw-f-post-actions", () => {
    const bodyClass = featureBodyClass("post-actions");
    expect(bodyClass).toBe("rdw-f-post-actions");
    const rules = postActionsFeature.css
      .split("}")
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      const selector = rule.split("{")[0]?.trim() ?? "";
      expect(selector.startsWith(`body.${bodyClass}`)).toBe(true);
    }
  });

  it("inserts the bar as the first child of #right-col", () => {
    const rightCol = buildPostDom({ host: "right-col" });
    postActionsFeature.mount(makeCtx());
    const bar = actionsBar();
    expect(bar).not.toBeNull();
    expect(rightCol.firstElementChild).toBe(bar);
    expect(bar?.id).toBe(POST_ACTIONS_ID);
  });

  it("falls back to #post-view when #right-col is missing", () => {
    const postView = buildPostDom({ host: "post-view" });
    postActionsFeature.mount(makeCtx());
    const bar = actionsBar();
    expect(bar).not.toBeNull();
    expect(postView.firstElementChild).toBe(bar);
  });

  it("shows Favorite label and reflects isFav initial state", () => {
    buildPostDom({ host: "right-col" });
    postActionsFeature.mount(makeCtx());
    const label = document.querySelector(`.${CLASS_FAV_LABEL}`);
    const button = document.querySelector(`.${CLASS_FAV_BUTTON}`);
    expect(label?.textContent).toBe("Favorite");
    expect(button?.getAttribute("aria-pressed")).toBe("false");

    document.body.replaceChildren();
    addFav(POST_ID);
    buildPostDom({ host: "right-col" });
    postActionsFeature.mount(makeCtx());
    expect(document.querySelector(`.${CLASS_FAV_LABEL}`)?.textContent).toBe(
      "In favorites",
    );
    expect(
      document
        .querySelector(`.${CLASS_FAV_BUTTON}`)
        ?.getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("builds Follow buttons for each artist and toggles store state", () => {
    buildPostDom({ host: "right-col", artists: ["nyx_x", "other_artist"] });
    postActionsFeature.mount(makeCtx());

    const buttons = document.querySelectorAll(`button.${CLASS_FOLLOW}`);
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.textContent).toBe("Follow nyx_x");
    expect(buttons[1]?.textContent).toBe("Follow other_artist");
    expect(buttons[0]?.getAttribute("aria-label")).toBe("Follow nyx_x");

    addArtist("nyx_x");
    document.body.replaceChildren();
    buildPostDom({ host: "right-col", artists: ["nyx_x"] });
    postActionsFeature.mount(makeCtx());
    const following = document.querySelector(`button.${CLASS_FOLLOW}`);
    expect(following?.textContent).toBe("Following nyx_x");
    expect(following?.getAttribute("aria-pressed")).toBe("true");

    following?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(isFollowingArtist("nyx_x")).toBe(false);
    expect(following?.textContent).toBe("Follow nyx_x");

    following?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(isFollowingArtist("nyx_x")).toBe(true);
    expect(following?.textContent).toBe("Following nyx_x");
    expect(load().artists.some((entry) => entry.tag === "nyx_x")).toBe(true);
  });

  it("does not attach sidebar artist-follow class buttons", () => {
    buildPostDom({ host: "right-col" });
    postActionsFeature.mount(makeCtx());
    expect(
      document.querySelector(`button.${CSS_CLASS.artistFollow}`),
    ).toBeNull();
    expect(document.querySelectorAll(`button.${CLASS_FOLLOW}`)).toHaveLength(1);
  });

  it("renders Original when Original image link exists", () => {
    buildPostDom({
      host: "right-col",
      originalHref: "https://example.com/full.png",
    });
    postActionsFeature.mount(makeCtx());
    const link = document.querySelector(`a.${CLASS_ORIGINAL}`);
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("Original");
    expect(link?.getAttribute("href")).toBe("https://example.com/full.png");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener");
    expect(link?.getAttribute("aria-label")).toBe("Open original image");
  });

  it("omits Original when Original image link is absent", () => {
    buildPostDom({ host: "right-col", originalHref: null });
    postActionsFeature.mount(makeCtx());
    expect(document.querySelector(`a.${CLASS_ORIGINAL}`)).toBeNull();
  });

  it("shows Score from span#psc{ID}", () => {
    buildPostDom({ host: "right-col", score: "14" });
    postActionsFeature.mount(makeCtx());
    const score = document.querySelector(`.${CLASS_SCORE}`);
    expect(score?.textContent).toBe("Score: 14");
  });

  it("updates Score label and #psc{ID} after successful favorite add with score", async () => {
    buildPostDom({ host: "right-col", score: "14" });
    mockFetchSequence([{ body: ADDFAV_RESPONSE_ADDED }, { body: "21" }]);
    postActionsFeature.mount(makeCtx());

    const button = document.querySelector(`.${CLASS_FAV_BUTTON}`);
    expect(button).toBeInstanceOf(HTMLButtonElement);
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    button.click();
    await vi.waitFor(() => {
      expect(isFav(POST_ID)).toBe(true);
    });

    expect(document.querySelector(`.${CLASS_FAV_LABEL}`)?.textContent).toBe(
      "In favorites",
    );
    expect(document.querySelector(`.${CLASS_SCORE}`)?.textContent).toBe(
      "Score: 21",
    );
    expect(document.getElementById(`psc${POST_ID}`)?.textContent).toBe("21");
  });

  it("does not throw when hosts are missing and warns", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => {
      postActionsFeature.mount(makeCtx());
    }).not.toThrow();
    expect(actionsBar()).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("survives missing sidebar, stats, and links without throwing", () => {
    const rightCol = document.createElement("div");
    rightCol.id = "right-col";
    document.body.append(rightCol);
    expect(() => {
      postActionsFeature.mount(makeCtx());
    }).not.toThrow();
    const bar = actionsBar();
    expect(bar).not.toBeNull();
    expect(bar?.querySelector(`.${CLASS_FAV_BUTTON}`)).not.toBeNull();
    expect(bar?.querySelector(`button.${CLASS_FOLLOW}`)).toBeNull();
    expect(bar?.querySelector(`a.${CLASS_ORIGINAL}`)).toBeNull();
    expect(bar?.querySelector(`.${CLASS_SCORE}`)).toBeNull();
  });

  it("replaces an existing bar on remount", () => {
    buildPostDom({ host: "right-col" });
    postActionsFeature.mount(makeCtx());
    postActionsFeature.mount(makeCtx());
    expect(document.querySelectorAll(`#${POST_ACTIONS_ID}`)).toHaveLength(1);
  });
});
