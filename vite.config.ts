import { defineConfig } from "vitest/config";
import monkey from "vite-plugin-monkey";

const USERSCRIPT_RAW_URL =
  "https://raw.githubusercontent.com/KazeKaze93/ruledesk-web/main/dist/ruledesk-web.user.js";

export default defineConfig({
  plugins: [
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: "RuleDesk Web",
        namespace: "https://github.com/kazekaze93/ruledesk-web",
        description:
          "Collections, favorites, artist updates, and page tweaks for rule34.xxx",
        version: "0.6.0",
        match: ["https://rule34.xxx/*"],
        "run-at": "document-idle",
        grant: ["GM_getValue", "GM_setValue"],
        updateURL: USERSCRIPT_RAW_URL,
        downloadURL: USERSCRIPT_RAW_URL,
      },
      build: {
        fileName: "ruledesk-web.user.js",
      },
    }),
  ],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
});
