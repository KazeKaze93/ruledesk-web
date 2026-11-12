import { CSS_CLASS } from "../config/constants";
import { log } from "../log";
import {
  FAVORITES_SYNC_PAGE_PAUSE_MS,
  FAVORITES_SYNC_PID_STEP,
  runFavoritesSync,
  type FavoritesSyncProgress,
  type FavoritesSyncResult,
} from "../site/favorites-sync";
import {
  getSyncState,
  loadFavSet,
} from "../storage/favs";
import type { FavsSyncState } from "../storage/schema";

const SECTION_CLASS = "rdw-favs-sync";
const STATUS_CLASS = "rdw-favs-sync-status";
const PROGRESS_CLASS = "rdw-favs-sync-progress";
const ACTIONS_CLASS = "rdw-favs-sync-actions";
const WARNING_CLASS = "rdw-favs-sync-warning";
const NOTE_CLASS = "rdw-favs-sync-note";

const HEADING = "Favorites sync";
const TEXT_SYNC = "Sync favorites";
const TEXT_RESUME = "Resume";
const TEXT_STOP = "Stop";
const TEXT_WARNING =
  "Loads every favorites page, one request per 1.5 s";
const TEXT_NOTE =
  "Sync only adds favorites. Posts removed on the site stay in the local set.";
const TEXT_IDLE_COUNT = (count: number): string =>
  `${String(count)} in local favorites set`;
const TEXT_LAST_SYNC = (iso: string): string =>
  `Last full sync: ${formatSyncDate(iso)}`;
const TEXT_PAUSED = (page: number, pages: number): string =>
  `Paused at page ${String(page)} of ${String(pages)}`;
const TEXT_PROGRESS = (p: FavoritesSyncProgress): string =>
  `Page ${String(p.page)} of ${String(p.pages)} · ${String(p.total)} ids`;
const TEXT_DONE = (total: number, pages: number): string =>
  `Synced ${String(total)} ids across ${String(pages)} pages`;
const TEXT_ABORTED = (page: number, pages: number, total: number): string =>
  `Stopped at page ${String(page)} of ${String(pages)} · ${String(total)} ids`;

const PAUSE_SECONDS = FAVORITES_SYNC_PAGE_PAUSE_MS / 1000;

export const FAVORITES_SYNC_SECTION_CSS = `
.${SECTION_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.${SECTION_CLASS} .${STATUS_CLASS} {
  margin: 0;
  color: #333;
  font-size: 12px;
}

.${SECTION_CLASS} .${PROGRESS_CLASS} {
  width: 100%;
  height: 8px;
}

.${SECTION_CLASS} .${ACTIONS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.${SECTION_CLASS} .${WARNING_CLASS},
.${SECTION_CLASS} .${NOTE_CLASS} {
  margin: 0;
  color: #555;
  font-size: 12px;
}
`.trim();

type SyncUiRefs = {
  status: HTMLElement;
  progress: HTMLProgressElement;
  error: HTMLElement;
  syncBtn: HTMLButtonElement;
  resumeBtn: HTMLButtonElement;
  stopBtn: HTMLButtonElement;
};

type ActiveSync = {
  controller: AbortController;
  listeners: Set<(progress: FavoritesSyncProgress) => void>;
};

let activeSync: ActiveSync | null = null;

function formatSyncDate(iso: string): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) {
    return iso;
  }
  return new Date(parsed).toLocaleString();
}

function pageFromPid(pid: number): number {
  return Math.floor(pid / FAVORITES_SYNC_PID_STEP) + 1;
}

function pagesFromLastPid(lastPid: number): number {
  return Math.floor(lastPid / FAVORITES_SYNC_PID_STEP) + 1;
}

function isUnfinished(sync: FavsSyncState | undefined): sync is FavsSyncState {
  return sync !== undefined && sync.finishedAt === undefined;
}

function buildStatusText(): string {
  const count = loadFavSet().size;
  const sync = getSyncState();
  const parts = [TEXT_IDLE_COUNT(count)];
  if (isUnfinished(sync)) {
    const page = pageFromPid(sync.nextPid);
    const pages = Math.max(pagesFromLastPid(sync.lastPid), page);
    parts.push(TEXT_PAUSED(page, pages));
  } else if (sync?.finishedAt !== undefined) {
    parts.push(TEXT_LAST_SYNC(sync.finishedAt));
  }
  return parts.join(" · ");
}

function applyIdleUi(refs: SyncUiRefs): void {
  const unfinished = isUnfinished(getSyncState());
  refs.status.textContent = buildStatusText();
  refs.progress.removeAttribute("value");
  refs.progress.removeAttribute("max");
  refs.error.hidden = true;
  refs.error.textContent = "";
  refs.syncBtn.disabled = activeSync !== null;
  refs.resumeBtn.disabled = activeSync !== null || !unfinished;
  refs.stopBtn.disabled = activeSync === null;
  refs.syncBtn.hidden = unfinished;
  refs.resumeBtn.hidden = !unfinished;
}

function applyProgressUi(refs: SyncUiRefs, progress: FavoritesSyncProgress): void {
  refs.status.textContent = TEXT_PROGRESS(progress);
  refs.progress.max = Math.max(progress.pages, 1);
  refs.progress.value = progress.page;
  refs.syncBtn.disabled = true;
  refs.resumeBtn.disabled = true;
  refs.stopBtn.disabled = false;
  refs.syncBtn.hidden = true;
  refs.resumeBtn.hidden = false;
}

function applyResultUi(refs: SyncUiRefs, result: FavoritesSyncResult): void {
  activeSync = null;
  if (result.status === "error") {
    refs.error.hidden = false;
    refs.error.textContent = result.message;
    applyIdleUi(refs);
    return;
  }

  refs.error.hidden = true;
  refs.error.textContent = "";
  applyIdleUi(refs);

  if (result.status === "completed") {
    refs.status.textContent = TEXT_DONE(result.total, result.pages);
    refs.progress.max = Math.max(result.pages, 1);
    refs.progress.value = result.pages;
    return;
  }

  refs.status.textContent = TEXT_ABORTED(
    result.page,
    result.pages,
    result.total,
  );
  refs.progress.max = Math.max(result.pages, 1);
  refs.progress.value = result.page;
}

async function startSync(refs: SyncUiRefs): Promise<void> {
  if (activeSync !== null) {
    return;
  }

  const controller = new AbortController();
  const listeners = new Set<(progress: FavoritesSyncProgress) => void>();
  activeSync = { controller, listeners };

  const onProgress = (progress: FavoritesSyncProgress): void => {
    for (const listener of listeners) {
      listener(progress);
    }
  };

  listeners.add((progress) => {
    applyProgressUi(refs, progress);
  });

  refs.error.hidden = true;
  refs.error.textContent = "";
  applyProgressUi(refs, {
    page: 0,
    pages: 1,
    total: loadFavSet().size,
  });

  try {
    const result = await runFavoritesSync({
      onProgress,
      signal: controller.signal,
    });
    if (activeSync?.controller === controller) {
      applyResultUi(refs, result);
    }
  } catch (error) {
    log.error("favorites sync section: unexpected failure", error);
    if (activeSync?.controller === controller) {
      activeSync = null;
      refs.error.hidden = false;
      refs.error.textContent =
        error instanceof Error ? error.message : "unexpected error";
      applyIdleUi(refs);
    }
  }
}

/**
 * Panel section that runs an add-only favorites sync on explicit user click.
 * Survives panel re-renders via a module-level AbortController.
 */
export function createFavoritesSyncSection(): HTMLElement {
  const section = document.createElement("section");
  section.className = `${CSS_CLASS.section} ${SECTION_CLASS}`;

  const title = document.createElement("h3");
  title.className = CSS_CLASS.sectionTitle;
  title.textContent = HEADING;

  const status = document.createElement("p");
  status.className = STATUS_CLASS;

  const progress = document.createElement("progress");
  progress.className = PROGRESS_CLASS;

  const actions = document.createElement("div");
  actions.className = ACTIONS_CLASS;

  const syncBtn = document.createElement("button");
  syncBtn.type = "button";
  syncBtn.className = CSS_CLASS.primaryButton;
  syncBtn.textContent = TEXT_SYNC;

  const resumeBtn = document.createElement("button");
  resumeBtn.type = "button";
  resumeBtn.className = CSS_CLASS.secondaryButton;
  resumeBtn.textContent = TEXT_RESUME;

  const stopBtn = document.createElement("button");
  stopBtn.type = "button";
  stopBtn.className = CSS_CLASS.secondaryButton;
  stopBtn.textContent = TEXT_STOP;

  actions.append(syncBtn, resumeBtn, stopBtn);

  const error = document.createElement("p");
  error.className = CSS_CLASS.error;
  error.hidden = true;

  const warning = document.createElement("p");
  warning.className = WARNING_CLASS;
  warning.textContent = TEXT_WARNING;

  const note = document.createElement("p");
  note.className = NOTE_CLASS;
  note.textContent = TEXT_NOTE;

  const pauseHint = document.createElement("p");
  pauseHint.className = CSS_CLASS.hint;
  pauseHint.textContent = `Pause between pages: ${String(PAUSE_SECONDS)} s`;

  section.append(
    title,
    status,
    progress,
    actions,
    error,
    warning,
    note,
    pauseHint,
  );

  const refs: SyncUiRefs = {
    status,
    progress,
    error,
    syncBtn,
    resumeBtn,
    stopBtn,
  };

  if (activeSync !== null) {
    const listener = (p: FavoritesSyncProgress): void => {
      applyProgressUi(refs, p);
    };
    activeSync.listeners.add(listener);
    applyProgressUi(refs, {
      page: 0,
      pages: 1,
      total: loadFavSet().size,
    });
    refs.stopBtn.disabled = false;
  } else {
    applyIdleUi(refs);
  }

  syncBtn.addEventListener("click", () => {
    void startSync(refs);
  });
  resumeBtn.addEventListener("click", () => {
    void startSync(refs);
  });
  stopBtn.addEventListener("click", () => {
    activeSync?.controller.abort();
  });

  return section;
}
