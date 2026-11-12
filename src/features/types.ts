import type { PageKind } from "../site/pages";

export const TOPBAR_ID = "rdw-topbar";
export const TOPBAR_SLOT_LEFT_ID = "rdw-topbar-slot-left";
export const TOPBAR_SLOT_PAGER_ID = "rdw-topbar-slot-pager";

export const THUMB_CLASS = "rdw-thumb";
export const THUMB_ANCHOR_NAME = "--rdw-img";

export const FEATURE_STYLE_ID_PREFIX = "rdw-feature-style-";
export const POST_ACTIONS_ID = "rdw-post-actions";

export function featureBodyClass(id: string): string {
  return `rdw-f-${id}`;
}

export function featureChoiceBodyClass(id: string, value: string): string {
  return `rdw-f-${id}-${value}`;
}

export type FeatureStateParse<T> = (raw: unknown) => T;

export type FeatureContext = {
  pageKind: PageKind;
  search: string;
  getState: <T>(parse: FeatureStateParse<T>) => T;
  setState: (value: unknown) => void;
};

export type FeatureChoiceOption = {
  value: string;
  label: string;
};

export type FeatureChoice = {
  options: FeatureChoiceOption[];
  defaultValue: string;
};

export type Feature = {
  id: string;
  label: string;
  pages: PageKind[];
  defaultEnabled: boolean;
  css: string;
  choice?: FeatureChoice;
  mount: (ctx: FeatureContext) => void;
};
