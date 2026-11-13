import { CSS_CLASS } from "../config/constants";
import { PANEL_UI_CLASS } from "./constants";

/**
 * Shared layout CSS for own-page section content (lists, settings rows, artists).
 * Injected once from the page host shadow root.
 */
export const PAGE_CONTENT_CSS = `
.${PANEL_UI_CLASS.pageCard} {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}
.${PANEL_UI_CLASS.scrollRegion} {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.${CSS_CLASS.section} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${PANEL_UI_CLASS.settingsGroup} {
  display: grid;
  gap: 2px;
}
.${PANEL_UI_CLASS.settingsRow} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--rdw-radius-m);
  font-size: 12.5px;
}
.${PANEL_UI_CLASS.settingsRow}:nth-child(even) {
  background: var(--rdw-surface-2);
}
.${PANEL_UI_CLASS.settingsRow} .rdw-switch-row {
  width: 100%;
  justify-content: space-between;
  flex-direction: row-reverse;
}
.${PANEL_UI_CLASS.settingsRow} .rdw-select,
.${PANEL_UI_CLASS.settingsRow} .rdw-num {
  width: 100%;
}
.${PANEL_UI_CLASS.artistMeta} {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
}
.${PANEL_UI_CLASS.artistRow} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 6px;
  border-radius: var(--rdw-radius-s);
}
.${PANEL_UI_CLASS.artistRow}:hover {
  background: var(--rdw-surface-2);
}
.${PANEL_UI_CLASS.artistLink} {
  color: var(--rdw-accent);
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
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
.${PANEL_UI_CLASS.artistUndo} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  font-size: 12px;
  color: var(--rdw-muted);
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
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
}
.${CSS_CLASS.itemName} {
  border: 0;
  background: transparent;
  color: var(--rdw-accent);
  text-align: left;
  cursor: pointer;
  padding: 0;
  font: inherit;
  font-weight: 600;
  word-break: break-word;
}
.${CSS_CLASS.itemName}:disabled {
  color: var(--rdw-muted);
  cursor: not-allowed;
}
.${CSS_CLASS.itemActions},
.${CSS_CLASS.formActions},
.${CSS_CLASS.toolbar},
.${CSS_CLASS.confirmRow} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.${CSS_CLASS.form} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${CSS_CLASS.hint} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${CSS_CLASS.error} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: 12px;
}
`.trim();
