import { syncFavoritesPage } from "./site/favorites-page";
import { detectPageKind } from "./site/pages";
import { mountCards } from "./ui/cards";
import { mountPanel } from "./ui/panel";
import { mountPostPageToggle } from "./ui/post-page";

mountPanel();

const pageKind = detectPageKind(window.location.search);
if (pageKind === "list") {
  mountCards();
} else if (pageKind === "post") {
  mountPostPageToggle();
} else if (pageKind === "favorites") {
  syncFavoritesPage();
}
