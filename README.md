# RuleDesk Web

Userscript for [Tampermonkey](https://www.tampermonkey.net/) / [Violentmonkey](https://violentmonkey.github.io/) on `https://rule34.xxx/*`.

Stage 1 adds **collections**: named saved tag searches (include / exclude). There is no site API usage and no network requests from the script — opening a collection navigates to a normal search URL.

## Install

1. Build: `npm install` then `npm run build`
2. Open the userscript manager → Create a new script / Install from file
3. Use the built file: `dist/ruledesk-web.user.js`

For development with live reload: `npm run dev` (vite-plugin-monkey).

## Stage 1 features

- Floating toggle button (bottom-right) opens a Shadow DOM panel
- Save the current `page=post&s=list` search when `tags` is non-empty
- Open / rename / delete collections (delete asks for confirmation inside the panel)
- Export and import collections as JSON via the panel

Storage uses only `GM_getValue` / `GM_setValue`.

## Export format

One JSON object:

```json
{
  "version": 1,
  "collections": [
    {
      "id": "uuid",
      "name": "My search",
      "tags": [
        { "tag": "cat", "type": "include" },
        { "tag": "dog", "type": "exclude" }
      ]
    }
  ],
  "artists": [],
  "marks": {}
}
```

- `artists` and `marks` are reserved for later stages
- Import merges collections by `id` (incoming wins). Duplicate names are allowed.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server / monkey install helper |
| `npm run build` | Typecheck + emit `dist/ruledesk-web.user.js` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (jsdom) |
