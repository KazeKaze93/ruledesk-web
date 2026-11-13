# RuleDesk Web

Userscript for [Tampermonkey](https://www.tampermonkey.net/) / [Violentmonkey](https://violentmonkey.github.io/) on `https://rule34.xxx/*`.

## Install / update

Install or update from the built file on GitHub:

https://raw.githubusercontent.com/KazeKaze93/ruledesk-web/main/dist/ruledesk-web.user.js

Managers that honor `@updateURL` / `@downloadURL` can auto-check that same raw URL.

Local build: `npm install` then `npm run build` → `dist/ruledesk-web.user.js`.

## Stage 1 — collections & playlists

- Floating toggle (bottom-right) opens a Shadow DOM panel
- **Saved searches:** save the current `page=post&s=list` search when `tags` is non-empty; open / rename / delete
- **Playlists:** named sets of post ids (`kind: "posts"`); create from the Collections tab or the **+** button on thumbs / post side panel; open as `id:` searches (chunked by **Playlist part size**)
- Export and import JSON via the panel (playlists travel with collections; blacklist does not)

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

No `api.rule34.xxx`. Network `fetch` runs only in `favorites.ts` (add/remove on click), `favorites-sync.ts` (explicit Sync / Resume), and `next-page.ts` (infinite scroll page loads).

Storage uses `GM_getValue` / `GM_setValue`.

## Themes (Appearance)

Settings → **Appearance** → **Site theme**:

| Theme | What you get |
|---|---|
| **Site default** | Native rule34 look (`html.rdw-skin` off; site `theme` cookie cleared) |
| **Site dark** | Native site dark CSS (`theme=dark` cookie + `desktop-dark.css`) |
| **Light** / **Dark** | RuleDesk site skin (`html.rdw-skin`) with the matching token palette |
| **Custom** | RuleDesk skin with your accent / bg / surface / text colors; optional background image + dim |

**Restore the native site look:** open the panel → Settings → Appearance → Theme → **Site default**.

Default for new installs is **Light** (RuleDesk skin on).

## Blacklist (site cookie)

Settings → **Blacklist** edits this browser’s `tag_blacklist` cookie (add/remove chips). Changes write immediately; reload the page to apply filtering. Account settings on the site are not updated and may overwrite the cookie after login. Export/import never includes the blacklist.

## Stage 4 — page tweaks (features, 0.8.0)

Optional list/post/favorites UI modules. Master switch **Enable page tweaks** in Settings (default on). Each module has its own checkbox or choice control. CSS-only modules (menu cleanup, grid size, dim seen) apply immediately; other modules and the master tweaks switch reload the page.

| Module id | Label | Default | Pages | What it does |
|---|---|---|---|---|
| `feed` | Feed in site menu | on | all | Adds a Feed menu item; on feed list pages mounts the updates bar and outlines new thumbs |
| `menu-cleanup` | Clean header menu | on | all | Hides unused header links |
| `tag-groups` | Collapse tags | on | list, post | Collapse tag sidebar groups (General/Meta by default) |
| `search-tools` | Search tools | on | list, post | Token chips, media/sort/score controls, and save-to-collection under the search form (playlists in a separate optgroup) |
| `seen-dim` | Dim seen posts | on | list, post | Marks opened posts; dims them in the grid (also restamps infinite-scroll thumbs) |
| `playlist-menu` | Add to playlist button | on | list, post | **+** on thumbs (list) and playlist menu under Favorite (post side panel) |
| `playlist-bar` | Playlist header | on | list | Name / part links / post count above a playlist `id:` search |
| `infinite-scroll` | Infinite scroll | on | list | Loads the next page into the grid; respects site blacklist |
| `post-actions` | Post actions | on | post | Favorite / playlist / Original / Score bar (and Options proxies) on the post page |
| `grid-density` | Grid size | on | list, favorites | compact / default / large / masonry |

**Disable a module:** open the panel → Settings → uncheck that module (or change its choice). **Disable all tweaks:** turn off **Enable page tweaks**. Removed in 0.7.0: `search-tokens`, `pager`, `followed-badge`.

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
    },
    {
      "id": "uuid-2",
      "name": "Watch later",
      "kind": "posts",
      "tags": [],
      "postIds": [12345, 67890]
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
    "playlistChunkSize": 40,
    "features": { "menu-cleanup": true },
    "featureChoice": { "grid-density": "default" },
    "featureState": {}
  },
  "updates": {
    "seenPostId": 0
  }
}
```

- Collections without `kind` (or `kind: "search"`) are saved searches; `kind: "posts"` are playlists with `postIds`
- `settings` / `updates` / `favIds` are optional; defaults are `gridFavButtons: true`, `tweaksEnabled: true`, `updatesGroupSize: 0`, `playlistChunkSize: 40`, `seenPostId: 0`
- Import merges collections by `id`, artists by `tag`, marks by post id (including `seen`); legacy `marks.*.fav` becomes fav ids; `seenPostId` keeps the maximum of current and imported
- Runtime fav ids are stored under `ruledesk-web.favs` (not inside the main storage key)
- Blacklist is never part of export/import

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server / monkey install helper |
| `npm run build` | Typecheck + emit `dist/ruledesk-web.user.js` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (jsdom) |
