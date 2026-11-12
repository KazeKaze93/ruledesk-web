import { syncFavoritesPage } from "./site/favorites-page";
import { detectPageKind } from "./site/pages";
import { mountArtistSidebar } from "./ui/artists-sidebar";
import { mountCards } from "./ui/cards";
import { mountPanel } from "./ui/panel";
import { mountPostPageToggle } from "./ui/post-page";
import { mountUpdatesBar } from "./ui/updates-bar";

mountPanel();

const pageKind = detectPageKind(window.location.search);
if (pageKind === "list") {
  mountCards();
  mountArtistSidebar();
  mountUpdatesBar();
} else if (pageKind === "post") {
  mountPostPageToggle();
  mountArtistSidebar();
} else if (pageKind === "favorites") {
  syncFavoritesPage();
}
