# RuleDesk Web

Userscript for [Tampermonkey](https://www.tampermonkey.net/) / [Violentmonkey](https://violentmonkey.github.io/) on `https://rule34.xxx/*`.

## Install / update

Install or update from the built file on GitHub:

https://raw.githubusercontent.com/KazeKaze93/ruledesk-web/main/dist/ruledesk-web.user.js

Managers that honor `@updateURL` / `@downloadURL` can auto-check that same raw URL.

Local build: `npm install` then `npm run build` → `dist/ruledesk-web.user.js`.

## Stage 1 — collections

- Floating toggle (bottom-right) opens a Shadow DOM panel
- Save the current `page=post&s=list` search when `tags` is non-empty
- Open / rename / delete collections (delete asks for confirmation inside the panel)
- Export and import JSON via the panel

## Stage 2 — favorites

- On the post list grid, a star sits on the image corner (hover / focus to reveal; marked stars stay visible)
- Click toggles favorite: same-origin `addfav` (+ vote on new add) or favorites delete
- Post page: toggle in a new `<li>` after the native Add to favorites row (if that link exists)
- Favorites page: no DOM changes; IDs are read from Remove links into local `marks`, and Remove clicks clear the mark
- Panel setting **Show favorite buttons in grid** (`settings.gridFavButtons`, default on)

No `api.rule34.xxx`. Favorite network calls happen only on user click, one post at a time.

Storage uses `GM_getValue` / `GM_setValue`. Favorite clicks use normal `fetch` with `credentials: "same-origin"`.

## Export format

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
  "marks": {
    "12345": { "fav": true }
  },
  "settings": {
    "gridFavButtons": true
  }
}
```

- `settings` is optional; missing means `gridFavButtons: true`
- `artists[].lastSeenPostId` is a non-negative integer (reserved for a later stage)
- Import merges collections by `id` (incoming wins). Duplicate names are allowed.
- Marks merge by post id; settings from the import replace current settings when present

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server / monkey install helper |
| `npm run build` | Typecheck + emit `dist/ruledesk-web.user.js` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (jsdom) |
