import { CSS_CLASS } from "../config/constants";
import { FAVORITES_SYNC_SECTION_CSS } from "./favorites-sync-section";

/** Panel-local class names (not in shared CSS_CLASS — Phase B5 ownership). */
export const PANEL_UI_CLASS = {
  tabs: "rdw-tabs",
  tab: "rdw-tab",
  tabPanel: "rdw-tab-panel",
  footer: "rdw-footer",
  artistMeta: "rdw-artist-meta",
  artistFilter: "rdw-artist-filter",
  artistList: "rdw-artist-list",
  artistRow: "rdw-artist-row",
  artistLink: "rdw-artist-link",
  artistUndo: "rdw-artist-undo",
  scrollRegion: "rdw-scroll-region",
  themeDark: "rdw-theme-dark",
} as const;

export const PANEL_CSS = `
:host {
  all: initial;
  font-family: Segoe UI, system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  --rdw-fg: #1a1a1a;
  --rdw-fg-muted: #555;
  --rdw-fg-label: #333;
  --rdw-fg-section: #444;
  --rdw-bg: #f7f7f7;
  --rdw-bg-header: #ececec;
  --rdw-bg-item: #fff;
  --rdw-bg-input: #fff;
  --rdw-border: #ccc;
  --rdw-border-strong: #333;
  --rdw-border-control: #666;
  --rdw-link: #0b57d0;
  --rdw-focus: #4c8bf5;
  --rdw-primary: #0b57d0;
  --rdw-primary-fg: #fff;
  --rdw-danger: #a12828;
  --rdw-danger-fg: #fff;
  --rdw-toggle-bg: #111;
  --rdw-toggle-fg: #fff;
  --rdw-shadow: rgba(0, 0, 0, 0.28);
  color: var(--rdw-fg);
}

:host(.${PANEL_UI_CLASS.themeDark}) {
  --rdw-fg: #e8e8e8;
  --rdw-fg-muted: #a8a8a8;
  --rdw-fg-label: #c8c8c8;
  --rdw-fg-section: #b0b0b0;
  --rdw-bg: #1e1e1e;
  --rdw-bg-header: #2a2a2a;
  --rdw-bg-item: #252525;
  --rdw-bg-input: #2a2a2a;
  --rdw-border: #444;
  --rdw-border-strong: #666;
  --rdw-border-control: #777;
  --rdw-link: #7eb0ff;
  --rdw-focus: #4c8bf5;
  --rdw-primary: #3b7ddd;
  --rdw-primary-fg: #fff;
  --rdw-danger: #d9534f;
  --rdw-danger-fg: #fff;
  --rdw-toggle-bg: #2a2a2a;
  --rdw-toggle-fg: #e8e8e8;
  --rdw-shadow: rgba(0, 0, 0, 0.55);
}

.${CSS_CLASS.host} {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483646;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.${CSS_CLASS.toggle} {
  width: 44px;
  height: 44px;
  border: 1px solid var(--rdw-border-strong);
  border-radius: 999px;
  background: var(--rdw-toggle-bg);
  color: var(--rdw-toggle-fg);
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
}

.${CSS_CLASS.toggle}:focus-visible {
  outline: 2px solid var(--rdw-focus);
  outline-offset: 2px;
}

.${CSS_CLASS.panel} {
  display: none;
  box-sizing: border-box;
  width: 360px;
  height: 480px;
  min-width: 320px;
  min-height: 240px;
  max-width: 90vw;
  max-height: 90vh;
  resize: both;
  overflow: hidden;
  background: var(--rdw-bg);
  border: 1px solid var(--rdw-border-strong);
  border-radius: 8px;
  box-shadow: 0 8px 24px var(--rdw-shadow);
  color: var(--rdw-fg);
}

.${CSS_CLASS.panel}.${CSS_CLASS.panelOpen} {
  display: flex;
  flex-direction: column;
}

.${CSS_CLASS.header} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--rdw-border);
  background: var(--rdw-bg-header);
  flex-shrink: 0;
}

.${CSS_CLASS.title} {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--rdw-fg);
}

.${CSS_CLASS.close} {
  border: 1px solid var(--rdw-border-control);
  background: var(--rdw-bg-item);
  border-radius: 4px;
  cursor: pointer;
  min-width: 32px;
  min-height: 32px;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--rdw-fg);
  font-size: 18px;
  line-height: 1;
}

.${PANEL_UI_CLASS.tabs} {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  border-bottom: 1px solid var(--rdw-border);
  background: var(--rdw-bg-header);
  flex-shrink: 0;
  padding: 0 4px;
}

.${PANEL_UI_CLASS.tab} {
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--rdw-fg-muted);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 10px;
  margin-bottom: -1px;
}

.${PANEL_UI_CLASS.tab}[aria-selected="true"] {
  color: var(--rdw-fg);
  border-bottom-color: var(--rdw-primary);
}

.${PANEL_UI_CLASS.tab}:focus-visible {
  outline: 2px solid var(--rdw-focus);
  outline-offset: -2px;
}

.${CSS_CLASS.body} {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.${PANEL_UI_CLASS.tabPanel} {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.${PANEL_UI_CLASS.tabPanel}[hidden] {
  display: none !important;
}

.${PANEL_UI_CLASS.scrollRegion} {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.${CSS_CLASS.section} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.${CSS_CLASS.sectionTitle} {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--rdw-fg-section);
}

.${CSS_CLASS.list} {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.${CSS_CLASS.listItem} {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--rdw-border);
  border-radius: 6px;
  background: var(--rdw-bg-item);
}

.${PANEL_UI_CLASS.artistMeta} {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

.${PANEL_UI_CLASS.artistFilter} {
  flex-shrink: 0;
}

.${PANEL_UI_CLASS.artistList} {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: auto;
  flex: 1 1 auto;
  min-height: 0;
}

.${PANEL_UI_CLASS.artistRow} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 4px;
}

.${PANEL_UI_CLASS.artistRow}:hover {
  background: var(--rdw-bg-header);
}

.${PANEL_UI_CLASS.artistLink} {
  color: var(--rdw-link);
  text-decoration: none;
  font-weight: 600;
  word-break: break-word;
  flex: 1 1 auto;
  min-width: 0;
}

.${PANEL_UI_CLASS.artistLink}:hover {
  text-decoration: underline;
}

.${PANEL_UI_CLASS.artistLink}:focus-visible {
  outline: 2px solid var(--rdw-focus);
  outline-offset: 2px;
}

.${PANEL_UI_CLASS.artistUndo} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  font-size: 12px;
  color: var(--rdw-fg-muted);
}

.${CSS_CLASS.itemName} {
  border: 0;
  background: transparent;
  color: var(--rdw-link);
  text-align: left;
  cursor: pointer;
  padding: 0;
  font: inherit;
  font-weight: 600;
  word-break: break-word;
}

.${CSS_CLASS.itemName}:focus-visible,
.${CSS_CLASS.iconButton}:focus-visible,
.${CSS_CLASS.primaryButton}:focus-visible,
.${CSS_CLASS.secondaryButton}:focus-visible,
.${CSS_CLASS.dangerButton}:focus-visible,
.${CSS_CLASS.close}:focus-visible,
.${CSS_CLASS.input}:focus-visible,
.${CSS_CLASS.checkbox}:focus-visible {
  outline: 2px solid var(--rdw-focus);
  outline-offset: 2px;
}

.${CSS_CLASS.itemActions},
.${CSS_CLASS.formActions},
.${CSS_CLASS.toolbar},
.${CSS_CLASS.confirmRow} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.${CSS_CLASS.checkboxRow} {
  display: flex;
  align-items: center;
  gap: 8px;
}

.${CSS_CLASS.checkbox} {
  width: 16px;
  height: 16px;
  margin: 0;
}

.${CSS_CLASS.iconButton},
.${CSS_CLASS.secondaryButton} {
  border: 1px solid var(--rdw-border-control);
  background: var(--rdw-bg-item);
  color: var(--rdw-fg);
  border-radius: 4px;
  cursor: pointer;
  min-height: 32px;
  padding: 4px 8px;
  font: inherit;
}

.${CSS_CLASS.iconButton} {
  min-width: 28px;
  min-height: 28px;
  padding: 2px 6px;
  line-height: 1;
}

.${CSS_CLASS.primaryButton} {
  border: 1px solid var(--rdw-primary);
  background: var(--rdw-primary);
  color: var(--rdw-primary-fg);
  border-radius: 4px;
  cursor: pointer;
  min-height: 32px;
  padding: 4px 10px;
  font: inherit;
}

.${CSS_CLASS.primaryButton}:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.${CSS_CLASS.dangerButton} {
  border: 1px solid var(--rdw-danger);
  background: var(--rdw-danger);
  color: var(--rdw-danger-fg);
  border-radius: 4px;
  cursor: pointer;
  min-height: 32px;
  padding: 4px 10px;
  font: inherit;
}

.${CSS_CLASS.form},
.${CSS_CLASS.field} {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.${CSS_CLASS.label} {
  font-size: 12px;
  color: var(--rdw-fg-label);
}

.${CSS_CLASS.input} {
  border: 1px solid var(--rdw-border-control);
  border-radius: 4px;
  min-height: 32px;
  padding: 4px 8px;
  font: inherit;
  background: var(--rdw-bg-input);
  color: var(--rdw-fg);
}

.${CSS_CLASS.hint} {
  margin: 0;
  color: var(--rdw-fg-muted);
  font-size: 12px;
}

.${CSS_CLASS.error} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: 12px;
}

.${PANEL_UI_CLASS.footer} {
  flex-shrink: 0;
  padding: 6px 12px;
  border-top: 1px solid var(--rdw-border);
  font-size: 11px;
  color: var(--rdw-fg-muted);
}

.${CSS_CLASS.hidden} {
  display: none !important;
}

${FAVORITES_SYNC_SECTION_CSS}
`;

export const CARD_CSS = `
.${CSS_CLASS.cardFav} {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 5;
  box-sizing: border-box;
  min-width: 28px;
  min-height: 28px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #333;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.92);
  color: #333;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  opacity: 0;
}

@supports (anchor-name: --a) {
  .${CSS_CLASS.cardFav} {
    position-anchor: --rdw-img;
    top: calc(anchor(top) + 4px);
    right: calc(anchor(right) + 4px);
  }
}

.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav},
.${CSS_CLASS.cardFav}:focus-visible {
  opacity: 0.65;
}

.${CSS_CLASS.thumb} .${CSS_CLASS.cardFav}:hover,
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending} {
  opacity: 1;
}

.${CSS_CLASS.cardFav}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked} {
  background: #ffe08a;
  border-color: #a67c00;
  color: #5c4500;
}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError} {
  background: #f8d7da;
  border-color: #a12828;
  color: #a12828;
}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending},
.${CSS_CLASS.cardFav}:disabled {
  cursor: wait;
}

.${CSS_CLASS.thumb}:has(> a[style*="display: none"]) .${CSS_CLASS.cardFav},
.${CSS_CLASS.thumb}:has(> a[style*="display:none"]) .${CSS_CLASS.cardFav} {
  display: none !important;
}

body.${CSS_CLASS.gridFavsHidden} .${CSS_CLASS.cardFav} {
  display: none !important;
}

.${CSS_CLASS.artistFollow} {
  margin-left: 4px;
  box-sizing: border-box;
  min-height: 18px;
  padding: 0 5px;
  border: 1px solid #666;
  border-radius: 3px;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 11px;
  line-height: 1.2;
  vertical-align: middle;
}

.${CSS_CLASS.artistFollow}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}

.${CSS_CLASS.artistFollow}.${CSS_CLASS.artistFollowMarked} {
  background: #ffe08a;
  border-color: #a67c00;
  color: #5c4500;
}

.${CSS_CLASS.updatesBar} {
  margin: 8px 0;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #f7f7f7;
  font-family: Segoe UI, system-ui, sans-serif;
  font-size: 14px;
  color: #1a1a1a;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.hint} {
  margin: 0;
  color: #555;
  font-size: 12px;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.primaryButton} {
  border: 1px solid #0b57d0;
  background: #0b57d0;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  min-height: 32px;
  padding: 4px 10px;
  font: inherit;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.primaryButton}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.itemName} {
  color: #0b57d0;
  font-weight: 600;
  text-decoration: underline;
}

.${CSS_CLASS.updatesBarActions} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
`;
