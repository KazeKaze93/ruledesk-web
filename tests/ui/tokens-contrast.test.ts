import { describe, expect, it } from "vitest";

import {
  CONTRAST_RATIO_TEXT_MIN,
  CONTRAST_RATIO_UI_MIN,
  SITE_DARK_C_ACCENT,
  SITE_DARK_C_BG,
  SITE_DARK_C_BORDER,
  SITE_DARK_C_MUTED,
  SITE_DARK_C_TEXT,
  SITE_DEFAULT_SWITCH_ON,
  SITE_DEFAULT_SWITCH_THUMB_ON,
  SITE_LIGHT_C_BG,
  SITE_LIGHT_C_BG_ALT,
  SITE_LIGHT_C_LINK,
  SITE_LIGHT_C_TEXT,
  SITE_LIGHT_C_TEXT_SOFT,
  contrastRatio,
  pickContrastingHex,
  resolveSwitchThumbOn,
} from "../../src/ui/tokens";

describe("contrastRatio / site polish tokens", () => {
  it("computes WCAG contrast for known pair", () => {
    const ratio = contrastRatio("#1c2228", "#aae5a4");
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeGreaterThan(4.5);
  });

  it("Site default card bg is --c-bg and border step is --c-bg-alt", () => {
    expect(SITE_LIGHT_C_BG).toBe("#aae5a4");
    expect(SITE_LIGHT_C_BG_ALT).toBe("#89cf81");
    const pageLuma = contrastRatio(SITE_LIGHT_C_TEXT, SITE_LIGHT_C_BG);
    const altLuma = contrastRatio(SITE_LIGHT_C_TEXT, SITE_LIGHT_C_BG_ALT);
    expect(pageLuma).not.toBeNull();
    expect(altLuma).not.toBeNull();
    // alt is one step darker than page (lower contrast of black-on-alt vs black-on-bg)
    expect(altLuma!).toBeLessThan(pageLuma!);
  });

  it("Site default switch ON is site green, not link blue, ≥3:1 vs card", () => {
    expect(SITE_DEFAULT_SWITCH_ON.toLowerCase()).not.toBe(
      SITE_LIGHT_C_LINK.toLowerCase(),
    );
    const onVsCard = contrastRatio(SITE_DEFAULT_SWITCH_ON, SITE_LIGHT_C_BG);
    expect(onVsCard).not.toBeNull();
    expect(onVsCard!).toBeGreaterThanOrEqual(CONTRAST_RATIO_UI_MIN);
    // Old accent (link blue) is explicitly rejected as the Site default ON fill.
    expect(SITE_DEFAULT_SWITCH_ON).not.toBe(SITE_LIGHT_C_LINK);
  });

  it("Site default switch thumb meets UI contrast on ON track", () => {
    const thumb = resolveSwitchThumbOn(
      SITE_DEFAULT_SWITCH_ON,
      SITE_DEFAULT_SWITCH_THUMB_ON,
      [SITE_LIGHT_C_BG_ALT, "#ffffff"],
    );
    const ratio = contrastRatio(thumb, SITE_DEFAULT_SWITCH_ON);
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeGreaterThanOrEqual(CONTRAST_RATIO_UI_MIN);
  });

  it("Site dark switch ON (accent) and OFF (border) pass UI contrast vs page bg", () => {
    const onVsBg = contrastRatio(SITE_DARK_C_ACCENT, SITE_DARK_C_BG);
    expect(onVsBg).not.toBeNull();
    expect(onVsBg!).toBeGreaterThanOrEqual(CONTRAST_RATIO_UI_MIN);
    const thumb = resolveSwitchThumbOn(SITE_DARK_C_ACCENT, SITE_DARK_C_BG, [
      "#ffffff",
    ]);
    const thumbRatio = contrastRatio(thumb, SITE_DARK_C_ACCENT);
    expect(thumbRatio).not.toBeNull();
    expect(thumbRatio!).toBeGreaterThanOrEqual(CONTRAST_RATIO_UI_MIN);
    expect(SITE_DARK_C_BORDER).toBe("#505a50");
  });

  it("page title / section label text colors meet AA on site card surfaces", () => {
    const titleSite = contrastRatio(SITE_LIGHT_C_TEXT, SITE_LIGHT_C_BG);
    expect(titleSite).not.toBeNull();
    expect(titleSite!).toBeGreaterThanOrEqual(CONTRAST_RATIO_TEXT_MIN);

    const titleDark = contrastRatio(SITE_DARK_C_TEXT, SITE_DARK_C_BG);
    expect(titleDark).not.toBeNull();
    expect(titleDark!).toBeGreaterThanOrEqual(CONTRAST_RATIO_TEXT_MIN);

    // Soft/muted fails AA on site card — polish uses text instead.
    const mutedSite = contrastRatio(SITE_LIGHT_C_TEXT_SOFT, SITE_LIGHT_C_BG);
    expect(mutedSite).not.toBeNull();
    expect(mutedSite!).toBeLessThan(CONTRAST_RATIO_TEXT_MIN);
    const mutedDark = contrastRatio(SITE_DARK_C_MUTED, SITE_DARK_C_BG);
    expect(mutedDark).not.toBeNull();
    expect(mutedDark!).toBeLessThan(CONTRAST_RATIO_TEXT_MIN);
  });

  it("pickContrastingHex falls through to a passing candidate", () => {
    const picked = pickContrastingHex(
      SITE_LIGHT_C_BG,
      SITE_LIGHT_C_TEXT_SOFT,
      [SITE_LIGHT_C_TEXT],
      CONTRAST_RATIO_TEXT_MIN,
    );
    expect(picked).toBe(SITE_LIGHT_C_TEXT);
  });
});
