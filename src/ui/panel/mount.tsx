import { render as preactRender } from "preact";

import { PANEL_ROOT_ID } from "../../config/constants";
import { PanelRoot } from "./panel-root";
import { readPersistedPanelState } from "./persist";
import { buildSizeCssRule } from "./size";
import { PANEL_CSS } from "./styles";

export function mountPanel(target: ParentNode = document.body): void {
  if (document.getElementById(PANEL_ROOT_ID) !== null) {
    return;
  }

  const host = document.createElement("div");
  host.id = PANEL_ROOT_ID;
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = PANEL_CSS;
  const sizeStyle = document.createElement("style");
  const mountPoint = document.createElement("div");
  shadow.append(style, sizeStyle, mountPoint);

  const persisted = readPersistedPanelState();
  sizeStyle.textContent = buildSizeCssRule(persisted.width, persisted.height);

  target.append(host);
  preactRender(<PanelRoot host={host} sizeStyle={sizeStyle} />, mountPoint);
}
