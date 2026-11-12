import { describe, expect, it, vi } from "vitest";

import { darkThemeFeature } from "../../src/features/dark-theme";
import { featureBodyClass, type FeatureContext } from "../../src/features/types";
import type { PageKind } from "../../src/site/pages";

const SCOPE = `body.${featureBodyClass("dark-theme")}`;

const ALL_PAGE_KINDS: PageKind[] = ["list", "post", "favorites", "other"];

const REQUIRED_COLORS = [
  "#16181c",
  "#d7d9dc",
  "#8ab4f8",
  "#b39ddb",
  "#f28b82",
  "#81c995",
  "#c58af9",
  "#fcad70",
  "#22262b",
  "#e3e5e8",
  "#3a3f45",
  "#2a2f36",
] as const;

const REQUIRED_SELECTORS = [
  "a",
  "a:visited",
  'li[class*="tag-type-"] a',
  "li.tag-type-artist a",
  "li.tag-type-character a",
  "li.tag-type-copyright a",
  "li.tag-type-metadata a",
  "input",
  "textarea",
  "select",
  "li.current-page",
  "hr",
  "#rdw-topbar",
  "#ruledesk-web-root",
  ".switch",
  'background-color: transparent !important',
] as const;

function splitTopLevelSelectors(selectorText: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of selectorText) {
    if (char === "(") {
      depth += 1;
      current += char;
      continue;
    }
    if (char === ")") {
      depth -= 1;
      current += char;
      continue;
    }
    if (char === "," && depth === 0) {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        parts.push(trimmed);
      }
      current = "";
      continue;
    }
    current += char;
  }
  const trimmed = current.trim();
  if (trimmed.length > 0) {
    parts.push(trimmed);
  }
  return parts;
}

function ruleSelectors(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const chunks = withoutComments.split("}").map((chunk) => chunk.trim()).filter(Boolean);
  const selectors: string[] = [];
  for (const chunk of chunks) {
    const brace = chunk.indexOf("{");
    if (brace === -1) {
      continue;
    }
    const selectorText = chunk.slice(0, brace).trim();
    for (const part of splitTopLevelSelectors(selectorText)) {
      selectors.push(part.replace(/\s+/g, " "));
    }
  }
  return selectors;
}

describe("darkThemeFeature", () => {
  it("exposes expected feature metadata", () => {
    expect(darkThemeFeature.id).toBe("dark-theme");
    expect(darkThemeFeature.label).toBe("Dark theme");
    expect(darkThemeFeature.defaultEnabled).toBe(false);
    expect([...darkThemeFeature.pages].sort()).toEqual([...ALL_PAGE_KINDS].sort());
    for (const kind of ALL_PAGE_KINDS) {
      expect(darkThemeFeature.pages).toContain(kind);
    }
  });

  it("mount is a no-op", () => {
    const ctx: FeatureContext = {
      pageKind: "list",
      search: "",
      getState: () => {
        throw new Error("getState should not be called");
      },
      setState: () => {
        throw new Error("setState should not be called");
      },
    };
    const appendSpy = vi.spyOn(document.body, "append");
    expect(() => darkThemeFeature.mount(ctx)).not.toThrow();
    expect(appendSpy).not.toHaveBeenCalled();
    expect(document.body.className).toBe("");
    appendSpy.mockRestore();
  });

  it("css contains required colors and selectors under body.rdw-f-dark-theme", () => {
    const { css } = darkThemeFeature;
    for (const color of REQUIRED_COLORS) {
      expect(css).toContain(color);
    }
    for (const selector of REQUIRED_SELECTORS) {
      expect(css).toContain(selector);
    }

    const selectors = ruleSelectors(css);
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) {
      expect(selector.startsWith(SCOPE)).toBe(true);
    }
  });
});
