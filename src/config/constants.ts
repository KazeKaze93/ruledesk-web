export const STORAGE_KEY = "ruledesk-web.storage";
export const STORAGE_BACKUP_KEY = "ruledesk-web.storage.backup";
export const DEBUG_KEY = "ruledesk-web.debug";

export const SCHEMA_VERSION = 1 as const;

export const SITE_ORIGIN = "https://rule34.xxx";
export const SEARCH_PATH = "/index.php";
export const SEARCH_PAGE = "post";
export const SEARCH_SECTION = "list";
export const SEARCH_PARAM_PAGE = "page";
export const SEARCH_PARAM_SECTION = "s";
export const SEARCH_PARAM_TAGS = "tags";

export const TAG_TYPE_INCLUDE = "include" as const;
export const TAG_TYPE_EXCLUDE = "exclude" as const;
export const EXCLUDE_PREFIX = "-";
export const TAG_SEPARATOR = " ";
export const URL_TAG_SEPARATOR = "+";

export const EXPORT_FILENAME = "ruledesk-web-collections.json";
export const EXPORT_MIME = "application/json";

export const PANEL_ROOT_ID = "ruledesk-web-root";
export const TOGGLE_BUTTON_ID = "ruledesk-web-toggle";

export const UI_TEXT = {
  toggleOpen: "Open RuleDesk",
  toggleClose: "Close RuleDesk",
  panelTitle: "RuleDesk",
  collectionsHeading: "Collections",
  emptyCollections: "No collections yet.",
  saveCurrent: "Save current search",
  nameLabel: "Name",
  save: "Save",
  cancel: "Cancel",
  rename: "Rename",
  delete: "Delete",
  confirmDelete: "Delete this collection?",
  confirm: "Confirm",
  openCollection: "Open collection",
  export: "Export",
  import: "Import",
  importErrorPrefix: "Import failed:",
  notOnSearchPage: "Open a post list search with tags to save it.",
} as const;

export const CSS_CLASS = {
  host: "rdw-host",
  toggle: "rdw-toggle",
  panel: "rdw-panel",
  panelOpen: "rdw-panel--open",
  header: "rdw-header",
  title: "rdw-title",
  close: "rdw-close",
  body: "rdw-body",
  section: "rdw-section",
  sectionTitle: "rdw-section-title",
  list: "rdw-list",
  listItem: "rdw-list-item",
  itemName: "rdw-item-name",
  itemActions: "rdw-item-actions",
  iconButton: "rdw-icon-button",
  primaryButton: "rdw-primary-button",
  secondaryButton: "rdw-secondary-button",
  dangerButton: "rdw-danger-button",
  form: "rdw-form",
  field: "rdw-field",
  label: "rdw-label",
  input: "rdw-input",
  formActions: "rdw-form-actions",
  toolbar: "rdw-toolbar",
  hint: "rdw-hint",
  error: "rdw-error",
  confirmRow: "rdw-confirm-row",
  hidden: "rdw-hidden",
} as const;
