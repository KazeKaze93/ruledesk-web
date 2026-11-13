import type { JSX } from "preact";

import { UI_TEXT } from "../../config/constants";
import {
  getGridFavButtonsEnabled,
  setGridFavButtonsEnabled,
} from "../../storage/store";
import { setGridFavButtonsVisible } from "../cards";
import { SectionLabel, Switch } from "../kit";
import { GRID_FAV_CHECKBOX_ID, PANEL_UI_CLASS } from "./constants";
import { FavoritesSyncSection } from "./favorites-sync-section";

export type FavoritesTabProps = {
  readonly gridFavEnabled: boolean;
  readonly onGridFavChange: (enabled: boolean) => void;
};

export function FavoritesTab(props: FavoritesTabProps): JSX.Element {
  return (
    <div className={PANEL_UI_CLASS.scrollRegion}>
      <SectionLabel>Favorites</SectionLabel>
      <div className={PANEL_UI_CLASS.settingsRow}>
        <span>{UI_TEXT.gridFavButtonsLabel}</span>
        <Switch
          id={GRID_FAV_CHECKBOX_ID}
          label={UI_TEXT.gridFavButtonsLabel}
          checked={props.gridFavEnabled}
          onChange={(checked) => {
            setGridFavButtonsEnabled(checked);
            setGridFavButtonsVisible(checked);
            props.onGridFavChange(checked);
          }}
        />
      </div>
      <FavoritesSyncSection includeHeading={true} />
    </div>
  );
}

export function readInitialGridFavEnabled(): boolean {
  return getGridFavButtonsEnabled();
}
