import { render as preactRender } from "preact";
import type { ComponentChildren, VNode } from "preact";
import { act } from "preact/test-utils";

import { buildTokensCss, LIGHT_PALETTE } from "../../src/ui/tokens";

export function renderKit(vnode: VNode | ComponentChildren): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);

  const style = document.createElement("style");
  style.setAttribute("data-rdw-tokens", "1");
  style.textContent = buildTokensCss(LIGHT_PALETTE);
  host.append(style);

  const root = document.createElement("div");
  host.append(root);
  act(() => {
    preactRender(<>{vnode}</>, root);
  });
  return host;
}

export function cleanupKit(host: HTMLElement): void {
  const root = host.lastElementChild;
  if (root instanceof HTMLElement) {
    act(() => {
      preactRender(null, root);
    });
  }
  host.remove();
}

export function fireClick(target: Element): void {
  act(() => {
    target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

export async function flushEffects(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  });
}
