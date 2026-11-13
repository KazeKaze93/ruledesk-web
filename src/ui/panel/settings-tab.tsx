import type { JSX } from "preact";
import { useState } from "preact/hooks";

import { UI_TEXT } from "../../config/constants";
import { FEATURES } from "../../features/registry";
import {
  applyCssOnlyFeatureChoice,
  applyCssOnlyFeatureEnabled,
  getFeatureChoice,
  isFeatureEnabled,
} from "../../features/runtime";
import {
  getPlaylistChunkSize,
  getTweaksEnabled,
  getUpdatesGroupSize,
  setFeatureChoiceValue,
  setFeatureEnabled,
  setPlaylistChunkSize,
  setTweaksEnabled,
  setUpdatesGroupSize,
} from "../../storage/store";
import { AppearanceSection } from "../appearance-section";
import {
  Button,
  NumberField,
  SectionLabel,
  Select,
  Switch,
} from "../kit";
import {
  FEATURE_CHECKBOX_ID_PREFIX,
  FEATURE_CHOICE_ID_PREFIX,
  featurePanelLabel,
  PANEL_UI_CLASS,
  PLAYLIST_CHUNK_SIZE_ID,
  TWEAKS_SWITCH_ID,
  UPDATES_GROUP_SIZE_ID,
} from "./constants";

/** Grid density is owned by Appearance (B2); omit from Page module list. */
const PAGE_FEATURE_SKIP = new Set(["grid-density"]);

export type SettingsTabProps = {
  readonly importError: string;
  readonly onExport: () => void;
  readonly onImport: () => void;
};

function FeatureModules(): JSX.Element {
  const [, bump] = useState(0);
  const refresh = (): void => {
    bump((value) => value + 1);
  };

  return (
    <div className={PANEL_UI_CLASS.settingsGroup}>
      {FEATURES.filter((feature) => !PAGE_FEATURE_SKIP.has(feature.id)).map(
        (feature) => {
        const label = featurePanelLabel(feature.id, feature.label);
        if (feature.choice !== undefined) {
          const selected = getFeatureChoice(feature.id);
          return (
            <div
              key={feature.id}
              className={PANEL_UI_CLASS.settingsRow}
              id={`${FEATURE_CHOICE_ID_PREFIX}${feature.id}`}
            >
              <Select
                label={label}
                options={feature.choice.options.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                value={selected}
                onChange={(value) => {
                  setFeatureChoiceValue(feature.id, value);
                  if (feature.cssOnly === true) {
                    applyCssOnlyFeatureChoice(feature.id, value);
                    refresh();
                    return;
                  }
                  window.location.reload();
                }}
              />
            </div>
          );
        }
        return (
          <div key={feature.id} className={PANEL_UI_CLASS.settingsRow}>
            <Switch
              id={`${FEATURE_CHECKBOX_ID_PREFIX}${feature.id}`}
              label={label}
              checked={isFeatureEnabled(feature.id)}
              onChange={(checked) => {
                setFeatureEnabled(feature.id, checked);
                if (feature.cssOnly === true) {
                  applyCssOnlyFeatureEnabled(feature.id, checked);
                  refresh();
                  return;
                }
                window.location.reload();
              }}
            />
          </div>
        );
      },
      )}
    </div>
  );
}

export function SettingsTab(props: SettingsTabProps): JSX.Element {
  const [tweaks, setTweaks] = useState(() => getTweaksEnabled());
  const [updatesGroup, setUpdatesGroup] = useState(() => getUpdatesGroupSize());
  const [playlistChunk, setPlaylistChunk] = useState(() =>
    getPlaylistChunkSize(),
  );

  return (
    <div className={PANEL_UI_CLASS.scrollRegion}>
      <AppearanceSection />

      <div>
        <SectionLabel>Page</SectionLabel>
        <div className={PANEL_UI_CLASS.settingsGroup}>
          <div className={PANEL_UI_CLASS.settingsRow}>
            <Switch
              id={TWEAKS_SWITCH_ID}
              label={UI_TEXT.enablePageTweaksLabel}
              checked={tweaks}
              onChange={(checked) => {
                setTweaksEnabled(checked);
                setTweaks(checked);
                window.location.reload();
              }}
            />
          </div>
          <FeatureModules />
          <div className={PANEL_UI_CLASS.settingsRow}>
            <NumberField
              id={UPDATES_GROUP_SIZE_ID}
              label={UI_TEXT.updatesGroupSizeLabel}
              value={updatesGroup}
              min={0}
              step={1}
              onChange={(value) => {
                const next = value ?? 0;
                setUpdatesGroupSize(next);
                setUpdatesGroup(getUpdatesGroupSize());
              }}
            />
          </div>
          <div className={PANEL_UI_CLASS.settingsRow}>
            <NumberField
              id={PLAYLIST_CHUNK_SIZE_ID}
              label={UI_TEXT.playlistChunkSizeLabel}
              value={playlistChunk}
              min={1}
              step={1}
              onChange={(value) => {
                const next = value ?? 0;
                setPlaylistChunkSize(next);
                setPlaylistChunk(getPlaylistChunkSize());
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>Data</SectionLabel>
        <div className="rdw-toolbar">
          <Button variant="secondary" onClick={props.onExport}>
            {UI_TEXT.export}
          </Button>
          <Button variant="secondary" onClick={props.onImport}>
            {UI_TEXT.import}
          </Button>
        </div>
        {props.importError.length > 0 ? (
          <p className="rdw-error">
            {`${UI_TEXT.importErrorPrefix} ${props.importError}`}
          </p>
        ) : null}
      </div>
    </div>
  );
}
