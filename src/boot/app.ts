import { runFeatures } from "../features/runtime";
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
import { mountPanel } from "../ui/panel";

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
 * Feature/panel mount — only after DOM is ready (body exists).
 */
export function startApp(): void {
  syncAppearanceAfterDomReady();
  mountPanel();

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
}
