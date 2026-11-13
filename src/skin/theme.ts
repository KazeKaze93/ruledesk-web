import {
  applyAppearanceToDocument,
  themeEnablesSkin,
} from "../boot/appearance-dom";
import {
  APPEARANCE_THEME_CUSTOM,
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
  RDW_SKIN_CLASS,
} from "../config/constants";
import { forceLightSiteBase, setSiteTheme } from "../site/theme";
import type { Appearance, AppearanceCustom } from "../storage/schema";
import { LIGHT_PALETTE, TOKEN_VAR } from "../ui/tokens";
import { getSiteSkinCss } from "./site-skin";

/** WCAG AA normal-text minimum contrast ratio. */
export const CONTRAST_RATIO_MIN = 4.5;

export const BACKGROUND_DIM_MIN = 0;
export const BACKGROUND_DIM_MAX = 0.8;
export const DEFAULT_BACKGROUND_DIM = 0;

const HEX_SHORT_PATTERN = /^#([0-9a-fA-F]{3})$/;
const HEX_LONG_PATTERN = /^#([0-9a-fA-F]{6})$/;
const SRGB_LINEAR_THRESHOLD = 0.03928;
const SRGB_LINEAR_DIVISOR = 12.92;
const SRGB_GAMMA = 2.4;
const SRGB_A = 0.055;
const SRGB_B = 1.055;
const LUMA_R = 0.2126;
const LUMA_G = 0.7152;
const LUMA_B = 0.0722;
const CONTRAST_OFFSET = 0.05;

const BODY_BG_IMAGE = "background-image";
const BODY_BG_SIZE = "background-size";
const BODY_BG_POSITION = "background-position";
const BODY_BG_REPEAT = "background-repeat";
const BODY_BG_ATTACHMENT = "background-attachment";

export type ApplyAppearanceThemeOptions = {
  readonly appearance: Appearance;
  /** Data URL from the dedicated GM background key, if any. */
  readonly backgroundDataUrl?: string;
  /** Site-skin CSS; defaults to getSiteSkinCss() when omitted. */
  readonly siteSkinCss?: string;
};

export type ApplyAppearanceThemeResult = {
  readonly contrastWarning: boolean;
  readonly contrastRatio: number | null;
};

export function createDefaultCustomTheme(): AppearanceCustom {
  return {
    accent: LIGHT_PALETTE.accent,
    bg: LIGHT_PALETTE.bg,
    surface: LIGHT_PALETTE.surface,
    text: LIGHT_PALETTE.text,
    backgroundDim: DEFAULT_BACKGROUND_DIM,
  };
}

export function clampBackgroundDim(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_BACKGROUND_DIM;
  }
  return Math.min(BACKGROUND_DIM_MAX, Math.max(BACKGROUND_DIM_MIN, value));
}

function channelToLinear(channel: number): number {
  const c = channel / 255;
  if (c <= SRGB_LINEAR_THRESHOLD) {
    return c / SRGB_LINEAR_DIVISOR;
  }
  return ((c + SRGB_A) / SRGB_B) ** SRGB_GAMMA;
}

/** Parse #rgb / #rrggbb into 0–255 channels; null if unsupported. */
export function parseHexColor(
  value: string,
): { r: number; g: number; b: number } | null {
  const short = HEX_SHORT_PATTERN.exec(value.trim());
  if (short !== null) {
    const hex = short[1];
    if (hex === undefined) {
      return null;
    }
    return {
      r: Number.parseInt(hex[0]! + hex[0]!, 16),
      g: Number.parseInt(hex[1]! + hex[1]!, 16),
      b: Number.parseInt(hex[2]! + hex[2]!, 16),
    };
  }
  const long = HEX_LONG_PATTERN.exec(value.trim());
  if (long !== null) {
    const hex = long[1];
    if (hex === undefined) {
      return null;
    }
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  }
  return null;
}

export function relativeLuminance(hex: string): number | null {
  const rgb = parseHexColor(hex);
  if (rgb === null) {
    return null;
  }
  const r = channelToLinear(rgb.r);
  const g = channelToLinear(rgb.g);
  const b = channelToLinear(rgb.b);
  return LUMA_R * r + LUMA_G * g + LUMA_B * b;
}

/** WCAG contrast ratio of two hex colors; null if either is unparseable. */
export function contrastRatio(foreground: string, background: string): number | null {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  if (l1 === null || l2 === null) {
    return null;
  }
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + CONTRAST_OFFSET) / (darker + CONTRAST_OFFSET);
}

export function hasInsufficientTextContrast(
  text: string,
  bg: string,
): boolean {
  const ratio = contrastRatio(text, bg);
  if (ratio === null) {
    return false;
  }
  return ratio < CONTRAST_RATIO_MIN;
}

function escapeUrlForCss(url: string): string {
  return url.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function clearBodyBackground(): void {
  const body = document.body;
  if (body === null) {
    return;
  }
  body.style.removeProperty(BODY_BG_IMAGE);
  body.style.removeProperty(BODY_BG_SIZE);
  body.style.removeProperty(BODY_BG_POSITION);
  body.style.removeProperty(BODY_BG_REPEAT);
  body.style.removeProperty(BODY_BG_ATTACHMENT);
}

/**
 * Apply custom background image on <body> with a dim overlay (0–0.8).
 * Cleared when image is empty.
 */
export function applyBodyBackgroundImage(
  imageUrl: string | undefined,
  dim: number,
): void {
  const body = document.body;
  if (body === null) {
    return;
  }
  if (imageUrl === undefined || imageUrl.length === 0) {
    clearBodyBackground();
    return;
  }
  const clamped = clampBackgroundDim(dim);
  const escaped = escapeUrlForCss(imageUrl);
  body.style.setProperty(
    BODY_BG_IMAGE,
    `linear-gradient(rgba(0, 0, 0, ${String(clamped)}), rgba(0, 0, 0, ${String(clamped)})), url("${escaped}")`,
  );
  body.style.setProperty(BODY_BG_SIZE, "cover");
  body.style.setProperty(BODY_BG_POSITION, "center");
  body.style.setProperty(BODY_BG_REPEAT, "no-repeat");
  body.style.setProperty(BODY_BG_ATTACHMENT, "fixed");
}

function syncSiteCookieAndStylesheet(appearance: Appearance): void {
  if (appearance.theme === APPEARANCE_THEME_SITE_DARK) {
    setSiteTheme("dark");
    return;
  }
  if (appearance.theme === APPEARANCE_THEME_SITE) {
    // Native site chrome: no theme cookie (light default).
    setSiteTheme("light");
    return;
  }
  // light / dark / custom — predictable light site base under rdw-skin
  forceLightSiteBase();
}

/**
 * Full theme apply for boot and settings UI:
 * site cookie/stylesheet + html.rdw-skin / tokens / site-skin / custom props + body image.
 */
export function applyAppearanceTheme(
  options: ApplyAppearanceThemeOptions,
): ApplyAppearanceThemeResult {
  const { appearance } = options;
  syncSiteCookieAndStylesheet(appearance);

  applyAppearanceToDocument({
    appearance,
    siteSkinCss: options.siteSkinCss ?? getSiteSkinCss(),
    ...(options.backgroundDataUrl !== undefined
      ? { backgroundDataUrl: options.backgroundDataUrl }
      : {}),
  });

  // Defensive: site modes must not keep rdw-skin even if attrs race.
  if (!themeEnablesSkin(appearance.theme)) {
    document.documentElement.classList.remove(RDW_SKIN_CLASS);
  }

  let contrastWarning = false;
  let ratio: number | null = null;

  if (
    appearance.theme === APPEARANCE_THEME_CUSTOM &&
    appearance.custom !== undefined
  ) {
    const custom = appearance.custom;
    const imageUrl =
      options.backgroundDataUrl ?? custom.backgroundImage;
    applyBodyBackgroundImage(
      imageUrl,
      custom.backgroundDim ?? DEFAULT_BACKGROUND_DIM,
    );
    ratio = contrastRatio(custom.text, custom.bg);
    contrastWarning = ratio !== null && ratio < CONTRAST_RATIO_MIN;

    // Ensure dim CSS var is clamped when present.
    if (custom.backgroundDim !== undefined) {
      document.documentElement.style.setProperty(
        TOKEN_VAR.backgroundDim,
        String(clampBackgroundDim(custom.backgroundDim)),
      );
    }
  } else {
    clearBodyBackground();
  }

  return {
    contrastWarning,
    contrastRatio: ratio,
  };
}
