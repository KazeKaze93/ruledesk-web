import { describe, expect, it } from "vitest";

import {
  extractPostIdFromThumb,
  SITE_SELECTORS,
} from "../src/site/selectors";

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

describe("SITE_SELECTORS AI filter / tags heading", () => {
  it("targets the native Filter AI posts checkbox and its li", () => {
    expect(SITE_SELECTORS.filterAiCheckbox).toBe(
      "input.toggleSwitch#chkFilterAI",
    );
    expect(SITE_SELECTORS.filterAiRow).toBe(
      "li:has(> label > span.switch > input.toggleSwitch#chkFilterAI)",
    );

    const li = document.createElement("li");
    const label = document.createElement("label");
    label.append("Filter AI posts");
    const switchSpan = document.createElement("span");
    switchSpan.className = "switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "toggleSwitch";
    input.id = "chkFilterAI";
    const slider = document.createElement("span");
    slider.className = "slider";
    switchSpan.append(input, slider);
    label.append(switchSpan);
    li.append(label);
    document.body.append(li);

    expect(document.querySelector(SITE_SELECTORS.filterAiCheckbox)).toBe(input);
    expect(document.querySelector(SITE_SELECTORS.filterAiRow)).toBe(li);
  });

  it("targets the Tags heading immediately after the search-tools panel", () => {
    expect(SITE_SELECTORS.tagsHeadingAfterSearchTools).toBe(
      "#rdw-search-tools + h5",
    );

    const panel = document.createElement("div");
    panel.id = "rdw-search-tools";
    const heading = document.createElement("h5");
    heading.textContent = "Tags";
    const sidebar = document.createElement("ul");
    sidebar.id = "tag-sidebar";
    document.body.append(panel, heading, sidebar);

    expect(
      document.querySelector(SITE_SELECTORS.tagsHeadingAfterSearchTools),
    ).toBe(heading);
  });
});
