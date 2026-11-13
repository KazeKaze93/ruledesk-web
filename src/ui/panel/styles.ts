import { CSS_CLASS } from "../../config/constants";
import { DARK_PALETTE, LIGHT_PALETTE, tokensToCssDeclarations } from "../tokens";
import { PANEL_UI_CLASS } from "./constants";
import {
  PANEL_DEFAULT_HEIGHT_PX,
  PANEL_DEFAULT_WIDTH_PX,
  PANEL_MAX_HEIGHT_CSS,
  PANEL_MAX_WIDTH_CSS,
  PANEL_MIN_HEIGHT_PX,
  PANEL_MIN_WIDTH_PX,
} from "./size";

export const PANEL_CSS = `
:host {
  all: initial;
  ${tokensToCssDeclarations(LIGHT_PALETTE)}
  font-family: var(--rdw-font);
  font-size: 13px;
  line-height: 1.35;
  color: var(--rdw-text);
}

:host(.${PANEL_UI_CLASS.themeDark}) {
  ${tokensToCssDeclarations(DARK_PALETTE)}
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
  border: 1px solid var(--rdw-border);
  border-radius: 999px;
  background: var(--rdw-text);
  color: var(--rdw-surface);
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
}

.${CSS_CLASS.toggle}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}

.${CSS_CLASS.panel} {
  display: none;
  box-sizing: border-box;
  width: ${String(PANEL_DEFAULT_WIDTH_PX)}px;
  height: ${String(PANEL_DEFAULT_HEIGHT_PX)}px;
  min-width: ${String(PANEL_MIN_WIDTH_PX)}px;
  min-height: ${String(PANEL_MIN_HEIGHT_PX)}px;
  max-width: ${PANEL_MAX_WIDTH_CSS};
  max-height: ${PANEL_MAX_HEIGHT_CSS};
  resize: both;
  overflow: hidden;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-2);
  color: var(--rdw-text);
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
  padding: 10px 12px 6px;
  flex-shrink: 0;
}

.${CSS_CLASS.title} {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--rdw-text);
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

.${PANEL_UI_CLASS.footer} {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--rdw-border);
  font-size: 11px;
  color: var(--rdw-muted);
}

.${PANEL_UI_CLASS.resizeHint} {
  color: var(--rdw-muted);
}

.${CSS_CLASS.hidden} {
  display: none !important;
}
`;
