import { describe, expect, it } from "vitest";

import {
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
  RDW_THEME_ATTR,
} from "../../src/config/constants";
import {
  SITE_DARK_SWITCH_THUMB_RESOLVED,
  SITE_DEFAULT_SWITCH_THUMB_RESOLVED,
  SWITCH_CSS,
} from "../../src/ui/kit/switch";
import {
  CONTRAST_RATIO_UI_MIN,
  SITE_DARK_C_ACCENT,
  SITE_DARK_C_BORDER,
  SITE_DEFAULT_SWITCH_ON,
  SITE_LIGHT_C_BG,
  SITE_LIGHT_C_LINK,
  contrastRatio,
} from "../../src/ui/tokens";

describe("SWITCH_CSS site theme polish", () => {
  it("default ON uses accent; OFF uses border", () => {
    expect(SWITCH_CSS).toContain(
      '.rdw-switch[aria-checked="true"] .rdw-switch__track',
    );
    expect(SWITCH_CSS).toContain("background: var(--rdw-accent)");
    expect(SWITCH_CSS).toContain("background: var(--rdw-border)");
  });

  it("Site default replaces link-blue ON with site green that passes 3:1", () => {
    expect(SITE_DEFAULT_SWITCH_ON.toLowerCase()).not.toBe(
      SITE_LIGHT_C_LINK.toLowerCase(),
    );
    expect(SWITCH_CSS).toContain(SITE_DEFAULT_SWITCH_ON);
    expect(SWITCH_CSS).not.toMatch(
      new RegExp(
        String.raw`data-rdw-theme="${APPEARANCE_THEME_SITE}"\][\s\S]*?background:\s*${SITE_LIGHT_C_LINK.replace("#", "\\#")}`,
      ),
    );
    const ratio = contrastRatio(SITE_DEFAULT_SWITCH_ON, SITE_LIGHT_C_BG);
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeGreaterThanOrEqual(CONTRAST_RATIO_UI_MIN);
  });

  it("Site default / site-dark ON thumbs are contrast-checked and embedded", () => {
    const siteThumbRatio = contrastRatio(
      SITE_DEFAULT_SWITCH_THUMB_RESOLVED,
      SITE_DEFAULT_SWITCH_ON,
    );
    expect(siteThumbRatio).not.toBeNull();
    expect(siteThumbRatio!).toBeGreaterThanOrEqual(CONTRAST_RATIO_UI_MIN);
    expect(SWITCH_CSS).toContain(SITE_DEFAULT_SWITCH_THUMB_RESOLVED);

    const darkThumbRatio = contrastRatio(
      SITE_DARK_SWITCH_THUMB_RESOLVED,
      SITE_DARK_C_ACCENT,
    );
    expect(darkThumbRatio).not.toBeNull();
    expect(darkThumbRatio!).toBeGreaterThanOrEqual(CONTRAST_RATIO_UI_MIN);
    expect(SWITCH_CSS).toContain(SITE_DARK_SWITCH_THUMB_RESOLVED);
  });

  it("scopes site overrides via data-rdw-theme and :host-context", () => {
    const siteSel = `[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE}"]`;
    const darkSel = `[${RDW_THEME_ATTR}="${APPEARANCE_THEME_SITE_DARK}"]`;
    expect(SWITCH_CSS).toContain(`html${siteSel}`);
    expect(SWITCH_CSS).toContain(`:host-context(${siteSel})`);
    expect(SWITCH_CSS).toContain(`html${darkSel}`);
    expect(SWITCH_CSS).toContain(`:host-context(${darkSel})`);
    expect(SWITCH_CSS).toContain(SITE_DARK_C_ACCENT);
    expect(SWITCH_CSS).toContain(SITE_DARK_C_BORDER);
  });
});
