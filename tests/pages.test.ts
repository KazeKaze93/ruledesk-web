import { describe, expect, it } from "vitest";

import { detectPageKind, readPostIdFromSearch } from "../src/site/pages";

describe("detectPageKind", () => {
  it("classifies list, post, favorites, and other", () => {
    expect(detectPageKind("?page=post&s=list&tags=cat")).toBe("list");
    expect(detectPageKind("?page=post&s=view&id=12")).toBe("post");
    expect(detectPageKind("?page=favorites&s=view")).toBe("favorites");
    expect(detectPageKind("?page=account&s=home")).toBe("other");
    expect(detectPageKind("")).toBe("other");
  });
});

describe("readPostIdFromSearch", () => {
  it("reads numeric id only on post view pages", () => {
    expect(readPostIdFromSearch("?page=post&s=view&id=42")).toBe("42");
    expect(readPostIdFromSearch("?page=post&s=list&id=42")).toBeNull();
    expect(readPostIdFromSearch("?page=post&s=view&id=abc")).toBeNull();
  });
});
