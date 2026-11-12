import { log } from "../log";
import { detectPageKind, type PageKind } from "../site/pages";
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

const mountedIds = new Set<string>();
let activePageKind: PageKind | null = null;
let activeSearch = "";

export type ThumbsAddedListener = (root: ParentNode) => void;

const thumbsAddedListeners = new Set<ThumbsAddedListener>();

/** Subscribe to thumbs inserted after the initial page load (e.g. infinite scroll). */
export function onThumbsAdded(cb: ThumbsAddedListener): () => void {
  thumbsAddedListeners.add(cb);
  return (): void => {
    thumbsAddedListeners.delete(cb);
  };
}

/** Notify subscribers that new thumb nodes exist under `root`. */
export function notifyThumbsAdded(root: ParentNode): void {
  for (const listener of thumbsAddedListeners) {
    listener(root);
  }
}

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

function resolvePageContext(): { pageKind: PageKind; search: string } {
  if (activePageKind !== null) {
    return { pageKind: activePageKind, search: activeSearch };
  }
  return {
    pageKind: detectPageKind(window.location.search),
    search: window.location.search,
  };
}

function clearChoiceBodyClasses(feature: Feature): void {
  if (feature.choice === undefined) {
    return;
  }
  for (const option of feature.choice.options) {
    document.body.classList.remove(
      featureChoiceBodyClass(feature.id, option.value),
    );
  }
}

function mountFeatureOnce(feature: Feature): void {
  if (mountedIds.has(feature.id)) {
    return;
  }
  const { pageKind, search } = resolvePageContext();
  if (!feature.pages.includes(pageKind)) {
    return;
  }
  mountedIds.add(feature.id);
  try {
    feature.mount(createContext(feature, pageKind, search));
  } catch (error) {
    log.error(`Feature mount failed: ${feature.id}`, error);
  }
}

/**
 * Live-apply a cssOnly feature enable/disable: body classes + CSS injection.
 * Mounts once if not yet mounted when enabling. Does not remount on re-enable.
 */
export function applyCssOnlyFeatureEnabled(id: string, enabled: boolean): void {
  const feature = findFeature(id);
  if (feature?.cssOnly !== true) {
    return;
  }
  if (!getTweaksEnabled()) {
    return;
  }

  if (!enabled) {
    document.body.classList.remove(featureBodyClass(feature.id));
    clearChoiceBodyClasses(feature);
    return;
  }

  ensureFeatureCss(feature);
  document.body.classList.add(featureBodyClass(feature.id));
  if (feature.choice !== undefined) {
    clearChoiceBodyClasses(feature);
    document.body.classList.add(
      featureChoiceBodyClass(feature.id, getFeatureChoice(feature.id)),
    );
  }
  mountFeatureOnce(feature);
}

/**
 * Live-apply a cssOnly feature choice: swap body.rdw-f-<id>-<value> classes.
 */
export function applyCssOnlyFeatureChoice(id: string, value: string): void {
  const feature = findFeature(id);
  if (feature?.cssOnly !== true || feature.choice === undefined) {
    return;
  }
  if (!getTweaksEnabled()) {
    return;
  }
  if (!getFeatureEnabled(id, feature.defaultEnabled)) {
    return;
  }

  ensureFeatureCss(feature);
  clearChoiceBodyClasses(feature);
  document.body.classList.add(featureChoiceBodyClass(feature.id, value));
}

/** Clears mount tracking, thumbs bus, and page context (tests). */
export function resetFeatureRuntimeState(): void {
  mountedIds.clear();
  thumbsAddedListeners.clear();
  activePageKind = null;
  activeSearch = "";
}

export function runFeatures(
  pageKind: PageKind,
  search: string,
  features: readonly Feature[] = FEATURES,
): void {
  activePageKind = pageKind;
  activeSearch = search;

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

    mountedIds.add(feature.id);
    try {
      feature.mount(createContext(feature, pageKind, search));
    } catch (error) {
      log.error(`Feature mount failed: ${feature.id}`, error);
    }
  }
}
