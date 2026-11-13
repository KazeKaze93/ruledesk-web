// ==UserScript==
// @name         RuleDesk Web
// @namespace    https://github.com/kazekaze93/ruledesk-web
// @version      0.8.1
// @description  Collections, playlists, favorites, artist updates, and page tweaks for rule34.xxx
// @downloadURL  https://raw.githubusercontent.com/KazeKaze93/ruledesk-web/main/dist/ruledesk-web.user.js
// @updateURL    https://raw.githubusercontent.com/KazeKaze93/ruledesk-web/main/dist/ruledesk-web.user.js
// @match        https://rule34.xxx/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

(function() {
	"use strict";
	var STORAGE_KEY = "ruledesk-web.storage";
	var STORAGE_BACKUP_KEY = "ruledesk-web.storage.backup";
	var FAVS_STORAGE_KEY = "ruledesk-web.favs";
	var DEBUG_KEY = "ruledesk-web.debug";
	var APPEARANCE_BACKGROUND_KEY = "ruledesk-web.appearance.background";
	var TOKEN_STYLE_ID = "ruledesk-web-tokens";
	var SITE_SKIN_STYLE_ID = "ruledesk-web-site-skin";
	var RDW_SKIN_CLASS = "rdw-skin";
	var RDW_THEME_ATTR = "data-rdw-theme";
	var APPEARANCE_THEME_SITE = "site";
	var APPEARANCE_THEME_SITE_DARK = "site-dark";
	var APPEARANCE_THEME_LIGHT = "light";
	var APPEARANCE_THEME_DARK = "dark";
	var APPEARANCE_THEME_CUSTOM = "custom";
	var DEFAULT_APPEARANCE_THEME = APPEARANCE_THEME_LIGHT;
	var SITE_ORIGIN = "https://rule34.xxx";
	var SEARCH_PATH = "/index.php";
	var SEARCH_PAGE = "post";
	var SEARCH_SECTION = "list";
	var SEARCH_PARAM_PAGE = "page";
	var SEARCH_PARAM_TAGS = "tags";
	var FAVORITES_PAGE = "favorites";
	var FAVORITES_SECTION_VIEW = "view";
	var FAVORITES_SECTION_DELETE = "delete";
	var FAVORITES_PARAM_RETURN_PID = "return_pid";
	var ADDFAV_PATH = "/public/addfav.php";
	var VOTE_PATH = "/index.php";
	var VOTE_PARAM_PAGE = "page";
	var VOTE_PARAM_TYPE = "type";
	var VOTE_PAGE = "post";
	var VOTE_SECTION = "vote";
	var FETCH_CREDENTIALS = "same-origin";
	var TAG_TYPE_INCLUDE = "include";
	var TAG_TYPE_EXCLUDE = "exclude";
	var UPDATES_ID_PREFIX = "id:>";
	var EXPORT_FILENAME = "ruledesk-web-collections.json";
	var EXPORT_MIME = "application/json";
	var IMPORT_SCHEMA_ERROR_PREFIX = "File is not a RuleDesk Web export";
	var COLLECTION_KIND_SEARCH = "search";
	var COLLECTION_KIND_POSTS = "posts";
	var PANEL_ROOT_ID = "ruledesk-web-root";
	var TOGGLE_BUTTON_ID = "ruledesk-web-toggle";
	var DOCUMENT_STYLE_ID = "ruledesk-web-document-style";
	var UPDATES_BAR_ID = "ruledesk-web-updates-bar";
	var USERSCRIPT_VERSION = "0.8.1";
	var SITE_THEME_COOKIE_NAME = "theme";
	var SITE_THEME_COOKIE_VALUE_DARK = "dark";
	var SITE_BLACKLIST_COOKIE_NAME = "tag_blacklist";
	var SITE_THEME_STYLESHEET_DIR = "/css/";
	var SITE_THEME_STYLESHEET_LIGHT = "desktop.css";
	var SITE_THEME_STYLESHEET_DARK = "desktop-dark.css";
	var UI_TEXT = {
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
		settingsHeading: "Settings",
		enablePageTweaksLabel: "Enable page tweaks",
		siteDarkThemeLabel: "Dark theme (site)",
		siteDarkThemeHint: "Uses the site's own dark stylesheet",
		gridFavButtonsLabel: "Show favorite buttons in grid",
		cardFavAddLabel: "Add post to favorites",
		cardFavRemoveLabel: "Remove post from favorites",
		cardFavGlyph: "★",
		cardFavErrorNotLoggedIn: "Log in to use favorites",
		cardFavErrorRequest: "Favorite request failed",
		artistsHeading: "Artists",
		artistsEmpty: "No artists followed yet.",
		artistTagLabel: "Artist tag",
		artistAdd: "Add",
		artistRemove: "Unfollow",
		artistFollow: "Follow",
		artistFollowing: "Following",
		artistUnfollow: "Unfollow",
		artistOpenSearch: "Search artist",
		artistInvalid: "Invalid artist tag.",
		artistDuplicate: "Already following this artist.",
		openUpdates: "Open updates",
		openUpdatesGroup: "Updates",
		updatesGroupSizeLabel: "Artists per search (0 = no limit)",
		playlistChunkSizeLabel: "Playlist part size",
		seenUpTo: "Seen up to post #",
		seenNothing: "Nothing marked as seen yet.",
		markAllSeen: "Mark all seen",
		markedSeenConfirm: "Marked as seen up to post #",
		alreadyMarkedSeenPrefix: "Everything here is already marked as seen (up to #",
		alreadyMarkedSeenSuffix: ")",
		reloadUpdates: "Reload updates",
		goToPageOneToMark: "Go to page 1 to mark everything as seen",
		noNewPosts: "No new posts",
		noNewPostsSince: "No new posts since #",
		showAllFollowedPosts: "Show all posts from followed artists",
		updatesPartialHint: "This search covers only part of your artists. Marking as seen works when all artists are in one search (set “Artists per search” to 0).",
		updatesBarMissingHost: "updates empty host not found; updates bar not mounted"
	};
	var CSS_CLASS = {
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
		checkboxRow: "rdw-checkbox-row",
		checkbox: "rdw-checkbox",
		formActions: "rdw-form-actions",
		toolbar: "rdw-toolbar",
		hint: "rdw-hint",
		error: "rdw-error",
		confirmRow: "rdw-confirm-row",
		hidden: "rdw-hidden",
		thumb: "rdw-thumb",
		cardFav: "rdw-card-fav",
		cardFavMarked: "rdw-card-fav--marked",
		cardFavError: "rdw-card-fav--error",
		cardFavPending: "rdw-card-fav--pending",
		gridFavsHidden: "rdw-grid-favs-hidden",
		artistFollow: "rdw-artist-follow",
		artistFollowMarked: "rdw-artist-follow--marked",
		updatesBar: "rdw-updates-bar",
		updatesBarActions: "rdw-updates-bar-actions"
	};
	function isDebugEnabled() {
		try {
			return GM_getValue(DEBUG_KEY, void 0) === true;
		} catch {
			return false;
		}
	}
	var log = {
		debug(message, ...details) {
			if (!isDebugEnabled()) return;
			console.debug(`[ruledesk-web] ${message}`, ...details);
		},
		info(message, ...details) {
			if (!isDebugEnabled()) return;
			console.info(`[ruledesk-web] ${message}`, ...details);
		},
		warn(message, ...details) {
			console.warn(`[ruledesk-web] ${message}`, ...details);
		},
		error(message, ...details) {
			console.error(`[ruledesk-web] ${message}`, ...details);
		}
	};
	function detectPageKind(search) {
		const params = new URLSearchParams(search);
		const page = params.get(SEARCH_PARAM_PAGE);
		const section = params.get("s");
		if (page === "post" && section === "list") return "list";
		if (page === "post" && section === "view") return "post";
		if (page === "favorites" && section === "view") return "favorites";
		return "other";
	}
	function readPostIdFromSearch(search) {
		const params = new URLSearchParams(search);
		const page = params.get(SEARCH_PARAM_PAGE);
		const section = params.get("s");
		const id = params.get("id");
		if (page !== "post" || section !== "view") return null;
		if (id === null || id.trim().length === 0) return null;
		if (!/^\d+$/.test(id)) return null;
		return id;
	}
	function getEnumValues(entries) {
		const numericValues = Object.values(entries).filter((v) => typeof v === "number");
		return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
	}
	function jsonStringifyReplacer(_, value) {
		if (typeof value === "bigint") return value.toString();
		return value;
	}
	var Cached = class {
		constructor(getter) {
			this._getter = getter;
			this._value = void 0;
		}
		get value() {
			const getter = this._getter;
			if (getter !== void 0) {
				this._value = getter();
				this._getter = void 0;
			}
			return this._value;
		}
	};
	function cached(getter) {
		return new Cached(getter);
	}
	function nullish(input) {
		return input === null || input === void 0;
	}
	function cleanRegex(source) {
		const start = source.startsWith("^") ? 1 : 0;
		const end = source.endsWith("$") ? source.length - 1 : source.length;
		return source.slice(start, end);
	}
	function assignProp(target, prop, value) {
		Object.defineProperty(target, prop, {
			value,
			writable: true,
			enumerable: true,
			configurable: true
		});
	}
	var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
	function isObject(data) {
		return typeof data === "object" && data !== null && !Array.isArray(data);
	}
	function isPlainObject(o) {
		if (isObject(o) === false) return false;
		const ctor = o.constructor;
		if (ctor === void 0) return true;
		if (typeof ctor !== "function") return true;
		const prot = ctor.prototype;
		if (isObject(prot) === false) return false;
		if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
		return true;
	}
	var propertyKeyTypes = new Set([
		"string",
		"number",
		"symbol"
	]);
	function escapeRegex(str) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}
	function clone(inst, def, params) {
		const cl = new inst._zod.constr(def ?? inst._zod.def);
		if (!def || params?.parent) cl._zod.parent = inst;
		return cl;
	}
	function normalizeParams(_params) {
		const params = _params;
		if (!params) return {};
		if (typeof params === "string") return { error: () => params };
		if (params?.message !== void 0) {
			if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
			params.error = params.message;
		}
		delete params.message;
		if (typeof params.error === "string") return {
			...params,
			error: () => params.error
		};
		return params;
	}
	function optionalKeys(shape) {
		return Object.keys(shape).filter((k) => {
			return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
		});
	}
	var NUMBER_FORMAT_RANGES = (() => ({
		safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
		int32: [-2147483648, 2147483647],
		uint32: [0, 4294967295],
		float32: [-34028234663852886e22, 34028234663852886e22],
		float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
	}))();
	function aborted(x, startIndex = 0) {
		if (x.aborted === true) return true;
		for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
		return false;
	}
	function explicitlyAborted(x, startIndex = 0) {
		if (x.aborted === true) return true;
		for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue === false) return true;
		return false;
	}
	function prefixIssues(path, issues) {
		return issues.map((iss) => {
			var _a;
			(_a = iss).path ?? (_a.path = []);
			iss.path.unshift(path);
			return iss;
		});
	}
	function unwrapMessage(message) {
		return typeof message === "string" ? message : message?.message;
	}
	function sizeCaps(defChecks) {
		const caps = [];
		for (const ch of defChecks ?? []) {
			const d = ch._zod.def;
			if (!/_(length|size)$|_equals$/.test(d.check)) break;
			const max = d.maximum ?? d.length ?? d.size;
			if (max >= 0) caps.push([max, ch]);
		}
		return caps;
	}
	function attachSchema(issues, start, inst) {
		var _a;
		for (let i = start; i < issues.length; i++) (_a = issues[i]).schema ?? (_a.schema = inst);
	}
	function finalizeIssue(iss, ctx, config) {
		var _a;
		const traits = iss.inst?._zod?.traits;
		if (traits?.has("$ZodType")) {
			if (traits.has("$ZodCheck")) (_a = iss).schema ?? (_a.schema = iss.inst);
			else iss.schema = iss.inst;
		}
		const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
		const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
		const full = {};
		for (const k of Object.keys(iss)) {
			if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__") continue;
			full[k] = iss[k];
		}
		full.path ?? (full.path = []);
		full.message = message;
		if (ctx?.reportInput) full.input = iss.input;
		return full;
	}
	var highSurrogate = /[\uD800-\uDBFF]/;
	function codePointLength(str) {
		const units = str.length;
		if (!highSurrogate.test(str)) return units;
		let count = units;
		for (let i = 0; i < units - 1; i++) if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
			count--;
			i++;
		}
		return count;
	}
	function getLengthableOrigin(input) {
		if (Array.isArray(input)) return "array";
		if (typeof input === "string") return "string";
		return "unknown";
	}
	function members(proto, table) {
		for (const key in table) {
			const desc = Object.getOwnPropertyDescriptor(table, key);
			if (desc.get) Object.defineProperty(proto, key, {
				...desc,
				enumerable: false
			});
			else defineBound(proto, key, desc.value);
		}
	}
	function own(inst, key, value, enumerable = true) {
		Object.defineProperty(inst, key, {
			configurable: true,
			writable: true,
			enumerable,
			value
		});
		return value;
	}
	function hide(inst, key, value) {
		return own(inst, key, value, false);
	}
	function defineBound(proto, key, fn) {
		Object.defineProperty(proto, key, {
			configurable: true,
			get() {
				return this == null ? fn : own(this, key, fn.bind(this));
			},
			set(value) {
				own(this, key, value);
			}
		});
	}
	function claim(inst, sentinel) {
		const proto = Object.getPrototypeOf(inst);
		return sentinel in proto ? void 0 : proto;
	}
	var installing;
	var broke = false;
	var breaker = {
		configurable: true,
		get() {
			broke = true;
		}
	};
	function defineLazyInternal(inst, key, compute) {
		const proto = Object.getPrototypeOf(inst._zod);
		if (key in proto && installing !== inst._zod) {
			installing = void 0;
			return;
		}
		installing = inst._zod;
		Object.defineProperty(proto, key, {
			configurable: true,
			get() {
				Object.defineProperty(this, key, breaker);
				const outer = broke;
				broke = false;
				try {
					const value = compute(this);
					if (broke) delete this[key];
					else Object.defineProperty(this, key, {
						configurable: true,
						writable: true,
						value
					});
					broke = broke || outer;
					return value;
				} catch (err) {
					delete this[key];
					broke = broke || outer;
					throw err;
				}
			},
			set(value) {
				Object.defineProperty(this, key, {
					configurable: true,
					writable: true,
					value
				});
			}
		});
	}
	function installLazyProp(inst, key, make, enumerable) {
		const proto = claim(inst, key);
		if (!proto) return;
		Object.defineProperty(proto, key, {
			configurable: true,
			get() {
				const desc = {
					configurable: true,
					writable: true,
					enumerable,
					value: void 0
				};
				Object.defineProperty(this, key, desc);
				desc.value = make(this);
				Object.defineProperty(this, key, desc);
				return desc.value;
			},
			set(value) {
				Object.defineProperty(this, key, {
					configurable: true,
					writable: true,
					enumerable,
					value
				});
			}
		});
	}
	var _a;
	var _zodDesc = {
		value: void 0,
		enumerable: false
	};
	var _E = "captureStackTrace" in Error ? Error : null;
	function newError(Definition) {
		const E = _E;
		if (E) {
			const saved = E.stackTraceLimit;
			if (typeof saved === "number") {
				try {
					E.stackTraceLimit = 0;
				} catch {
					_E = null;
					return new Definition();
				}
				try {
					return new Definition();
				} finally {
					E.stackTraceLimit = saved;
				}
			}
		}
		return new Definition();
	}
	function $constructor(name, initializer, proto, params) {
		const zodProto = {};
		function Internals(def) {
			this.def = def;
			this.constr = _;
			this.traits = new Set();
		}
		Internals.prototype = zodProto;
		const protoMembers = proto;
		const initialized = protoMembers && new WeakSet();
		function init(inst, def) {
			if (!inst._zod) {
				_zodDesc.value = new Internals(def);
				try {
					Object.defineProperty(inst, "_zod", _zodDesc);
				} finally {
					_zodDesc.value = void 0;
				}
			} else if (inst._zod.traits.has(name)) return;
			inst._zod.traits.add(name);
			initializer(inst, def);
			if (initialized) {
				const own = Object.getPrototypeOf(inst);
				const ctorProto = inst._zod.constr.prototype;
				let up = own;
				while (up && up !== ctorProto) up = Object.getPrototypeOf(up);
				const target = up ?? own;
				if (!initialized.has(target)) {
					initialized.add(target);
					members(target, protoMembers);
				}
			}
			const proto = _.prototype;
			for (const k in proto) {
				if (!Object.prototype.hasOwnProperty.call(proto, k)) continue;
				if (!(k in inst)) inst[k] = proto[k].bind(inst);
			}
		}
		const Parent = params?.Parent ?? Object;
		class Definition extends Parent {}
		Object.defineProperty(Definition, "name", { value: name });
		function _(def) {
			const inst = params?.Parent ? newError(Definition) : this;
			init(inst, def);
			const deferred = inst._zod.deferred;
			if (deferred) {
				for (const fn of deferred) fn();
				inst._zod.deferred = void 0;
			}
			const pp = globalThis.__zod_globalConfig?.postProcessor;
			if (pp) pp(inst);
			return inst;
		}
		Object.defineProperty(_, "init", { value: init });
		Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
			if (params?.Parent && inst instanceof params.Parent) return true;
			return inst?._zod?.traits?.has(name);
		} });
		Object.defineProperty(_, "name", { value: name });
		return _;
	}
	var $ZodAsyncError = class extends Error {
		constructor() {
			super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
		}
	};
	(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
	var globalConfig = globalThis.__zod_globalConfig;
	function config(newConfig) {
		if (newConfig) Object.assign(globalConfig, newConfig);
		return globalConfig;
	}
	function _getMessage() {
		const internals = this._zod;
		internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
		return internals.message;
	}
	function _setMessage(value) {
		this._zod.message = value;
	}
	var _messageDesc = {
		get: _getMessage,
		set: _setMessage,
		enumerable: true,
		configurable: true
	};
	var _issuesDesc = {
		value: void 0,
		enumerable: false
	};
	var _installedToString = new WeakSet([Object.prototype, Error.prototype]);
	var initializer = (inst, def) => {
		inst.name = "$ZodError";
		_issuesDesc.value = def;
		Object.defineProperty(inst, "issues", _issuesDesc);
		_issuesDesc.value = void 0;
		Object.defineProperty(inst, "message", _messageDesc);
		const proto = Object.getPrototypeOf(inst);
		if (!_installedToString.has(proto)) {
			_installedToString.add(proto);
			Object.defineProperty(proto, "toString", {
				configurable: true,
				enumerable: false,
				get() {
					const value = () => this.message;
					Object.defineProperty(this, "toString", {
						value,
						configurable: true,
						writable: true
					});
					return value;
				},
				set(value) {
					Object.defineProperty(this, "toString", {
						value,
						configurable: true,
						writable: true
					});
				}
			});
		}
	};
	var $ZodRealError = $constructor("$ZodError", initializer, void 0, { Parent: Error });
	var _parse = (_Err) => {
		const fn = (schema, value, _ctx, _params) => {
			const ctx = _ctx ? {
				..._ctx,
				async: false
			} : { async: false };
			const result = schema._zod.run({
				value,
				issues: []
			}, ctx);
			if (result instanceof Promise) throw new $ZodAsyncError();
			if (result.issues.length) {
				const e = new ((_params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
				captureStackTrace(e, _params?.callee ?? fn);
				throw e;
			}
			return result.value;
		};
		return fn;
	};
	var parse = _parse($ZodRealError);
	var _parseAsync = (_Err) => {
		const fn = async (schema, value, _ctx, params) => {
			const ctx = _ctx ? {
				..._ctx,
				async: true
			} : { async: true };
			let result = schema._zod.run({
				value,
				issues: []
			}, ctx);
			if (result instanceof Promise) result = await result;
			if (result.issues.length) {
				const e = new ((params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
				captureStackTrace(e, params?.callee ?? fn);
				throw e;
			}
			return result.value;
		};
		return fn;
	};
	var parseAsync = _parseAsync($ZodRealError);
	var _safeParse = (_Err) => (schema, value, _ctx) => {
		const ctx = _ctx ? {
			..._ctx,
			async: false
		} : { async: false };
		const result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) throw new $ZodAsyncError();
		return result.issues.length ? failure(_Err, result.issues, ctx) : {
			success: true,
			data: result.value
		};
	};
	var safeParse = _safeParse($ZodRealError);
	function failure(Err, issues, ctx) {
		let error;
		return {
			success: false,
			get error() {
				if (!error) {
					error = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
					issues = void 0;
					ctx = void 0;
				}
				return error;
			},
			set error(e) {
				error = e;
				issues = void 0;
				ctx = void 0;
			}
		};
	}
	var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
		const ctx = _ctx ? {
			..._ctx,
			async: true
		} : { async: true };
		let result = schema._zod.run({
			value,
			issues: []
		}, ctx);
		if (result instanceof Promise) result = await result;
		return result.issues.length ? failure(_Err, result.issues, ctx) : {
			success: true,
			data: result.value
		};
	};
	var safeParseAsync = _safeParseAsync($ZodRealError);
	var anyString = /^[\s\S]{0,}$/;
	var number$1 = /^-?\d+(?:\.\d+)?$/;
	var boolean$1 = /^(?:true|false)$/i;
	var $ZodCheck = $constructor("$ZodCheck", (inst, def) => {
		var _a;
		inst._zod ?? (inst._zod = {});
		inst._zod.def = def;
		(_a = inst._zod).onattach ?? (_a.onattach = []);
	});
	var _whenHasLength = (payload) => {
		const val = payload.value;
		return !nullish(val) && val.length !== void 0;
	};
	var numericOriginMap = {
		number: "number",
		bigint: "bigint",
		object: "date"
	};
	var $ZodCheckGreaterThan = $constructor("$ZodCheckGreaterThan", (inst, def) => {
		$ZodCheck.init(inst, def);
		const origin = numericOriginMap[typeof def.value];
		inst._zod.check = (payload) => {
			if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
			payload.issues.push({
				origin: numericOriginMap[typeof payload.value] ?? origin,
				code: "too_small",
				minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
				input: payload.value,
				inclusive: def.inclusive,
				inst,
				continue: !def.abort
			});
		};
	});
	var $ZodCheckNumberFormat = $constructor("$ZodCheckNumberFormat", (inst, def) => {
		$ZodCheck.init(inst, def);
		def.format = def.format || "float64";
		const isInt = def.format?.includes("int");
		const origin = isInt ? "int" : "number";
		const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
		inst._zod.check = (payload) => {
			const input = payload.value;
			if (isInt) {
				if (!Number.isInteger(input)) {
					payload.issues.push({
						expected: origin,
						format: def.format,
						code: "invalid_type",
						continue: false,
						input,
						inst
					});
					return;
				}
				if (!Number.isSafeInteger(input)) {
					if (input > 0) payload.issues.push({
						input,
						code: "too_big",
						maximum: Number.MAX_SAFE_INTEGER,
						note: "Integers must be within the safe integer range.",
						inst,
						origin,
						inclusive: true,
						continue: !def.abort
					});
					else payload.issues.push({
						input,
						code: "too_small",
						minimum: Number.MIN_SAFE_INTEGER,
						note: "Integers must be within the safe integer range.",
						inst,
						origin,
						inclusive: true,
						continue: !def.abort
					});
					return;
				}
			}
			if (input < minimum) payload.issues.push({
				origin: "number",
				input,
				code: "too_small",
				minimum,
				inclusive: true,
				inst,
				continue: !def.abort
			});
			if (input > maximum) payload.issues.push({
				origin: "number",
				input,
				code: "too_big",
				maximum,
				inclusive: true,
				inst,
				continue: !def.abort
			});
		};
	});
	var $ZodCheckMinLength = $constructor("$ZodCheckMinLength", (inst, def) => {
		var _a;
		$ZodCheck.init(inst, def);
		(_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
		inst._zod.check = (payload) => {
			const input = payload.value;
			const units = input.length;
			if ((typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units) >= def.minimum) return;
			const origin = getLengthableOrigin(input);
			payload.issues.push({
				origin,
				code: "too_small",
				minimum: def.minimum,
				inclusive: true,
				input,
				inst,
				continue: !def.abort
			});
		};
	});
	var version = {
		major: 4,
		minor: 6,
		patch: 7
	};
	var $ZodType = $constructor("$ZodType", (inst, def) => {
		var _a;
		inst ?? (inst = {});
		inst._zod.def = def;
		inst._zod.bag = inst._zod.bag || {};
		inst._zod.version = version;
		const defChecks = inst._zod.def.checks;
		const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
		for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
		if (checks.length === 0) {
			(_a = inst._zod).deferred ?? (_a.deferred = []);
			inst._zod.deferred?.push(() => {
				inst._zod.run = inst._zod.parse;
			});
		} else {
			const runChecks = (payload, checks, ctx) => {
				if (payload.memo) return payload;
				let isAborted = aborted(payload);
				let asyncResult;
				for (const ch of checks) {
					if (ch._zod.def.when) {
						if (explicitlyAborted(payload)) continue;
						if (!ch._zod.def.when(payload)) continue;
					} else if (isAborted) continue;
					const currLen = payload.issues.length;
					const _ = ch._zod.check(payload);
					if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
					if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
						await _;
						if (payload.issues.length === currLen) return;
						attachSchema(payload.issues, currLen, inst);
						if (!isAborted) isAborted = aborted(payload, currLen);
					});
					else {
						if (payload.issues.length === currLen) continue;
						attachSchema(payload.issues, currLen, inst);
						if (!isAborted) isAborted = aborted(payload, currLen);
					}
				}
				if (asyncResult) return asyncResult.then(() => {
					return payload;
				});
				return payload;
			};
			const handleCanaryResult = (canary, payload, ctx) => {
				if (aborted(canary)) {
					canary.aborted = true;
					return canary;
				}
				const checkResult = runChecks(payload, checks, ctx);
				if (checkResult instanceof Promise) {
					if (ctx.async === false) throw new $ZodAsyncError();
					return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
				}
				return inst._zod.parse(checkResult, ctx);
			};
			inst._zod.run = (payload, ctx) => {
				if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
				if (ctx.direction === "backward") {
					const canary = inst._zod.parse({
						value: payload.value,
						issues: []
					}, {
						...ctx,
						skipChecks: true
					});
					if (canary instanceof Promise) return canary.then((canary) => {
						return handleCanaryResult(canary, payload, ctx);
					});
					return handleCanaryResult(canary, payload, ctx);
				}
				const result = inst._zod.parse(payload, ctx);
				if (result instanceof Promise) {
					if (ctx.async === false) throw new $ZodAsyncError();
					return result.then((result) => runChecks(result, checks, ctx));
				}
				return runChecks(result, checks, ctx);
			};
		}
	}, {
		get "~standard"() {
			return hide(this, "~standard", standardProps(this));
		},
		set "~standard"(value) {
			own(this, "~standard", value);
		}
	});
	var toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
	async function validateAsync(inst, value) {
		const ctx = { async: true };
		return toStandardResult(await inst._zod.run({
			value,
			issues: []
		}, ctx), ctx);
	}
	function standardProps(inst) {
		return {
			validate: (value) => {
				const ctx = { async: false };
				try {
					const r = inst._zod.run({
						value,
						issues: []
					}, ctx);
					if (!(r instanceof Promise)) return toStandardResult(r, ctx);
				} catch (_) {}
				return validateAsync(inst, value);
			},
			vendor: "zod",
			version: 1
		};
	}
	var $ZodString = $constructor("$ZodString", (inst, def) => {
		$ZodType.init(inst, def);
		inst._zod.pattern = def.pattern ?? anyString;
		inst._zod.parse = (payload, _) => {
			if (def.coerce) try {
				payload.value = String(payload.value);
			} catch (_) {}
			if (typeof payload.value === "string") return payload;
			payload.issues.push({
				expected: "string",
				code: "invalid_type",
				input: payload.value,
				inst
			});
			return payload;
		};
	});
	var $ZodNumber = $constructor("$ZodNumber", (inst, def) => {
		$ZodType.init(inst, def);
		inst._zod.pattern = number$1;
		inst._zod.parse = (payload, _ctx) => {
			if (def.coerce) try {
				payload.value = Number(payload.value);
			} catch (_) {}
			const input = payload.value;
			if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
			const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : void 0 : void 0;
			payload.issues.push({
				expected: "number",
				code: "invalid_type",
				input,
				inst,
				...received ? { received } : {}
			});
			return payload;
		};
	});
	var $ZodNumberFormat = $constructor("$ZodNumberFormat", (inst, def) => {
		$ZodCheckNumberFormat.init(inst, def);
		$ZodNumber.init(inst, def);
	});
	var $ZodBoolean = $constructor("$ZodBoolean", (inst, def) => {
		$ZodType.init(inst, def);
		inst._zod.pattern = boolean$1;
		inst._zod.parse = (payload, _ctx) => {
			if (def.coerce) try {
				payload.value = Boolean(payload.value);
			} catch (_) {}
			const input = payload.value;
			if (typeof input === "boolean") return payload;
			payload.issues.push({
				expected: "boolean",
				code: "invalid_type",
				input,
				inst
			});
			return payload;
		};
	});
	var $ZodUnknown = $constructor("$ZodUnknown", (inst, def) => {
		$ZodType.init(inst, def);
		inst._zod.parse = (payload) => payload;
	});
	function capSize(inst, size) {
		const caps = sizeCaps(inst._zod.def.checks);
		if (!caps.length) return;
		const cap = Math.min(...caps.map((c) => c[0]));
		const parse = inst._zod.parse;
		inst._zod.parse = (payload, ctx) => {
			const n = size(payload.value);
			if (n > cap && !ctx?.skipChecks && ctx?.direction !== "backward") {
				for (const [max, ch] of sizeCaps(inst._zod.def.checks)) if (n > max && ch._zod.def.when(payload)) {
					const start = payload.issues.length;
					ch._zod.check(payload);
					payload.issues[start].continue = false;
					attachSchema(payload.issues, start, inst);
					return payload;
				}
			}
			return parse(payload, ctx);
		};
	}
	var arraySize = (input) => Array.isArray(input) ? input.length : -1;
	function handleArrayResult(result, final, index) {
		if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
		final.value[index] = result.value;
	}
	var $ZodArray = $constructor("$ZodArray", (inst, def) => {
		$ZodType.init(inst, def);
		const memo = globalConfig.memoizer;
		memo?.attach(inst);
		inst._zod.parse = (payload, ctx) => {
			const input = payload.value;
			if (!Array.isArray(input)) {
				payload.issues.push({
					expected: "array",
					code: "invalid_type",
					input,
					inst
				});
				return payload;
			}
			payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
			const proms = [];
			const abortEarly = ctx?.abortEarly;
			for (let i = 0; i < input.length; i++) {
				const item = input[i];
				const result = def.element._zod.run({
					value: item,
					issues: []
				}, ctx);
				if (result instanceof Promise) proms.push(result.then((result) => handleArrayResult(result, payload, i)));
				else {
					handleArrayResult(result, payload, i);
					if (abortEarly && result.issues.length !== 0 && aborted(result)) break;
				}
			}
			if (proms.length) return Promise.all(proms).then(() => payload);
			return payload;
		};
		capSize(inst, arraySize);
	});
	function handlePropertyResult(result, final, key, input, optin, optout) {
		const isPresent = key in input;
		const isOptionalOut = optout === "optional";
		if (!isPresent && isOptionalOut && optin === "optional") return;
		if (result.issues.length) {
			if (optin !== void 0 && isOptionalOut && !isPresent) return;
			final.issues.push(...prefixIssues(key, result.issues));
		}
		if (!isPresent && optin === void 0) {
			if (!result.issues.length) final.issues.push({
				code: "invalid_type",
				expected: "nonoptional",
				input: void 0,
				path: [key]
			});
			return;
		}
		if (result.value === void 0) {
			if (isPresent || optin === "defaulted" && !isOptionalOut) final.value[key] = void 0;
		} else final.value[key] = result.value;
	}
	var NO_SYMBOL_KEYS = [];
	function normalizeDef(def) {
		const keys = Object.keys(def.shape);
		const ownSymbols = Object.getOwnPropertySymbols(def.shape);
		const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
		const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
		for (const k of allKeys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
		const okeys = optionalKeys(def.shape);
		return {
			...def,
			allKeys,
			symbolKeys,
			keySet: new Set(keys),
			numKeys: keys.length,
			optionalKeys: new Set(okeys)
		};
	}
	function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
		const unrecognized = [];
		const keySet = def.keySet;
		const _catchall = def.catchall._zod;
		const t = _catchall.def.type;
		const optin = _catchall.optin;
		const optout = _catchall.optout;
		let seen = 0;
		for (const key in input) {
			if (abortEarly && payload.issues.length !== seen) {
				if (aborted(payload, seen)) break;
				seen = payload.issues.length;
			}
			if (keySet.has(key)) continue;
			if (key === "__proto__") {
				if (t === "never") unrecognized.push(key);
				continue;
			}
			if (t === "never") {
				unrecognized.push(key);
				continue;
			}
			const r = _catchall.run({
				value: input[key],
				issues: []
			}, ctx);
			if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
			else handlePropertyResult(r, payload, key, input, optin, optout);
		}
		if (unrecognized.length) payload.issues.push({
			code: "unrecognized_keys",
			keys: unrecognized,
			input,
			inst,
			continue: true
		});
		if (!proms.length) return payload;
		return Promise.all(proms).then(() => {
			return payload;
		});
	}
	var $ZodObject = $constructor("$ZodObject", (inst, def) => {
		$ZodType.init(inst, def);
		const desc = Object.getOwnPropertyDescriptor(def, "shape");
		const sh = desc?.get ? desc.get.raw : def.shape ?? {};
		if (sh) {
			const get = () => {
				const newSh = { ...sh };
				Object.defineProperty(def, "shape", { value: newSh });
				get.raw = newSh;
				return newSh;
			};
			get.raw = sh;
			Object.defineProperty(def, "shape", { get });
		}
		const _normalized = cached(() => normalizeDef(def));
		defineLazyInternal(inst, "propValues", (zod) => {
			const shape = zod.def.shape;
			const propValues = {};
			for (const key in shape) {
				const field = shape[key]._zod;
				if (field.values) {
					if (!Object.prototype.hasOwnProperty.call(propValues, key)) assignProp(propValues, key, new Set());
					for (const v of field.values) propValues[key].add(v);
					if (field.optin !== void 0) propValues[key].add(void 0);
				}
			}
			return propValues;
		});
		const isObject$1 = isObject;
		const catchall = def.catchall;
		let value;
		const memo = globalConfig.memoizer;
		memo?.attach(inst);
		inst._zod.parse = (payload, ctx) => {
			value ?? (value = _normalized.value);
			const input = payload.value;
			if (!isObject$1(input)) {
				payload.issues.push({
					expected: "object",
					code: "invalid_type",
					input,
					inst
				});
				return payload;
			}
			payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
			const proms = [];
			const shape = value.shape;
			const abortEarly = ctx?.abortEarly;
			let seen = payload.issues.length;
			for (const key of value.allKeys) {
				if (abortEarly && payload.issues.length !== seen) {
					if (aborted(payload, seen)) break;
					seen = payload.issues.length;
				}
				if (key === "__proto__") continue;
				const el = shape[key];
				const optin = el._zod.optin;
				const optout = el._zod.optout;
				const r = el._zod.run({
					value: input[key],
					issues: []
				}, ctx);
				if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
				else handlePropertyResult(r, payload, key, input, optin, optout);
			}
			if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
			return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
		};
	});
	var $ZodRecord = $constructor("$ZodRecord", (inst, def) => {
		$ZodType.init(inst, def);
		const memo = globalConfig.memoizer;
		memo?.attach(inst);
		inst._zod.parse = (payload, ctx) => {
			const input = payload.value;
			if (!isPlainObject(input)) {
				payload.issues.push({
					expected: "record",
					code: "invalid_type",
					input,
					inst
				});
				return payload;
			}
			const proms = [];
			const values = def.keyType._zod.values;
			if (values && !def.partial) {
				payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
				const recordKeys = new Set();
				for (const key of values) if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
					recordKeys.add(typeof key === "number" ? key.toString() : key);
					if (key === "__proto__") continue;
					const keyResult = def.keyType._zod.run({
						value: key,
						issues: []
					}, ctx);
					if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
					if (keyResult.issues.length) {
						payload.issues.push({
							code: "invalid_key",
							origin: "record",
							issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
							input: key,
							path: [key],
							inst
						});
						continue;
					}
					const outKey = keyResult.value;
					if (outKey === "__proto__") continue;
					const result = def.valueType._zod.run({
						value: input[key],
						issues: []
					}, ctx);
					if (result instanceof Promise) proms.push(result.then((result) => {
						if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
						payload.value[outKey] = result.value;
					}));
					else {
						if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
						payload.value[outKey] = result.value;
					}
				}
				let unrecognized;
				for (const key in input) if (!recordKeys.has(key)) {
					if (def.mode === "loose") {
						if (key === "__proto__") continue;
						payload.value[key] = input[key];
					} else {
						unrecognized = unrecognized ?? [];
						unrecognized.push(key);
					}
				}
				if (unrecognized && unrecognized.length > 0) payload.issues.push({
					code: "unrecognized_keys",
					input,
					inst,
					keys: unrecognized,
					continue: true
				});
			} else {
				payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
				let unrecognized;
				for (const key of Reflect.ownKeys(input)) {
					if (key === "__proto__") continue;
					if (!Object.prototype.propertyIsEnumerable.call(input, key)) continue;
					let keyResult = def.keyType._zod.run({
						value: key,
						issues: []
					}, ctx);
					if (keyResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
					if (typeof key === "string" && number$1.test(key) && keyResult.issues.length) {
						const retryResult = def.keyType._zod.run({
							value: Number(key),
							issues: []
						}, ctx);
						if (retryResult instanceof Promise) throw new Error("Async schemas not supported in object keys currently");
						if (retryResult.issues.length === 0) keyResult = retryResult;
					}
					if (keyResult.issues.length) {
						if (def.mode === "loose") payload.value[key] = input[key];
						else if (values) {
							unrecognized = unrecognized ?? [];
							unrecognized.push(key);
						} else payload.issues.push({
							code: "invalid_key",
							origin: "record",
							issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
							input: key,
							path: [key],
							inst
						});
						continue;
					}
					const outKey = keyResult.value;
					if (outKey === "__proto__") continue;
					const result = def.valueType._zod.run({
						value: input[key],
						issues: []
					}, ctx);
					if (result instanceof Promise) proms.push(result.then((result) => {
						if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
						payload.value[outKey] = result.value;
					}));
					else {
						if (result.issues.length) payload.issues.push(...prefixIssues(key, result.issues));
						payload.value[outKey] = result.value;
					}
				}
				if (unrecognized && unrecognized.length > 0) payload.issues.push({
					code: "unrecognized_keys",
					input,
					inst,
					keys: unrecognized,
					continue: true
				});
			}
			if (proms.length) return Promise.all(proms).then(() => payload);
			return payload;
		};
	});
	var $ZodEnum = $constructor("$ZodEnum", (inst, def) => {
		$ZodType.init(inst, def);
		const values = getEnumValues(def.entries);
		const valuesSet = new Set(values);
		inst._zod.values = valuesSet;
		defineLazyInternal(inst, "pattern", (zod) => {
			const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
			return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
		});
		inst._zod.parse = (payload, _ctx) => {
			const input = payload.value;
			if (valuesSet.has(input)) return payload;
			payload.issues.push({
				code: "invalid_value",
				values,
				input,
				inst
			});
			return payload;
		};
	});
	var $ZodLiteral = $constructor("$ZodLiteral", (inst, def) => {
		$ZodType.init(inst, def);
		const values = new Set(def.values);
		inst._zod.values = values;
		defineLazyInternal(inst, "pattern", (zod) => {
			const vals = zod.def.values;
			return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
		});
		inst._zod.parse = (payload, _ctx) => {
			const input = payload.value;
			if (values.has(input)) return payload;
			payload.issues.push({
				code: "invalid_value",
				values: def.values,
				input,
				inst
			});
			return payload;
		};
	});
	function handleOptionalResult(payload, result) {
		payload.value = result.issues.length ? void 0 : result.value;
		return payload;
	}
	var $ZodOptional = $constructor("$ZodOptional", (inst, def) => {
		$ZodType.init(inst, def);
		defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
		inst._zod.optout = "optional";
		defineLazyInternal(inst, "values", (zod) => {
			const values = zod.def.innerType._zod.values;
			return values ? new Set([...values, void 0]) : void 0;
		});
		defineLazyInternal(inst, "pattern", (zod) => {
			const pattern = zod.def.innerType._zod.pattern;
			return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
		});
		inst._zod.parse = (payload, ctx) => {
			if (payload.value === void 0) {
				if (def.innerType._zod.optin !== "defaulted") return payload;
				const result = def.innerType._zod.run({
					value: payload.value,
					issues: []
				}, ctx);
				if (result instanceof Promise) return result.then((result) => handleOptionalResult(payload, result));
				return handleOptionalResult(payload, result);
			}
			return def.innerType._zod.run(payload, ctx);
		};
	});
	function snapshotChecks(def) {
		if (def.checks) def.checks = [...def.checks];
		return def;
	}
	function _string(Class, params) {
		return new Class(snapshotChecks({
			type: "string",
			...normalizeParams(params)
		}));
	}
	function _number(Class, params) {
		return new Class(snapshotChecks({
			type: "number",
			checks: [],
			...normalizeParams(params)
		}));
	}
	function _int(Class, params) {
		return new Class({
			type: "number",
			check: "number_format",
			abort: false,
			format: "safeint",
			...normalizeParams(params)
		});
	}
	function _boolean(Class, params) {
		return new Class({
			type: "boolean",
			...normalizeParams(params)
		});
	}
	function _unknown(Class) {
		return new Class({ type: "unknown" });
	}
	function _gt(value, params) {
		return new $ZodCheckGreaterThan({
			check: "greater_than",
			...normalizeParams(params),
			value,
			inclusive: false
		});
	}
	function _gte(value, params) {
		return new $ZodCheckGreaterThan({
			check: "greater_than",
			...normalizeParams(params),
			value,
			inclusive: true
		});
	}
	function _positive(params) {
		return _gt(0, params);
	}
	function _nonnegative(params) {
		return _gte(0, params);
	}
	function _minLength(minimum, params) {
		return new $ZodCheckMinLength({
			check: "min_length",
			...normalizeParams(params),
			minimum
		});
	}
	var ZodMiniType = $constructor("ZodMiniType", (inst, def) => {
		if (!inst._zod) throw new Error("Uninitialized schema in ZodMiniType.");
		$ZodType.init(inst, def);
		inst.def = def;
		inst.type = def.type;
	}, {
		get with() {
			return this.check;
		},
		set with(value) {
			own(this, "with", value);
		},
		parse(data, params) {
			return parse(this, data, params, { callee: this.parse });
		},
		parseAsync(data, params) {
			return parseAsync(this, data, params, { callee: this.parseAsync });
		},
		safeParse(data, params) {
			return safeParse(this, data, params);
		},
		safeParseAsync(data, params) {
			return safeParseAsync(this, data, params);
		},
		check(...checks) {
			const def = this.def;
			return this.clone({
				...def,
				checks: [...def.checks ?? [], ...checks.map((ch) => typeof ch === "function" ? { _zod: {
					check: ch,
					def: { check: "custom" },
					onattach: []
				} } : ch)]
			}, { parent: true });
		},
		clone(_def, params) {
			return clone(this, _def, params);
		},
		brand() {
			return this;
		},
		register(reg, meta) {
			reg.add(this, meta);
			return this;
		},
		apply(fn, ...args) {
			return args.length === 0 ? fn(this) : fn(this, ...args);
		}
	});
	var ZodMiniString = $constructor("ZodMiniString", (inst, def) => {
		$ZodString.init(inst, def);
		ZodMiniType.init(inst, def);
	});
	function string(params) {
		return _string(ZodMiniString, params);
	}
	var ZodMiniNumber = $constructor("ZodMiniNumber", (inst, def) => {
		$ZodNumber.init(inst, def);
		ZodMiniType.init(inst, def);
	});
	function number(params) {
		return _number(ZodMiniNumber, params);
	}
	var ZodMiniNumberFormat = $constructor("ZodMiniNumberFormat", (inst, def) => {
		$ZodNumberFormat.init(inst, def);
		ZodMiniNumber.init(inst, def);
	});
	function int(params) {
		return _int(ZodMiniNumberFormat, params);
	}
	var ZodMiniBoolean = $constructor("ZodMiniBoolean", (inst, def) => {
		$ZodBoolean.init(inst, def);
		ZodMiniType.init(inst, def);
	});
	function boolean(params) {
		return _boolean(ZodMiniBoolean, params);
	}
	var ZodMiniUnknown = $constructor("ZodMiniUnknown", (inst, def) => {
		$ZodUnknown.init(inst, def);
		ZodMiniType.init(inst, def);
	});
	function unknown() {
		return _unknown(ZodMiniUnknown);
	}
	var ZodMiniArray = $constructor("ZodMiniArray", (inst, def) => {
		$ZodArray.init(inst, def);
		ZodMiniType.init(inst, def);
	});
	function array(element, params) {
		return new ZodMiniArray({
			type: "array",
			element,
			...normalizeParams(params)
		});
	}
	var ZodMiniObject = $constructor("ZodMiniObject", (inst, def) => {
		$ZodObject.init(inst, def);
		ZodMiniType.init(inst, def);
		installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
	});
	function object(shape, params) {
		return new ZodMiniObject({
			type: "object",
			shape: shape ?? {},
			...normalizeParams(params)
		});
	}
	var ZodMiniRecord = $constructor("ZodMiniRecord", (inst, def) => {
		$ZodRecord.init(inst, def);
		ZodMiniType.init(inst, def);
	});
	function record(keyType, valueType, params) {
		if (!valueType || !valueType._zod) return new ZodMiniRecord({
			type: "record",
			keyType: string(),
			valueType: keyType,
			...normalizeParams(valueType)
		});
		return new ZodMiniRecord({
			type: "record",
			keyType,
			valueType,
			...normalizeParams(params)
		});
	}
	var ZodMiniEnum = $constructor("ZodMiniEnum", (inst, def) => {
		$ZodEnum.init(inst, def);
		ZodMiniType.init(inst, def);
		inst.options = [...inst._zod.values];
	});
	function _enum(values, params) {
		return new ZodMiniEnum({
			type: "enum",
			entries: Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values,
			...normalizeParams(params)
		});
	}
	var ZodMiniLiteral = $constructor("ZodMiniLiteral", (inst, def) => {
		$ZodLiteral.init(inst, def);
		ZodMiniType.init(inst, def);
	});
	function literal(value, params) {
		return new ZodMiniLiteral({
			type: "literal",
			values: Array.isArray(value) ? value : [value],
			...normalizeParams(params)
		});
	}
	var ZodMiniOptional = $constructor("ZodMiniOptional", (inst, def) => {
		$ZodOptional.init(inst, def);
		ZodMiniType.init(inst, def);
	});
	function optional(innerType) {
		return new ZodMiniOptional({
			type: "optional",
			innerType
		});
	}
	var UPDATES_ID_TOKEN_PATTERN = /^id:>(\d+)$/;
	var PLAYLIST_ID_TOKEN_PATTERN = /^id:(\d+)$/;
	function normalizeArtistTag(raw) {
		const trimmed = raw.trim().toLowerCase();
		if (trimmed.length === 0) return null;
		const withUnderscores = trimmed.replaceAll(" ", "_");
		if (/\s/.test(withUnderscores)) return null;
		if (withUnderscores === "(" || withUnderscores === ")" || withUnderscores === "~") return null;
		if (withUnderscores.startsWith("-")) return null;
		if (withUnderscores.length === 0) return null;
		return withUnderscores;
	}
	function parseTags(raw) {
		return raw.trim().split(/\s+/).filter((token) => token.length > 0).map((token) => {
			if (token.startsWith("-") && token.length > 1) return {
				tag: token.slice(1),
				type: TAG_TYPE_EXCLUDE
			};
			return {
				tag: token,
				type: TAG_TYPE_INCLUDE
			};
		});
	}
	function serialize(tags) {
		return tags.map((entry) => entry.type === "exclude" ? `-${entry.tag}` : entry.tag).join(" ");
	}
	function encodeSearchToken(raw) {
		return encodeURIComponent(raw).replaceAll("(", "%28").replaceAll(")", "%29");
	}
	function buildSearchUrl(tags) {
		const encoded = tags.map((entry) => {
			return encodeSearchToken(entry.type === "exclude" ? `-${entry.tag}` : entry.tag);
		}).join("+");
		const params = new URLSearchParams();
		params.set(SEARCH_PARAM_PAGE, SEARCH_PAGE);
		params.set("s", SEARCH_SECTION);
		return `${SITE_ORIGIN}${SEARCH_PATH}?${params.toString()}&${SEARCH_PARAM_TAGS}=${encoded}`;
	}
	function readTagsFromLocation(search) {
		const params = new URLSearchParams(search);
		const page = params.get(SEARCH_PARAM_PAGE);
		const section = params.get("s");
		const tagsRaw = params.get(SEARCH_PARAM_TAGS);
		if (page !== "post" || section !== "list") return null;
		if (tagsRaw === null || tagsRaw.trim().length === 0) return null;
		return parseTags(tagsRaw);
	}
	function formatGroupQuery(tags) {
		if (tags.length === 1) {
			const only = tags[0];
			return only === void 0 ? "" : only;
		}
		return `( ${tags.join(` ~ `)} )`;
	}
	function buildUpdatesQueries(artistTags, seenPostId, groupSize) {
		const normalized = [];
		for (const raw of artistTags) {
			const tag = normalizeArtistTag(raw);
			if (tag !== null) normalized.push(tag);
		}
		if (normalized.length === 0) return [];
		const groups = [];
		if (groupSize <= 0) groups.push(normalized);
		else for (let index = 0; index < normalized.length; index += groupSize) groups.push(normalized.slice(index, index + groupSize));
		return groups.map((group) => {
			const base = formatGroupQuery(group);
			if (seenPostId > 0) return `${base} ${UPDATES_ID_PREFIX}${String(seenPostId)}`;
			return base;
		});
	}
	function buildUpdatesSearchUrl(query) {
		return buildSearchUrl(parseTags(query));
	}
	function buildFeedQuery(artistTags, groupSize) {
		const first = buildUpdatesQueries(artistTags, 0, groupSize)[0];
		return first === void 0 ? "" : first;
	}
	function buildFeedUrl(artistTags, groupSize) {
		const query = buildFeedQuery(artistTags, groupSize);
		if (query.length === 0) return buildSearchUrl([]);
		return buildUpdatesSearchUrl(query);
	}
	function stripUpdatesIdFilter(tagsParam) {
		const tokens = tagsParam.trim().split(/\s+/).filter((token) => token.length > 0);
		if (tokens.length === 0) return "";
		const last = tokens[tokens.length - 1];
		if (last !== void 0 && UPDATES_ID_TOKEN_PATTERN.test(last)) return tokens.slice(0, -1).join(" ");
		return tokens.join(" ");
	}
	function trackedArtistSet(artistTags) {
		const tracked = new Set();
		for (const raw of artistTags) {
			const tag = normalizeArtistTag(raw);
			if (tag !== null) tracked.add(tag);
		}
		return tracked;
	}
	function parseUpdatesArtistQuery(tagsParam, tracked) {
		if (tracked.size === 0) return null;
		const tokens = tagsParam.trim().split(/\s+/).filter((token) => token.length > 0);
		if (tokens.length === 0) return null;
		let body = tokens;
		let hasIdFilter = false;
		const last = tokens[tokens.length - 1];
		if (last !== void 0 && UPDATES_ID_TOKEN_PATTERN.test(last)) {
			body = tokens.slice(0, -1);
			hasIdFilter = true;
		}
		if (body.some((token) => UPDATES_ID_TOKEN_PATTERN.test(token))) return null;
		if (body.length === 0) return null;
		const tags = [];
		if (body.length === 1) {
			const only = body[0];
			if (only === void 0) return null;
			const tag = normalizeArtistTag(only);
			if (tag === null || !tracked.has(tag)) return null;
			tags.push(tag);
			return {
				tags,
				hasIdFilter
			};
		}
		const first = body[0];
		const lastBody = body[body.length - 1];
		if (first !== "(" || lastBody !== ")") return null;
		const inner = body.slice(1, -1);
		if (inner.length === 0 || inner.length % 2 === 0) return null;
		for (let index = 0; index < inner.length; index += 1) {
			const token = inner[index];
			if (token === void 0) return null;
			if (index % 2 === 1) {
				if (token !== "~") return null;
				continue;
			}
			const tag = normalizeArtistTag(token);
			if (tag === null || !tracked.has(tag)) return null;
			if (tags.includes(tag)) return null;
			tags.push(tag);
		}
		return {
			tags,
			hasIdFilter
		};
	}
	function isExactTrackedSet(tags, tracked) {
		if (tags.length !== tracked.size) return false;
		for (const tag of tags) if (!tracked.has(tag)) return false;
		return true;
	}
	function isFullUpdatesQuery(tagsParam, artistTags) {
		const tracked = trackedArtistSet(artistTags);
		const parsed = parseUpdatesArtistQuery(tagsParam, tracked);
		if (parsed === null) return false;
		return isExactTrackedSet(parsed.tags, tracked);
	}
	function isPartialUpdatesQuery(tagsParam, artistTags) {
		const tracked = trackedArtistSet(artistTags);
		const parsed = parseUpdatesArtistQuery(tagsParam, tracked);
		if (parsed === null) return false;
		if (!parsed.hasIdFilter) return false;
		if (isExactTrackedSet(parsed.tags, tracked)) return false;
		return parsed.tags.length > 0 && parsed.tags.length < tracked.size;
	}
	function formatPlaylistIdToken(postId) {
		return `id:${String(postId)}`;
	}
	function formatPlaylistChunkQuery(ids) {
		if (ids.length === 1) {
			const only = ids[0];
			return only === void 0 ? "" : formatPlaylistIdToken(only);
		}
		return `( ${ids.map(formatPlaylistIdToken).join(` ~ `)} )`;
	}
	function buildPlaylistQueries(postIds, chunkSize) {
		const unique = new Set();
		for (const raw of postIds) {
			if (!Number.isFinite(raw)) continue;
			const id = Math.trunc(raw);
			if (id >= 0) unique.add(id);
		}
		const sorted = Array.from(unique).sort((a, b) => b - a);
		if (sorted.length === 0) return [];
		const chunks = [];
		if (chunkSize <= 0) chunks.push(sorted);
		else for (let index = 0; index < sorted.length; index += chunkSize) chunks.push(sorted.slice(index, index + chunkSize));
		return chunks.map(formatPlaylistChunkQuery);
	}
	function parsePlaylistQuery(tagsParam) {
		const tokens = tagsParam.trim().split(/\s+/).filter((token) => token.length > 0);
		if (tokens.length === 0) return null;
		if (tokens.length === 1) {
			const only = tokens[0];
			if (only === void 0) return null;
			const match = PLAYLIST_ID_TOKEN_PATTERN.exec(only);
			if (match === null) return null;
			const id = Number(match[1]);
			if (!Number.isFinite(id)) return null;
			return [id];
		}
		const first = tokens[0];
		const last = tokens[tokens.length - 1];
		if (first !== "(" || last !== ")") return null;
		const inner = tokens.slice(1, -1);
		if (inner.length === 0 || inner.length % 2 === 0) return null;
		const ids = [];
		for (let index = 0; index < inner.length; index += 1) {
			const token = inner[index];
			if (token === void 0) return null;
			if (index % 2 === 1) {
				if (token !== "~") return null;
				continue;
			}
			const match = PLAYLIST_ID_TOKEN_PATTERN.exec(token);
			if (match === null) return null;
			const id = Number(match[1]);
			if (!Number.isFinite(id)) return null;
			if (ids.includes(id)) return null;
			ids.push(id);
		}
		return ids;
	}
	var TagTypeSchema = _enum([TAG_TYPE_INCLUDE, TAG_TYPE_EXCLUDE]);
	var CollectionKindSchema = _enum([COLLECTION_KIND_SEARCH, COLLECTION_KIND_POSTS]);
	var TagEntrySchema = object({
		tag: string().check(_minLength(1)),
		type: TagTypeSchema
	});
	var CollectionSchema = object({
		id: string().check(_minLength(1)),
		name: string().check(_minLength(1)),
		tags: array(TagEntrySchema),
		kind: optional(CollectionKindSchema),
		postIds: optional(array(int()))
	});
	var ArtistEntrySchema = object({ tag: string().check(_minLength(1)) });
	var MarkFlagsSchema = object({
		fav: optional(boolean()),
		seen: optional(boolean())
	});
	var AppearanceSchema = object({
		theme: _enum([
			APPEARANCE_THEME_SITE,
			APPEARANCE_THEME_SITE_DARK,
			APPEARANCE_THEME_LIGHT,
			APPEARANCE_THEME_DARK,
			APPEARANCE_THEME_CUSTOM
		]),
		custom: optional(object({
			accent: string(),
			bg: string(),
			surface: string(),
			text: string(),
			backgroundImage: optional(string()),
			backgroundDim: optional(number())
		}))
	});
	var SettingsSchema = object({
		gridFavButtons: boolean(),
		updatesGroupSize: optional(int().check(_nonnegative())),
		playlistChunkSize: optional(int().check(_positive())),
		tweaksEnabled: optional(boolean()),
		features: optional(record(string(), boolean())),
		featureChoice: optional(record(string(), string())),
		featureState: optional(record(string(), unknown())),
		appearance: optional(AppearanceSchema)
	});
	var UpdatesSchema = object({ seenPostId: int().check(_nonnegative()) });
	var StorageSchema = object({
		version: literal(1),
		collections: array(CollectionSchema),
		artists: array(ArtistEntrySchema),
		marks: record(string(), MarkFlagsSchema),
		settings: optional(SettingsSchema),
		updates: optional(UpdatesSchema)
	});
	var FavsSyncSchema = object({
		nextPid: int(),
		lastPid: int(),
		startedAt: string(),
		finishedAt: optional(string())
	});
	var FavsSchema = object({
		version: literal(1),
		ids: array(int()),
		sync: optional(FavsSyncSchema)
	});
	var ExportBlobSchema = object({
		version: literal(1),
		collections: array(CollectionSchema),
		artists: array(ArtistEntrySchema),
		marks: record(string(), MarkFlagsSchema),
		settings: optional(SettingsSchema),
		updates: optional(UpdatesSchema),
		favIds: optional(array(int()))
	});
	function isPlaylist(collection) {
		return collection.kind === COLLECTION_KIND_POSTS;
	}
	function createDefaultFavs() {
		return {
			version: 1,
			ids: []
		};
	}
	function createDefaultAppearance() {
		return { theme: DEFAULT_APPEARANCE_THEME };
	}
	function createDefaultStorage() {
		return {
			version: 1,
			collections: [],
			artists: [],
			marks: {},
			settings: {
				gridFavButtons: true,
				updatesGroupSize: 0,
				tweaksEnabled: true,
				appearance: createDefaultAppearance()
			},
			updates: { seenPostId: 0 }
		};
	}
	function resolveAppearance(data) {
		return data.settings?.appearance ?? createDefaultAppearance();
	}
	function resolveGridFavButtons(data) {
		return data.settings?.gridFavButtons ?? true;
	}
	function resolveTweaksEnabled(data) {
		return data.settings?.tweaksEnabled ?? true;
	}
	function resolveUpdatesGroupSize(data) {
		return data.settings?.updatesGroupSize ?? 0;
	}
	function resolvePlaylistChunkSize(data) {
		return data.settings?.playlistChunkSize ?? 40;
	}
	function resolveSeenPostId(data) {
		return data.updates?.seenPostId ?? 0;
	}
	var cachedIds = null;
	var cachedSync;
	var cacheHydrated = false;
	function getGmGetValue$1() {
		return GM_getValue;
	}
	function getGmSetValue$1() {
		return GM_setValue;
	}
	function normalizePostId$1(id) {
		if (typeof id === "number") {
			if (!Number.isFinite(id)) return null;
			return Math.trunc(id);
		}
		const trimmed = id.trim();
		if (trimmed.length === 0) return null;
		const parsed = Number(trimmed);
		if (!Number.isFinite(parsed)) return null;
		return Math.trunc(parsed);
	}
	function readFavsRaw() {
		const raw = getGmGetValue$1()(FAVS_STORAGE_KEY, void 0);
		if (raw === void 0 || raw === null) return createDefaultFavs();
		const parsed = FavsSchema.safeParse(raw);
		if (!parsed.success) {
			log.error("Invalid favs storage content; using empty favs", { key: FAVS_STORAGE_KEY });
			return createDefaultFavs();
		}
		return parsed.data;
	}
	function writeFavsData(data) {
		const parsed = FavsSchema.parse(data);
		getGmSetValue$1()(FAVS_STORAGE_KEY, parsed);
	}
	function setCacheFromData(data) {
		cachedIds = new Set(data.ids);
		cachedSync = data.sync;
		cacheHydrated = true;
	}
	function readMainStorageRaw() {
		const raw = getGmGetValue$1()(STORAGE_KEY, void 0);
		if (raw === void 0 || raw === null) return null;
		const parsed = StorageSchema.safeParse(raw);
		if (!parsed.success) return null;
		return parsed.data;
	}
	function writeMainStorage(data) {
		getGmSetValue$1()(STORAGE_KEY, StorageSchema.parse(data));
	}
	function migrateMarksFavToFavs() {
		const main = readMainStorageRaw();
		const favs = readFavsRaw();
		const ids = new Set(favs.ids);
		let marksChanged = false;
		if (main !== null) {
			const nextMarks = {};
			for (const [postId, flags] of Object.entries(main.marks)) {
				const nextFlags = {};
				if (flags.seen === true) nextFlags.seen = true;
				if (flags.fav === true) {
					const normalized = normalizePostId$1(postId);
					if (normalized !== null) ids.add(normalized);
					marksChanged = true;
				} else if (flags.fav !== void 0) marksChanged = true;
				if (Object.keys(nextFlags).length > 0) nextMarks[postId] = nextFlags;
				else if (flags.fav === void 0 && flags.seen === void 0) nextMarks[postId] = {};
			}
			if (marksChanged) {
				main.marks = nextMarks;
				writeMainStorage(main);
			}
		}
		const nextFavs = {
			version: favs.version,
			ids: Array.from(ids)
		};
		if (favs.sync !== void 0) nextFavs.sync = favs.sync;
		if (nextFavs.ids.length !== favs.ids.length || nextFavs.ids.some((id) => !favs.ids.includes(id))) writeFavsData(nextFavs);
		setCacheFromData(nextFavs);
	}
	function ensureCache() {
		if (cacheHydrated && cachedIds !== null) return cachedIds;
		migrateMarksFavToFavs();
		if (cachedIds === null) setCacheFromData(readFavsRaw());
		return cachedIds ?? new Set();
	}
	function persistIds(ids) {
		const next = {
			version: createDefaultFavs().version,
			ids: Array.from(ids)
		};
		if (cachedSync !== void 0) next.sync = cachedSync;
		writeFavsData(next);
		cachedIds = ids;
		cacheHydrated = true;
	}
	function loadFavSet() {
		return ensureCache();
	}
	function isFav(id) {
		const normalized = normalizePostId$1(id);
		if (normalized === null) return false;
		return ensureCache().has(normalized);
	}
	function addFav(id) {
		const normalized = normalizePostId$1(id);
		if (normalized === null) return;
		const ids = new Set(ensureCache());
		if (ids.has(normalized)) {
			cachedIds = ids;
			return;
		}
		ids.add(normalized);
		persistIds(ids);
	}
	function removeFav(id) {
		const normalized = normalizePostId$1(id);
		if (normalized === null) return;
		const ids = new Set(ensureCache());
		if (!ids.has(normalized)) {
			cachedIds = ids;
			return;
		}
		ids.delete(normalized);
		persistIds(ids);
	}
	function addFavs(ids) {
		if (ids.length === 0) {
			ensureCache();
			return;
		}
		const next = new Set(ensureCache());
		let changed = false;
		for (const id of ids) {
			const normalized = normalizePostId$1(id);
			if (normalized === null) continue;
			if (!next.has(normalized)) {
				next.add(normalized);
				changed = true;
			}
		}
		if (changed) persistIds(next);
		else cachedIds = next;
	}
	function getSyncState() {
		ensureCache();
		return cachedSync;
	}
	function setSyncState(sync) {
		const ids = ensureCache();
		cachedSync = sync;
		const next = {
			version: createDefaultFavs().version,
			ids: Array.from(ids)
		};
		if (sync !== void 0) next.sync = sync;
		writeFavsData(next);
		cacheHydrated = true;
	}
	function extractFavIdsFromMarks(marks) {
		const favIds = [];
		const nextMarks = {};
		for (const [postId, flags] of Object.entries(marks)) {
			if (flags.fav === true) {
				const normalized = normalizePostId$1(postId);
				if (normalized !== null) favIds.push(normalized);
			}
			const nextFlags = {};
			if (flags.seen === true) nextFlags.seen = true;
			if (Object.keys(nextFlags).length > 0) nextMarks[postId] = nextFlags;
		}
		return {
			marks: nextMarks,
			favIds
		};
	}
	var cachedStorage = null;
	var storageCacheHydrated = false;
	function getGmGetValue() {
		return GM_getValue;
	}
	function getGmSetValue() {
		return GM_setValue;
	}
	function readRaw() {
		return getGmGetValue()(STORAGE_KEY, void 0);
	}
	function writeData(data) {
		getGmSetValue()(STORAGE_KEY, data);
	}
	function setStorageCache(data) {
		cachedStorage = data;
		storageCacheHydrated = true;
	}
	function clearStorageCache() {
		cachedStorage = null;
		storageCacheHydrated = false;
	}
	function loadUncached() {
		const raw = readRaw();
		if (raw === void 0 || raw === null) {
			migrateMarksFavToFavs();
			return createDefaultStorage();
		}
		const parsed = StorageSchema.safeParse(raw);
		if (!parsed.success) {
			backupInvalid(raw);
			migrateMarksFavToFavs();
			return createDefaultStorage();
		}
		migrateMarksFavToFavs();
		const after = readRaw();
		if (after === void 0 || after === null) return createDefaultStorage();
		const reparsed = StorageSchema.safeParse(after);
		if (!reparsed.success) return parsed.data;
		return reparsed.data;
	}
	function backupInvalid(raw) {
		getGmSetValue()(STORAGE_BACKUP_KEY, raw);
		log.error("Invalid storage content backed up", {
			key: STORAGE_KEY,
			backupKey: STORAGE_BACKUP_KEY
		});
	}
	function formatSchemaImportError(error) {
		const issue = error.issues[0];
		if (issue === void 0) return new Error(`${IMPORT_SCHEMA_ERROR_PREFIX}: (root): Invalid data`);
		const path = issue.path.length === 0 ? "(root)" : issue.path.map((segment) => String(segment)).join(".");
		return new Error(`${IMPORT_SCHEMA_ERROR_PREFIX}: ${path}: ${issue.message}`);
	}
	function currentSettings(data) {
		const next = {
			gridFavButtons: resolveGridFavButtons(data),
			updatesGroupSize: resolveUpdatesGroupSize(data),
			playlistChunkSize: resolvePlaylistChunkSize(data),
			tweaksEnabled: resolveTweaksEnabled(data)
		};
		if (data.settings?.features !== void 0) next.features = { ...data.settings.features };
		if (data.settings?.featureChoice !== void 0) next.featureChoice = { ...data.settings.featureChoice };
		if (data.settings?.featureState !== void 0) next.featureState = { ...data.settings.featureState };
		if (data.settings?.appearance !== void 0) next.appearance = data.settings.appearance;
		return next;
	}
	function normalizePostId(postId) {
		if (!Number.isFinite(postId)) return null;
		const truncated = Math.trunc(postId);
		if (truncated < 0) return null;
		return truncated;
	}
	function load() {
		if (storageCacheHydrated && cachedStorage !== null) return cachedStorage;
		const data = loadUncached();
		setStorageCache(data);
		return data;
	}
	function reloadFromStorage() {
		clearStorageCache();
		return load();
	}
	function save(data) {
		const parsed = StorageSchema.parse(data);
		writeData(parsed);
		migrateMarksFavToFavs();
		const after = readRaw();
		if (after === void 0 || after === null) {
			setStorageCache(createDefaultStorage());
			return;
		}
		const reparsed = StorageSchema.safeParse(after);
		if (!reparsed.success) {
			setStorageCache(parsed);
			return;
		}
		setStorageCache(reparsed.data);
	}
	function addCollection(name, tags) {
		const data = load();
		const collection = CollectionSchema.parse({
			id: crypto.randomUUID(),
			name: name.trim(),
			tags
		});
		data.collections.push(collection);
		save(data);
		return collection;
	}
	function renameCollection(id, name) {
		const data = load();
		const target = data.collections.find((item) => item.id === id);
		if (target === void 0) return null;
		target.name = name.trim();
		CollectionSchema.parse(target);
		save(data);
		return target;
	}
	function deleteCollection(id) {
		const data = load();
		const next = data.collections.filter((item) => item.id !== id);
		if (next.length === data.collections.length) return false;
		data.collections = next;
		save(data);
		return true;
	}
	function createPlaylist(name) {
		const data = load();
		const collection = CollectionSchema.parse({
			id: crypto.randomUUID(),
			name: name.trim(),
			tags: [],
			kind: COLLECTION_KIND_POSTS,
			postIds: []
		});
		data.collections.push(collection);
		save(data);
		return collection;
	}
	function listPlaylists() {
		return load().collections.filter(isPlaylist);
	}
	function playlistsContaining(postId) {
		const normalized = normalizePostId(postId);
		if (normalized === null) return [];
		return listPlaylists().filter((playlist) => (playlist.postIds ?? []).includes(normalized));
	}
	function addPostToPlaylist(id, postId) {
		const normalized = normalizePostId(postId);
		if (normalized === null) return null;
		const data = load();
		const target = data.collections.find((item) => item.id === id);
		if (target === void 0 || !isPlaylist(target)) return null;
		const postIds = [...target.postIds ?? []];
		if (!postIds.includes(normalized)) postIds.push(normalized);
		target.postIds = postIds;
		target.tags = [];
		target.kind = COLLECTION_KIND_POSTS;
		CollectionSchema.parse(target);
		save(data);
		return target;
	}
	function removePostFromPlaylist(id, postId) {
		const normalized = normalizePostId(postId);
		if (normalized === null) return null;
		const data = load();
		const target = data.collections.find((item) => item.id === id);
		if (target === void 0 || !isPlaylist(target)) return null;
		const previous = target.postIds ?? [];
		const postIds = previous.filter((entry) => entry !== normalized);
		if (postIds.length === previous.length) return target;
		target.postIds = postIds;
		target.tags = [];
		target.kind = COLLECTION_KIND_POSTS;
		CollectionSchema.parse(target);
		save(data);
		return target;
	}
	function setPostSeenMark(postId) {
		const data = load();
		const previous = data.marks[postId] ?? {};
		data.marks[postId] = {
			...previous,
			seen: true
		};
		save(data);
	}
	function getGridFavButtonsEnabled() {
		return resolveGridFavButtons(load());
	}
	function setGridFavButtonsEnabled(enabled) {
		const data = load();
		data.settings = {
			...currentSettings(data),
			gridFavButtons: enabled
		};
		save(data);
	}
	function getTweaksEnabled() {
		return resolveTweaksEnabled(load());
	}
	function setTweaksEnabled(enabled) {
		const data = load();
		data.settings = {
			...currentSettings(data),
			tweaksEnabled: enabled
		};
		save(data);
	}
	function getFeatureEnabled(id, defaultEnabled) {
		const stored = load().settings?.features?.[id];
		if (stored === void 0) return defaultEnabled;
		return stored;
	}
	function setFeatureEnabled(id, enabled) {
		const data = load();
		const settings = currentSettings(data);
		const features = {
			...settings.features ?? {},
			[id]: enabled
		};
		data.settings = {
			...settings,
			features
		};
		save(data);
	}
	function getFeatureChoiceValue(id) {
		return load().settings?.featureChoice?.[id];
	}
	function setFeatureChoiceValue(id, value) {
		const data = load();
		const settings = currentSettings(data);
		const featureChoice = {
			...settings.featureChoice ?? {},
			[id]: value
		};
		data.settings = {
			...settings,
			featureChoice
		};
		save(data);
	}
	function getFeatureState(id) {
		return load().settings?.featureState?.[id];
	}
	function setFeatureState(id, value) {
		const data = load();
		const settings = currentSettings(data);
		const featureState = {
			...settings.featureState ?? {},
			[id]: value
		};
		data.settings = {
			...settings,
			featureState
		};
		save(data);
	}
	function getUpdatesGroupSize() {
		return resolveUpdatesGroupSize(load());
	}
	function setUpdatesGroupSize(size) {
		const data = load();
		const safeSize = Number.isFinite(size) && size >= 0 ? Math.floor(size) : 0;
		data.settings = {
			...currentSettings(data),
			updatesGroupSize: safeSize
		};
		save(data);
	}
	function getPlaylistChunkSize() {
		return resolvePlaylistChunkSize(load());
	}
	function setPlaylistChunkSize(size) {
		const data = load();
		const safeSize = Number.isFinite(size) && size > 0 ? Math.floor(size) : 40;
		data.settings = {
			...currentSettings(data),
			playlistChunkSize: safeSize
		};
		save(data);
	}
	function getAppearance() {
		return resolveAppearance(load());
	}
	function getAppearanceBackgroundDataUrl() {
		const raw = getGmGetValue()(APPEARANCE_BACKGROUND_KEY, void 0);
		if (typeof raw !== "string" || raw.length === 0) return;
		return raw;
	}
	function getSeenPostId() {
		return resolveSeenPostId(load());
	}
	function setSeenPostId(seenPostId) {
		const data = load();
		data.updates = { seenPostId: Number.isFinite(seenPostId) && seenPostId >= 0 ? Math.floor(seenPostId) : 0 };
		save(data);
	}
	function listArtistTags() {
		return load().artists.map((entry) => entry.tag);
	}
	function isFollowingArtist(tag) {
		const normalized = normalizeArtistTag(tag);
		if (normalized === null) return false;
		return listArtistTags().includes(normalized);
	}
	function addArtist(tag) {
		const normalized = normalizeArtistTag(tag);
		if (normalized === null) throw new Error("Invalid artist tag");
		const data = load();
		if (data.artists.some((entry) => entry.tag === normalized)) throw new Error("Duplicate artist tag");
		const entry = ArtistEntrySchema.parse({ tag: normalized });
		data.artists.push(entry);
		save(data);
		return entry;
	}
	function removeArtist(tag) {
		const normalized = normalizeArtistTag(tag);
		if (normalized === null) return false;
		const data = load();
		const next = data.artists.filter((entry) => entry.tag !== normalized);
		if (next.length === data.artists.length) return false;
		data.artists = next;
		save(data);
		return true;
	}
	function exportJson() {
		const data = load();
		const favIds = Array.from(loadFavSet()).sort((a, b) => a - b);
		const blob = {
			...data,
			favIds
		};
		return `${JSON.stringify(blob, null, 2)}\n`;
	}
	function mergeCollections(current, incoming) {
		const byId = new Map();
		for (const item of current) byId.set(item.id, item);
		for (const item of incoming) byId.set(item.id, item);
		return Array.from(byId.values());
	}
	function mergeArtists(current, incoming) {
		const byTag = new Map();
		for (const item of current) byTag.set(item.tag, item);
		for (const item of incoming) byTag.set(item.tag, item);
		return Array.from(byTag.values());
	}
	function mergeStringRecord(current, incoming) {
		if (incoming === void 0 && current === void 0) return;
		return {
			...current ?? {},
			...incoming ?? {}
		};
	}
	function mergeBooleanRecord(current, incoming) {
		if (incoming === void 0 && current === void 0) return;
		return {
			...current ?? {},
			...incoming ?? {}
		};
	}
	function mergeUnknownRecord(current, incoming) {
		if (incoming === void 0 && current === void 0) return;
		return {
			...current ?? {},
			...incoming ?? {}
		};
	}
	function mergeMarks(current, incoming) {
		const merged = { ...current };
		for (const [postId, flags] of Object.entries(incoming)) merged[postId] = {
			...merged[postId] ?? {},
			...flags
		};
		return merged;
	}
	function mergeSettings(current, incoming) {
		if (incoming === void 0) return current;
		if (current === void 0) return incoming;
		const merged = {
			gridFavButtons: incoming.gridFavButtons,
			updatesGroupSize: incoming.updatesGroupSize ?? current.updatesGroupSize,
			playlistChunkSize: incoming.playlistChunkSize ?? current.playlistChunkSize
		};
		if (incoming.tweaksEnabled !== void 0) merged.tweaksEnabled = incoming.tweaksEnabled;
		else if (current.tweaksEnabled !== void 0) merged.tweaksEnabled = current.tweaksEnabled;
		const features = mergeBooleanRecord(current.features, incoming.features);
		if (features !== void 0) merged.features = features;
		const featureChoice = mergeStringRecord(current.featureChoice, incoming.featureChoice);
		if (featureChoice !== void 0) merged.featureChoice = featureChoice;
		const featureState = mergeUnknownRecord(current.featureState, incoming.featureState);
		if (featureState !== void 0) merged.featureState = featureState;
		if (incoming.appearance !== void 0) merged.appearance = incoming.appearance;
		else if (current.appearance !== void 0) merged.appearance = current.appearance;
		return merged;
	}
	function mergeUpdates(current, incoming) {
		const currentSeen = current?.seenPostId ?? 0;
		const incomingSeen = incoming?.seenPostId ?? 0;
		return { seenPostId: Math.max(currentSeen, incomingSeen) };
	}
	function importJson(raw) {
		let json;
		try {
			json = JSON.parse(raw);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Invalid JSON";
			throw new Error(message);
		}
		const parsed = ExportBlobSchema.safeParse(json);
		if (!parsed.success) throw formatSchemaImportError(parsed.error);
		const incoming = parsed.data;
		const fromMarks = extractFavIdsFromMarks(incoming.marks);
		const favIdsToMerge = new Set(fromMarks.favIds);
		if (incoming.favIds !== void 0) for (const id of incoming.favIds) favIdsToMerge.add(id);
		const current = load();
		const merged = {
			version: current.version,
			collections: mergeCollections(current.collections, incoming.collections),
			artists: mergeArtists(current.artists, incoming.artists),
			marks: mergeMarks(current.marks, fromMarks.marks),
			settings: mergeSettings(current.settings, incoming.settings),
			updates: mergeUpdates(current.updates, incoming.updates)
		};
		if (merged.settings === void 0) merged.settings = {
			gridFavButtons: true,
			updatesGroupSize: 0,
			playlistChunkSize: 40,
			tweaksEnabled: true
		};
		save(merged);
		addFavs(Array.from(favIdsToMerge));
		return merged;
	}
	var SITE_SELECTORS = {
		thumb: "span.thumb",
		thumbLink: "a[href*=\"s=view\"]",
		previewImage: "img.preview",
		cardFavButton: `button.${CSS_CLASS.cardFav}`,
		favoritesDeleteLink: "a[onclick]",
		tagSidebar: "ul#tag-sidebar",
		tagTypeArtist: "li.tag-type-artist",
		imageList: "div.image-list",
		postListContent: "#post-list div.content",
		contentRoot: "#content",
		artistFollowButton: `button.${CSS_CLASS.artistFollow}`
	};
	var THUMB_ID_PATTERN = /^s(\d+)$/;
	var FAVORITES_DELETE_ID_PATTERN = /s=delete&id=(\d+)/;
	function extractPostIdFromThumb(thumb) {
		const match = THUMB_ID_PATTERN.exec(thumb.id);
		if (match === null) return null;
		const postId = match[1];
		return postId === void 0 ? null : postId;
	}
	function extractPostIdFromFavoritesDeleteOnclick(onclick) {
		const match = FAVORITES_DELETE_ID_PATTERN.exec(onclick);
		if (match === null) return null;
		const postId = match[1];
		return postId === void 0 ? null : postId;
	}
	var THUMB_CLASS = "rdw-thumb";
	var THUMB_ANCHOR_NAME = "--rdw-img";
	var FEATURE_STYLE_ID_PREFIX = "rdw-feature-style-";
	var POST_ACTIONS_ID = "rdw-post-actions";
	function featureBodyClass(id) {
		return `rdw-f-${id}`;
	}
	function featureChoiceBodyClass(id, value) {
		return `rdw-f-${id}-${value}`;
	}
	var BASE_GRID_CSS = `
.${THUMB_CLASS} {
  position: relative;
  anchor-scope: ${THUMB_ANCHOR_NAME};
}

.${THUMB_CLASS} img.preview {
  anchor-name: ${THUMB_ANCHOR_NAME};
}
`;
	function ensureThumbAnchor(thumb) {
		thumb.classList.add(THUMB_CLASS);
	}
	function buildAddFavUrl(postId) {
		const params = new URLSearchParams();
		params.set("id", postId);
		return `${SITE_ORIGIN}${ADDFAV_PATH}?${params.toString()}`;
	}
	function buildVoteUrl(postId) {
		const params = new URLSearchParams();
		params.set(VOTE_PARAM_PAGE, VOTE_PAGE);
		params.set("s", VOTE_SECTION);
		params.set("id", postId);
		params.set(VOTE_PARAM_TYPE, "up");
		return `${SITE_ORIGIN}${VOTE_PATH}?${params.toString()}`;
	}
	function buildRemoveFavUrl(postId) {
		const params = new URLSearchParams();
		params.set(SEARCH_PARAM_PAGE, FAVORITES_PAGE);
		params.set("s", FAVORITES_SECTION_DELETE);
		params.set("id", postId);
		params.set(FAVORITES_PARAM_RETURN_PID, "0");
		return `${SITE_ORIGIN}${SEARCH_PATH}?${params.toString()}`;
	}
	async function fetchText(url) {
		const response = await fetch(url, {
			method: "GET",
			credentials: FETCH_CREDENTIALS
		});
		if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
		return (await response.text()).trim();
	}
	function parseVoteScore(raw) {
		if (raw.length === 0) return;
		const score = Number(raw);
		if (!Number.isFinite(score)) return;
		return score;
	}
	async function addFavorite(postId) {
		let addResponse;
		try {
			addResponse = await fetchText(buildAddFavUrl(postId));
		} catch (error) {
			log.warn("addfav request failed", postId, error);
			return { status: "error" };
		}
		if (addResponse === "1") return { status: "already" };
		if (addResponse === "2") return { status: "not_logged_in" };
		if (addResponse !== "3") {
			log.warn("Unexpected addfav response", postId, addResponse);
			return { status: "error" };
		}
		try {
			const score = await voteUp(postId);
			if (score === null) return { status: "added" };
			return {
				status: "added",
				score
			};
		} catch (error) {
			log.warn("vote request failed after addfav", postId, error);
			return { status: "added" };
		}
	}
	async function voteUp(postId) {
		try {
			const score = parseVoteScore(await fetchText(buildVoteUrl(postId)));
			return score === void 0 ? null : score;
		} catch (error) {
			log.warn("vote request failed", postId, error);
			return null;
		}
	}
	async function removeFavorite(postId) {
		try {
			const response = await fetch(buildRemoveFavUrl(postId), {
				method: "GET",
				credentials: FETCH_CREDENTIALS
			});
			if (!response.ok) {
				log.warn("remove favorite HTTP error", postId, response.status);
				return { status: "error" };
			}
			return { status: "removed" };
		} catch (error) {
			log.warn("remove favorite request failed", postId, error);
			return { status: "error" };
		}
	}
	function favAriaLabel(postId, marked) {
		return `${marked ? UI_TEXT.cardFavRemoveLabel : UI_TEXT.cardFavAddLabel} ${postId}`;
	}
	function applyFavButtonState(button, state, postId, errorTitle) {
		if (state === "pending") {
			button.disabled = true;
			button.classList.add(CSS_CLASS.cardFavPending);
			return;
		}
		button.classList.remove(CSS_CLASS.cardFavMarked, CSS_CLASS.cardFavError, CSS_CLASS.cardFavPending);
		button.disabled = false;
		button.removeAttribute("title");
		if (state === "marked") {
			button.setAttribute("aria-pressed", "true");
			button.setAttribute("aria-label", favAriaLabel(postId, true));
			button.classList.add(CSS_CLASS.cardFavMarked);
			return;
		}
		if (state === "marked_error") {
			button.setAttribute("aria-pressed", "true");
			button.setAttribute("aria-label", favAriaLabel(postId, true));
			button.classList.add(CSS_CLASS.cardFavMarked, CSS_CLASS.cardFavError);
			button.title = errorTitle ?? UI_TEXT.cardFavErrorRequest;
			return;
		}
		if (state === "error") {
			button.setAttribute("aria-pressed", "false");
			button.setAttribute("aria-label", favAriaLabel(postId, false));
			button.classList.add(CSS_CLASS.cardFavError);
			button.title = errorTitle ?? UI_TEXT.cardFavErrorRequest;
			return;
		}
		button.setAttribute("aria-pressed", "false");
		button.setAttribute("aria-label", favAriaLabel(postId, false));
	}
	function createFavButton(postId, marked, className = CSS_CLASS.cardFav) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = className;
		button.textContent = UI_TEXT.cardFavGlyph;
		applyFavButtonState(button, marked ? "marked" : "idle", postId);
		button.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			handleFavToggleClick(button, postId);
		});
		return button;
	}
	async function handleFavToggleClick(button, postId) {
		if (button.disabled) return;
		const currentlyMarked = button.getAttribute("aria-pressed") === "true";
		applyFavButtonState(button, "pending", postId);
		if (currentlyMarked) {
			const result = await removeFavorite(postId);
			if (result.status === "removed") {
				removeFav(postId);
				applyFavButtonState(button, "idle", postId);
				return;
			}
			applyFavButtonState(button, "marked_error", postId, UI_TEXT.cardFavErrorRequest);
			log.warn("Remove favorite failed", postId, result);
			return;
		}
		const result = await addFavorite(postId);
		if (result.status === "added" || result.status === "already") {
			addFav(postId);
			applyFavButtonState(button, "marked", postId);
			return;
		}
		if (result.status === "not_logged_in") {
			applyFavButtonState(button, "error", postId, UI_TEXT.cardFavErrorNotLoggedIn);
			log.warn("Favorite requires login", postId);
			return;
		}
		applyFavButtonState(button, "error", postId, UI_TEXT.cardFavErrorRequest);
		log.warn("Favorite failed", postId, result);
	}
	var COOKIE_PAIR_SEPARATOR$1 = ";";
	var COOKIE_NAME_VALUE_SEPARATOR$1 = "=";
	var BLACKLIST_SPLIT_PATTERN = /[, ]|%20+/g;
	var USER_ENTRY_PREFIX = "user:";
	var RATING_ENTRY_PREFIX = "rating:";
	var MS_PER_DAY$1 = 864e5;
	var DAYS_PER_YEAR = 365;
	var BLACKLIST_TAG_SEPARATOR = " ";
	function readCookieValue$1(name) {
		const pairs = document.cookie.split(COOKIE_PAIR_SEPARATOR$1);
		const prefix = `${name}${COOKIE_NAME_VALUE_SEPARATOR$1}`;
		for (const pair of pairs) {
			const trimmed = pair.trim();
			if (!trimmed.startsWith(prefix)) continue;
			return trimmed.slice(prefix.length);
		}
		return null;
	}
	function normalizeBlacklistTags(tags) {
		const seen = new Set();
		const result = [];
		for (const raw of tags) {
			const normalized = raw.trim().toLowerCase().replaceAll(" ", "_");
			if (normalized.length === 0 || seen.has(normalized)) continue;
			seen.add(normalized);
			result.push(normalized);
		}
		return result;
	}
	function encodeBlacklistCookieValue(tags) {
		if (tags.length === 0) return "";
		return encodeURIComponent(encodeURIComponent(tags.join(BLACKLIST_TAG_SEPARATOR)));
	}
	function writeBlacklistCookie(value, expires) {
		document.cookie = [
			`${SITE_BLACKLIST_COOKIE_NAME}${COOKIE_NAME_VALUE_SEPARATOR$1}${value}`,
			`expires=${expires.toUTCString()}`,
			`path=/`
		].join("; ");
	}
	function readSiteBlacklist() {
		const raw = readCookieValue$1(SITE_BLACKLIST_COOKIE_NAME);
		if (raw === null || raw.length === 0) return [];
		let decoded;
		try {
			decoded = decodeURIComponent(decodeURI(raw));
		} catch {
			return [];
		}
		const result = [];
		for (const part of decoded.split(BLACKLIST_SPLIT_PATTERN)) {
			const trimmed = part.trim().toLowerCase();
			if (trimmed.length === 0) continue;
			result.push(trimmed);
		}
		return result;
	}
	function writeSiteBlacklist(tags) {
		const normalized = normalizeBlacklistTags(tags);
		const expires = new Date(Date.now() + 5 * DAYS_PER_YEAR * MS_PER_DAY$1);
		writeBlacklistCookie(encodeBlacklistCookieValue(normalized), expires);
	}
	function isBlacklisted(tags, score, rating, list) {
		if (list.length === 0) return false;
		const tagSet = new Set();
		for (const tag of tags) {
			const normalized = tag.trim().toLowerCase();
			if (normalized.length > 0) tagSet.add(normalized);
		}
		const ratingNorm = rating.trim().toLowerCase();
		for (const entry of list) {
			if (entry.startsWith(USER_ENTRY_PREFIX)) continue;
			if (entry.startsWith(RATING_ENTRY_PREFIX)) {
				const value = entry.slice(7);
				if (value.length > 0 && value === ratingNorm) return true;
				continue;
			}
			if (tagSet.has(entry)) return true;
		}
		return false;
	}
	var SECTION_CLASS$1 = "rdw-blacklist";
	var CHIPS_CLASS$1 = "rdw-blacklist-chips";
	var CHIP_CLASS$1 = "rdw-blacklist-chip";
	var CHIP_LABEL_CLASS$1 = "rdw-blacklist-chip-label";
	var CHIP_REMOVE_CLASS$1 = "rdw-blacklist-chip-remove";
	var ADD_ROW_CLASS = "rdw-blacklist-add-row";
	var SAVED_ROW_CLASS = "rdw-blacklist-saved-row";
	var HINT_CLASS = "rdw-blacklist-hint";
	var HEADING$1 = "Blacklist";
	var ADD_LABEL = "Add tag";
	var ADD_BUTTON = "Add";
	var SAVED_TEXT = "Saved. Reload the page to apply.";
	var RELOAD_BUTTON = "Reload";
	var PERMANENT_HINT = "Stored in this browser's site cookie. The list in your account settings is not changed and may overwrite this one after you log in again.";
	var REMOVE_ARIA = (tag) => `Remove ${tag} from blacklist`;
	var ADD_INPUT_ID = "rdw-blacklist-add";
	var TAG_SPLIT_PATTERN = /[, ]+/;
	var KEY_ENTER$2 = "Enter";
	var REMOVE_SYMBOL = "×";
	var BLACKLIST_SECTION_CSS = `
.${SECTION_CLASS$1} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.${SECTION_CLASS$1} .${CHIPS_CLASS$1} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.${SECTION_CLASS$1} .${CHIP_CLASS$1} {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 2px 4px 2px 8px;
  border: 1px solid var(--rdw-border, #ccc);
  border-radius: 999px;
  background: var(--rdw-bg-item, #fff);
}

.${SECTION_CLASS$1} .${CHIP_LABEL_CLASS$1} {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}

.${SECTION_CLASS$1} .${CHIP_REMOVE_CLASS$1} {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--rdw-fg-muted, #555);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.${SECTION_CLASS$1} .${CHIP_REMOVE_CLASS$1}:focus-visible {
  outline: 2px solid var(--rdw-focus, #4c8bf5);
  outline-offset: 1px;
}

.${SECTION_CLASS$1} .${ADD_ROW_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-end;
}

.${SECTION_CLASS$1} .${ADD_ROW_CLASS} .${CSS_CLASS.field} {
  flex: 1 1 12rem;
  margin: 0;
}

.${SECTION_CLASS$1} .${SAVED_ROW_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.${SECTION_CLASS$1} .${SAVED_ROW_CLASS} .${CSS_CLASS.hint} {
  margin: 0;
}

.${SECTION_CLASS$1} .${HINT_CLASS} {
  margin: 0;
  color: var(--rdw-fg-muted, #555);
  font-size: 12px;
}
`.trim();
	function parseAddTokens(raw) {
		const result = [];
		for (const part of raw.split(TAG_SPLIT_PATTERN)) {
			const trimmed = part.trim();
			if (trimmed.length === 0) continue;
			result.push(trimmed);
		}
		return result;
	}
	function persistTags(tags) {
		writeSiteBlacklist([...tags]);
		return readSiteBlacklist();
	}
	function renderChips$1(refs, tags) {
		refs.chips.replaceChildren();
		for (const tag of tags) {
			const item = document.createElement("li");
			item.className = CHIP_CLASS$1;
			const label = document.createElement("span");
			label.className = CHIP_LABEL_CLASS$1;
			label.textContent = tag;
			const removeBtn = document.createElement("button");
			removeBtn.type = "button";
			removeBtn.className = CHIP_REMOVE_CLASS$1;
			removeBtn.textContent = REMOVE_SYMBOL;
			removeBtn.setAttribute("aria-label", REMOVE_ARIA(tag));
			removeBtn.addEventListener("click", () => {
				renderChips$1(refs, persistTags(readSiteBlacklist().filter((entry) => entry !== tag)));
			});
			item.append(label, removeBtn);
			refs.chips.append(item);
		}
	}
	function addFromInput(refs) {
		const tokens = parseAddTokens(refs.input.value);
		if (tokens.length === 0) return;
		renderChips$1(refs, persistTags([...readSiteBlacklist(), ...tokens]));
		refs.input.value = "";
	}
	function createBlacklistSection() {
		const section = document.createElement("section");
		section.className = `${CSS_CLASS.section} ${SECTION_CLASS$1}`;
		const title = document.createElement("h3");
		title.className = CSS_CLASS.sectionTitle;
		title.textContent = HEADING$1;
		const chips = document.createElement("ul");
		chips.className = CHIPS_CLASS$1;
		const addRow = document.createElement("div");
		addRow.className = ADD_ROW_CLASS;
		const field = document.createElement("div");
		field.className = CSS_CLASS.field;
		const label = document.createElement("label");
		label.className = CSS_CLASS.label;
		label.htmlFor = ADD_INPUT_ID;
		label.textContent = ADD_LABEL;
		const input = document.createElement("input");
		input.id = ADD_INPUT_ID;
		input.className = CSS_CLASS.input;
		input.type = "text";
		input.autocomplete = "off";
		input.spellcheck = false;
		field.append(label, input);
		const addBtn = document.createElement("button");
		addBtn.type = "button";
		addBtn.className = CSS_CLASS.primaryButton;
		addBtn.textContent = ADD_BUTTON;
		addRow.append(field, addBtn);
		const savedRow = document.createElement("div");
		savedRow.className = SAVED_ROW_CLASS;
		const savedText = document.createElement("p");
		savedText.className = CSS_CLASS.hint;
		savedText.textContent = SAVED_TEXT;
		const reloadBtn = document.createElement("button");
		reloadBtn.type = "button";
		reloadBtn.className = CSS_CLASS.secondaryButton;
		reloadBtn.textContent = RELOAD_BUTTON;
		reloadBtn.addEventListener("click", () => {
			window.location.reload();
		});
		savedRow.append(savedText, reloadBtn);
		const hint = document.createElement("p");
		hint.className = HINT_CLASS;
		hint.textContent = PERMANENT_HINT;
		section.append(title, chips, addRow, savedRow, hint);
		const refs = {
			chips,
			input
		};
		renderChips$1(refs, readSiteBlacklist());
		addBtn.addEventListener("click", () => {
			addFromInput(refs);
		});
		input.addEventListener("keydown", (event) => {
			if (event.key !== KEY_ENTER$2) return;
			event.preventDefault();
			addFromInput(refs);
		});
		return section;
	}
	var TAB_CLASS = "rdw-collections-tab";
	var SECTION_HEADING_CLASS = "rdw-collections-heading";
	var PLAYLIST_META_CLASS = "rdw-playlist-meta";
	var PLAYLIST_PARTS_CLASS = "rdw-playlist-parts";
	var PLAYLIST_PART_CLASS = "rdw-playlist-part";
	var ROW_MAIN_CLASS = "rdw-collections-row-main";
	var SAVED_SEARCHES_HEADING = "Saved searches";
	var PLAYLISTS_HEADING = "Playlists";
	var EMPTY_SAVED_SEARCHES = "No saved searches yet.";
	var EMPTY_PLAYLISTS = "No playlists yet.";
	var EMPTY_PLAYLISTS_HINT = "Use the + button on a post";
	var NEW_PLAYLIST = "New playlist";
	var OPEN_PLAYLIST = "Open playlist";
	var SAVE_NAME_ID = "rdw-save-name";
	var PLAYLIST_NAME_ID = "rdw-playlist-name";
	var COLLECTIONS_TAB_CSS = `
.${TAB_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.${TAB_CLASS} .${SECTION_HEADING_CLASS} {
  margin: 0;
}

.${TAB_CLASS} .${ROW_MAIN_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.${TAB_CLASS} .${PLAYLIST_META_CLASS} {
  margin: 0;
  color: var(--rdw-fg-muted, #555);
  font-size: 12px;
}

.${TAB_CLASS} .${PLAYLIST_PARTS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}

.${TAB_CLASS} .${PLAYLIST_PART_CLASS} {
  color: var(--rdw-link, #0b57d0);
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
}

.${TAB_CLASS} .${PLAYLIST_PART_CLASS}:focus-visible {
  outline: 2px solid var(--rdw-focus, #4c8bf5);
  outline-offset: 2px;
}

.${TAB_CLASS} .${CSS_CLASS.itemName}:disabled {
  color: var(--rdw-fg-muted, #555);
  cursor: not-allowed;
}
`.trim();
	var mode = { kind: "list" };
	var nameDraft = "";
	function postsLabel(count) {
		return `${String(count)} post${count === 1 ? "" : "s"}`;
	}
	function listSavedSearches() {
		return load().collections.filter((entry) => !isPlaylist(entry));
	}
	function playlistPostCount(playlist) {
		return playlist.postIds?.length ?? 0;
	}
	function openSearch(collection) {
		window.location.assign(buildSearchUrl(collection.tags));
	}
	function openPlaylistPart(query) {
		window.location.assign(buildUpdatesSearchUrl(query));
	}
	function buildNameForm(inputId, onSubmit, onCancel, render) {
		const form = document.createElement("form");
		form.className = CSS_CLASS.form;
		const field = document.createElement("div");
		field.className = CSS_CLASS.field;
		const label = document.createElement("label");
		label.className = CSS_CLASS.label;
		label.htmlFor = inputId;
		label.textContent = UI_TEXT.nameLabel;
		const input = document.createElement("input");
		input.id = inputId;
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
			onCancel();
			render();
		});
		actions.append(saveBtn, cancelBtn);
		form.append(field, actions);
		form.addEventListener("submit", (event) => {
			event.preventDefault();
			onSubmit();
		});
		queueMicrotask(() => {
			input.focus();
			input.select();
		});
		return form;
	}
	function buildConfirmDelete(collection, render) {
		const fragment = document.createDocumentFragment();
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
			nameDraft = "";
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
		fragment.append(prompt, actions);
		return fragment;
	}
	function buildRenameDeleteActions(collection, render) {
		const actions = document.createElement("div");
		actions.className = CSS_CLASS.itemActions;
		const renameBtn = document.createElement("button");
		renameBtn.type = "button";
		renameBtn.className = CSS_CLASS.iconButton;
		renameBtn.textContent = UI_TEXT.rename;
		renameBtn.setAttribute("aria-label", `${UI_TEXT.rename}: ${collection.name}`);
		renameBtn.addEventListener("click", () => {
			nameDraft = collection.name;
			mode = {
				kind: "rename",
				id: collection.id
			};
			render();
		});
		const deleteBtn = document.createElement("button");
		deleteBtn.type = "button";
		deleteBtn.className = CSS_CLASS.iconButton;
		deleteBtn.textContent = UI_TEXT.delete;
		deleteBtn.setAttribute("aria-label", `${UI_TEXT.delete}: ${collection.name}`);
		deleteBtn.addEventListener("click", () => {
			mode = {
				kind: "confirm-delete",
				id: collection.id
			};
			render();
		});
		actions.append(renameBtn, deleteBtn);
		return actions;
	}
	function buildSavedSearchRow(collection, render) {
		const item = document.createElement("li");
		item.className = CSS_CLASS.listItem;
		if (mode.kind === "rename" && mode.id === collection.id) {
			item.append(buildNameForm(`rdw-rename-${collection.id}`, () => {
				const nextName = nameDraft.trim();
				if (nextName.length === 0) return;
				renameCollection(collection.id, nextName);
				mode = { kind: "list" };
				nameDraft = "";
				render();
			}, () => {
				mode = { kind: "list" };
			}, render));
			return item;
		}
		if (mode.kind === "confirm-delete" && mode.id === collection.id) {
			item.append(buildConfirmDelete(collection, render));
			return item;
		}
		const main = document.createElement("div");
		main.className = ROW_MAIN_CLASS;
		const nameBtn = document.createElement("button");
		nameBtn.type = "button";
		nameBtn.className = CSS_CLASS.itemName;
		nameBtn.textContent = collection.name;
		nameBtn.setAttribute("aria-label", `${UI_TEXT.openCollection}: ${collection.name}`);
		nameBtn.addEventListener("click", () => {
			openSearch(collection);
		});
		main.append(nameBtn, buildRenameDeleteActions(collection, render));
		item.append(main);
		return item;
	}
	function buildSaveSearchControls(render) {
		const wrap = document.createElement("div");
		const searchTags = readTagsFromLocation(window.location.search);
		const canSave = searchTags !== null && searchTags.length > 0;
		if (mode.kind === "save-search") {
			wrap.append(buildNameForm(SAVE_NAME_ID, () => {
				const tags = readTagsFromLocation(window.location.search);
				if (tags === null || tags.length === 0) {
					mode = { kind: "list" };
					render();
					return;
				}
				const name = nameDraft.trim();
				if (name.length === 0) return;
				addCollection(name, tags);
				mode = { kind: "list" };
				nameDraft = "";
				render();
			}, () => {
				mode = { kind: "list" };
			}, render));
			return wrap;
		}
		const saveBtn = document.createElement("button");
		saveBtn.type = "button";
		saveBtn.className = CSS_CLASS.primaryButton;
		saveBtn.textContent = UI_TEXT.saveCurrent;
		saveBtn.disabled = !canSave;
		saveBtn.addEventListener("click", () => {
			const tags = readTagsFromLocation(window.location.search);
			if (tags === null || tags.length === 0) return;
			nameDraft = serialize(tags);
			mode = { kind: "save-search" };
			render();
		});
		wrap.append(saveBtn);
		if (!canSave) {
			const hint = document.createElement("p");
			hint.className = CSS_CLASS.hint;
			hint.textContent = UI_TEXT.notOnSearchPage;
			wrap.append(hint);
		}
		return wrap;
	}
	function buildSavedSearchesSection(render) {
		const section = document.createElement("section");
		section.className = CSS_CLASS.section;
		const heading = document.createElement("h3");
		heading.className = `${CSS_CLASS.sectionTitle} ${SECTION_HEADING_CLASS}`;
		heading.textContent = SAVED_SEARCHES_HEADING;
		section.append(heading, buildSaveSearchControls(render));
		const saved = listSavedSearches();
		if (saved.length === 0) {
			const empty = document.createElement("p");
			empty.className = CSS_CLASS.hint;
			empty.textContent = EMPTY_SAVED_SEARCHES;
			section.append(empty);
			return section;
		}
		const list = document.createElement("ul");
		list.className = CSS_CLASS.list;
		for (const collection of saved) list.append(buildSavedSearchRow(collection, render));
		section.append(list);
		return section;
	}
	function buildPlaylistParts(queries) {
		if (queries.length <= 1) return null;
		const parts = document.createElement("ul");
		parts.className = PLAYLIST_PARTS_CLASS;
		parts.setAttribute("aria-label", "Playlist parts");
		for (let index = 0; index < queries.length; index += 1) {
			const query = queries[index];
			if (query === void 0) continue;
			const item = document.createElement("li");
			const link = document.createElement("a");
			link.className = PLAYLIST_PART_CLASS;
			link.href = buildUpdatesSearchUrl(query);
			link.textContent = String(index + 1);
			item.append(link);
			parts.append(item);
		}
		return parts;
	}
	function buildPlaylistRow(playlist, render) {
		const item = document.createElement("li");
		item.className = CSS_CLASS.listItem;
		if (mode.kind === "rename" && mode.id === playlist.id) {
			item.append(buildNameForm(`rdw-rename-${playlist.id}`, () => {
				const nextName = nameDraft.trim();
				if (nextName.length === 0) return;
				renameCollection(playlist.id, nextName);
				mode = { kind: "list" };
				nameDraft = "";
				render();
			}, () => {
				mode = { kind: "list" };
			}, render));
			return item;
		}
		if (mode.kind === "confirm-delete" && mode.id === playlist.id) {
			item.append(buildConfirmDelete(playlist, render));
			return item;
		}
		const count = playlistPostCount(playlist);
		const queries = buildPlaylistQueries(playlist.postIds ?? [], getPlaylistChunkSize());
		const main = document.createElement("div");
		main.className = ROW_MAIN_CLASS;
		const nameBtn = document.createElement("button");
		nameBtn.type = "button";
		nameBtn.className = CSS_CLASS.itemName;
		nameBtn.textContent = playlist.name;
		nameBtn.setAttribute("aria-label", `${OPEN_PLAYLIST}: ${playlist.name}`);
		nameBtn.disabled = !(count > 0 && queries.length > 0);
		nameBtn.addEventListener("click", () => {
			const first = queries[0];
			if (first === void 0) return;
			openPlaylistPart(first);
		});
		main.append(nameBtn, buildRenameDeleteActions(playlist, render));
		item.append(main);
		const meta = document.createElement("p");
		meta.className = PLAYLIST_META_CLASS;
		meta.textContent = postsLabel(count);
		item.append(meta);
		const parts = buildPlaylistParts(queries);
		if (parts !== null) item.append(parts);
		return item;
	}
	function buildCreatePlaylistControls(render) {
		const wrap = document.createElement("div");
		if (mode.kind === "create-playlist") {
			wrap.append(buildNameForm(PLAYLIST_NAME_ID, () => {
				const name = nameDraft.trim();
				if (name.length === 0) return;
				createPlaylist(name);
				mode = { kind: "list" };
				nameDraft = "";
				render();
			}, () => {
				mode = { kind: "list" };
			}, render));
			return wrap;
		}
		const createBtn = document.createElement("button");
		createBtn.type = "button";
		createBtn.className = CSS_CLASS.primaryButton;
		createBtn.textContent = NEW_PLAYLIST;
		createBtn.addEventListener("click", () => {
			nameDraft = "";
			mode = { kind: "create-playlist" };
			render();
		});
		wrap.append(createBtn);
		return wrap;
	}
	function buildPlaylistsSection(render) {
		const section = document.createElement("section");
		section.className = CSS_CLASS.section;
		const heading = document.createElement("h3");
		heading.className = `${CSS_CLASS.sectionTitle} ${SECTION_HEADING_CLASS}`;
		heading.textContent = PLAYLISTS_HEADING;
		section.append(heading, buildCreatePlaylistControls(render));
		const playlists = listPlaylists();
		if (playlists.length === 0) {
			const empty = document.createElement("p");
			empty.className = CSS_CLASS.hint;
			empty.textContent = EMPTY_PLAYLISTS;
			const hint = document.createElement("p");
			hint.className = CSS_CLASS.hint;
			hint.textContent = EMPTY_PLAYLISTS_HINT;
			section.append(empty, hint);
			return section;
		}
		const list = document.createElement("ul");
		list.className = CSS_CLASS.list;
		for (const playlist of playlists) list.append(buildPlaylistRow(playlist, render));
		section.append(list);
		return section;
	}
	function createCollectionsTab() {
		const root = document.createElement("div");
		root.className = `${PANEL_UI_CLASS.scrollRegion} ${TAB_CLASS}`;
		const render = () => {
			root.replaceChildren(buildSavedSearchesSection(render), buildPlaylistsSection(render));
		};
		render();
		return root;
	}
	var FAVORITES_SYNC_PAGE_PAUSE_MS = 1500;
	var MY_FAVORITES_LINK_SELECTOR$1 = "li#my-favorites-container a[href*=\"page=favorites\"]";
	var THUMB_SELECTOR$1 = "span.thumb";
	var THUMB_POST_LINK_SELECTOR = "span.thumb a[id^=\"p\"]";
	var PAGINATOR_SELECTOR = "#paginator";
	var LASTPAGE_SELECTOR = "a[name=\"lastpage\"]";
	var NEXT_SELECTOR = "a[name=\"next\"]";
	var REMOVE_LINK_SELECTOR = "a[onclick]";
	var POST_LINK_ID_PATTERN = /^p(\d+)$/;
	var ONCLICK_PID_PATTERN = /[?&]pid=(\d+)/;
	var URL_PARSE_BASE = "https://rule34.xxx";
	var FAVORITES_SYNC_ERROR_NOT_LOGGED_IN = "not logged in or menu not found";
	var FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE = "unexpected page";
	function createAbortResult(total, page, pages) {
		return {
			status: "aborted",
			total,
			page,
			pages
		};
	}
	function isAbortError(error) {
		return error instanceof DOMException && error.name === "AbortError" || error instanceof Error && error.name === "AbortError";
	}
	function throwIfAborted(signal) {
		if (signal.aborted) throw new DOMException("Aborted", "AbortError");
	}
	function delay(ms, signal) {
		return new Promise((resolve, reject) => {
			if (signal.aborted) {
				reject(new DOMException("Aborted", "AbortError"));
				return;
			}
			const timer = setTimeout(() => {
				signal.removeEventListener("abort", onAbort);
				if (signal.aborted) {
					reject(new DOMException("Aborted", "AbortError"));
					return;
				}
				resolve();
			}, ms);
			const onAbort = () => {
				clearTimeout(timer);
				reject(new DOMException("Aborted", "AbortError"));
			};
			signal.addEventListener("abort", onAbort, { once: true });
		});
	}
	function parsePositiveInt(raw) {
		if (raw === null) return null;
		const trimmed = raw.trim();
		if (trimmed.length === 0) return null;
		const value = Number(trimmed);
		if (!Number.isFinite(value) || value < 0) return null;
		return Math.trunc(value);
	}
	function parsePidFromOnclick(onclick) {
		const raw = ONCLICK_PID_PATTERN.exec(onclick)?.[1];
		if (raw === void 0) return null;
		return parsePositiveInt(raw);
	}
	function extractUserIdFromDocument(root) {
		const link = root.querySelector(MY_FAVORITES_LINK_SELECTOR$1);
		if (!(link instanceof HTMLAnchorElement)) return null;
		const href = link.getAttribute("href");
		if (href === null || href.length === 0) return null;
		try {
			return parsePositiveInt(new URL(href, URL_PARSE_BASE).searchParams.get("id"));
		} catch {
			return null;
		}
	}
	function buildFavoritesPageUrl(userId, pid) {
		const params = new URLSearchParams();
		params.set(SEARCH_PARAM_PAGE, FAVORITES_PAGE);
		params.set("s", FAVORITES_SECTION_VIEW);
		params.set("id", String(userId));
		params.set("pid", String(pid));
		return `${SEARCH_PATH}?${params.toString()}`;
	}
	function pageIndexFromPid(pid) {
		return Math.floor(pid / 50) + 1;
	}
	function pagesFromLastPid$1(lastPid) {
		return Math.floor(lastPid / 50) + 1;
	}
	function collectFavoriteIdsFromDocument(doc) {
		const ids = new Set();
		const postLinks = doc.querySelectorAll(THUMB_POST_LINK_SELECTOR);
		for (const link of postLinks) {
			const raw = POST_LINK_ID_PATTERN.exec(link.id)?.[1];
			if (raw === void 0) continue;
			const parsed = Number(raw);
			if (Number.isFinite(parsed)) ids.add(Math.trunc(parsed));
		}
		const removeLinks = doc.querySelectorAll(REMOVE_LINK_SELECTOR);
		for (const link of removeLinks) {
			const onclick = link.getAttribute("onclick");
			if (onclick === null) continue;
			const postId = extractPostIdFromFavoritesDeleteOnclick(onclick);
			if (postId === null) continue;
			const parsed = Number(postId);
			if (Number.isFinite(parsed)) ids.add(Math.trunc(parsed));
		}
		return Array.from(ids);
	}
	function resolveLastPid(doc, currentPid) {
		const lastpage = doc.querySelector(LASTPAGE_SELECTOR);
		if (lastpage instanceof HTMLAnchorElement) {
			const onclick = lastpage.getAttribute("onclick");
			if (onclick === null || onclick.length === 0) return null;
			return parsePidFromOnclick(onclick);
		}
		if (doc.querySelector(NEXT_SELECTOR) !== null) return null;
		return currentPid;
	}
	function isUnexpectedFavoritesPage(doc, pid, lastPid, cardCount) {
		if (cardCount === 0 && pid <= lastPid) return true;
		if (pid === 0 && cardCount === 0 && doc.querySelector(PAGINATOR_SELECTOR) === null) return true;
		return false;
	}
	function persistSyncProgress(state) {
		setSyncState(state);
	}
	async function runFavoritesSync(options) {
		const { onProgress, signal } = options;
		const userId = extractUserIdFromDocument(document);
		if (userId === null) {
			log.warn("favorites sync: user id not found");
			return {
				status: "error",
				message: FAVORITES_SYNC_ERROR_NOT_LOGGED_IN
			};
		}
		const existing = getSyncState();
		const unfinished = existing !== void 0 && existing.finishedAt === void 0;
		const startedAt = unfinished ? existing.startedAt : new Date().toISOString();
		let pid = unfinished ? existing.nextPid : 0;
		let lastPid = unfinished ? existing.lastPid : 0;
		let total = loadFavSet().size;
		let page = pageIndexFromPid(pid);
		let pages = pagesFromLastPid$1(lastPid);
		try {
			throwIfAborted(signal);
			while (true) {
				throwIfAborted(signal);
				const url = buildFavoritesPageUrl(userId, pid);
				let response;
				try {
					response = await fetch(url, {
						method: "GET",
						credentials: FETCH_CREDENTIALS
					});
				} catch (error) {
					if (isAbortError(error)) throw error;
					log.warn("favorites sync: fetch failed", url, error);
					persistSyncProgress({
						nextPid: pid,
						lastPid,
						startedAt
					});
					return {
						status: "error",
						message: error instanceof Error ? error.message : "request failed"
					};
				}
				if (!response.ok) {
					log.warn("favorites sync: HTTP error", response.status, url);
					persistSyncProgress({
						nextPid: pid,
						lastPid,
						startedAt
					});
					return {
						status: "error",
						message: `HTTP ${String(response.status)}`
					};
				}
				const html = await response.text();
				const doc = new DOMParser().parseFromString(html, "text/html");
				const cardCount = doc.querySelectorAll(THUMB_SELECTOR$1).length;
				const resolvedLastPid = resolveLastPid(doc, pid);
				if (resolvedLastPid === null) {
					log.warn("favorites sync: unexpected page", {
						pid,
						cardCount
					});
					persistSyncProgress({
						nextPid: pid,
						lastPid,
						startedAt
					});
					return {
						status: "error",
						message: FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE
					};
				}
				lastPid = resolvedLastPid;
				page = pageIndexFromPid(pid);
				pages = pagesFromLastPid$1(lastPid);
				if (isUnexpectedFavoritesPage(doc, pid, lastPid, cardCount)) {
					log.warn("favorites sync: unexpected page", {
						pid,
						lastPid,
						cardCount
					});
					persistSyncProgress({
						nextPid: pid,
						lastPid,
						startedAt
					});
					return {
						status: "error",
						message: FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE
					};
				}
				addFavs(collectFavoriteIdsFromDocument(doc));
				total = loadFavSet().size;
				const nextPid = pid + 50;
				persistSyncProgress({
					nextPid,
					lastPid,
					startedAt
				});
				onProgress({
					page,
					pages,
					total
				});
				if (pid >= lastPid) {
					const finishedAt = new Date().toISOString();
					persistSyncProgress({
						nextPid,
						lastPid,
						startedAt,
						finishedAt
					});
					log.info("favorites sync: completed", {
						total,
						pages
					});
					return {
						status: "completed",
						total,
						pages
					};
				}
				throwIfAborted(signal);
				await delay(FAVORITES_SYNC_PAGE_PAUSE_MS, signal);
				throwIfAborted(signal);
				pid = nextPid;
				page = pageIndexFromPid(pid);
			}
		} catch (error) {
			if (isAbortError(error)) {
				log.info("favorites sync: aborted", {
					pid,
					total
				});
				return createAbortResult(total, page, pages);
			}
			log.error("favorites sync: unexpected failure", error);
			persistSyncProgress({
				nextPid: pid,
				lastPid,
				startedAt
			});
			return {
				status: "error",
				message: error instanceof Error ? error.message : "unexpected error"
			};
		}
	}
	var SECTION_CLASS = "rdw-favs-sync";
	var STATUS_CLASS = "rdw-favs-sync-status";
	var PROGRESS_CLASS = "rdw-favs-sync-progress";
	var ACTIONS_CLASS = "rdw-favs-sync-actions";
	var WARNING_CLASS = "rdw-favs-sync-warning";
	var NOTE_CLASS = "rdw-favs-sync-note";
	var HEADING = "Favorites sync";
	var TEXT_SYNC = "Sync favorites";
	var TEXT_RESUME = "Resume";
	var TEXT_STOP = "Stop";
	var TEXT_WARNING = "Loads every favorites page, one request per 1.5 s";
	var TEXT_NOTE = "Sync only adds favorites. Posts removed on the site stay in the local set.";
	var TEXT_IDLE_COUNT = (count) => `${String(count)} in local favorites set`;
	var TEXT_LAST_SYNC = (iso) => `Last full sync: ${formatSyncDate(iso)}`;
	var TEXT_PAUSED = (page, pages) => `Paused at page ${String(page)} of ${String(pages)}`;
	var TEXT_PROGRESS = (p) => `Page ${String(p.page)} of ${String(p.pages)} · ${String(p.total)} ids`;
	var TEXT_DONE = (total, pages) => `Synced ${String(total)} ids across ${String(pages)} pages`;
	var TEXT_ABORTED = (page, pages, total) => `Stopped at page ${String(page)} of ${String(pages)} · ${String(total)} ids`;
	var PAUSE_SECONDS = FAVORITES_SYNC_PAGE_PAUSE_MS / 1e3;
	var FAVORITES_SYNC_SECTION_CSS = `
.${SECTION_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.${SECTION_CLASS} .${STATUS_CLASS} {
  margin: 0;
  color: var(--rdw-fg-label, #333);
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
  color: var(--rdw-fg-muted, #555);
  font-size: 12px;
}
`.trim();
	var activeSync = null;
	function formatSyncDate(iso) {
		const parsed = Date.parse(iso);
		if (!Number.isFinite(parsed)) return iso;
		return new Date(parsed).toLocaleString();
	}
	function pageFromPid(pid) {
		return Math.floor(pid / 50) + 1;
	}
	function pagesFromLastPid(lastPid) {
		return Math.floor(lastPid / 50) + 1;
	}
	function isUnfinished(sync) {
		return sync !== void 0 && sync.finishedAt === void 0;
	}
	function buildStatusText() {
		const count = loadFavSet().size;
		const sync = getSyncState();
		const parts = [TEXT_IDLE_COUNT(count)];
		if (sync !== void 0 && sync.finishedAt === void 0) {
			const page = pageFromPid(sync.nextPid);
			const pages = Math.max(pagesFromLastPid(sync.lastPid), page);
			parts.push(TEXT_PAUSED(page, pages));
		} else if (sync?.finishedAt !== void 0) parts.push(TEXT_LAST_SYNC(sync.finishedAt));
		return parts.join(" · ");
	}
	function applyIdleUi(refs) {
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
	function applyProgressUi(refs, progress) {
		refs.status.textContent = TEXT_PROGRESS(progress);
		refs.progress.max = Math.max(progress.pages, 1);
		refs.progress.value = progress.page;
		refs.syncBtn.disabled = true;
		refs.resumeBtn.disabled = true;
		refs.stopBtn.disabled = false;
		refs.syncBtn.hidden = true;
		refs.resumeBtn.hidden = false;
	}
	function applyResultUi(refs, result) {
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
		refs.status.textContent = TEXT_ABORTED(result.page, result.pages, result.total);
		refs.progress.max = Math.max(result.pages, 1);
		refs.progress.value = result.page;
	}
	async function startSync(refs) {
		if (activeSync !== null) return;
		const controller = new AbortController();
		const listeners = new Set();
		activeSync = {
			controller,
			listeners
		};
		const onProgress = (progress) => {
			for (const listener of listeners) listener(progress);
		};
		listeners.add((progress) => {
			applyProgressUi(refs, progress);
		});
		refs.error.hidden = true;
		refs.error.textContent = "";
		applyProgressUi(refs, {
			page: 0,
			pages: 1,
			total: loadFavSet().size
		});
		try {
			const result = await runFavoritesSync({
				onProgress,
				signal: controller.signal
			});
			if (activeSync?.controller === controller) applyResultUi(refs, result);
		} catch (error) {
			log.error("favorites sync section: unexpected failure", error);
			if (activeSync?.controller === controller) {
				activeSync = null;
				refs.error.hidden = false;
				refs.error.textContent = error instanceof Error ? error.message : "unexpected error";
				applyIdleUi(refs);
			}
		}
	}
	function createFavoritesSyncSection(options = {}) {
		const includeHeading = options.includeHeading !== false;
		const section = document.createElement("section");
		section.className = `${CSS_CLASS.section} ${SECTION_CLASS}`;
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
		if (includeHeading) {
			const title = document.createElement("h3");
			title.className = CSS_CLASS.sectionTitle;
			title.textContent = HEADING;
			section.append(title);
		}
		section.append(status, progress, actions, error, warning, note, pauseHint);
		const refs = {
			status,
			progress,
			error,
			syncBtn,
			resumeBtn,
			stopBtn
		};
		if (activeSync !== null) {
			const listener = (p) => {
				applyProgressUi(refs, p);
			};
			activeSync.listeners.add(listener);
			applyProgressUi(refs, {
				page: 0,
				pages: 1,
				total: loadFavSet().size
			});
			refs.stopBtn.disabled = false;
		} else applyIdleUi(refs);
		syncBtn.addEventListener("click", () => {
			startSync(refs);
		});
		resumeBtn.addEventListener("click", () => {
			startSync(refs);
		});
		stopBtn.addEventListener("click", () => {
			activeSync?.controller.abort();
		});
		return section;
	}
	var PANEL_UI_CLASS = {
		tabs: "rdw-tabs",
		tab: "rdw-tab",
		tabPanel: "rdw-tab-panel",
		footer: "rdw-footer",
		artistMeta: "rdw-artist-meta",
		artistFilter: "rdw-artist-filter",
		artistList: "rdw-artist-list",
		artistRow: "rdw-artist-row",
		artistLink: "rdw-artist-link",
		artistUndo: "rdw-artist-undo",
		scrollRegion: "rdw-scroll-region",
		themeDark: "rdw-theme-dark"
	};
	var PANEL_CSS = `
:host {
  all: initial;
  font-family: Segoe UI, system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  --rdw-fg: #1a1a1a;
  --rdw-fg-muted: #555;
  --rdw-fg-label: #333;
  --rdw-fg-section: #444;
  --rdw-bg: #f7f7f7;
  --rdw-bg-header: #ececec;
  --rdw-bg-item: #fff;
  --rdw-bg-input: #fff;
  --rdw-border: #ccc;
  --rdw-border-strong: #333;
  --rdw-border-control: #666;
  --rdw-link: #0b57d0;
  --rdw-focus: #4c8bf5;
  --rdw-primary: #0b57d0;
  --rdw-primary-fg: #fff;
  --rdw-danger: #a12828;
  --rdw-danger-fg: #fff;
  --rdw-toggle-bg: #111;
  --rdw-toggle-fg: #fff;
  --rdw-shadow: rgba(0, 0, 0, 0.28);
  color: var(--rdw-fg);
}

:host(.${PANEL_UI_CLASS.themeDark}) {
  --rdw-fg: #e8e8e8;
  --rdw-fg-muted: #a8a8a8;
  --rdw-fg-label: #c8c8c8;
  --rdw-fg-section: #b0b0b0;
  --rdw-bg: #1e1e1e;
  --rdw-bg-header: #2a2a2a;
  --rdw-bg-item: #252525;
  --rdw-bg-input: #2a2a2a;
  --rdw-border: #444;
  --rdw-border-strong: #666;
  --rdw-border-control: #777;
  --rdw-link: #7eb0ff;
  --rdw-focus: #4c8bf5;
  --rdw-primary: #3b7ddd;
  --rdw-primary-fg: #fff;
  --rdw-danger: #d9534f;
  --rdw-danger-fg: #fff;
  --rdw-toggle-bg: #2a2a2a;
  --rdw-toggle-fg: #e8e8e8;
  --rdw-shadow: rgba(0, 0, 0, 0.55);
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
  border: 1px solid var(--rdw-border-strong);
  border-radius: 999px;
  background: var(--rdw-toggle-bg);
  color: var(--rdw-toggle-fg);
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
}

.${CSS_CLASS.toggle}:focus-visible {
  outline: 2px solid var(--rdw-focus);
  outline-offset: 2px;
}

.${CSS_CLASS.panel} {
  display: none;
  box-sizing: border-box;
  width: 360px;
  height: 480px;
  min-width: 320px;
  min-height: 240px;
  max-width: 90vw;
  max-height: 90vh;
  resize: both;
  overflow: hidden;
  background: var(--rdw-bg);
  border: 1px solid var(--rdw-border-strong);
  border-radius: 8px;
  box-shadow: 0 8px 24px var(--rdw-shadow);
  color: var(--rdw-fg);
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
  border-bottom: 1px solid var(--rdw-border);
  background: var(--rdw-bg-header);
  flex-shrink: 0;
}

.${CSS_CLASS.title} {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--rdw-fg);
}

.${CSS_CLASS.close} {
  border: 1px solid var(--rdw-border-control);
  background: var(--rdw-bg-item);
  border-radius: 4px;
  cursor: pointer;
  min-width: 32px;
  min-height: 32px;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--rdw-fg);
  font-size: 18px;
  line-height: 1;
}

.${PANEL_UI_CLASS.tabs} {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  border-bottom: 1px solid var(--rdw-border);
  background: var(--rdw-bg-header);
  flex-shrink: 0;
  padding: 0 4px;
}

.${PANEL_UI_CLASS.tab} {
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--rdw-fg-muted);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 10px;
  margin-bottom: -1px;
}

.${PANEL_UI_CLASS.tab}[aria-selected="true"] {
  color: var(--rdw-fg);
  border-bottom-color: var(--rdw-primary);
}

.${PANEL_UI_CLASS.tab}:focus-visible {
  outline: 2px solid var(--rdw-focus);
  outline-offset: -2px;
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

.${CSS_CLASS.sectionTitle} {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--rdw-fg-section);
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
  border-radius: 6px;
  background: var(--rdw-bg-item);
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
  border-radius: 4px;
}

.${PANEL_UI_CLASS.artistRow}:hover {
  background: var(--rdw-bg-header);
}

.${PANEL_UI_CLASS.artistLink} {
  color: var(--rdw-link);
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
  outline: 2px solid var(--rdw-focus);
  outline-offset: 2px;
}

.${PANEL_UI_CLASS.artistUndo} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  font-size: 12px;
  color: var(--rdw-fg-muted);
}

.${CSS_CLASS.itemName} {
  border: 0;
  background: transparent;
  color: var(--rdw-link);
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
.${CSS_CLASS.input}:focus-visible,
.${CSS_CLASS.checkbox}:focus-visible {
  outline: 2px solid var(--rdw-focus);
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

.${CSS_CLASS.checkboxRow} {
  display: flex;
  align-items: center;
  gap: 8px;
}

.${CSS_CLASS.checkbox} {
  width: 16px;
  height: 16px;
  margin: 0;
}

.${CSS_CLASS.iconButton},
.${CSS_CLASS.secondaryButton} {
  border: 1px solid var(--rdw-border-control);
  background: var(--rdw-bg-item);
  color: var(--rdw-fg);
  border-radius: 4px;
  cursor: pointer;
  min-height: 32px;
  padding: 4px 8px;
  font: inherit;
}

.${CSS_CLASS.iconButton} {
  min-width: 28px;
  min-height: 28px;
  padding: 2px 6px;
  line-height: 1;
}

.${CSS_CLASS.primaryButton} {
  border: 1px solid var(--rdw-primary);
  background: var(--rdw-primary);
  color: var(--rdw-primary-fg);
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
  border: 1px solid var(--rdw-danger);
  background: var(--rdw-danger);
  color: var(--rdw-danger-fg);
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
  color: var(--rdw-fg-label);
}

.${CSS_CLASS.input} {
  border: 1px solid var(--rdw-border-control);
  border-radius: 4px;
  min-height: 32px;
  padding: 4px 8px;
  font: inherit;
  background: var(--rdw-bg-input);
  color: var(--rdw-fg);
}

.${CSS_CLASS.hint} {
  margin: 0;
  color: var(--rdw-fg-muted);
  font-size: 12px;
}

.${CSS_CLASS.error} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: 12px;
}

.${PANEL_UI_CLASS.footer} {
  flex-shrink: 0;
  padding: 6px 12px;
  border-top: 1px solid var(--rdw-border);
  font-size: 11px;
  color: var(--rdw-fg-muted);
}

.${CSS_CLASS.hidden} {
  display: none !important;
}

${FAVORITES_SYNC_SECTION_CSS}

${BLACKLIST_SECTION_CSS}

${COLLECTIONS_TAB_CSS}
`;
	var CARD_CSS = `
.${CSS_CLASS.cardFav} {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 5;
  box-sizing: border-box;
  min-width: 28px;
  min-height: 28px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #333;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.92);
  color: #333;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  opacity: 0;
}

@supports (anchor-name: --a) {
  .${CSS_CLASS.cardFav} {
    position-anchor: --rdw-img;
    top: calc(anchor(top) + 4px);
    right: calc(anchor(right) + 4px);
  }
}

.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav},
.${CSS_CLASS.cardFav}:focus-visible {
  opacity: 0.65;
}

.${CSS_CLASS.thumb} .${CSS_CLASS.cardFav}:hover,
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending} {
  opacity: 1;
}

.${CSS_CLASS.cardFav}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked} {
  background: #ffe08a;
  border-color: #a67c00;
  color: #5c4500;
}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError} {
  background: #f8d7da;
  border-color: #a12828;
  color: #a12828;
}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending},
.${CSS_CLASS.cardFav}:disabled {
  cursor: wait;
}

.${CSS_CLASS.thumb}:has(> a[style*="display: none"]) .${CSS_CLASS.cardFav},
.${CSS_CLASS.thumb}:has(> a[style*="display:none"]) .${CSS_CLASS.cardFav} {
  display: none !important;
}

body.${CSS_CLASS.gridFavsHidden} .${CSS_CLASS.cardFav} {
  display: none !important;
}

.${CSS_CLASS.artistFollow} {
  margin-left: 4px;
  box-sizing: border-box;
  min-height: 18px;
  padding: 0 5px;
  border: 1px solid #666;
  border-radius: 3px;
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 11px;
  line-height: 1.2;
  vertical-align: middle;
}

.${CSS_CLASS.artistFollow}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}

.${CSS_CLASS.artistFollow}.${CSS_CLASS.artistFollowMarked} {
  background: #ffe08a;
  border-color: #a67c00;
  color: #5c4500;
}

.${CSS_CLASS.updatesBar} {
  margin: 8px 0;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #f7f7f7;
  font-family: Segoe UI, system-ui, sans-serif;
  font-size: 14px;
  color: #1a1a1a;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.hint} {
  margin: 0;
  color: #555;
  font-size: 12px;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.primaryButton} {
  border: 1px solid #0b57d0;
  background: #0b57d0;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  min-height: 32px;
  padding: 4px 10px;
  font: inherit;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.primaryButton}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.itemName} {
  color: #0b57d0;
  font-weight: 600;
  text-decoration: underline;
}

.${CSS_CLASS.updatesBarActions} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
`;
	var unsubscribeThumbsAdded$3;
	function ensureThumbsAddedSubscription() {
		if (unsubscribeThumbsAdded$3 !== void 0) return;
		unsubscribeThumbsAdded$3 = onThumbsAdded((root) => {
			mountCards(root);
		});
	}
	function ensureDocumentStyles() {
		if (document.getElementById("ruledesk-web-document-style") !== null) return;
		const style = document.createElement("style");
		style.id = DOCUMENT_STYLE_ID;
		style.textContent = `${BASE_GRID_CSS}\n${CARD_CSS}`;
		document.head.append(style);
	}
	function findThumbLink$1(thumb, postId) {
		const byId = thumb.querySelector(`#p${postId}`);
		if (byId instanceof HTMLAnchorElement) return byId;
		const byHref = thumb.querySelector(SITE_SELECTORS.thumbLink);
		return byHref instanceof HTMLAnchorElement ? byHref : null;
	}
	function attachFavButton(thumb, postId, marked) {
		if (thumb.querySelector(SITE_SELECTORS.cardFavButton) !== null) return;
		const link = findThumbLink$1(thumb, postId);
		if (link === null) return;
		ensureThumbAnchor(thumb);
		const button = createFavButton(postId, marked);
		link.after(button);
	}
	function applyGridFavVisibilityClass(visible) {
		document.body.classList.toggle(CSS_CLASS.gridFavsHidden, !visible);
	}
	function setGridFavButtonsVisible(visible) {
		applyGridFavVisibilityClass(visible);
		if (visible && detectPageKind(window.location.search) === "list") mountCards();
	}
	function mountCards(root = document, search = window.location.search) {
		ensureThumbsAddedSubscription();
		if (detectPageKind(search) !== "list") return;
		ensureDocumentStyles();
		const enabled = getGridFavButtonsEnabled();
		applyGridFavVisibilityClass(enabled);
		if (!enabled) return;
		const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
		for (const thumb of thumbs) {
			if (!(thumb instanceof HTMLElement)) continue;
			const postId = extractPostIdFromThumb(thumb);
			if (postId === null) continue;
			attachFavButton(thumb, postId, isFav(postId));
		}
	}
	var FEED_NEW_CLASS$1 = "new";
	var ID_FILTER_PATTERN = /^id:>(\d+)$/;
	var TEXT_NEW_ON_PAGE_SUFFIX = " new on this page";
	var TEXT_MARKED_SEEN_PREFIX = "Marked as seen up to #";
	var TEXT_ONLY_NEW = "Only new";
	var TEXT_SHOW_ALL = "Show all";
	function readPid(search) {
		const raw = new URLSearchParams(search).get("pid");
		if (raw === null || raw.trim().length === 0) return 0;
		const value = Number(raw);
		if (!Number.isFinite(value) || value < 0) return 0;
		return Math.floor(value);
	}
	function maxThumbPostId(root) {
		let maxId = 0;
		const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
		for (const thumb of thumbs) {
			const postId = extractPostIdFromThumb(thumb);
			if (postId === null) continue;
			const numeric = Number(postId);
			if (Number.isFinite(numeric) && numeric > maxId) maxId = numeric;
		}
		return maxId;
	}
	function countNewThumbs(root, seenPostId) {
		let count = 0;
		const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
		for (const thumb of thumbs) {
			const postId = extractPostIdFromThumb(thumb);
			if (postId === null) continue;
			const numeric = Number(postId);
			if (Number.isFinite(numeric) && numeric > seenPostId) count += 1;
		}
		return count;
	}
	function tagsHaveIdFilter(tagsParam) {
		const tokens = tagsParam.trim().split(/\s+/).filter((token) => token.length > 0);
		const last = tokens[tokens.length - 1];
		return last !== void 0 && ID_FILTER_PATTERN.test(last);
	}
	function removeExistingBar$1(root) {
		const existing = root instanceof Document ? root.getElementById(UPDATES_BAR_ID) : root.querySelector(`#${UPDATES_BAR_ID}`);
		if (existing !== null) existing.remove();
	}
	function createBarShell() {
		const bar = document.createElement("div");
		bar.id = UPDATES_BAR_ID;
		bar.className = CSS_CLASS.updatesBar;
		return bar;
	}
	function insertBeforeImageList(imageList, bar) {
		imageList.parentElement?.insertBefore(bar, imageList);
	}
	function findEmptyUpdatesHost(root) {
		return root.querySelector(SITE_SELECTORS.postListContent) ?? root.querySelector(SITE_SELECTORS.contentRoot);
	}
	function clearNewHighlights(root) {
		const thumbs = root.querySelectorAll(`${SITE_SELECTORS.thumb}.${FEED_NEW_CLASS$1}`);
		for (const thumb of thumbs) thumb.classList.remove(FEED_NEW_CLASS$1);
	}
	function createToggleLink(tagsParam, seenPostId) {
		if (tagsHaveIdFilter(tagsParam)) {
			const link = document.createElement("a");
			link.className = CSS_CLASS.itemName;
			link.href = buildUpdatesSearchUrl(stripUpdatesIdFilter(tagsParam));
			link.textContent = TEXT_SHOW_ALL;
			return link;
		}
		if (seenPostId === 0) return null;
		const onlyNewQuery = `${stripUpdatesIdFilter(tagsParam)} ${UPDATES_ID_PREFIX}${String(seenPostId)}`;
		const link = document.createElement("a");
		link.className = CSS_CLASS.itemName;
		link.href = buildUpdatesSearchUrl(onlyNewQuery);
		link.textContent = TEXT_ONLY_NEW;
		return link;
	}
	function appendToggle(parent, tagsParam, seenPostId) {
		const toggle = createToggleLink(tagsParam, seenPostId);
		if (toggle !== null) parent.append(toggle);
	}
	function mountEmptyPageBar(root, tagsParam) {
		const host = findEmptyUpdatesHost(root);
		if (host === null) {
			log.warn(UI_TEXT.updatesBarMissingHost);
			return;
		}
		const bar = createBarShell();
		const seen = getSeenPostId();
		const text = document.createElement("p");
		text.className = CSS_CLASS.hint;
		text.textContent = `${UI_TEXT.noNewPostsSince}${String(seen)}`;
		const showAll = document.createElement("a");
		showAll.className = CSS_CLASS.itemName;
		showAll.href = buildUpdatesSearchUrl(stripUpdatesIdFilter(tagsParam));
		showAll.textContent = TEXT_SHOW_ALL;
		const wrap = document.createElement("div");
		wrap.className = CSS_CLASS.updatesBarActions;
		wrap.append(text, showAll);
		bar.append(wrap);
		host.insertBefore(bar, host.firstChild);
	}
	function mountPartialBar(imageList) {
		const bar = createBarShell();
		const hint = document.createElement("p");
		hint.className = CSS_CLASS.hint;
		hint.textContent = UI_TEXT.updatesPartialHint;
		bar.append(hint);
		insertBeforeImageList(imageList, bar);
	}
	function mountFullBar(imageList, search, tagsParam) {
		const bar = createBarShell();
		const seen = getSeenPostId();
		if (readPid(search) > 0) {
			const hint = document.createElement("p");
			hint.className = CSS_CLASS.hint;
			hint.textContent = UI_TEXT.goToPageOneToMark;
			bar.append(hint);
			insertBeforeImageList(imageList, bar);
			return;
		}
		const newCount = countNewThumbs(imageList, seen);
		const actions = document.createElement("div");
		actions.className = CSS_CLASS.updatesBarActions;
		if (newCount === 0) {
			const hint = document.createElement("p");
			hint.className = CSS_CLASS.hint;
			hint.textContent = `${UI_TEXT.noNewPostsSince}${String(seen)}`;
			actions.append(hint);
			appendToggle(actions, tagsParam, seen);
			bar.append(actions);
			insertBeforeImageList(imageList, bar);
			return;
		}
		const summary = document.createElement("p");
		summary.className = CSS_CLASS.hint;
		summary.textContent = `${String(newCount)}${TEXT_NEW_ON_PAGE_SUFFIX}`;
		const markButton = document.createElement("button");
		markButton.type = "button";
		markButton.className = CSS_CLASS.primaryButton;
		markButton.textContent = UI_TEXT.markAllSeen;
		markButton.addEventListener("click", () => {
			const nextSeen = Math.max(getSeenPostId(), maxThumbPostId(imageList));
			setSeenPostId(nextSeen);
			clearNewHighlights(document);
			bar.replaceChildren();
			const confirm = document.createElement("p");
			confirm.className = CSS_CLASS.hint;
			confirm.textContent = `${TEXT_MARKED_SEEN_PREFIX}${String(nextSeen)}`;
			const wrap = document.createElement("div");
			wrap.className = CSS_CLASS.updatesBarActions;
			wrap.append(confirm);
			appendToggle(wrap, tagsParam, nextSeen);
			bar.append(wrap);
		});
		actions.append(summary, markButton);
		appendToggle(actions, tagsParam, seen);
		bar.append(actions);
		insertBeforeImageList(imageList, bar);
	}
	function mountUpdatesBar(root = document, search = window.location.search) {
		if (detectPageKind(search) !== "list") return;
		const tagsParam = new URLSearchParams(search).get(SEARCH_PARAM_TAGS);
		if (tagsParam === null || tagsParam.trim().length === 0) return;
		const artistTags = listArtistTags();
		const isFull = isFullUpdatesQuery(tagsParam, artistTags);
		const isPartial = isPartialUpdatesQuery(tagsParam, artistTags);
		if (!isFull && !isPartial) return;
		removeExistingBar$1(root);
		ensureDocumentStyles();
		const imageList = root.querySelector(SITE_SELECTORS.imageList);
		if (imageList === null) {
			mountEmptyPageBar(root, tagsParam);
			return;
		}
		if (isPartial) {
			mountPartialBar(imageList);
			return;
		}
		mountFullBar(imageList, search, tagsParam);
	}
	var FEATURE_ID$8 = "feed";
	var FEATURE_LABEL$7 = "Feed in site menu";
	var FEATURE_PAGES$7 = [
		"list",
		"post",
		"favorites",
		"other"
	];
	var CONTENT_ID$1 = "content";
	var POSTS_LINK_TEXT = "Posts";
	var FEED_LINK_TEXT = "Feed";
	var FEED_MENU_ITEM_ID = "rdw-feed-menu";
	var CURRENT_PAGE_CLASS = "current-page";
	var NO_ARTISTS_TITLE = "Follow artists to build your feed";
	var MISSING_POSTS_WARN = "feed: Posts menu item not found";
	var FEATURE_CSS$7 = `
body.${featureBodyClass(FEATURE_ID$8)} span.thumb.new img.preview {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}
`;
	var unsubscribeThumbsAdded$2;
	function findPostsMenuItem() {
		const content = document.getElementById(CONTENT_ID$1);
		const anchors = document.querySelectorAll("a");
		for (const node of anchors) {
			if (!(node instanceof HTMLAnchorElement)) continue;
			if ((node.textContent?.trim() ?? "") !== POSTS_LINK_TEXT) continue;
			const listItem = node.closest("li");
			if (listItem === null) continue;
			if (content !== null && content.contains(listItem)) continue;
			return listItem;
		}
		return null;
	}
	function resolveFeedHref(postsAnchor) {
		const artistTags = listArtistTags();
		if (artistTags.length === 0) {
			if (postsAnchor !== null) return postsAnchor.href;
			return buildFeedUrl([], getUpdatesGroupSize());
		}
		return buildFeedUrl(artistTags, getUpdatesGroupSize());
	}
	function ensureFeedMenuItem() {
		const existing = document.getElementById(FEED_MENU_ITEM_ID);
		if (existing instanceof HTMLLIElement) return existing;
		const postsItem = findPostsMenuItem();
		if (postsItem === null) {
			log.warn(MISSING_POSTS_WARN);
			return null;
		}
		const postsAnchor = postsItem.querySelector("a");
		const postsLink = postsAnchor instanceof HTMLAnchorElement ? postsAnchor : null;
		const feedItem = document.createElement("li");
		feedItem.id = FEED_MENU_ITEM_ID;
		const feedLink = document.createElement("a");
		feedLink.textContent = FEED_LINK_TEXT;
		feedLink.href = resolveFeedHref(postsLink);
		if (listArtistTags().length === 0) feedLink.title = NO_ARTISTS_TITLE;
		feedItem.append(feedLink);
		postsItem.after(feedItem);
		return feedItem;
	}
	function isFeedPage(search, artistTags) {
		const tagsParam = new URLSearchParams(search).get(SEARCH_PARAM_TAGS);
		if (tagsParam === null || tagsParam.trim().length === 0) return false;
		return isFullUpdatesQuery(tagsParam, artistTags) || isPartialUpdatesQuery(tagsParam, artistTags);
	}
	function applyCurrentPageHighlight(feedItem, onFeed) {
		const postsItem = findPostsMenuItem();
		if (onFeed) {
			postsItem?.classList.remove(CURRENT_PAGE_CLASS);
			feedItem.classList.add(CURRENT_PAGE_CLASS);
			return;
		}
		feedItem.classList.remove(CURRENT_PAGE_CLASS);
	}
	function markNewThumbs(root, seenPostId) {
		if (seenPostId === 0) return;
		const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
		for (const thumb of thumbs) {
			const postId = extractPostIdFromThumb(thumb);
			if (postId === null) continue;
			const numeric = Number(postId);
			if (!Number.isFinite(numeric) || numeric <= seenPostId) continue;
			thumb.classList.add("new");
		}
	}
	function ensureNewThumbsSubscription() {
		if (unsubscribeThumbsAdded$2 !== void 0) return;
		unsubscribeThumbsAdded$2 = onThumbsAdded((root) => {
			markNewThumbs(root, getSeenPostId());
		});
	}
	function mountFeed(ctx) {
		const feedItem = ensureFeedMenuItem();
		if (feedItem === null) return;
		const artistTags = listArtistTags();
		const onFeed = isFeedPage(ctx.search, artistTags);
		applyCurrentPageHighlight(feedItem, onFeed);
		if (!onFeed || ctx.pageKind !== "list") return;
		markNewThumbs(document, getSeenPostId());
		ensureNewThumbsSubscription();
		mountUpdatesBar(document, ctx.search);
	}
	var feedFeature = {
		id: FEATURE_ID$8,
		label: FEATURE_LABEL$7,
		pages: [...FEATURE_PAGES$7],
		defaultEnabled: true,
		css: FEATURE_CSS$7,
		mount: mountFeed
	};
	var FEATURE_ID$7 = "grid-density";
	var COMPACT_PX = 150;
	var LARGE_PX = 250;
	var MASONRY_VALUE = "masonry";
	var MASONRY_COLUMN_WIDTH_PX = 200;
	var MASONRY_COLUMN_GAP_PX = 10;
	var MASONRY_THUMB_MARGIN = "0 0 10px";
	function sizeCss(choiceValue, px) {
		const bodyClass = featureChoiceBodyClass(FEATURE_ID$7, choiceValue);
		return [
			`body.${bodyClass} span.thumb,`,
			`body.${bodyClass} span.thumb > a {`,
			`  width: ${px}px !important;`,
			`  height: ${px}px !important;`,
			`}`,
			`body.${bodyClass} img.preview {`,
			`  max-width: ${px}px !important;`,
			`  max-height: ${px}px !important;`,
			`}`
		].join("\n");
	}
	function masonryCss() {
		const bodyClass = featureChoiceBodyClass(FEATURE_ID$7, MASONRY_VALUE);
		return [
			`body.${bodyClass} div.image-list {`,
			`  display: block !important;`,
			`  column-width: ${MASONRY_COLUMN_WIDTH_PX}px !important;`,
			`  column-gap: ${MASONRY_COLUMN_GAP_PX}px !important;`,
			`}`,
			`body.${bodyClass} span.thumb {`,
			`  display: block !important;`,
			`  width: auto !important;`,
			`  height: auto !important;`,
			`  margin: ${MASONRY_THUMB_MARGIN} !important;`,
			`  break-inside: avoid !important;`,
			`}`,
			`body.${bodyClass} span.thumb > a {`,
			`  display: block !important;`,
			`  width: auto !important;`,
			`  height: auto !important;`,
			`}`,
			`body.${bodyClass} span.thumb img.preview {`,
			`  display: block !important;`,
			`  width: 100% !important;`,
			`  height: auto !important;`,
			`  max-width: none !important;`,
			`  max-height: none !important;`,
			`  margin: 0 !important;`,
			`}`
		].join("\n");
	}
	var gridDensityFeature = {
		id: FEATURE_ID$7,
		label: "Grid size",
		pages: ["list", "favorites"],
		defaultEnabled: true,
		cssOnly: true,
		choice: {
			options: [
				{
					value: "default",
					label: "Default"
				},
				{
					value: "compact",
					label: "Compact (150)"
				},
				{
					value: "large",
					label: "Large (250)"
				},
				{
					value: MASONRY_VALUE,
					label: "Masonry"
				}
			],
			defaultValue: "default"
		},
		css: [
			sizeCss("compact", COMPACT_PX),
			sizeCss("large", LARGE_PX),
			masonryCss()
		].join("\n"),
		mount: () => {}
	};
	var SEEN_DIM_FEATURE_ID = "seen-dim";
	var SEEN_CLASS = "rdw-seen";
	var SEEN_DIM_LABEL = "Dim seen posts";
	var SEEN_DIM_OPACITY = "0.65";
	var SEEN_DIM_HOVER_OPACITY = "1";
	var EVENT_PAGESHOW = "pageshow";
	var unsubscribeThumbsAdded$1;
	var pageshowBound = false;
	function stampSeenOnThumbs(root = document) {
		const marks = load().marks;
		const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
		for (const thumb of thumbs) {
			if (!(thumb instanceof HTMLElement)) continue;
			const postId = extractPostIdFromThumb(thumb);
			if (postId === null) continue;
			thumb.classList.toggle(SEEN_CLASS, marks[postId]?.seen === true);
		}
	}
	function onPageShow(event) {
		if (!event.persisted) return;
		reloadFromStorage();
		stampSeenOnThumbs(document);
	}
	function ensureListSubscriptions$1() {
		if (unsubscribeThumbsAdded$1 === void 0) unsubscribeThumbsAdded$1 = onThumbsAdded((root) => {
			stampSeenOnThumbs(root);
		});
		if (!pageshowBound) {
			pageshowBound = true;
			window.addEventListener(EVENT_PAGESHOW, onPageShow);
		}
	}
	function mountSeenDim(ctx) {
		if (ctx.pageKind === "post") {
			const postId = readPostIdFromSearch(ctx.search);
			if (postId === null) {
				log.warn("seen-dim: missing post id in search", ctx.search);
				return;
			}
			setPostSeenMark(postId);
			return;
		}
		if (ctx.pageKind !== "list") return;
		stampSeenOnThumbs(document);
		ensureListSubscriptions$1();
	}
	var seenDimFeature = {
		id: SEEN_DIM_FEATURE_ID,
		label: SEEN_DIM_LABEL,
		pages: ["list", "post"],
		defaultEnabled: true,
		cssOnly: true,
		css: `
body.${featureBodyClass(SEEN_DIM_FEATURE_ID)} .${SEEN_CLASS} img.preview {
  opacity: ${SEEN_DIM_OPACITY};
}

body.${featureBodyClass(SEEN_DIM_FEATURE_ID)} .${SEEN_CLASS}:hover img.preview {
  opacity: ${SEEN_DIM_HOVER_OPACITY};
}
`,
		mount: mountSeenDim
	};
	var IMAGE_LIST_SELECTOR = SITE_SELECTORS.imageList;
	var THUMB_SELECTOR = SITE_SELECTORS.thumb;
	var PAGINATION_SELECTOR = "div.pagination";
	var NEXT_LINK_SELECTOR = "a[alt=\"next\"]";
	function resolveSameOriginUrl(url) {
		const absolute = new URL(url, window.location.href);
		if (absolute.origin !== window.location.origin) throw new Error(`Cross-origin next page URL rejected: ${absolute.origin}`);
		return absolute.href;
	}
	function readNextUrl(doc) {
		const pagination = doc.querySelector(PAGINATION_SELECTOR);
		if (pagination === null) return null;
		const nextLink = pagination.querySelector(NEXT_LINK_SELECTOR);
		if (!(nextLink instanceof HTMLAnchorElement)) return null;
		const href = nextLink.getAttribute("href");
		if (href === null || href.length === 0 || href === "#") return null;
		try {
			return resolveSameOriginUrl(href);
		} catch {
			return null;
		}
	}
	function collectThumbs(doc) {
		const imageList = doc.querySelector(IMAGE_LIST_SELECTOR);
		if (imageList === null) return [];
		return Array.from(imageList.querySelectorAll(THUMB_SELECTOR));
	}
	async function fetchNextPage(url) {
		const requestUrl = resolveSameOriginUrl(url);
		const response = await fetch(requestUrl, {
			method: "GET",
			credentials: FETCH_CREDENTIALS
		});
		if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
		const html = await response.text();
		const doc = new DOMParser().parseFromString(html, "text/html");
		return {
			thumbs: collectThumbs(doc),
			nextUrl: readNextUrl(doc)
		};
	}
	var FEATURE_ID$6 = "infinite-scroll";
	var FEATURE_LABEL$6 = "Infinite scroll";
	var FEATURE_PAGES$6 = ["list"];
	var BODY_FEATURE_CLASS$2 = featureBodyClass(FEATURE_ID$6);
	var ROOT_MARGIN_PX = 800;
	var ROOT_MARGIN = `${String(ROOT_MARGIN_PX)}px`;
	var MIN_REQUEST_INTERVAL_MS = 1e3;
	var CLASS_SENTINEL = "rdw-infinite-sentinel";
	var CLASS_STATUS = "rdw-infinite-status";
	var CLASS_SEPARATOR = "rdw-infinite-page";
	var CLASS_RETRY = "rdw-infinite-retry";
	var CLASS_BLACKLISTED = "rdw-blacklisted";
	var TEXT_LOADING = "Loading…";
	var TEXT_END = "End of results";
	var TEXT_ERROR = "Failed to load more";
	var TEXT_RETRY = "Retry";
	var PAGE_LABEL_PREFIX = "Page ";
	var PAGINATION_NEXT_SELECTOR = "div.pagination a[alt=\"next\"]";
	var WARN_MISSING = "infinite-scroll: missing image-list or next link; not mounted";
	var SCORE_TOKEN_PREFIX$1 = "score:";
	var RATING_TOKEN_PREFIX = "rating:";
	var FEATURE_CSS$6 = `
body.${BODY_FEATURE_CLASS$2} .${CLASS_SENTINEL} {
  display: block;
  width: 100%;
  height: 1px;
  margin: 0;
  padding: 0;
  border: 0;
  pointer-events: none;
}
body.${BODY_FEATURE_CLASS$2} .${CLASS_STATUS} {
  display: block;
  width: 100%;
  margin: 0.75rem 0;
  text-align: center;
  font-size: 0.875rem;
  line-height: 1.4;
  column-span: all;
}
body.${BODY_FEATURE_CLASS$2} .${CLASS_SEPARATOR} {
  display: block;
  width: 100%;
  margin: 0.75rem 0 0.5rem;
  text-align: center;
  font-size: 0.8125rem;
  font-weight: 600;
  opacity: 0.75;
  column-span: all;
}
body.${BODY_FEATURE_CLASS$2} .${CLASS_RETRY} {
  margin-left: 0.5rem;
  color: inherit;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 2px;
  padding: 0.15rem 0.5rem;
  cursor: pointer;
  font: inherit;
}
body.${BODY_FEATURE_CLASS$2} .${CLASS_RETRY}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}
body.${BODY_FEATURE_CLASS$2} span.thumb.${CLASS_BLACKLISTED} {
  display: none !important;
}
`.trim();
	function sleep(ms) {
		return new Promise((resolve) => {
			window.setTimeout(resolve, ms);
		});
	}
	function readInitialNextUrl() {
		const nextLink = document.querySelector(PAGINATION_NEXT_SELECTOR);
		if (!(nextLink instanceof HTMLAnchorElement)) return null;
		const href = nextLink.getAttribute("href");
		if (href === null || href.length === 0 || href === "#") return null;
		try {
			return new URL(href, window.location.href).href;
		} catch {
			return null;
		}
	}
	function parseThumbMeta(thumb) {
		const img = thumb.querySelector(SITE_SELECTORS.previewImage);
		const title = img?.getAttribute("title")?.trim() ?? "";
		const alt = img?.getAttribute("alt")?.trim() ?? "";
		const source = title.length > 0 ? title : alt;
		if (source.length === 0) return {
			tags: [],
			score: 0,
			rating: ""
		};
		const tags = [];
		let score = 0;
		let rating = "";
		for (const token of source.split(/\s+/)) {
			if (token.length === 0) continue;
			const lower = token.toLowerCase();
			if (lower.startsWith(SCORE_TOKEN_PREFIX$1)) {
				const raw = token.slice(6);
				const parsed = Number(raw);
				if (Number.isFinite(parsed)) score = parsed;
				continue;
			}
			if (lower.startsWith(RATING_TOKEN_PREFIX)) {
				rating = token.slice(7);
				continue;
			}
			tags.push(token);
		}
		return {
			tags,
			score,
			rating
		};
	}
	function collectExistingThumbIds() {
		const ids = new Set();
		const thumbs = document.querySelectorAll(SITE_SELECTORS.thumb);
		for (const thumb of thumbs) if (thumb.id.length > 0) ids.add(thumb.id);
		return ids;
	}
	function applyBlacklist(thumb, list) {
		if (!(thumb instanceof HTMLElement)) return;
		const meta = parseThumbMeta(thumb);
		if (isBlacklisted(meta.tags, meta.score, meta.rating, list)) thumb.classList.add(CLASS_BLACKLISTED);
	}
	function createSeparator(pageNumber) {
		const separator = document.createElement("div");
		separator.className = CLASS_SEPARATOR;
		separator.textContent = `${PAGE_LABEL_PREFIX}${String(pageNumber)}`;
		return separator;
	}
	function createUi(imageList) {
		const sentinel = document.createElement("div");
		sentinel.className = CLASS_SENTINEL;
		sentinel.setAttribute("aria-hidden", "true");
		const status = document.createElement("div");
		status.className = CLASS_STATUS;
		status.setAttribute("role", "status");
		status.setAttribute("aria-live", "polite");
		imageList.after(sentinel, status);
		return {
			sentinel,
			status
		};
	}
	function setStatusLoading(status) {
		status.replaceChildren();
		status.textContent = TEXT_LOADING;
	}
	function setStatusEnd(status) {
		status.replaceChildren();
		status.textContent = TEXT_END;
	}
	function setStatusError(status, onRetry) {
		status.replaceChildren();
		const message = document.createElement("span");
		message.textContent = TEXT_ERROR;
		const retry = document.createElement("button");
		retry.type = "button";
		retry.className = CLASS_RETRY;
		retry.textContent = TEXT_RETRY;
		retry.addEventListener("click", (event) => {
			event.preventDefault();
			onRetry();
		});
		status.append(message, retry);
	}
	function clearStatus(status) {
		status.replaceChildren();
	}
	function isSentinelNear(sentinel) {
		const rect = sentinel.getBoundingClientRect();
		const viewBottom = window.innerHeight + ROOT_MARGIN_PX;
		return rect.top < viewBottom && rect.bottom > -800;
	}
	function mountInfiniteScroll(_ctx) {
		const imageList = document.querySelector(SITE_SELECTORS.imageList);
		if (imageList === null) {
			log.warn(WARN_MISSING);
			return;
		}
		let nextUrl = readInitialNextUrl();
		if (nextUrl === null) {
			log.warn(WARN_MISSING);
			return;
		}
		const { sentinel, status } = createUi(imageList);
		let inFlight = false;
		let lastRequestAt = 0;
		let pageNumber = 1;
		let ended = false;
		let observer = null;
		const finish = () => {
			ended = true;
			nextUrl = null;
			setStatusEnd(status);
			if (observer !== null) {
				observer.disconnect();
				observer = null;
			}
		};
		const appendBatch = async (requestUrl) => {
			const result = await fetchNextPage(requestUrl);
			pageNumber += 1;
			imageList.append(createSeparator(pageNumber));
			const existingIds = collectExistingThumbIds();
			const blacklist = readSiteBlacklist();
			for (const thumb of result.thumbs) {
				if (thumb.id.length > 0 && existingIds.has(thumb.id)) continue;
				const node = document.importNode(thumb, true);
				if (node.id.length > 0) existingIds.add(node.id);
				applyBlacklist(node, blacklist);
				imageList.append(node);
			}
			notifyThumbsAdded(imageList);
			return result.nextUrl;
		};
		const loadMore = async (options) => {
			if (ended || inFlight || nextUrl === null) return;
			inFlight = true;
			let bypassRateLimit = options?.bypassRateLimit === true;
			try {
				while (!ended && nextUrl !== null && isSentinelNear(sentinel)) {
					const elapsed = Date.now() - lastRequestAt;
					if (!bypassRateLimit && lastRequestAt > 0 && elapsed < MIN_REQUEST_INTERVAL_MS) {
						await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
						continue;
					}
					bypassRateLimit = false;
					const requestUrl = nextUrl;
					lastRequestAt = Date.now();
					setStatusLoading(status);
					try {
						nextUrl = await appendBatch(requestUrl);
						clearStatus(status);
						if (nextUrl === null) {
							finish();
							return;
						}
					} catch (error) {
						log.warn("infinite-scroll: fetch failed", requestUrl, error);
						setStatusError(status, () => {
							loadMore({ bypassRateLimit: true });
						});
						return;
					}
				}
			} finally {
				inFlight = false;
			}
		};
		observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				loadMore();
				break;
			}
		}, {
			root: null,
			rootMargin: ROOT_MARGIN,
			threshold: 0
		});
		observer.observe(sentinel);
	}
	var infiniteScrollFeature = {
		id: FEATURE_ID$6,
		label: FEATURE_LABEL$6,
		pages: [...FEATURE_PAGES$6],
		defaultEnabled: true,
		css: FEATURE_CSS$6,
		mount: mountInfiniteScroll
	};
	var FEATURE_ID$5 = "menu-cleanup";
	var FEATURE_LABEL$5 = "Clean header menu";
	var CONTENT_ID = "content";
	var HIDDEN_CLASS = "rdw-menu-hidden";
	var BODY_FEATURE_CLASS$1 = featureBodyClass(FEATURE_ID$5);
	var MISSING_MENU_WARN = "Header menu not found";
	var HIDE_LINK_TEXT_SET = new Set([
		"iCame Top 100",
		"Discord",
		"X",
		"Other Sites",
		"Contact Us",
		"DMCA",
		"About",
		"TOS"
	]);
	var FEATURE_PAGES$5 = [
		"list",
		"post",
		"favorites",
		"other"
	];
	var FEATURE_CSS$5 = `body.${BODY_FEATURE_CLASS$1} li.${HIDDEN_CLASS} { display:none !important; }`;
	function isHeaderMenuLink(anchor, content) {
		const listItem = anchor.closest("li");
		if (listItem === null) return false;
		if (content !== null && content.contains(listItem)) return false;
		return true;
	}
	function collectHeaderMenuLinks() {
		const content = document.getElementById(CONTENT_ID);
		const anchors = document.querySelectorAll("a");
		const headerLinks = [];
		for (const node of anchors) {
			if (!(node instanceof HTMLAnchorElement)) continue;
			if (!isHeaderMenuLink(node, content)) continue;
			headerLinks.push(node);
		}
		return headerLinks;
	}
	function mountMenuCleanup(_ctx) {
		const headerLinks = collectHeaderMenuLinks();
		if (headerLinks.length === 0) {
			log.warn(MISSING_MENU_WARN);
			return;
		}
		for (const anchor of headerLinks) {
			const text = anchor.textContent?.trim() ?? "";
			if (!HIDE_LINK_TEXT_SET.has(text)) continue;
			const listItem = anchor.closest("li");
			if (listItem === null) continue;
			listItem.classList.add(HIDDEN_CLASS);
		}
	}
	var menuCleanupFeature = {
		id: FEATURE_ID$5,
		label: FEATURE_LABEL$5,
		pages: [...FEATURE_PAGES$5],
		defaultEnabled: true,
		cssOnly: true,
		css: FEATURE_CSS$5,
		mount: mountMenuCleanup
	};
	var FEATURE_ID$4 = "playlist-bar";
	var FEATURE_LABEL$4 = "Playlist header";
	var FEATURE_PAGES$4 = ["list"];
	var ROOT_ID$1 = "rdw-playlist-bar";
	var ROOT_CLASS$1 = "rdw-playlist-bar";
	var TITLE_CLASS = "rdw-playlist-bar-title";
	var NAME_CLASS = "rdw-playlist-bar-name";
	var COUNT_CLASS = "rdw-playlist-bar-count";
	var PARTS_CLASS = "rdw-playlist-bar-parts";
	var PART_LABEL_CLASS = "rdw-playlist-bar-part-label";
	var PART_LINK_CLASS = "rdw-playlist-bar-part-link";
	var CAPTION_CLASS = "rdw-playlist-bar-caption";
	var TEXT_POSTS_SUFFIX = " posts";
	var TEXT_PART_PREFIX = "Part ";
	var TEXT_PART_OF = " of ";
	var TEXT_CAPTION = "Posts are ordered by the site (newest first).";
	var TEXT_PREV = "Previous";
	var TEXT_NEXT = "Next";
	var WARN_MISSING_HOST = "playlist-bar: image-list not found; playlist bar not mounted";
	var BODY_CLASS$1 = featureBodyClass(FEATURE_ID$4);
	var FEATURE_CSS$4 = `
body.${BODY_CLASS$1} .${ROOT_CLASS$1} {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-width: 100%;
  margin: 0.5rem 0;
  padding: 0.5rem 0.65rem;
  border: 1px solid #666;
  border-radius: 2px;
  background: #f7f7f7;
  box-sizing: border-box;
}
body.${BODY_CLASS$1} .${TITLE_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.75rem;
  max-width: 100%;
  font: inherit;
  line-height: 1.3;
}
body.${BODY_CLASS$1} .${NAME_CLASS} {
  font-weight: 600;
}
body.${BODY_CLASS$1} .${COUNT_CLASS} {
  opacity: 0.85;
}
body.${BODY_CLASS$1} .${PARTS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
  max-width: 100%;
  font: inherit;
  line-height: 1.3;
}
body.${BODY_CLASS$1} .${PART_LABEL_CLASS} {
  flex: 0 0 auto;
}
body.${BODY_CLASS$1} a.${PART_LINK_CLASS} {
  color: inherit;
  text-decoration: underline;
}
body.${BODY_CLASS$1} a.${PART_LINK_CLASS}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}
body.${BODY_CLASS$1} .${CAPTION_CLASS} {
  margin: 0;
  font: inherit;
  font-size: 0.875rem;
  line-height: 1.35;
  opacity: 0.8;
}
`.trim();
	function readTagsParam(search) {
		return new URLSearchParams(search).get("tags") ?? "";
	}
	function idsEqualAsSet(left, right) {
		if (left.length !== right.length) return false;
		const set = new Set(left);
		if (set.size !== left.length) return false;
		for (const id of right) if (!set.has(id)) return false;
		return true;
	}
	function containsAllIds(postIds, queryIds) {
		const set = new Set(postIds);
		for (const id of queryIds) if (!set.has(id)) return false;
		return true;
	}
	function findPlaylistMatch(queryIds) {
		const chunkSize = getPlaylistChunkSize();
		const candidates = [];
		for (const playlist of listPlaylists()) {
			const postIds = playlist.postIds ?? [];
			if (!containsAllIds(postIds, queryIds)) continue;
			const partQueries = buildPlaylistQueries(postIds, chunkSize);
			let partIndex = -1;
			for (let index = 0; index < partQueries.length; index += 1) {
				const chunkQuery = partQueries[index];
				if (chunkQuery === void 0) continue;
				const chunkIds = parsePlaylistQuery(chunkQuery);
				if (chunkIds !== null && idsEqualAsSet(queryIds, chunkIds)) {
					partIndex = index;
					break;
				}
			}
			candidates.push({
				playlist,
				partIndex,
				partQueries
			});
		}
		if (candidates.length === 0) return null;
		return candidates.find((entry) => entry.partIndex >= 0) ?? candidates[0] ?? null;
	}
	function buildPlaylistSearchUrl(query) {
		return buildSearchUrl(parseTags(query));
	}
	function removeExistingBar(root) {
		const existing = root instanceof Document ? root.getElementById(ROOT_ID$1) : root.querySelector(`#${ROOT_ID$1}`);
		if (existing !== null) existing.remove();
	}
	function findImageList(root) {
		return root.querySelector(SITE_SELECTORS.imageList);
	}
	function findFallbackHost(root) {
		return root.querySelector(SITE_SELECTORS.postListContent) ?? root.querySelector(SITE_SELECTORS.contentRoot);
	}
	function insertBar(host, bar, before) {
		if (before !== null && before.parentElement === host) {
			host.insertBefore(bar, before);
			return;
		}
		if (before !== null) {
			before.parentElement?.insertBefore(bar, before);
			return;
		}
		host.insertBefore(bar, host.firstChild);
	}
	function formatPostCount(count) {
		return `${String(count)}${TEXT_POSTS_SUFFIX}`;
	}
	function formatPartLabel(partIndex, total) {
		return `${TEXT_PART_PREFIX}${String(partIndex + 1)}${TEXT_PART_OF}${String(total)}`;
	}
	function appendNeighborLink(parent, label, query) {
		if (query === void 0) return;
		const link = document.createElement("a");
		link.className = PART_LINK_CLASS;
		link.href = buildPlaylistSearchUrl(query);
		link.textContent = label;
		parent.append(link);
	}
	function buildPartsRow(match) {
		const { partIndex, partQueries } = match;
		if (partQueries.length === 0 || partIndex < 0) return null;
		const row = document.createElement("div");
		row.className = PARTS_CLASS;
		const label = document.createElement("span");
		label.className = PART_LABEL_CLASS;
		label.textContent = formatPartLabel(partIndex, partQueries.length);
		row.append(label);
		if (partQueries.length > 1) {
			appendNeighborLink(row, TEXT_PREV, partQueries[partIndex - 1]);
			appendNeighborLink(row, TEXT_NEXT, partQueries[partIndex + 1]);
		}
		return row;
	}
	function createBar(match) {
		const bar = document.createElement("div");
		bar.id = ROOT_ID$1;
		bar.className = ROOT_CLASS$1;
		const title = document.createElement("div");
		title.className = TITLE_CLASS;
		const name = document.createElement("span");
		name.className = NAME_CLASS;
		name.textContent = match.playlist.name;
		const count = document.createElement("span");
		count.className = COUNT_CLASS;
		count.textContent = formatPostCount(match.playlist.postIds?.length ?? 0);
		title.append(name, count);
		bar.append(title);
		const parts = buildPartsRow(match);
		if (parts !== null) bar.append(parts);
		const caption = document.createElement("p");
		caption.className = CAPTION_CLASS;
		caption.textContent = TEXT_CAPTION;
		bar.append(caption);
		return bar;
	}
	function mountPlaylistBar(ctx) {
		removeExistingBar(document);
		const queryIds = parsePlaylistQuery(readTagsParam(ctx.search));
		if (queryIds === null) return;
		const match = findPlaylistMatch(queryIds);
		if (match === null) return;
		const imageList = findImageList(document);
		const bar = createBar(match);
		if (imageList !== null) {
			const host = imageList.parentElement;
			if (host === null) {
				log.warn(WARN_MISSING_HOST);
				return;
			}
			insertBar(host, bar, imageList);
			return;
		}
		const fallback = findFallbackHost(document);
		if (fallback === null) {
			log.warn(WARN_MISSING_HOST);
			return;
		}
		log.warn(WARN_MISSING_HOST);
		insertBar(fallback, bar, null);
	}
	var playlistBarFeature = {
		id: FEATURE_ID$4,
		label: FEATURE_LABEL$4,
		pages: [...FEATURE_PAGES$4],
		defaultEnabled: true,
		css: FEATURE_CSS$4,
		mount: mountPlaylistBar
	};
	var FEATURE_ID$3 = "playlist-menu";
	var FEATURE_LABEL$3 = "Add to playlist button";
	var FEATURE_PAGES$3 = ["list", "post"];
	var CLASS_ADD = "rdw-playlist-add";
	var CLASS_ADD_IN = "rdw-playlist-add--in";
	var CLASS_MENU = "rdw-playlist-menu";
	var CLASS_MENU_POPUP = "rdw-playlist-menu--popup";
	var CLASS_LIST = "rdw-playlist-menu-list";
	var CLASS_ITEM = "rdw-playlist-menu-item";
	var CLASS_CHECK = "rdw-playlist-menu-check";
	var CLASS_NAME = "rdw-playlist-menu-name";
	var CLASS_NEW = "rdw-playlist-menu-new";
	var CLASS_NEW_FORM = "rdw-playlist-menu-new-form";
	var CLASS_NEW_INPUT = "rdw-playlist-menu-new-input";
	var CLASS_NEW_SUBMIT = "rdw-playlist-menu-new-submit";
	var ATTR_POST_ID = "data-rdw-post-id";
	var TEXT_ADD_GLYPH = "+";
	var TEXT_NEW_PLAYLIST = "New playlist…";
	var TEXT_CREATE = "Create";
	var TEXT_CHECK_MARK = "✓";
	var LABEL_ADD = "Add to playlist";
	var LABEL_TOGGLE_PREFIX = "Toggle playlist";
	var LABEL_NEW_NAME = "New playlist name";
	var MENU_Z_INDEX = 2147483645;
	var MENU_MIN_WIDTH_PX = 180;
	var MENU_MAX_HEIGHT_PX = 280;
	var MENU_GAP_PX = 4;
	var BUTTON_SIZE_PX = 28;
	var BUTTON_OFFSET_PX = 4;
	var BUTTON_BELOW_FAV_TOP_PX = 36;
	var FOCUS_OUTLINE$1 = "2px solid #4c8bf5";
	var FOCUS_OUTLINE_OFFSET$1 = "2px";
	var EVENT_KEYDOWN$1 = "keydown";
	var EVENT_POINTERDOWN = "pointerdown";
	var KEY_ESCAPE = "Escape";
	var KEY_ENTER$1 = "Enter";
	var BODY_SELECTOR$1 = `body.${featureBodyClass(FEATURE_ID$3)}`;
	var FEATURE_CSS$3 = `
${BODY_SELECTOR$1} .${CLASS_ADD} {
  position: absolute;
  top: ${String(BUTTON_BELOW_FAV_TOP_PX)}px;
  right: ${String(BUTTON_OFFSET_PX)}px;
  position-anchor: --rdw-img;
  top: calc(anchor(top) + ${String(BUTTON_BELOW_FAV_TOP_PX)}px);
  right: calc(anchor(right) + ${String(BUTTON_OFFSET_PX)}px);
  z-index: 5;
  box-sizing: border-box;
  min-width: ${String(BUTTON_SIZE_PX)}px;
  min-height: ${String(BUTTON_SIZE_PX)}px;
  width: ${String(BUTTON_SIZE_PX)}px;
  height: ${String(BUTTON_SIZE_PX)}px;
  padding: 0;
  border: 1px solid #333;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.92);
  color: #333;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  opacity: 0;
}
${BODY_SELECTOR$1} .${THUMB_CLASS}:hover .${CLASS_ADD},
${BODY_SELECTOR$1} .${CLASS_ADD}:focus-visible,
${BODY_SELECTOR$1} .${CLASS_ADD}.${CLASS_ADD_IN} {
  opacity: 0.65;
}
${BODY_SELECTOR$1} .${THUMB_CLASS} .${CLASS_ADD}:hover,
${BODY_SELECTOR$1} .${CLASS_ADD}.${CLASS_ADD_IN} {
  opacity: 1;
}
${BODY_SELECTOR$1} .${CLASS_ADD}:focus-visible {
  outline: ${FOCUS_OUTLINE$1};
  outline-offset: ${FOCUS_OUTLINE_OFFSET$1};
}
${BODY_SELECTOR$1} .${CLASS_ADD}.${CLASS_ADD_IN} {
  background: #dceeff;
  border-color: #3a6ea5;
  color: #1a3a5c;
}
${BODY_SELECTOR$1} .${CLASS_MENU} {
  box-sizing: border-box;
  min-width: ${String(MENU_MIN_WIDTH_PX)}px;
  max-height: ${String(MENU_MAX_HEIGHT_PX)}px;
  overflow: auto;
  padding: 0.35rem;
  border: 1px solid #444;
  border-radius: 4px;
  background: #fff;
  color: #1a1a1a;
  font: 13px/1.3 Segoe UI, system-ui, sans-serif;
}
${BODY_SELECTOR$1} .${CLASS_MENU}.${CLASS_MENU_POPUP} {
  position: fixed;
  z-index: ${String(MENU_Z_INDEX)};
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}
${BODY_SELECTOR$1} .${CLASS_LIST} {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin: 0 0 0.35rem;
  padding: 0;
  list-style: none;
}
${BODY_SELECTOR$1} .${CLASS_ITEM} {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  margin: 0;
  padding: 0.25rem 0.35rem;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
${BODY_SELECTOR$1} .${CLASS_ITEM}:hover,
${BODY_SELECTOR$1} .${CLASS_ITEM}:focus-visible {
  background: #e8f0fe;
}
${BODY_SELECTOR$1} .${CLASS_ITEM}:focus-visible {
  outline: ${FOCUS_OUTLINE$1};
  outline-offset: ${FOCUS_OUTLINE_OFFSET$1};
}
${BODY_SELECTOR$1} .${CLASS_CHECK} {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  flex: 0 0 1rem;
  font-weight: 700;
}
${BODY_SELECTOR$1} .${CLASS_NAME} {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${BODY_SELECTOR$1} .${CLASS_NEW},
${BODY_SELECTOR$1} .${CLASS_NEW_SUBMIT} {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 0.3rem 0.4rem;
  border: 1px solid #666;
  border-radius: 2px;
  background: #f5f5f5;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
}
${BODY_SELECTOR$1} .${CLASS_NEW}:focus-visible,
${BODY_SELECTOR$1} .${CLASS_NEW_SUBMIT}:focus-visible,
${BODY_SELECTOR$1} .${CLASS_NEW_INPUT}:focus-visible {
  outline: ${FOCUS_OUTLINE$1};
  outline-offset: ${FOCUS_OUTLINE_OFFSET$1};
}
${BODY_SELECTOR$1} .${CLASS_NEW_FORM} {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
${BODY_SELECTOR$1} .${CLASS_NEW_INPUT} {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  padding: 0.3rem 0.4rem;
  border: 1px solid #666;
  border-radius: 2px;
  font: inherit;
}
`;
	var unsubscribeThumbsAdded;
	var openPopup = null;
	var escapeBound = false;
	var pointerBound = false;
	function parsePostId(value) {
		if (value === null || value.length === 0) return null;
		const parsed = Number(value);
		if (!Number.isFinite(parsed)) return null;
		const truncated = Math.trunc(parsed);
		return truncated < 0 ? null : truncated;
	}
	function postInAnyPlaylist(postId) {
		return playlistsContaining(postId).length > 0;
	}
	function applyAddButtonState(button, postId) {
		const inPlaylist = postInAnyPlaylist(postId);
		button.classList.toggle(CLASS_ADD_IN, inPlaylist);
		button.setAttribute("aria-pressed", inPlaylist ? "true" : "false");
		button.setAttribute("aria-label", `${LABEL_ADD} ${String(postId)}`);
	}
	function findThumbLink(thumb, postId) {
		const byId = thumb.querySelector(`#p${postId}`);
		if (byId instanceof HTMLAnchorElement) return byId;
		const byHref = thumb.querySelector(SITE_SELECTORS.thumbLink);
		return byHref instanceof HTMLAnchorElement ? byHref : null;
	}
	function closeOpenMenu() {
		if (openPopup === null) return;
		openPopup.menu.remove();
		openPopup.trigger.setAttribute("aria-expanded", "false");
		openPopup = null;
		unbindGlobalCloseListeners();
	}
	function onDocumentKeydown(event) {
		if (event.key !== KEY_ESCAPE) return;
		if (openPopup === null) return;
		event.preventDefault();
		closeOpenMenu();
	}
	function onDocumentPointerDown(event) {
		if (openPopup === null) return;
		const target = event.target;
		if (!(target instanceof Node)) return;
		if (openPopup.menu.contains(target) || openPopup.trigger.contains(target)) return;
		closeOpenMenu();
	}
	function bindGlobalCloseListeners() {
		if (!escapeBound) {
			escapeBound = true;
			document.addEventListener(EVENT_KEYDOWN$1, onDocumentKeydown);
		}
		if (!pointerBound) {
			pointerBound = true;
			document.addEventListener(EVENT_POINTERDOWN, onDocumentPointerDown, true);
		}
	}
	function unbindGlobalCloseListeners() {
		if (escapeBound) {
			document.removeEventListener(EVENT_KEYDOWN$1, onDocumentKeydown);
			escapeBound = false;
		}
		if (pointerBound) {
			document.removeEventListener(EVENT_POINTERDOWN, onDocumentPointerDown, true);
			pointerBound = false;
		}
	}
	function positionMenuNear(menu, anchor) {
		const rect = anchor.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		menu.style.visibility = "hidden";
		menu.style.left = "0";
		menu.style.top = "0";
		document.body.append(menu);
		const menuWidth = menu.offsetWidth;
		const menuHeight = menu.offsetHeight;
		let left = rect.right - menuWidth;
		if (left < MENU_GAP_PX) left = Math.min(rect.left, viewportWidth - menuWidth - MENU_GAP_PX);
		left = Math.max(MENU_GAP_PX, Math.min(left, viewportWidth - menuWidth - MENU_GAP_PX));
		let top = rect.bottom + MENU_GAP_PX;
		if (top + menuHeight > viewportHeight - MENU_GAP_PX) top = rect.top - menuHeight - MENU_GAP_PX;
		if (top < MENU_GAP_PX) top = MENU_GAP_PX;
		menu.style.left = `${String(left)}px`;
		menu.style.top = `${String(top)}px`;
		menu.style.visibility = "";
	}
	function syncAddButtonsForPost(postId) {
		const buttons = document.querySelectorAll(`button.${CLASS_ADD}[${ATTR_POST_ID}="${String(postId)}"]`);
		for (const node of buttons) {
			if (!(node instanceof HTMLButtonElement)) continue;
			applyAddButtonState(node, postId);
		}
	}
	function fillPlaylistList(list, postId) {
		list.replaceChildren();
		const playlists = listPlaylists();
		const memberIds = new Set(playlistsContaining(postId).map((item) => item.id));
		for (const playlist of playlists) {
			const item = document.createElement("button");
			item.type = "button";
			item.className = CLASS_ITEM;
			item.setAttribute("role", "menuitemcheckbox");
			const checked = memberIds.has(playlist.id);
			item.setAttribute("aria-checked", checked ? "true" : "false");
			item.setAttribute("aria-label", `${LABEL_TOGGLE_PREFIX} ${playlist.name}`);
			const check = document.createElement("span");
			check.className = CLASS_CHECK;
			check.setAttribute("aria-hidden", "true");
			check.textContent = checked ? TEXT_CHECK_MARK : "";
			const name = document.createElement("span");
			name.className = CLASS_NAME;
			name.textContent = playlist.name;
			item.append(check, name);
			item.addEventListener("click", (event) => {
				event.preventDefault();
				event.stopPropagation();
				if (memberIds.has(playlist.id)) removePostFromPlaylist(playlist.id, postId);
				else addPostToPlaylist(playlist.id, postId);
				fillPlaylistList(list, postId);
				syncAddButtonsForPost(postId);
			});
			list.append(item);
		}
	}
	function showNewPlaylistForm(host, list, postId, onCreated) {
		host.replaceChildren();
		const form = document.createElement("div");
		form.className = CLASS_NEW_FORM;
		const input = document.createElement("input");
		input.type = "text";
		input.className = CLASS_NEW_INPUT;
		input.setAttribute("aria-label", LABEL_NEW_NAME);
		input.autocomplete = "off";
		const submit = document.createElement("button");
		submit.type = "button";
		submit.className = CLASS_NEW_SUBMIT;
		submit.textContent = TEXT_CREATE;
		const commit = () => {
			const name = input.value.trim();
			if (name.length === 0) return;
			addPostToPlaylist(createPlaylist(name).id, postId);
			fillPlaylistList(list, postId);
			syncAddButtonsForPost(postId);
			onCreated?.();
		};
		submit.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			commit();
		});
		input.addEventListener("keydown", (event) => {
			if (event.key !== KEY_ENTER$1) return;
			event.preventDefault();
			event.stopPropagation();
			commit();
		});
		form.append(input, submit);
		host.append(form);
		input.focus();
	}
	function mountNewPlaylistControl(host, list, postId, onCreated) {
		host.replaceChildren();
		const button = document.createElement("button");
		button.type = "button";
		button.className = CLASS_NEW;
		button.textContent = TEXT_NEW_PLAYLIST;
		button.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			showNewPlaylistForm(host, list, postId, onCreated);
		});
		host.append(button);
	}
	function createPlaylistMenu(postId, options) {
		const root = document.createElement("div");
		root.className = CLASS_MENU;
		root.setAttribute("role", "menu");
		root.setAttribute(ATTR_POST_ID, String(postId));
		const list = document.createElement("div");
		list.className = CLASS_LIST;
		list.setAttribute("role", "group");
		fillPlaylistList(list, postId);
		const newHost = document.createElement("div");
		mountNewPlaylistControl(newHost, list, postId, options?.onCreated);
		root.append(list, newHost);
		return root;
	}
	function openMenuForButton(button, postId) {
		if (openPopup !== null && openPopup.trigger === button) {
			closeOpenMenu();
			return;
		}
		closeOpenMenu();
		const menu = createPlaylistMenu(postId, { onCreated: () => {
			closeOpenMenu();
		} });
		menu.classList.add(CLASS_MENU_POPUP);
		positionMenuNear(menu, button);
		button.setAttribute("aria-expanded", "true");
		openPopup = {
			menu,
			trigger: button,
			postId
		};
		bindGlobalCloseListeners();
	}
	function attachAddButton(thumb, postId) {
		if (thumb.querySelector(`button.${CLASS_ADD}`) !== null) return;
		const numericId = parsePostId(postId);
		if (numericId === null) return;
		const link = findThumbLink(thumb, postId);
		if (link === null) return;
		ensureThumbAnchor(thumb);
		const button = document.createElement("button");
		button.type = "button";
		button.className = CLASS_ADD;
		button.textContent = TEXT_ADD_GLYPH;
		button.setAttribute(ATTR_POST_ID, String(numericId));
		button.setAttribute("aria-haspopup", "menu");
		button.setAttribute("aria-expanded", "false");
		applyAddButtonState(button, numericId);
		button.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			openMenuForButton(button, numericId);
		});
		link.after(button);
	}
	function stampPlaylistButtons(root = document) {
		const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
		for (const thumb of thumbs) {
			if (!(thumb instanceof HTMLElement)) continue;
			const postId = extractPostIdFromThumb(thumb);
			if (postId === null) continue;
			attachAddButton(thumb, postId);
		}
	}
	function ensureListSubscriptions() {
		if (unsubscribeThumbsAdded !== void 0) return;
		unsubscribeThumbsAdded = onThumbsAdded((root) => {
			stampPlaylistButtons(root);
		});
	}
	function mountPlaylistMenu(ctx) {
		if (ctx.pageKind !== "list") return;
		stampPlaylistButtons(document);
		ensureListSubscriptions();
	}
	var playlistMenuFeature = {
		id: FEATURE_ID$3,
		label: FEATURE_LABEL$3,
		pages: [...FEATURE_PAGES$3],
		defaultEnabled: true,
		css: FEATURE_CSS$3,
		mount: mountPlaylistMenu
	};
	var FEATURE_ID$2 = "post-actions";
	var FEATURE_LABEL$2 = "Post side panel";
	var FEATURE_PAGES$2 = ["post"];
	var HOST_RIGHT_COL_ID = "right-col";
	var LINK_LIST_SELECTOR = "div.link-list ul";
	var ORIGINAL_LINK_TEXT = "Original image";
	var ADD_FAVORITES_LINK_TEXT = "Add to favorites";
	var SCORE_SPAN_ID_PREFIX = "psc";
	var NARROW_BREAKPOINT_PX = 1100;
	var NARROW_MEDIA_QUERY = `(max-width: ${String(1099)}px)`;
	var PANEL_WIDTH_PX = 160;
	var PANEL_TOP = "2.5rem";
	var PANEL_Z_INDEX = 100;
	var CLASS_PANEL = "rdw-post-actions";
	var CLASS_MODE_FIXED = "rdw-post-actions--fixed";
	var CLASS_MODE_NARROW = "rdw-post-actions--narrow";
	var CLASS_FAV_WRAP = "rdw-post-actions-fav-wrap";
	var CLASS_FAV_BUTTON = "rdw-post-actions-fav";
	var CLASS_FAV_LABEL = "rdw-post-actions-fav-label";
	var CLASS_ORIGINAL = "rdw-post-actions-original";
	var CLASS_SCORE_ROW = "rdw-post-actions-score-row";
	var CLASS_SCORE = "rdw-post-actions-score";
	var CLASS_VOTE = "rdw-post-actions-vote";
	var CLASS_OPTION = "rdw-post-actions-option";
	var TEXT_FAVORITE = "Favorite";
	var TEXT_IN_FAVORITES = "In favorites";
	var TEXT_ORIGINAL = "Original";
	var TEXT_SCORE_PREFIX = "Score: ";
	var TEXT_VOTE_UP = "Vote up";
	var TEXT_SCORE_UNKNOWN = "—";
	var LABEL_ORIGINAL = "Open original image";
	var LABEL_VOTE_UP = "Vote up";
	var EXCLUDED_OPTION_TEXTS = new Set([ORIGINAL_LINK_TEXT, ADD_FAVORITES_LINK_TEXT]);
	var WARN_NO_RIGHT_COL = "post-actions: #right-col missing in narrow mode; panel stays on body";
	var FOCUS_OUTLINE = "2px solid #4c8bf5";
	var FOCUS_OUTLINE_OFFSET = "2px";
	var BODY_SELECTOR = `body.${featureBodyClass(FEATURE_ID$2)}`;
	var FEATURE_CSS$2 = `
${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_PANEL} {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.35rem;
  box-sizing: border-box;
  padding: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.3;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_MODE_FIXED} {
  position: fixed;
  right: 0;
  top: ${PANEL_TOP};
  width: ${String(PANEL_WIDTH_PX)}px;
  z-index: ${String(PANEL_Z_INDEX)};
}
${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_MODE_NARROW} {
  position: static;
  width: auto;
  margin: 0 0 0.75rem;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_WRAP},
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_SCORE_ROW} {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_BUTTON},
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_ORIGINAL},
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_VOTE},
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_OPTION} {
  color: inherit;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 2px;
  padding: 0.15rem 0.45rem;
  cursor: pointer;
  text-decoration: none;
  font: inherit;
  text-align: left;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_BUTTON}.${CSS_CLASS.cardFavMarked} {
  font-weight: 600;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_BUTTON}:focus-visible,
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_ORIGINAL}:focus-visible,
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_VOTE}:focus-visible,
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_OPTION}:focus-visible {
  outline: ${FOCUS_OUTLINE};
  outline-offset: ${FOCUS_OUTLINE_OFFSET};
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_VOTE}:disabled,
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_OPTION}:disabled {
  opacity: 0.6;
  cursor: wait;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_SCORE} {
  font-variant-numeric: tabular-nums;
}
`.trim();
	var layoutCleanup = null;
	function removeExistingPanel() {
		if (layoutCleanup !== null) {
			layoutCleanup();
			layoutCleanup = null;
		}
		const existing = document.getElementById(POST_ACTIONS_ID);
		if (existing !== null) existing.remove();
	}
	function isNarrowViewport() {
		if (typeof window.matchMedia === "function") return window.matchMedia(NARROW_MEDIA_QUERY).matches;
		return window.innerWidth < NARROW_BREAKPOINT_PX;
	}
	function placePanel(panel, narrow) {
		panel.classList.toggle(CLASS_MODE_FIXED, !narrow);
		panel.classList.toggle(CLASS_MODE_NARROW, narrow);
		if (narrow) {
			const rightCol = document.getElementById(HOST_RIGHT_COL_ID);
			if (rightCol !== null) {
				rightCol.insertBefore(panel, rightCol.firstChild);
				return;
			}
			log.warn(WARN_NO_RIGHT_COL);
		}
		if (panel.parentElement !== document.body) document.body.append(panel);
	}
	function bindLayoutMode(panel) {
		const sync = () => {
			placePanel(panel, isNarrowViewport());
		};
		sync();
		if (typeof window.matchMedia === "function") {
			const media = window.matchMedia(NARROW_MEDIA_QUERY);
			const onChange = () => {
				sync();
			};
			if (typeof media.addEventListener === "function") {
				media.addEventListener("change", onChange);
				layoutCleanup = () => {
					media.removeEventListener("change", onChange);
				};
				return;
			}
			if (typeof media.addListener === "function") {
				media.addListener(onChange);
				layoutCleanup = () => {
					media.removeListener(onChange);
				};
				return;
			}
		}
		const onResize = () => {
			sync();
		};
		window.addEventListener("resize", onResize);
		layoutCleanup = () => {
			window.removeEventListener("resize", onResize);
		};
	}
	function findOriginalAnchor() {
		const list = document.querySelector(LINK_LIST_SELECTOR);
		const roots = list !== null ? [list, document] : [document];
		for (const root of roots) {
			const links = root.querySelectorAll("a[href]");
			for (const node of links) {
				if (!(node instanceof HTMLAnchorElement)) continue;
				if (node.textContent?.trim() !== ORIGINAL_LINK_TEXT) continue;
				const href = node.getAttribute("href");
				if (href === null || href.length === 0 || href === "#") continue;
				return node;
			}
		}
		return null;
	}
	function collectOptionAnchors() {
		const list = document.querySelector(LINK_LIST_SELECTOR);
		if (list === null) return [];
		const result = [];
		const links = list.querySelectorAll("a[href]");
		for (const node of links) {
			if (!(node instanceof HTMLAnchorElement)) continue;
			const text = node.textContent?.trim() ?? "";
			if (text.length === 0 || EXCLUDED_OPTION_TEXTS.has(text)) continue;
			result.push(node);
		}
		return result;
	}
	function readScoreText(postId) {
		const span = document.getElementById(`${SCORE_SPAN_ID_PREFIX}${postId}`);
		if (span === null) return TEXT_SCORE_UNKNOWN;
		const text = span.textContent?.trim() ?? "";
		return text.length > 0 ? text : TEXT_SCORE_UNKNOWN;
	}
	function applyScoreValue(postId, scoreLabel, score) {
		const text = String(score);
		scoreLabel.textContent = `${TEXT_SCORE_PREFIX}${text}`;
		const span = document.getElementById(`${SCORE_SPAN_ID_PREFIX}${postId}`);
		if (span !== null) span.textContent = text;
	}
	function syncFavLabel(label, marked) {
		label.textContent = marked ? TEXT_IN_FAVORITES : TEXT_FAVORITE;
	}
	function createPostFavControl(postId, scoreLabel) {
		const marked = isFav(postId);
		const template = createFavButton(postId, marked, CLASS_FAV_BUTTON);
		const cloned = template.cloneNode(true);
		if (!(cloned instanceof HTMLButtonElement)) return template;
		applyFavButtonState(cloned, marked ? "marked" : "idle", postId);
		const wrap = document.createElement("span");
		wrap.className = CLASS_FAV_WRAP;
		const label = document.createElement("span");
		label.className = CLASS_FAV_LABEL;
		syncFavLabel(label, marked);
		cloned.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			handlePostFavClick(cloned, label, postId, scoreLabel);
		});
		wrap.append(cloned, label);
		return wrap;
	}
	async function handlePostFavClick(button, label, postId, scoreLabel) {
		if (button.disabled) return;
		const currentlyMarked = button.getAttribute("aria-pressed") === "true";
		applyFavButtonState(button, "pending", postId);
		if (currentlyMarked) {
			const result = await removeFavorite(postId);
			if (result.status === "removed") {
				removeFav(postId);
				applyFavButtonState(button, "idle", postId);
				syncFavLabel(label, false);
				return;
			}
			applyFavButtonState(button, "marked_error", postId, UI_TEXT.cardFavErrorRequest);
			syncFavLabel(label, true);
			log.warn("post-actions: remove favorite failed", postId, result);
			return;
		}
		const result = await addFavorite(postId);
		if (result.status === "added" || result.status === "already") {
			addFav(postId);
			applyFavButtonState(button, "marked", postId);
			syncFavLabel(label, true);
			if (result.status === "added" && result.score !== void 0 && scoreLabel !== null) applyScoreValue(postId, scoreLabel, result.score);
			return;
		}
		if (result.status === "not_logged_in") {
			applyFavButtonState(button, "error", postId, UI_TEXT.cardFavErrorNotLoggedIn);
			syncFavLabel(label, false);
			log.warn("post-actions: favorite requires login", postId);
			return;
		}
		applyFavButtonState(button, "error", postId, UI_TEXT.cardFavErrorRequest);
		syncFavLabel(label, false);
		log.warn("post-actions: favorite failed", postId, result);
	}
	function createOriginalLink(href) {
		const link = document.createElement("a");
		link.className = CLASS_ORIGINAL;
		link.href = href;
		link.target = "_blank";
		link.rel = "noopener";
		link.setAttribute("aria-label", LABEL_ORIGINAL);
		link.textContent = TEXT_ORIGINAL;
		return link;
	}
	function createScoreLabel(scoreText) {
		const score = document.createElement("span");
		score.className = CLASS_SCORE;
		score.textContent = `${TEXT_SCORE_PREFIX}${scoreText}`;
		return score;
	}
	function createVoteButton(postId, scoreLabel) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = CLASS_VOTE;
		button.textContent = TEXT_VOTE_UP;
		button.setAttribute("aria-label", LABEL_VOTE_UP);
		button.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			handleVoteUpClick(button, scoreLabel, postId);
		});
		return button;
	}
	async function handleVoteUpClick(button, scoreLabel, postId) {
		if (button.disabled) return;
		button.disabled = true;
		try {
			const score = await voteUp(postId);
			if (score !== null) applyScoreValue(postId, scoreLabel, score);
		} finally {
			button.disabled = false;
		}
	}
	function createScoreRow(postId) {
		const row = document.createElement("span");
		row.className = CLASS_SCORE_ROW;
		const scoreLabel = createScoreLabel(readScoreText(postId));
		row.append(scoreLabel, createVoteButton(postId, scoreLabel));
		return row;
	}
	function createOptionProxy(nativeLink) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = CLASS_OPTION;
		const text = nativeLink.textContent?.trim() ?? "";
		button.textContent = text;
		button.setAttribute("aria-label", text);
		button.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			nativeLink.click();
		});
		return button;
	}
	function buildPanel(ctx) {
		const panel = document.createElement("div");
		panel.id = POST_ACTIONS_ID;
		panel.className = CLASS_PANEL;
		panel.setAttribute("role", "complementary");
		panel.setAttribute("aria-label", FEATURE_LABEL$2);
		const postId = readPostIdFromSearch(ctx.search);
		if (postId !== null) {
			const scoreRow = createScoreRow(postId);
			const scoreLabel = scoreRow.querySelector(`.${CLASS_SCORE}`);
			const scoreEl = scoreLabel instanceof HTMLElement ? scoreLabel : null;
			panel.append(createPostFavControl(postId, scoreEl));
			panel.append(createPlaylistMenu(Number(postId)));
			const original = findOriginalAnchor();
			if (original !== null) panel.append(createOriginalLink(original.href));
			panel.append(scoreRow);
		} else {
			const original = findOriginalAnchor();
			if (original !== null) panel.append(createOriginalLink(original.href));
		}
		for (const nativeLink of collectOptionAnchors()) panel.append(createOptionProxy(nativeLink));
		return panel;
	}
	function mountPostActions(ctx) {
		removeExistingPanel();
		const panel = buildPanel(ctx);
		document.body.append(panel);
		bindLayoutMode(panel);
	}
	var postActionsFeature = {
		id: FEATURE_ID$2,
		label: FEATURE_LABEL$2,
		pages: [...FEATURE_PAGES$2],
		defaultEnabled: true,
		css: FEATURE_CSS$2,
		mount: mountPostActions
	};
	var FEATURE_ID$1 = "search-tools";
	var FEATURE_LABEL$1 = "Search tools";
	var FEATURE_PAGES$1 = ["list", "post"];
	var TAGS_INPUT_SELECTOR = "input[name=\"tags\"]";
	var TAG_SIDEBAR_SELECTOR$1 = "ul#tag-sidebar";
	var MY_FAVORITES_LINK_SELECTOR = "li#my-favorites-container a[href*=\"page=favorites\"]";
	var ROOT_ID = "rdw-search-tools";
	var ROOT_CLASS = "rdw-search-tools";
	var CHIPS_CLASS = "rdw-search-tools-chips";
	var CHIPS_HIDDEN_CLASS = "rdw-search-tools-chips--hidden";
	var CHIP_CLASS = "rdw-search-tools-chip";
	var CHIP_EXCLUDE_CLASS = "rdw-search-tools-chip--exclude";
	var CHIP_LABEL_CLASS = "rdw-search-tools-chip-label";
	var CHIP_TOGGLE_CLASS = "rdw-search-tools-chip-toggle";
	var CHIP_REMOVE_CLASS = "rdw-search-tools-chip-remove";
	var ROW_CLASS = "rdw-search-tools-row";
	var MEDIA_CLASS = "rdw-search-tools-media";
	var MEDIA_BTN_CLASS = "rdw-search-tools-media-btn";
	var MEDIA_PRESSED_CLASS = "rdw-search-tools-media-btn--pressed";
	var SORT_CLASS = "rdw-search-tools-sort";
	var SCORE_CLASS = "rdw-search-tools-score";
	var SCORE_INPUT_CLASS = "rdw-search-tools-score-input";
	var SOURCE_CLASS = "rdw-search-tools-source";
	var COLLECTIONS_CLASS = "rdw-search-tools-collections";
	var SAVE_CLASS = "rdw-search-tools-save";
	var SAVE_BTN_CLASS = "rdw-search-tools-save-btn";
	var SAVE_FORM_CLASS = "rdw-search-tools-save-form";
	var SAVE_NAME_CLASS = "rdw-search-tools-save-name";
	var SAVE_CONFIRM_CLASS = "rdw-search-tools-save-confirm";
	var SAVE_CANCEL_CLASS = "rdw-search-tools-save-cancel";
	var SELECT_CLASS = "rdw-search-tools-select";
	var LABEL_CLASS = "rdw-search-tools-label";
	var TOKEN_SPLIT_RE = /\s+/;
	var MULTI_SPACE_RE = /\s+/g;
	var POLL_INTERVAL_MS = 700;
	var META_SEP = ":";
	var SCORE_TOKEN_PREFIX = "score:>=";
	var SCORE_TOKEN_RE = /^score:>=(\d+)$/;
	var SORT_TOKEN_PREFIX = "sort:";
	var MEDIA_VIDEO = "video";
	var MEDIA_IMAGES = `-${MEDIA_VIDEO}`;
	var TAG_TYPE_CLASS_PREFIX = "tag-type-";
	var EVENT_INPUT = "input";
	var EVENT_CHANGE = "change";
	var EVENT_CLICK = "click";
	var EVENT_BLUR = "blur";
	var EVENT_KEYDOWN = "keydown";
	var EVENT_AWESOMPLETE_SELECT = "awesomplete-selectcomplete";
	var KEY_ENTER = "Enter";
	var WARN_NO_FORM = "search-tools: search form not found; not mounted";
	var BODY_CLASS = featureBodyClass(FEATURE_ID$1);
	var TAG_TYPES = [
		"artist",
		"character",
		"copyright",
		"general",
		"metadata"
	];
	function isTagType(value) {
		for (const entry of TAG_TYPES) if (entry === value) return true;
		return false;
	}
	var PAREN_TOKENS = new Set([
		"(",
		")",
		"~"
	]);
	var MEDIA_OPTIONS = [
		{
			value: "all",
			label: "All"
		},
		{
			value: "images",
			label: "Images"
		},
		{
			value: "videos",
			label: "Videos"
		}
	];
	var SORT_OPTIONS = [
		{
			value: "newest",
			label: "Newest",
			token: null
		},
		{
			value: "oldest",
			label: "Oldest",
			token: "sort:id:asc"
		},
		{
			value: "score",
			label: "Top score",
			token: "sort:score:desc"
		},
		{
			value: "updated",
			label: "Recently updated",
			token: "sort:updated:desc"
		},
		{
			value: "random",
			label: "Random",
			token: "sort:random"
		}
	];
	var SORT_TOKEN_TO_MODE = new Map();
	for (const option of SORT_OPTIONS) if (option.token !== null) SORT_TOKEN_TO_MODE.set(option.token, option.value);
	var FEATURE_CSS$1 = [
		`body.${BODY_CLASS} .${ROOT_CLASS} {`,
		"  display: flex;",
		"  flex-direction: column;",
		"  gap: 0.35rem;",
		"  max-width: 100%;",
		"  margin: 0.35rem 0;",
		"  box-sizing: border-box;",
		"}",
		`body.${BODY_CLASS} .${CHIPS_CLASS} {`,
		"  display: flex;",
		"  flex-wrap: wrap;",
		"  gap: 0.25rem;",
		"  max-width: 100%;",
		"}",
		`body.${BODY_CLASS} .${CHIPS_CLASS}.${CHIPS_HIDDEN_CLASS} {`,
		"  display: none;",
		"}",
		`body.${BODY_CLASS} .${CHIP_CLASS} {`,
		"  display: inline-flex;",
		"  align-items: center;",
		"  max-width: 100%;",
		"  gap: 0.15rem;",
		"  padding: 0.1rem 0.2rem 0.1rem 0.35rem;",
		"  border: 1px solid #666;",
		"  border-radius: 2px;",
		"  background: #f0f0f0;",
		"  color: inherit;",
		"  box-sizing: border-box;",
		"}",
		`body.${BODY_CLASS} .${CHIP_CLASS}.${CHIP_EXCLUDE_CLASS} {`,
		"  background: #f5e0e0;",
		"  border-color: #a66;",
		"}",
		`body.${BODY_CLASS} .${CHIP_CLASS}--artist {`,
		"  background: #fde8e8;",
		"  border-color: #a00;",
		"  color: #a00;",
		"}",
		`body.${BODY_CLASS} .${CHIP_CLASS}--character {`,
		"  background: #e8fde8;",
		"  border-color: #0a0;",
		"  color: #0a0;",
		"}",
		`body.${BODY_CLASS} .${CHIP_CLASS}--copyright {`,
		"  background: #f8e8fd;",
		"  border-color: #a0a;",
		"  color: #a0a;",
		"}",
		`body.${BODY_CLASS} .${CHIP_CLASS}--general {`,
		"  background: #e8f0fd;",
		"  border-color: #07f;",
		"  color: #07f;",
		"}",
		`body.${BODY_CLASS} .${CHIP_CLASS}--metadata {`,
		"  background: #eee;",
		"  border-color: #666;",
		"  color: #444;",
		"}",
		`body.${BODY_CLASS} .${CHIP_CLASS}.${CHIP_EXCLUDE_CLASS}.${CHIP_CLASS}--artist,`,
		`body.${BODY_CLASS} .${CHIP_CLASS}.${CHIP_EXCLUDE_CLASS}.${CHIP_CLASS}--character,`,
		`body.${BODY_CLASS} .${CHIP_CLASS}.${CHIP_EXCLUDE_CLASS}.${CHIP_CLASS}--copyright,`,
		`body.${BODY_CLASS} .${CHIP_CLASS}.${CHIP_EXCLUDE_CLASS}.${CHIP_CLASS}--general,`,
		`body.${BODY_CLASS} .${CHIP_CLASS}.${CHIP_EXCLUDE_CLASS}.${CHIP_CLASS}--metadata {`,
		"  background: #f5e0e0;",
		"  border-color: #a66;",
		"  color: inherit;",
		"}",
		`body.${BODY_CLASS} .${CHIP_LABEL_CLASS},`,
		`body.${BODY_CLASS} button.${CHIP_TOGGLE_CLASS} {`,
		"  max-width: 100%;",
		"  overflow-wrap: anywhere;",
		"  word-break: break-word;",
		"  font: inherit;",
		"  line-height: 1.2;",
		"  padding: 0;",
		"  border: none;",
		"  background: transparent;",
		"  color: inherit;",
		"  cursor: pointer;",
		"  text-align: left;",
		"}",
		`body.${BODY_CLASS} .${CHIP_LABEL_CLASS} {`,
		"  cursor: default;",
		"}",
		`body.${BODY_CLASS} button.${CHIP_REMOVE_CLASS} {`,
		"  flex: 0 0 auto;",
		"  font: inherit;",
		"  line-height: 1;",
		"  padding: 0 0.2rem;",
		"  border: none;",
		"  border-radius: 2px;",
		"  background: transparent;",
		"  color: inherit;",
		"  cursor: pointer;",
		"}",
		`body.${BODY_CLASS} button.${CHIP_TOGGLE_CLASS}:focus-visible,`,
		`body.${BODY_CLASS} button.${CHIP_REMOVE_CLASS}:focus-visible,`,
		`body.${BODY_CLASS} button.${MEDIA_BTN_CLASS}:focus-visible,`,
		`body.${BODY_CLASS} button.${SAVE_BTN_CLASS}:focus-visible,`,
		`body.${BODY_CLASS} button.${SAVE_CONFIRM_CLASS}:focus-visible,`,
		`body.${BODY_CLASS} button.${SAVE_CANCEL_CLASS}:focus-visible,`,
		`body.${BODY_CLASS} .${SELECT_CLASS}:focus-visible,`,
		`body.${BODY_CLASS} .${SCORE_INPUT_CLASS}:focus-visible,`,
		`body.${BODY_CLASS} .${SAVE_NAME_CLASS}:focus-visible {`,
		"  outline: 2px solid #4c8bf5;",
		"  outline-offset: 2px;",
		"}",
		`body.${BODY_CLASS} .${ROW_CLASS} {`,
		"  display: flex;",
		"  flex-wrap: wrap;",
		"  align-items: center;",
		"  gap: 0.35rem;",
		"  max-width: 100%;",
		"}",
		`body.${BODY_CLASS} .${LABEL_CLASS} {`,
		"  flex: 0 0 auto;",
		"  font: inherit;",
		"}",
		`body.${BODY_CLASS} .${MEDIA_CLASS} {`,
		"  display: flex;",
		"  flex-wrap: wrap;",
		"  gap: 0.25rem;",
		"  max-width: 100%;",
		"}",
		`body.${BODY_CLASS} button.${MEDIA_BTN_CLASS} {`,
		"  font: inherit;",
		"  line-height: 1.2;",
		"  padding: 0.15rem 0.4rem;",
		"  border: 1px solid #666;",
		"  border-radius: 2px;",
		"  background: #f7f7f7;",
		"  color: inherit;",
		"  cursor: pointer;",
		"}",
		`body.${BODY_CLASS} button.${MEDIA_BTN_CLASS}.${MEDIA_PRESSED_CLASS} {`,
		"  background: #dbe7fb;",
		"  border-color: #4c8bf5;",
		"}",
		`body.${BODY_CLASS} .${SELECT_CLASS},`,
		`body.${BODY_CLASS} .${SCORE_INPUT_CLASS},`,
		`body.${BODY_CLASS} .${SAVE_NAME_CLASS} {`,
		"  max-width: 100%;",
		"  min-width: 0;",
		"  flex: 1 1 8rem;",
		"  font: inherit;",
		"  box-sizing: border-box;",
		"}",
		`body.${BODY_CLASS} .${SCORE_INPUT_CLASS} {`,
		"  flex: 0 1 5rem;",
		"  width: 5rem;",
		"}",
		`body.${BODY_CLASS} button.${SAVE_BTN_CLASS},`,
		`body.${BODY_CLASS} button.${SAVE_CONFIRM_CLASS},`,
		`body.${BODY_CLASS} button.${SAVE_CANCEL_CLASS} {`,
		"  font: inherit;",
		"  line-height: 1.2;",
		"  padding: 0.15rem 0.4rem;",
		"  border: 1px solid #666;",
		"  border-radius: 2px;",
		"  background: #f7f7f7;",
		"  color: inherit;",
		"  cursor: pointer;",
		"  flex: 0 0 auto;",
		"}",
		`body.${BODY_CLASS} button.${SAVE_BTN_CLASS}:disabled {`,
		"  opacity: 0.5;",
		"  cursor: default;",
		"}",
		`body.${BODY_CLASS} .${SAVE_FORM_CLASS} {`,
		"  display: flex;",
		"  flex-wrap: wrap;",
		"  gap: 0.25rem;",
		"  max-width: 100%;",
		"  flex: 1 1 100%;",
		"}",
		`body.${BODY_CLASS} [class^="rdw-search-tools"][hidden] {`,
		"  display: none !important;",
		"}"
	].join("\n");
	function findTagsInput() {
		const input = document.querySelector(TAGS_INPUT_SELECTOR);
		return input instanceof HTMLInputElement ? input : null;
	}
	function findSearchForm(input) {
		const form = input.closest("form");
		return form instanceof HTMLFormElement ? form : null;
	}
	function parseTokens(value) {
		const trimmed = value.trim();
		if (trimmed.length === 0) return [];
		return trimmed.split(TOKEN_SPLIT_RE).filter((token) => token.length > 0);
	}
	function normalizeSpaces(value) {
		return value.replace(MULTI_SPACE_RE, " ").trim();
	}
	function joinTokens(tokens) {
		return tokens.join(" ");
	}
	function bareTag(token) {
		if (token.startsWith("-") && token.length > 1) return token.slice(1);
		return token;
	}
	function normalizeTagKey(raw) {
		return raw.trim().toLowerCase().replaceAll(" ", "_");
	}
	function isMetaToken(token) {
		return bareTag(token).includes(META_SEP);
	}
	function isParenToken(token) {
		return PAREN_TOKENS.has(token);
	}
	function isToggleableToken(token) {
		if (isParenToken(token)) return false;
		if (isMetaToken(token)) return false;
		return true;
	}
	function isMediaToken(token) {
		return token === MEDIA_VIDEO || token === MEDIA_IMAGES;
	}
	function isSortToken(token) {
		return bareTag(token).startsWith(SORT_TOKEN_PREFIX);
	}
	function isScoreToken(token) {
		return SCORE_TOKEN_RE.test(bareTag(token));
	}
	function isControlledToken(token) {
		return isMediaToken(token) || isSortToken(token) || isScoreToken(token);
	}
	function readMediaMode(tokens) {
		let hasVideo = false;
		let hasImages = false;
		for (const token of tokens) if (token === MEDIA_VIDEO) hasVideo = true;
		else if (token === MEDIA_IMAGES) hasImages = true;
		if (hasVideo) return "videos";
		if (hasImages) return "images";
		return "all";
	}
	function readSortMode(tokens) {
		for (const token of tokens) {
			const bare = bareTag(token);
			const mode = SORT_TOKEN_TO_MODE.get(bare);
			if (mode !== void 0) return mode;
		}
		return "newest";
	}
	function readMinScore(tokens) {
		for (const token of tokens) {
			const match = SCORE_TOKEN_RE.exec(bareTag(token));
			if (match === null) continue;
			const raw = match[1];
			if (raw === void 0) continue;
			const value = Number(raw);
			if (Number.isFinite(value) && value > 0) return value;
		}
		return null;
	}
	function freeTokens(tokens) {
		return tokens.filter((token) => !isControlledToken(token));
	}
	function sortTokenForMode(mode) {
		return SORT_OPTIONS.find((entry) => entry.value === mode)?.token ?? null;
	}
	function buildTokenSet(current, media, sort, minScore) {
		const next = freeTokens(current);
		if (media === "images") next.push(MEDIA_IMAGES);
		else if (media === "videos") next.push(MEDIA_VIDEO);
		const sortToken = sortTokenForMode(sort);
		if (sortToken !== null) next.push(sortToken);
		if (minScore !== null && minScore > 0) next.push(`${SCORE_TOKEN_PREFIX}${String(minScore)}`);
		return next;
	}
	function navigateTokens(tokens) {
		window.location.assign(buildSearchUrl(parseTags(joinTokens(tokens))));
	}
	function toggleExclude(token) {
		if (token.startsWith("-") && token.length > 1) return token.slice(1);
		return `-${token}`;
	}
	function removeTokenAt(tokens, index) {
		if (index < 0 || index >= tokens.length) return [...tokens];
		return tokens.filter((_, tokenIndex) => tokenIndex !== index);
	}
	function replaceTokenAt(tokens, index, nextToken) {
		return tokens.map((token, tokenIndex) => tokenIndex === index ? nextToken : token);
	}
	function chipTypeClass(tagType) {
		if (tagType === null) return null;
		return `${CHIP_CLASS}--${tagType}`;
	}
	function readTagTypeFromClassList(classList) {
		for (const className of classList) {
			if (!className.startsWith(TAG_TYPE_CLASS_PREFIX)) continue;
			const typeName = className.slice(9);
			if (isTagType(typeName)) return typeName;
		}
		return null;
	}
	function extractSidebarTag(li) {
		const links = li.querySelectorAll("a[href]");
		for (const node of links) {
			if (!(node instanceof HTMLAnchorElement)) continue;
			const href = node.getAttribute("href");
			if (href === null || href.length === 0) continue;
			let url;
			try {
				url = new URL(href, SITE_ORIGIN);
			} catch {
				continue;
			}
			const tags = url.searchParams.get(SEARCH_PARAM_TAGS);
			if (tags !== null && tags.trim().length > 0) {
				const first = parseTokens(tags)[0];
				if (first !== void 0) return normalizeTagKey(bareTag(first));
			}
			const text = node.textContent?.trim() ?? "";
			if (text.length > 0) return normalizeTagKey(text);
		}
		return null;
	}
	function buildSidebarTagTypes() {
		const map = new Map();
		const sidebar = document.querySelector(TAG_SIDEBAR_SELECTOR$1);
		if (!(sidebar instanceof HTMLUListElement)) return map;
		for (const child of sidebar.children) {
			if (!(child instanceof HTMLLIElement)) continue;
			const tagType = readTagTypeFromClassList(child.classList);
			if (tagType === null) continue;
			const tag = extractSidebarTag(child);
			if (tag === null) continue;
			map.set(tag, tagType);
		}
		return map;
	}
	function findFavoritesHref() {
		const anchor = document.querySelector(MY_FAVORITES_LINK_SELECTOR);
		if (!(anchor instanceof HTMLAnchorElement)) return null;
		const href = anchor.getAttribute("href");
		if (href === null || href.trim().length === 0) return null;
		return href;
	}
	function detectSourceMode(search) {
		const params = new URLSearchParams(search);
		if (params.get("page") === "favorites") return "favorites";
		const tagsRaw = params.get("tags") ?? "";
		const artists = listArtistTags();
		if (isFullUpdatesQuery(tagsRaw, artists) || isPartialUpdatesQuery(tagsRaw, artists)) return "followed";
		return "all";
	}
	function ensureRoot(form) {
		const existing = document.getElementById(ROOT_ID);
		if (existing instanceof HTMLDivElement) {
			if (existing.previousElementSibling !== form) form.after(existing);
			return existing;
		}
		const root = document.createElement("div");
		root.id = ROOT_ID;
		root.className = ROOT_CLASS;
		form.after(root);
		return root;
	}
	function setInputTokens(input, tokens) {
		input.value = normalizeSpaces(joinTokens(tokens));
		input.dispatchEvent(new Event(EVENT_INPUT, { bubbles: true }));
	}
	function renderChips(refs) {
		const tokens = parseTokens(refs.input.value);
		const tagTypes = buildSidebarTagTypes();
		refs.chips.replaceChildren();
		let visibleCount = 0;
		for (let index = 0; index < tokens.length; index += 1) {
			const token = tokens[index];
			if (token === void 0) continue;
			if (isControlledToken(token)) continue;
			visibleCount += 1;
			const chip = document.createElement("span");
			chip.className = CHIP_CLASS;
			if (token.startsWith("-") && token.length > 1) chip.classList.add(CHIP_EXCLUDE_CLASS);
			const typeClass = chipTypeClass(tagTypes.get(normalizeTagKey(bareTag(token))) ?? null);
			if (typeClass !== null) chip.classList.add(typeClass);
			const tokenIndex = index;
			if (isToggleableToken(token)) {
				const toggle = document.createElement("button");
				toggle.type = "button";
				toggle.className = CHIP_TOGGLE_CLASS;
				toggle.textContent = token;
				toggle.addEventListener(EVENT_CLICK, () => {
					const current = parseTokens(refs.input.value);
					const currentToken = current[tokenIndex];
					if (currentToken === void 0) return;
					setInputTokens(refs.input, replaceTokenAt(current, tokenIndex, toggleExclude(currentToken)));
					syncFromInput(refs);
				});
				chip.append(toggle);
			} else {
				const label = document.createElement("span");
				label.className = CHIP_LABEL_CLASS;
				label.textContent = token;
				chip.append(label);
			}
			const remove = document.createElement("button");
			remove.type = "button";
			remove.className = CHIP_REMOVE_CLASS;
			remove.textContent = "×";
			remove.setAttribute("aria-label", `Remove ${token}`);
			remove.addEventListener(EVENT_CLICK, () => {
				const current = parseTokens(refs.input.value);
				setInputTokens(refs.input, removeTokenAt(current, tokenIndex));
				syncFromInput(refs);
			});
			chip.append(remove);
			refs.chips.append(chip);
		}
		refs.chips.classList.toggle(CHIPS_HIDDEN_CLASS, visibleCount === 0);
	}
	function syncControls(refs) {
		const tokens = parseTokens(refs.input.value);
		const media = readMediaMode(tokens);
		for (const [value, button] of refs.mediaButtons) {
			const pressed = value === media;
			button.setAttribute("aria-pressed", pressed ? "true" : "false");
			button.classList.toggle(MEDIA_PRESSED_CLASS, pressed);
		}
		refs.sortSelect.value = readSortMode(tokens);
		const minScore = readMinScore(tokens);
		refs.scoreInput.value = minScore === null ? "" : String(minScore);
		const artists = listArtistTags();
		const followedOption = refs.sourceSelect.querySelector("option[value=\"followed\"]");
		if (followedOption instanceof HTMLOptionElement) followedOption.disabled = artists.length === 0;
		refs.sourceSelect.value = detectSourceMode(window.location.search);
		const queryEmpty = normalizeSpaces(refs.input.value).length === 0;
		refs.saveBtn.disabled = queryEmpty;
	}
	function syncFromInput(refs) {
		renderChips(refs);
		syncControls(refs);
	}
	function applyControlNavigation(refs, media, sort, minScore) {
		const next = buildTokenSet(parseTokens(refs.input.value), media, sort, minScore);
		setInputTokens(refs.input, next);
		syncFromInput(refs);
		navigateTokens(next);
	}
	function appendCollectionOptions(host, collections) {
		for (const collection of collections) {
			const option = document.createElement("option");
			option.value = collection.id;
			option.textContent = collection.name;
			host.append(option);
		}
	}
	function rebuildCollectionsSelect(select) {
		const previous = select.value;
		select.replaceChildren();
		const placeholder = document.createElement("option");
		placeholder.value = "";
		placeholder.textContent = "Collections";
		placeholder.disabled = true;
		placeholder.selected = true;
		select.append(placeholder);
		const collections = load().collections;
		const searches = collections.filter((entry) => !isPlaylist(entry));
		const playlists = collections.filter((entry) => isPlaylist(entry));
		if (searches.length > 0) {
			const group = document.createElement("optgroup");
			group.label = "Saved searches";
			appendCollectionOptions(group, searches);
			select.append(group);
		}
		if (playlists.length > 0) {
			const group = document.createElement("optgroup");
			group.label = "Playlists";
			appendCollectionOptions(group, playlists);
			select.append(group);
		}
		if (previous.length > 0 && collections.some((collection) => collection.id === previous)) select.value = previous;
	}
	function buildMediaRow(refs) {
		const row = document.createElement("div");
		row.className = `${ROW_CLASS} ${MEDIA_CLASS}`;
		const label = document.createElement("span");
		label.className = LABEL_CLASS;
		label.textContent = "Media";
		row.append(label);
		for (const option of MEDIA_OPTIONS) {
			const button = document.createElement("button");
			button.type = "button";
			button.className = MEDIA_BTN_CLASS;
			button.textContent = option.label;
			button.setAttribute("aria-pressed", "false");
			button.addEventListener(EVENT_CLICK, () => {
				const tokens = parseTokens(refs.input.value);
				applyControlNavigation(refs, option.value, readSortMode(tokens), readMinScore(tokens));
			});
			refs.mediaButtons.set(option.value, button);
			row.append(button);
		}
		return row;
	}
	function buildSortScoreRow(refs) {
		const row = document.createElement("div");
		row.className = ROW_CLASS;
		const sortLabel = document.createElement("label");
		sortLabel.className = LABEL_CLASS;
		sortLabel.textContent = "Sort";
		sortLabel.htmlFor = `${ROOT_ID}-sort`;
		refs.sortSelect.id = `${ROOT_ID}-sort`;
		refs.sortSelect.className = `${SELECT_CLASS} ${SORT_CLASS}`;
		for (const option of SORT_OPTIONS) {
			const el = document.createElement("option");
			el.value = option.value;
			el.textContent = option.label;
			refs.sortSelect.append(el);
		}
		refs.sortSelect.addEventListener(EVENT_CHANGE, () => {
			const tokens = parseTokens(refs.input.value);
			const sort = refs.sortSelect.value;
			const mode = SORT_OPTIONS.find((entry) => entry.value === sort)?.value;
			if (mode === void 0) return;
			applyControlNavigation(refs, readMediaMode(tokens), mode, readMinScore(tokens));
		});
		const scoreLabel = document.createElement("label");
		scoreLabel.className = LABEL_CLASS;
		scoreLabel.textContent = "Min score";
		scoreLabel.htmlFor = `${ROOT_ID}-score`;
		refs.scoreInput.id = `${ROOT_ID}-score`;
		refs.scoreInput.className = `${SCORE_INPUT_CLASS} ${SCORE_CLASS}`;
		refs.scoreInput.type = "number";
		refs.scoreInput.min = "1";
		refs.scoreInput.step = "1";
		refs.scoreInput.inputMode = "numeric";
		refs.scoreInput.placeholder = "Min";
		const applyScore = () => {
			const tokens = parseTokens(refs.input.value);
			const raw = refs.scoreInput.value.trim();
			let minScore = null;
			if (raw.length > 0) {
				const value = Number(raw);
				if (Number.isFinite(value) && value > 0) minScore = Math.floor(value);
			}
			if (readMinScore(tokens) === minScore) {
				syncControls(refs);
				return;
			}
			applyControlNavigation(refs, readMediaMode(tokens), readSortMode(tokens), minScore);
		};
		refs.scoreInput.addEventListener(EVENT_BLUR, applyScore);
		refs.scoreInput.addEventListener(EVENT_KEYDOWN, (event) => {
			if (event.key !== KEY_ENTER) return;
			event.preventDefault();
			refs.scoreInput.blur();
		});
		row.append(sortLabel, refs.sortSelect, scoreLabel, refs.scoreInput);
		return row;
	}
	function buildSourceRow(refs) {
		const row = document.createElement("div");
		row.className = ROW_CLASS;
		const label = document.createElement("label");
		label.className = LABEL_CLASS;
		label.textContent = "Source";
		label.htmlFor = `${ROOT_ID}-source`;
		refs.sourceSelect.id = `${ROOT_ID}-source`;
		refs.sourceSelect.className = `${SELECT_CLASS} ${SOURCE_CLASS}`;
		const allOption = document.createElement("option");
		allOption.value = "all";
		allOption.textContent = "All posts";
		refs.sourceSelect.append(allOption);
		const followedOption = document.createElement("option");
		followedOption.value = "followed";
		followedOption.textContent = "Followed artists";
		refs.sourceSelect.append(followedOption);
		if (findFavoritesHref() !== null) {
			const favoritesOption = document.createElement("option");
			favoritesOption.value = "favorites";
			favoritesOption.textContent = "My favorites";
			refs.sourceSelect.append(favoritesOption);
		}
		refs.sourceSelect.addEventListener(EVENT_CHANGE, () => {
			const value = refs.sourceSelect.value;
			if (value === "followed") {
				const artists = listArtistTags();
				if (artists.length === 0) {
					refs.sourceSelect.value = detectSourceMode(window.location.search);
					return;
				}
				window.location.assign(buildFeedUrl(artists, getUpdatesGroupSize()));
				return;
			}
			if (value === "favorites") {
				const href = findFavoritesHref();
				if (href === null) {
					refs.sourceSelect.value = detectSourceMode(window.location.search);
					return;
				}
				window.location.assign(href);
				return;
			}
			navigateTokens(parseTokens(refs.input.value));
		});
		row.append(label, refs.sourceSelect);
		return row;
	}
	function buildCollectionsRow(refs) {
		const row = document.createElement("div");
		row.className = `${ROW_CLASS} ${COLLECTIONS_CLASS}`;
		const label = document.createElement("label");
		label.className = LABEL_CLASS;
		label.textContent = "Collections";
		label.htmlFor = `${ROOT_ID}-collections`;
		refs.collectionsSelect.id = `${ROOT_ID}-collections`;
		refs.collectionsSelect.className = SELECT_CLASS;
		rebuildCollectionsSelect(refs.collectionsSelect);
		refs.collectionsSelect.addEventListener(EVENT_CHANGE, () => {
			const id = refs.collectionsSelect.value;
			if (id.length === 0) return;
			const collection = load().collections.find((entry) => entry.id === id);
			refs.collectionsSelect.value = "";
			if (collection === void 0) return;
			if (isPlaylist(collection)) {
				const first = buildPlaylistQueries(collection.postIds ?? [], getPlaylistChunkSize())[0];
				if (first === void 0) return;
				window.location.assign(buildUpdatesSearchUrl(first));
				return;
			}
			window.location.assign(buildSearchUrl(collection.tags));
		});
		refs.saveBtn.type = "button";
		refs.saveBtn.className = `${SAVE_BTN_CLASS} ${SAVE_CLASS}`;
		refs.saveBtn.textContent = "Save search";
		refs.saveForm.className = SAVE_FORM_CLASS;
		refs.saveForm.hidden = true;
		refs.saveName.type = "text";
		refs.saveName.className = SAVE_NAME_CLASS;
		refs.saveName.placeholder = "Name";
		refs.saveName.autocomplete = "off";
		const confirm = document.createElement("button");
		confirm.type = "button";
		confirm.className = SAVE_CONFIRM_CLASS;
		confirm.textContent = "Save";
		const cancel = document.createElement("button");
		cancel.type = "button";
		cancel.className = SAVE_CANCEL_CLASS;
		cancel.textContent = "Cancel";
		const closeSaveForm = () => {
			refs.saveForm.hidden = true;
			refs.saveName.value = "";
			refs.saveBtn.hidden = false;
		};
		refs.saveBtn.addEventListener(EVENT_CLICK, () => {
			if (refs.saveBtn.disabled) return;
			refs.saveBtn.hidden = true;
			refs.saveForm.hidden = false;
			refs.saveName.value = normalizeSpaces(refs.input.value);
			queueMicrotask(() => {
				refs.saveName.focus();
				refs.saveName.select();
			});
		});
		confirm.addEventListener(EVENT_CLICK, () => {
			const name = refs.saveName.value.trim();
			const tags = parseTags(refs.input.value);
			if (name.length === 0 || tags.length === 0) return;
			addCollection(name, tags);
			rebuildCollectionsSelect(refs.collectionsSelect);
			closeSaveForm();
			syncControls(refs);
		});
		cancel.addEventListener(EVENT_CLICK, () => {
			closeSaveForm();
		});
		refs.saveForm.append(refs.saveName, confirm, cancel);
		row.append(label, refs.collectionsSelect, refs.saveBtn, refs.saveForm);
		return row;
	}
	function mountSearchTools(_ctx) {
		const input = findTagsInput();
		if (input === null) {
			log.warn(WARN_NO_FORM);
			return;
		}
		const form = findSearchForm(input);
		if (form === null) {
			log.warn(WARN_NO_FORM);
			return;
		}
		const root = ensureRoot(form);
		root.replaceChildren();
		const chips = document.createElement("div");
		chips.className = CHIPS_CLASS;
		const refs = {
			input,
			chips,
			mediaButtons: new Map(),
			sortSelect: document.createElement("select"),
			scoreInput: document.createElement("input"),
			sourceSelect: document.createElement("select"),
			collectionsSelect: document.createElement("select"),
			saveBtn: document.createElement("button"),
			saveForm: document.createElement("div"),
			saveName: document.createElement("input")
		};
		root.append(chips, buildMediaRow(refs), buildSortScoreRow(refs), buildSourceRow(refs), buildCollectionsRow(refs));
		let lastValue = input.value;
		syncFromInput(refs);
		const refresh = () => {
			lastValue = input.value;
			syncFromInput(refs);
		};
		input.addEventListener(EVENT_INPUT, refresh);
		input.addEventListener(EVENT_CHANGE, refresh);
		input.addEventListener(EVENT_AWESOMPLETE_SELECT, refresh);
		const sidebar = document.querySelector(TAG_SIDEBAR_SELECTOR$1);
		if (sidebar !== null) sidebar.addEventListener(EVENT_CLICK, () => {
			window.setTimeout(() => {
				refresh();
			}, 0);
		});
		window.setInterval(() => {
			if (document.hidden) return;
			if (input.value === lastValue) return;
			refresh();
		}, POLL_INTERVAL_MS);
	}
	var searchToolsFeature = {
		id: FEATURE_ID$1,
		label: FEATURE_LABEL$1,
		pages: [...FEATURE_PAGES$1],
		defaultEnabled: true,
		css: FEATURE_CSS$1,
		mount: mountSearchTools
	};
	var FEATURE_ID = "tag-groups";
	var FEATURE_LABEL = "Collapse tags";
	var TAG_SIDEBAR_SELECTOR = "ul#tag-sidebar";
	var TOGGLE_CLASS = "rdw-tag-group-toggle";
	var COLLAPSED_CLASS = "rdw-tag-group-collapsed";
	var BODY_FEATURE_CLASS = featureBodyClass(FEATURE_ID);
	var MISSING_SIDEBAR_WARN = "Tag sidebar not found";
	var GROUP_HEADER_NAME_SET = new Set([
		"Copyright",
		"Character",
		"Artist",
		"General",
		"Meta"
	]);
	var DEFAULT_COLLAPSED = ["General", "Meta"];
	var FEATURE_PAGES = ["list", "post"];
	var FEATURE_CSS = [
		`body.${BODY_FEATURE_CLASS} li.${COLLAPSED_CLASS} { display: none; }`,
		`body.${BODY_FEATURE_CLASS} button.${TOGGLE_CLASS} {`,
		"  background: transparent;",
		"  border: none;",
		"  color: inherit;",
		"  cursor: pointer;",
		"  font: inherit;",
		"  padding: 0;",
		"}",
		`body.${BODY_FEATURE_CLASS} button.${TOGGLE_CLASS}:focus-visible {`,
		"  outline: 2px solid #8ab4f8;",
		"  outline-offset: 2px;",
		"}"
	].join("\n");
	var TagGroupsStateSchema = object({ collapsed: array(string()) });
	function defaultState() {
		return { collapsed: [...DEFAULT_COLLAPSED] };
	}
	function parseTagGroupsState(raw) {
		const parsed = TagGroupsStateSchema.safeParse(raw);
		if (!parsed.success) return defaultState();
		return parsed.data;
	}
	function isGroupHeaderName(text) {
		return GROUP_HEADER_NAME_SET.has(text);
	}
	function readHeaderName(li) {
		const h6 = li.querySelector(":scope > h6");
		if (!(h6 instanceof HTMLHeadingElement)) return null;
		const text = h6.textContent?.trim() ?? "";
		if (!isGroupHeaderName(text)) return null;
		return text;
	}
	function collectGroups(sidebar) {
		const groups = [];
		let current = null;
		for (const child of sidebar.children) {
			if (!(child instanceof HTMLLIElement)) continue;
			const headerName = readHeaderName(child);
			if (headerName !== null) {
				current = {
					name: headerName,
					headerLi: child,
					members: []
				};
				groups.push(current);
				continue;
			}
			if (current !== null) current.members.push(child);
		}
		return groups;
	}
	function formatToggleLabel(name, count) {
		return `${name} (${String(count)})`;
	}
	function applyGroupCollapsed(members, button, collapsed) {
		for (const member of members) member.classList.toggle(COLLAPSED_CLASS, collapsed);
		button.setAttribute("aria-expanded", collapsed ? "false" : "true");
	}
	function writeCollapsedState(ctx, collapsedNames) {
		ctx.setState({ collapsed: [...collapsedNames] });
	}
	function mountToggle(group, collapsedNames, ctx) {
		const h6 = group.headerLi.querySelector(":scope > h6");
		if (!(h6 instanceof HTMLHeadingElement)) return;
		const button = document.createElement("button");
		button.type = "button";
		button.className = TOGGLE_CLASS;
		button.textContent = formatToggleLabel(group.name, group.members.length);
		const initiallyCollapsed = collapsedNames.has(group.name);
		applyGroupCollapsed(group.members, button, initiallyCollapsed);
		button.addEventListener("click", () => {
			const nextCollapsed = !collapsedNames.has(group.name);
			if (nextCollapsed) collapsedNames.add(group.name);
			else collapsedNames.delete(group.name);
			applyGroupCollapsed(group.members, button, nextCollapsed);
			writeCollapsedState(ctx, [...collapsedNames]);
		});
		h6.replaceChildren(button);
	}
	function mountTagGroups(ctx) {
		const sidebar = document.querySelector(TAG_SIDEBAR_SELECTOR);
		if (!(sidebar instanceof HTMLUListElement)) {
			log.warn(MISSING_SIDEBAR_WARN);
			return;
		}
		const state = ctx.getState(parseTagGroupsState);
		const collapsedNames = new Set(state.collapsed);
		const groups = collectGroups(sidebar);
		for (const group of groups) mountToggle(group, collapsedNames, ctx);
	}
	var FEATURES = [
		feedFeature,
		menuCleanupFeature,
		{
			id: FEATURE_ID,
			label: FEATURE_LABEL,
			pages: [...FEATURE_PAGES],
			defaultEnabled: true,
			css: FEATURE_CSS,
			mount: mountTagGroups
		},
		searchToolsFeature,
		seenDimFeature,
		playlistMenuFeature,
		playlistBarFeature,
		infiniteScrollFeature,
		postActionsFeature,
		gridDensityFeature
	];
	var mountedIds = new Set();
	var activePageKind = null;
	var activeSearch = "";
	var thumbsAddedListeners = new Set();
	function onThumbsAdded(cb) {
		thumbsAddedListeners.add(cb);
		return () => {
			thumbsAddedListeners.delete(cb);
		};
	}
	function notifyThumbsAdded(root) {
		for (const listener of thumbsAddedListeners) listener(root);
	}
	function findFeature(id) {
		return FEATURES.find((feature) => feature.id === id);
	}
	function isFeatureEnabled(id) {
		const feature = findFeature(id);
		if (feature === void 0) return false;
		return getFeatureEnabled(id, feature.defaultEnabled);
	}
	function getFeatureChoice(id) {
		const feature = findFeature(id);
		if (feature?.choice === void 0) return "";
		const stored = getFeatureChoiceValue(id);
		if (stored !== void 0 && feature.choice.options.some((option) => option.value === stored)) return stored;
		return feature.choice.defaultValue;
	}
	function ensureFeatureCss(feature) {
		const styleId = `${FEATURE_STYLE_ID_PREFIX}${feature.id}`;
		if (document.getElementById(styleId) !== null) return;
		const style = document.createElement("style");
		style.id = styleId;
		style.textContent = feature.css;
		document.head.append(style);
	}
	function createContext(feature, pageKind, search) {
		return {
			pageKind,
			search,
			getState: (parse) => {
				return parse(getFeatureState(feature.id));
			},
			setState: (value) => {
				setFeatureState(feature.id, value);
			}
		};
	}
	function resolvePageContext() {
		if (activePageKind !== null) return {
			pageKind: activePageKind,
			search: activeSearch
		};
		return {
			pageKind: detectPageKind(window.location.search),
			search: window.location.search
		};
	}
	function clearChoiceBodyClasses(feature) {
		if (feature.choice === void 0) return;
		for (const option of feature.choice.options) document.body.classList.remove(featureChoiceBodyClass(feature.id, option.value));
	}
	function mountFeatureOnce(feature) {
		if (mountedIds.has(feature.id)) return;
		const { pageKind, search } = resolvePageContext();
		if (!feature.pages.includes(pageKind)) return;
		mountedIds.add(feature.id);
		try {
			feature.mount(createContext(feature, pageKind, search));
		} catch (error) {
			log.error(`Feature mount failed: ${feature.id}`, error);
		}
	}
	function applyCssOnlyFeatureEnabled(id, enabled) {
		const feature = findFeature(id);
		if (feature?.cssOnly !== true) return;
		if (!getTweaksEnabled()) return;
		if (!enabled) {
			document.body.classList.remove(featureBodyClass(feature.id));
			clearChoiceBodyClasses(feature);
			return;
		}
		ensureFeatureCss(feature);
		document.body.classList.add(featureBodyClass(feature.id));
		if (feature.choice !== void 0) {
			clearChoiceBodyClasses(feature);
			document.body.classList.add(featureChoiceBodyClass(feature.id, getFeatureChoice(feature.id)));
		}
		mountFeatureOnce(feature);
	}
	function applyCssOnlyFeatureChoice(id, value) {
		const feature = findFeature(id);
		if (feature?.cssOnly !== true || feature.choice === void 0) return;
		if (!getTweaksEnabled()) return;
		if (!getFeatureEnabled(id, feature.defaultEnabled)) return;
		ensureFeatureCss(feature);
		clearChoiceBodyClasses(feature);
		document.body.classList.add(featureChoiceBodyClass(feature.id, value));
	}
	function runFeatures(pageKind, search, features = FEATURES) {
		activePageKind = pageKind;
		activeSearch = search;
		if (!getTweaksEnabled()) return;
		for (const feature of features) {
			if (!feature.pages.includes(pageKind)) continue;
			if (!getFeatureEnabled(feature.id, feature.defaultEnabled)) continue;
			document.body.classList.add(featureBodyClass(feature.id));
			if (feature.choice !== void 0) {
				const choiceValue = (() => {
					const stored = getFeatureChoiceValue(feature.id);
					if (stored !== void 0 && feature.choice.options.some((option) => option.value === stored)) return stored;
					return feature.choice.defaultValue;
				})();
				document.body.classList.add(featureChoiceBodyClass(feature.id, choiceValue));
			}
			ensureFeatureCss(feature);
			mountedIds.add(feature.id);
			try {
				feature.mount(createContext(feature, pageKind, search));
			} catch (error) {
				log.error(`Feature mount failed: ${feature.id}`, error);
			}
		}
	}
	var removeClickBound = false;
	function collectFavoritePostIds(root) {
		const ids = [];
		const seen = new Set();
		const links = root.querySelectorAll(SITE_SELECTORS.favoritesDeleteLink);
		for (const link of links) {
			if (!(link instanceof HTMLAnchorElement)) continue;
			const onclick = link.getAttribute("onclick");
			if (onclick === null) continue;
			const postId = extractPostIdFromFavoritesDeleteOnclick(onclick);
			if (postId === null || seen.has(postId)) continue;
			seen.add(postId);
			ids.push(postId);
		}
		return ids;
	}
	function bindRemoveClickCapture() {
		if (removeClickBound) return;
		removeClickBound = true;
		document.addEventListener("click", (event) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			const link = target.closest("a");
			if (!(link instanceof HTMLAnchorElement)) return;
			const onclick = link.getAttribute("onclick");
			if (onclick === null) return;
			const postId = extractPostIdFromFavoritesDeleteOnclick(onclick);
			if (postId === null) return;
			removeFav(postId);
		}, true);
	}
	function syncFavoritesPage(root = document, search = window.location.search) {
		if (detectPageKind(search) !== "favorites") return;
		const ids = collectFavoritePostIds(root);
		const numericIds = [];
		for (const postId of ids) {
			const parsed = Number(postId);
			if (Number.isFinite(parsed)) numericIds.push(Math.trunc(parsed));
		}
		addFavs(numericIds);
		bindRemoveClickCapture();
	}
	function extractArtistTagFromLi(li) {
		const links = li.querySelectorAll("a[href]");
		for (const node of links) {
			if (!(node instanceof HTMLAnchorElement)) continue;
			if (node.hasAttribute("onclick")) continue;
			const href = node.getAttribute("href");
			if (href === null || href.length === 0) continue;
			let url;
			try {
				url = new URL(href, SITE_ORIGIN);
			} catch {
				continue;
			}
			if (url.searchParams.get("page") !== "post") continue;
			if (url.searchParams.get("s") !== "list") continue;
			const tags = url.searchParams.get(SEARCH_PARAM_TAGS);
			if (tags === null) continue;
			return normalizeArtistTag(tags);
		}
		return null;
	}
	function applyFollowState(button, following) {
		button.setAttribute("aria-pressed", following ? "true" : "false");
		button.classList.toggle(CSS_CLASS.artistFollowMarked, following);
		const label = following ? UI_TEXT.artistFollowing : UI_TEXT.artistFollow;
		const tag = button.dataset.rdwArtistTag ?? "";
		button.setAttribute("aria-label", `${label}: ${tag}`);
		button.textContent = label;
	}
	function attachFollowButton(li, tag) {
		if (li.querySelector(SITE_SELECTORS.artistFollowButton) !== null) return;
		const button = document.createElement("button");
		button.type = "button";
		button.className = CSS_CLASS.artistFollow;
		button.dataset.rdwArtistTag = tag;
		applyFollowState(button, isFollowingArtist(tag));
		button.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			const following = button.getAttribute("aria-pressed") === "true";
			try {
				if (following) {
					removeArtist(tag);
					applyFollowState(button, false);
				} else {
					addArtist(tag);
					applyFollowState(button, true);
				}
			} catch {
				applyFollowState(button, isFollowingArtist(tag));
			}
		});
		li.append(button);
	}
	function mountArtistSidebar(root = document, search = window.location.search) {
		const kind = detectPageKind(search);
		if (kind !== "list" && kind !== "post") return;
		ensureDocumentStyles();
		const sidebar = root.querySelector(SITE_SELECTORS.tagSidebar);
		if (sidebar === null) return;
		const rows = sidebar.querySelectorAll(SITE_SELECTORS.tagTypeArtist);
		for (const row of rows) {
			if (!(row instanceof HTMLElement)) continue;
			const tag = extractArtistTagFromLi(row);
			if (tag === null) continue;
			attachFollowButton(row, tag);
		}
	}
	var MS_PER_DAY = 864e5;
	var COOKIE_PAIR_SEPARATOR = ";";
	var COOKIE_NAME_VALUE_SEPARATOR = "=";
	var STYLESHEET_REL = "stylesheet";
	var LIGHT_STYLESHEET_PATH = `${SITE_THEME_STYLESHEET_DIR}${SITE_THEME_STYLESHEET_LIGHT}`;
	var DARK_STYLESHEET_PATH = `${SITE_THEME_STYLESHEET_DIR}${SITE_THEME_STYLESHEET_DARK}`;
	function readCookieValue(name) {
		const pairs = document.cookie.split(COOKIE_PAIR_SEPARATOR);
		const prefix = `${name}${COOKIE_NAME_VALUE_SEPARATOR}`;
		for (const pair of pairs) {
			const trimmed = pair.trim();
			if (!trimmed.startsWith(prefix)) continue;
			return trimmed.slice(prefix.length);
		}
		return null;
	}
	function writeThemeCookie(value, expires) {
		document.cookie = [
			`${SITE_THEME_COOKIE_NAME}${COOKIE_NAME_VALUE_SEPARATOR}${value}`,
			`expires=${expires.toUTCString()}`,
			`path=/`
		].join("; ");
	}
	function deleteThemeCookie() {
		document.cookie = [
			`${SITE_THEME_COOKIE_NAME}${COOKIE_NAME_VALUE_SEPARATOR}`,
			`expires=${new Date(0).toUTCString()}`,
			`path=/`
		].join("; ");
	}
	function isSiteDesktopStylesheetPath(pathname) {
		return pathname.endsWith(LIGHT_STYLESHEET_PATH) || pathname.endsWith(DARK_STYLESHEET_PATH);
	}
	function stylesheetFilenameForTheme(theme) {
		return theme === "dark" ? SITE_THEME_STYLESHEET_DARK : SITE_THEME_STYLESHEET_LIGHT;
	}
	function replaceStylesheetFilename(href, filename) {
		const url = new URL(href, window.location.href);
		const segments = url.pathname.split("/");
		segments[segments.length - 1] = filename;
		url.pathname = segments.join("/");
		return url.href;
	}
	function findSiteDesktopStylesheetLink() {
		const links = document.querySelectorAll(`link[rel="${STYLESHEET_REL}"]`);
		for (const link of links) {
			const href = link.getAttribute("href");
			if (href === null || href.length === 0) continue;
			let pathname;
			try {
				pathname = new URL(href, window.location.href).pathname;
			} catch {
				continue;
			}
			if (isSiteDesktopStylesheetPath(pathname)) return link;
		}
		return null;
	}
	function applySiteStylesheet(theme) {
		const link = findSiteDesktopStylesheetLink();
		if (link === null) {
			log.warn("Site desktop stylesheet link not found; theme cookie updated only");
			return;
		}
		const href = link.getAttribute("href");
		if (href === null || href.length === 0) {
			log.warn("Site desktop stylesheet link not found; theme cookie updated only");
			return;
		}
		link.setAttribute("href", replaceStylesheetFilename(href, stylesheetFilenameForTheme(theme)));
	}
	function getSiteTheme() {
		if (readCookieValue("theme") === "dark") return "dark";
		return "light";
	}
	function setSiteTheme(theme) {
		if (theme === "dark") writeThemeCookie(SITE_THEME_COOKIE_VALUE_DARK, new Date(Date.now() + 365 * MS_PER_DAY));
		else deleteThemeCookie();
		applySiteStylesheet(theme);
	}
	var TWEAKS_CHECKBOX_ID = "rdw-tweaks-enabled";
	var SITE_DARK_THEME_CHECKBOX_ID = "rdw-site-dark-theme";
	var GRID_FAV_CHECKBOX_ID = "rdw-grid-fav-buttons";
	var FEATURE_CHECKBOX_ID_PREFIX = "rdw-feature-";
	var FEATURE_CHOICE_ID_PREFIX = "rdw-feature-choice-";
	var UPDATES_GROUP_SIZE_ID = "rdw-updates-group-size";
	var PLAYLIST_CHUNK_SIZE_ID = "rdw-playlist-chunk-size";
	var ARTIST_FILTER_ID = "rdw-artist-filter";
	var PANEL_FEATURE_STATE_ID = "panel";
	var PANEL_TABS = [
		"collections",
		"artists",
		"favorites",
		"settings"
	];
	var PANEL_TAB_LABELS = {
		collections: "Collections",
		artists: "Artists",
		favorites: "Favorites",
		settings: "Settings"
	};
	var ARTISTS_FILTER_THRESHOLD = 12;
	var UNFOLLOW_UNDO_MS = 5e3;
	var SIZE_PERSIST_MS = 300;
	var PANEL_MIN_WIDTH_PX = 320;
	var PANEL_MIN_HEIGHT_PX = 240;
	var PANEL_DEFAULT_WIDTH_PX = 360;
	var PANEL_DEFAULT_HEIGHT_PX = 480;
	var ARTISTS_EMPTY_HINT = "Follow artists with the Follow button next to their name in the tag list.";
	var ARTIST_FILTER_LABEL = "Filter artists";
	var UNFOLLOW_UNDO_LABEL = "Undo";
	var UNFOLLOWED_PREFIX = "Unfollowed ";
	function isPanelTab(value) {
		return typeof value === "string" && PANEL_TABS.some((tab) => tab === value);
	}
	function isUnknownRecord(value) {
		return value !== null && typeof value === "object";
	}
	function clampSize(value, min) {
		if (!Number.isFinite(value)) return min;
		return Math.max(min, Math.floor(value));
	}
	function readPersistedPanelState() {
		const raw = getFeatureState(PANEL_FEATURE_STATE_ID);
		let tab = "collections";
		let width = PANEL_DEFAULT_WIDTH_PX;
		let height = PANEL_DEFAULT_HEIGHT_PX;
		if (isUnknownRecord(raw)) {
			if (isPanelTab(raw["tab"])) tab = raw["tab"];
			const rawWidth = raw["width"];
			const rawHeight = raw["height"];
			if (typeof rawWidth === "number") width = clampSize(rawWidth, PANEL_MIN_WIDTH_PX);
			if (typeof rawHeight === "number") height = clampSize(rawHeight, PANEL_MIN_HEIGHT_PX);
		}
		return {
			tab,
			width,
			height
		};
	}
	function writePersistedPanelState(next) {
		setFeatureState(PANEL_FEATURE_STATE_ID, {
			tab: next.tab,
			width: next.width,
			height: next.height
		});
	}
	function buildSizeCssRule(width, height) {
		return `.${CSS_CLASS.panel}{width:${String(width)}px;height:${String(height)}px;}`;
	}
	function displayArtistName(tag) {
		return tag.replaceAll("_", " ");
	}
	function compareArtistTags(a, b) {
		return a.localeCompare(b, void 0, { sensitivity: "base" });
	}
	function buildHeader(controller) {
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
			controller.close();
		});
		header.append(title, close);
		return header;
	}
	function buildTabList(controller) {
		const tablist = document.createElement("div");
		tablist.className = PANEL_UI_CLASS.tabs;
		tablist.setAttribute("role", "tablist");
		tablist.setAttribute("aria-label", UI_TEXT.panelTitle);
		const active = controller.getActiveTab();
		for (const tab of PANEL_TABS) {
			const button = document.createElement("button");
			button.type = "button";
			button.className = PANEL_UI_CLASS.tab;
			button.id = `rdw-tab-${tab}`;
			button.setAttribute("role", "tab");
			button.setAttribute("aria-controls", `rdw-tabpanel-${tab}`);
			button.setAttribute("aria-selected", tab === active ? "true" : "false");
			button.tabIndex = tab === active ? 0 : -1;
			button.textContent = PANEL_TAB_LABELS[tab];
			button.addEventListener("click", () => {
				if (controller.getActiveTab() === tab) return;
				controller.setActiveTab(tab);
				controller.render();
				controller.focusTab(tab);
			});
			tablist.append(button);
		}
		tablist.addEventListener("keydown", (event) => {
			if (!(event instanceof KeyboardEvent)) return;
			if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
			event.preventDefault();
			const currentIndex = PANEL_TABS.indexOf(controller.getActiveTab());
			if (currentIndex < 0) return;
			const nextTab = PANEL_TABS[(currentIndex + (event.key === "ArrowRight" ? 1 : -1) + PANEL_TABS.length) % PANEL_TABS.length];
			if (nextTab === void 0) return;
			controller.setActiveTab(nextTab);
			controller.render();
			controller.focusTab(nextTab);
		});
		return tablist;
	}
	function buildFeatureSettingsRows() {
		const rows = [];
		for (const feature of FEATURES) {
			if (feature.choice !== void 0) {
				const choiceField = document.createElement("div");
				choiceField.className = CSS_CLASS.field;
				const choiceLabel = document.createElement("label");
				choiceLabel.className = CSS_CLASS.label;
				choiceLabel.htmlFor = `${FEATURE_CHOICE_ID_PREFIX}${feature.id}`;
				choiceLabel.textContent = feature.label;
				const select = document.createElement("select");
				select.id = `${FEATURE_CHOICE_ID_PREFIX}${feature.id}`;
				select.className = CSS_CLASS.input;
				const selected = getFeatureChoice(feature.id);
				for (const option of feature.choice.options) {
					const optionEl = document.createElement("option");
					optionEl.value = option.value;
					optionEl.textContent = option.label;
					if (option.value === selected) optionEl.selected = true;
					select.append(optionEl);
				}
				select.addEventListener("change", () => {
					setFeatureChoiceValue(feature.id, select.value);
					if (feature.cssOnly === true) {
						applyCssOnlyFeatureChoice(feature.id, select.value);
						return;
					}
					window.location.reload();
				});
				choiceField.append(choiceLabel, select);
				rows.push(choiceField);
				continue;
			}
			const row = document.createElement("div");
			row.className = CSS_CLASS.checkboxRow;
			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.id = `${FEATURE_CHECKBOX_ID_PREFIX}${feature.id}`;
			checkbox.className = CSS_CLASS.checkbox;
			checkbox.checked = isFeatureEnabled(feature.id);
			checkbox.addEventListener("change", () => {
				setFeatureEnabled(feature.id, checkbox.checked);
				if (feature.cssOnly === true) {
					applyCssOnlyFeatureEnabled(feature.id, checkbox.checked);
					return;
				}
				window.location.reload();
			});
			const label = document.createElement("label");
			label.className = CSS_CLASS.label;
			label.htmlFor = checkbox.id;
			label.textContent = feature.label;
			row.append(checkbox, label);
			rows.push(row);
		}
		return rows;
	}
	function buildSettingsTab(controller, onThemeChange) {
		const scroll = document.createElement("div");
		scroll.className = PANEL_UI_CLASS.scrollRegion;
		const section = document.createElement("section");
		section.className = CSS_CLASS.section;
		const tweaksRow = document.createElement("div");
		tweaksRow.className = CSS_CLASS.checkboxRow;
		const tweaksCheckbox = document.createElement("input");
		tweaksCheckbox.type = "checkbox";
		tweaksCheckbox.id = TWEAKS_CHECKBOX_ID;
		tweaksCheckbox.className = CSS_CLASS.checkbox;
		tweaksCheckbox.checked = getTweaksEnabled();
		tweaksCheckbox.addEventListener("change", () => {
			setTweaksEnabled(tweaksCheckbox.checked);
			window.location.reload();
		});
		const tweaksLabel = document.createElement("label");
		tweaksLabel.className = CSS_CLASS.label;
		tweaksLabel.htmlFor = tweaksCheckbox.id;
		tweaksLabel.textContent = UI_TEXT.enablePageTweaksLabel;
		tweaksRow.append(tweaksCheckbox, tweaksLabel);
		section.append(tweaksRow);
		const themeRow = document.createElement("div");
		themeRow.className = CSS_CLASS.checkboxRow;
		const themeCheckbox = document.createElement("input");
		themeCheckbox.type = "checkbox";
		themeCheckbox.id = SITE_DARK_THEME_CHECKBOX_ID;
		themeCheckbox.className = CSS_CLASS.checkbox;
		themeCheckbox.checked = getSiteTheme() === "dark";
		themeCheckbox.addEventListener("change", () => {
			setSiteTheme(themeCheckbox.checked ? "dark" : "light");
			onThemeChange();
		});
		const themeLabel = document.createElement("label");
		themeLabel.className = CSS_CLASS.label;
		themeLabel.htmlFor = themeCheckbox.id;
		themeLabel.textContent = UI_TEXT.siteDarkThemeLabel;
		themeRow.append(themeCheckbox, themeLabel);
		section.append(themeRow);
		const themeHint = document.createElement("p");
		themeHint.className = CSS_CLASS.hint;
		themeHint.textContent = UI_TEXT.siteDarkThemeHint;
		section.append(themeHint);
		for (const row of buildFeatureSettingsRows()) section.append(row);
		const groupField = document.createElement("div");
		groupField.className = CSS_CLASS.field;
		const groupLabel = document.createElement("label");
		groupLabel.className = CSS_CLASS.label;
		groupLabel.htmlFor = UPDATES_GROUP_SIZE_ID;
		groupLabel.textContent = UI_TEXT.updatesGroupSizeLabel;
		const groupInput = document.createElement("input");
		groupInput.id = UPDATES_GROUP_SIZE_ID;
		groupInput.className = CSS_CLASS.input;
		groupInput.type = "number";
		groupInput.min = "0";
		groupInput.step = "1";
		groupInput.value = String(getUpdatesGroupSize());
		groupInput.addEventListener("change", () => {
			const value = Number(groupInput.value);
			setUpdatesGroupSize(Number.isFinite(value) ? value : 0);
			controller.render();
		});
		groupField.append(groupLabel, groupInput);
		section.append(groupField);
		const playlistField = document.createElement("div");
		playlistField.className = CSS_CLASS.field;
		const playlistLabel = document.createElement("label");
		playlistLabel.className = CSS_CLASS.label;
		playlistLabel.htmlFor = PLAYLIST_CHUNK_SIZE_ID;
		playlistLabel.textContent = UI_TEXT.playlistChunkSizeLabel;
		const playlistInput = document.createElement("input");
		playlistInput.id = PLAYLIST_CHUNK_SIZE_ID;
		playlistInput.className = CSS_CLASS.input;
		playlistInput.type = "number";
		playlistInput.min = "1";
		playlistInput.step = "1";
		playlistInput.value = String(getPlaylistChunkSize());
		playlistInput.addEventListener("change", () => {
			const value = Number(playlistInput.value);
			setPlaylistChunkSize(Number.isFinite(value) ? value : 0);
			controller.render();
		});
		playlistField.append(playlistLabel, playlistInput);
		section.append(playlistField);
		section.append(createBlacklistSection());
		const toolbar = document.createElement("div");
		toolbar.className = CSS_CLASS.toolbar;
		const exportBtn = document.createElement("button");
		exportBtn.type = "button";
		exportBtn.className = CSS_CLASS.secondaryButton;
		exportBtn.textContent = UI_TEXT.export;
		exportBtn.addEventListener("click", () => {
			controller.downloadExport();
		});
		const importBtn = document.createElement("button");
		importBtn.type = "button";
		importBtn.className = CSS_CLASS.secondaryButton;
		importBtn.textContent = UI_TEXT.import;
		importBtn.addEventListener("click", () => {
			controller.clearImportError();
			controller.requestImport();
		});
		toolbar.append(exportBtn, importBtn);
		section.append(toolbar);
		if (controller.getImportError().length > 0) {
			const error = document.createElement("p");
			error.className = CSS_CLASS.error;
			error.textContent = `${UI_TEXT.importErrorPrefix} ${controller.getImportError()}`;
			section.append(error);
		}
		scroll.append(section);
		return scroll;
	}
	function buildArtistUndoRow(tag, controller) {
		const item = document.createElement("li");
		item.className = PANEL_UI_CLASS.artistRow;
		item.dataset.tag = tag;
		const row = document.createElement("div");
		row.className = PANEL_UI_CLASS.artistUndo;
		const message = document.createElement("span");
		message.textContent = `${UNFOLLOWED_PREFIX}${displayArtistName(tag)}`;
		const undoBtn = document.createElement("button");
		undoBtn.type = "button";
		undoBtn.className = CSS_CLASS.secondaryButton;
		undoBtn.textContent = UNFOLLOW_UNDO_LABEL;
		undoBtn.addEventListener("click", () => {
			controller.undoUnfollow(tag);
		});
		row.append(message, undoBtn);
		item.append(row);
		return item;
	}
	function buildArtistRow(artist, controller) {
		const item = document.createElement("li");
		item.className = PANEL_UI_CLASS.artistRow;
		item.dataset.tag = artist.tag;
		const link = document.createElement("a");
		link.className = PANEL_UI_CLASS.artistLink;
		link.href = buildSearchUrl([{
			tag: artist.tag,
			type: TAG_TYPE_INCLUDE
		}]);
		link.textContent = displayArtistName(artist.tag);
		link.title = artist.tag;
		const removeBtn = document.createElement("button");
		removeBtn.type = "button";
		removeBtn.className = CSS_CLASS.iconButton;
		removeBtn.textContent = "×";
		removeBtn.setAttribute("aria-label", `Unfollow ${artist.tag}`);
		removeBtn.addEventListener("click", () => {
			controller.beginUnfollow(artist.tag);
		});
		item.append(link, removeBtn);
		return item;
	}
	function buildArtistsTab(artists, controller) {
		const root = document.createElement("div");
		root.className = PANEL_UI_CLASS.scrollRegion;
		const meta = document.createElement("div");
		meta.className = PANEL_UI_CLASS.artistMeta;
		const countLine = document.createElement("p");
		countLine.className = CSS_CLASS.hint;
		const count = artists.length;
		countLine.textContent = `${String(count)} artist${count === 1 ? "" : "s"}`;
		const seen = getSeenPostId();
		const seenHint = document.createElement("p");
		seenHint.className = CSS_CLASS.hint;
		seenHint.textContent = seen > 0 ? `${UI_TEXT.seenUpTo}${String(seen)}` : UI_TEXT.seenNothing;
		meta.append(countLine, seenHint);
		root.append(meta);
		const pending = controller.getPendingUnfollows();
		const pendingTags = new Set(pending.map((entry) => entry.tag));
		const sorted = [...artists].sort((a, b) => compareArtistTags(a.tag, b.tag));
		if (sorted.length === 0 && pending.length === 0) {
			const empty = document.createElement("p");
			empty.className = CSS_CLASS.hint;
			empty.textContent = ARTISTS_EMPTY_HINT;
			root.append(empty);
			return root;
		}
		const showFilter = sorted.length + pending.length > ARTISTS_FILTER_THRESHOLD;
		let filterValue = controller.getArtistFilter().trim().toLowerCase();
		if (showFilter) {
			const filterField = document.createElement("div");
			filterField.className = `${CSS_CLASS.field} ${PANEL_UI_CLASS.artistFilter}`;
			const filterLabel = document.createElement("label");
			filterLabel.className = CSS_CLASS.label;
			filterLabel.htmlFor = ARTIST_FILTER_ID;
			filterLabel.textContent = ARTIST_FILTER_LABEL;
			const filterInput = document.createElement("input");
			filterInput.id = ARTIST_FILTER_ID;
			filterInput.className = CSS_CLASS.input;
			filterInput.type = "search";
			filterInput.value = controller.getArtistFilter();
			filterInput.addEventListener("input", () => {
				controller.setArtistFilter(filterInput.value);
				controller.render();
			});
			filterField.append(filterLabel, filterInput);
			root.append(filterField);
		} else if (controller.getArtistFilter().length > 0) {
			controller.setArtistFilter("");
			filterValue = "";
		}
		const list = document.createElement("ul");
		list.className = PANEL_UI_CLASS.artistList;
		const matchesFilter = (tag) => {
			if (filterValue.length === 0) return true;
			return tag.toLowerCase().includes(filterValue) || displayArtistName(tag).toLowerCase().includes(filterValue);
		};
		const pendingSorted = [...pending].sort((a, b) => compareArtistTags(a.tag, b.tag));
		for (const entry of pendingSorted) {
			if (!matchesFilter(entry.tag)) continue;
			list.append(buildArtistUndoRow(entry.tag, controller));
		}
		for (const artist of sorted) {
			if (pendingTags.has(artist.tag)) continue;
			if (!matchesFilter(artist.tag)) continue;
			list.append(buildArtistRow(artist, controller));
		}
		root.append(list);
		return root;
	}
	function buildFavoritesTab() {
		const scroll = document.createElement("div");
		scroll.className = PANEL_UI_CLASS.scrollRegion;
		const favRow = document.createElement("div");
		favRow.className = CSS_CLASS.checkboxRow;
		const favCheckbox = document.createElement("input");
		favCheckbox.type = "checkbox";
		favCheckbox.id = GRID_FAV_CHECKBOX_ID;
		favCheckbox.className = CSS_CLASS.checkbox;
		favCheckbox.checked = getGridFavButtonsEnabled();
		favCheckbox.addEventListener("change", () => {
			const enabled = favCheckbox.checked;
			setGridFavButtonsEnabled(enabled);
			setGridFavButtonsVisible(enabled);
		});
		const favLabel = document.createElement("label");
		favLabel.className = CSS_CLASS.label;
		favLabel.htmlFor = favCheckbox.id;
		favLabel.textContent = UI_TEXT.gridFavButtonsLabel;
		favRow.append(favCheckbox, favLabel);
		const favoritesSyncSection = createFavoritesSyncSection({ includeHeading: true });
		scroll.append(favRow, favoritesSyncSection);
		return scroll;
	}
	function buildFooter() {
		const footer = document.createElement("div");
		footer.className = PANEL_UI_CLASS.footer;
		footer.textContent = `v${USERSCRIPT_VERSION}`;
		return footer;
	}
	function mountPanel(target = document.body) {
		if (document.getElementById("ruledesk-web-root") !== null) return;
		const host = document.createElement("div");
		host.id = PANEL_ROOT_ID;
		const shadow = host.attachShadow({ mode: "open" });
		const style = document.createElement("style");
		style.textContent = PANEL_CSS;
		shadow.append(style);
		const sizeStyle = document.createElement("style");
		shadow.append(sizeStyle);
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
		let importError = "";
		let artistFilter = "";
		let persisted = readPersistedPanelState();
		let activeTab = persisted.tab;
		const pendingUnfollows = [];
		sizeStyle.textContent = buildSizeCssRule(persisted.width, persisted.height);
		function applyThemeClass() {
			host.classList.toggle(PANEL_UI_CLASS.themeDark, getSiteTheme() === "dark");
		}
		applyThemeClass();
		let sizePersistTimer = null;
		let lastWrittenWidth = persisted.width;
		let lastWrittenHeight = persisted.height;
		function scheduleSizePersist(width, height) {
			const nextWidth = clampSize(width, PANEL_MIN_WIDTH_PX);
			const nextHeight = clampSize(height, PANEL_MIN_HEIGHT_PX);
			if (nextWidth === lastWrittenWidth && nextHeight === lastWrittenHeight) return;
			if (sizePersistTimer !== null) clearTimeout(sizePersistTimer);
			sizePersistTimer = setTimeout(() => {
				sizePersistTimer = null;
				lastWrittenWidth = nextWidth;
				lastWrittenHeight = nextHeight;
				persisted = {
					tab: activeTab,
					width: nextWidth,
					height: nextHeight
				};
				writePersistedPanelState(persisted);
				sizeStyle.textContent = buildSizeCssRule(nextWidth, nextHeight);
			}, SIZE_PERSIST_MS);
		}
		(typeof ResizeObserver !== "undefined" ? new ResizeObserver((entries) => {
			if (!open) return;
			const entry = entries[0];
			if (entry === void 0) return;
			const { width, height } = entry.contentRect;
			scheduleSizePersist(width, height);
		}) : null)?.observe(panel);
		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = ".json,application/json";
		fileInput.className = CSS_CLASS.hidden;
		fileInput.setAttribute("aria-hidden", "true");
		fileInput.tabIndex = -1;
		root.append(fileInput);
		function clearPendingUnfollow(tag) {
			const index = pendingUnfollows.findIndex((entry) => entry.tag === tag);
			if (index < 0) return;
			const [removed] = pendingUnfollows.splice(index, 1);
			if (removed !== void 0) clearTimeout(removed.timer);
		}
		const controller = {
			getArtistFilter: () => artistFilter,
			setArtistFilter: (value) => {
				artistFilter = value;
			},
			getImportError: () => importError,
			clearImportError: () => {
				importError = "";
			},
			requestImport: () => {
				fileInput.value = "";
				fileInput.click();
			},
			downloadExport: () => {
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
			},
			close: () => {
				setOpen(false);
			},
			render: () => {
				render();
			},
			getActiveTab: () => activeTab,
			setActiveTab: (tab) => {
				activeTab = tab;
				persisted = {
					tab: activeTab,
					width: lastWrittenWidth,
					height: lastWrittenHeight
				};
				writePersistedPanelState(persisted);
			},
			beginUnfollow: (tag) => {
				clearPendingUnfollow(tag);
				removeArtist(tag);
				const timer = setTimeout(() => {
					clearPendingUnfollow(tag);
					render();
				}, UNFOLLOW_UNDO_MS);
				pendingUnfollows.push({
					tag,
					timer
				});
				render();
			},
			undoUnfollow: (tag) => {
				clearPendingUnfollow(tag);
				try {
					addArtist(tag);
				} catch (error) {
					log.warn("Undo unfollow failed", error);
				}
				render();
			},
			getPendingUnfollows: () => pendingUnfollows,
			focusTab: (tab) => {
				const el = panel.querySelector(`#rdw-tab-${tab}`);
				if (el instanceof HTMLElement) el.focus();
			}
		};
		function setOpen(next) {
			open = next;
			panel.classList.toggle(CSS_CLASS.panelOpen, open);
			panel.hidden = !open;
			toggle.setAttribute("aria-expanded", open ? "true" : "false");
			toggle.setAttribute("aria-label", open ? UI_TEXT.toggleClose : UI_TEXT.toggleOpen);
			if (open) {
				render();
				const focusTarget = panel.querySelector(`[role="tab"][aria-selected="true"]`);
				if (focusTarget instanceof HTMLElement) focusTarget.focus();
			} else {
				importError = "";
				toggle.focus();
			}
		}
		function render() {
			const data = load();
			panel.replaceChildren();
			const body = document.createElement("div");
			body.className = CSS_CLASS.body;
			for (const tab of PANEL_TABS) {
				const panelEl = document.createElement("div");
				panelEl.className = PANEL_UI_CLASS.tabPanel;
				panelEl.id = `rdw-tabpanel-${tab}`;
				panelEl.setAttribute("role", "tabpanel");
				panelEl.setAttribute("aria-labelledby", `rdw-tab-${tab}`);
				panelEl.hidden = !(tab === activeTab);
				if (tab === "collections") panelEl.append(createCollectionsTab());
				else if (tab === "artists") panelEl.append(buildArtistsTab(data.artists, controller));
				else if (tab === "favorites") panelEl.append(buildFavoritesTab());
				else panelEl.append(buildSettingsTab(controller, applyThemeClass));
				body.append(panelEl);
			}
			panel.append(buildHeader(controller), buildTabList(controller), body, buildFooter());
		}
		toggle.addEventListener("click", () => {
			setOpen(!open);
		});
		shadow.addEventListener("keydown", (event) => {
			if (!(event instanceof KeyboardEvent)) return;
			if (event.key === "Escape" && open) {
				event.stopPropagation();
				setOpen(false);
			}
		});
		document.addEventListener("click", (event) => {
			if (!open) return;
			if (event.composedPath().includes(host)) return;
			setOpen(false);
		}, true);
		fileInput.addEventListener("change", () => {
			const file = fileInput.files?.item(0);
			if (file === null || file === void 0) return;
			const reader = new FileReader();
			reader.addEventListener("load", () => {
				try {
					importJson(typeof reader.result === "string" ? reader.result : "");
					importError = "";
					render();
				} catch (error) {
					importError = error instanceof Error ? error.message : "Unknown import error";
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
	function startApp() {
		mountPanel();
		const pageKind = detectPageKind(window.location.search);
		if (pageKind === "list") {
			mountCards();
			mountArtistSidebar();
		} else if (pageKind === "post") mountArtistSidebar();
		else if (pageKind === "favorites") syncFavoritesPage();
		runFeatures(pageKind, window.location.search);
	}
	var TOKEN_VAR = {
		bg: "--rdw-bg",
		surface: "--rdw-surface",
		surface2: "--rdw-surface-2",
		border: "--rdw-border",
		text: "--rdw-text",
		muted: "--rdw-muted",
		accent: "--rdw-accent",
		accentSoft: "--rdw-accent-soft",
		danger: "--rdw-danger",
		dangerSoft: "--rdw-danger-soft",
		tagArtist: "--rdw-tag-artist",
		tagCharacter: "--rdw-tag-character",
		tagCopyright: "--rdw-tag-copyright",
		tagMetadata: "--rdw-tag-metadata",
		radiusS: "--rdw-radius-s",
		radiusM: "--rdw-radius-m",
		radiusL: "--rdw-radius-l",
		shadow1: "--rdw-shadow-1",
		shadow2: "--rdw-shadow-2",
		font: "--rdw-font",
		backgroundImage: "--rdw-background-image",
		backgroundDim: "--rdw-background-dim"
	};
	var LIGHT_PALETTE = {
		bg: "#aae5a4",
		surface: "#ffffff",
		surface2: "#f4f6f8",
		border: "#cfd6dd",
		text: "#1c2228",
		muted: "#66727e",
		accent: "#2f6fed",
		accentSoft: "#e8f0fe",
		danger: "#c0392b",
		dangerSoft: "#fdecea",
		tagArtist: "#b00020",
		tagCharacter: "#0a7a2f",
		tagCopyright: "#8e24aa",
		tagMetadata: "#ff8800",
		radiusS: "6px",
		radiusM: "8px",
		radiusL: "10px",
		shadow1: "0 1px 2px rgba(0, 0, 0, 0.06)",
		shadow2: "0 8px 24px rgba(0, 0, 0, 0.25)",
		font: "system-ui, \"Segoe UI\", sans-serif"
	};
	var DARK_PALETTE = {
		bg: "#16181c",
		surface: "#1e2228",
		surface2: "#262b33",
		border: "#3a424c",
		text: "#e8edf2",
		muted: "#8a96a3",
		accent: "#4c8bf5",
		accentSoft: "#1a2f5a",
		danger: "#e57373",
		dangerSoft: "#3d1f1f",
		tagArtist: "#ff6b81",
		tagCharacter: "#5dcea0",
		tagCopyright: "#ce93d8",
		tagMetadata: "#ffb74d",
		radiusS: "6px",
		radiusM: "8px",
		radiusL: "10px",
		shadow1: "0 1px 2px rgba(0, 0, 0, 0.35)",
		shadow2: "0 8px 24px rgba(0, 0, 0, 0.55)",
		font: "system-ui, \"Segoe UI\", sans-serif"
	};
	function paletteForMode(mode) {
		return mode === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
	}
	function escapeCssValue(value) {
		return value.replace(/</g, "\\3c ");
	}
	function tokensToCssDeclarations(palette) {
		return [
			`${TOKEN_VAR.bg}: ${escapeCssValue(palette.bg)};`,
			`${TOKEN_VAR.surface}: ${escapeCssValue(palette.surface)};`,
			`${TOKEN_VAR.surface2}: ${escapeCssValue(palette.surface2)};`,
			`${TOKEN_VAR.border}: ${escapeCssValue(palette.border)};`,
			`${TOKEN_VAR.text}: ${escapeCssValue(palette.text)};`,
			`${TOKEN_VAR.muted}: ${escapeCssValue(palette.muted)};`,
			`${TOKEN_VAR.accent}: ${escapeCssValue(palette.accent)};`,
			`${TOKEN_VAR.accentSoft}: ${escapeCssValue(palette.accentSoft)};`,
			`${TOKEN_VAR.danger}: ${escapeCssValue(palette.danger)};`,
			`${TOKEN_VAR.dangerSoft}: ${escapeCssValue(palette.dangerSoft)};`,
			`${TOKEN_VAR.tagArtist}: ${escapeCssValue(palette.tagArtist)};`,
			`${TOKEN_VAR.tagCharacter}: ${escapeCssValue(palette.tagCharacter)};`,
			`${TOKEN_VAR.tagCopyright}: ${escapeCssValue(palette.tagCopyright)};`,
			`${TOKEN_VAR.tagMetadata}: ${escapeCssValue(palette.tagMetadata)};`,
			`${TOKEN_VAR.radiusS}: ${escapeCssValue(palette.radiusS)};`,
			`${TOKEN_VAR.radiusM}: ${escapeCssValue(palette.radiusM)};`,
			`${TOKEN_VAR.radiusL}: ${escapeCssValue(palette.radiusL)};`,
			`${TOKEN_VAR.shadow1}: ${escapeCssValue(palette.shadow1)};`,
			`${TOKEN_VAR.shadow2}: ${escapeCssValue(palette.shadow2)};`,
			`${TOKEN_VAR.font}: ${escapeCssValue(palette.font)};`
		].join("\n  ");
	}
	function buildTokensCss(palette, selector = ":root") {
		return `${selector} {\n  ${tokensToCssDeclarations(palette)}\n}\n`;
	}
	function applyCustomThemeProperties(target, custom) {
		if (custom.accent !== void 0) target.style.setProperty(TOKEN_VAR.accent, custom.accent);
		if (custom.bg !== void 0) target.style.setProperty(TOKEN_VAR.bg, custom.bg);
		if (custom.surface !== void 0) target.style.setProperty(TOKEN_VAR.surface, custom.surface);
		if (custom.text !== void 0) target.style.setProperty(TOKEN_VAR.text, custom.text);
		if (custom.backgroundImage !== void 0 && custom.backgroundImage.length > 0) target.style.setProperty(TOKEN_VAR.backgroundImage, `url("${custom.backgroundImage.replace(/"/g, "\\\"")}")`);
		if (custom.backgroundDim !== void 0) target.style.setProperty(TOKEN_VAR.backgroundDim, String(custom.backgroundDim));
	}
	function clearCustomThemeProperties(target) {
		target.style.removeProperty(TOKEN_VAR.accent);
		target.style.removeProperty(TOKEN_VAR.bg);
		target.style.removeProperty(TOKEN_VAR.surface);
		target.style.removeProperty(TOKEN_VAR.text);
		target.style.removeProperty(TOKEN_VAR.backgroundImage);
		target.style.removeProperty(TOKEN_VAR.backgroundDim);
	}
	function themeEnablesSkin(theme) {
		return theme === "light" || theme === "dark" || theme === "custom";
	}
	function paletteModeForTheme(theme) {
		if (theme === "dark" || theme === "site-dark") return "dark";
		if (theme === "custom") return "light";
		return "light";
	}
	function resolveTokenPalette(appearance) {
		const base = paletteForMode(paletteModeForTheme(appearance.theme));
		if (appearance.theme !== "custom" || appearance.custom === void 0) return base;
		return {
			...base,
			accent: appearance.custom.accent,
			bg: appearance.custom.bg,
			surface: appearance.custom.surface,
			text: appearance.custom.text
		};
	}
	function ensureStyleElement(id) {
		const existing = document.getElementById(id);
		if (existing instanceof HTMLStyleElement) return existing;
		if (existing !== null) existing.remove();
		const style = document.createElement("style");
		style.id = id;
		(document.head ?? document.documentElement).append(style);
		return style;
	}
	function injectTokenStyles(palette) {
		const style = ensureStyleElement(TOKEN_STYLE_ID);
		style.textContent = buildTokensCss(palette, ":root");
		return style;
	}
	function injectSiteSkinHook(cssText = "") {
		const style = ensureStyleElement(SITE_SKIN_STYLE_ID);
		style.textContent = cssText;
		return style;
	}
	function applyHtmlThemeAttributes(theme) {
		const root = document.documentElement;
		root.setAttribute(RDW_THEME_ATTR, theme);
		if (themeEnablesSkin(theme)) root.classList.add(RDW_SKIN_CLASS);
		else root.classList.remove(RDW_SKIN_CLASS);
	}
	function applyAppearanceToDocument(options) {
		const { appearance } = options;
		applyHtmlThemeAttributes(appearance.theme);
		injectTokenStyles(resolveTokenPalette(appearance));
		injectSiteSkinHook(options.siteSkinCss ?? "");
		const root = document.documentElement;
		clearCustomThemeProperties(root);
		if (appearance.theme === "custom" && appearance.custom !== void 0) {
			const backgroundImage = options.backgroundDataUrl ?? appearance.custom.backgroundImage;
			applyCustomThemeProperties(root, backgroundImage !== void 0 && backgroundImage.length > 0 ? {
				accent: appearance.custom.accent,
				bg: appearance.custom.bg,
				surface: appearance.custom.surface,
				text: appearance.custom.text,
				backgroundImage,
				...appearance.custom.backgroundDim !== void 0 ? { backgroundDim: appearance.custom.backgroundDim } : {}
			} : {
				accent: appearance.custom.accent,
				bg: appearance.custom.bg,
				surface: appearance.custom.surface,
				text: appearance.custom.text,
				...appearance.custom.backgroundDim !== void 0 ? { backgroundDim: appearance.custom.backgroundDim } : {}
			});
		} else if (options.backgroundDataUrl !== void 0 && options.backgroundDataUrl.length > 0) applyCustomThemeProperties(root, { backgroundImage: options.backgroundDataUrl });
	}
	function bootEarly() {
		const appearance = getAppearance();
		const backgroundDataUrl = getAppearanceBackgroundDataUrl();
		applyAppearanceToDocument({
			appearance,
			...backgroundDataUrl !== void 0 ? { backgroundDataUrl } : {}
		});
	}
	function whenDomReady(callback) {
		if (document.readyState === "interactive" || document.readyState === "complete") {
			callback();
			return;
		}
		document.addEventListener("DOMContentLoaded", callback, { once: true });
	}
	bootEarly();
	whenDomReady(() => {
		startApp();
	});
})();
