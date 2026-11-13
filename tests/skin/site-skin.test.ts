import { describe, expect, it } from "vitest";

import {
  CSS_CLASS,
  RDW_SKIN_CLASS,
  RDW_THEME_ATTR,
} from "../../src/config/constants";
import { RDW_PAGE_ROOT_ID } from "../../src/pages/constants";
import { getSiteSkinCss, SITE_SKIN_CSS } from "../../src/skin/site-skin";
import { LIGHT_PALETTE, TOKEN_VAR } from "../../src/ui/tokens";

const HEX_IN_RULES = /#[0-9a-fA-F]{3,8}\b/;
const COMMENT_BLOCK = /\/\*[\s\S]*?\*\//g;
const SEARCH_TOOLS_ROOT_ID = "rdw-search-tools";
const SEARCH_TOOLS_RESET_CLASS = "rdw-search-tools-reset";
/** Only unscoped selector allowed: script page host on Site default/dark. */
const UNSCOPED_PAGE_ROOT = `#${RDW_PAGE_ROOT_ID}`;
const WHERE_NOT_OUR_CONTROL = `:where(:not([class*="rdw-"]):not(#${SEARCH_TOOLS_ROOT_ID} *))`;

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
  `div#forum`,
  `ul.flat-list`,
  `div.link-list`,
  `span.thumb > a[onclick]`,
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

  it("scopes every rule under html.rdw-skin except #rdw-page-root", () => {
    const scope = `html.${RDW_SKIN_CLASS}`;
    const selectors = ruleSelectors(SITE_SKIN_CSS);
    expect(selectors.length).toBeGreaterThan(20);
    for (const selector of selectors) {
      for (const part of selector.split(",")) {
        const trimmed = part.trim();
        if (trimmed === UNSCOPED_PAGE_ROOT) {
          continue;
        }
        expect(trimmed.startsWith(scope)).toBe(true);
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

  it("uses light page bg from mock-site-skin .new, not the old green", () => {
    expect(LIGHT_PALETTE.bg).toBe("#f3f5f7");
    expect(LIGHT_PALETTE.bg).not.toBe("#aae5a4");
  });

  it("colors the last tag-sidebar link by type; mutes the others", () => {
    expect(SITE_SKIN_CSS).toContain(
      'ul#tag-sidebar > li[class*="tag-type-"] > a:not(:last-of-type)',
    );
    expect(SITE_SKIN_CSS).toContain(
      "ul#tag-sidebar > li.tag-type-artist > a:last-of-type",
    );
    expect(SITE_SKIN_CSS).not.toContain("a:nth-of-type(-n+3)");
  });

  it("hides the standalone Tags heading above the tag list card", () => {
    expect(SITE_SKIN_CSS).toMatch(
      /div\.sidebar\s*>\s*h5\s*\{[^}]*display:\s*none/s,
    );
  });

  it("hides closed awesomplete lists instead of forcing transform:none on all ul", () => {
    expect(SITE_SKIN_CSS).toContain(
      ".awesomplete > ul:not([hidden]):not(:empty)",
    );
    expect(SITE_SKIN_CSS).toMatch(
      /\.awesomplete\s*>\s*ul\[hidden\][\s\S]*?display:\s*none\s*!important/,
    );
    expect(SITE_SKIN_CSS).toMatch(
      /\.awesomplete\s*>\s*ul:empty[\s\S]*?pointer-events:\s*none/,
    );
    const bare = stripComments(SITE_SKIN_CSS);
    expect(bare).not.toMatch(
      /\.awesomplete\s*>\s*ul\s*\{[^}]*transform:\s*none/s,
    );
  });

  it("excludes search-tools root and rdw-* controls from site button/input chrome", () => {
    expect(SITE_SKIN_CSS).toContain(':not([class*="rdw-"])');
    expect(SITE_SKIN_CSS).toContain(`:not(#${SEARCH_TOOLS_ROOT_ID} *)`);
    expect(SITE_SKIN_CSS).toContain(`button${WHERE_NOT_OUR_CONTROL}`);
    const bare = stripComments(SITE_SKIN_CSS);
    expect(bare).not.toMatch(
      /html\.rdw-skin\s+button\s*,\s*html\.rdw-skin\s+input\[type="submit"\]/s,
    );
  });

  it("wraps general button exclusions in :where so accent submit wins", () => {
    expect(SITE_SKIN_CSS).toContain(
      `input[type="submit"]${WHERE_NOT_OUR_CONTROL}`,
    );
    const bare = stripComments(SITE_SKIN_CSS);
    // Pre-:where form inflated specificity via #rdw-search-tools and beat accent.
    expect(bare).not.toMatch(
      /input\[type="submit"\]:not\(\[class\*="rdw-"\]\):not\(#rdw-search-tools \*\)/,
    );
    expect(SITE_SKIN_CSS).toMatch(
      /div\.tag-search input\[type="submit"\][\s\S]*?background:\s*var\(--rdw-accent\)/,
    );
    expect(SITE_SKIN_CSS).toMatch(
      /\.manual-page-chooser\s*>\s*input\[type="submit"\][\s\S]*?background:\s*var\(--rdw-accent\)/,
    );
  });

  it("keeps Reset search as a single-line kit ghost link-button", () => {
    expect(SITE_SKIN_CSS).toContain(
      `#${SEARCH_TOOLS_ROOT_ID} .${SEARCH_TOOLS_RESET_CLASS}`,
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `#${SEARCH_TOOLS_ROOT_ID}\\s*\\.${SEARCH_TOOLS_RESET_CLASS}\\s*\\{[^}]*white-space:\\s*nowrap`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `#${SEARCH_TOOLS_ROOT_ID}\\s*\\.${SEARCH_TOOLS_RESET_CLASS}\\s*\\{[^}]*flex-shrink:\\s*0`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `#${SEARCH_TOOLS_ROOT_ID}\\s*\\.${SEARCH_TOOLS_RESET_CLASS}\\s*\\{[^}]*color:\\s*var\\(--rdw-accent\\)`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `#${SEARCH_TOOLS_ROOT_ID}\\s*\\.${SEARCH_TOOLS_RESET_CLASS}\\s*\\{[^}]*background:\\s*transparent`,
        "s",
      ),
    );
  });

  it("styles artist Follow as secondary button on theme tokens", () => {
    expect(SITE_SKIN_CSS).toContain(`button.${CSS_CLASS.artistFollow}`);
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `button\\.${CSS_CLASS.artistFollow}\\s*\\{[^}]*background:\\s*var\\(--rdw-surface\\)`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `button\\.${CSS_CLASS.artistFollow}\\s*\\{[^}]*border:\\s*1px solid var\\(--rdw-border\\)`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `button\\.${CSS_CLASS.artistFollow}\\s*\\{[^}]*color:\\s*var\\(--rdw-text\\)`,
        "s",
      ),
    );
    expect(SITE_SKIN_CSS).toContain(
      `button.${CSS_CLASS.artistFollow}.${CSS_CLASS.artistFollowMarked}`,
    );
    const bare = stripComments(SITE_SKIN_CSS);
    expect(bare).not.toMatch(
      new RegExp(
        `button\\.${CSS_CLASS.artistFollow}\\s*\\{[^}]*background:\\s*#fff`,
        "s",
      ),
    );
  });

  it("flows tag-sidebar rows as wrapping text with count on the first line", () => {
    expect(SITE_SKIN_CSS).toMatch(
      /ul#tag-sidebar\s*>\s*li\s*\{[^}]*display:\s*block/s,
    );
    expect(SITE_SKIN_CSS).toMatch(
      /ul#tag-sidebar\s*>\s*li\s*>\s*a\s*\{[^}]*display:\s*inline/s,
    );
    expect(SITE_SKIN_CSS).toMatch(
      /\.tag-count[\s\S]*?position:\s*absolute[\s\S]*?right:\s*0/s,
    );
    const bare = stripComments(SITE_SKIN_CSS);
    expect(bare).not.toMatch(
      /ul#tag-sidebar\s*>\s*li\s*\{[^}]*display:\s*flex/s,
    );
    expect(bare).not.toMatch(
      /ul#tag-sidebar\s*>\s*li\s*\{[^}]*flex-wrap:\s*wrap/s,
    );
  });

  it("does not paint favorites thumb background on hover", () => {
    expect(SITE_SKIN_CSS).toMatch(
      /span\.thumb\s*>\s*a\[onclick\]:hover\s*\{[^}]*background:\s*transparent/s,
    );
    expect(SITE_SKIN_CSS).toMatch(
      /span\.thumb:hover[\s\S]*?background-color:\s*transparent/s,
    );
    const bare = stripComments(SITE_SKIN_CSS);
    expect(bare).not.toMatch(
      /span\.thumb\s*>\s*a\[onclick\]:hover\s*\{[^}]*background:\s*var\(--rdw-danger-soft\)/s,
    );
  });

  it("colors #rdw-page-root for readable script page text on site themes", () => {
    expect(SITE_SKIN_CSS).toContain(`#${RDW_PAGE_ROOT_ID}`);
    expect(SITE_SKIN_CSS).toMatch(
      new RegExp(
        `#${RDW_PAGE_ROOT_ID}\\s*\\{[^}]*color:\\s*var\\(${TOKEN_VAR.text.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&",
        )}\\)`,
        "s",
      ),
    );
    const pageRootRule = ruleSelectors(SITE_SKIN_CSS).some((selector) =>
      selector.split(",").some((part) => part.trim() === UNSCOPED_PAGE_ROOT),
    );
    expect(pageRootRule).toBe(true);
  });
});
