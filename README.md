# RuleDesk Web

Userscript for [Tampermonkey](https://www.tampermonkey.net/) / [Violentmonkey](https://violentmonkey.github.io/) on `https://rule34.xxx/*`.

## Install / update

Install or update from the built file on GitHub:

https://raw.githubusercontent.com/KazeKaze93/ruledesk-web/main/dist/ruledesk-web.user.js

Managers that honor `@updateURL` / `@downloadURL` can auto-check that same raw URL.

Local build: `npm install` then `npm run build` → `dist/ruledesk-web.user.js`.

## Own pages (site navbar)

RuleDesk adds items to the site header navbar (`div#header ul#navbar`):

| Menu | Hash / URL | What it is |
|---|---|---|
| **Collections** | `#rdw/collections` | Custom Collection (saved tag searches) and Dynamic Collection (post-id playlists) |
| **Following** | `#rdw/following` | Followed artists; add/remove; empty state links to Posts |
| **Favorites** | site favorites URL | Shown when a favorites user id is known; native My Favorites entry is hidden |
| **RuleDesk** | `#rdw/settings` | Appearance, Page tweaks, Blacklist, Favorites sync, Data backup |

Own pages mount in `#rdw-page-root` (Shadow DOM) after `div#header` and hide the rest of the site until you leave the hash. There is no floating RD panel.

**Collections**

- **Custom Collection:** save the current `page=post&s=list` search when `tags` is non-empty; open / rename / delete
- **Dynamic Collection:** named sets of post ids (`kind: "posts"`); create from Collections or the **+** button on thumbs / post side panel; open as `id:` searches (chunked by **Playlist part size**)

## Favorites

- On the post list grid, a star is anchored to `img.preview` via CSS anchor positioning (hover / focus to reveal; marked stars stay visible); the site’s link/image markup is left intact
- Click toggles favorite: same-origin `addfav` (+ vote on new add) or favorites delete
- Local favorite IDs live in a separate GM key (`ruledesk-web.favs`); legacy `marks.*.fav` is migrated on load
- Favorites page: no DOM changes; IDs are read from Remove links into local favs, and Remove clicks clear the local mark
- Settings → **Show favorite buttons in grid** (`settings.gridFavButtons`, default on)
- Settings → **Favorites sync**: optional full crawl of the site favorites list (add-only; one page every 1.5 s) via Sync / Resume / Stop; a stale lock can auto-resume in another tab

## Artists / Feed

- Follow / unfollow artists from the tag sidebar (`ul#tag-sidebar`) on list and post pages, or add tags on **Following**
- Navbar **Feed** opens a normal site search `( artist1 ~ artist2 )` (optional `id:>N` / group size). With no followed artists, Feed points to `#rdw/following`
- On a full Feed result page, a bar above `div.image-list` can **Mark all seen** (page 1 only, and only when the page has posts newer than `seenPostId`)
- Empty Feed pages (no `image-list`) show “No new posts since #N” with a link to the same search without `id:>`

No `api.rule34.xxx`. Network `fetch` runs only in `favorites.ts` (add/remove on click), `favorites-sync.ts` (explicit Sync / Resume / auto-resume), and `next-page.ts` (infinite scroll page loads).

Storage uses `GM_getValue` / `GM_setValue`.

## Themes (Appearance)

Settings → **Appearance** → **Site theme**:

| Theme | What you get |
|---|---|
| **Site default** | Native rule34 look (`html.rdw-skin` off; site `theme` cookie cleared) |
| **Site dark** | Native site dark CSS (`theme=dark` cookie + `desktop-dark.css`) |
| **Light** / **Dark** | RuleDesk site skin (`html.rdw-skin`) with the matching token palette |
| **Custom** | RuleDesk skin with your accent / bg / surface / text colors; optional background image + dim |

**Restore the native site look:** open **RuleDesk** (`#rdw/settings`) → Appearance → Theme → **Site default**.

Default for new installs is **Light** (RuleDesk skin on).

## Blacklist (site cookie)

Settings → **Blacklist** edits this browser’s `tag_blacklist` cookie (add/remove chips). Changes write immediately; with **Hide blacklisted thumbs** (`blacklist-hide`) enabled, matching thumbs on list pages are hidden without a reload. Account settings on the site are not updated and may overwrite the cookie after login. Export/import and Data backup never include the blacklist cookie.

## Page tweaks (features)

Optional list/post/favorites UI modules. Master switch **Enable page tweaks** in Settings (default on). Each module has its own checkbox or choice control. CSS-only modules apply immediately; other modules and the master tweaks switch reload the page.

| Module id | Label | Default | Pages | What it does |
|---|---|---|---|---|
| `feed` | Feed in site menu | on | all | Adds a Feed menu item; on feed list pages mounts the updates bar and marks new thumbs |
| `menu-cleanup` | Clean header menu | on | all | Hides unused header links |
| `tag-groups` | Collapse tags | on | list, post | Collapse tag sidebar groups (General/Meta by default) |
| `search-tools` | Search tools | on | list, post | Token chips, media/sort/score controls, and save-to-collection under the search form |
| `seen-dim` | Dim seen posts | on | list, post | Marks opened posts; dims them in the grid (also restamps infinite-scroll thumbs) |
| `playlist-menu` | Add to playlist button | on | list, post | **+** on thumbs (list) and playlist menu under Favorite (post side panel) |
| `playlist-bar` | Playlist header | on | list | Name / part links / post count above a playlist `id:` search |
| `blacklist-hide` | Hide blacklisted thumbs | on | list | Hides thumbs matching the site blacklist cookie (no reload) |
| `infinite-scroll` | Infinite scroll | on | list | Loads the next page into the grid; respects site blacklist |
| `post-actions` | Post actions | on | post | Favorite / playlist / Original / Score bar (and Options proxies) on the post page |
| `grid-density` | Grid size | on | list, favorites | compact / default / large / masonry (Appearance) |

**Disable a module:** open **RuleDesk** → Settings → Page → uncheck that module (or change its choice). **Disable all tweaks:** turn off **Enable page tweaks**. Removed in 0.7.0: `search-tokens`, `pager`, `followed-badge`.

## Data backup

Settings → **Data** exports one JSON file `ruledesk-web-backup-<YYYY-MM-DD>.json` with storage, favs, and optional background image. Import supports **Merge** and **Replace**. This is separate from the older collections-only export format below.

Example backup shape (no real data):

```json
{
  "format": "ruledesk-web-backup",
  "version": 1,
  "exportedAt": "2026-11-13T03:30:00.000Z",
  "storage": {
    "version": 1,
    "collections": [],
    "artists": [{ "tag": "example_artist" }],
    "marks": {},
    "settings": {
      "gridFavButtons": true,
      "updatesGroupSize": 0,
      "playlistChunkSize": 40,
      "tweaksEnabled": true,
      "appearance": { "theme": "light" }
    },
    "updates": { "seenPostId": 0 }
  },
  "favs": {
    "version": 1,
    "ids": [101, 202]
  }
}
```

(`background` is an optional string when “Include background image” is on.)

## Legacy export format

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

- Collections without `kind` (or `kind: "search"`) are saved searches (Custom Collection); `kind: "posts"` are Dynamic Collections with `postIds`
- `settings` / `updates` / `favIds` are optional; defaults are `gridFavButtons: true`, `tweaksEnabled: true`, `updatesGroupSize: 0`, `playlistChunkSize: 40`, `seenPostId: 0`
- Import merges collections by `id`, artists by `tag`, marks by post id (including `seen`); legacy `marks.*.fav` becomes fav ids; `seenPostId` keeps the maximum of current and imported
- Runtime fav ids are stored under `ruledesk-web.favs` (not inside the main storage key)
- Blacklist cookie is never part of export/import or Data backup

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server / monkey install helper |
| `npm run build` | Typecheck + emit `dist/ruledesk-web.user.js` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (jsdom) |
