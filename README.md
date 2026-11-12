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
- Open / rename / delete collections (delete confirms inside the panel)
- Export and import JSON via the panel

## Stage 2 — list card favorites

- On `page=post&s=list` only, each `span.thumb` gets a favorite button
- Click runs the same-origin GETs the site uses (`/public/addfav.php`, then vote-up only when newly added)
- Local `marks[postId].fav` remembers which posts were added; marked buttons restore on reload
- No `api.rule34.xxx`, no background or bulk requests

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
  }
}
```

- `artists[].lastSeenPostId` is a non-negative integer (reserved for a later stage)
- Import merges collections by `id` (incoming wins). Duplicate names are allowed.
- Marks merge by post id (incoming object replaces the previous one for that id)

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server / monkey install helper |
| `npm run build` | Typecheck + emit `dist/ruledesk-web.user.js` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (jsdom) |
