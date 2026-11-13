import { runFeatures } from "../features/runtime";
import { startRdwPages } from "../pages/router";
import { getSiteSkinCss } from "../skin/site-skin";
import { applyAppearanceTheme } from "../skin/theme";
import { syncFavoritesPage } from "../site/favorites-page";
import { detectPageKind } from "../site/pages";
import {
  getAppearance,
  getAppearanceBackgroundDataUrl,
} from "../storage/store";
import { mountArtistSidebar } from "../ui/artists-sidebar";
import { mountCards } from "../ui/cards";

/**
 * Re-apply appearance once head/body exist so the site stylesheet link
 * can be swapped (document-start often runs before that link is parsed).
 */
function syncAppearanceAfterDomReady(): void {
  const appearance = getAppearance();
  const backgroundDataUrl = getAppearanceBackgroundDataUrl();
  applyAppearanceTheme({
    appearance,
    siteSkinCss: getSiteSkinCss(),
    ...(backgroundDataUrl !== undefined ? { backgroundDataUrl } : {}),
  });
}

/**
 * Feature + own-page mount — only after DOM is ready (body exists).
 * Floating panel (#ruledesk-web-root / #ruledesk-web-toggle) is removed.
 */
export function startApp(): void {
  syncAppearanceAfterDomReady();

  const pageKind = detectPageKind(window.location.search);
  if (pageKind === "list") {
    mountCards();
    mountArtistSidebar();
  } else if (pageKind === "post") {
    mountArtistSidebar();
  } else if (pageKind === "favorites") {
    syncFavoritesPage();
  }

  runFeatures(pageKind, window.location.search);
  // After Feed inserts its nav item so Collections/Following sit after Feed.
  startRdwPages();
}
