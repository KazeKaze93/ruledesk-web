import { describe, expect, it } from "vitest";

import {
  THUMB_IMAGE_HOST,
  VIDEO_CDN_ORIGIN,
  buildVideoUrlFromThumbUrl,
} from "../../src/site/thumb";

const SAMPLE_DIR = "4227";
const SAMPLE_HASH = "a1b2c3d4e5f6";
const SAMPLE_ID = "987654";

const SAMPLE_THUMB_URL =
  `https://${THUMB_IMAGE_HOST}/thumbnails/${SAMPLE_DIR}/thumbnail_${SAMPLE_HASH}.jpg?${SAMPLE_ID}`;
const SAMPLE_VIDEO_URL =
  `${VIDEO_CDN_ORIGIN}//images/${SAMPLE_DIR}/${SAMPLE_HASH}.mp4?${SAMPLE_ID}`;

describe("buildVideoUrlFromThumbUrl", () => {
  it("maps wimg thumbnail URL to ws-cdn-video mp4 with double-slash path", () => {
    expect(buildVideoUrlFromThumbUrl(SAMPLE_THUMB_URL)).toBe(SAMPLE_VIDEO_URL);
  });

  it("preserves empty query when thumb has none", () => {
    const thumb =
      `https://${THUMB_IMAGE_HOST}/thumbnails/${SAMPLE_DIR}/thumbnail_${SAMPLE_HASH}.jpg`;
    expect(buildVideoUrlFromThumbUrl(thumb)).toBe(
      `${VIDEO_CDN_ORIGIN}//images/${SAMPLE_DIR}/${SAMPLE_HASH}.mp4`,
    );
  });

  it("accepts uppercase .JPG extension in path", () => {
    const thumb =
      `https://${THUMB_IMAGE_HOST}/thumbnails/${SAMPLE_DIR}/thumbnail_${SAMPLE_HASH}.JPG?1`;
    expect(buildVideoUrlFromThumbUrl(thumb)).toBe(
      `${VIDEO_CDN_ORIGIN}//images/${SAMPLE_DIR}/${SAMPLE_HASH}.mp4?1`,
    );
  });

  it("returns null for unparseable input", () => {
    expect(buildVideoUrlFromThumbUrl("")).toBeNull();
    expect(buildVideoUrlFromThumbUrl("not-a-url")).toBeNull();
    expect(
      buildVideoUrlFromThumbUrl(
        `https://example.com/thumbnails/${SAMPLE_DIR}/thumbnail_${SAMPLE_HASH}.jpg`,
      ),
    ).toBeNull();
    expect(
      buildVideoUrlFromThumbUrl(
        `https://${THUMB_IMAGE_HOST}/images/${SAMPLE_DIR}/${SAMPLE_HASH}.jpg`,
      ),
    ).toBeNull();
    expect(
      buildVideoUrlFromThumbUrl(
        `https://${THUMB_IMAGE_HOST}/thumbnails/${SAMPLE_DIR}/${SAMPLE_HASH}.jpg`,
      ),
    ).toBeNull();
    expect(
      buildVideoUrlFromThumbUrl(
        `https://${THUMB_IMAGE_HOST}/thumbnails/${SAMPLE_DIR}/thumbnail_${SAMPLE_HASH}.png`,
      ),
    ).toBeNull();
  });
});
