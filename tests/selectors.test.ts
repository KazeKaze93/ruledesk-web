import { describe, expect, it } from "vitest";

import { extractPostIdFromThumb } from "../src/site/selectors";

describe("extractPostIdFromThumb", () => {
  it("extracts digits after s from span.thumb id", () => {
    const thumb = document.createElement("span");
    thumb.className = "thumb";
    thumb.id = "s12345";
    expect(extractPostIdFromThumb(thumb)).toBe("12345");
  });

  it("returns null when id does not match the template", () => {
    const thumb = document.createElement("span");
    thumb.className = "thumb";
    thumb.id = "thumb-123";
    expect(extractPostIdFromThumb(thumb)).toBeNull();

    thumb.id = "s";
    expect(extractPostIdFromThumb(thumb)).toBeNull();

    thumb.id = "s12a";
    expect(extractPostIdFromThumb(thumb)).toBeNull();
  });
});
