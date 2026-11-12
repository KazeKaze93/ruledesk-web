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
import { clearStorageCache } from "../../src/storage/store";

const CLASS_PANEL = "rdw-post-actions";
const CLASS_MODE_FIXED = "rdw-post-actions--fixed";
const CLASS_MODE_NARROW = "rdw-post-actions--narrow";
const CLASS_FAV_BUTTON = "rdw-post-actions-fav";
const CLASS_FAV_LABEL = "rdw-post-actions-fav-label";
const CLASS_FOLLOW = "rdw-post-actions-follow";
const CLASS_ORIGINAL = "rdw-post-actions-original";
const CLASS_SCORE = "rdw-post-actions-score";
const CLASS_VOTE = "rdw-post-actions-vote";
const CLASS_OPTION = "rdw-post-actions-option";

const POST_ID = "42";
const POST_SEARCH = `?page=post&s=view&id=${POST_ID}`;
const NARROW_MEDIA_QUERY = "(max-width: 1099px)";

const memory = new Map<string, unknown>();

type MediaListener = () => void;

type MatchMediaStub = {
  matches: boolean;
  media: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
  onchange: null;
  listeners: Set<MediaListener>;
  setMatches: (next: boolean) => void;
};

function installGmMocks(): void {
  memory.clear();
  clearFavsCache();
  clearStorageCache();
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

function stubMatchMedia(matches: boolean): MatchMediaStub {
  const listeners = new Set<MediaListener>();
  const stub: MatchMediaStub = {
    matches,
    media: NARROW_MEDIA_QUERY,
    listeners,
    addEventListener: vi.fn((_type: string, listener: MediaListener) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: MediaListener) => {
      listeners.delete(listener);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
    setMatches(next: boolean): void {
      stub.matches = next;
      for (const listener of listeners) {
        listener();
      }
    },
  };
  vi.stubGlobal("matchMedia", (query: string): MatchMediaStub => {
    stub.media = query;
    return stub;
  });
  return stub;
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
): ReturnType<typeof vi.fn> {
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
  return fetchMock;
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

function buildLinkList(options: {
  originalHref?: string | null;
  extraLinks?: Array<{ text: string; href: string }>;
}): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "link-list";
  const ul = document.createElement("ul");

  if (options.originalHref !== null && options.originalHref !== undefined) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = options.originalHref;
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

  for (const extra of options.extraLinks ?? []) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = extra.href;
    link.textContent = extra.text;
    li.append(link);
    ul.append(li);
  }

  wrap.append(ul);
  return wrap;
}

function buildPostDom(options?: {
  artists?: string[];
  score?: string;
  originalHref?: string | null;
  extraLinks?: Array<{ text: string; href: string }>;
  includeRightCol?: boolean;
}): { rightCol: HTMLElement | null } {
  const postView = document.createElement("div");
  postView.id = "post-view";

  const sidebar = document.createElement("div");
  sidebar.className = "sidebar";
  sidebar.append(buildArtistSidebar(options?.artists ?? ["nyx_x"]));
  sidebar.append(buildStats(POST_ID, options?.score ?? "14"));
  const linkListOptions: {
    originalHref?: string | null;
    extraLinks?: Array<{ text: string; href: string }>;
  } = {
    originalHref:
      options?.originalHref === undefined
        ? "https://example.com/original.jpg"
        : options.originalHref,
  };
  if (options?.extraLinks !== undefined) {
    linkListOptions.extraLinks = options.extraLinks;
  }
  sidebar.append(buildLinkList(linkListOptions));
  postView.append(sidebar);

  let rightCol: HTMLElement | null = null;
  if (options?.includeRightCol !== false) {
    rightCol = document.createElement("div");
    rightCol.id = "right-col";
    rightCol.className = "content";
    const fit = document.createElement("div");
    fit.id = "fit-to-screen";
    fit.textContent = "image";
    rightCol.append(fit);
    postView.append(rightCol);
  }

  document.body.append(postView);
  return { rightCol };
}

function actionsPanel(): HTMLElement | null {
  return document.getElementById(POST_ACTIONS_ID);
}

describe("postActionsFeature", () => {
  beforeEach(() => {
    installGmMocks();
    document.body.replaceChildren();
    document.body.className = "";
    stubMatchMedia(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exports Feature metadata for post page", () => {
    expect(postActionsFeature.id).toBe("post-actions");
    expect(postActionsFeature.pages).toEqual(["post"]);
    expect(postActionsFeature.defaultEnabled).toBe(true);
    expect(postActionsFeature.label).toBe("Post side panel");
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

  it("mounts fixed panel on document.body for wide viewport", () => {
    buildPostDom();
    postActionsFeature.mount(makeCtx());
    const panel = actionsPanel();
    expect(panel).not.toBeNull();
    expect(panel?.parentElement).toBe(document.body);
    expect(panel?.classList.contains(CLASS_PANEL)).toBe(true);
    expect(panel?.classList.contains(CLASS_MODE_FIXED)).toBe(true);
    expect(panel?.classList.contains(CLASS_MODE_NARROW)).toBe(false);
    expect(panel?.getAttribute("aria-label")).toBe("Post side panel");
  });

  it("places narrow panel as first child of #right-col", () => {
    stubMatchMedia(true);
    const { rightCol } = buildPostDom();
    postActionsFeature.mount(makeCtx());
    const panel = actionsPanel();
    expect(panel).not.toBeNull();
    expect(rightCol?.firstElementChild).toBe(panel);
    expect(panel?.classList.contains(CLASS_MODE_NARROW)).toBe(true);
    expect(panel?.classList.contains(CLASS_MODE_FIXED)).toBe(false);
  });

  it("moves between body and #right-col when viewport mode changes", () => {
    const media = stubMatchMedia(false);
    const { rightCol } = buildPostDom();
    postActionsFeature.mount(makeCtx());
    const panel = actionsPanel();
    expect(panel?.parentElement).toBe(document.body);

    media.setMatches(true);
    expect(rightCol?.firstElementChild).toBe(panel);
    expect(panel?.classList.contains(CLASS_MODE_NARROW)).toBe(true);

    media.setMatches(false);
    expect(panel?.parentElement).toBe(document.body);
    expect(panel?.classList.contains(CLASS_MODE_FIXED)).toBe(true);
  });

  it("shows Favorite label and reflects isFav initial state", () => {
    buildPostDom();
    postActionsFeature.mount(makeCtx());
    const label = document.querySelector(`.${CLASS_FAV_LABEL}`);
    const button = document.querySelector(`.${CLASS_FAV_BUTTON}`);
    expect(label?.textContent).toBe("Favorite");
    expect(button?.getAttribute("aria-pressed")).toBe("false");

    document.body.replaceChildren();
    addFav(POST_ID);
    buildPostDom();
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

  it("does not render Follow buttons", () => {
    buildPostDom({ artists: ["nyx_x", "other_artist"] });
    postActionsFeature.mount(makeCtx());
    expect(document.querySelectorAll(`button.${CLASS_FOLLOW}`)).toHaveLength(0);
    expect(
      document.querySelector(`button.${CSS_CLASS.artistFollow}`),
    ).toBeNull();
  });

  it("renders Original when Original image link exists", () => {
    buildPostDom({
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
    buildPostDom({ originalHref: null });
    postActionsFeature.mount(makeCtx());
    expect(document.querySelector(`a.${CLASS_ORIGINAL}`)).toBeNull();
  });

  it("shows Score from span#psc{ID} with Vote up button", () => {
    buildPostDom({ score: "14" });
    postActionsFeature.mount(makeCtx());
    const score = document.querySelector(`.${CLASS_SCORE}`);
    const vote = document.querySelector(`button.${CLASS_VOTE}`);
    expect(score?.textContent).toBe("Score: 14");
    expect(vote?.textContent).toBe("Vote up");
  });

  it("vote up updates panel score and #psc{ID} and disables while pending", async () => {
    buildPostDom({ score: "14" });
    let resolveVote: ((value: { ok: boolean; status: number; text: () => Promise<string> }) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<{ ok: boolean; status: number; text: () => Promise<string> }>((resolve) => {
          resolveVote = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    postActionsFeature.mount(makeCtx());

    const vote = document.querySelector(`button.${CLASS_VOTE}`);
    expect(vote).toBeInstanceOf(HTMLButtonElement);
    if (!(vote instanceof HTMLButtonElement)) {
      return;
    }

    vote.click();
    expect(vote.disabled).toBe(true);

    expect(resolveVote).toBeTypeOf("function");
    resolveVote?.({
      ok: true,
      status: 200,
      text: async () => "21",
    });

    await vi.waitFor(() => {
      expect(document.querySelector(`.${CLASS_SCORE}`)?.textContent).toBe(
        "Score: 21",
      );
    });
    expect(document.getElementById(`psc${POST_ID}`)?.textContent).toBe("21");
    expect(vote.disabled).toBe(false);
  });

  it("updates Score after successful favorite add with score", async () => {
    buildPostDom({ score: "14" });
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

  it("proxies other Options links via native click and skips excluded", () => {
    buildPostDom({
      extraLinks: [
        { text: "Edit", href: "index.php?page=post&s=edit&id=42" },
        { text: "Tweet this", href: "https://example.com/tweet" },
      ],
    });
    postActionsFeature.mount(makeCtx());

    const proxies = document.querySelectorAll(`button.${CLASS_OPTION}`);
    expect(proxies).toHaveLength(2);
    expect(proxies[0]?.textContent).toBe("Edit");
    expect(proxies[1]?.textContent).toBe("Tweet this");
    expect(
      [...proxies].some((node) => node.textContent === "Original image"),
    ).toBe(false);
    expect(
      [...proxies].some((node) => node.textContent === "Add to favorites"),
    ).toBe(false);

    const editNative = [...document.querySelectorAll("div.link-list a")].find(
      (node) => node.textContent?.trim() === "Edit",
    );
    expect(editNative).toBeInstanceOf(HTMLAnchorElement);
    if (!(editNative instanceof HTMLAnchorElement)) {
      return;
    }
    const clickSpy = vi.spyOn(editNative, "click");
    proxies[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const linkList = document.querySelector("div.link-list");
    expect(linkList).not.toBeNull();
    expect(linkList?.querySelectorAll("a")).toHaveLength(4);
  });

  it("does not throw when #right-col is missing in narrow mode", () => {
    stubMatchMedia(true);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    buildPostDom({ includeRightCol: false });
    expect(() => {
      postActionsFeature.mount(makeCtx());
    }).not.toThrow();
    const panel = actionsPanel();
    expect(panel).not.toBeNull();
    expect(panel?.parentElement).toBe(document.body);
    expect(panel?.classList.contains(CLASS_MODE_NARROW)).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("survives missing sidebar, stats, and links without throwing", () => {
    expect(() => {
      postActionsFeature.mount(makeCtx());
    }).not.toThrow();
    const panel = actionsPanel();
    expect(panel).not.toBeNull();
    expect(panel?.parentElement).toBe(document.body);
    expect(panel?.querySelector(`.${CLASS_FAV_BUTTON}`)).not.toBeNull();
    expect(panel?.querySelector(`button.${CLASS_VOTE}`)).not.toBeNull();
    expect(panel?.querySelector(`a.${CLASS_ORIGINAL}`)).toBeNull();
    expect(panel?.querySelector(`button.${CLASS_OPTION}`)).toBeNull();
    expect(panel?.querySelector(`.${CLASS_SCORE}`)?.textContent).toBe(
      "Score: —",
    );
  });

  it("replaces an existing panel on remount", () => {
    buildPostDom();
    postActionsFeature.mount(makeCtx());
    postActionsFeature.mount(makeCtx());
    expect(document.querySelectorAll(`#${POST_ACTIONS_ID}`)).toHaveLength(1);
  });
});
