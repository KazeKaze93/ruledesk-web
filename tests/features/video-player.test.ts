import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ASPECT_RATIO_CSS_VAR,
  CHROME_OFFSET_CSS_VAR,
  FLUID_WRAPPER_CLASS,
  FLUID_WRAPPER_ID,
  VIDEO_ELEMENT_ID,
  VIDEO_PLAYER_ID,
  VOLUME_WHEEL_STEP,
  videoPlayerFeature,
} from "../../src/features/video-player";
import {
  featureBodyClass,
  featureChoiceBodyClass,
  type FeatureContext,
} from "../../src/features/types";
import {
  DEFAULT_VIDEO_MUTED,
  DEFAULT_VIDEO_PLAYBACK_RATE,
  DEFAULT_VIDEO_PLAYER_TWEAKS_ENABLED,
  DEFAULT_VIDEO_PREVIEW_ON_HOVER,
  DEFAULT_VIDEO_SIZE,
  DEFAULT_VIDEO_VOLUME,
  VIDEO_PLAYER_FEATURE_ID,
  VIDEO_PREVIEW_FEATURE_ID,
  VIDEO_SIZE_FIT_HEIGHT,
  VIDEO_SIZE_FIT_WIDTH,
  VIDEO_SIZE_ORIGINAL,
  parseVideoPlayerState,
  resolveVideoSize,
} from "../../src/storage/schema";

const BODY_CLASS = featureBodyClass(VIDEO_PLAYER_FEATURE_ID);

type StoredState = {
  volume?: number;
  muted?: boolean;
  playbackRate?: number;
};

function makeCtx(initial?: StoredState): {
  ctx: FeatureContext;
  writes: unknown[];
} {
  let current: unknown = initial;
  const writes: unknown[] = [];
  const ctx: FeatureContext = {
    pageKind: "post",
    search: "?page=post&s=view&id=1",
    getState: <T>(parse: (raw: unknown) => T): T => parse(current),
    setState: (value: unknown): void => {
      current = value;
      writes.push(value);
    },
  };
  return { ctx, writes };
}

function buildPlayerDom(options?: {
  readonly inlineSize?: boolean;
  readonly videoWidth?: number;
  readonly videoHeight?: number;
}): {
  video: HTMLVideoElement;
  wrapper: HTMLDivElement;
} {
  document.body.innerHTML = "";
  document.body.classList.add(BODY_CLASS);
  document.body.classList.add(
    featureChoiceBodyClass(VIDEO_PLAYER_FEATURE_ID, VIDEO_SIZE_FIT_HEIGHT),
  );

  const header = document.createElement("div");
  header.id = "header";
  Object.defineProperty(header, "getBoundingClientRect", {
    value: (): DOMRect =>
      ({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        bottom: 48,
        right: 800,
        width: 800,
        height: 48,
        toJSON: (): Record<string, never> => ({}),
      }) satisfies DOMRect,
  });
  document.body.append(header);

  const wrapper = document.createElement("div");
  wrapper.id = FLUID_WRAPPER_ID;
  wrapper.className = FLUID_WRAPPER_CLASS;
  if (options?.inlineSize === true) {
    wrapper.style.width = "1280px";
    wrapper.style.height = "720px";
  }

  const video = document.createElement("video");
  video.id = VIDEO_ELEMENT_ID;
  video.loop = true;
  video.preload = "auto";
  const source = document.createElement("source");
  source.src = "https://example.com/clip.mp4";
  video.append(source);

  const width = options?.videoWidth ?? 1280;
  const height = options?.videoHeight ?? 720;
  Object.defineProperty(video, "videoWidth", { configurable: true, get: () => width });
  Object.defineProperty(video, "videoHeight", { configurable: true, get: () => height });
  Object.defineProperty(video, "readyState", {
    configurable: true,
    get: () => HTMLMediaElement.HAVE_METADATA,
  });

  wrapper.append(video);
  document.body.append(wrapper);
  return { video, wrapper };
}

function flushFirstPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
}

describe("video player schema (Package B + C HANDOFF)", () => {
  it("exports B/C feature ids and defaults", () => {
    expect(VIDEO_PLAYER_FEATURE_ID).toBe("video-player");
    expect(VIDEO_PREVIEW_FEATURE_ID).toBe("video-preview");
    expect(DEFAULT_VIDEO_PLAYER_TWEAKS_ENABLED).toBe(true);
    expect(DEFAULT_VIDEO_PREVIEW_ON_HOVER).toBe(false);
    expect(DEFAULT_VIDEO_SIZE).toBe(VIDEO_SIZE_FIT_HEIGHT);
    expect(DEFAULT_VIDEO_VOLUME).toBe(1);
    expect(DEFAULT_VIDEO_MUTED).toBe(false);
    expect(DEFAULT_VIDEO_PLAYBACK_RATE).toBe(1);
  });

  it("parseVideoPlayerState fills defaults and clamps volume", () => {
    expect(parseVideoPlayerState(undefined)).toEqual({
      volume: 1,
      muted: false,
      playbackRate: 1,
    });
    expect(parseVideoPlayerState({ volume: 2, muted: true, playbackRate: 1.5 })).toEqual({
      volume: 1,
      muted: true,
      playbackRate: 1.5,
    });
    expect(parseVideoPlayerState({ volume: -0.2 })).toEqual({
      volume: 0,
      muted: false,
      playbackRate: 1,
    });
  });

  it("resolveVideoSize accepts Fit height / width / Original", () => {
    expect(resolveVideoSize(undefined)).toBe(VIDEO_SIZE_FIT_HEIGHT);
    expect(resolveVideoSize(VIDEO_SIZE_FIT_WIDTH)).toBe(VIDEO_SIZE_FIT_WIDTH);
    expect(resolveVideoSize(VIDEO_SIZE_ORIGINAL)).toBe(VIDEO_SIZE_ORIGINAL);
    expect(resolveVideoSize("nope")).toBe(VIDEO_SIZE_FIT_HEIGHT);
  });
});

describe("videoPlayerFeature contract", () => {
  it("exports Feature for Phase 2 registry HANDOFF", () => {
    expect(videoPlayerFeature.id).toBe(VIDEO_PLAYER_ID);
    expect(videoPlayerFeature.id).toBe("video-player");
    expect(videoPlayerFeature.label).toBe("Video player tweaks");
    expect(videoPlayerFeature.pages).toEqual(["post"]);
    expect(videoPlayerFeature.defaultEnabled).toBe(true);
    expect(videoPlayerFeature.choice?.defaultValue).toBe(VIDEO_SIZE_FIT_HEIGHT);
    expect(videoPlayerFeature.choice?.options.map((o) => o.value)).toEqual([
      VIDEO_SIZE_FIT_HEIGHT,
      VIDEO_SIZE_FIT_WIDTH,
      VIDEO_SIZE_ORIGINAL,
    ]);
    expect(videoPlayerFeature.choice?.options.map((o) => o.label)).toEqual([
      "Fit height",
      "Fit width",
      "Original",
    ]);
  });

  it("css targets Fluid wrapper with max-height / aspect-ratio, no !important on width/height", () => {
    const css = videoPlayerFeature.css;
    const fitHeightClass = featureChoiceBodyClass(
      VIDEO_PLAYER_FEATURE_ID,
      VIDEO_SIZE_FIT_HEIGHT,
    );
    const fitWidthClass = featureChoiceBodyClass(
      VIDEO_PLAYER_FEATURE_ID,
      VIDEO_SIZE_FIT_WIDTH,
    );
    expect(css).toContain(`body.${fitHeightClass} #${FLUID_WRAPPER_ID}`);
    expect(css).toContain("max-height: calc(100vh - var(--rdw-vp-chrome-offset");
    expect(css).toContain(`aspect-ratio: var(${ASPECT_RATIO_CSS_VAR}`);
    expect(css).toContain(`body.${fitWidthClass} #${FLUID_WRAPPER_ID}`);
    expect(css).toContain("max-width: 100%");
    expect(css).not.toMatch(/width\s*:\s*[^;]+!important/);
    expect(css).not.toMatch(/height\s*:\s*[^;]+!important/);
  });
});

describe("videoPlayerFeature mount behavior", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.className = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
    document.body.className = "";
    vi.restoreAllMocks();
  });

  it("applies persisted volume/mute/rate on loadedmetadata path", async () => {
    const { video } = buildPlayerDom();
    const { ctx, writes } = makeCtx({
      volume: 0.4,
      muted: true,
      playbackRate: 1.25,
    });

    videoPlayerFeature.mount(ctx);
    await flushFirstPaint();

    expect(video.volume).toBeCloseTo(0.4);
    expect(video.muted).toBe(true);
    expect(video.playbackRate).toBe(1.25);
    expect(writes.length).toBe(0);
  });

  it("persists volumechange and ratechange into feature state", async () => {
    const { video } = buildPlayerDom();
    const { ctx, writes } = makeCtx({
      volume: 1,
      muted: false,
      playbackRate: 1,
    });

    videoPlayerFeature.mount(ctx);
    await flushFirstPaint();

    video.volume = 0.55;
    video.dispatchEvent(new Event("volumechange"));
    video.playbackRate = 0.75;
    video.dispatchEvent(new Event("ratechange"));

    expect(writes.length).toBeGreaterThanOrEqual(2);
    expect(writes).toContainEqual({
      volume: 0.55,
      muted: false,
      playbackRate: 1,
    });
    expect(writes).toContainEqual({
      volume: 0.55,
      muted: false,
      playbackRate: 0.75,
    });
  });

  it("wheel over player changes volume by 5% and preventDefaults; Shift skips", async () => {
    const { video, wrapper } = buildPlayerDom();
    const { ctx, writes } = makeCtx({
      volume: 0.5,
      muted: false,
      playbackRate: 1,
    });

    videoPlayerFeature.mount(ctx);
    await flushFirstPaint();

    const shiftEvent = new WheelEvent("wheel", {
      deltaY: -100,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    const shiftPrevented = !wrapper.dispatchEvent(shiftEvent);
    expect(shiftPrevented).toBe(false);
    expect(video.volume).toBeCloseTo(0.5);

    const upEvent = new WheelEvent("wheel", {
      deltaY: -100,
      shiftKey: false,
      bubbles: true,
      cancelable: true,
    });
    const upPrevented = !wrapper.dispatchEvent(upEvent);
    expect(upPrevented).toBe(true);
    expect(video.volume).toBeCloseTo(0.5 + VOLUME_WHEEL_STEP);
    expect(writes.length).toBeGreaterThan(0);

    const outside = document.createElement("div");
    document.body.append(outside);
    const outsideEvent = new WheelEvent("wheel", {
      deltaY: -100,
      bubbles: true,
      cancelable: true,
    });
    const volumeBefore = video.volume;
    outside.dispatchEvent(outsideEvent);
    expect(video.volume).toBeCloseTo(volumeBefore);
  });

  it("sets aspect-ratio and chrome-offset CSS vars on the Fluid wrapper", async () => {
    const { wrapper } = buildPlayerDom({
      inlineSize: true,
      videoWidth: 1920,
      videoHeight: 1080,
    });
    const { ctx } = makeCtx();

    videoPlayerFeature.mount(ctx);
    await flushFirstPaint();

    expect(wrapper.style.getPropertyValue(ASPECT_RATIO_CSS_VAR).trim()).toBe(
      "1920 / 1080",
    );
    const chrome = wrapper.style.getPropertyValue(CHROME_OFFSET_CSS_VAR).trim();
    expect(chrome.endsWith("px")).toBe(true);
    const chromePx = Number.parseFloat(chrome);
    expect(chromePx).toBeGreaterThanOrEqual(48);
  });

  it("does not strip Fluid wrapper class or replace the wrapper element", async () => {
    const { wrapper } = buildPlayerDom({ inlineSize: true });
    const { ctx } = makeCtx();
    const beforeId = wrapper.id;
    const beforeClass = wrapper.className;

    videoPlayerFeature.mount(ctx);
    await flushFirstPaint();

    const after = document.getElementById(FLUID_WRAPPER_ID);
    expect(after).toBe(wrapper);
    expect(after?.id).toBe(beforeId);
    expect(after?.classList.contains(FLUID_WRAPPER_CLASS)).toBe(true);
    expect(after?.className).toBe(beforeClass);
    expect(document.getElementById(VIDEO_ELEMENT_ID)).not.toBeNull();
  });
});
