import { render as preactRender } from "preact";
import type { ComponentChild, JSX } from "preact";

import {
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_SITE_DARK,
} from "../config/constants";
import { getAppearance } from "../storage/store";
import {
  DARK_PALETTE,
  LIGHT_PALETTE,
  tokensToCssDeclarations,
} from "../ui/tokens";
import { CollectionsPage } from "./collections-page";
import {
  MENU_LABEL,
  PAGE_CONTENT_MAX_WIDTH_PX,
  RDW_PAGE_ROOT_ID,
  RDW_ROUTE_COLLECTIONS,
  RDW_ROUTE_FOLLOWING,
  RDW_ROUTE_SETTINGS,
  type RdwRoute,
} from "./constants";
import { FollowingPage } from "./following-page";
import { PAGE_CONTENT_CSS } from "./page-css";
import { SettingsPage } from "./settings-page";

const THEME_DARK_CLASS = "rdw-theme-dark";
const PAGE_SHELL_CLASS = "rdw-page-shell";
const PAGE_TITLE_CLASS = "rdw-page-title";

const PAGE_HOST_CSS = `
:host {
  all: initial;
  ${tokensToCssDeclarations(LIGHT_PALETTE)}
  font-family: var(--rdw-font);
  font-size: 13px;
  line-height: 1.35;
  color: var(--rdw-text);
}
:host(.${THEME_DARK_CLASS}) {
  ${tokensToCssDeclarations(DARK_PALETTE)}
}
.${PAGE_SHELL_CLASS} {
  box-sizing: border-box;
  max-width: ${String(PAGE_CONTENT_MAX_WIDTH_PX)}px;
  margin: 0 auto;
  padding: 16px 12px 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.${PAGE_TITLE_CLASS} {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--rdw-text);
}
${PAGE_CONTENT_CSS}
`;

type PageShellProps = {
  readonly title: string;
  readonly children: ComponentChild;
};

function PageShell(props: PageShellProps): JSX.Element {
  return (
    <>
      <style>{PAGE_HOST_CSS}</style>
      <div className={PAGE_SHELL_CLASS}>
        <h1 className={PAGE_TITLE_CLASS}>{props.title}</h1>
        {props.children}
      </div>
    </>
  );
}

function titleForRoute(route: RdwRoute): string {
  if (route === RDW_ROUTE_COLLECTIONS) {
    return MENU_LABEL.collections;
  }
  if (route === RDW_ROUTE_FOLLOWING) {
    return MENU_LABEL.following;
  }
  return MENU_LABEL.settings;
}

function pageForRoute(route: RdwRoute): JSX.Element {
  if (route === RDW_ROUTE_COLLECTIONS) {
    return <CollectionsPage />;
  }
  if (route === RDW_ROUTE_FOLLOWING) {
    return <FollowingPage />;
  }
  return <SettingsPage />;
}

function isDarkTheme(): boolean {
  const theme = getAppearance().theme;
  return (
    theme === APPEARANCE_THEME_DARK || theme === APPEARANCE_THEME_SITE_DARK
  );
}

let hostElement: HTMLElement | null = null;
let mountPoint: HTMLElement | null = null;

function ensureHost(header: HTMLElement): {
  host: HTMLElement;
  mount: HTMLElement;
} {
  if (hostElement !== null && mountPoint !== null) {
    if (hostElement.parentElement !== header.parentElement) {
      header.after(hostElement);
    }
    return { host: hostElement, mount: mountPoint };
  }

  const existing = document.getElementById(RDW_PAGE_ROOT_ID);
  if (existing !== null) {
    existing.remove();
  }

  const host = document.createElement("div");
  host.id = RDW_PAGE_ROOT_ID;
  const shadow = host.attachShadow({ mode: "open" });
  const mount = document.createElement("div");
  shadow.append(mount);
  header.after(host);

  hostElement = host;
  mountPoint = mount;
  return { host, mount };
}

/** Mount Preact page for route into #rdw-page-root after div#header. */
export function showRdwPage(route: RdwRoute, header: HTMLElement): void {
  const { host, mount } = ensureHost(header);
  host.classList.toggle(THEME_DARK_CLASS, isDarkTheme());
  preactRender(
    <PageShell title={titleForRoute(route)}>{pageForRoute(route)}</PageShell>,
    mount,
  );
}

/** Unmount own page and remove #rdw-page-root. */
export function hideRdwPage(): void {
  if (mountPoint !== null) {
    preactRender(null, mountPoint);
  }
  if (hostElement !== null) {
    hostElement.remove();
  }
  hostElement = null;
  mountPoint = null;
  const stray = document.getElementById(RDW_PAGE_ROOT_ID);
  if (stray !== null) {
    stray.remove();
  }
}
