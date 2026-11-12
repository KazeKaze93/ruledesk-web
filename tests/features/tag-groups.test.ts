import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CSS_CLASS } from "../../src/config/constants";
import { tagGroupsFeature } from "../../src/features/tag-groups";
import {
  featureBodyClass,
  type FeatureContext,
  type FeatureStateParse,
} from "../../src/features/types";

const COLLAPSED_CLASS = "rdw-tag-group-collapsed";
const TOGGLE_CLASS = "rdw-tag-group-toggle";

type MutableState = { value: unknown };

function makeContext(initial: unknown = undefined): {
  ctx: FeatureContext;
  state: MutableState;
} {
  const state: MutableState = { value: initial };
  const ctx: FeatureContext = {
    pageKind: "list",
    search: "?page=post&s=list",
    getState: <T>(parse: FeatureStateParse<T>): T => parse(state.value),
    setState: (value: unknown): void => {
      state.value = value;
    },
  };
  return { ctx, state };
}

function makeHeaderLi(name: string): HTMLLIElement {
  const li = document.createElement("li");
  const h6 = document.createElement("h6");
  h6.textContent = name;
  li.append(h6);
  return li;
}

function makeTagLi(
  className: string,
  label: string,
  options?: { follow?: boolean },
): HTMLLIElement {
  const li = document.createElement("li");
  li.className = className;
  const link = document.createElement("a");
  link.href = "#";
  link.textContent = label;
  li.append(link);
  if (options?.follow === true) {
    const follow = document.createElement("button");
    follow.type = "button";
    follow.className = CSS_CLASS.artistFollow;
    follow.textContent = "Follow";
    li.append(follow);
  }
  return li;
}

function buildSidebar(): {
  sidebar: HTMLUListElement;
  copyrightTag: HTMLLIElement;
  characterTag: HTMLLIElement;
  artistTag: HTMLLIElement;
  generalTagA: HTMLLIElement;
  generalTagB: HTMLLIElement;
  metaTag: HTMLLIElement;
} {
  const sidebar = document.createElement("ul");
  sidebar.id = "tag-sidebar";

  const copyrightHeader = makeHeaderLi("Copyright");
  const copyrightTag = makeTagLi("tag-type-copyright", "series_a");
  const characterHeader = makeHeaderLi("Character");
  const characterTag = makeTagLi("tag-type-character", "char_a");
  const artistHeader = makeHeaderLi("Artist");
  const artistTag = makeTagLi("tag-type-artist", "nyx_x", { follow: true });
  const generalHeader = makeHeaderLi("General");
  const generalTagA = makeTagLi("tag-type-general", "1girl");
  const generalTagB = makeTagLi("tag-type-general", "solo");
  const metaHeader = makeHeaderLi("Meta");
  const metaTag = makeTagLi("tag-type-metadata", "highres");

  sidebar.append(
    copyrightHeader,
    copyrightTag,
    characterHeader,
    characterTag,
    artistHeader,
    artistTag,
    generalHeader,
    generalTagA,
    generalTagB,
    metaHeader,
    metaTag,
  );
  document.body.append(sidebar);

  return {
    sidebar,
    copyrightTag,
    characterTag,
    artistTag,
    generalTagA,
    generalTagB,
    metaTag,
  };
}

function toggleFor(name: string): HTMLButtonElement {
  const buttons = document.querySelectorAll(`button.${TOGGLE_CLASS}`);
  for (const node of buttons) {
    if (!(node instanceof HTMLButtonElement)) {
      continue;
    }
    if (node.textContent?.startsWith(`${name} (`) === true) {
      return node;
    }
  }
  throw new Error(`toggle not found: ${name}`);
}

describe("tagGroupsFeature", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports feature contract fields", () => {
    expect(tagGroupsFeature.id).toBe("tag-groups");
    expect(tagGroupsFeature.label).toBe("Collapse General and Meta tags");
    expect(tagGroupsFeature.pages).toEqual(["list", "post"]);
    expect(tagGroupsFeature.defaultEnabled).toBe(true);
  });

  it("scopes collapse css under the feature body class", () => {
    const bodyClass = featureBodyClass("tag-groups");
    expect(tagGroupsFeature.css).toContain(
      `body.${bodyClass} li.${COLLAPSED_CLASS} { display: none; }`,
    );
    expect(tagGroupsFeature.css).toContain(
      `body.${bodyClass} button.${TOGGLE_CLASS}:focus-visible`,
    );
  });

  it("collapses General and Meta by default and leaves others expanded", () => {
    const {
      copyrightTag,
      characterTag,
      artistTag,
      generalTagA,
      generalTagB,
      metaTag,
    } = buildSidebar();
    const { ctx } = makeContext();

    tagGroupsFeature.mount(ctx);

    expect(copyrightTag.classList.contains(COLLAPSED_CLASS)).toBe(false);
    expect(characterTag.classList.contains(COLLAPSED_CLASS)).toBe(false);
    expect(artistTag.classList.contains(COLLAPSED_CLASS)).toBe(false);
    expect(generalTagA.classList.contains(COLLAPSED_CLASS)).toBe(true);
    expect(generalTagB.classList.contains(COLLAPSED_CLASS)).toBe(true);
    expect(metaTag.classList.contains(COLLAPSED_CLASS)).toBe(true);

    expect(toggleFor("Copyright").getAttribute("aria-expanded")).toBe("true");
    expect(toggleFor("General").getAttribute("aria-expanded")).toBe("false");
    expect(toggleFor("Meta").getAttribute("aria-expanded")).toBe("false");
    expect(toggleFor("General").textContent).toBe("General (2)");
    expect(toggleFor("Artist").textContent).toBe("Artist (1)");
  });

  it("toggles a group, updates aria-expanded, and persists via ctx", () => {
    const { generalTagA, generalTagB } = buildSidebar();
    const { ctx, state } = makeContext();

    tagGroupsFeature.mount(ctx);

    const generalToggle = toggleFor("General");
    generalToggle.click();

    expect(generalTagA.classList.contains(COLLAPSED_CLASS)).toBe(false);
    expect(generalTagB.classList.contains(COLLAPSED_CLASS)).toBe(false);
    expect(generalToggle.getAttribute("aria-expanded")).toBe("true");
    expect(state.value).toEqual({ collapsed: ["Meta"] });

    generalToggle.click();
    expect(generalTagA.classList.contains(COLLAPSED_CLASS)).toBe(true);
    expect(generalToggle.getAttribute("aria-expanded")).toBe("false");
    expect(state.value).toEqual({ collapsed: ["Meta", "General"] });
  });

  it("restores collapsed names from ctx state and defaults invalid state", () => {
    const { copyrightTag, generalTagA, metaTag } = buildSidebar();
    const { ctx: validCtx } = makeContext({ collapsed: ["Copyright"] });

    tagGroupsFeature.mount(validCtx);

    expect(copyrightTag.classList.contains(COLLAPSED_CLASS)).toBe(true);
    expect(generalTagA.classList.contains(COLLAPSED_CLASS)).toBe(false);
    expect(metaTag.classList.contains(COLLAPSED_CLASS)).toBe(false);

    document.body.replaceChildren();
    const rebuilt = buildSidebar();
    const { ctx: invalidCtx } = makeContext({ collapsed: "bad" });
    tagGroupsFeature.mount(invalidCtx);

    expect(rebuilt.copyrightTag.classList.contains(COLLAPSED_CLASS)).toBe(false);
    expect(rebuilt.generalTagA.classList.contains(COLLAPSED_CLASS)).toBe(true);
    expect(rebuilt.metaTag.classList.contains(COLLAPSED_CLASS)).toBe(true);
  });

  it("keeps Follow buttons present on artist rows", () => {
    const { artistTag } = buildSidebar();
    const { ctx } = makeContext();

    tagGroupsFeature.mount(ctx);

    const follow = artistTag.querySelector(`button.${CSS_CLASS.artistFollow}`);
    expect(follow).not.toBeNull();
    expect(follow?.textContent).toBe("Follow");
    expect(artistTag.classList.contains(COLLAPSED_CLASS)).toBe(false);
  });

  it("warns and does not throw when the sidebar is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { ctx } = makeContext();

    expect(() => {
      tagGroupsFeature.mount(ctx);
    }).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("does not use inline style for collapse", () => {
    const { generalTagA } = buildSidebar();
    const { ctx } = makeContext();

    tagGroupsFeature.mount(ctx);

    expect(generalTagA.getAttribute("style")).toBeNull();
    expect(generalTagA.style.display).toBe("");
  });
});
