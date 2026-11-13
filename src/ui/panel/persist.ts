import { getFeatureState, setFeatureState } from "../../storage/store";
import {
  isPanelTab,
  PANEL_FEATURE_STATE_ID,
  type PanelTab,
} from "./constants";
import {
  clampSize,
  PANEL_DEFAULT_HEIGHT_PX,
  PANEL_DEFAULT_WIDTH_PX,
  PANEL_MIN_HEIGHT_PX,
  PANEL_MIN_WIDTH_PX,
} from "./size";

export type PanelPersistedState = {
  tab: PanelTab;
  width: number;
  height: number;
};

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

export function readPersistedPanelState(): PanelPersistedState {
  const raw = getFeatureState(PANEL_FEATURE_STATE_ID);
  let tab: PanelTab = "collections";
  let width = PANEL_DEFAULT_WIDTH_PX;
  let height = PANEL_DEFAULT_HEIGHT_PX;
  if (isUnknownRecord(raw)) {
    if (isPanelTab(raw["tab"])) {
      tab = raw["tab"];
    }
    const rawWidth = raw["width"];
    const rawHeight = raw["height"];
    if (typeof rawWidth === "number") {
      width = clampSize(rawWidth, PANEL_MIN_WIDTH_PX);
    }
    if (typeof rawHeight === "number") {
      height = clampSize(rawHeight, PANEL_MIN_HEIGHT_PX);
    }
  }
  return { tab, width, height };
}

export function writePersistedPanelState(next: PanelPersistedState): void {
  setFeatureState(PANEL_FEATURE_STATE_ID, {
    tab: next.tab,
    width: next.width,
    height: next.height,
  });
}
