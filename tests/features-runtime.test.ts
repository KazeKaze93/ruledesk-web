import * as z from "zod/mini";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEBUG_KEY, STORAGE_KEY } from "../src/config/constants";
import { FEATURES } from "../src/features/registry";
import {
  getFeatureChoice,
  isFeatureEnabled,
  runFeatures,
} from "../src/features/runtime";
import type { Feature } from "../src/features/types";
import {
  featureBodyClass,
  featureChoiceBodyClass,
} from "../src/features/types";
import { clearFavsCache, isFav } from "../src/storage/favs";
import { createDefaultStorage } from "../src/storage/schema";
import {
  load,
  save,
  setFeatureChoiceValue,
  setFeatureEnabled,
  setFeatureState,
  setPostSeenMark,
  setTweaksEnabled,
} from "../src/storage/store";

const memory = new Map<string, unknown>();

function installGmMocks(): void {
  memory.clear();
  clearFavsCache();
  vi.stubGlobal(
    "GM_getValue",
    (key: string, defaultValue?: unknown): unknown => {
      if (!memory.has(key)) {
        return defaultValue;
      }
      return memory.get(key);
    },
  );
  vi.stubGlobal("GM_setValue", (key: string, value: unknown): void => {
    memory.set(key, value);
  });
}

function clearFeatures(): void {
  FEATURES.length = 0;
}

function makeFeature(
  partial: Pick<Feature, "id" | "pages"> &
    Partial<Omit<Feature, "id" | "pages">> & {
      mountImpl?: Feature["mount"];
    },
): Feature {
  const mountImpl = partial.mountImpl;
  return {
    id: partial.id,
    label: partial.label ?? partial.id,
    pages: partial.pages,
    defaultEnabled: partial.defaultEnabled ?? true,
    css: partial.css ?? `body.${featureBodyClass(partial.id)} { color: red; }`,
    ...(partial.choice !== undefined ? { choice: partial.choice } : {}),
    mount: (ctx) => {
      if (mountImpl !== undefined) {
        mountImpl(ctx);
      }
    },
  };
}

describe("features runtime", () => {
  beforeEach(() => {
    installGmMocks();
    memory.set(DEBUG_KEY, false);
    clearFeatures();
    document.body.replaceChildren();
    document.body.className = "";
    document.head.querySelectorAll("style").forEach((node) => node.remove());
  });

  afterEach(() => {
    clearFeatures();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("mounts enabled features in registry order and skips other pages", () => {
    const order: string[] = [];
    FEATURES.push(
      makeFeature({
        id: "first",
        pages: ["list"],
        mountImpl: () => {
          order.push("first");
        },
      }),
      makeFeature({
        id: "second",
        pages: ["list", "post"],
        mountImpl: () => {
          order.push("second");
        },
      }),
      makeFeature({
        id: "post-only",
        pages: ["post"],
        mountImpl: () => {
          order.push("post-only");
        },
      }),
      makeFeature({
        id: "disabled",
        pages: ["list"],
        defaultEnabled: false,
        mountImpl: () => {
          order.push("disabled");
        },
      }),
    );

    runFeatures("list", "?page=post&s=list");
    expect(order).toEqual(["first", "second"]);
  });

  it("isolates mount exceptions so later features still run", () => {
    const order: string[] = [];
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    FEATURES.push(
      makeFeature({
        id: "boom",
        pages: ["list"],
        mountImpl: () => {
          order.push("boom");
          throw new Error("mount failed");
        },
      }),
      makeFeature({
        id: "ok",
        pages: ["list"],
        mountImpl: () => {
          order.push("ok");
        },
      }),
    );

    runFeatures("list", "?page=post&s=list");
    expect(order).toEqual(["boom", "ok"]);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("adds body classes for feature id and choice value", () => {
    FEATURES.push(
      makeFeature({
        id: "grid-density",
        pages: ["list"],
        choice: {
          options: [
            { value: "compact", label: "Compact" },
            { value: "default", label: "Default" },
            { value: "large", label: "Large" },
          ],
          defaultValue: "default",
        },
      }),
    );

    runFeatures("list", "?page=post&s=list");
    expect(
      document.body.classList.contains(featureBodyClass("grid-density")),
    ).toBe(true);
    expect(
      document.body.classList.contains(
        featureChoiceBodyClass("grid-density", "default"),
      ),
    ).toBe(true);

    setFeatureChoiceValue("grid-density", "compact");
    document.body.className = "";
    runFeatures("list", "?page=post&s=list");
    expect(
      document.body.classList.contains(
        featureChoiceBodyClass("grid-density", "compact"),
      ),
    ).toBe(true);
  });

  it("does not mount when page tweaks are disabled", () => {
    const order: string[] = [];
    FEATURES.push(
      makeFeature({
        id: "x",
        pages: ["list"],
        mountImpl: () => {
          order.push("x");
        },
      }),
    );
    setTweaksEnabled(false);
    runFeatures("list", "?page=post&s=list");
    expect(order).toEqual([]);
    expect(document.body.className).toBe("");
  });

  it("loads old storage without new feature fields", () => {
    memory.set(STORAGE_KEY, {
      version: 1,
      collections: [],
      artists: [],
      marks: { "7": { fav: true } },
    });
    const data = load();
    expect(data.settings).toBeUndefined();
    expect(data.marks["7"]).toBeUndefined();
    expect(isFav(7)).toBe(true);
    expect(isFeatureEnabled("missing")).toBe(false);
  });

  it("validates featureState with zod and keeps defaults", () => {
    const StateSchema = z.object({
      collapsed: z.array(z.string()),
    });
    const DEFAULT_STATE = { collapsed: ["General"] };

    FEATURES.push(
      makeFeature({
        id: "tag-groups",
        pages: ["list"],
        mountImpl: (ctx) => {
          const state = ctx.getState((raw) => {
            const parsed = StateSchema.safeParse(raw);
            return parsed.success ? parsed.data : DEFAULT_STATE;
          });
          expect(state).toEqual(DEFAULT_STATE);
          ctx.setState({ collapsed: ["Meta"] });
        },
      }),
    );

    runFeatures("list", "?page=post&s=list");
    expect(load().settings?.featureState?.["tag-groups"]).toEqual({
      collapsed: ["Meta"],
    });

    setFeatureState("tag-groups", { collapsed: "bad" });
    FEATURES[0] = makeFeature({
      id: "tag-groups",
      pages: ["list"],
      mountImpl: (ctx) => {
        const state = ctx.getState((raw) => {
          const parsed = StateSchema.safeParse(raw);
          return parsed.success ? parsed.data : DEFAULT_STATE;
        });
        expect(state).toEqual(DEFAULT_STATE);
      },
    });
    runFeatures("list", "?page=post&s=list");
  });

  it("respects stored feature enabled flags and choice helpers", () => {
    FEATURES.push(
      makeFeature({
        id: "dark-theme",
        pages: ["list"],
        defaultEnabled: false,
        choice: {
          options: [
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ],
          defaultValue: "a",
        },
      }),
    );

    expect(isFeatureEnabled("dark-theme")).toBe(false);
    expect(getFeatureChoice("dark-theme")).toBe("a");

    setFeatureEnabled("dark-theme", true);
    setFeatureChoiceValue("dark-theme", "b");
    expect(isFeatureEnabled("dark-theme")).toBe(true);
    expect(getFeatureChoice("dark-theme")).toBe("b");
  });

  it("setPostSeenMark writes seen without clearing fav", () => {
    const data = createDefaultStorage();
    data.marks["42"] = { fav: true };
    save(data);
    setPostSeenMark("42");
    expect(isFav(42)).toBe(true);
    expect(load().marks["42"]).toEqual({ seen: true });
  });

  it("injects feature css once", () => {
    FEATURES.push(
      makeFeature({
        id: "once",
        pages: ["list"],
        css: "body.rdw-f-once { outline: 1px solid red; }",
      }),
    );
    runFeatures("list", "?page=post&s=list");
    runFeatures("list", "?page=post&s=list");
    expect(
      document.head.querySelectorAll("#rdw-feature-style-once"),
    ).toHaveLength(1);
  });
});
