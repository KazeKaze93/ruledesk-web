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

- On the post list grid, a star is anchored to `img.preview` via CSS anchor positioning (hover / focus to reveal; marked stars stay visible); the site’s link/image markup is left intact
- Click toggles favorite: same-origin `addfav` (+ vote on new add) or favorites delete
- Favorites page: no DOM changes; IDs are read from Remove links into local `marks`, and Remove clicks clear the mark
- Panel setting **Show favorite buttons in grid** (`settings.gridFavButtons`, default on)

## Stage 3 — artists / Updates

- Follow / unfollow artists from the tag sidebar (`ul#tag-sidebar`) on list and post pages
- Panel **Artists** section: add/remove, open Updates search groups, set artists-per-search, see last seen post
- **Updates** is a normal site search: `( artist1 ~ artist2 ) id:>N` (no background polling)
- On a full Updates result page, a bar above `div.image-list` can **Mark all seen** (page 1 only, and only when the page has posts newer than `seenPostId`)
- Empty Updates pages (no `image-list`) show “No new posts since #N” with a link to the same search without `id:>`

No `api.rule34.xxx`. The only `fetch` calls are favorite add/remove on user click.

Storage uses `GM_getValue` / `GM_setValue`.

## Stage 4 — page tweaks (features)

Optional list/post/favorites UI modules. Master switch **Enable page tweaks** in Settings (default on). Each module has its own checkbox; some have a choice (e.g. grid size). Changes apply after reload.

| Module | Default | Pages | What it does |
|---|---|---|---|
| Top bar | on | list, post, favorites | Fixed search / collections / Updates bar |
| Top pagination | on | list | Compact pager + ←/→ keys |
| Clean header menu | on | all | Hides unused header links |
| Collapsible tag groups | on | list, post | Collapse tag sidebar groups |
| Following badge | on | list | Badge on thumbs with followed artists |
| Dim seen posts | on | list, post | Marks opened posts; dims them in the grid |
| Grid size | on | list, favorites | compact / default / large |
| Dark theme | **off** | all | Site-wide dark CSS |

Turn a module off in Settings, or disable **Enable page tweaks** to unload all of them.

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
  "artists": [{ "tag": "nyx_x" }],
  "marks": {
    "12345": { "fav": true }
  },
  "settings": {
    "gridFavButtons": true,
    "tweaksEnabled": true,
    "updatesGroupSize": 0,
    "features": { "dark-theme": false },
    "featureChoice": { "grid-density": "default" },
    "featureState": {}
  },
  "updates": {
    "seenPostId": 0
  }
}
```

- `settings` / `updates` are optional; defaults are `gridFavButtons: true`, `tweaksEnabled: true`, `updatesGroupSize: 0`, `seenPostId: 0`
- Import merges collections by `id`, artists by `tag`, marks by post id (including `seen`); `seenPostId` keeps the maximum of current and imported

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server / monkey install helper |
| `npm run build` | Typecheck + emit `dist/ruledesk-web.user.js` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (jsdom) |
