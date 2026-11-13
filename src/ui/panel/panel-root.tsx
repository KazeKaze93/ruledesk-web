import type { JSX } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import {
  APPEARANCE_THEME_DARK,
  APPEARANCE_THEME_SITE_DARK,
  CSS_CLASS,
  EXPORT_FILENAME,
  EXPORT_MIME,
  TOGGLE_BUTTON_ID,
  UI_TEXT,
  USERSCRIPT_VERSION,
} from "../../config/constants";
import { log } from "../../log";
import {
  addArtist,
  exportJson,
  getAppearance,
  importJson,
  load,
  removeArtist,
} from "../../storage/store";
import { IconButton, Tabs } from "../kit";
import { IconX } from "../kit/icons";
import { ArtistsTab, type PendingUnfollow } from "./artists-tab";
import { BlacklistSection } from "./blacklist-section";
import { CollectionsTab } from "./collections-tab";
import {
  isPanelTab,
  PANEL_TAB_LABELS,
  PANEL_TABS,
  PANEL_UI_CLASS,
  RESIZE_HINT,
  type PanelTab,
  UNFOLLOW_UNDO_MS,
} from "./constants";
import { FavoritesTab, readInitialGridFavEnabled } from "./favorites-tab";
import {
  readPersistedPanelState,
  writePersistedPanelState,
} from "./persist";
import { SettingsTab } from "./settings-tab";
import {
  buildSizeCssRule,
  measureBorderBoxSize,
  PANEL_MIN_HEIGHT_PX,
  PANEL_MIN_WIDTH_PX,
  SIZE_PERSIST_MS,
  sizesEqual,
  type PanelSize,
  clampSize,
} from "./size";

export type PanelRootProps = {
  readonly host: HTMLElement;
  readonly sizeStyle: HTMLStyleElement;
};

function isDarkTheme(): boolean {
  const theme = getAppearance().theme;
  return (
    theme === APPEARANCE_THEME_DARK || theme === APPEARANCE_THEME_SITE_DARK
  );
}

const TAB_ITEMS = PANEL_TABS.map((id) => ({
  id,
  label: PANEL_TAB_LABELS[id],
}));

export function PanelRoot(props: PanelRootProps): JSX.Element {
  const initial = readPersistedPanelState();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>(initial.tab);
  const [importError, setImportError] = useState("");
  const [artistFilter, setArtistFilter] = useState("");
  const [pendingUnfollows, setPendingUnfollows] = useState<PendingUnfollow[]>(
    [],
  );
  const [gridFavEnabled, setGridFavEnabled] = useState(
    readInitialGridFavEnabled,
  );
  const [artistsVersion, setArtistsVersion] = useState(0);
  const [themeDark, setThemeDark] = useState(isDarkTheme);

  const panelRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastWrittenRef = useRef<PanelSize>({
    width: initial.width,
    height: initial.height,
  });
  const sizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(pendingUnfollows);
  pendingRef.current = pendingUnfollows;

  useEffect(() => {
    props.host.classList.toggle(PANEL_UI_CLASS.themeDark, themeDark);
  }, [props.host, themeDark]);

  useEffect(() => {
    const syncTheme = (): void => {
      setThemeDark(isDarkTheme());
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-rdw-theme"],
    });
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    props.sizeStyle.textContent = buildSizeCssRule(
      lastWrittenRef.current.width,
      lastWrittenRef.current.height,
    );
  }, [props.sizeStyle]);

  useEffect(() => {
    const panel = panelRef.current;
    if (panel === null || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      if (!open) {
        return;
      }
      const entry = entries[0];
      if (entry === undefined) {
        return;
      }
      const measured = measureBorderBoxSize(entry, panel);
      if (measured === null) {
        return;
      }
      if (sizesEqual(measured, lastWrittenRef.current)) {
        return;
      }
      if (sizeTimerRef.current !== null) {
        clearTimeout(sizeTimerRef.current);
      }
      sizeTimerRef.current = setTimeout(() => {
        sizeTimerRef.current = null;
        const nextWidth = clampSize(measured.width, PANEL_MIN_WIDTH_PX);
        const nextHeight = clampSize(measured.height, PANEL_MIN_HEIGHT_PX);
        const next = { width: nextWidth, height: nextHeight };
        if (sizesEqual(next, lastWrittenRef.current)) {
          return;
        }
        if (nextWidth === 0 || nextHeight === 0) {
          return;
        }
        lastWrittenRef.current = next;
        writePersistedPanelState({
          tab: activeTab,
          width: nextWidth,
          height: nextHeight,
        });
        props.sizeStyle.textContent = buildSizeCssRule(nextWidth, nextHeight);
      }, SIZE_PERSIST_MS);
    });
    observer.observe(panel);
    return () => {
      observer.disconnect();
      if (sizeTimerRef.current !== null) {
        clearTimeout(sizeTimerRef.current);
      }
    };
  }, [open, activeTab, props.sizeStyle]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent): void => {
      if (!open) {
        return;
      }
      const path = event.composedPath();
      if (path.includes(props.host)) {
        return;
      }
      const shadow = props.host.shadowRoot;
      const target = event.target;
      if (
        target instanceof Node &&
        (props.host === target ||
          props.host.contains(target) ||
          (shadow !== null && shadow.contains(target)))
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("click", onDocClick, true);
    return () => {
      document.removeEventListener("click", onDocClick, true);
    };
  }, [open, props.host]);

  useEffect(() => {
    const shadow = props.host.shadowRoot;
    if (shadow === null) {
      return;
    }
    const onKeyDown = (event: Event): void => {
      if (!(event instanceof KeyboardEvent)) {
        return;
      }
      if (event.key === "Escape" && open) {
        event.stopPropagation();
        setOpen(false);
      }
    };
    shadow.addEventListener("keydown", onKeyDown);
    return () => {
      shadow.removeEventListener("keydown", onKeyDown);
    };
  }, [open, props.host]);

  const clearPendingUnfollow = (tag: string): void => {
    setPendingUnfollows((current) => {
      const index = current.findIndex((entry) => entry.tag === tag);
      if (index < 0) {
        return current;
      }
      const removed = current[index];
      if (removed !== undefined) {
        clearTimeout(removed.timer);
      }
      return [...current.slice(0, index), ...current.slice(index + 1)];
    });
  };

  const selectTab = (tab: PanelTab): void => {
    setActiveTab(tab);
    writePersistedPanelState({
      tab,
      width: lastWrittenRef.current.width,
      height: lastWrittenRef.current.height,
    });
  };

  const downloadExport = (): void => {
    const payload = exportJson();
    const blob = new Blob([payload], { type: EXPORT_MIME });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = EXPORT_FILENAME;
    anchor.rel = "noopener";
    props.host.shadowRoot?.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const data = load();
  void artistsVersion;

  return (
    <div className={CSS_CLASS.host}>
      <section
        ref={panelRef}
        id="ruledesk-web-panel"
        className={`${CSS_CLASS.panel}${open ? ` ${CSS_CLASS.panelOpen}` : ""}`}
        role="dialog"
        aria-modal="false"
        aria-label={UI_TEXT.panelTitle}
        hidden={!open}
      >
        <div className={CSS_CLASS.header}>
          <h2 className={CSS_CLASS.title}>{UI_TEXT.panelTitle}</h2>
          <IconButton
            label={UI_TEXT.toggleClose}
            onClick={() => {
              setOpen(false);
            }}
          >
            <IconX size={14} />
          </IconButton>
        </div>

        <Tabs
          items={TAB_ITEMS}
          value={activeTab}
          aria-label={UI_TEXT.panelTitle}
          onChange={(id) => {
            if (isPanelTab(id)) {
              selectTab(id);
            }
          }}
        />

        <div className={CSS_CLASS.body}>
          {PANEL_TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <div
                key={tab}
                className={PANEL_UI_CLASS.tabPanel}
                id={`rdw-tabpanel-${tab}`}
                role="tabpanel"
                aria-labelledby={`rdw-tab-${tab}`}
                hidden={!isActive}
              >
                {tab === "collections" && isActive ? (
                  <CollectionsTab />
                ) : null}
                {tab === "artists" && isActive ? (
                  <ArtistsTab
                    artists={data.artists}
                    pending={pendingUnfollows}
                    filter={artistFilter}
                    onFilterChange={setArtistFilter}
                    onUnfollow={(tag) => {
                      const existing = pendingRef.current.find(
                        (entry) => entry.tag === tag,
                      );
                      if (existing !== undefined) {
                        clearTimeout(existing.timer);
                      }
                      removeArtist(tag);
                      const timer = setTimeout(() => {
                        clearPendingUnfollow(tag);
                        setArtistsVersion((value) => value + 1);
                      }, UNFOLLOW_UNDO_MS);
                      setPendingUnfollows([
                        ...pendingRef.current.filter(
                          (entry) => entry.tag !== tag,
                        ),
                        { tag, timer },
                      ]);
                      setArtistsVersion((value) => value + 1);
                    }}
                    onUndo={(tag) => {
                      clearPendingUnfollow(tag);
                      try {
                        addArtist(tag);
                      } catch (error) {
                        log.warn("Undo unfollow failed", error);
                      }
                      setArtistsVersion((value) => value + 1);
                    }}
                  />
                ) : null}
                {tab === "favorites" && isActive ? (
                  <FavoritesTab
                    gridFavEnabled={gridFavEnabled}
                    onGridFavChange={setGridFavEnabled}
                  />
                ) : null}
                {tab === "settings" && isActive ? (
                  <SettingsTab
                    importError={importError}
                    onExport={downloadExport}
                    onImport={() => {
                      setImportError("");
                      const input = fileInputRef.current;
                      if (input !== null) {
                        input.value = "";
                        input.click();
                      }
                    }}
                  />
                ) : null}
                {tab === "blacklist" && isActive ? (
                  <div className={PANEL_UI_CLASS.scrollRegion}>
                    <BlacklistSection />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className={PANEL_UI_CLASS.footer}>
          <span>{`v${USERSCRIPT_VERSION}`}</span>
          <span className={PANEL_UI_CLASS.resizeHint}>{RESIZE_HINT}</span>
        </div>
      </section>

      <button
        type="button"
        id={TOGGLE_BUTTON_ID}
        className={CSS_CLASS.toggle}
        aria-label={open ? UI_TEXT.toggleClose : UI_TEXT.toggleOpen}
        aria-expanded={open}
        aria-controls="ruledesk-web-panel"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) {
            setThemeDark(isDarkTheme());
          } else {
            setImportError("");
          }
        }}
      >
        RD
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className={CSS_CLASS.hidden}
        aria-hidden="true"
        tabIndex={-1}
        onChange={() => {
          const file = fileInputRef.current?.files?.item(0);
          if (file === null || file === undefined) {
            return;
          }
          const reader = new FileReader();
          reader.addEventListener("load", () => {
            try {
              const text =
                typeof reader.result === "string" ? reader.result : "";
              importJson(text);
              setImportError("");
              setArtistsVersion((value) => value + 1);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Unknown import error";
              setImportError(message);
              log.warn("Import failed", message);
            }
          });
          reader.addEventListener("error", () => {
            setImportError("Could not read file");
          });
          reader.readAsText(file);
        }}
      />
    </div>
  );
}
