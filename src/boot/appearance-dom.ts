import {
  APPEARANCE_THEME_CUSTOM,
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_LIGHT,
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
  RDW_SKIN_CLASS,
  RDW_THEME_ATTR,
  SITE_SKIN_STYLE_ID,
  TOKEN_STYLE_ID,
} from "../config/constants";
import type { Appearance, AppearanceTheme } from "../storage/schema";
import {
  applyCustomThemeProperties,
  buildTokensCss,
  clearCustomThemeProperties,
  DARK_PALETTE,
  LIGHT_PALETTE,
  paletteForMode,
  type PaletteMode,
  type TokenPalette,
} from "../ui/tokens";

/**
 * Whether RuleDesk site-skin class is active.
 * site / site-dark keep native page chrome; light / dark / custom enable rdw-skin.
 */
export function themeEnablesSkin(theme: AppearanceTheme): boolean {
  return (
    theme === APPEARANCE_THEME_LIGHT ||
    theme === APPEARANCE_THEME_DARK ||
    theme === APPEARANCE_THEME_CUSTOM
  );
}

export function paletteModeForTheme(theme: AppearanceTheme): PaletteMode {
  if (
    theme === APPEARANCE_THEME_DARK ||
    theme === APPEARANCE_THEME_SITE_DARK
  ) {
    return "dark";
  }
  if (theme === APPEARANCE_THEME_CUSTOM) {
    return "light";
  }
  return "light";
}

export function resolveTokenPalette(appearance: Appearance): TokenPalette {
  const mode = paletteModeForTheme(appearance.theme);
  const base = paletteForMode(mode);
  if (appearance.theme !== APPEARANCE_THEME_CUSTOM || appearance.custom === undefined) {
    return base;
  }
  return {
    ...base,
    accent: appearance.custom.accent,
    bg: appearance.custom.bg,
    surface: appearance.custom.surface,
    text: appearance.custom.text,
  };
}

/**
 * Ensures a <style id=...> exists under documentElement (works before <head>).
 * Safe at document-start. B1/B2 should reuse these helpers.
 */
export function ensureStyleElement(id: string): HTMLStyleElement {
  const existing = document.getElementById(id);
  if (existing instanceof HTMLStyleElement) {
    return existing;
  }
  if (existing !== null) {
    existing.remove();
  }
  const style = document.createElement("style");
  style.id = id;
  const parent = document.head ?? document.documentElement;
  parent.append(style);
  return style;
}

/** Inject or replace the design-token stylesheet. */
export function injectTokenStyles(palette: TokenPalette): HTMLStyleElement {
  const style = ensureStyleElement(TOKEN_STYLE_ID);
  style.textContent = buildTokensCss(palette, ":root");
  return style;
}

/**
 * Inject or replace the site-skin stylesheet (rules scoped under html.rdw-skin).
 */
export function injectSiteSkinHook(cssText = ""): HTMLStyleElement {
  const style = ensureStyleElement(SITE_SKIN_STYLE_ID);
  style.textContent = cssText;
  return style;
}

export function applyHtmlThemeAttributes(theme: AppearanceTheme): void {
  const root = document.documentElement;
  root.setAttribute(RDW_THEME_ATTR, theme);
  if (themeEnablesSkin(theme)) {
    root.classList.add(RDW_SKIN_CLASS);
  } else {
    root.classList.remove(RDW_SKIN_CLASS);
  }
}

export type ApplyAppearanceOptions = {
  readonly appearance: Appearance;
  /** Data URL from the dedicated GM background key, if any. */
  readonly backgroundDataUrl?: string;
  /** Site-skin CSS text for #SITE_SKIN_STYLE_ID. */
  readonly siteSkinCss?: string;
};

/**
 * Document-start-safe appearance apply:
 * html class/attr + token CSS (+ empty site-skin hook) + custom setProperty.
 */
export function applyAppearanceToDocument(
  options: ApplyAppearanceOptions,
): void {
  const { appearance } = options;
  applyHtmlThemeAttributes(appearance.theme);
  const palette = resolveTokenPalette(appearance);
  injectTokenStyles(palette);
  injectSiteSkinHook(options.siteSkinCss ?? "");

  const root = document.documentElement;
  clearCustomThemeProperties(root);

  if (appearance.theme === APPEARANCE_THEME_CUSTOM && appearance.custom !== undefined) {
    const backgroundImage =
      options.backgroundDataUrl ??
      appearance.custom.backgroundImage;
    const overrides =
      backgroundImage !== undefined && backgroundImage.length > 0
        ? {
            accent: appearance.custom.accent,
            bg: appearance.custom.bg,
            surface: appearance.custom.surface,
            text: appearance.custom.text,
            backgroundImage,
            ...(appearance.custom.backgroundDim !== undefined
              ? { backgroundDim: appearance.custom.backgroundDim }
              : {}),
          }
        : {
            accent: appearance.custom.accent,
            bg: appearance.custom.bg,
            surface: appearance.custom.surface,
            text: appearance.custom.text,
            ...(appearance.custom.backgroundDim !== undefined
              ? { backgroundDim: appearance.custom.backgroundDim }
              : {}),
          };
    applyCustomThemeProperties(root, overrides);
  } else if (
    options.backgroundDataUrl !== undefined &&
    options.backgroundDataUrl.length > 0
  ) {
    applyCustomThemeProperties(root, {
      backgroundImage: options.backgroundDataUrl,
    });
  }
}

export function defaultPaletteForTheme(theme: AppearanceTheme): TokenPalette {
  if (theme === APPEARANCE_THEME_DARK || theme === APPEARANCE_THEME_SITE_DARK) {
    return DARK_PALETTE;
  }
  return LIGHT_PALETTE;
}

export {
  APPEARANCE_THEME_CUSTOM,
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_LIGHT,
  APPEARANCE_THEME_SITE,
  APPEARANCE_THEME_SITE_DARK,
};
