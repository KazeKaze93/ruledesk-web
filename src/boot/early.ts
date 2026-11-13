import { getSiteSkinCss } from "../skin/site-skin";
import { applyAppearanceTheme } from "../skin/theme";
import {
  getAppearance,
  getAppearanceBackgroundDataUrl,
} from "../storage/store";

/**
 * Runs at userscript document-start, before DOMContentLoaded.
 * Reads settings, syncs site theme cookie, stamps html theme attrs,
 * injects token + site-skin CSS. Must not touch document.body.
 */
export function bootEarly(): void {
  const appearance = getAppearance();
  const backgroundDataUrl = getAppearanceBackgroundDataUrl();
  applyAppearanceTheme({
    appearance,
    siteSkinCss: getSiteSkinCss(),
    ...(backgroundDataUrl !== undefined ? { backgroundDataUrl } : {}),
  });
}
