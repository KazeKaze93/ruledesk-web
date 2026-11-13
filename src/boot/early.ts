import { ensureStyleElement } from "./appearance-dom";
import {
  RDW_OWN_PAGE_CLASS,
  RDW_OWN_PAGE_STYLE_ID,
  buildOwnPageCss,
  parseRdwHash,
} from "../pages/constants";
import { getSiteSkinCss } from "../skin/site-skin";
import { applyAppearanceTheme } from "../skin/theme";
import {
  getAppearance,
  getAppearanceBackgroundDataUrl,
} from "../storage/store";

/**
 * If the URL already has #rdw/…, stamp html.rdw-own-page before paint.
 * Kept here (not in pages/router) so document-start does not import Preact host.
 */
function applyOwnPageClassEarly(): void {
  if (parseRdwHash(window.location.hash) === null) {
    return;
  }
  const root = document.documentElement;
  if (root === null) {
    return;
  }
  const style = ensureStyleElement(RDW_OWN_PAGE_STYLE_ID);
  style.textContent = buildOwnPageCss();
  root.classList.add(RDW_OWN_PAGE_CLASS);
}

/**
 * Runs at userscript document-start, before DOMContentLoaded.
 * Reads settings, syncs site theme cookie, stamps html theme attrs,
 * injects token + site-skin CSS. Must not touch document.body.
 * If the URL already has #rdw/…, stamps html.rdw-own-page to avoid a flash.
 */
export function bootEarly(): void {
  applyOwnPageClassEarly();
  const appearance = getAppearance();
  const backgroundDataUrl = getAppearanceBackgroundDataUrl();
  applyAppearanceTheme({
    appearance,
    siteSkinCss: getSiteSkinCss(),
    ...(backgroundDataUrl !== undefined ? { backgroundDataUrl } : {}),
  });
}
