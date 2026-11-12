import { log } from "../log";
import type { PageKind } from "../site/pages";
import {
  getFeatureChoiceValue,
  getFeatureEnabled,
  getFeatureState,
  getTweaksEnabled,
  setFeatureState,
} from "../storage/store";
import { FEATURES } from "./registry";
import {
  FEATURE_STYLE_ID_PREFIX,
  featureBodyClass,
  featureChoiceBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

function findFeature(id: string): Feature | undefined {
  return FEATURES.find((feature) => feature.id === id);
}

export function isFeatureEnabled(id: string): boolean {
  const feature = findFeature(id);
  if (feature === undefined) {
    return false;
  }
  return getFeatureEnabled(id, feature.defaultEnabled);
}

export function getFeatureChoice(id: string): string {
  const feature = findFeature(id);
  if (feature?.choice === undefined) {
    return "";
  }
  const stored = getFeatureChoiceValue(id);
  if (
    stored !== undefined &&
    feature.choice.options.some((option) => option.value === stored)
  ) {
    return stored;
  }
  return feature.choice.defaultValue;
}

function ensureFeatureCss(feature: Feature): void {
  const styleId = `${FEATURE_STYLE_ID_PREFIX}${feature.id}`;
  if (document.getElementById(styleId) !== null) {
    return;
  }
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = feature.css;
  document.head.append(style);
}

function createContext(feature: Feature, pageKind: PageKind, search: string): FeatureContext {
  return {
    pageKind,
    search,
    getState: <T>(parse: (raw: unknown) => T): T => {
      return parse(getFeatureState(feature.id));
    },
    setState: (value: unknown): void => {
      setFeatureState(feature.id, value);
    },
  };
}

export function runFeatures(
  pageKind: PageKind,
  search: string,
  features: readonly Feature[] = FEATURES,
): void {
  if (!getTweaksEnabled()) {
    return;
  }

  for (const feature of features) {
    if (!feature.pages.includes(pageKind)) {
      continue;
    }
    if (!getFeatureEnabled(feature.id, feature.defaultEnabled)) {
      continue;
    }

    document.body.classList.add(featureBodyClass(feature.id));
    if (feature.choice !== undefined) {
      const choiceValue = (() => {
        const stored = getFeatureChoiceValue(feature.id);
        if (
          stored !== undefined &&
          feature.choice.options.some((option) => option.value === stored)
        ) {
          return stored;
        }
        return feature.choice.defaultValue;
      })();
      document.body.classList.add(
        featureChoiceBodyClass(feature.id, choiceValue),
      );
    }

    ensureFeatureCss(feature);

    try {
      feature.mount(createContext(feature, pageKind, search));
    } catch (error) {
      log.error(`Feature mount failed: ${feature.id}`, error);
    }
  }
}
