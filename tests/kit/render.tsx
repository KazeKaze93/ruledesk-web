import { render as preactRender } from "preact";
import type { ComponentChildren, VNode } from "preact";
import { act } from "preact/test-utils";

import { buildTokensCss, LIGHT_PALETTE } from "../../src/ui/tokens";

export type KitShadowMount = {
  readonly host: HTMLElement;
  readonly shadow: ShadowRoot;
  readonly mount: HTMLElement;
};

function appendTokenStyle(parent: ParentNode): void {
  const style = document.createElement("style");
  style.setAttribute("data-rdw-tokens", "1");
  style.textContent = buildTokensCss(LIGHT_PALETTE);
  parent.append(style);
}

export function renderKit(vnode: VNode | ComponentChildren): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  appendTokenStyle(host);

  const root = document.createElement("div");
  host.append(root);
  act(() => {
    preactRender(<>{vnode}</>, root);
  });
  return host;
}

export function renderKitInShadow(
  vnode: VNode | ComponentChildren,
): KitShadowMount {
  const host = document.createElement("div");
  document.body.append(host);
  const shadow = host.attachShadow({ mode: "open" });
  appendTokenStyle(shadow);

  const mount = document.createElement("div");
  shadow.append(mount);
  act(() => {
    preactRender(<>{vnode}</>, mount);
  });
  return { host, shadow, mount };
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

export function cleanupKitShadow(mount: KitShadowMount): void {
  act(() => {
    preactRender(null, mount.mount);
  });
  mount.host.remove();
}

export function fireClick(target: Element): void {
  act(() => {
    target.dispatchEvent(
      new MouseEvent("click", { bubbles: true, composed: true }),
    );
  });
}

export async function flushEffects(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
  });
}
