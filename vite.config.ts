import { defineConfig } from "vitest/config";
import monkey from "vite-plugin-monkey";

export default defineConfig({
  plugins: [
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: "RuleDesk Web",
        namespace: "https://github.com/kazekaze93/ruledesk-web",
        description:
          "Named tag search collections for rule34.xxx (local storage only)",
        version: "0.1.0",
        match: ["https://rule34.xxx/*"],
        "run-at": "document-idle",
        grant: ["GM_getValue", "GM_setValue"],
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
