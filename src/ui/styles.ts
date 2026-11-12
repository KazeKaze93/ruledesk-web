import { CSS_CLASS } from "../config/constants";

export const PANEL_CSS = `
:host {
  all: initial;
  font-family: Segoe UI, system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: #1a1a1a;
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
  border: 1px solid #444;
  border-radius: 999px;
  background: #111;
  color: #fff;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
}

.${CSS_CLASS.toggle}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}

.${CSS_CLASS.panel} {
  display: none;
  width: min(360px, calc(100vw - 32px));
  max-height: min(70vh, 560px);
  overflow: auto;
  background: #f7f7f7;
  border: 1px solid #333;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
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
  border-bottom: 1px solid #ccc;
  background: #ececec;
  position: sticky;
  top: 0;
}

.${CSS_CLASS.title} {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.${CSS_CLASS.close} {
  border: 1px solid #666;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  min-width: 32px;
  min-height: 32px;
}

.${CSS_CLASS.body} {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
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
  color: #444;
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
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
}

.${CSS_CLASS.itemName} {
  border: 0;
  background: transparent;
  color: #0b57d0;
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
.${CSS_CLASS.input}:focus-visible {
  outline: 2px solid #4c8bf5;
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

.${CSS_CLASS.iconButton},
.${CSS_CLASS.secondaryButton} {
  border: 1px solid #666;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  min-height: 32px;
  padding: 4px 8px;
  font: inherit;
}

.${CSS_CLASS.primaryButton} {
  border: 1px solid #0b57d0;
  background: #0b57d0;
  color: #fff;
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
  border: 1px solid #a12828;
  background: #a12828;
  color: #fff;
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
  color: #333;
}

.${CSS_CLASS.input} {
  border: 1px solid #666;
  border-radius: 4px;
  min-height: 32px;
  padding: 4px 8px;
  font: inherit;
  background: #fff;
}

.${CSS_CLASS.hint} {
  margin: 0;
  color: #555;
  font-size: 12px;
}

.${CSS_CLASS.error} {
  margin: 0;
  color: #a12828;
  font-size: 12px;
}

.${CSS_CLASS.hidden} {
  display: none !important;
}
`;
