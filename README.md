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
- Local favorite IDs live in a separate GM key (`ruledesk-web.favs`); legacy `marks.*.fav` is migrated on load
- Favorites page: no DOM changes; IDs are read from Remove links into local favs, and Remove clicks clear the local mark
- Panel setting **Show favorite buttons in grid** (`settings.gridFavButtons`, default on)
- Panel **Favorites sync**: optional full crawl of the site favorites list (add-only; one page every 1.5 s) via Sync / Resume / Stop

## Stage 3 — artists / Updates

- Follow / unfollow artists from the tag sidebar (`ul#tag-sidebar`) on list and post pages
- Panel **Artists** section: add/remove, open Updates search groups, set artists-per-search, see last seen post
- **Updates** is a normal site search: `( artist1 ~ artist2 ) id:>N` (no background polling)
- On a full Updates result page, a bar above `div.image-list` can **Mark all seen** (page 1 only, and only when the page has posts newer than `seenPostId`)
- Empty Updates pages (no `image-list`) show “No new posts since #N” with a link to the same search without `id:>`

No `api.rule34.xxx`. Network `fetch` runs only in `favorites.ts` (add/remove on click) and `favorites-sync.ts` (explicit Sync / Resume).

Storage uses `GM_getValue` / `GM_setValue`.

## Dark theme (site)

Panel setting **Dark theme (site)** toggles the site’s own `theme` cookie (`dark` vs absent) and swaps `css/desktop.css` ↔ `css/desktop-dark.css`. The script does not inject its own dark CSS.

## Stage 4 — page tweaks (features)

Optional list/post/favorites UI modules. Master switch **Enable page tweaks** in Settings (default on). Each module has its own checkbox; some have a choice (e.g. grid size). CSS-only modules (menu cleanup, grid size, dim seen) apply immediately; other modules and the master tweaks switch reload the page.

| Module | Default | Pages | What it does |
|---|---|---|---|
| Top pagination | on | list | Compact pager above the image list + ←/→ keys |
| Clean header menu | on | all | Hides unused header links |
| Collapse General and Meta tags | on | list, post | Collapse tag sidebar groups (General/Meta by default) |
| Show search tags as a list under the search field | on | list, post | Token chips under the site search form |
| Following badge | on | list | ✓ circle on thumbs with followed artists (skips artists already in the current include search) |
| Dim seen posts | on | list, post | Marks opened posts; dims them in the grid |
| Post actions | on | post | Favorite / Follow / Original / Score bar above the post sidebar |
| Grid size | on | list, favorites | compact / default / large |

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
    "12345": { "seen": true }
  },
  "favIds": [12345, 67890],
  "settings": {
    "gridFavButtons": true,
    "tweaksEnabled": true,
    "updatesGroupSize": 0,
    "features": { "pager": true },
    "featureChoice": { "grid-density": "default" },
    "featureState": {}
  },
  "updates": {
    "seenPostId": 0
  }
}
```

- `settings` / `updates` / `favIds` are optional; defaults are `gridFavButtons: true`, `tweaksEnabled: true`, `updatesGroupSize: 0`, `seenPostId: 0`
- Import merges collections by `id`, artists by `tag`, marks by post id (including `seen`); legacy `marks.*.fav` becomes fav ids; `seenPostId` keeps the maximum of current and imported
- Runtime fav ids are stored under `ruledesk-web.favs` (not inside the main storage key)

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server / monkey install helper |
| `npm run build` | Typecheck + emit `dist/ruledesk-web.user.js` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (jsdom) |
