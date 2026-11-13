import { describe, expect, it } from "vitest";

import { RDW_SKIN_CLASS, RDW_THEME_ATTR } from "../../src/config/constants";
import { getSiteSkinCss, SITE_SKIN_CSS } from "../../src/skin/site-skin";
import { TOKEN_VAR } from "../../src/ui/tokens";

const HEX_IN_RULES = /#[0-9a-fA-F]{3,8}\b/;
const COMMENT_BLOCK = /\/\*[\s\S]*?\*\//g;

const KEY_SELECTORS = [
  `#site-title`,
  `ul#navbar`,
  `ul#subnavbar`,
  `div.sidebar`,
  `div.tag-search`,
  `ul#tag-sidebar`,
  `.tag-count`,
  `.tag-type-artist`,
  `.tag-type-character`,
  `.tag-type-copyright`,
  `.tag-type-metadata`,
  `.awesomplete`,
  `div.image-list`,
  `img.preview`,
  `.webm-thumb`,
  `img.has-children`,
  `img.has-parent`,
  `img.pending`,
  `img.flagged`,
  `div#paginator`,
  `.pagination`,
  `.manual-page-chooser`,
  `div.status-notice`,
  `div.notice`,
  `div.has-mail`,
  `div.blocked`,
  `div.quote`,
  `img#image`,
  `div#note-container`,
] as const;

function stripComments(css: string): string {
  return css.replace(COMMENT_BLOCK, "");
}

function ruleSelectors(css: string): string[] {
  const bare = stripComments(css);
  const selectors: string[] = [];
  for (const chunk of bare.split("}")) {
    const open = chunk.indexOf("{");
    if (open === -1) {
      continue;
    }
    const selector = chunk.slice(0, open).trim();
    if (selector.length > 0) {
      selectors.push(selector);
    }
  }
  return selectors;
}

describe("site-skin CSS export", () => {
  it("exports SITE_SKIN_CSS and getSiteSkinCss identically", () => {
    expect(SITE_SKIN_CSS.length).toBeGreaterThan(0);
    expect(getSiteSkinCss()).toBe(SITE_SKIN_CSS);
  });

  it("scopes every rule under html.rdw-skin", () => {
    const scope = `html.${RDW_SKIN_CLASS}`;
    const selectors = ruleSelectors(SITE_SKIN_CSS);
    expect(selectors.length).toBeGreaterThan(20);
    for (const selector of selectors) {
      for (const part of selector.split(",")) {
        expect(part.trim().startsWith(scope)).toBe(true);
      }
    }
  });

  it("has no hardcoded hex outside comments", () => {
    const bare = stripComments(SITE_SKIN_CSS);
    expect(bare).not.toMatch(HEX_IN_RULES);
  });

  it("does not override thumb cell width/height 200", () => {
    const bare = stripComments(SITE_SKIN_CSS);
    expect(bare).not.toMatch(/\.thumb\b[^}]*\b(?:width|height)\s*:\s*200/i);
    expect(bare).not.toMatch(/\b(?:width|height)\s*:\s*200px\b/i);
  });

  it("includes key site selectors from the mock/spec", () => {
    for (const selector of KEY_SELECTORS) {
      expect(SITE_SKIN_CSS).toContain(selector);
    }
  });

  it("uses design tokens for colors and dark theme attribute", () => {
    expect(SITE_SKIN_CSS).toContain(`var(${TOKEN_VAR.bg})`);
    expect(SITE_SKIN_CSS).toContain(`var(${TOKEN_VAR.text})`);
    expect(SITE_SKIN_CSS).toContain(`var(${TOKEN_VAR.accent})`);
    expect(SITE_SKIN_CSS).toContain(`var(${TOKEN_VAR.font})`);
    expect(SITE_SKIN_CSS).toContain(
      `html.${RDW_SKIN_CLASS}[${RDW_THEME_ATTR}="dark"]`,
    );
  });

  it("sets sidebar to 228px and grid gap to 12px", () => {
    expect(SITE_SKIN_CSS).toContain("width: 228px");
    expect(SITE_SKIN_CSS).toContain("min-width: 228px");
    expect(SITE_SKIN_CSS).toContain("max-width: 228px");
    expect(SITE_SKIN_CSS).toMatch(/div\.image-list\s*\{[^}]*gap:\s*12px/s);
  });

  it("removes native chrome images and thick blue webm border", () => {
    expect(SITE_SKIN_CSS).toContain("background-image: none");
    expect(SITE_SKIN_CSS).toMatch(
      /\.webm-thumb\s*\{[^}]*border:\s*1px solid var\(--rdw-accent\)/s,
    );
    expect(SITE_SKIN_CSS).toContain(".awesomplete > ul:before");
    expect(SITE_SKIN_CSS).toContain("display: none");
  });
});
