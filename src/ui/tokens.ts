/**
 * Design tokens for RuleDesk Web UI and (later) site skin.
 * Light values match docs/design/mock-components.html.
 */

export const TOKEN_VAR = {
  bg: "--rdw-bg",
  surface: "--rdw-surface",
  surface2: "--rdw-surface-2",
  border: "--rdw-border",
  text: "--rdw-text",
  muted: "--rdw-muted",
  accent: "--rdw-accent",
  accentSoft: "--rdw-accent-soft",
  danger: "--rdw-danger",
  dangerSoft: "--rdw-danger-soft",
  tagArtist: "--rdw-tag-artist",
  tagCharacter: "--rdw-tag-character",
  tagCopyright: "--rdw-tag-copyright",
  tagMetadata: "--rdw-tag-metadata",
  radiusS: "--rdw-radius-s",
  radiusM: "--rdw-radius-m",
  radiusL: "--rdw-radius-l",
  shadow1: "--rdw-shadow-1",
  shadow2: "--rdw-shadow-2",
  font: "--rdw-font",
  backgroundImage: "--rdw-background-image",
  backgroundDim: "--rdw-background-dim",
} as const;

export type TokenVarName = (typeof TOKEN_VAR)[keyof typeof TOKEN_VAR];

export type TokenPalette = {
  readonly bg: string;
  readonly surface: string;
  readonly surface2: string;
  readonly border: string;
  readonly text: string;
  readonly muted: string;
  readonly accent: string;
  readonly accentSoft: string;
  readonly danger: string;
  readonly dangerSoft: string;
  readonly tagArtist: string;
  readonly tagCharacter: string;
  readonly tagCopyright: string;
  readonly tagMetadata: string;
  readonly radiusS: string;
  readonly radiusM: string;
  readonly radiusL: string;
  readonly shadow1: string;
  readonly shadow2: string;
  readonly font: string;
};

/** Light palette — values from mock-components.html (+ metadata orange from site). */
export const LIGHT_PALETTE: TokenPalette = {
  bg: "#aae5a4",
  surface: "#ffffff",
  surface2: "#f4f6f8",
  border: "#cfd6dd",
  text: "#1c2228",
  muted: "#66727e",
  accent: "#2f6fed",
  accentSoft: "#e8f0fe",
  danger: "#c0392b",
  dangerSoft: "#fdecea",
  tagArtist: "#b00020",
  tagCharacter: "#0a7a2f",
  tagCopyright: "#8e24aa",
  tagMetadata: "#ff8800",
  radiusS: "6px",
  radiusM: "8px",
  radiusL: "10px",
  shadow1: "0 1px 2px rgba(0, 0, 0, 0.06)",
  shadow2: "0 8px 24px rgba(0, 0, 0, 0.25)",
  font: 'system-ui, "Segoe UI", sans-serif',
};

/** Dark palette for theme=dark / site-dark / custom base. */
export const DARK_PALETTE: TokenPalette = {
  bg: "#16181c",
  surface: "#1e2228",
  surface2: "#262b33",
  border: "#3a424c",
  text: "#e8edf2",
  muted: "#8a96a3",
  accent: "#4c8bf5",
  accentSoft: "#1a2f5a",
  danger: "#e57373",
  dangerSoft: "#3d1f1f",
  tagArtist: "#ff6b81",
  tagCharacter: "#5dcea0",
  tagCopyright: "#ce93d8",
  tagMetadata: "#ffb74d",
  radiusS: "6px",
  radiusM: "8px",
  radiusL: "10px",
  shadow1: "0 1px 2px rgba(0, 0, 0, 0.35)",
  shadow2: "0 8px 24px rgba(0, 0, 0, 0.55)",
  font: 'system-ui, "Segoe UI", sans-serif',
};

export type PaletteMode = "light" | "dark";

export function paletteForMode(mode: PaletteMode): TokenPalette {
  return mode === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
}

function escapeCssValue(value: string): string {
  return value.replace(/</g, "\\3c ");
}

export function tokensToCssDeclarations(palette: TokenPalette): string {
  return [
    `${TOKEN_VAR.bg}: ${escapeCssValue(palette.bg)};`,
    `${TOKEN_VAR.surface}: ${escapeCssValue(palette.surface)};`,
    `${TOKEN_VAR.surface2}: ${escapeCssValue(palette.surface2)};`,
    `${TOKEN_VAR.border}: ${escapeCssValue(palette.border)};`,
    `${TOKEN_VAR.text}: ${escapeCssValue(palette.text)};`,
    `${TOKEN_VAR.muted}: ${escapeCssValue(palette.muted)};`,
    `${TOKEN_VAR.accent}: ${escapeCssValue(palette.accent)};`,
    `${TOKEN_VAR.accentSoft}: ${escapeCssValue(palette.accentSoft)};`,
    `${TOKEN_VAR.danger}: ${escapeCssValue(palette.danger)};`,
    `${TOKEN_VAR.dangerSoft}: ${escapeCssValue(palette.dangerSoft)};`,
    `${TOKEN_VAR.tagArtist}: ${escapeCssValue(palette.tagArtist)};`,
    `${TOKEN_VAR.tagCharacter}: ${escapeCssValue(palette.tagCharacter)};`,
    `${TOKEN_VAR.tagCopyright}: ${escapeCssValue(palette.tagCopyright)};`,
    `${TOKEN_VAR.tagMetadata}: ${escapeCssValue(palette.tagMetadata)};`,
    `${TOKEN_VAR.radiusS}: ${escapeCssValue(palette.radiusS)};`,
    `${TOKEN_VAR.radiusM}: ${escapeCssValue(palette.radiusM)};`,
    `${TOKEN_VAR.radiusL}: ${escapeCssValue(palette.radiusL)};`,
    `${TOKEN_VAR.shadow1}: ${escapeCssValue(palette.shadow1)};`,
    `${TOKEN_VAR.shadow2}: ${escapeCssValue(palette.shadow2)};`,
    `${TOKEN_VAR.font}: ${escapeCssValue(palette.font)};`,
  ].join("\n  ");
}

/** CSS text for :root (or a host) with the given palette. */
export function buildTokensCss(palette: TokenPalette, selector = ":root"): string {
  return `${selector} {\n  ${tokensToCssDeclarations(palette)}\n}\n`;
}

export type CustomThemeOverrides = {
  readonly accent?: string;
  readonly bg?: string;
  readonly surface?: string;
  readonly text?: string;
  readonly backgroundImage?: string;
  readonly backgroundDim?: number;
};

/**
 * Apply custom overrides via CSS variables (setProperty only — no inline style attrs).
 * Call on document.documentElement (or a shadow host).
 */
export function applyCustomThemeProperties(
  target: HTMLElement,
  custom: CustomThemeOverrides,
): void {
  if (custom.accent !== undefined) {
    target.style.setProperty(TOKEN_VAR.accent, custom.accent);
  }
  if (custom.bg !== undefined) {
    target.style.setProperty(TOKEN_VAR.bg, custom.bg);
  }
  if (custom.surface !== undefined) {
    target.style.setProperty(TOKEN_VAR.surface, custom.surface);
  }
  if (custom.text !== undefined) {
    target.style.setProperty(TOKEN_VAR.text, custom.text);
  }
  if (custom.backgroundImage !== undefined && custom.backgroundImage.length > 0) {
    target.style.setProperty(
      TOKEN_VAR.backgroundImage,
      `url("${custom.backgroundImage.replace(/"/g, '\\"')}")`,
    );
  }
  if (custom.backgroundDim !== undefined) {
    target.style.setProperty(
      TOKEN_VAR.backgroundDim,
      String(custom.backgroundDim),
    );
  }
}

export function clearCustomThemeProperties(target: HTMLElement): void {
  target.style.removeProperty(TOKEN_VAR.accent);
  target.style.removeProperty(TOKEN_VAR.bg);
  target.style.removeProperty(TOKEN_VAR.surface);
  target.style.removeProperty(TOKEN_VAR.text);
  target.style.removeProperty(TOKEN_VAR.backgroundImage);
  target.style.removeProperty(TOKEN_VAR.backgroundDim);
}
