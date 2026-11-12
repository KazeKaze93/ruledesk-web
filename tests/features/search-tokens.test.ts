import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { searchTokensFeature } from "../../src/features/search-tokens";
import {
  featureBodyClass,
  type FeatureContext,
} from "../../src/features/types";

const ROOT_ID = "rdw-search-tokens";
const TOKEN_CLASS = "rdw-search-token";
const TOKEN_EXCLUDE_CLASS = "rdw-search-token--exclude";
const HIDDEN_CLASS = "rdw-search-tokens--hidden";

function makeCtx(): FeatureContext {
  return {
    pageKind: "list",
    search: "?page=post&s=list&tags=a+b",
    getState: <T>(parse: (raw: unknown) => T): T => parse(undefined),
    setState: (): void => {},
  };
}

function buildSearchForm(value = ""): {
  form: HTMLFormElement;
  input: HTMLInputElement;
  parent: HTMLElement;
} {
  const parent = document.createElement("div");
  parent.id = "search-host";
  const form = document.createElement("form");
  const input = document.createElement("input");
  input.name = "tags";
  input.value = value;
  const awesomplete = document.createElement("div");
  awesomplete.className = "awesomplete";
  form.append(input, awesomplete);
  parent.append(form);
  document.body.append(parent);
  return { form, input, parent };
}

function tokenButtons(): HTMLButtonElement[] {
  return Array.from(
    document.querySelectorAll(`#${ROOT_ID} button.${TOKEN_CLASS}`),
  ).filter((node): node is HTMLButtonElement => node instanceof HTMLButtonElement);
}

describe("searchTokensFeature", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("exports Feature metadata for list and post", () => {
    expect(searchTokensFeature.id).toBe("search-tokens");
    expect(searchTokensFeature.label).toBe(
      "Show search tags as a list under the search field",
    );
    expect(searchTokensFeature.pages).toEqual(["list", "post"]);
    expect(searchTokensFeature.defaultEnabled).toBe(true);
  });

  it("scopes every css rule under body.rdw-f-search-tokens", () => {
    const bodyClass = featureBodyClass("search-tokens");
    const rules = searchTokensFeature.css
      .split("}")
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) {
      const selector = rule.split("{")[0]?.trim() ?? "";
      expect(selector.startsWith(`body.${bodyClass}`)).toBe(true);
    }
  });

  it("parses whitespace tokens into buttons under the form", () => {
    const { form, input } = buildSearchForm("cat  dog  -bird");
    searchTokensFeature.mount(makeCtx());

    const root = document.getElementById(ROOT_ID);
    expect(root).not.toBeNull();
    expect(root?.previousElementSibling).toBe(form);
    expect(tokenButtons().map((button) => button.textContent)).toEqual([
      "cat",
      "dog",
      "-bird",
    ]);
    expect(tokenButtons()[2]?.classList.contains(TOKEN_EXCLUDE_CLASS)).toBe(
      true,
    );
    expect(tokenButtons()[0]?.classList.contains(TOKEN_EXCLUDE_CLASS)).toBe(
      false,
    );
    expect(tokenButtons()[0]?.getAttribute("aria-label")).toBe(
      "Remove cat from search",
    );
    expect(input.parentElement).toBe(form);
  });

  it("does not move form, input, or awesomplete and keeps the same parent", () => {
    const { form, input, parent } = buildSearchForm("one two");
    const awesomplete = form.querySelector("div.awesomplete");
    expect(awesomplete).not.toBeNull();

    searchTokensFeature.mount(makeCtx());

    expect(form.parentElement).toBe(parent);
    expect(input.parentElement).toBe(form);
    expect(awesomplete?.parentElement).toBe(form);
    expect(input.getAttribute("name")).toBe("tags");
    expect(document.getElementById(ROOT_ID)?.previousElementSibling).toBe(form);
  });

  it("removes a token on click, collapses spaces, and refocuses input", () => {
    const { input } = buildSearchForm("alpha beta gamma");
    searchTokensFeature.mount(makeCtx());

    const focusSpy = vi.spyOn(input, "focus");
    tokenButtons()[1]?.click();

    expect(input.value).toBe("alpha gamma");
    expect(tokenButtons().map((button) => button.textContent)).toEqual([
      "alpha",
      "gamma",
    ]);
    expect(focusSpy).toHaveBeenCalled();
  });

  it("hides the container when there are no tokens", () => {
    buildSearchForm("   ");
    searchTokensFeature.mount(makeCtx());

    const root = document.getElementById(ROOT_ID);
    expect(root?.classList.contains(HIDDEN_CLASS)).toBe(true);
    expect(tokenButtons()).toHaveLength(0);
  });

  it("updates from input events without stealing focus while typing", () => {
    const { input } = buildSearchForm("a");
    searchTokensFeature.mount(makeCtx());
    input.focus();
    expect(document.activeElement).toBe(input);

    input.value = "a b";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(tokenButtons().map((button) => button.textContent)).toEqual([
      "a",
      "b",
    ]);
    expect(document.activeElement).toBe(input);
  });

  it("polls programmatic value changes when the document is visible", () => {
    const { input } = buildSearchForm("start");
    searchTokensFeature.mount(makeCtx());
    expect(tokenButtons().map((button) => button.textContent)).toEqual([
      "start",
    ]);

    input.value = "start next";
    vi.advanceTimersByTime(700);

    expect(tokenButtons().map((button) => button.textContent)).toEqual([
      "start",
      "next",
    ]);
  });

  it("rereads after tag-sidebar click on the next macrotask", () => {
    const { input } = buildSearchForm("old");
    const sidebar = document.createElement("ul");
    sidebar.id = "tag-sidebar";
    document.body.append(sidebar);
    searchTokensFeature.mount(makeCtx());

    input.value = "old new";
    sidebar.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(tokenButtons().map((button) => button.textContent)).toEqual([
      "old",
    ]);

    vi.advanceTimersByTime(0);
    expect(tokenButtons().map((button) => button.textContent)).toEqual([
      "old",
      "new",
    ]);
  });

  it("warns and returns when the search form is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => {
      searchTokensFeature.mount(makeCtx());
    }).not.toThrow();
    expect(document.getElementById(ROOT_ID)).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
  });
});
