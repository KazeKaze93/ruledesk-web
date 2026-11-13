import { describe, expect, it } from "vitest";

import {
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
  RDW_THEME_ATTR,
} from "../../src/config/constants";
import { PAGE_CONTENT_CSS } from "../../src/pages/page-css";
import { PANEL_UI_CLASS } from "../../src/pages/constants";
import {
  SITE_DARK_C_BG,
  SITE_DARK_C_BORDER,
  SITE_LIGHT_C_BG,
  SITE_LIGHT_C_BG_ALT,
} from "../../src/ui/tokens";

describe("PAGE_CONTENT_CSS site theme polish", () => {
  it("does not zebra settings rows under any theme", () => {
    expect(PAGE_CONTENT_CSS).not.toMatch(
      new RegExp(
        String.raw`\.${PANEL_UI_CLASS.settingsRow}:nth-child\(even\)\s*\{[^}]*background:\s*var\(--rdw-surface-2\)`,
      ),
    );
    expect(PAGE_CONTENT_CSS).not.toContain(
      `.${PANEL_UI_CLASS.settingsRow}:nth-child(even)`,
    );
  });

  it("sets Site default card to --c-bg with --c-bg-alt border", () => {
    expect(PAGE_CONTENT_CSS).toContain(`background: ${SITE_LIGHT_C_BG}`);
    expect(PAGE_CONTENT_CSS).toContain(`border-color: ${SITE_LIGHT_C_BG_ALT}`);
  });

  it("sets Site dark card to page bg with border one step", () => {
    expect(PAGE_CONTENT_CSS).toContain(`background: ${SITE_DARK_C_BG}`);
    expect(PAGE_CONTENT_CSS).toContain(`border-color: ${SITE_DARK_C_BORDER}`);
  });

  it("forces readable title and section-label color under site themes", () => {
    expect(PAGE_CONTENT_CSS).toContain("rdw-page-title");
    expect(PAGE_CONTENT_CSS).toContain("rdw-section-label");
    const siteSel = `[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE}"]`;
    const darkSel = `[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE_DARK}"]`;
    expect(PAGE_CONTENT_CSS).toContain(`:host-context(${siteSel})`);
    expect(PAGE_CONTENT_CSS).toContain(`:host-context(${darkSel})`);
    expect(PAGE_CONTENT_CSS).toContain(
      `:host-context(${siteSel}) .rdw-section-label`,
    );
    expect(PAGE_CONTENT_CSS).toMatch(
      /rdw-section-label[\s\S]*color:\s*var\(--rdw-text\)/,
    );
  });
});
