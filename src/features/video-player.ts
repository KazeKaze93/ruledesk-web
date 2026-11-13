/**
 * Post-page Fluid Player tweaks: persist volume/mute/rate, wheel volume,
 * and CSS size modes (Fit height / Fit width / Original).
 *
 * Does not replace the Fluid wrapper or rename its classes — only the
 * video element and wrapper size via CSS variables / max-* rules.
 */

import { scheduleAfterFirstPaint } from "../boot/ready";
import { log } from "../log";
import {
  DEFAULT_VIDEO_PLAYER_TWEAKS_ENABLED,
  DEFAULT_VIDEO_SIZE,
  VIDEO_PLAYER_FEATURE_ID,
  VIDEO_SIZE_FIT_HEIGHT,
  VIDEO_SIZE_FIT_WIDTH,
  VIDEO_SIZE_ORIGINAL,
  parseVideoPlayerState,
  type VideoPlayerState,
  type VideoSize,
} from "../storage/schema";
import { measureHeaderOffsetPx } from "./post-panel/site-reads";
import {
  featureBodyClass,
  featureChoiceBodyClass,
  type Feature,
  type FeatureContext,
} from "./types";

export const VIDEO_PLAYER_ID = VIDEO_PLAYER_FEATURE_ID;
const FEATURE_ID = VIDEO_PLAYER_FEATURE_ID;
const FEATURE_LABEL = "Video player tweaks";
const FEATURE_PAGES = ["post"] as const;

export const VIDEO_ELEMENT_ID = "gelcomVideoPlayer";
export const FLUID_WRAPPER_ID = "fluid_video_wrapper_gelcomVideoPlayer";
export const FLUID_WRAPPER_CLASS = "fluid_video_wrapper";

const VOLUME_WHEEL_STEP = 0.05;
const VOLUME_MIN = 0;
const VOLUME_MAX = 1;
const CHROME_GAP_PX = 12;
const ASPECT_RATIO_CSS_VAR = "--rdw-vp-aspect-ratio";
const CHROME_OFFSET_CSS_VAR = "--rdw-vp-chrome-offset";
const ASPECT_RATIO_FALLBACK = "16 / 9";

const WARN_NO_VIDEO =
  "video-player: #gelcomVideoPlayer missing; tweaks not mounted";

const BODY_CLASS = featureBodyClass(FEATURE_ID);
const BODY_SELECTOR = `body.${BODY_CLASS}`;
const WRAPPER_SELECTOR = `#${FLUID_WRAPPER_ID}.${FLUID_WRAPPER_CLASS}`;

const SIZE_LABEL_FIT_HEIGHT = "Fit height";
const SIZE_LABEL_FIT_WIDTH = "Fit width";
const SIZE_LABEL_ORIGINAL = "Original";

function sizeModeCss(value: VideoSize): string {
  const choiceClass = featureChoiceBodyClass(FEATURE_ID, value);
  const scope = `body.${choiceClass} ${WRAPPER_SELECTOR}`;
  if (value === VIDEO_SIZE_ORIGINAL) {
    return "";
  }
  if (value === VIDEO_SIZE_FIT_WIDTH) {
    return [
      `${scope} {`,
      `  max-width: 100%;`,
      `  aspect-ratio: var(${ASPECT_RATIO_CSS_VAR}, ${ASPECT_RATIO_FALLBACK});`,
      `}`,
    ].join("\n");
  }
  // fit-height: player + Fluid controls fit under the site header
  return [
    `${scope} {`,
    `  max-height: calc(100vh - var(${CHROME_OFFSET_CSS_VAR}, 0px));`,
    `  max-width: 100%;`,
    `  aspect-ratio: var(${ASPECT_RATIO_CSS_VAR}, ${ASPECT_RATIO_FALLBACK});`,
    `}`,
  ].join("\n");
}

const FEATURE_CSS = [
  `${BODY_SELECTOR} ${WRAPPER_SELECTOR} {`,
  `  box-sizing: border-box;`,
  `}`,
  sizeModeCss(VIDEO_SIZE_FIT_HEIGHT),
  sizeModeCss(VIDEO_SIZE_FIT_WIDTH),
].join("\n");

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return VOLUME_MIN;
  }
  return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, value));
}

function readStoredState(ctx: FeatureContext): VideoPlayerState {
  return ctx.getState(parseVideoPlayerState);
}

function writeStoredState(ctx: FeatureContext, state: VideoPlayerState): void {
  ctx.setState({
    volume: state.volume,
    muted: state.muted,
    playbackRate: state.playbackRate,
  });
}

function findVideo(): HTMLVideoElement | null {
  const node = document.getElementById(VIDEO_ELEMENT_ID);
  return node instanceof HTMLVideoElement ? node : null;
}

function findWrapper(): HTMLElement | null {
  const node = document.getElementById(FLUID_WRAPPER_ID);
  if (!(node instanceof HTMLElement)) {
    return null;
  }
  if (!node.classList.contains(FLUID_WRAPPER_CLASS)) {
    return null;
  }
  return node;
}

function updateChromeOffsetVar(wrapper: HTMLElement): void {
  const offsetPx = measureHeaderOffsetPx(CHROME_GAP_PX);
  wrapper.style.setProperty(CHROME_OFFSET_CSS_VAR, `${String(offsetPx)}px`);
}

function updateAspectRatioVar(
  wrapper: HTMLElement,
  video: HTMLVideoElement,
): void {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (width <= 0 || height <= 0) {
    return;
  }
  wrapper.style.setProperty(ASPECT_RATIO_CSS_VAR, `${String(width)} / ${String(height)}`);
}

/**
 * Apply persisted volume/mute/rate. Fluid's own volume UI may not mirror
 * programmatic `video.volume` / `video.muted` — see LIVE-CHECK note.
 */
function applyPersistedPlayback(
  video: HTMLVideoElement,
  state: VideoPlayerState,
): void {
  const volume = state.volume ?? VOLUME_MAX;
  const muted = state.muted ?? false;
  const playbackRate = state.playbackRate ?? 1;
  video.volume = clampVolume(volume);
  video.muted = muted;
  video.playbackRate = playbackRate;
}

function persistFromVideo(
  ctx: FeatureContext,
  video: HTMLVideoElement,
): void {
  writeStoredState(ctx, {
    volume: clampVolume(video.volume),
    muted: video.muted,
    playbackRate: video.playbackRate,
  });
}

function isEventOverPlayer(
  target: EventTarget | null,
  video: HTMLVideoElement,
  wrapper: HTMLElement | null,
): boolean {
  if (!(target instanceof Node)) {
    return false;
  }
  if (wrapper !== null && wrapper.contains(target)) {
    return true;
  }
  return video === target || video.contains(target);
}

function onWheelVolume(
  event: WheelEvent,
  video: HTMLVideoElement,
  wrapper: HTMLElement | null,
  ctx: FeatureContext,
): void {
  if (event.shiftKey) {
    return;
  }
  if (!isEventOverPlayer(event.target, video, wrapper)) {
    return;
  }
  event.preventDefault();
  const direction = event.deltaY < 0 ? 1 : -1;
  const next = clampVolume(video.volume + direction * VOLUME_WHEEL_STEP);
  video.volume = next;
  if (next > VOLUME_MIN && video.muted) {
    video.muted = false;
  }
  persistFromVideo(ctx, video);
}

function bindPlayer(ctx: FeatureContext, video: HTMLVideoElement): void {
  const wrapper = findWrapper();
  const state = readStoredState(ctx);

  const applyLayout = (): void => {
    if (wrapper !== null) {
      updateChromeOffsetVar(wrapper);
      updateAspectRatioVar(wrapper, video);
    }
  };

  const onLoadedMetadata = (): void => {
    applyPersistedPlayback(video, readStoredState(ctx));
    applyLayout();
  };

  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    applyPersistedPlayback(video, state);
    applyLayout();
  }
  video.addEventListener("loadedmetadata", onLoadedMetadata);

  video.addEventListener("volumechange", () => {
    persistFromVideo(ctx, video);
  });
  video.addEventListener("ratechange", () => {
    persistFromVideo(ctx, video);
  });

  const onWheel = (event: WheelEvent): void => {
    onWheelVolume(event, video, wrapper, ctx);
  };
  const wheelRoot = wrapper ?? video;
  wheelRoot.addEventListener("wheel", onWheel, { passive: false });

  const onResize = (): void => {
    applyLayout();
  };
  window.addEventListener("resize", onResize);
}

function mountVideoPlayer(ctx: FeatureContext): void {
  scheduleAfterFirstPaint(() => {
    const video = findVideo();
    if (video === null) {
      log.warn(WARN_NO_VIDEO);
      return;
    }
    bindPlayer(ctx, video);
  });
}

export const videoPlayerFeature: Feature = {
  id: FEATURE_ID,
  label: FEATURE_LABEL,
  pages: [...FEATURE_PAGES],
  defaultEnabled: DEFAULT_VIDEO_PLAYER_TWEAKS_ENABLED,
  choice: {
    label: "Video size",
    options: [
      { value: VIDEO_SIZE_FIT_HEIGHT, label: SIZE_LABEL_FIT_HEIGHT },
      { value: VIDEO_SIZE_FIT_WIDTH, label: SIZE_LABEL_FIT_WIDTH },
      { value: VIDEO_SIZE_ORIGINAL, label: SIZE_LABEL_ORIGINAL },
    ],
    defaultValue: DEFAULT_VIDEO_SIZE,
  },
  css: FEATURE_CSS,
  mount: mountVideoPlayer,
};

export {
  ASPECT_RATIO_CSS_VAR,
  CHROME_OFFSET_CSS_VAR,
  VOLUME_WHEEL_STEP,
  FEATURE_CSS,
};
