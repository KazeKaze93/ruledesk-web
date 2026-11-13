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
import { getSiteSkinCss } from "./site-skin";
import { forceLightSiteBase, setSiteTheme } from "../site/theme";
import {
  APPEARANCE_CUSTOM_BASE_LIGHT,
  type Appearance,
  type AppearanceCustom,
} from "../storage/schema";
import {
  parseHexColor,
  relativeLuminance,
  TOKEN_VAR,
} from "../ui/tokens";

/** WCAG AA normal-text minimum contrast ratio. */
export const CONTRAST_RATIO_MIN = 4.5;

export const BACKGROUND_DIM_MIN = 0;
export const BACKGROUND_DIM_MAX = 0.8;
export const DEFAULT_BACKGROUND_DIM = 0;

/** JPEG quality when downscaling a custom background to screen size. */
export const APPEARANCE_BACKGROUND_JPEG_QUALITY = 0.85;

const CONTRAST_OFFSET = 0.05;
const JPEG_MIME = "image/jpeg";

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
    base: APPEARANCE_CUSTOM_BASE_LIGHT,
    backgroundDim: DEFAULT_BACKGROUND_DIM,
  };
}

export function clampBackgroundDim(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_BACKGROUND_DIM;
  }
  return Math.min(BACKGROUND_DIM_MAX, Math.max(BACKGROUND_DIM_MIN, value));
}

export { parseHexColor, relativeLuminance };

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

/** CSS pixel screen size × devicePixelRatio (for background hints/resize). */
export function getScreenPixelSize(): { width: number; height: number } {
  const dpr =
    Number.isFinite(window.devicePixelRatio) && window.devicePixelRatio > 0
      ? window.devicePixelRatio
      : 1;
  return {
    width: Math.round(window.screen.width * dpr),
    height: Math.round(window.screen.height * dpr),
  };
}

/**
 * Fit source inside max box without upscaling. Pure sizing helper (testable).
 */
export function computeDownscaleSize(
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0
  ) {
    return { width: 0, height: 0 };
  }
  if (sourceWidth <= maxWidth && sourceHeight <= maxHeight) {
    return {
      width: Math.round(sourceWidth),
      height: Math.round(sourceHeight),
    };
  }
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

export type PreparedBackgroundImage = {
  readonly dataUrl: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly outputWidth: number;
  readonly outputHeight: number;
  readonly belowScreen: boolean;
};

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      reject(new Error("Could not decode image"));
    };
    image.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read image file"));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Could not read image file"));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Decode file, downscale to screen pixels (never upscale), encode JPEG.
 */
export async function prepareBackgroundImageFile(
  file: File,
): Promise<PreparedBackgroundImage> {
  const rawDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(rawDataUrl);
  const sourceWidth = image.naturalWidth;
  const sourceHeight = image.naturalHeight;
  const screen = getScreenPixelSize();
  const sized = computeDownscaleSize(
    sourceWidth,
    sourceHeight,
    screen.width,
    screen.height,
  );
  const canvas = document.createElement("canvas");
  canvas.width = sized.width;
  canvas.height = sized.height;
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Could not prepare background image");
  }
  context.drawImage(image, 0, 0, sized.width, sized.height);
  const dataUrl = canvas.toDataURL(
    JPEG_MIME,
    APPEARANCE_BACKGROUND_JPEG_QUALITY,
  );
  return {
    dataUrl,
    sourceWidth,
    sourceHeight,
    outputWidth: sized.width,
    outputHeight: sized.height,
    belowScreen:
      sourceWidth < screen.width || sourceHeight < screen.height,
  };
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
    contrastWarning: false,
    contrastRatio: null,
  };
}
