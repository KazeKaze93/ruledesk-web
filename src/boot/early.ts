import {
  getAppearance,
  getAppearanceBackgroundDataUrl,
} from "../storage/store";
import { applyAppearanceToDocument } from "./appearance-dom";

/**
 * Runs at userscript document-start, before DOMContentLoaded.
 * Reads settings, stamps html theme attrs, injects token (+ empty site-skin) CSS.
 * Must not touch document.body.
 */
export function bootEarly(): void {
  const appearance = getAppearance();
  const backgroundDataUrl = getAppearanceBackgroundDataUrl();
  applyAppearanceToDocument({
    appearance,
    ...(backgroundDataUrl !== undefined ? { backgroundDataUrl } : {}),
  });
}
