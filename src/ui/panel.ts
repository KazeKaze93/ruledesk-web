import {
  CSS_CLASS,
  EXPORT_FILENAME,
  EXPORT_MIME,
  PANEL_ROOT_ID,
  TOGGLE_BUTTON_ID,
  UI_TEXT,
} from "../config/constants";
import { log } from "../log";
import { buildSearchUrl, readTagsFromLocation, serialize } from "../search/query";
import type { Collection } from "../storage/schema";
import {
  addCollection,
  deleteCollection,
  exportJson,
  importJson,
  load,
  renameCollection,
} from "../storage/store";
import { PANEL_CSS } from "./styles";

type PanelMode =
  | { kind: "list" }
  | { kind: "save"; defaultName: string }
  | { kind: "rename"; id: string; name: string }
  | { kind: "confirm-delete"; id: string; name: string };

export function mountPanel(target: ParentNode = document.body): void {
  if (document.getElementById(PANEL_ROOT_ID) !== null) {
    return;
  }

  const host = document.createElement("div");
  host.id = PANEL_ROOT_ID;
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = PANEL_CSS;
  shadow.append(style);

  const root = document.createElement("div");
  root.className = CSS_CLASS.host;
  shadow.append(root);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.id = TOGGLE_BUTTON_ID;
  toggle.className = CSS_CLASS.toggle;
  toggle.textContent = "RD";
  toggle.setAttribute("aria-label", UI_TEXT.toggleOpen);
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "ruledesk-web-panel");

  const panel = document.createElement("section");
  panel.id = "ruledesk-web-panel";
  panel.className = CSS_CLASS.panel;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-label", UI_TEXT.panelTitle);
  panel.hidden = true;

  root.append(panel, toggle);
  target.append(host);

  let open = false;
  let mode: PanelMode = { kind: "list" };
  let importError = "";
  let nameDraft = "";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json,application/json";
  fileInput.className = CSS_CLASS.hidden;
  fileInput.setAttribute("aria-hidden", "true");
  fileInput.tabIndex = -1;
  root.append(fileInput);

  function setOpen(next: boolean): void {
    open = next;
    panel.classList.toggle(CSS_CLASS.panelOpen, open);
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute(
      "aria-label",
      open ? UI_TEXT.toggleClose : UI_TEXT.toggleOpen,
    );
    if (open) {
      render();
      const focusTarget = panel.querySelector("button, input");
      if (focusTarget instanceof HTMLElement) {
        focusTarget.focus();
      }
    } else {
      mode = { kind: "list" };
      importError = "";
      toggle.focus();
    }
  }

  function currentSearchTags() {
    return readTagsFromLocation(window.location.search);
  }

  function downloadExport(): void {
    const payload = exportJson();
    const blob = new Blob([payload], { type: EXPORT_MIME });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = EXPORT_FILENAME;
    anchor.rel = "noopener";
    root.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function renderList(collections: Collection[]): void {
    panel.replaceChildren();

    const header = document.createElement("div");
    header.className = CSS_CLASS.header;

    const title = document.createElement("h2");
    title.className = CSS_CLASS.title;
    title.textContent = UI_TEXT.panelTitle;

    const close = document.createElement("button");
    close.type = "button";
    close.className = CSS_CLASS.close;
    close.textContent = "×";
    close.setAttribute("aria-label", UI_TEXT.toggleClose);
    close.addEventListener("click", () => {
      setOpen(false);
    });

    header.append(title, close);

    const body = document.createElement("div");
    body.className = CSS_CLASS.body;

    const saveSection = document.createElement("section");
    saveSection.className = CSS_CLASS.section;

    const searchTags = currentSearchTags();
    const canSave = searchTags !== null && searchTags.length > 0;

    if (mode.kind === "save") {
      const form = document.createElement("form");
      form.className = CSS_CLASS.form;

      const field = document.createElement("div");
      field.className = CSS_CLASS.field;

      const label = document.createElement("label");
      label.className = CSS_CLASS.label;
      label.htmlFor = "rdw-save-name";
      label.textContent = UI_TEXT.nameLabel;

      const input = document.createElement("input");
      input.id = "rdw-save-name";
      input.className = CSS_CLASS.input;
      input.type = "text";
      input.required = true;
      input.value = nameDraft;
      input.addEventListener("input", () => {
        nameDraft = input.value;
      });

      field.append(label, input);

      const actions = document.createElement("div");
      actions.className = CSS_CLASS.formActions;

      const saveBtn = document.createElement("button");
      saveBtn.type = "submit";
      saveBtn.className = CSS_CLASS.primaryButton;
      saveBtn.textContent = UI_TEXT.save;

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = CSS_CLASS.secondaryButton;
      cancelBtn.textContent = UI_TEXT.cancel;
      cancelBtn.addEventListener("click", () => {
        mode = { kind: "list" };
        render();
      });

      actions.append(saveBtn, cancelBtn);
      form.append(field, actions);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const tags = currentSearchTags();
        if (tags === null || tags.length === 0) {
          mode = { kind: "list" };
          render();
          return;
        }
        const name = nameDraft.trim();
        if (name.length === 0) {
          return;
        }
        addCollection(name, tags);
        mode = { kind: "list" };
        render();
      });
      saveSection.append(form);
      queueMicrotask(() => {
        input.focus();
        input.select();
      });
    } else {
      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = CSS_CLASS.primaryButton;
      saveBtn.textContent = UI_TEXT.saveCurrent;
      saveBtn.disabled = !canSave;
      saveBtn.addEventListener("click", () => {
        const tags = currentSearchTags();
        if (tags === null || tags.length === 0) {
          return;
        }
        nameDraft = serialize(tags);
        mode = { kind: "save", defaultName: nameDraft };
        render();
      });
      saveSection.append(saveBtn);
      if (!canSave) {
        const hint = document.createElement("p");
        hint.className = CSS_CLASS.hint;
        hint.textContent = UI_TEXT.notOnSearchPage;
        saveSection.append(hint);
      }
    }

    const collectionsSection = document.createElement("section");
    collectionsSection.className = CSS_CLASS.section;

    const collectionsTitle = document.createElement("h3");
    collectionsTitle.className = CSS_CLASS.sectionTitle;
    collectionsTitle.textContent = UI_TEXT.collectionsHeading;
    collectionsSection.append(collectionsTitle);

    if (collections.length === 0) {
      const empty = document.createElement("p");
      empty.className = CSS_CLASS.hint;
      empty.textContent = UI_TEXT.emptyCollections;
      collectionsSection.append(empty);
    } else {
      const list = document.createElement("ul");
      list.className = CSS_CLASS.list;

      for (const collection of collections) {
        const item = document.createElement("li");
        item.className = CSS_CLASS.listItem;

        if (mode.kind === "rename" && mode.id === collection.id) {
          const form = document.createElement("form");
          form.className = CSS_CLASS.form;

          const field = document.createElement("div");
          field.className = CSS_CLASS.field;

          const label = document.createElement("label");
          label.className = CSS_CLASS.label;
          label.htmlFor = `rdw-rename-${collection.id}`;
          label.textContent = UI_TEXT.nameLabel;

          const input = document.createElement("input");
          input.id = `rdw-rename-${collection.id}`;
          input.className = CSS_CLASS.input;
          input.type = "text";
          input.required = true;
          input.value = nameDraft;
          input.addEventListener("input", () => {
            nameDraft = input.value;
          });

          field.append(label, input);

          const actions = document.createElement("div");
          actions.className = CSS_CLASS.formActions;

          const saveBtn = document.createElement("button");
          saveBtn.type = "submit";
          saveBtn.className = CSS_CLASS.primaryButton;
          saveBtn.textContent = UI_TEXT.save;

          const cancelBtn = document.createElement("button");
          cancelBtn.type = "button";
          cancelBtn.className = CSS_CLASS.secondaryButton;
          cancelBtn.textContent = UI_TEXT.cancel;
          cancelBtn.addEventListener("click", () => {
            mode = { kind: "list" };
            render();
          });

          actions.append(saveBtn, cancelBtn);
          form.append(field, actions);
          form.addEventListener("submit", (event) => {
            event.preventDefault();
            const nextName = nameDraft.trim();
            if (nextName.length === 0) {
              return;
            }
            renameCollection(collection.id, nextName);
            mode = { kind: "list" };
            render();
          });
          item.append(form);
          queueMicrotask(() => {
            input.focus();
            input.select();
          });
        } else if (
          mode.kind === "confirm-delete" &&
          mode.id === collection.id
        ) {
          const prompt = document.createElement("p");
          prompt.className = CSS_CLASS.hint;
          prompt.textContent = `${UI_TEXT.confirmDelete} (${collection.name})`;

          const actions = document.createElement("div");
          actions.className = CSS_CLASS.confirmRow;

          const confirmBtn = document.createElement("button");
          confirmBtn.type = "button";
          confirmBtn.className = CSS_CLASS.dangerButton;
          confirmBtn.textContent = UI_TEXT.confirm;
          confirmBtn.addEventListener("click", () => {
            deleteCollection(collection.id);
            mode = { kind: "list" };
            render();
          });

          const cancelBtn = document.createElement("button");
          cancelBtn.type = "button";
          cancelBtn.className = CSS_CLASS.secondaryButton;
          cancelBtn.textContent = UI_TEXT.cancel;
          cancelBtn.addEventListener("click", () => {
            mode = { kind: "list" };
            render();
          });

          actions.append(confirmBtn, cancelBtn);
          item.append(prompt, actions);
        } else {
          const nameBtn = document.createElement("button");
          nameBtn.type = "button";
          nameBtn.className = CSS_CLASS.itemName;
          nameBtn.textContent = collection.name;
          nameBtn.setAttribute(
            "aria-label",
            `${UI_TEXT.openCollection}: ${collection.name}`,
          );
          nameBtn.addEventListener("click", () => {
            window.location.assign(buildSearchUrl(collection.tags));
          });

          const actions = document.createElement("div");
          actions.className = CSS_CLASS.itemActions;

          const renameBtn = document.createElement("button");
          renameBtn.type = "button";
          renameBtn.className = CSS_CLASS.iconButton;
          renameBtn.textContent = UI_TEXT.rename;
          renameBtn.setAttribute(
            "aria-label",
            `${UI_TEXT.rename}: ${collection.name}`,
          );
          renameBtn.addEventListener("click", () => {
            nameDraft = collection.name;
            mode = {
              kind: "rename",
              id: collection.id,
              name: collection.name,
            };
            render();
          });

          const deleteBtn = document.createElement("button");
          deleteBtn.type = "button";
          deleteBtn.className = CSS_CLASS.iconButton;
          deleteBtn.textContent = UI_TEXT.delete;
          deleteBtn.setAttribute(
            "aria-label",
            `${UI_TEXT.delete}: ${collection.name}`,
          );
          deleteBtn.addEventListener("click", () => {
            mode = {
              kind: "confirm-delete",
              id: collection.id,
              name: collection.name,
            };
            render();
          });

          actions.append(renameBtn, deleteBtn);
          item.append(nameBtn, actions);
        }

        list.append(item);
      }

      collectionsSection.append(list);
    }

    const toolbar = document.createElement("div");
    toolbar.className = CSS_CLASS.toolbar;

    const exportBtn = document.createElement("button");
    exportBtn.type = "button";
    exportBtn.className = CSS_CLASS.secondaryButton;
    exportBtn.textContent = UI_TEXT.export;
    exportBtn.addEventListener("click", () => {
      downloadExport();
    });

    const importBtn = document.createElement("button");
    importBtn.type = "button";
    importBtn.className = CSS_CLASS.secondaryButton;
    importBtn.textContent = UI_TEXT.import;
    importBtn.addEventListener("click", () => {
      importError = "";
      fileInput.value = "";
      fileInput.click();
    });

    toolbar.append(exportBtn, importBtn);

    if (importError.length > 0) {
      const error = document.createElement("p");
      error.className = CSS_CLASS.error;
      error.textContent = `${UI_TEXT.importErrorPrefix} ${importError}`;
      body.append(saveSection, collectionsSection, toolbar, error);
    } else {
      body.append(saveSection, collectionsSection, toolbar);
    }

    panel.append(header, body);
  }

  function render(): void {
    const data = load();
    renderList(data.collections);
  }

  toggle.addEventListener("click", () => {
    setOpen(!open);
  });

  shadow.addEventListener("keydown", (event: Event) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
    }
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.item(0);
    if (file === null || file === undefined) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        const text = typeof reader.result === "string" ? reader.result : "";
        importJson(text);
        importError = "";
        mode = { kind: "list" };
        render();
      } catch (error) {
        importError =
          error instanceof Error ? error.message : "Unknown import error";
        log.warn("Import failed", importError);
        render();
      }
    });
    reader.addEventListener("error", () => {
      importError = "Could not read file";
      render();
    });
    reader.readAsText(file);
  });
}
