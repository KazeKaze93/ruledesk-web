import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("post page toggle removal", () => {
  it("removes post-page module and its wiring from main", () => {
    expect(existsSync(resolve(process.cwd(), "src/ui/post-page.ts"))).toBe(
      false,
    );
    expect(existsSync(resolve(process.cwd(), "tests/post-page.test.ts"))).toBe(
      false,
    );

    const mainSource = readFileSync(
      resolve(process.cwd(), "src/main.ts"),
      "utf8",
    );
    expect(mainSource).not.toContain("post-page");
    expect(mainSource).not.toContain("mountPostPageToggle");
  });
});
