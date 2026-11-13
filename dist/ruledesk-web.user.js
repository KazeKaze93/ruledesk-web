// ==UserScript==
// @name         RuleDesk Web
// @namespace    https://github.com/kazekaze93/ruledesk-web
// @version      0.11.0
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
	var APPEARANCE_BACKGROUND_TOO_LARGE = "Background image is too large (max 1.5 MB).";
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
	var IMPORT_SCHEMA_ERROR_PREFIX = "File is not a RuleDesk Web export";
	var COLLECTION_KIND_SEARCH = "search";
	var COLLECTION_KIND_POSTS = "posts";
	var DOCUMENT_STYLE_ID = "ruledesk-web-document-style";
	var UPDATES_BAR_ID = "ruledesk-web-updates-bar";
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
		updatesGroupSizeLabel: "Artists per search (0 = 400)",
		playlistChunkSizeLabel: "Collection part size",
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
	var $ZodNullable = $constructor("$ZodNullable", (inst, def) => {
		$ZodType.init(inst, def);
		defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
		defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
		defineLazyInternal(inst, "pattern", (zod) => {
			const pattern = zod.def.innerType._zod.pattern;
			return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
		});
		defineLazyInternal(inst, "values", (zod) => {
			return zod.def.innerType._zod.values ? new Set([...zod.def.innerType._zod.values, null]) : void 0;
		});
		inst._zod.parse = (payload, ctx) => {
			if (payload.value === null) return payload;
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
	var ZodMiniNullable = $constructor("ZodMiniNullable", (inst, def) => {
		$ZodNullable.init(inst, def);
		ZodMiniType.init(inst, def);
	});
	function nullable(innerType) {
		return new ZodMiniNullable({
			type: "nullable",
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
	var MARKS_KEEP_LIMIT = 2e4;
	var MARKS_PRUNE_OVERFLOW_RATIO = .1;
	function marksPruneThreshold(keepLimit = MARKS_KEEP_LIMIT) {
		return keepLimit + Math.floor(keepLimit * MARKS_PRUNE_OVERFLOW_RATIO);
	}
	function postIdSortKey(postId) {
		const parsed = Number(postId);
		if (!Number.isFinite(parsed)) return Number.NEGATIVE_INFINITY;
		return Math.trunc(parsed);
	}
	function pruneMarksIfNeeded(marks, keepLimit = MARKS_KEEP_LIMIT) {
		const entries = Object.entries(marks);
		const threshold = marksPruneThreshold(keepLimit);
		if (entries.length <= threshold) return {
			marks,
			pruned: false
		};
		const sorted = [...entries].sort((left, right) => postIdSortKey(right[0]) - postIdSortKey(left[0]));
		const next = {};
		for (const [postId, flags] of sorted.slice(0, keepLimit)) next[postId] = flags;
		return {
			marks: next,
			pruned: true
		};
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
		bg: "#f3f5f7",
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
	var HEX_SHORT_PATTERN = /^#([0-9a-fA-F]{3})$/;
	var HEX_LONG_PATTERN = /^#([0-9a-fA-F]{6})$/;
	var SRGB_LINEAR_THRESHOLD = .03928;
	var SRGB_LINEAR_DIVISOR = 12.92;
	var SRGB_GAMMA = 2.4;
	var SRGB_A = .055;
	var SRGB_B = 1.055;
	var LUMA_R = .2126;
	var LUMA_G = .7152;
	var LUMA_B = .0722;
	function paletteForMode(mode) {
		return mode === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
	}
	function channelToLinear(channel) {
		const c = channel / 255;
		if (c <= SRGB_LINEAR_THRESHOLD) return c / SRGB_LINEAR_DIVISOR;
		return ((c + SRGB_A) / SRGB_B) ** SRGB_GAMMA;
	}
	function parseHexColor(value) {
		const short = HEX_SHORT_PATTERN.exec(value.trim());
		if (short !== null) {
			const hex = short[1];
			if (hex === void 0) return null;
			return {
				r: Number.parseInt(hex[0] + hex[0], 16),
				g: Number.parseInt(hex[1] + hex[1], 16),
				b: Number.parseInt(hex[2] + hex[2], 16)
			};
		}
		const long = HEX_LONG_PATTERN.exec(value.trim());
		if (long !== null) {
			const hex = long[1];
			if (hex === void 0) return null;
			return {
				r: Number.parseInt(hex.slice(0, 2), 16),
				g: Number.parseInt(hex.slice(2, 4), 16),
				b: Number.parseInt(hex.slice(4, 6), 16)
			};
		}
		return null;
	}
	function relativeLuminance(hex) {
		const rgb = parseHexColor(hex);
		if (rgb === null) return null;
		const r = channelToLinear(rgb.r);
		const g = channelToLinear(rgb.g);
		const b = channelToLinear(rgb.b);
		return LUMA_R * r + LUMA_G * g + LUMA_B * b;
	}
	function customBaseFromLegacyBg(bg) {
		if (bg === void 0) return "light";
		const luma = relativeLuminance(bg);
		if (luma !== null && luma < .5) return "dark";
		return "light";
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
	function applyTokenProperties(target, palette) {
		target.style.setProperty(TOKEN_VAR.bg, palette.bg);
		target.style.setProperty(TOKEN_VAR.surface, palette.surface);
		target.style.setProperty(TOKEN_VAR.surface2, palette.surface2);
		target.style.setProperty(TOKEN_VAR.border, palette.border);
		target.style.setProperty(TOKEN_VAR.text, palette.text);
		target.style.setProperty(TOKEN_VAR.muted, palette.muted);
		target.style.setProperty(TOKEN_VAR.accent, palette.accent);
		target.style.setProperty(TOKEN_VAR.accentSoft, palette.accentSoft);
		target.style.setProperty(TOKEN_VAR.danger, palette.danger);
		target.style.setProperty(TOKEN_VAR.dangerSoft, palette.dangerSoft);
		target.style.setProperty(TOKEN_VAR.tagArtist, palette.tagArtist);
		target.style.setProperty(TOKEN_VAR.tagCharacter, palette.tagCharacter);
		target.style.setProperty(TOKEN_VAR.tagCopyright, palette.tagCopyright);
		target.style.setProperty(TOKEN_VAR.tagMetadata, palette.tagMetadata);
		target.style.setProperty(TOKEN_VAR.radiusS, palette.radiusS);
		target.style.setProperty(TOKEN_VAR.radiusM, palette.radiusM);
		target.style.setProperty(TOKEN_VAR.radiusL, palette.radiusL);
		target.style.setProperty(TOKEN_VAR.shadow1, palette.shadow1);
		target.style.setProperty(TOKEN_VAR.shadow2, palette.shadow2);
		target.style.setProperty(TOKEN_VAR.font, palette.font);
	}
	function applyCustomThemeProperties(target, custom) {
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
	var AppearanceThemeSchema = _enum([
		APPEARANCE_THEME_SITE,
		APPEARANCE_THEME_SITE_DARK,
		APPEARANCE_THEME_LIGHT,
		APPEARANCE_THEME_DARK,
		APPEARANCE_THEME_CUSTOM
	]);
	var APPEARANCE_CUSTOM_BASE_LIGHT = "light";
	var APPEARANCE_CUSTOM_BASE_DARK = "dark";
	var AppearanceCustomBaseSchema = _enum([APPEARANCE_CUSTOM_BASE_LIGHT, APPEARANCE_CUSTOM_BASE_DARK]);
	var AppearanceCustomSchema = object({
		base: AppearanceCustomBaseSchema,
		backgroundImage: optional(string()),
		backgroundDim: optional(number())
	});
	var AppearanceCustomStoredSchema = object({
		base: optional(AppearanceCustomBaseSchema),
		accent: optional(string()),
		bg: optional(string()),
		surface: optional(string()),
		text: optional(string()),
		backgroundImage: optional(string()),
		backgroundDim: optional(number())
	});
	var AppearanceSchema = object({
		theme: AppearanceThemeSchema,
		custom: optional(AppearanceCustomSchema)
	});
	var AppearanceStoredSchema = object({
		theme: AppearanceThemeSchema,
		custom: optional(AppearanceCustomStoredSchema)
	});
	var SettingsSchema = object({
		gridFavButtons: boolean(),
		updatesGroupSize: optional(int().check(_nonnegative())),
		playlistChunkSize: optional(int().check(_positive())),
		tweaksEnabled: optional(boolean()),
		features: optional(record(string(), boolean())),
		featureChoice: optional(record(string(), string())),
		featureState: optional(record(string(), unknown())),
		appearance: optional(AppearanceStoredSchema)
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
	var LEGACY_PANEL_FEATURE_STATE_ID = "panel";
	var LEGACY_PANEL_WIDTH_KEY = "width";
	var LEGACY_PANEL_HEIGHT_KEY = "height";
	var FavsSyncLockSchema = object({
		tabId: string().check(_minLength(1)),
		beatAt: number()
	});
	var FAVS_SYNC_MODE_INCREMENTAL = "incremental";
	var FAVS_SYNC_MODE_FULL = "full";
	var FavsSyncModeSchema = _enum([FAVS_SYNC_MODE_INCREMENTAL, FAVS_SYNC_MODE_FULL]);
	var FavsSyncSchema = object({
		nextPid: int(),
		lastPid: int(),
		startedAt: string(),
		finishedAt: optional(string()),
		running: optional(boolean()),
		userId: optional(int()),
		lock: optional(FavsSyncLockSchema),
		mode: optional(FavsSyncModeSchema)
	});
	var FavsSchema = object({
		version: literal(1),
		ids: array(int()),
		sync: optional(FavsSyncSchema)
	});
	function isUnknownRecord(value) {
		return value !== null && typeof value === "object" && !Array.isArray(value);
	}
	function stripLegacyPanelWindowSize(data) {
		const featureState = data.settings?.featureState;
		if (featureState === void 0) return {
			data,
			changed: false
		};
		const panelRaw = featureState[LEGACY_PANEL_FEATURE_STATE_ID];
		if (!isUnknownRecord(panelRaw)) return {
			data,
			changed: false
		};
		const hasWidth = Object.prototype.hasOwnProperty.call(panelRaw, LEGACY_PANEL_WIDTH_KEY);
		const hasHeight = Object.prototype.hasOwnProperty.call(panelRaw, LEGACY_PANEL_HEIGHT_KEY);
		if (!hasWidth && !hasHeight) return {
			data,
			changed: false
		};
		const nextPanel = {};
		for (const [key, value] of Object.entries(panelRaw)) {
			if (key === "width" || key === "height") continue;
			nextPanel[key] = value;
		}
		const nextFeatureState = { ...featureState };
		if (Object.keys(nextPanel).length === 0) delete nextFeatureState[LEGACY_PANEL_FEATURE_STATE_ID];
		else nextFeatureState[LEGACY_PANEL_FEATURE_STATE_ID] = nextPanel;
		const nextSettings = data.settings === void 0 ? { gridFavButtons: true } : { ...data.settings };
		if (Object.keys(nextFeatureState).length === 0) delete nextSettings.featureState;
		else nextSettings.featureState = nextFeatureState;
		return {
			data: {
				...data,
				settings: nextSettings
			},
			changed: true
		};
	}
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
	function normalizeAppearanceCustom(raw) {
		const next = { base: raw.base === "light" || raw.base === "dark" ? raw.base : customBaseFromLegacyBg(raw.bg) };
		if (raw.backgroundImage !== void 0) next.backgroundImage = raw.backgroundImage;
		if (raw.backgroundDim !== void 0) next.backgroundDim = raw.backgroundDim;
		return next;
	}
	function normalizeAppearance(stored) {
		if (stored.custom === void 0) return { theme: stored.theme };
		return {
			theme: stored.theme,
			custom: normalizeAppearanceCustom(stored.custom)
		};
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
		const stored = data.settings?.appearance;
		if (stored === void 0) return createDefaultAppearance();
		return normalizeAppearance(stored);
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
	function getGmGetValue$2() {
		return GM_getValue;
	}
	function getGmSetValue$2() {
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
		const raw = getGmGetValue$2()(FAVS_STORAGE_KEY, void 0);
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
		getGmSetValue$2()(FAVS_STORAGE_KEY, parsed);
	}
	function setCacheFromData(data) {
		cachedIds = new Set(data.ids);
		cachedSync = data.sync;
		cacheHydrated = true;
	}
	function readMainStorageRaw() {
		const raw = getGmGetValue$2()(STORAGE_KEY, void 0);
		if (raw === void 0 || raw === null) return null;
		const parsed = StorageSchema.safeParse(raw);
		if (!parsed.success) return null;
		return parsed.data;
	}
	function writeMainStorage(data) {
		const pruned = pruneMarksIfNeeded(data.marks);
		const next = pruned.pruned ? {
			...data,
			marks: pruned.marks
		} : data;
		getGmSetValue$2()(STORAGE_KEY, StorageSchema.parse(next));
	}
	function migrateMarksFavToFavs() {
		const main = readMainStorageRaw();
		const favs = readFavsRaw();
		const ids = new Set(favs.ids);
		let marksChanged = false;
		let mainToWrite = null;
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
			let nextMain = main;
			if (marksChanged) nextMain = {
				...main,
				marks: nextMarks
			};
			const stripped = stripLegacyPanelWindowSize(nextMain);
			if (marksChanged || stripped.changed) mainToWrite = stripped.data;
		}
		if (mainToWrite !== null) writeMainStorage(mainToWrite);
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
	function clearFavsCache() {
		cachedIds = null;
		cachedSync = void 0;
		cacheHydrated = false;
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
	function getGmGetValue$1() {
		return GM_getValue;
	}
	function getGmSetValue$1() {
		return GM_setValue;
	}
	function readRaw() {
		return getGmGetValue$1()(STORAGE_KEY, void 0);
	}
	function writeData(data) {
		getGmSetValue$1()(STORAGE_KEY, data);
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
		getGmSetValue$1()(STORAGE_BACKUP_KEY, raw);
		log.error("Invalid storage content backed up", {
			key: STORAGE_KEY,
			backupKey: STORAGE_BACKUP_KEY
		});
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
	function byteLengthUtf8(value) {
		if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(value).length;
		return value.length;
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
		const pruned = pruneMarksIfNeeded(parsed.marks);
		const toWrite = pruned.pruned ? {
			...parsed,
			marks: pruned.marks
		} : parsed;
		writeData(toWrite);
		migrateMarksFavToFavs();
		const after = readRaw();
		if (after === void 0 || after === null) {
			setStorageCache(createDefaultStorage());
			return;
		}
		const reparsed = StorageSchema.safeParse(after);
		if (!reparsed.success) {
			setStorageCache(toWrite);
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
		const stored = resolveUpdatesGroupSize(load());
		if (!Number.isFinite(stored) || stored <= 0) return 400;
		return Math.min(Math.floor(stored), 400);
	}
	function setUpdatesGroupSize(size) {
		const data = load();
		let safeSize = Number.isFinite(size) && size >= 0 ? Math.floor(size) : 0;
		if (safeSize > 400) safeSize = 400;
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
	function setAppearance(appearance) {
		const parsed = AppearanceSchema.parse(appearance);
		const data = load();
		data.settings = {
			...currentSettings(data),
			appearance: parsed
		};
		save(data);
		return parsed;
	}
	function getAppearanceBackgroundDataUrl() {
		const raw = getGmGetValue$1()(APPEARANCE_BACKGROUND_KEY, void 0);
		if (typeof raw !== "string" || raw.length === 0) return;
		return raw;
	}
	function setAppearanceBackgroundDataUrl(dataUrl) {
		if (byteLengthUtf8(dataUrl) > 1572864) throw new Error(APPEARANCE_BACKGROUND_TOO_LARGE);
		getGmSetValue$1()(APPEARANCE_BACKGROUND_KEY, dataUrl);
	}
	function clearAppearanceBackgroundDataUrl() {
		getGmSetValue$1()(APPEARANCE_BACKGROUND_KEY, "");
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
		return reloadFromStorage().artists.map((entry) => entry.tag);
	}
	function isFollowingArtist(tag) {
		const normalized = normalizeArtistTag(tag);
		if (normalized === null) return false;
		return listArtistTags().includes(normalized);
	}
	function addArtist(tag) {
		const normalized = normalizeArtistTag(tag);
		if (normalized === null) throw new Error("Invalid artist tag");
		const data = reloadFromStorage();
		if (data.artists.some((entry) => entry.tag === normalized)) throw new Error("Duplicate artist tag");
		const entry = ArtistEntrySchema.parse({ tag: normalized });
		data.artists.push(entry);
		save(data);
		return entry;
	}
	function removeArtist(tag) {
		const normalized = normalizeArtistTag(tag);
		if (normalized === null) return false;
		const data = reloadFromStorage();
		const next = data.artists.filter((entry) => entry.tag !== normalized);
		if (next.length === data.artists.length) return false;
		data.artists = next;
		save(data);
		return true;
	}
	var COOKIE_PAIR_SEPARATOR = ";";
	var COOKIE_NAME_VALUE_SEPARATOR$1 = "=";
	var BLACKLIST_SPLIT_PATTERN = /[, ]|%20+/g;
	var USER_ENTRY_PREFIX = "user:";
	var RATING_ENTRY_PREFIX = "rating:";
	var MS_PER_DAY$1 = 864e5;
	var DAYS_PER_YEAR = 365;
	var BLACKLIST_TAG_SEPARATOR = " ";
	var changeListeners = new Set();
	function onSiteBlacklistChange(cb) {
		changeListeners.add(cb);
		return () => {
			changeListeners.delete(cb);
		};
	}
	function readCookieValue(name) {
		const pairs = document.cookie.split(COOKIE_PAIR_SEPARATOR);
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
		const raw = readCookieValue(SITE_BLACKLIST_COOKIE_NAME);
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
		for (const listener of changeListeners) listener(normalized);
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
	var FEATURE_ID$9 = "blacklist-hide";
	var FEATURE_LABEL$8 = "Hide blacklisted posts";
	var FEATURE_PAGES$8 = ["list"];
	var BODY_FEATURE_CLASS$3 = featureBodyClass(FEATURE_ID$9);
	var CLASS_BLACKLISTED$1 = "rdw-blacklisted";
	var SCORE_TOKEN_PREFIX$2 = "score:";
	var RATING_TOKEN_PREFIX$1 = "rating:";
	var WHITESPACE_SPLIT = /\s+/;
	var FEATURE_CSS$8 = `
body.${BODY_FEATURE_CLASS$3} span.thumb.${CLASS_BLACKLISTED$1} {
  display: none !important;
}
`.trim();
	var unsubscribeThumbsAdded$4;
	var unsubscribeBlacklistChange;
	function parseAltTags(alt) {
		const tags = [];
		for (const token of alt.trim().split(WHITESPACE_SPLIT)) {
			if (token.length === 0) continue;
			const lower = token.toLowerCase();
			if (lower.startsWith(SCORE_TOKEN_PREFIX$2) || lower.startsWith(RATING_TOKEN_PREFIX$1)) continue;
			tags.push(token);
		}
		return tags;
	}
	function parseTitleRating(title) {
		for (const token of title.trim().split(WHITESPACE_SPLIT)) {
			if (token.length === 0) continue;
			if (token.toLowerCase().startsWith(RATING_TOKEN_PREFIX$1)) return token.slice(7);
		}
		return "";
	}
	function applyBlacklistToThumb(thumb, list) {
		if (!(thumb instanceof HTMLElement)) return;
		const img = thumb.querySelector(SITE_SELECTORS.previewImage);
		const alt = img?.getAttribute("alt") ?? "";
		const title = img?.getAttribute("title") ?? "";
		const matched = isBlacklisted(parseAltTags(alt), 0, parseTitleRating(title), list);
		thumb.classList.toggle(CLASS_BLACKLISTED$1, matched);
	}
	function applyBlacklistToRoot(root, list = readSiteBlacklist()) {
		const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
		for (const thumb of thumbs) applyBlacklistToThumb(thumb, list);
	}
	function ensureSubscriptions() {
		if (unsubscribeThumbsAdded$4 === void 0) unsubscribeThumbsAdded$4 = onThumbsAdded((root) => {
			applyBlacklistToRoot(root);
		});
		if (unsubscribeBlacklistChange === void 0) unsubscribeBlacklistChange = onSiteBlacklistChange((list) => {
			applyBlacklistToRoot(document, list);
		});
	}
	function mountBlacklistHide(ctx) {
		if (ctx.pageKind !== "list") return;
		applyBlacklistToRoot(document);
		ensureSubscriptions();
	}
	var blacklistHideFeature = {
		id: FEATURE_ID$9,
		label: FEATURE_LABEL$8,
		pages: [...FEATURE_PAGES$8],
		defaultEnabled: true,
		cssOnly: true,
		css: FEATURE_CSS$8,
		mount: mountBlacklistHide
	};
	var RDW_HASH_PREFIX = "#rdw/";
	var RDW_ROUTE_COLLECTIONS = "collections";
	var RDW_ROUTE_FOLLOWING = "following";
	var RDW_ROUTE_SETTINGS = "settings";
	var RDW_ROUTES = [
		RDW_ROUTE_COLLECTIONS,
		RDW_ROUTE_FOLLOWING,
		RDW_ROUTE_SETTINGS
	];
	var RDW_HASH_COLLECTIONS = `${RDW_HASH_PREFIX}${RDW_ROUTE_COLLECTIONS}`;
	var RDW_HASH_FOLLOWING = `${RDW_HASH_PREFIX}${RDW_ROUTE_FOLLOWING}`;
	var RDW_HASH_SETTINGS = `${RDW_HASH_PREFIX}${RDW_ROUTE_SETTINGS}`;
	var RDW_OWN_PAGE_CLASS = "rdw-own-page";
	var RDW_PAGE_ROOT_ID = "rdw-page-root";
	var RDW_OWN_PAGE_STYLE_ID = "rdw-own-page-style";
	var HEADER_SELECTOR = "div#header";
	var NAVBAR_SELECTOR = "div#header ul#navbar";
	var CURRENT_PAGE_CLASS$1 = "current-page";
	var MENU_ITEM_ID = {
		collections: "rdw-nav-collections",
		following: "rdw-nav-following",
		favorites: "rdw-nav-favorites",
		settings: "rdw-nav-settings"
	};
	var MENU_LABEL = {
		collections: "Collections",
		following: "Following",
		favorites: "Favorites",
		settings: "RuleDesk"
	};
	var MY_FAVORITES_CONTAINER_ID = "my-favorites-container";
	var FEED_MENU_ITEM_ID = "rdw-feed-menu";
	var PANEL_UI_CLASS = {
		artistMeta: "rdw-artist-meta",
		artistFilter: "rdw-artist-filter",
		artistList: "rdw-artist-list",
		artistRow: "rdw-artist-row",
		artistLink: "rdw-artist-link",
		artistUndo: "rdw-artist-undo",
		scrollRegion: "rdw-scroll-region",
		settingsGroup: "rdw-settings-group",
		settingsRow: "rdw-settings-row",
		pageCard: "rdw-page-card"
	};
	var UNFOLLOW_UNDO_MS = 5e3;
	var ARTISTS_EMPTY_TITLE = "No followed artists yet";
	var ARTISTS_EMPTY_HINT = "Follow artists with the Follow button next to their name in the tag list.";
	var ARTIST_FILTER_LABEL = "Filter artists";
	var UNFOLLOW_UNDO_LABEL = "Undo";
	var UNFOLLOWED_PREFIX = "Unfollowed ";
	var FEATURE_CHECKBOX_ID_PREFIX = "rdw-feature-";
	var FEATURE_CHOICE_ID_PREFIX = "rdw-feature-choice-";
	var UPDATES_GROUP_SIZE_ID = "rdw-updates-group-size";
	var PLAYLIST_CHUNK_SIZE_ID = "rdw-playlist-chunk-size";
	var ARTIST_FILTER_ID = "rdw-artist-filter";
	var GRID_FAV_CHECKBOX_ID = "rdw-grid-fav-buttons";
	var TWEAKS_SWITCH_ID = "rdw-tweaks-enabled";
	var TAG_GROUPS_PANEL_LABEL = "Collapse tags";
	function featurePanelLabel(featureId, fallback) {
		if (featureId === "tag-groups") return TAG_GROUPS_PANEL_LABEL;
		return fallback;
	}
	function isRdwRoute(value) {
		return RDW_ROUTES.some((route) => route === value);
	}
	function parseRdwHash(hash) {
		const trimmed = hash.trim();
		if (!trimmed.startsWith("#rdw/")) return null;
		const path = trimmed.slice(5).split(/[/?#]/)[0] ?? "";
		if (isRdwRoute(path)) return path;
		return null;
	}
	function buildOwnPageCss() {
		return `
html.${RDW_OWN_PAGE_CLASS} ${HEADER_SELECTOR} ~ *:not(#${RDW_PAGE_ROOT_ID}) {
  display: none !important;
}
#${RDW_PAGE_ROOT_ID} {
  display: block;
  box-sizing: border-box;
  width: 100%;
}
`;
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
	var KIT_ICON_BUTTON_CLASS = "rdw-icon-btn";
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
	var KIT_FOCUS_CSS = `
.rdw-kit-focusable:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
`;
	var n;
	var t$1;
	var u$2;
	var i$1;
	var f$2;
	var o$2;
	var e$1;
	var l$1;
	var c$1;
	var a$2;
	var h$1 = Symbol.for("pv");
	var p$1 = {};
	var y$1 = [];
	var v$2 = /^m(i|n|o|s|text|space)$/;
	var w$1 = Array.isArray;
	var d$1 = y$1.slice;
	var _$1 = Object.assign;
	function g$1(n) {
		n && n.parentNode && n.remove();
	}
	function m$1(r, u, i, f, o) {
		var e = {
			type: r,
			props: u,
			key: i,
			ref: f,
			__k: null,
			__: null,
			__b: 0,
			__e: null,
			__c: null,
			constructor: h$1,
			__v: o || ++t$1,
			__i: -1,
			__u: 0
		};
		return !o && n.vnode && n.vnode(e), e;
	}
	function $(n) {
		return n.children;
	}
	function x(n, t) {
		this.props = n, this.context = t, this.__g = 0;
	}
	function S(n, t) {
		if (null == t) return n.__ && S(n.__, n.__i + 1);
		for (var r; t < n.__k.length; t++) if ((r = n.__k[t]) && r.__e) return r.__e;
		return "function" != typeof n.type || n.props.__P ? null : S(n);
	}
	function C$1(t) {
		var r, u = t.__v, i = u.__e, f = [], o = [], e = t.__P;
		e && ((r = _$1({ constructor: h$1 }, u)).__v = u.__v + 1, n.vnode && n.vnode(r), z$1(e, r, u, t.__n, e.namespaceURI, 32 & u.__u ? [i] : null, f, i || S(u), 32 & u.__u, o), r.__v = u.__v, r.__.__k[r.__i] = r, E$1(f, r, o), u.__ = u.__e = null, r.__e != i && j(r));
	}
	function j(n) {
		if ((n = n.__) && n.__c && !n.props.__P) return n.__e = null, n.__k.some(function(t) {
			return t && (n.__e = t.__e);
		}), j(n);
	}
	function L(t) {
		(8 & t.__g || (t.__g |= 8, u$2.push(t), f$2++)) && i$1 == n.debounceRendering || ((i$1 = n.debounceRendering) || queueMicrotask)(H);
	}
	function H() {
		try {
			for (var n, t = 1; u$2.length;) u$2.length > t && u$2.sort(o$2), n = u$2.shift(), t = u$2.length, 8 & n.__g && C$1(n);
		} finally {
			(f$2 = u$2.length) && (i$1 || queueMicrotask)(H);
		}
	}
	function I(n, t, r, u, i, f, o, e, l, c, a) {
		var s, h, v, w, d, _, g = u.__k || y$1, k = t.length;
		for (l = q(r, t, g, l, k), s = 0; s < k; s++) null != (v = r.__k[s]) && (h = ~v.__i && g[v.__i] || p$1, v.__i = s, _ = z$1(n, v, h, i, f, o, e, l, c, a), w = v.__e, (h.ref != v.ref || 8 & h.__u) && (h.ref && G$1(h.ref, null, v, h), v.ref && a.push(v.ref, v.__c || w, v)), d = d || w, 4 & v.__u ? (l = A$1(v, l, n, !h.__v), h.__e && (h.__e = null)) : "function" == typeof v.type && void 0 !== _ ? l = _ : w && (l = w.nextSibling), v.__u &= -21);
		return r.__e = d, l;
	}
	function q(n, t, r, u, i) {
		var f, o, e, l, c, a, s, p, y, v = r.length, d = v, _ = 0, g = 0, k = n.__k = Array(i);
		for (f = 0; f < i; f++) null != (o = t[f]) && "boolean" != typeof o && "function" != typeof o ? ("object" != typeof o || o.constructor === String ? o = k[f] = m$1(null, o) : w$1(o) ? o = k[f] = m$1($, { children: o }) : o.constructor === h$1 && o.__b ? o = k[f] = m$1(o.type, o.props, o.key, o.ref, o.__v) : k[f] = o, l = f + _, o.__ = n, o.__b = n.__b + 1, e = null, ~(c = o.__i = P$1(o, r, l, d)) && (d--, (e = r[c]) && (e.__u |= 2)), e && e.__v ? (o.__u |= 16, c == l - 1 ? _-- : c == l + 1 ? _++ : c != l && (c > l ? _-- : _++, g = 1)) : (~c || (i > v ? _-- : i < v && _++), "function" != typeof o.type && (o.__u |= 4))) : k[f] = null;
		if (g) {
			for (a = [], s = [], f = 0; f < i; f++) if ((o = k[f]) && 16 & o.__u) {
				for (_ = 0, p = a.length; _ < p;) a[y = _ + p >> 1] < o.__i ? _ = y + 1 : p = y;
				a[_] = o.__i, s[f] = _ + 1;
			}
			for (_ = a.length; f--;) s[f] && (s[f] == _ ? _-- : k[f].__u |= 4);
		}
		if (d) for (f = 0; f < v; f++) !(e = r[f]) || 2 & e.__u || (e.__e == u && (u = S(e)), J(e, e));
		return u;
	}
	function A$1(n, t, r, u) {
		var i, f, o, e;
		if ("function" == typeof n.type) {
			if (n.props.__P) return t;
			if (i = n.__k) for (f = 0; f < i.length; f++) i[f] && (i[f].__ = n, t = A$1(i[f], t, r, !1));
			return t;
		}
		for (t && !t.parentNode && (t = S(n)) && !t.parentNode && (t = null), o = n.__e, e = t; e && 8 == e.nodeType;) e = e.nextSibling;
		for (o != e && (!u && r.moveBefore && o.parentNode ? r.moveBefore(o, t) : r.insertBefore(o, t || null)), t = o; (t = t && t.nextSibling) && 8 == t.nodeType && !t.data.startsWith("$s"););
		return t;
	}
	function P$1(n, t, r, u) {
		var i, f = n.key, o = n.type, e = t[r], l = e && !(2 & e.__u);
		if (null === e && null == f || l && f == e.key && o == e.type) return r;
		if (u > (l ? 1 : 0)) {
			for (i = r - 1; i >= 0; i--) if ((e = t[i]) && !(2 & e.__u) && f == e.key && o == e.type) return i;
			for (i = r + 1; i < t.length; i++) if ((e = t[i]) && !(2 & e.__u) && f == e.key && o == e.type) return i;
		}
		return -1;
	}
	function T$1(n, t, r) {
		r ??= "", "-" == t[0] ? n.setProperty(t, r) : n[t] = r;
	}
	function N(n, t, r, u, i) {
		var f, o;
		if ("style" == t) if ("string" == typeof r) n.style.cssText = r;
		else {
			if ("string" == typeof u && (n.style.cssText = u = ""), u) for (t in u) r && t in r || T$1(n.style, t);
			if (r) for (t in r) u && r[t] == u[t] || T$1(n.style, t, r[t]);
		}
		else if ("o" == t[0] && "n" == t[1]) "function" != typeof r && (r = null), "function" != typeof u && (u = null), (n.__e || (n.__e = {}))[t] = r, r && u || (o = a$2[t] || (a$2[t] = V(t)), (n.__a || (n.__a = {}))[t] = c$1, f = t != (t = t.replace(l$1, "$1")), (t = t.slice(2))[0] < "a" && (t = t.toLowerCase()), r ? n.addEventListener(t, o, f) : n.removeEventListener(t, o, f));
		else {
			if ("http://www.w3.org/2000/svg" == i) t = t.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
			else if ("width" != t && "height" != t && "href" != t && "list" != t && "form" != t && "tabIndex" != t && "download" != t && "rowSpan" != t && "colSpan" != t && "role" != t && "popover" != t && t in n) try {
				n[t] = null == r ? "" : r;
				return;
			} catch (n) {}
			if ("function" == typeof r) return;
			null == r || !1 === r && "-" != t[4] ? n.removeAttribute(t) : n.setAttribute(t, "popover" == t && 1 == r ? "" : r);
		}
	}
	function V(t) {
		return function(r) {
			var u = this.__e;
			if (u) {
				if (u = u[t], null == r[e$1]) r[e$1] = c$1++;
				else if (r[e$1] < this.__a[t]) return;
				return u(n.event ? n.event(r) : r);
			}
		};
	}
	function z$1(t, r, u, i, f, o, e, l, c, a) {
		var s, p, v, d, k, b, m, M, C, j, L, H, q, A, O, P, T, N, V = r.type;
		if (r.constructor !== h$1) return null;
		128 & u.__u && (c = 32 & u.__u, s = u.__c.__z) && (r.__u |= c, p = o = [], 8 == s.nodeType ? l = B$1(s, o) : o.push(s), l = o[0] || l), (s = n.__b) && s(r);
		n: if ("function" == typeof V) {
			v = e.length;
			try {
				if (M = r.props, C = (s = V.prototype) && s.render, j = (s = V.contextType) && i[s.__c], L = s ? j ? j.props.value : s.__ : i, (d = u.__c) ? (r.__c = d, 2 & d.__g && (d.__g |= 1)) : (C ? r.__c = d = new V(M, L) : (r.__c = d = new x(M, L), d.constructor = V, d.render = K), j && j.sub(d), d.state || (d.state = {}), d.__n = i, d.__g |= 8, d.__h = [], d.__k = []), C && (d.__s || (d.__s = d.state), V.getDerivedStateFromProps && (d.__s == d.state && (d.__s = _$1({}, d.__s)), _$1(d.__s, V.getDerivedStateFromProps(M, d.__s)))), k = d.props, b = d.state, d.__v = r, u.__c) {
					if (M !== k && C && !V.getDerivedStateFromProps && d.componentWillReceiveProps && d.componentWillReceiveProps(M, L), r.__v == u.__v && !(8 & d.__g) || !(4 & d.__g) && d.shouldComponentUpdate && !1 === d.shouldComponentUpdate(M, d.__s, L)) {
						r.__v != u.__v && (d.props = M, d.state = d.__s, d.__g &= -9), r.__e = u.__e, r.__k = u.__k, r.__k.some(function(n) {
							n && (n.__ = r);
						}), y$1.push.apply(d.__h, d.__k), d.__k = [], d.__h.length && e.push(d), l = S(u);
						break n;
					}
					d.componentWillUpdate && d.componentWillUpdate(M, d.__s, L), C && d.componentDidUpdate && d.__h.push(function() {
						d.componentDidUpdate(k, b, m);
					});
				} else C && !V.getDerivedStateFromProps && d.componentWillMount && d.componentWillMount(), C && d.componentDidMount && d.__h.push(d.componentDidMount);
				d.context = L, d.props = M, d.__P = t, d.__g &= -5, H = n.__r, q = C ? 25 : 0;
				do
					d.__g &= -9, H && H(r), s = d.render(d.props, d.state = d.__s, d.context);
				while (8 & d.__g && ++q < 25);
				C && (y$1.push.apply(d.__h, d.__k), d.__k = []), d.state = d.__s, d.getChildContext && (i = _$1({}, i, d.getChildContext())), C && u.__c && d.getSnapshotBeforeUpdate && (m = d.getSnapshotBeforeUpdate(k, b)), A = s && s.type === $ && null == s.key ? s.props.children : s, M.__P && (s = l, f = (t = M.__P).namespaceURI, c = o = null, u.props && u.props.__P != t && (u.__k.some(function(n) {
					n && J(n, n);
				}), u.__k = null), l = u.__k ? S(u, 0) : null), l = I(t, w$1(A) ? A : [A], r, u, i, f, o, e, l, c, a), M.__P && (r.__e = null, l = s), r.__u &= -161, p && p.some(g$1), d.__h.length && e.push(d), 1 & d.__g && (d.__g &= -4);
			} catch (t) {
				if (e.length = v, r.__v = null, c || o) if (t && t.then) {
					if (r.__u |= 128 | c, o) {
						for (~(T = o.indexOf(l || void 0)) || (T = o.length); (N = o[T - 1]) && 8 == N.nodeType;) T--;
						for (; T < o.length; T++) if (N = o[T]) if (o[T] = null, O) {
							if (N == P) break;
						} else {
							if (8 != N.nodeType) break;
							N.data.startsWith("$s") && (P = B$1(O = N));
						}
					}
					if (!O) {
						for (; l && 8 == l.nodeType && l.nextSibling;) l = l.nextSibling;
						O = l;
					}
					(s = B$1(O = r.__c.__z || (r.__c.__z = O))) ? (r.__e = O, l = s) : r.__e = l, l = l && l.nextSibling;
				} else o && o.some(g$1);
				else r.__e = u.__e;
				r.__k || (r.__k = u.__k || []), t && t.then || D$1(r), n.__e(t, r, u);
			}
		} else l = r.__e = F(u.__e, r, u, i, f, o, e, c, a, t);
		return (s = n.diffed) && s(r), l;
	}
	function B$1(n, t) {
		if (n && 8 == n.nodeType && n.data.startsWith("$s")) for (var r = 1; n = n.nextSibling;) {
			if (8 == n.nodeType) {
				if (n.data.startsWith("$s")) r++;
				else if (n.data.startsWith("/$s") && !--r) return n;
			}
			t && t.push(n);
		}
	}
	function D$1(n) {
		n && (n.__c && (n.__c.__g |= 4), n.__k && n.__k.some(D$1));
	}
	function E$1(t, r, u) {
		for (var i = 0; i < u.length;) G$1(u[i++], u[i++], u[i++]);
		n.__c && n.__c(r, t), t.some(function(r) {
			try {
				t = r.__h, r.__h = [], t.some(function(n) {
					n.call(r);
				});
			} catch (t) {
				n.__e(t, r.__v);
			}
		});
	}
	function F(t, r, u, i, f, o, e, l, c, a) {
		var s, h, y, _, k, b, m, M, $ = u.props || p$1, x = r.props, C = r.type;
		if ("svg" == C ? f = "http://www.w3.org/2000/svg" : "math" == C ? f = "http://www.w3.org/1998/Math/MathML" : f || (f = "http://www.w3.org/1999/xhtml"), o) {
			for (s = 0; s < o.length; s++) if ((k = o[s]) && (C ? k.localName == C : 3 == k.nodeType)) {
				t = k, o[s] = null;
				break;
			}
		}
		if (!t) {
			if (M = a.ownerDocument || document, !C) return M.createTextNode(x);
			t = M.createElementNS(f, C, x.is ? x : a), l && (n.__m && n.__m(r, o), l = !1), o = null;
		}
		if (C) {
			if (a = "template" == C && t.content || t, o = "textarea" == C && null != x.defaultValue ? null : o && d$1.call(a.childNodes), !l && o) for ($ = {}, s = 0; s < t.attributes.length; s++) $[(k = t.attributes[s]).name] = k.value;
			for (s in $) k = $[s], "dangerouslySetInnerHTML" == s ? y = k : "children" == s || s in x || "value" == s && "defaultValue" in x || "checked" == s && "defaultChecked" in x || N(t, s, null, k, f);
			for (s in x) k = x[s], "children" == s ? _ = k : "dangerouslySetInnerHTML" == s ? h = k : "value" == s ? b = k : "checked" == s ? m = k : l && "function" != typeof k || $[s] === k || N(t, s, k, $[s], f);
			h ? (l || y && (h.__html == y.__html || h.__html == t.innerHTML) || (t.innerHTML = h.__html), r.__k = []) : (y && (t.textContent = ""), ("foreignObject" == C || "http://www.w3.org/1998/Math/MathML" == f && v$2.test(C)) && (f = "http://www.w3.org/1999/xhtml"), I(a, w$1(_) ? _ : [_], r, u, i, f, o, e, o ? o[0] : u.__k && S(u, 0), l, c), o && o.some(g$1)), l && "textarea" != C || (s = "value", "progress" == C && null == b ? t.removeAttribute(s) : null == b || b === t[s] && ("progress" != C || b) || N(t, s, b, $[s], f), s = "checked", null != m && m != t[s] && N(t, s, m, $[s], f));
		} else $ === x || l && t.data == x || (t.data = x);
		return t;
	}
	function G$1(t, r, u, i) {
		try {
			"function" == typeof t ? r ? r.__x = t(r) || 1 : i && (i = i.__c || i.__e) && (r = i.__x) && (i.__x = null, "function" == typeof r ? r() : t(null)) : t.current = r;
		} catch (t) {
			n.__e(t, u);
		}
	}
	function J(t, r, u) {
		var i, f, o, e;
		if (n.unmount && n.unmount(t), !(i = t.ref) || i.current && i.current != t.__e || G$1(i, null, r, t), i = t.__c) {
			if (i.componentWillUnmount) try {
				i.componentWillUnmount();
			} catch (t) {
				n.__e(t, r);
			}
			i.__P = i.__n = null;
		}
		if (i = t.__k) for (e = 0; e < i.length; e++) i[e] && J(i[e], r, "function" != typeof t.type || u && !t.props.__P);
		!u && (i = t.__c) && (i = i.__z) && (f = B$1(i, o = [])) && (i == t.__e && o.some(g$1), g$1(f), g$1(i)), u || g$1(t.__e), t.__e = t.__c = t.__ = null;
	}
	function K(n, t, r) {
		return this.constructor(n, r);
	}
	function Q(t, r) {
		var u, i, f, o;
		n.__ && n.__(t, r), 9 == r.nodeType && (r = r.documentElement), i = (u = t && 32 & t.__u) ? null : r.__k, r.__k = m$1($, { children: [t] }), f = [], o = [], z$1(r, r.__k, i || p$1, p$1, r.namespaceURI, i ? null : r.firstChild ? d$1.call(r.childNodes) : null, f, i ? i.__e : r.firstChild, u, o), E$1(f, r.__k, o), r.__k.props.children = null;
	}
	n = { __e: function(n, t, r, u) {
		for (var i, o, e; t = t.__;) if ((i = t.__c) && !(1 & i.__g)) {
			i.__g |= 4;
			try {
				if ((e = (o = i.constructor) && o.getDerivedStateFromError) && i.setState(o.getDerivedStateFromError(n)), i.componentDidCatch && (i.componentDidCatch(n, u || {}), e = 1), e && 8 & i.__g) return void (i.__g |= 2);
			} catch (t) {
				n = t;
			}
		}
		throw f$2 = 0, n;
	} }, t$1 = 0, x.prototype.setState = function(n, t) {
		var r = this.__s;
		r && r != this.state || (r = this.__s = _$1({}, this.state)), "function" == typeof n && (n = n(_$1({}, r), this.props)), n && (_$1(r, n), this.__v && (t && this.__k.push(t), L(this)));
	}, x.prototype.forceUpdate = function(n) {
		this.__v && (this.__g |= 4, n && this.__h.push(n), L(this));
	}, x.prototype.render = $, u$2 = [], f$2 = 0, o$2 = function(n, t) {
		return n.__v.__b - t.__v.__b;
	}, e$1 = Symbol(), l$1 = /(PointerCapture)$|Capture$/i, c$1 = 0, a$2 = {};
	var f$1 = Symbol.for("pv");
	var o$1 = 0;
	Array.isArray;
	function a$1(t, e, n$1, u, a, i) {
		e || (e = {});
		var c, l, p = e;
		if ("ref" in p && "function" != typeof t) for (l in p = {}, e) "ref" == l ? c = e[l] : p[l] = e[l];
		var s = {
			type: t,
			props: p,
			key: n$1,
			ref: c,
			__k: null,
			__: null,
			__b: 0,
			__e: null,
			__c: null,
			constructor: f$1,
			__v: --o$1,
			__i: -1,
			__u: 0
		};
		return (a || i) && (s.__source = a, s.__self = i), n.vnode && n.vnode(s), s;
	}
	var ICON_BUTTON_CSS = `
${KIT_FOCUS_CSS}
.rdw-icon-btn {
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  min-width: 28px;
  min-height: 28px;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: var(--rdw-radius-m);
  border: 1px solid var(--rdw-border);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  cursor: pointer;
}
.rdw-icon-btn[aria-pressed="true"] {
  background: var(--rdw-accent-soft);
  border-color: var(--rdw-accent);
  color: var(--rdw-accent);
}
.rdw-icon-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
`;
	function IconButton(props) {
		const className = [
			"rdw-icon-btn",
			"rdw-kit-focusable",
			props.className
		].filter((part) => part !== void 0 && part.length > 0).join(" ");
		return a$1($, { children: [a$1("style", { children: ICON_BUTTON_CSS }), a$1("button", {
			type: "button",
			className,
			"aria-label": props.label,
			"aria-pressed": props.pressed,
			disabled: props.disabled,
			onClick: props.onClick,
			children: props.children
		})] });
	}
	var CARD_CSS$1 = `
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
	var DOCUMENT_OVERLAY_CSS = `
${ICON_BUTTON_CSS}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending} {
  opacity: 0;
}

.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav},
.${CSS_CLASS.cardFav}:focus-visible {
  opacity: 0.65;
}

.${CSS_CLASS.thumb} .${CSS_CLASS.cardFav}:hover,
.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked},
.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError},
.${CSS_CLASS.thumb}:hover .${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending},
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked}:focus-visible,
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavError}:focus-visible,
.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavPending}:focus-visible {
  opacity: 1;
}

.${CSS_CLASS.cardFav}.rdw-icon-btn {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.93);
  border: 1px solid rgba(0, 0, 0, 0.13);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  color: #1c2228;
  font-size: 13px;
}

.${CSS_CLASS.cardFav}.${CSS_CLASS.cardFavMarked}.rdw-icon-btn {
  background: #ffd75e;
  border-color: #c79a00;
  color: #5c4500;
}

.${CSS_CLASS.updatesBar} {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.${CSS_CLASS.updatesBarActions} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.hint} {
  margin: 0;
  font-weight: 700;
  font-size: 12px;
  color: #1c2228;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.primaryButton} {
  margin-left: auto;
  background: #2f6fed;
  border: 1px solid #2f6fed;
  border-radius: 8px;
  height: 28px;
  min-height: 28px;
  padding: 0 12px;
  font-weight: 600;
  font-size: 12px;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.secondaryButton} {
  box-sizing: border-box;
  display: inline-grid;
  place-items: center;
  border: 1px solid #cfd6dd;
  background: #fff;
  color: #1c2228;
  border-radius: 8px;
  height: 28px;
  min-height: 28px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 400;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
}

.${CSS_CLASS.updatesBar} .${CSS_CLASS.secondaryButton}:focus-visible,
.${CSS_CLASS.updatesBar} .${CSS_CLASS.primaryButton}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}
`;
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
		style.textContent = `${BASE_GRID_CSS}\n${CARD_CSS$1}\n${DOCUMENT_OVERLAY_CSS}`;
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
		button.classList.add(KIT_ICON_BUTTON_CLASS);
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
	var TEXT_NEW_SUFFIX = " new";
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
			link.className = CSS_CLASS.secondaryButton;
			link.href = buildUpdatesSearchUrl(stripUpdatesIdFilter(tagsParam));
			link.textContent = TEXT_SHOW_ALL;
			return link;
		}
		if (seenPostId === 0) return null;
		const onlyNewQuery = `${stripUpdatesIdFilter(tagsParam)} ${UPDATES_ID_PREFIX}${String(seenPostId)}`;
		const link = document.createElement("a");
		link.className = CSS_CLASS.secondaryButton;
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
		showAll.className = CSS_CLASS.secondaryButton;
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
		summary.textContent = `${String(newCount)}${TEXT_NEW_SUFFIX}`;
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
		reloadFromStorage();
		const artistTags = listArtistTags();
		const isFull = isFullUpdatesQuery(tagsParam, artistTags);
		const isPartial = isPartialUpdatesQuery(tagsParam, artistTags);
		if (!isFull && !isPartial) {
			removeExistingBar$1(root);
			return;
		}
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
	var CONTENT_ID$2 = "content";
	var POSTS_LINK_TEXT = "Posts";
	var FEED_LINK_TEXT = "Feed";
	var CURRENT_PAGE_CLASS = "current-page";
	var NO_ARTISTS_TITLE = "Follow artists to build your feed";
	var MISSING_POSTS_WARN = "feed: Posts menu item not found";
	var NEW_PLAQUE_LEFT_PX = 6;
	var NEW_PLAQUE_TOP_PX = 6;
	var NEW_PLAQUE_ACCENT = "#2f6fed";
	var EVENT_PAGESHOW$1 = "pageshow";
	var EVENT_CLICK$2 = "click";
	var BODY_CLASS$2 = featureBodyClass(FEATURE_ID$8);
	var FEATURE_CSS$7 = `
body.${BODY_CLASS$2} span.thumb.new.${THUMB_CLASS} {
  position: relative;
}
body.${BODY_CLASS$2} span.thumb.new.${THUMB_CLASS}::after {
  content: "NEW";
  position: absolute;
  z-index: 4;
  left: ${String(NEW_PLAQUE_LEFT_PX)}px;
  top: ${String(NEW_PLAQUE_TOP_PX)}px;
  background: ${NEW_PLAQUE_ACCENT};
  color: #fff;
  font: 700 9.5px system-ui, Segoe UI, sans-serif;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 9px;
  pointer-events: none;
}
@supports (anchor-name: --a) {
  body.${BODY_CLASS$2} span.thumb.new.${THUMB_CLASS}::after {
    position-anchor: ${THUMB_ANCHOR_NAME};
    left: calc(anchor(left) + ${String(NEW_PLAQUE_LEFT_PX)}px);
    top: calc(anchor(top) + ${String(NEW_PLAQUE_TOP_PX)}px);
  }
}
`;
	var unsubscribeThumbsAdded$2;
	var pageshowBound$1 = false;
	var boundFeedLink = null;
	function findPostsMenuItem$1() {
		const content = document.getElementById(CONTENT_ID$2);
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
	function resolveFeedHref() {
		const artistTags = listArtistTags();
		if (artistTags.length === 0) return RDW_HASH_FOLLOWING;
		return buildFeedUrl(artistTags, getUpdatesGroupSize());
	}
	function findFeedLink() {
		const feedItem = document.getElementById(FEED_MENU_ITEM_ID);
		if (!(feedItem instanceof HTMLLIElement)) return null;
		const feedLink = feedItem.querySelector("a");
		return feedLink instanceof HTMLAnchorElement ? feedLink : null;
	}
	function refreshFeedHref() {
		reloadFromStorage();
		const feedLink = findFeedLink();
		if (feedLink === null) return;
		feedLink.href = resolveFeedHref();
		if (listArtistTags().length === 0) feedLink.title = NO_ARTISTS_TITLE;
		else feedLink.removeAttribute("title");
	}
	function onPageShow$1() {
		refreshFeedHref();
	}
	function onFeedClick() {
		refreshFeedHref();
	}
	function ensureFeedHrefListeners(feedLink) {
		if (!pageshowBound$1) {
			pageshowBound$1 = true;
			window.addEventListener(EVENT_PAGESHOW$1, onPageShow$1);
		}
		if (boundFeedLink === feedLink) return;
		if (boundFeedLink !== null) boundFeedLink.removeEventListener(EVENT_CLICK$2, onFeedClick);
		feedLink.addEventListener(EVENT_CLICK$2, onFeedClick);
		boundFeedLink = feedLink;
	}
	function ensureFeedMenuItem() {
		const existing = document.getElementById(FEED_MENU_ITEM_ID);
		if (existing instanceof HTMLLIElement) {
			const existingLink = existing.querySelector("a");
			if (existingLink instanceof HTMLAnchorElement) {
				refreshFeedHref();
				ensureFeedHrefListeners(existingLink);
			}
			return existing;
		}
		const postsItem = findPostsMenuItem$1();
		if (postsItem === null) {
			log.warn(MISSING_POSTS_WARN);
			return null;
		}
		reloadFromStorage();
		const feedItem = document.createElement("li");
		feedItem.id = FEED_MENU_ITEM_ID;
		const feedLink = document.createElement("a");
		feedLink.textContent = FEED_LINK_TEXT;
		feedLink.href = resolveFeedHref();
		if (listArtistTags().length === 0) feedLink.title = NO_ARTISTS_TITLE;
		feedItem.append(feedLink);
		postsItem.after(feedItem);
		ensureFeedHrefListeners(feedLink);
		return feedItem;
	}
	function isFeedPage(search, artistTags) {
		const tagsParam = new URLSearchParams(search).get(SEARCH_PARAM_TAGS);
		if (tagsParam === null || tagsParam.trim().length === 0) return false;
		return isFullUpdatesQuery(tagsParam, artistTags) || isPartialUpdatesQuery(tagsParam, artistTags);
	}
	function applyCurrentPageHighlight(feedItem, onFeed, pageKind) {
		const postsItem = findPostsMenuItem$1();
		if (onFeed) {
			postsItem?.classList.remove(CURRENT_PAGE_CLASS);
			feedItem.classList.add(CURRENT_PAGE_CLASS);
			return;
		}
		feedItem.classList.remove(CURRENT_PAGE_CLASS);
		if (pageKind === "list") postsItem?.classList.add(CURRENT_PAGE_CLASS);
	}
	function markNewThumbs(root, seenPostId) {
		if (seenPostId === 0) return;
		ensureDocumentStyles();
		const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
		for (const thumb of thumbs) {
			if (!(thumb instanceof HTMLElement)) continue;
			const postId = extractPostIdFromThumb(thumb);
			if (postId === null) continue;
			const numeric = Number(postId);
			if (!Number.isFinite(numeric) || numeric <= seenPostId) continue;
			ensureThumbAnchor(thumb);
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
		reloadFromStorage();
		const artistTags = listArtistTags();
		const onFeed = isFeedPage(ctx.search, artistTags);
		applyCurrentPageHighlight(feedItem, onFeed, ctx.pageKind);
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
	var MASONRY_LIST_SCOPE = "#post-list";
	var MASONRY_COLUMN_WIDTH_PX = 240;
	var MASONRY_COLUMN_GAP_PX = 4;
	var MASONRY_LIST_WIDTH_PERCENT = 100;
	var MASONRY_THUMB_WIDTH_PERCENT = 100;
	var MASONRY_THUMB_MARGIN_TOP_PX = 0;
	var MASONRY_THUMB_MARGIN_INLINE_PX = 0;
	var MASONRY_THUMB_MARGIN_BOTTOM_PX = 4;
	var MASONRY_PREVIEW_WIDTH_PERCENT = 100;
	var MASONRY_BORDER_RADIUS_PX = 4;
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
		const scope = `body.${featureChoiceBodyClass(FEATURE_ID$7, MASONRY_VALUE)} ${MASONRY_LIST_SCOPE}`;
		const thumbMargin = `${MASONRY_THUMB_MARGIN_TOP_PX}px ${MASONRY_THUMB_MARGIN_INLINE_PX}px ${MASONRY_THUMB_MARGIN_BOTTOM_PX}px`;
		return [
			`${scope} div.image-list {`,
			`  display: block !important;`,
			`  width: ${MASONRY_LIST_WIDTH_PERCENT}% !important;`,
			`  column-width: ${MASONRY_COLUMN_WIDTH_PX}px !important;`,
			`  column-gap: ${MASONRY_COLUMN_GAP_PX}px !important;`,
			`}`,
			`${scope} span.thumb {`,
			`  display: block !important;`,
			`  width: ${MASONRY_THUMB_WIDTH_PERCENT}% !important;`,
			`  height: auto !important;`,
			`  margin: ${thumbMargin} !important;`,
			`  break-inside: avoid !important;`,
			`}`,
			`${scope} span.thumb > a {`,
			`  display: block !important;`,
			`  width: ${MASONRY_THUMB_WIDTH_PERCENT}% !important;`,
			`  height: auto !important;`,
			`}`,
			`${scope} span.thumb img.preview {`,
			`  display: block !important;`,
			`  width: ${MASONRY_PREVIEW_WIDTH_PERCENT}% !important;`,
			`  height: auto !important;`,
			`  max-width: none !important;`,
			`  max-height: none !important;`,
			`  margin: 0 !important;`,
			`  border-radius: ${MASONRY_BORDER_RADIUS_PX}px !important;`,
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
	var THUMB_SELECTOR$1 = SITE_SELECTORS.thumb;
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
		return Array.from(imageList.querySelectorAll(THUMB_SELECTOR$1));
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
	var CONTENT_ID$1 = "content";
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
		"TOS",
		"My Favorites"
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
		const content = document.getElementById(CONTENT_ID$1);
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
	var FEATURE_LABEL$4 = "Collection header";
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
	var FEATURE_LABEL$3 = "Add to collection button";
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
	var TEXT_NEW_PLAYLIST = "New collection…";
	var TEXT_CREATE = "Create";
	var TEXT_CHECK_MARK = "✓";
	var LABEL_ADD = "Add to collection";
	var LABEL_TOGGLE_PREFIX = "Toggle collection";
	var LABEL_NEW_NAME = "New collection name";
	var MENU_Z_INDEX = 2147483645;
	var MENU_MIN_WIDTH_PX = 180;
	var MENU_MAX_HEIGHT_PX = 280;
	var MENU_GAP_PX = 4;
	var BUTTON_SIZE_PX = 28;
	var BUTTON_OFFSET_PX = 6;
	var BUTTON_BELOW_FAV_TOP_PX = 38;
	var FOCUS_OUTLINE$1 = "2px solid #4c8bf5";
	var FOCUS_OUTLINE_OFFSET$1 = "2px";
	var EVENT_KEYDOWN = "keydown";
	var EVENT_POINTERDOWN = "pointerdown";
	var KEY_ESCAPE$1 = "Escape";
	var KEY_ENTER$2 = "Enter";
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
  display: inline-grid;
  place-items: center;
  min-width: ${String(BUTTON_SIZE_PX)}px;
  min-height: ${String(BUTTON_SIZE_PX)}px;
  width: ${String(BUTTON_SIZE_PX)}px;
  height: ${String(BUTTON_SIZE_PX)}px;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, 0.13);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.93);
  color: #1c2228;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  opacity: 0;
}
${BODY_SELECTOR$1} .${THUMB_CLASS}:hover .${CLASS_ADD},
${BODY_SELECTOR$1} .${CLASS_ADD}:focus-visible {
  opacity: 0.65;
}
${BODY_SELECTOR$1} .${THUMB_CLASS} .${CLASS_ADD}:hover,
${BODY_SELECTOR$1} .${CLASS_ADD}:focus-visible {
  opacity: 1;
}
${BODY_SELECTOR$1} .${CLASS_ADD}:focus-visible {
  outline: ${FOCUS_OUTLINE$1};
  outline-offset: ${FOCUS_OUTLINE_OFFSET$1};
}
${BODY_SELECTOR$1} .${CLASS_ADD}.${CLASS_ADD_IN} {
  background: #ffd75e;
  border-color: #c79a00;
  color: #5c4500;
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
		if (event.key !== KEY_ESCAPE$1) return;
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
			document.addEventListener(EVENT_KEYDOWN, onDocumentKeydown);
		}
		if (!pointerBound) {
			pointerBound = true;
			document.addEventListener(EVENT_POINTERDOWN, onDocumentPointerDown, true);
		}
	}
	function unbindGlobalCloseListeners() {
		if (escapeBound) {
			document.removeEventListener(EVENT_KEYDOWN, onDocumentKeydown);
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
			if (event.key !== KEY_ENTER$2) return;
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
		button.className = `${KIT_ICON_BUTTON_CLASS} ${CLASS_ADD}`;
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
	var t;
	var r;
	var u;
	var i;
	var o = Object.is;
	var f = 0;
	var c = [];
	var e = [];
	var a = n;
	var v$1 = a.__b;
	var l = a.__r;
	var m = a.diffed;
	var h = a.__c;
	var s = a.unmount;
	var p = a.__;
	function y(n, t) {
		a.__h && a.__h(r, n, f || t), f = 0;
		var u = r.__H || (r.__H = {
			__: [],
			__h: []
		});
		return n >= u.__.length && u.__.push({}), u.__[n];
	}
	function d(n) {
		return f = 1, _(G, n);
	}
	function _(n, u, i) {
		var f = y(t++, 2);
		if (f.t = n, !f.__c && (f.__ = [i ? i(u) : G(void 0, u), function(n) {
			var t = (f.__N || f.__)[0], r = f.t(t, n);
			o(t, r) || (f.__N = [r, f.__[1]], f.__c.setState({}));
		}], f.__c = r, !r.__f)) {
			r.__f = !0;
			var c = r.shouldComponentUpdate;
			r.shouldComponentUpdate = function(n, t, r) {
				var u = this.__H;
				if (!u) return !0;
				var i = !1, f = this.props != n;
				if (u.__.some(function(n) {
					n.__N && (i = !0, o(n.__[0], n.__N[0]) || (f = !0));
				}), c) {
					var e = c.call(this, n, t, r);
					return i ? e || f : e;
				}
				return !i || f;
			};
		}
		return f.__;
	}
	function A(n, u) {
		var i = y(t++, 3);
		!a.__s && E(i.__H, u) && (i.__P = !0, i.__ = n, i.u = u, r.__H.__h.push(i));
	}
	function T(n) {
		return f = 5, w(function() {
			return { current: n };
		}, []);
	}
	function w(n, r) {
		var u = y(t++, 7);
		return E(u.__H, r) && (u.__ = n(), u.__H = r), u.__;
	}
	function b(n, t) {
		return f = 8, w(function() {
			return n;
		}, t);
	}
	function P() {
		var n = y(t++, 11);
		if (!n.__) {
			for (var u = r.__v; !u.__m && u.__;) u = u.__;
			var i = u.__m || (u.__m = [0, 0]);
			n.__ = "P" + i[0] + "-" + i[1]++;
		}
		return n.__;
	}
	function g() {
		var n;
		do {
			for (; n = e.shift();) try {
				C(n);
			} catch (t) {
				a.__e(t, { __: (n = n.__P) && n.__v });
			}
			for (; n = c.shift();) {
				var t = n.__H;
				if (n.__P && t) try {
					t.__h.some(C), t.__h.some(D), t.__h = [];
				} catch (r) {
					t.__h = [], a.__e(r, n.__v);
				}
			}
		} while (e.length);
	}
	a.__b = function(n) {
		r = null, v$1 && v$1(n);
	}, a.__ = function(n, t) {
		n && t.__k && t.__k.__m && (n.__m = t.__k.__m), p && p(n, t);
	}, a.__r = function(n) {
		l && l(n), t = 0;
		var i = (r = n.__c).__H;
		i && (u == r ? r.__h = [] : (i.__h.some(C), i.__h.some(D), t = 0), i.__h = [], i.__.some(function(n) {
			n.__N && (n.__ = n.__N), n.u = n.__N = void 0;
		})), u = r;
	}, a.diffed = function(n) {
		m && m(n);
		var t = n.__c;
		t && t.__H && (t.__H.__h.length && B(c.push(t)), t.__H.__.some(function(n) {
			n.u && (n.__H = n.u);
		})), u = r = null;
	}, a.__c = function(n, t) {
		t.some(function(n) {
			try {
				n.__h.some(C), n.__h = n.__h.filter(function(n) {
					return !n.__ || D(n);
				});
			} catch (t) {
				n.__h = [function() {
					throw t;
				}];
			}
		}), h && h(n, t);
	}, a.unmount = function(n) {
		s && s(n);
		var t, r, u = n.__c;
		u && u.__H && (u.__H.__.some(function(u) {
			try {
				if (u.__P && u.__c) {
					if (void 0 === r) {
						for (r = n.__; r && (!r.__c || !r.__c.__P);) r = r.__;
						r = r && r.__c;
					}
					u.__P = r, B(e.push(u));
				} else C(u);
			} catch (n) {
				t = n;
			}
		}), u.__H = void 0, t && a.__e(t, u.__v));
	};
	var k = "function" == typeof requestAnimationFrame;
	function z(n) {
		var t, r = function() {
			clearTimeout(u), k && cancelAnimationFrame(t), setTimeout(n);
		}, u = setTimeout(r, 35);
		k && (t = requestAnimationFrame(r));
	}
	function B(n) {
		1 != n && i == a.requestAnimationFrame || ((i = a.requestAnimationFrame) || z)(g);
	}
	function C(n) {
		var t = r, u = n.__c;
		"function" == typeof u && (n.__c = void 0, u()), r = t;
	}
	function D(n) {
		var t = r;
		n.__c = n.__(), r = t;
	}
	function E(n, t) {
		return !n || n.length != t.length || t.some(function(t, r) {
			return !o(t, n[r]);
		});
	}
	function G(n, t) {
		return "function" == typeof t ? t(n) : t;
	}
	var KEY_ARROW_DOWN = "ArrowDown";
	var KEY_ARROW_UP = "ArrowUp";
	var KEY_ENTER$1 = "Enter";
	var KEY_ESCAPE = "Escape";
	var NO_ACTIVE_INDEX = -1;
	var AUTOCOMPLETE_FIELD_CSS = `
${KIT_FOCUS_CSS}
.rdw-ac {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.rdw-ac__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-ac__input {
  box-sizing: border-box;
  min-height: 28px;
  height: 28px;
  width: 100%;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  font-size: 12px;
}
.rdw-ac__input::placeholder {
  color: var(--rdw-muted);
}
.rdw-ac__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.rdw-ac__list {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  box-shadow: var(--rdw-shadow-2);
  max-height: 220px;
  overflow: auto;
}
.rdw-ac__option {
  min-height: 28px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-radius: var(--rdw-radius-s);
  font-size: 12px;
  color: var(--rdw-text);
  cursor: pointer;
}
.rdw-ac__option[aria-selected="true"],
.rdw-ac__option:hover {
  background: var(--rdw-surface-2);
}
`;
	function AutocompleteField(props) {
		const autoId = P();
		const listId = P();
		const inputId = props.id ?? autoId;
		const rootRef = T(null);
		const [open, setOpen] = d(false);
		const [activeIndex, setActiveIndex] = d(NO_ACTIVE_INDEX);
		const suggestions = props.suggestions;
		const hasSuggestions = suggestions.length > 0;
		const listOpen = open && hasSuggestions && props.disabled !== true;
		A(() => {
			setActiveIndex(NO_ACTIVE_INDEX);
			if (hasSuggestions) setOpen(true);
			else setOpen(false);
		}, [suggestions, hasSuggestions]);
		A(() => {
			if (!listOpen) return;
			const onPointerDown = (event) => {
				const root = rootRef.current;
				if (root === null) return;
				if (!event.composedPath().includes(root)) {
					setOpen(false);
					setActiveIndex(NO_ACTIVE_INDEX);
				}
			};
			document.addEventListener("mousedown", onPointerDown);
			return () => {
				document.removeEventListener("mousedown", onPointerDown);
			};
		}, [listOpen]);
		const selectOption = (option) => {
			props.onChange(option.value);
			props.onSelect?.(option);
			setOpen(false);
			setActiveIndex(NO_ACTIVE_INDEX);
		};
		const className = ["rdw-ac", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
		const activeOption = activeIndex >= 0 && activeIndex < suggestions.length ? suggestions[activeIndex] : void 0;
		return a$1($, { children: [a$1("style", { children: AUTOCOMPLETE_FIELD_CSS }), a$1("div", {
			className,
			ref: rootRef,
			children: [
				props.label !== void 0 ? a$1("label", {
					className: "rdw-ac__label",
					htmlFor: inputId,
					children: props.label
				}) : null,
				a$1("input", {
					id: inputId,
					className: "rdw-ac__input rdw-kit-focusable",
					type: "text",
					role: "combobox",
					"aria-autocomplete": "list",
					"aria-expanded": listOpen,
					"aria-controls": listId,
					"aria-activedescendant": activeOption !== void 0 ? `${listId}-opt-${String(activeIndex)}` : void 0,
					value: props.value,
					placeholder: props.placeholder,
					disabled: props.disabled,
					"aria-label": props["aria-label"] ?? props.label,
					autoComplete: "off",
					onInput: (event) => {
						props.onChange(event.currentTarget.value);
					},
					onFocus: () => {
						if (hasSuggestions) setOpen(true);
					},
					onKeyDown: (event) => {
						if (event.key === KEY_ESCAPE) {
							if (listOpen) {
								event.preventDefault();
								setOpen(false);
								setActiveIndex(NO_ACTIVE_INDEX);
							}
							return;
						}
						if (event.key === KEY_ARROW_DOWN) {
							if (!hasSuggestions) return;
							event.preventDefault();
							setOpen(true);
							setActiveIndex((current) => {
								if (current < 0) return 0;
								return Math.min(current + 1, suggestions.length - 1);
							});
							return;
						}
						if (event.key === KEY_ARROW_UP) {
							if (!listOpen) return;
							event.preventDefault();
							setActiveIndex((current) => {
								if (current <= 0) return NO_ACTIVE_INDEX;
								return current - 1;
							});
							return;
						}
						if (event.key === KEY_ENTER$1) {
							if (listOpen && activeOption !== void 0) {
								event.preventDefault();
								selectOption(activeOption);
							}
						}
					}
				}),
				listOpen ? a$1("ul", {
					className: "rdw-ac__list",
					role: "listbox",
					id: listId,
					tabIndex: -1,
					children: suggestions.map((option, index) => a$1("li", {
						id: `${listId}-opt-${String(index)}`,
						role: "option",
						className: "rdw-ac__option rdw-kit-focusable",
						"aria-selected": index === activeIndex,
						onMouseDown: (event) => {
							event.preventDefault();
						},
						onClick: () => {
							selectOption(option);
						},
						children: option.label
					}, `${option.value}:${option.type ?? ""}:${option.label}`))
				}) : null
			]
		})] });
	}
	var BUTTON_CSS = `
${KIT_FOCUS_CSS}
.rdw-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
  min-height: 28px;
  border-radius: var(--rdw-radius-m);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  padding: 0 12px;
  color: var(--rdw-text);
  background: var(--rdw-surface);
}
.rdw-btn--s {
  min-height: 28px;
  padding: 0 10px;
  font-size: 12px;
}
.rdw-btn--m {
  min-height: 28px;
  padding: 0 12px;
}
.rdw-btn--primary {
  background: var(--rdw-accent);
  border-color: var(--rdw-accent);
  color: var(--rdw-surface);
}
.rdw-btn--secondary {
  background: var(--rdw-surface);
  border-color: var(--rdw-border);
  color: var(--rdw-text);
}
.rdw-btn--ghost {
  background: transparent;
  border-color: transparent;
  color: var(--rdw-accent);
}
.rdw-btn--danger {
  background: var(--rdw-danger);
  border-color: var(--rdw-danger);
  color: var(--rdw-surface);
}
.rdw-btn:disabled,
.rdw-btn[aria-busy="true"] {
  opacity: 0.55;
  cursor: not-allowed;
}
.rdw-btn__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: rdw-btn-spin 0.7s linear infinite;
}
@keyframes rdw-btn-spin {
  to { transform: rotate(360deg); }
}
`;
	function Button(props) {
		const variant = props.variant ?? "secondary";
		const size = props.size ?? "m";
		const loading = props.loading === true;
		const disabled = props.disabled === true || loading;
		const className = [
			"rdw-btn",
			"rdw-kit-focusable",
			`rdw-btn--${variant}`,
			`rdw-btn--${size}`,
			props.className
		].filter((part) => part !== void 0 && part.length > 0).join(" ");
		return a$1($, { children: [a$1("style", { children: BUTTON_CSS }), a$1("button", {
			type: props.type ?? "button",
			className,
			disabled,
			"aria-busy": loading ? true : void 0,
			"aria-label": props["aria-label"],
			onClick: props.onClick,
			children: [loading ? a$1("span", {
				className: "rdw-btn__spinner",
				"aria-hidden": "true"
			}) : null, props.children]
		})] });
	}
	var CARD_CSS = `
.rdw-card {
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-l);
  box-shadow: var(--rdw-shadow-1);
}
`;
	function Card(props) {
		const Tag = props.as ?? "div";
		const className = ["rdw-card", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
		return a$1($, { children: [a$1("style", { children: CARD_CSS }), a$1(Tag, {
			className,
			children: props.children
		})] });
	}
	var DEFAULT_SIZE = 16;
	function baseProps(size, className, title) {
		const props = {
			width: size,
			height: size,
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			"stroke-width": 2,
			"stroke-linecap": "round",
			"stroke-linejoin": "round",
			"aria-hidden": title === void 0 ? true : void 0,
			role: title === void 0 ? void 0 : "img"
		};
		if (className !== void 0) props.className = className;
		if (title !== void 0) props["aria-label"] = title;
		return props;
	}
	function IconX(props) {
		return a$1("svg", {
			...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
			children: [
				props.title !== void 0 ? a$1("title", { children: props.title }) : null,
				a$1("line", {
					x1: "18",
					y1: "6",
					x2: "6",
					y2: "18"
				}),
				a$1("line", {
					x1: "6",
					y1: "6",
					x2: "18",
					y2: "18"
				})
			]
		});
	}
	function IconChevronDown(props) {
		return a$1("svg", {
			...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
			children: [props.title !== void 0 ? a$1("title", { children: props.title }) : null, a$1("polyline", { points: "6 9 12 15 18 9" })]
		});
	}
	function IconTrash(props) {
		return a$1("svg", {
			...baseProps(props.size ?? DEFAULT_SIZE, props.className, props.title),
			children: [
				props.title !== void 0 ? a$1("title", { children: props.title }) : null,
				a$1("polyline", { points: "3 6 5 6 21 6" }),
				a$1("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
			]
		});
	}
	var CHIP_CSS = `
${KIT_FOCUS_CSS}
.rdw-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 24px;
  height: 24px;
  padding: 0 4px 0 8px;
  border-radius: 12px;
  background: var(--rdw-surface-2);
  border: 1px solid var(--rdw-border);
  font-size: 12px;
  color: var(--rdw-text);
  max-width: 100%;
  white-space: nowrap;
}
.rdw-chip__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--rdw-muted);
  flex: none;
}
.rdw-chip--artist .rdw-chip__dot { background: var(--rdw-tag-artist); }
.rdw-chip--character .rdw-chip__dot { background: var(--rdw-tag-character); }
.rdw-chip--copyright .rdw-chip__dot { background: var(--rdw-tag-copyright); }
.rdw-chip--metadata .rdw-chip__dot { background: var(--rdw-tag-metadata); }
.rdw-chip--exclude {
  background: var(--rdw-danger-soft);
  border-color: var(--rdw-danger);
  color: var(--rdw-danger);
  text-decoration: line-through;
}
.rdw-chip--group {
  background: var(--rdw-accent-soft);
  border-color: var(--rdw-accent);
  color: var(--rdw-accent);
  font-weight: 600;
}
.rdw-chip__remove {
  box-sizing: border-box;
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  margin: -2px -2px -2px 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--rdw-muted);
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
}
.rdw-chip__remove:hover {
  background: var(--rdw-surface);
}
`;
	function Chip(props) {
		const variant = props.variant ?? "dot";
		const kind = props.kind ?? "default";
		const className = [
			"rdw-chip",
			`rdw-chip--${variant}`,
			kind !== "default" ? `rdw-chip--${kind}` : void 0,
			props.className
		].filter((part) => part !== void 0 && part.length > 0).join(" ");
		return a$1($, { children: [a$1("style", { children: CHIP_CSS }), a$1("span", {
			className,
			children: [
				variant === "dot" ? a$1("i", {
					className: "rdw-chip__dot",
					"aria-hidden": "true"
				}) : null,
				a$1("span", { children: props.label }),
				props.onRemove !== void 0 ? a$1("button", {
					type: "button",
					className: "rdw-chip__remove rdw-kit-focusable",
					"aria-label": `Remove ${props.label}`,
					onClick: props.onRemove,
					children: a$1(IconX, { size: 12 })
				}) : null
			]
		})] });
	}
	var EMPTY_STATE_CSS = `
.rdw-empty {
  display: grid;
  gap: 6px;
  justify-items: start;
  padding: 16px 8px;
  color: var(--rdw-muted);
  font: 12.5px/1.4 var(--rdw-font);
}
.rdw-empty__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--rdw-text);
}
.rdw-empty__desc {
  margin: 0;
}
`;
	function EmptyState(props) {
		const className = ["rdw-empty", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
		return a$1($, { children: [a$1("style", { children: EMPTY_STATE_CSS }), a$1("div", {
			className,
			role: "status",
			children: [
				a$1("p", {
					className: "rdw-empty__title",
					children: props.title
				}),
				props.description !== void 0 ? a$1("p", {
					className: "rdw-empty__desc",
					children: props.description
				}) : null,
				props.action
			]
		})] });
	}
	var NUMBER_FIELD_CSS = `
${KIT_FOCUS_CSS}
.rdw-num {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.rdw-num__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-num__input {
  box-sizing: border-box;
  min-height: 28px;
  height: 28px;
  width: 100%;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  font-size: 12px;
}
.rdw-num__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
`;
	function NumberField(props) {
		const autoId = P();
		const inputId = props.id ?? autoId;
		const className = ["rdw-num", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
		return a$1($, { children: [a$1("style", { children: NUMBER_FIELD_CSS }), a$1("div", {
			className,
			children: [props.label !== void 0 ? a$1("label", {
				className: "rdw-num__label",
				htmlFor: inputId,
				children: props.label
			}) : null, a$1("input", {
				id: inputId,
				className: "rdw-num__input rdw-kit-focusable",
				type: "number",
				value: props.value ?? "",
				min: props.min,
				max: props.max,
				step: props.step,
				placeholder: props.placeholder,
				disabled: props.disabled,
				"aria-label": props.label,
				onInput: (event) => {
					const raw = event.currentTarget.value;
					if (raw.trim() === "") {
						props.onChange(null);
						return;
					}
					const next = Number(raw);
					props.onChange(Number.isFinite(next) ? next : null);
				}
			})]
		})] });
	}
	var PROGRESS_WIDTH_VAR = "--rdw-progress-width";
	var PROGRESS_BAR_CSS = `
.rdw-progress {
  display: grid;
  gap: 4px;
  width: 100%;
}
.rdw-progress__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-progress__track {
  height: 6px;
  border-radius: 999px;
  background: var(--rdw-surface-2);
  border: 1px solid var(--rdw-border);
  overflow: hidden;
}
.rdw-progress__fill {
  height: 100%;
  width: var(${PROGRESS_WIDTH_VAR}, 0%);
  background: var(--rdw-accent);
  border-radius: inherit;
  transition: width 0.2s ease;
}
.rdw-progress__fill--indeterminate {
  width: 40%;
  animation: rdw-progress-indeterminate 1.1s ease-in-out infinite;
}
@keyframes rdw-progress-indeterminate {
  0% { transform: translateX(-120%); }
  100% { transform: translateX(280%); }
}
`;
	function clampUnit(value) {
		if (!Number.isFinite(value)) return 0;
		if (value < 0) return 0;
		if (value > 1) return 1;
		return value;
	}
	function ProgressBar(props) {
		const fillRef = T(null);
		const waiting = props.waiting === true;
		const hasValue = props.value !== void 0 && props.value !== null;
		const ratio = hasValue ? clampUnit(props.value) : 0;
		const className = ["rdw-progress", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
		A(() => {
			const fill = fillRef.current;
			if (fill === null) return;
			if (waiting || !hasValue) {
				fill.style.removeProperty(PROGRESS_WIDTH_VAR);
				return;
			}
			fill.style.setProperty(PROGRESS_WIDTH_VAR, `${Math.round(ratio * 100)}%`);
		}, [
			waiting,
			hasValue,
			ratio
		]);
		return a$1($, { children: [a$1("style", { children: PROGRESS_BAR_CSS }), a$1("div", {
			className,
			children: [props.label !== void 0 ? a$1("div", {
				className: "rdw-progress__label",
				children: props.label
			}) : null, a$1("div", {
				className: "rdw-progress__track",
				role: "progressbar",
				"aria-label": props.label,
				"aria-valuemin": 0,
				"aria-valuemax": 100,
				"aria-valuenow": hasValue && !waiting ? Math.round(ratio * 100) : void 0,
				children: a$1("div", {
					ref: fillRef,
					className: waiting ? "rdw-progress__fill rdw-progress__fill--indeterminate" : "rdw-progress__fill"
				})
			})]
		})] });
	}
	var SECTION_LABEL_CSS = `
.rdw-section-label {
  display: block;
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
  margin: 0 0 4px;
}
`;
	function SectionLabel(props) {
		const className = ["rdw-section-label", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
		if (props.htmlFor !== void 0) return a$1($, { children: [a$1("style", { children: SECTION_LABEL_CSS }), a$1("label", {
			className,
			htmlFor: props.htmlFor,
			children: props.children
		})] });
		return a$1($, { children: [a$1("style", { children: SECTION_LABEL_CSS }), a$1("div", {
			className,
			children: props.children
		})] });
	}
	var SEGMENTED_CSS = `
${KIT_FOCUS_CSS}
.rdw-seg {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  background: var(--rdw-surface-2);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  padding: 2px;
  gap: 2px;
}
.rdw-seg__btn {
  min-height: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: var(--rdw-radius-s);
  background: transparent;
  color: var(--rdw-muted);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  padding: 0 8px;
}
.rdw-seg__btn[aria-checked="true"] {
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font-weight: 600;
  box-shadow: var(--rdw-shadow-1);
}
`;
	function Segmented(props) {
		const className = ["rdw-seg", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
		return a$1($, { children: [a$1("style", { children: SEGMENTED_CSS }), a$1("div", {
			className,
			role: "radiogroup",
			"aria-label": props.label,
			children: props.options.map((option) => {
				const selected = option.value === props.value;
				return a$1("button", {
					type: "button",
					role: "radio",
					className: "rdw-seg__btn rdw-kit-focusable",
					"aria-checked": selected,
					tabIndex: selected ? 0 : -1,
					onClick: () => {
						props.onChange(option.value);
					},
					onKeyDown: (event) => {
						if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
						event.preventDefault();
						const index = props.options.findIndex((item) => item.value === props.value);
						if (index < 0) return;
						const delta = event.key === "ArrowRight" ? 1 : -1;
						const next = props.options[(index + delta + props.options.length) % props.options.length];
						if (next !== void 0) props.onChange(next.value);
					},
					children: option.label
				}, option.value);
			})
		})] });
	}
	var SELECT_CSS = `
${KIT_FOCUS_CSS}
.rdw-select {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.rdw-select__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-select__trigger {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 28px;
  height: 28px;
  width: 100%;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.rdw-select__trigger:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.rdw-select__list {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--rdw-surface);
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  box-shadow: var(--rdw-shadow-2);
  max-height: 220px;
  overflow: auto;
}
.rdw-select__option {
  min-height: 28px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-radius: var(--rdw-radius-s);
  font-size: 12px;
  color: var(--rdw-text);
  cursor: pointer;
}
.rdw-select__option[aria-selected="true"],
.rdw-select__option:hover {
  background: var(--rdw-surface-2);
}
`;
	function Select(props) {
		const listId = P();
		const rootRef = T(null);
		const [open, setOpen] = d(false);
		const selected = props.options.find((option) => option.value === props.value) ?? props.options[0];
		const className = ["rdw-select", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
		A(() => {
			if (!open) return;
			const onKeyDown = (event) => {
				if (event.key === "Escape") setOpen(false);
			};
			const onPointerDown = (event) => {
				const root = rootRef.current;
				if (root === null) return;
				if (!event.composedPath().includes(root)) setOpen(false);
			};
			document.addEventListener("keydown", onKeyDown);
			document.addEventListener("mousedown", onPointerDown);
			return () => {
				document.removeEventListener("keydown", onKeyDown);
				document.removeEventListener("mousedown", onPointerDown);
			};
		}, [open]);
		return a$1($, { children: [a$1("style", { children: SELECT_CSS }), a$1("div", {
			className,
			ref: rootRef,
			children: [
				props.label !== void 0 ? a$1("span", {
					className: "rdw-select__label",
					id: `${listId}-label`,
					children: props.label
				}) : null,
				a$1("button", {
					type: "button",
					className: "rdw-select__trigger rdw-kit-focusable",
					"aria-haspopup": "listbox",
					"aria-expanded": open,
					"aria-controls": listId,
					"aria-labelledby": props.label !== void 0 ? `${listId}-label` : void 0,
					disabled: props.disabled,
					onClick: () => {
						setOpen((prev) => !prev);
					},
					children: [a$1("span", { children: selected?.label ?? props.value }), a$1(IconChevronDown, { size: 14 })]
				}),
				open ? a$1("ul", {
					className: "rdw-select__list",
					role: "listbox",
					id: listId,
					tabIndex: -1,
					children: props.options.map((option) => a$1("li", {
						role: "option",
						className: "rdw-select__option rdw-kit-focusable",
						"aria-selected": option.value === props.value,
						tabIndex: 0,
						onClick: () => {
							props.onChange(option.value);
							setOpen(false);
						},
						onKeyDown: (event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								props.onChange(option.value);
								setOpen(false);
							}
						},
						children: option.label
					}, option.value))
				}) : null
			]
		})] });
	}
	var SWITCH_CSS = `
${KIT_FOCUS_CSS}
.rdw-switch-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
}
.rdw-switch {
  position: relative;
  box-sizing: border-box;
  width: 36px;
  height: 28px;
  min-width: 36px;
  min-height: 28px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.rdw-switch__track {
  display: block;
  width: 30px;
  height: 17px;
  margin: 0 auto;
  border-radius: 9px;
  background: var(--rdw-border);
  position: relative;
  transition: background 0.15s ease;
}
.rdw-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--rdw-surface);
  transition: left 0.15s ease;
}
.rdw-switch[aria-checked="true"] .rdw-switch__track {
  background: var(--rdw-accent);
}
.rdw-switch[aria-checked="true"] .rdw-switch__thumb {
  left: 15px;
}
.rdw-switch:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.rdw-switch__label {
  font-size: 12.5px;
  color: var(--rdw-text);
}
`;
	function Switch(props) {
		const className = ["rdw-switch-row", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
		return a$1($, { children: [a$1("style", { children: SWITCH_CSS }), a$1("div", {
			className,
			children: [a$1("button", {
				type: "button",
				id: props.id,
				className: "rdw-switch rdw-kit-focusable",
				role: "switch",
				"aria-checked": props.checked,
				"aria-label": props.label,
				disabled: props.disabled,
				onClick: () => {
					props.onChange(!props.checked);
				},
				children: a$1("span", {
					className: "rdw-switch__track",
					children: a$1("span", { className: "rdw-switch__thumb" })
				})
			}), props.label !== void 0 ? a$1("span", {
				className: "rdw-switch__label",
				children: props.label
			}) : null]
		})] });
	}
	var TEXT_FIELD_CSS = `
${KIT_FOCUS_CSS}
.rdw-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.rdw-field__label {
  font: 600 10.5px var(--rdw-font);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rdw-muted);
}
.rdw-field__input {
  box-sizing: border-box;
  min-height: 28px;
  height: 28px;
  width: 100%;
  padding: 0 8px;
  border: 1px solid var(--rdw-border);
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
  color: var(--rdw-text);
  font: inherit;
  font-size: 12px;
}
.rdw-field__input::placeholder {
  color: var(--rdw-muted);
}
.rdw-field__input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
`;
	function TextField(props) {
		const autoId = P();
		const inputId = props.id ?? autoId;
		const className = ["rdw-field", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
		return a$1($, { children: [a$1("style", { children: TEXT_FIELD_CSS }), a$1("div", {
			className,
			children: [props.label !== void 0 ? a$1("label", {
				className: "rdw-field__label",
				htmlFor: inputId,
				children: props.label
			}) : null, a$1("input", {
				id: inputId,
				className: "rdw-field__input rdw-kit-focusable",
				type: "text",
				value: props.value,
				placeholder: props.placeholder,
				disabled: props.disabled,
				"aria-label": props["aria-label"] ?? props.label,
				onInput: (event) => {
					props.onChange(event.currentTarget.value);
				}
			})]
		})] });
	}
	var FEATURE_ID$1 = "search-tools";
	var FEATURE_LABEL$1 = "Search tools";
	var FEATURE_PAGES$1 = ["list", "post"];
	var TAGS_INPUT_SELECTOR = "input[name=\"tags\"]";
	var TAG_SIDEBAR_SELECTOR$1 = "ul#tag-sidebar";
	var MY_FAVORITES_LINK_SELECTOR$1 = "li#my-favorites-container a[href*=\"page=favorites\"]";
	var ROOT_ID = "rdw-search-tools";
	var ROOT_CLASS = "rdw-search-tools";
	var CARD_CLASS = "rdw-search-tools-card";
	var CHIPS_CLASS$1 = "rdw-search-tools-chips";
	var CHIP_CLASS = "rdw-search-tools-chip";
	var CHIP_ATTR_START = "data-chip-start";
	var CHIP_ATTR_END = "data-chip-end";
	var CHIP_ATTR_TOGGLE = "data-chip-toggle";
	var CHIP_ATTR_REMOVE = "data-chip-remove";
	var FIELD_CLASS = "rdw-search-tools-field";
	var ROW_SORT_CLASS = "rdw-search-tools-row-sort";
	var FOOT_CLASS = "rdw-search-tools-foot";
	var HINT_CLASS$2 = "rdw-search-tools-hint";
	var RESET_CLASS = "rdw-search-tools-reset";
	var TOKEN_SPLIT_RE = /\s+/;
	var MULTI_SPACE_RE = /\s+/g;
	var POLL_INTERVAL_MS = 700;
	var NAV_DEBOUNCE_MS = 400;
	var META_SEP = ":";
	var SCORE_TOKEN_PREFIX = "score:>=";
	var SCORE_TOKEN_RE = /^score:>=(\d+)$/;
	var SORT_TOKEN_PREFIX = "sort:";
	var MEDIA_VIDEO = "video";
	var MEDIA_IMAGES = `-${MEDIA_VIDEO}`;
	var TAG_TYPE_CLASS_PREFIX = "tag-type-";
	var SORT_HINT = "Sorts within the current search";
	var FOOT_HINT = "Typing needs Search or Enter; chips and filters apply instantly";
	var RESET_LABEL$1 = "Reset search";
	var KEY_ENTER = "Enter";
	var EVENT_INPUT = "input";
	var EVENT_CHANGE = "change";
	var EVENT_CLICK$1 = "click";
	var EVENT_AWESOMPLETE_SELECT = "awesomplete-selectcomplete";
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
	var SOURCE_OPTIONS = [
		{
			value: "all",
			label: "All"
		},
		{
			value: "feed",
			label: "Feed"
		},
		{
			value: "favorites",
			label: "Favorites"
		}
	];
	var SORT_TOKEN_TO_MODE = new Map();
	for (const option of SORT_OPTIONS) if (option.token !== null) SORT_TOKEN_TO_MODE.set(option.token, option.value);
	var FEATURE_CSS$1 = [
		`body.${BODY_CLASS} .${ROOT_CLASS} {`,
		"  margin-top: 8px;",
		"  max-width: 100%;",
		"  box-sizing: border-box;",
		"}",
		`body.${BODY_CLASS} .${CARD_CLASS} {`,
		"  padding: 10px;",
		"  display: grid;",
		"  gap: 10px;",
		"}",
		`body.${BODY_CLASS} .${CHIPS_CLASS$1} {`,
		"  display: flex;",
		"  flex-wrap: wrap;",
		"  gap: 5px;",
		"}",
		`body.${BODY_CLASS} .${CHIP_CLASS} {`,
		"  cursor: default;",
		"}",
		`body.${BODY_CLASS} .${CHIP_CLASS}[${CHIP_ATTR_TOGGLE}="1"] {`,
		"  cursor: pointer;",
		"}",
		`body.${BODY_CLASS} .${FIELD_CLASS} {`,
		"  display: grid;",
		"  gap: 0;",
		"  min-width: 0;",
		"}",
		`body.${BODY_CLASS} .${ROW_SORT_CLASS} {`,
		"  display: grid;",
		"  grid-template-columns: 1fr 72px;",
		"  gap: 8px;",
		"  align-items: start;",
		"}",
		`body.${BODY_CLASS} .${FOOT_CLASS} {`,
		"  display: flex;",
		"  justify-content: space-between;",
		"  align-items: center;",
		"  border-top: 1px solid var(--rdw-border);",
		"  padding-top: 8px;",
		"}",
		`body.${BODY_CLASS} .${HINT_CLASS$2} {`,
		"  font-size: 12px;",
		"  color: var(--rdw-muted);",
		"}",
		`body.${BODY_CLASS} .${RESET_CLASS} {`,
		"  padding: 0;",
		"  min-height: auto;",
		"  height: auto;",
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
	function isMetaToken(token) {
		return bareTag(token).includes(META_SEP);
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
			const mode = SORT_TOKEN_TO_MODE.get(bareTag(token));
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
	function removeTokenRange(tokens, start, end) {
		if (start < 0 || end < start || start >= tokens.length) return [...tokens];
		return tokens.filter((_, index) => index < start || index > end);
	}
	function replaceTokenAt(tokens, index, nextToken) {
		return tokens.map((token, tokenIndex) => tokenIndex === index ? nextToken : token);
	}
	function chipKindFromTagType(tagType) {
		if (tagType === "artist") return "artist";
		if (tagType === "character") return "character";
		if (tagType === "copyright") return "copyright";
		if (tagType === "metadata") return "metadata";
		return "default";
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
		const anchor = document.querySelector(MY_FAVORITES_LINK_SELECTOR$1);
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
		if (isFullUpdatesQuery(tagsRaw, artists) || isPartialUpdatesQuery(tagsRaw, artists)) return "feed";
		return "all";
	}
	function tryParseParenGroup(tokens, start) {
		if (tokens[start] !== "(") return null;
		for (let index = start + 1; index < tokens.length; index += 1) {
			if (tokens[index] === "(") return null;
			if (tokens[index] === ")") {
				const inner = tokens.slice(start + 1, index);
				if (inner.length === 0) return null;
				return {
					end: index,
					inner
				};
			}
		}
		return null;
	}
	function isOrJoinedMembers(inner) {
		if (inner.length === 0 || inner.length % 2 === 0) return null;
		const members = [];
		for (let index = 0; index < inner.length; index += 1) {
			const token = inner[index];
			if (token === void 0) return null;
			if (index % 2 === 1) {
				if (token !== "~") return null;
				continue;
			}
			if (token === "(" || token === ")" || token === "~") return null;
			members.push(token);
		}
		return members.length > 0 ? members : null;
	}
	function orGroupLabel(members) {
		const title = members.join(" ");
		const query = joinTokens([
			"(",
			...members.flatMap((member, index) => index === 0 ? [member] : ["~", member]),
			")"
		]);
		const artists = listArtistTags();
		const count = members.length;
		if (isFullUpdatesQuery(query, artists)) return {
			label: `Feed · ${String(count)} artists`,
			title
		};
		return {
			label: `Any of ${String(count)} tags`,
			title
		};
	}
	function chipsSignature(chips) {
		return chips.map((chip) => {
			if (chip.kind === "tag") return `t:${String(chip.start)}:${chip.token}:${chip.chipKind}`;
			return `g:${chip.kind}:${String(chip.start)}:${String(chip.end)}:${chip.label}:${chip.title}`;
		}).join("|");
	}
	function buildChipModels(tokens) {
		const tagTypes = buildSidebarTagTypes();
		const chips = [];
		let index = 0;
		while (index < tokens.length) {
			const token = tokens[index];
			if (token === void 0) break;
			if (isControlledToken(token)) {
				index += 1;
				continue;
			}
			const group = tryParseParenGroup(tokens, index);
			if (group !== null) {
				const groupTokens = tokens.slice(index, group.end + 1);
				const playlistIds = parsePlaylistQuery(joinTokens(groupTokens));
				if (playlistIds !== null && playlistIds.length > 0) {
					chips.push({
						kind: "id-group",
						start: index,
						end: group.end,
						label: `${String(playlistIds.length)} posts`,
						title: groupTokens.join(" ")
					});
					index = group.end + 1;
					continue;
				}
				const members = isOrJoinedMembers(group.inner);
				if (members !== null) {
					const { label, title } = orGroupLabel(members);
					chips.push({
						kind: "or-group",
						start: index,
						end: group.end,
						label,
						title
					});
					index = group.end + 1;
					continue;
				}
			}
			const excluded = token.startsWith("-") && token.length > 1;
			const tagType = tagTypes.get(normalizeTagKey(bareTag(token))) ?? null;
			chips.push({
				kind: "tag",
				start: index,
				end: index,
				token,
				label: token,
				excluded,
				chipKind: chipKindFromTagType(tagType),
				title: isMetaToken(token) ? token : null
			});
			index += 1;
		}
		return chips;
	}
	function readPanelView(inputValue, search) {
		const tokens = parseTokens(inputValue);
		const chips = buildChipModels(tokens);
		return {
			chips,
			chipsSig: chipsSignature(chips),
			media: readMediaMode(tokens),
			sort: readSortMode(tokens),
			minScore: readMinScore(tokens),
			source: detectSourceMode(search)
		};
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
	function setInputValueOnly(input, tokens) {
		input.value = normalizeSpaces(joinTokens(tokens));
	}
	function SearchToolsPanel(props) {
		const { input } = props;
		const [view, setView] = d(() => readPanelView(input.value, window.location.search));
		const [scoreDraft, setScoreDraft] = d(view.minScore);
		const scoreFocusedRef = T(false);
		const navTimerRef = T(null);
		const lastPolledValueRef = T(input.value);
		const clearNavTimer = () => {
			if (navTimerRef.current !== null) {
				window.clearTimeout(navTimerRef.current);
				navTimerRef.current = null;
			}
		};
		const scheduleNavigate = (tokens) => {
			clearNavTimer();
			navTimerRef.current = window.setTimeout(() => {
				navTimerRef.current = null;
				navigateTokens(tokens);
			}, NAV_DEBOUNCE_MS);
		};
		const applyViewFromInput = (options) => {
			const next = readPanelView(input.value, window.location.search);
			lastPolledValueRef.current = input.value;
			setView((prev) => {
				const chipsUnchanged = next.chipsSig === prev.chipsSig;
				if (chipsUnchanged && next.media === prev.media && next.sort === prev.sort && next.minScore === prev.minScore && next.source === prev.source) return prev;
				return {
					...next,
					chips: chipsUnchanged ? prev.chips : next.chips
				};
			});
			if (!scoreFocusedRef.current) setScoreDraft(next.minScore);
			if (options.navigate) scheduleNavigate(parseTokens(input.value));
		};
		const writeTokens = (tokens, options) => {
			setInputValueOnly(input, tokens);
			lastPolledValueRef.current = input.value;
			const next = readPanelView(input.value, window.location.search);
			setView((prev) => {
				const chipsUnchanged = next.chipsSig === prev.chipsSig;
				return {
					...next,
					chips: chipsUnchanged ? prev.chips : next.chips
				};
			});
			if (!scoreFocusedRef.current) setScoreDraft(next.minScore);
			if (options.navigate) scheduleNavigate(tokens);
		};
		const applyViewRef = T(applyViewFromInput);
		applyViewRef.current = applyViewFromInput;
		A(() => {
			const onSiteInput = () => {
				applyViewRef.current({ navigate: false });
			};
			input.addEventListener(EVENT_INPUT, onSiteInput);
			input.addEventListener(EVENT_CHANGE, onSiteInput);
			input.addEventListener(EVENT_AWESOMPLETE_SELECT, onSiteInput);
			const sidebar = document.querySelector(TAG_SIDEBAR_SELECTOR$1);
			const onSidebarClick = () => {
				window.setTimeout(() => {
					applyViewRef.current({ navigate: false });
				}, 0);
			};
			if (sidebar !== null) sidebar.addEventListener(EVENT_CLICK$1, onSidebarClick);
			const pollId = window.setInterval(() => {
				if (document.hidden) return;
				if (input.value === lastPolledValueRef.current) return;
				applyViewRef.current({ navigate: false });
			}, POLL_INTERVAL_MS);
			return () => {
				clearNavTimer();
				input.removeEventListener(EVENT_INPUT, onSiteInput);
				input.removeEventListener(EVENT_CHANGE, onSiteInput);
				input.removeEventListener(EVENT_AWESOMPLETE_SELECT, onSiteInput);
				if (sidebar !== null) sidebar.removeEventListener(EVENT_CLICK$1, onSidebarClick);
				window.clearInterval(pollId);
			};
		}, [input]);
		const onChipsClick = (event) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			const chipEl = target.closest(`[${CHIP_ATTR_START}]`);
			if (!(chipEl instanceof HTMLElement)) return;
			const startRaw = chipEl.getAttribute(CHIP_ATTR_START);
			const endRaw = chipEl.getAttribute(CHIP_ATTR_END);
			if (startRaw === null || endRaw === null) return;
			const start = Number(startRaw);
			const end = Number(endRaw);
			if (!Number.isFinite(start) || !Number.isFinite(end)) return;
			if (target.closest(`[${CHIP_ATTR_REMOVE}]`) !== null) {
				event.preventDefault();
				const current = parseTokens(input.value);
				writeTokens(removeTokenRange(current, start, end), { navigate: true });
				return;
			}
			if (chipEl.getAttribute(CHIP_ATTR_TOGGLE) !== "1") return;
			event.preventDefault();
			const current = parseTokens(input.value);
			const currentToken = current[start];
			if (currentToken === void 0 || isMetaToken(currentToken)) return;
			writeTokens(replaceTokenAt(current, start, toggleExclude(currentToken)), { navigate: true });
		};
		const onMediaChange = (value) => {
			const media = MEDIA_OPTIONS.find((entry) => entry.value === value)?.value;
			if (media === void 0) return;
			const tokens = parseTokens(input.value);
			writeTokens(buildTokenSet(tokens, media, readSortMode(tokens), readMinScore(tokens)), { navigate: true });
		};
		const onSortChange = (value) => {
			const sort = SORT_OPTIONS.find((entry) => entry.value === value)?.value;
			if (sort === void 0) return;
			const tokens = parseTokens(input.value);
			writeTokens(buildTokenSet(tokens, readMediaMode(tokens), sort, readMinScore(tokens)), { navigate: true });
		};
		const commitScore = () => {
			const tokens = parseTokens(input.value);
			let minScore = null;
			if (scoreDraft !== null && Number.isFinite(scoreDraft) && scoreDraft > 0) minScore = Math.floor(scoreDraft);
			const current = readMinScore(tokens);
			if (current === minScore) {
				setScoreDraft(current);
				return;
			}
			writeTokens(buildTokenSet(tokens, readMediaMode(tokens), readSortMode(tokens), minScore), { navigate: true });
		};
		const onSourceChange = (value) => {
			const source = SOURCE_OPTIONS.find((entry) => entry.value === value)?.value;
			if (source === void 0) return;
			if (source === "feed") {
				const artists = listArtistTags();
				if (artists.length === 0) {
					setView((prev) => ({
						...prev,
						source: detectSourceMode(window.location.search)
					}));
					return;
				}
				clearNavTimer();
				navTimerRef.current = window.setTimeout(() => {
					navTimerRef.current = null;
					window.location.assign(buildFeedUrl(artists, getUpdatesGroupSize()));
				}, NAV_DEBOUNCE_MS);
				setView((prev) => ({
					...prev,
					source
				}));
				return;
			}
			if (source === "favorites") {
				const href = findFavoritesHref();
				if (href === null) {
					setView((prev) => ({
						...prev,
						source: detectSourceMode(window.location.search)
					}));
					return;
				}
				clearNavTimer();
				navTimerRef.current = window.setTimeout(() => {
					navTimerRef.current = null;
					window.location.assign(href);
				}, NAV_DEBOUNCE_MS);
				setView((prev) => ({
					...prev,
					source
				}));
				return;
			}
			setView((prev) => ({
				...prev,
				source: "all"
			}));
			scheduleNavigate(parseTokens(input.value));
		};
		const onReset = () => {
			clearNavTimer();
			setInputValueOnly(input, []);
			lastPolledValueRef.current = input.value;
			setView(readPanelView("", window.location.search));
			setScoreDraft(null);
			window.location.assign(buildSearchUrl([]));
		};
		return a$1($, { children: [a$1("style", { children: CHIP_CSS }), a$1(Card, {
			className: CARD_CLASS,
			children: [
				view.chips.length > 0 ? a$1("div", {
					className: FIELD_CLASS,
					children: [a$1(SectionLabel, { children: "Tags" }), a$1("div", {
						className: CHIPS_CLASS$1,
						onClick: onChipsClick,
						role: "list",
						"aria-label": "Search tags",
						children: view.chips.map((chip) => {
							if (chip.kind === "tag") {
								const excluded = chip.excluded;
								const variantClass = excluded ? "rdw-chip--exclude" : "rdw-chip--dot";
								const kindClass = !excluded && chip.chipKind !== "default" ? `rdw-chip--${chip.chipKind}` : "";
								const toggleable = !isMetaToken(chip.token);
								return a$1("span", {
									className: [
										"rdw-chip",
										variantClass,
										kindClass,
										CHIP_CLASS
									].filter((part) => part.length > 0).join(" "),
									role: "listitem",
									title: chip.title ?? void 0,
									"data-chip-start": String(chip.start),
									"data-chip-end": String(chip.end),
									"data-chip-toggle": toggleable ? "1" : "0",
									children: [
										!excluded ? a$1("i", {
											className: "rdw-chip__dot",
											"aria-hidden": "true"
										}) : null,
										a$1("span", { children: chip.label }),
										a$1("button", {
											type: "button",
											className: "rdw-chip__remove rdw-kit-focusable",
											"aria-label": `Remove ${chip.label}`,
											"data-chip-remove": "1",
											children: a$1(IconX, { size: 12 })
										})
									]
								}, `t-${String(chip.start)}-${chip.token}`);
							}
							return a$1("span", {
								className: `rdw-chip rdw-chip--group ${CHIP_CLASS}`,
								role: "listitem",
								title: chip.title,
								"data-chip-start": String(chip.start),
								"data-chip-end": String(chip.end),
								"data-chip-toggle": "0",
								children: [a$1("span", { children: chip.label }), a$1("button", {
									type: "button",
									className: "rdw-chip__remove rdw-kit-focusable",
									"aria-label": `Remove ${chip.label}`,
									"data-chip-remove": "1",
									children: a$1(IconX, { size: 12 })
								})]
							}, `g-${String(chip.start)}-${String(chip.end)}-${chip.label}`);
						})
					})]
				}) : null,
				a$1("div", {
					className: FIELD_CLASS,
					children: [a$1(SectionLabel, { children: "Media" }), a$1(Segmented, {
						label: "Media",
						options: MEDIA_OPTIONS.map((entry) => ({
							value: entry.value,
							label: entry.label
						})),
						value: view.media,
						onChange: onMediaChange
					})]
				}),
				a$1("div", {
					className: ROW_SORT_CLASS,
					title: SORT_HINT,
					children: [a$1(Select, {
						label: "Sort",
						options: SORT_OPTIONS.map((entry) => ({
							value: entry.value,
							label: entry.label
						})),
						value: view.sort,
						onChange: onSortChange
					}), a$1("div", {
						onFocusIn: () => {
							scoreFocusedRef.current = true;
						},
						onFocusOut: (event) => {
							const next = event.relatedTarget;
							if (next instanceof Node && event.currentTarget.contains(next)) return;
							scoreFocusedRef.current = false;
							commitScore();
						},
						onKeyDown: (event) => {
							if (event.key !== KEY_ENTER) return;
							event.preventDefault();
							commitScore();
						},
						children: a$1(NumberField, {
							label: "Min score",
							value: scoreDraft,
							min: 1,
							step: 1,
							onChange: setScoreDraft
						})
					})]
				}),
				a$1("div", {
					className: FIELD_CLASS,
					children: [a$1(SectionLabel, { children: "Source" }), a$1(Segmented, {
						label: "Source",
						options: SOURCE_OPTIONS.map((entry) => ({
							value: entry.value,
							label: entry.label
						})),
						value: view.source,
						onChange: onSourceChange
					})]
				}),
				a$1("div", {
					className: FOOT_CLASS,
					children: [a$1("span", {
						className: HINT_CLASS$2,
						children: FOOT_HINT
					}), a$1(Button, {
						variant: "ghost",
						size: "s",
						className: RESET_CLASS,
						onClick: onReset,
						children: RESET_LABEL$1
					})]
				})
			]
		})] });
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
		Q(a$1(SearchToolsPanel, { input }), root);
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
		blacklistHideFeature,
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
	function themeEnablesSkin(theme) {
		return theme === "light" || theme === "dark" || theme === "custom";
	}
	function paletteModeForTheme(appearance) {
		const theme = appearance.theme;
		if (theme === "dark" || theme === "site-dark") return "dark";
		if (theme === "custom") return appearance.custom?.base === "dark" ? "dark" : "light";
		return "light";
	}
	function resolveTokenPalette(appearance) {
		return paletteForMode(paletteModeForTheme(appearance));
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
	function syncPageRootTokens(palette) {
		const host = document.getElementById(RDW_PAGE_ROOT_ID);
		if (!(host instanceof HTMLElement)) return;
		applyTokenProperties(host, palette);
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
		const palette = resolveTokenPalette(appearance);
		injectTokenStyles(palette);
		syncPageRootTokens(palette);
		injectSiteSkinHook(options.siteSkinCss ?? "");
		const root = document.documentElement;
		clearCustomThemeProperties(root);
		if (appearance.theme === "custom" && appearance.custom !== void 0) {
			const backgroundImage = options.backgroundDataUrl ?? appearance.custom.backgroundImage;
			applyCustomThemeProperties(root, backgroundImage !== void 0 && backgroundImage.length > 0 ? {
				backgroundImage,
				...appearance.custom.backgroundDim !== void 0 ? { backgroundDim: appearance.custom.backgroundDim } : {}
			} : { ...appearance.custom.backgroundDim !== void 0 ? { backgroundDim: appearance.custom.backgroundDim } : {} });
		} else if (options.backgroundDataUrl !== void 0 && options.backgroundDataUrl.length > 0) applyCustomThemeProperties(root, { backgroundImage: options.backgroundDataUrl });
	}
	var PAGE_CLASS = "rdw-collections-page";
	var PLAYLIST_META_CLASS = "rdw-playlist-meta";
	var PLAYLIST_PARTS_CLASS = "rdw-playlist-parts";
	var PLAYLIST_PART_CLASS = "rdw-playlist-part";
	var ROW_MAIN_CLASS = "rdw-collections-row-main";
	var DYNAMIC_COLLECTIONS_HEADING = "Dynamic Collection";
	var CUSTOM_COLLECTIONS_HEADING = "Custom Collection";
	var EMPTY_DYNAMIC_COLLECTIONS = "No dynamic collections yet.";
	var EMPTY_CUSTOM_COLLECTIONS = "No custom collections yet.";
	var EMPTY_CUSTOM_COLLECTIONS_HINT = "Use the + button on a post";
	var NEW_CUSTOM_COLLECTION = "New Custom Collection";
	var OPEN_CUSTOM_COLLECTION = "Open Custom Collection";
	var CUSTOM_COLLECTION_PARTS_LABEL = "Custom Collection parts";
	var SAVE_NAME_ID = "rdw-save-name";
	var PLAYLIST_NAME_ID = "rdw-playlist-name";
	var COLLECTIONS_PAGE_CSS = `
.${PAGE_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.${PAGE_CLASS} .${ROW_MAIN_CLASS} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.${PAGE_CLASS} .${PLAYLIST_META_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${PAGE_CLASS} .${PLAYLIST_PARTS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}
.${PAGE_CLASS} .${PLAYLIST_PART_CLASS} {
  color: var(--rdw-accent);
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
}
.${PAGE_CLASS} .${PLAYLIST_PART_CLASS}:focus-visible {
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
`.trim();
	var sharedMode = { kind: "list" };
	var sharedNameDraft = "";
	function postsLabel(count) {
		return `${String(count)} post${count === 1 ? "" : "s"}`;
	}
	function listSavedSearches() {
		return load().collections.filter((entry) => !isPlaylist(entry));
	}
	function playlistPostCount(playlist) {
		return playlist.postIds?.length ?? 0;
	}
	function NameForm(props) {
		A(() => {
			const input = document.getElementById(props.inputId);
			if (input instanceof HTMLInputElement) {
				input.focus();
				input.select();
			}
		}, [props.inputId]);
		return a$1("form", {
			className: "rdw-form",
			onSubmit: (event) => {
				event.preventDefault();
				props.onSubmit();
			},
			children: [a$1(TextField, {
				id: props.inputId,
				label: UI_TEXT.nameLabel,
				value: props.value,
				onChange: props.onChange
			}), a$1("div", {
				className: "rdw-form-actions",
				children: [a$1(Button, {
					type: "submit",
					variant: "primary",
					children: UI_TEXT.save
				}), a$1(Button, {
					type: "button",
					variant: "secondary",
					onClick: props.onCancel,
					children: UI_TEXT.cancel
				})]
			})]
		});
	}
	function RenameDeleteActions(props) {
		return a$1("div", {
			className: "rdw-item-actions",
			children: [a$1(Button, {
				variant: "secondary",
				size: "s",
				"aria-label": `${UI_TEXT.rename}: ${props.collection.name}`,
				onClick: props.onRename,
				children: UI_TEXT.rename
			}), a$1(IconButton, {
				label: `${UI_TEXT.delete}: ${props.collection.name}`,
				onClick: props.onDelete,
				children: a$1(IconTrash, { size: 14 })
			})]
		});
	}
	function CollectionsPage() {
		const [mode, setMode] = d(sharedMode);
		const [nameDraft, setNameDraft] = d(sharedNameDraft);
		const [, setTick] = d(0);
		const refresh = () => {
			setTick((value) => value + 1);
		};
		const setModeBoth = (next) => {
			sharedMode = next;
			setMode(next);
		};
		const setDraftBoth = (next) => {
			sharedNameDraft = next;
			setNameDraft(next);
		};
		const saved = listSavedSearches();
		const playlists = listPlaylists();
		const searchTags = readTagsFromLocation(window.location.search);
		const canSave = searchTags !== null && searchTags.length > 0;
		return a$1($, { children: [a$1("style", { children: COLLECTIONS_PAGE_CSS }), a$1(Card, {
			className: `${PANEL_UI_CLASS.pageCard} ${PAGE_CLASS}`,
			children: [a$1("section", {
				className: "rdw-section",
				children: [
					a$1(SectionLabel, { children: DYNAMIC_COLLECTIONS_HEADING }),
					mode.kind === "save-search" ? a$1(NameForm, {
						inputId: SAVE_NAME_ID,
						value: nameDraft,
						onChange: setDraftBoth,
						onSubmit: () => {
							const tags = readTagsFromLocation(window.location.search);
							if (tags === null || tags.length === 0) {
								setModeBoth({ kind: "list" });
								refresh();
								return;
							}
							const name = nameDraft.trim();
							if (name.length === 0) return;
							addCollection(name, tags);
							setModeBoth({ kind: "list" });
							setDraftBoth("");
							refresh();
						},
						onCancel: () => {
							setModeBoth({ kind: "list" });
						}
					}) : a$1($, { children: [a$1(Button, {
						variant: "primary",
						disabled: !canSave,
						onClick: () => {
							const tags = readTagsFromLocation(window.location.search);
							if (tags === null || tags.length === 0) return;
							setDraftBoth(serialize(tags));
							setModeBoth({ kind: "save-search" });
						},
						children: UI_TEXT.saveCurrent
					}), !canSave ? a$1("p", {
						className: "rdw-hint",
						children: UI_TEXT.notOnSearchPage
					}) : null] }),
					saved.length === 0 ? a$1("p", {
						className: "rdw-hint",
						children: EMPTY_DYNAMIC_COLLECTIONS
					}) : a$1("ul", {
						className: "rdw-list",
						children: saved.map((collection) => a$1("li", {
							className: "rdw-list-item",
							children: mode.kind === "rename" && mode.id === collection.id ? a$1(NameForm, {
								inputId: `rdw-rename-${collection.id}`,
								value: nameDraft,
								onChange: setDraftBoth,
								onSubmit: () => {
									const nextName = nameDraft.trim();
									if (nextName.length === 0) return;
									renameCollection(collection.id, nextName);
									setModeBoth({ kind: "list" });
									setDraftBoth("");
									refresh();
								},
								onCancel: () => {
									setModeBoth({ kind: "list" });
								}
							}) : mode.kind === "confirm-delete" && mode.id === collection.id ? a$1($, { children: [a$1("p", {
								className: "rdw-hint",
								children: `${UI_TEXT.confirmDelete} (${collection.name})`
							}), a$1("div", {
								className: "rdw-confirm-row",
								children: [a$1(Button, {
									variant: "danger",
									onClick: () => {
										deleteCollection(collection.id);
										setModeBoth({ kind: "list" });
										setDraftBoth("");
										refresh();
									},
									children: UI_TEXT.confirm
								}), a$1(Button, {
									variant: "secondary",
									onClick: () => {
										setModeBoth({ kind: "list" });
									},
									children: UI_TEXT.cancel
								})]
							})] }) : a$1("div", {
								className: ROW_MAIN_CLASS,
								children: [a$1("button", {
									type: "button",
									className: "rdw-item-name",
									"aria-label": `${UI_TEXT.openCollection}: ${collection.name}`,
									onClick: () => {
										window.location.assign(buildSearchUrl(collection.tags));
									},
									children: collection.name
								}), a$1(RenameDeleteActions, {
									collection,
									onRename: () => {
										setDraftBoth(collection.name);
										setModeBoth({
											kind: "rename",
											id: collection.id
										});
									},
									onDelete: () => {
										setModeBoth({
											kind: "confirm-delete",
											id: collection.id
										});
									}
								})]
							})
						}, collection.id))
					})
				]
			}), a$1("section", {
				className: "rdw-section",
				children: [
					a$1(SectionLabel, { children: CUSTOM_COLLECTIONS_HEADING }),
					mode.kind === "create-playlist" ? a$1(NameForm, {
						inputId: PLAYLIST_NAME_ID,
						value: nameDraft,
						onChange: setDraftBoth,
						onSubmit: () => {
							const name = nameDraft.trim();
							if (name.length === 0) return;
							createPlaylist(name);
							setModeBoth({ kind: "list" });
							setDraftBoth("");
							refresh();
						},
						onCancel: () => {
							setModeBoth({ kind: "list" });
						}
					}) : a$1(Button, {
						variant: "primary",
						onClick: () => {
							setDraftBoth("");
							setModeBoth({ kind: "create-playlist" });
						},
						children: NEW_CUSTOM_COLLECTION
					}),
					playlists.length === 0 ? a$1(EmptyState, {
						title: EMPTY_CUSTOM_COLLECTIONS,
						description: EMPTY_CUSTOM_COLLECTIONS_HINT
					}) : a$1("ul", {
						className: "rdw-list",
						children: playlists.map((playlist) => {
							const count = playlistPostCount(playlist);
							const queries = buildPlaylistQueries(playlist.postIds ?? [], getPlaylistChunkSize());
							const canOpen = count > 0 && queries.length > 0;
							return a$1("li", {
								className: "rdw-list-item",
								children: mode.kind === "rename" && mode.id === playlist.id ? a$1(NameForm, {
									inputId: `rdw-rename-${playlist.id}`,
									value: nameDraft,
									onChange: setDraftBoth,
									onSubmit: () => {
										const nextName = nameDraft.trim();
										if (nextName.length === 0) return;
										renameCollection(playlist.id, nextName);
										setModeBoth({ kind: "list" });
										setDraftBoth("");
										refresh();
									},
									onCancel: () => {
										setModeBoth({ kind: "list" });
									}
								}) : mode.kind === "confirm-delete" && mode.id === playlist.id ? a$1($, { children: [a$1("p", {
									className: "rdw-hint",
									children: `${UI_TEXT.confirmDelete} (${playlist.name})`
								}), a$1("div", {
									className: "rdw-confirm-row",
									children: [a$1(Button, {
										variant: "danger",
										onClick: () => {
											deleteCollection(playlist.id);
											setModeBoth({ kind: "list" });
											setDraftBoth("");
											refresh();
										},
										children: UI_TEXT.confirm
									}), a$1(Button, {
										variant: "secondary",
										onClick: () => {
											setModeBoth({ kind: "list" });
										},
										children: UI_TEXT.cancel
									})]
								})] }) : a$1($, { children: [
									a$1("div", {
										className: ROW_MAIN_CLASS,
										children: [a$1("button", {
											type: "button",
											className: "rdw-item-name",
											"aria-label": `${OPEN_CUSTOM_COLLECTION}: ${playlist.name}`,
											disabled: !canOpen,
											onClick: () => {
												const first = queries[0];
												if (first === void 0) return;
												window.location.assign(buildUpdatesSearchUrl(first));
											},
											children: playlist.name
										}), a$1(RenameDeleteActions, {
											collection: playlist,
											onRename: () => {
												setDraftBoth(playlist.name);
												setModeBoth({
													kind: "rename",
													id: playlist.id
												});
											},
											onDelete: () => {
												setModeBoth({
													kind: "confirm-delete",
													id: playlist.id
												});
											}
										})]
									}),
									a$1("p", {
										className: PLAYLIST_META_CLASS,
										children: postsLabel(count)
									}),
									queries.length > 1 ? a$1("ul", {
										className: PLAYLIST_PARTS_CLASS,
										"aria-label": CUSTOM_COLLECTION_PARTS_LABEL,
										children: queries.map((query, index) => a$1("li", { children: a$1("a", {
											className: PLAYLIST_PART_CLASS,
											href: buildUpdatesSearchUrl(query),
											children: String(index + 1)
										}) }, `${playlist.id}-${String(index)}`))
									}) : null
								] })
							}, playlist.id);
						})
					})
				]
			})]
		})] });
	}
	var AUTOCOMPLETE_PATH = "/public/autocomplete.php";
	var AUTOCOMPLETE_TAG_TYPE_ARTIST = "artist";
	var HTTP_TOO_MANY_REQUESTS = 429;
	var ABORT_ERROR_NAME = "AbortError";
	var AutocompleteResponseSchema = array(object({
		label: string(),
		value: string(),
		type: optional(nullable(string()))
	}));
	function buildAutocompleteUrl(query) {
		const params = new URLSearchParams();
		params.set("q", query);
		return `${SITE_ORIGIN}${AUTOCOMPLETE_PATH}?${params.toString()}`;
	}
	function isAbortError$1(error) {
		if (error instanceof DOMException && error.name === ABORT_ERROR_NAME) return true;
		if (typeof error !== "object" || error === null || !("name" in error)) return false;
		return error.name === ABORT_ERROR_NAME;
	}
	function normalizeItems(raw) {
		const result = [];
		for (const item of raw) {
			const type = item.type === null || item.type === void 0 ? void 0 : item.type;
			if (type === void 0) result.push({
				label: item.label,
				value: item.value
			});
			else result.push({
				label: item.label,
				value: item.value,
				type
			});
		}
		return result;
	}
	function preferSuggestionType(items, preferType) {
		const preferred = [];
		const rest = [];
		for (const item of items) if (item.type === preferType) preferred.push(item);
		else rest.push(item);
		return [...preferred, ...rest];
	}
	async function fetchAutocomplete(query, signal) {
		const trimmed = query.trim();
		if (trimmed.length < 2) return [];
		let response;
		try {
			const init = {
				method: "GET",
				credentials: FETCH_CREDENTIALS
			};
			if (signal !== void 0) init.signal = signal;
			response = await fetch(buildAutocompleteUrl(trimmed), init);
		} catch (error) {
			if (isAbortError$1(error) || signal?.aborted === true) return [];
			log.error("autocomplete: fetch failed", error);
			return [];
		}
		if (response.status === HTTP_TOO_MANY_REQUESTS) {
			log.warn("autocomplete: rate limited", response.status);
			return [];
		}
		if (!response.ok) {
			log.warn("autocomplete: HTTP error", response.status);
			return [];
		}
		let json;
		try {
			json = await response.json();
		} catch (error) {
			if (isAbortError$1(error) || signal?.aborted === true) return [];
			log.error("autocomplete: invalid JSON", error);
			return [];
		}
		const parsed = AutocompleteResponseSchema.safeParse(json);
		if (!parsed.success) {
			log.error("autocomplete: schema mismatch", parsed.error);
			return [];
		}
		return normalizeItems(parsed.data);
	}
	function createAutocompleteQuerier(options = {}) {
		let timer = null;
		let controller = null;
		const preferType = options.preferType;
		const cancel = () => {
			if (timer !== null) {
				clearTimeout(timer);
				timer = null;
			}
			if (controller !== null) {
				controller.abort();
				controller = null;
			}
		};
		const query = (text, onResult) => {
			cancel();
			const trimmed = text.trim();
			if (trimmed.length < 2) {
				onResult([]);
				return;
			}
			timer = setTimeout(() => {
				timer = null;
				const next = new AbortController();
				controller = next;
				fetchAutocomplete(trimmed, next.signal).then((items) => {
					if (next.signal.aborted) return;
					if (controller === next) controller = null;
					onResult(preferType === void 0 ? items : preferSuggestionType(items, preferType));
				});
			}, 300);
		};
		return {
			query,
			cancel
		};
	}
	var ADD_FORM_CLASS = "rdw-following-add";
	var ADD_INPUT_ID$1 = "rdw-following-add-tag";
	var OPEN_POSTS_LABEL = "Open Posts";
	var OPEN_POSTS_HREF = `${SEARCH_PATH}?${SEARCH_PARAM_PAGE}=${SEARCH_PAGE}&s=${SEARCH_SECTION}`;
	var FOLLOWING_PAGE_CSS = `
.${ADD_FORM_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-end;
}
.${ADD_FORM_CLASS} .rdw-field,
.${ADD_FORM_CLASS} .rdw-ac {
  flex: 1 1 12rem;
  margin: 0;
}
`.trim();
	function displayArtistName(tag) {
		return tag.replaceAll("_", " ");
	}
	function compareArtistTags(a, b) {
		return a.localeCompare(b, void 0, { sensitivity: "base" });
	}
	function readArtists() {
		return [...load().artists];
	}
	function AddArtistForm(props) {
		return a$1("form", {
			className: ADD_FORM_CLASS,
			onSubmit: (event) => {
				event.preventDefault();
				props.onSubmit();
			},
			children: [
				a$1(AutocompleteField, {
					id: ADD_INPUT_ID$1,
					label: UI_TEXT.artistTagLabel,
					value: props.draft,
					suggestions: props.suggestions,
					onChange: props.onDraftChange,
					onSelect: props.onSuggestionSelect
				}),
				a$1(Button, {
					type: "submit",
					variant: "primary",
					children: UI_TEXT.artistAdd
				}),
				props.error.length > 0 ? a$1("p", {
					className: "rdw-error",
					children: props.error
				}) : null
			]
		});
	}
	function FollowingPage() {
		const [artists, setArtists] = d(() => readArtists());
		const [pending, setPending] = d([]);
		const [filter, setFilter] = d("");
		const [draft, setDraft] = d("");
		const [addError, setAddError] = d("");
		const [suggestions, setSuggestions] = d([]);
		const pendingRef = T(pending);
		pendingRef.current = pending;
		const querierRef = T(createAutocompleteQuerier({ preferType: AUTOCOMPLETE_TAG_TYPE_ARTIST }));
		A(() => {
			const querier = querierRef.current;
			return () => {
				querier.cancel();
				for (const entry of pendingRef.current) clearTimeout(entry.timer);
			};
		}, []);
		const clearPendingUnfollow = (tag) => {
			setPending((current) => {
				const index = current.findIndex((entry) => entry.tag === tag);
				if (index < 0) return current;
				const removed = current[index];
				if (removed !== void 0) clearTimeout(removed.timer);
				return current.filter((entry) => entry.tag !== tag);
			});
		};
		const onUnfollow = (tag) => {
			const existing = pendingRef.current.find((entry) => entry.tag === tag);
			if (existing !== void 0) clearTimeout(existing.timer);
			removeArtist(tag);
			const timer = setTimeout(() => {
				clearPendingUnfollow(tag);
				setArtists(readArtists());
			}, UNFOLLOW_UNDO_MS);
			setPending([...pendingRef.current.filter((entry) => entry.tag !== tag), {
				tag,
				timer
			}]);
			setArtists(readArtists());
		};
		const onUndo = (tag) => {
			clearPendingUnfollow(tag);
			try {
				addArtist(tag);
			} catch (error) {
				log.warn("Undo unfollow failed", error);
			}
			setArtists(readArtists());
		};
		const onAdd = () => {
			const normalized = normalizeArtistTag(draft);
			if (normalized === null) {
				setAddError(UI_TEXT.artistInvalid);
				return;
			}
			if (isFollowingArtist(normalized)) {
				setAddError(UI_TEXT.artistDuplicate);
				return;
			}
			try {
				addArtist(normalized);
			} catch (error) {
				const message = error instanceof Error ? error.message : UI_TEXT.artistDuplicate;
				setAddError(message.toLowerCase().includes("duplicate") ? UI_TEXT.artistDuplicate : UI_TEXT.artistInvalid);
				return;
			}
			setDraft("");
			setAddError("");
			setSuggestions([]);
			querierRef.current.cancel();
			setArtists(readArtists());
		};
		const pendingTags = new Set(pending.map((entry) => entry.tag));
		const sorted = [...artists].sort((a, b) => compareArtistTags(a.tag, b.tag));
		const showFilter = sorted.length + pending.length > 12;
		const filterValue = showFilter ? filter.trim().toLowerCase() : "";
		A(() => {
			if (!showFilter && filter.length > 0) setFilter("");
		}, [showFilter, filter]);
		const matchesFilter = (tag) => {
			if (filterValue.length === 0) return true;
			return tag.toLowerCase().includes(filterValue) || displayArtistName(tag).toLowerCase().includes(filterValue);
		};
		const pendingSorted = [...pending].sort((a, b) => compareArtistTags(a.tag, b.tag));
		const seen = getSeenPostId();
		const count = artists.length;
		const empty = sorted.length === 0 && pending.length === 0;
		return a$1($, { children: [a$1("style", { children: FOLLOWING_PAGE_CSS }), a$1(Card, {
			className: PANEL_UI_CLASS.pageCard,
			children: a$1("div", {
				className: PANEL_UI_CLASS.scrollRegion,
				children: [
					a$1("div", {
						className: PANEL_UI_CLASS.artistMeta,
						children: [a$1("p", {
							className: "rdw-hint",
							children: `${String(count)} artist${count === 1 ? "" : "s"}`
						}), a$1("p", {
							className: "rdw-hint",
							children: seen > 0 ? `${UI_TEXT.seenUpTo}${String(seen)}` : UI_TEXT.seenNothing
						})]
					}),
					a$1(AddArtistForm, {
						draft,
						error: addError,
						suggestions,
						onDraftChange: (value) => {
							setDraft(value);
							if (addError.length > 0) setAddError("");
							querierRef.current.query(value, setSuggestions);
						},
						onSuggestionSelect: () => {
							querierRef.current.cancel();
							setSuggestions([]);
						},
						onSubmit: onAdd
					}),
					empty ? a$1($, { children: a$1(EmptyState, {
						title: ARTISTS_EMPTY_TITLE,
						description: ARTISTS_EMPTY_HINT,
						action: a$1(Button, {
							variant: "secondary",
							onClick: () => {
								window.location.assign(OPEN_POSTS_HREF);
							},
							children: OPEN_POSTS_LABEL
						})
					}) }) : a$1($, { children: [showFilter ? a$1("div", {
						className: PANEL_UI_CLASS.artistFilter,
						children: a$1(TextField, {
							id: ARTIST_FILTER_ID,
							label: ARTIST_FILTER_LABEL,
							value: filter,
							onChange: setFilter
						})
					}) : null, a$1("ul", {
						className: PANEL_UI_CLASS.artistList,
						children: [pendingSorted.map((entry) => {
							if (!matchesFilter(entry.tag)) return null;
							return a$1("li", {
								className: PANEL_UI_CLASS.artistRow,
								"data-tag": entry.tag,
								children: a$1("div", {
									className: PANEL_UI_CLASS.artistUndo,
									children: [a$1("span", { children: `${UNFOLLOWED_PREFIX}${displayArtistName(entry.tag)}` }), a$1(Button, {
										variant: "secondary",
										size: "s",
										onClick: () => {
											onUndo(entry.tag);
										},
										children: UNFOLLOW_UNDO_LABEL
									})]
								})
							}, `undo-${entry.tag}`);
						}), sorted.map((artist) => {
							if (pendingTags.has(artist.tag) || !matchesFilter(artist.tag)) return null;
							return a$1("li", {
								className: PANEL_UI_CLASS.artistRow,
								"data-tag": artist.tag,
								children: [a$1("a", {
									className: PANEL_UI_CLASS.artistLink,
									href: buildSearchUrl([{
										tag: artist.tag,
										type: TAG_TYPE_INCLUDE
									}]),
									title: artist.tag,
									children: displayArtistName(artist.tag)
								}), a$1(IconButton, {
									label: `Unfollow ${artist.tag}`,
									onClick: () => {
										onUnfollow(artist.tag);
									},
									children: a$1(IconX, { size: 14 })
								})]
							}, artist.tag);
						})]
					})] })
				]
			})
		})] });
	}
	var PAGE_CONTENT_CSS = `
.${PANEL_UI_CLASS.pageCard} {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}
.${PANEL_UI_CLASS.scrollRegion} {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.${CSS_CLASS.section} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${PANEL_UI_CLASS.settingsGroup} {
  display: grid;
  gap: 2px;
}
.${PANEL_UI_CLASS.settingsRow} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--rdw-radius-m);
  font-size: 12.5px;
}
.${PANEL_UI_CLASS.settingsRow}:nth-child(even) {
  background: var(--rdw-surface-2);
}
.${PANEL_UI_CLASS.settingsRow} .rdw-switch-row {
  width: 100%;
  justify-content: space-between;
  flex-direction: row-reverse;
}
.${PANEL_UI_CLASS.settingsRow} .rdw-select,
.${PANEL_UI_CLASS.settingsRow} .rdw-num {
  width: 100%;
}
.${PANEL_UI_CLASS.artistMeta} {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
}
.${PANEL_UI_CLASS.artistRow} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 6px;
  border-radius: var(--rdw-radius-s);
}
.${PANEL_UI_CLASS.artistRow}:hover {
  background: var(--rdw-surface-2);
}
.${PANEL_UI_CLASS.artistLink} {
  color: var(--rdw-accent);
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
  outline: 2px solid var(--rdw-accent);
  outline-offset: 2px;
}
.${PANEL_UI_CLASS.artistUndo} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  font-size: 12px;
  color: var(--rdw-muted);
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
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-surface);
}
.${CSS_CLASS.itemName} {
  border: 0;
  background: transparent;
  color: var(--rdw-accent);
  text-align: left;
  cursor: pointer;
  padding: 0;
  font: inherit;
  font-weight: 600;
  word-break: break-word;
}
.${CSS_CLASS.itemName}:disabled {
  color: var(--rdw-muted);
  cursor: not-allowed;
}
.${CSS_CLASS.itemActions},
.${CSS_CLASS.formActions},
.${CSS_CLASS.toolbar},
.${CSS_CLASS.confirmRow} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.${CSS_CLASS.form} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${CSS_CLASS.hint} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${CSS_CLASS.error} {
  margin: 0;
  color: var(--rdw-danger);
  font-size: 12px;
}
`.trim();
	var ROOT = `html.${RDW_SKIN_CLASS}`;
	var ROOT_DARK = `${ROOT}[${RDW_THEME_ATTR}="dark"]`;
	var NOT_OUR_CONTROL = `:not([class*="rdw-"]):not(#rdw-search-tools *)`;
	var v = {
		bg: `var(${TOKEN_VAR.bg})`,
		surface: `var(${TOKEN_VAR.surface})`,
		surface2: `var(${TOKEN_VAR.surface2})`,
		border: `var(${TOKEN_VAR.border})`,
		text: `var(${TOKEN_VAR.text})`,
		muted: `var(${TOKEN_VAR.muted})`,
		accent: `var(${TOKEN_VAR.accent})`,
		accentSoft: `var(${TOKEN_VAR.accentSoft})`,
		danger: `var(${TOKEN_VAR.danger})`,
		dangerSoft: `var(${TOKEN_VAR.dangerSoft})`,
		tagArtist: `var(${TOKEN_VAR.tagArtist})`,
		tagCharacter: `var(${TOKEN_VAR.tagCharacter})`,
		tagCopyright: `var(${TOKEN_VAR.tagCopyright})`,
		tagMetadata: `var(${TOKEN_VAR.tagMetadata})`,
		radiusS: `var(${TOKEN_VAR.radiusS})`,
		radiusM: `var(${TOKEN_VAR.radiusM})`,
		radiusL: `var(${TOKEN_VAR.radiusL})`,
		shadow1: `var(${TOKEN_VAR.shadow1})`,
		shadow2: `var(${TOKEN_VAR.shadow2})`,
		font: `var(${TOKEN_VAR.font})`
	};
	var SITE_SKIN_CSS = `
/* —— base —— */
${ROOT} body {
  font-family: ${v.font};
  font-size: 13px;
  line-height: 1.4;
  background: ${v.bg};
  color: ${v.text};
}

${ROOT} body,
${ROOT} body div,
${ROOT} body h1,
${ROOT} body h2,
${ROOT} body h3,
${ROOT} body h4,
${ROOT} body h5,
${ROOT} body h6,
${ROOT} body p,
${ROOT} body ul,
${ROOT} body li,
${ROOT} body dd,
${ROOT} body dt,
${ROOT} body input,
${ROOT} body select,
${ROOT} body button,
${ROOT} body textarea {
  font-family: ${v.font};
}

${ROOT} a:link {
  color: ${v.accent};
  text-decoration: none;
}

${ROOT} a:visited {
  color: ${v.muted};
  text-decoration: none;
}

${ROOT} a:hover,
${ROOT} a:active {
  color: ${v.text};
  text-decoration: none;
}

${ROOT} a.last-page {
  color: ${v.muted};
}

${ROOT} a.spoiler,
${ROOT} span.spoiler {
  color: ${v.text};
  background: ${v.text};
}

${ROOT} a.spoiler:hover,
${ROOT} span.spoiler:hover {
  color: ${v.bg};
  background: ${v.text};
}

${ROOT} hr {
  border-color: ${v.border};
}

${ROOT} code {
  font-family: ui-monospace, monospace;
}

/* —— header —— */
${ROOT} div#header {
  background: ${v.surface};
  border-bottom: 1px solid ${v.border};
  margin-bottom: 0.75em;
}

${ROOT} div#header #site-title {
  background-image: none;
  background-color: transparent;
  padding: 12px 18px 4px 18px;
  font: 800 17px ${v.font};
  letter-spacing: -0.02em;
  color: ${v.text};
}

${ROOT} div#header #site-title a {
  color: ${v.text};
  font-weight: 800;
  background: none;
  text-shadow: none;
}

${ROOT} div#header ul#navbar {
  background: transparent;
  padding: 4px 18px 8px 10px;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

${ROOT} div#header ul#navbar li {
  font-size: 13px;
  font-weight: normal;
  padding: 0;
  margin: 0;
  background: transparent;
  background-image: none;
  list-style: none;
  display: inline;
}

${ROOT} div#header ul#navbar li a {
  display: inline-block;
  padding: 6px 10px;
  border-radius: ${v.radiusM};
  color: ${v.muted};
  font-weight: normal;
}

${ROOT} div#header ul#navbar li.current-page {
  background: transparent;
  background-image: none;
}

${ROOT} div#header ul#navbar li.current-page a,
${ROOT} #navbar li.current-page a {
  background: ${v.accentSoft};
  color: ${v.accent};
  font-weight: 600;
}

${ROOT} div#header ul#subnavbar {
  background: ${v.surface};
  border-top: 1px solid ${v.border};
  border-bottom: none;
  padding: 6px 18px;
  margin: 0;
}

${ROOT} div#header ul#subnavbar li {
  padding: 0 8px;
  font-size: 12.5px;
}

${ROOT} div#header ul#subnavbar li a {
  color: ${v.muted};
}

${ROOT} div#header ul#subnavbar li a:hover {
  color: ${v.accent};
}

${ROOT} div.tips {
  background: ${v.accentSoft};
  background-image: none;
  border-bottom: 1px solid ${v.border};
  color: ${v.text};
}

/* —— sidebar —— */
${ROOT} div.sidebar {
  width: 228px;
  min-width: 228px;
  max-width: 228px;
  margin-right: 1em;
}

${ROOT} div.sidebar h5,
${ROOT} div.sidebar h6,
${ROOT} ul#tag-sidebar h5,
${ROOT} ul#tag-sidebar h6 {
  font: 600 10.5px ${v.font};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${v.muted};
  margin: 0 0 6px;
}

/* Standalone "Tags" (and similar) heading above the list card */
${ROOT} div.sidebar > h5 {
  display: none;
}

${ROOT} div.tag-search,
${ROOT} ul#tag-sidebar {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  padding: 12px;
  box-shadow: ${v.shadow1};
  box-sizing: border-box;
}

${ROOT} div.tag-search {
  margin-bottom: 12px;
}

${ROOT} ul#tag-sidebar {
  margin: 0;
  padding: 12px;
  list-style: none;
}

/*
 * Tag rows: ?/+/- /name (list) or ?/name (post) wrap as inline text;
 * count stays top-right on the first line (artists-sidebar.test markup).
 */
${ROOT} ul#tag-sidebar > li {
  display: block;
  position: relative;
  margin: 0 0 5px;
  padding-right: 4.5em;
  font-size: 12.5px;
  line-height: 1.35;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

${ROOT} ul#tag-sidebar > li > a {
  display: inline;
}

${ROOT} ul#tag-sidebar > li > h5,
${ROOT} ul#tag-sidebar > li > h6 {
  display: block;
  margin-top: 8px;
}

${ROOT} ul#tag-sidebar > li:first-child > h5,
${ROOT} ul#tag-sidebar > li:first-child > h6 {
  margin-top: 0;
}

${ROOT} .tag-count,
${ROOT} span.post-count,
${ROOT} span.tag-count {
  position: absolute;
  top: 0;
  right: 0;
  margin-left: 0;
  color: ${v.muted};
  font-size: 12px;
  line-height: 1.35;
}

/*
 * Tag type color on the LAST link of the row (tag name).
 * List rows: ? + − name — name is 4th. Post rows: ? name — name is 2nd.
 * Operators / wiki stay muted on every page.
 */
${ROOT} ul#tag-sidebar > li[class*="tag-type-"] > a:not(:last-of-type) {
  color: ${v.muted};
  font-size: 11px;
  font-weight: normal;
}

${ROOT} .tag-type-artist > a,
${ROOT} .tag-type-artist {
  color: ${v.tagArtist};
}

${ROOT} .tag-type-character > a,
${ROOT} .tag-type-character {
  color: ${v.tagCharacter};
}

${ROOT} .tag-type-copyright > a,
${ROOT} .tag-type-copyright {
  color: ${v.tagCopyright};
}

${ROOT} .tag-type-metadata > a,
${ROOT} .tag-type-metadata {
  color: ${v.tagMetadata};
}

${ROOT} ul#tag-sidebar > li.tag-type-artist > a:last-of-type {
  color: ${v.tagArtist};
  font-size: 12.5px;
  font-weight: normal;
}

${ROOT} ul#tag-sidebar > li.tag-type-character > a:last-of-type {
  color: ${v.tagCharacter};
  font-size: 12.5px;
  font-weight: normal;
}

${ROOT} ul#tag-sidebar > li.tag-type-copyright > a:last-of-type {
  color: ${v.tagCopyright};
  font-size: 12.5px;
  font-weight: normal;
}

${ROOT} ul#tag-sidebar > li.tag-type-metadata > a:last-of-type {
  color: ${v.tagMetadata};
  font-size: 12.5px;
  font-weight: normal;
}

${ROOT} .tag-type-artist > a:hover,
${ROOT} .tag-type-artist:hover,
${ROOT} .tag-type-character > a:hover,
${ROOT} .tag-type-character:hover,
${ROOT} .tag-type-copyright > a:hover,
${ROOT} .tag-type-copyright:hover,
${ROOT} .tag-type-metadata > a:hover,
${ROOT} .tag-type-metadata:hover,
${ROOT} ul#tag-sidebar > li[class*="tag-type-"] > a:last-of-type:hover {
  color: ${v.accent};
}

/* —— search field —— */
${ROOT} div.tag-search input[type="text"],
${ROOT} div.tag-search input[type="search"] {
  width: 100%;
  height: 34px;
  box-sizing: border-box;
  border: 1px solid ${v.border};
  border-radius: ${v.radiusM};
  padding: 0 10px;
  background: ${v.surface};
  color: ${v.text};
  font-size: 13px;
}

${ROOT} div.tag-search input[type="submit"],
${ROOT} div.tag-search button[type="submit"] {
  width: 100%;
  box-sizing: border-box;
  margin-top: 8px;
  padding: 6px 12px;
  border: none;
  border-radius: ${v.radiusS};
  background: ${v.accent};
  color: ${v.surface};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

${ROOT} div.tag-search input[type="submit"]:hover,
${ROOT} div.tag-search button[type="submit"]:hover {
  filter: brightness(1.05);
}

${ROOT} input[type="text"]${NOT_OUR_CONTROL}:focus,
${ROOT} input[type="password"]${NOT_OUR_CONTROL}:focus,
${ROOT} input[type="search"]${NOT_OUR_CONTROL}:focus,
${ROOT} textarea${NOT_OUR_CONTROL}:focus,
${ROOT} select${NOT_OUR_CONTROL}:focus {
  background: ${v.surface};
  outline: 2px solid ${v.accent};
  outline-offset: 1px;
  border-color: ${v.accent};
}

/* —— awesomplete —— */
/* Site hides closed lists with opacity/scale + display:block; do not undo that. */
${ROOT} .awesomplete > ul[hidden],
${ROOT} .awesomplete > ul:empty {
  display: none !important;
  pointer-events: none;
}

${ROOT} .awesomplete > ul:not([hidden]):not(:empty) {
  background: ${v.surface};
  background-image: none;
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  box-shadow: ${v.shadow2};
  margin: 0.35em 0 0;
  padding: 4px 0;
  text-shadow: none;
  transform: none;
}

${ROOT} .awesomplete > ul:before {
  display: none;
  content: none;
}

${ROOT} .awesomplete > ul > li {
  padding: 6px 10px;
  color: ${v.text};
  cursor: pointer;
}

${ROOT} .awesomplete > ul > li:hover,
${ROOT} .awesomplete > ul > li[aria-selected="true"] {
  background: ${v.accentSoft};
  color: ${v.accent};
}

${ROOT} .awesomplete mark {
  background: ${v.accentSoft};
  color: ${v.text};
}

${ROOT} div.auto_complete {
  background: ${v.surface};
}

${ROOT} div.auto_complete ul {
  border-color: ${v.border};
  background: ${v.surface};
}

${ROOT} div.auto_complete ul li.selected {
  background-color: ${v.accentSoft};
}

${ROOT} div.auto_complete ul strong.highlight {
  color: ${v.accent};
}

/* —— grid / thumbs (cell size unchanged) —— */
${ROOT} div.image-list {
  gap: 12px;
  align-items: flex-start;
  align-content: flex-start;
}

${ROOT} img.preview {
  border-radius: ${v.radiusL};
}

/* Favorites: Remove stays subtle; hover must not paint the thumb cell */
${ROOT} span.thumb,
${ROOT} span.thumb:hover,
${ROOT} span.thumb > a,
${ROOT} span.thumb > a:hover {
  background-color: transparent;
}

${ROOT} span.thumb > a[onclick] {
  color: ${v.muted};
  font-size: 12px;
  font-weight: normal;
  padding: 2px 8px;
  border-radius: ${v.radiusS};
  background: transparent;
  border: none;
}

${ROOT} span.thumb > a[onclick]:hover {
  color: ${v.danger};
  background: transparent;
}

${ROOT} span.thumb > a[onclick] b {
  font-weight: normal;
  color: inherit;
}

${ROOT} .webm-thumb {
  border: 1px solid ${v.accent};
  box-sizing: border-box;
}

${ROOT} img.flagged,
${ROOT} img.has-children,
${ROOT} img.has-parent,
${ROOT} img.pending,
${ROOT} img.video {
  border-width: 1px;
  border-style: solid;
  box-sizing: border-box;
}

${ROOT} img.flagged {
  border-color: ${v.danger};
}

${ROOT} img.has-children {
  border-color: ${v.tagCharacter};
}

${ROOT} img.has-parent {
  border-color: ${v.tagMetadata};
}

${ROOT} img.pending,
${ROOT} img.video {
  border-color: ${v.accent};
}

/* —— pagination —— */
${ROOT} div#paginator,
${ROOT} .pagination {
  display: block;
  padding: 1.5em 0 1em;
  text-align: center;
  clear: both;
}

${ROOT} div#paginator a,
${ROOT} .pagination a {
  display: inline-block;
  margin: 0 3px;
  padding: 4px 10px;
  border: 1px solid ${v.border};
  border-radius: ${v.radiusM};
  background: ${v.surface};
  color: ${v.text};
  text-decoration: none;
}

${ROOT} div#paginator a:hover,
${ROOT} .pagination a:hover {
  background: ${v.accentSoft};
  color: ${v.accent};
  border-color: ${v.accent};
}

${ROOT} div#paginator a.current,
${ROOT} div#paginator span.current,
${ROOT} .pagination a.current,
${ROOT} .pagination span.current {
  background: ${v.accent};
  border-color: ${v.accent};
  color: ${v.surface};
  font-weight: 600;
}

${ROOT} div#paginator span {
  margin: 0 3px;
  padding: 4px 8px;
}

${ROOT} .manual-page-chooser > input[type="text"] {
  width: 4em;
  height: 28px;
  border: 1px solid ${v.border};
  border-radius: ${v.radiusS};
  background: ${v.surface};
  color: ${v.text};
  padding: 0 6px;
}

${ROOT} .manual-page-chooser > input[type="submit"] {
  height: 28px;
  margin-left: 4px;
  padding: 0 10px;
  border: none;
  border-radius: ${v.radiusS};
  background: ${v.accent};
  color: ${v.surface};
  font-weight: 600;
  cursor: pointer;
}

/* —— forms / tables (site chrome; skip search-tools + any .rdw-* control) —— */
${ROOT} input${NOT_OUR_CONTROL},
${ROOT} select${NOT_OUR_CONTROL},
${ROOT} textarea${NOT_OUR_CONTROL},
${ROOT} button${NOT_OUR_CONTROL} {
  color: ${v.text};
  font-family: ${v.font};
}

${ROOT} input[type="text"]${NOT_OUR_CONTROL},
${ROOT} input[type="password"]${NOT_OUR_CONTROL},
${ROOT} input[type="search"]${NOT_OUR_CONTROL},
${ROOT} input[type="number"]${NOT_OUR_CONTROL},
${ROOT} select${NOT_OUR_CONTROL},
${ROOT} textarea${NOT_OUR_CONTROL} {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusS};
  color: ${v.text};
}

${ROOT} button${NOT_OUR_CONTROL},
${ROOT} input[type="submit"]${NOT_OUR_CONTROL},
${ROOT} input[type="button"]${NOT_OUR_CONTROL},
${ROOT} .gdprbutton button {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusS};
  color: ${v.text};
  padding: 4px 10px;
  cursor: pointer;
}

${ROOT} button${NOT_OUR_CONTROL}:hover,
${ROOT} input[type="submit"]${NOT_OUR_CONTROL}:hover,
${ROOT} input[type="button"]${NOT_OUR_CONTROL}:hover,
${ROOT} .gdprbutton button:hover {
  background: ${v.accentSoft};
  border-color: ${v.accent};
  color: ${v.accent};
}

/* Keep search submit as primary accent (overrides generic button chrome) */
${ROOT} div.tag-search input[type="submit"],
${ROOT} div.tag-search button[type="submit"],
${ROOT} .manual-page-chooser > input[type="submit"] {
  background: ${v.accent};
  border: none;
  color: ${v.surface};
  font-weight: 600;
}

${ROOT} div.tag-search input[type="submit"]:hover,
${ROOT} div.tag-search button[type="submit"]:hover,
${ROOT} .manual-page-chooser > input[type="submit"]:hover {
  background: ${v.accent};
  border: none;
  color: ${v.surface};
  filter: brightness(1.05);
}

${ROOT} table {
  color: ${v.text};
}

${ROOT} tr.tableheader,
${ROOT} thead tr {
  background: ${v.surface2} !important;
  background-image: none !important;
  color: ${v.text};
}

${ROOT} table.highlightable th {
  color: ${v.text};
  background: ${v.surface2};
}

${ROOT} table.highlightable td {
  border-color: ${v.border};
}

${ROOT} table.highlightable > tbody > tr:hover {
  background: ${v.accentSoft};
}

${ROOT} table tr.good {
  background: ${v.accentSoft};
}

${ROOT} table tr.selected {
  background: ${v.accentSoft} !important;
}

${ROOT} table tr.highlight {
  background: ${v.surface2};
}

${ROOT} table tr.pending-tag {
  background: ${v.surface2};
}

/* Zebra without native green tint */
${ROOT} table tr:nth-child(odd) {
  background: ${v.surface2};
}

${ROOT} table.form th {
  color: ${v.muted};
}

/* Forum tables */
${ROOT} div#forum > table {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  box-shadow: ${v.shadow1};
}

${ROOT} div#forum > table th,
${ROOT} div#forum > table td {
  border-color: ${v.border};
  color: ${v.text};
}

${ROOT} div#forum > table th:first-child,
${ROOT} div#forum > table td:first-child {
  text-align: left;
}

${ROOT} div#forum > table tr:nth-child(odd) {
  background: ${v.surface2};
}

${ROOT} div#forum > table tr:nth-child(even) {
  background: ${v.surface};
}

${ROOT} div#forum > table.highlightable > tbody > tr:hover {
  background: ${v.accentSoft};
}

${ROOT} .added-tags {
  color: ${v.tagCharacter};
}

${ROOT} .removed-tags {
  color: ${v.danger};
}

${ROOT} .obsolete-tag-change {
  color: ${v.text};
}

/* —— notices / cards —— */
${ROOT} div.status-notice,
${ROOT} div.notice,
${ROOT} div.has-mail,
${ROOT} div.blocked,
${ROOT} div.quote,
${ROOT} div.help div.code,
${ROOT} div#post-comments div#comment-list > div,
${ROOT} div#comments div#comment-list > div.post > div.col2,
${ROOT} div.response-list > div.post > div.content {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  box-shadow: ${v.shadow1};
}

${ROOT} div.status-notice {
  border-color: ${v.border};
  padding: 1em;
  margin: 1em;
  color: ${v.text};
}

${ROOT} div.notice {
  color: ${v.danger};
  padding: 0.75em 1em;
  margin-bottom: 1em;
}

${ROOT} div.has-mail {
  border-color: ${v.tagCharacter};
  background: ${v.accentSoft};
  padding: 1em;
  margin: 1em;
  color: ${v.text};
}

${ROOT} div.blocked {
  border-color: ${v.danger};
  background: ${v.dangerSoft};
  color: ${v.danger};
  padding: 1em;
  margin: 1em;
}

${ROOT} div.quote {
  border-color: ${v.border};
  background: ${v.surface2};
  background-image: none;
  color: ${v.text};
  padding: 12px;
  margin-top: 10px;
}

${ROOT} div.help div.code {
  border: 1px dashed ${v.border};
  background: ${v.surface2};
  color: ${v.text};
}

${ROOT} div.help h4 {
  color: ${v.tagCharacter};
}

${ROOT} div#post-comments div#comment-list > div,
${ROOT} div#comments div#comment-list > div.post > div.col2 {
  padding: 12px;
  margin-bottom: 1em;
}

${ROOT} div.response-list > div.post > div.content {
  padding: 10px 12px;
}

${ROOT} div.response-list > div.post > div.content > div.footer {
  color: ${v.muted};
  margin-top: 0.75em;
}

/* Edit | Respond (and similar) on comments / forum posts */
${ROOT} div.response-list > div.post > div.content > div.footer a,
${ROOT} ul.flat-list li a {
  color: ${v.muted};
  font-weight: normal;
  padding: 2px 6px;
  border-radius: ${v.radiusS};
}

${ROOT} div.response-list > div.post > div.content > div.footer a:hover,
${ROOT} ul.flat-list li a:hover {
  color: ${v.accent};
  background: ${v.accentSoft};
}

${ROOT} ul.flat-list li a.forum-update {
  font-style: italic;
  color: ${v.muted};
}

${ROOT} div.link-list ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

${ROOT} div.link-list li {
  margin: 0 0 4px;
}

${ROOT} div.link-list a {
  display: inline-block;
  padding: 4px 8px;
  border-radius: ${v.radiusS};
  color: ${v.muted};
}

${ROOT} div.link-list a:hover {
  color: ${v.accent};
  background: ${v.accentSoft};
}

${ROOT} span.author,
${ROOT} span.date {
  color: ${v.muted};
}

${ROOT} span.locked-topic {
  color: ${v.muted};
}

${ROOT} strong.divider {
  color: ${v.muted};
}

${ROOT} div#footer {
  color: ${v.muted};
}

${ROOT} div#footer > .footer-disabled,
${ROOT} div#footer > #label {
  color: ${v.muted};
}

${ROOT} div#user-record > table > tbody > tr.positive-record {
  background: ${v.accentSoft};
}

${ROOT} div#user-record > table > tbody > tr.negative-record {
  background: ${v.dangerSoft};
}

${ROOT} div.mailbody {
  background-color: ${v.surface};
  border-color: ${v.border};
}

${ROOT} div.mail .received {
  color: ${v.tagCharacter};
}

${ROOT} div.mail .sent {
  color: ${v.danger};
}

${ROOT} .gdprinner {
  background-color: ${v.surface};
  border-color: ${v.border};
  color: ${v.text};
}

/* —— post page —— */
${ROOT} img#image {
  border-radius: ${v.radiusL};
}

${ROOT} div#post-view > div#right-col > div#edit,
${ROOT} div#edit-box {
  background: ${v.surface};
  border: 1px solid ${v.border};
  border-radius: ${v.radiusL};
  color: ${v.text};
}

${ROOT} div#note-container > div.note-body {
  background: ${v.surface};
  border: 1px solid ${v.border};
  color: ${v.text};
  border-radius: ${v.radiusS};
}

${ROOT} div#note-container > div.note-body > p.tn,
${ROOT} tn {
  color: ${v.muted};
}

${ROOT} div#note-container > div.note-box {
  border-color: ${v.accent};
  background: ${v.accentSoft};
}

${ROOT} div#note-container > div.note-box > div.note-corner {
  background: ${v.accent};
}

${ROOT} div#note-container > div.unsaved {
  background: ${v.surface};
  border-color: ${v.danger};
}

${ROOT} div#note-container > div.unsaved > div.note-corner {
  background: ${v.danger};
}

${ROOT} a.original-file-changed#highres {
  color: ${v.accent};
}

${ROOT} div#post-add p#scale {
  color: ${v.muted};
}

${ROOT} h2.wiki-title {
  color: ${v.accent};
}

${ROOT} div.wiki > h2.title {
  color: ${v.accent};
}

${ROOT} div#wiki-show > div#body > div#byline {
  color: ${v.muted};
}

${ROOT} div#wiki-diff del {
  background-color: ${v.dangerSoft};
  color: ${v.danger};
}

${ROOT} div#wiki-diff ins {
  background-color: ${v.accentSoft};
  color: ${v.text};
}

${ROOT} dt.bad {
  color: ${v.danger};
}

${ROOT} .blacklisted-tags-disabled {
  color: ${v.muted} !important;
}

/* —— dark theme contrast (tokens already dark; keep chrome readable) —— */
${ROOT_DARK} a:visited {
  color: ${v.muted};
}

${ROOT_DARK} a:hover,
${ROOT_DARK} a:active {
  color: ${v.text};
}

${ROOT_DARK} a.spoiler,
${ROOT_DARK} span.spoiler {
  color: ${v.bg};
  background: ${v.text};
}

${ROOT_DARK} a.spoiler:hover,
${ROOT_DARK} span.spoiler:hover {
  color: ${v.text};
  background: ${v.muted};
}

${ROOT_DARK} div#paginator a.current,
${ROOT_DARK} div#paginator span.current,
${ROOT_DARK} .pagination a.current,
${ROOT_DARK} .pagination span.current,
${ROOT_DARK} div.tag-search input[type="submit"],
${ROOT_DARK} div.tag-search button[type="submit"],
${ROOT_DARK} .manual-page-chooser > input[type="submit"] {
  color: ${v.text};
}

${ROOT_DARK} div.has-mail {
  background: ${v.surface2};
  border-color: ${v.tagCharacter};
}

/*
 * Script page host sits on site bg for Site default / Site dark (no html.rdw-skin).
 * Color uses document tokens; Shadow title inherits from the host once tokens sync.
 */
#${RDW_PAGE_ROOT_ID} {
  color: ${v.text};
}
`.trim();
	function getSiteSkinCss() {
		return SITE_SKIN_CSS;
	}
	var MS_PER_DAY = 864e5;
	var COOKIE_NAME_VALUE_SEPARATOR = "=";
	var STYLESHEET_REL = "stylesheet";
	var LIGHT_STYLESHEET_PATH = `${SITE_THEME_STYLESHEET_DIR}${SITE_THEME_STYLESHEET_LIGHT}`;
	var DARK_STYLESHEET_PATH = `${SITE_THEME_STYLESHEET_DIR}${SITE_THEME_STYLESHEET_DARK}`;
	function writeThemeCookie(value, expires) {
		document.cookie = [
			`${SITE_THEME_COOKIE_NAME}${COOKIE_NAME_VALUE_SEPARATOR}${value}`,
			`expires=${expires.toUTCString()}`,
			`path=/`
		].join("; ");
	}
	function clearSiteThemeCookie() {
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
	function applySiteDesktopStylesheet(theme) {
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
	function forceLightSiteBase() {
		clearSiteThemeCookie();
		applySiteDesktopStylesheet("light");
	}
	function setSiteTheme(theme) {
		if (theme === "dark") writeThemeCookie(SITE_THEME_COOKIE_VALUE_DARK, new Date(Date.now() + 365 * MS_PER_DAY));
		else clearSiteThemeCookie();
		applySiteDesktopStylesheet(theme);
	}
	var BACKGROUND_DIM_MAX = .8;
	var APPEARANCE_BACKGROUND_JPEG_QUALITY = .85;
	var JPEG_MIME = "image/jpeg";
	var BODY_BG_IMAGE = "background-image";
	var BODY_BG_SIZE = "background-size";
	var BODY_BG_POSITION = "background-position";
	var BODY_BG_REPEAT = "background-repeat";
	var BODY_BG_ATTACHMENT = "background-attachment";
	function createDefaultCustomTheme() {
		return {
			base: APPEARANCE_CUSTOM_BASE_LIGHT,
			backgroundDim: 0
		};
	}
	function clampBackgroundDim(value) {
		if (!Number.isFinite(value)) return 0;
		return Math.min(BACKGROUND_DIM_MAX, Math.max(0, value));
	}
	function escapeUrlForCss(url) {
		return url.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
	}
	function clearBodyBackground() {
		const body = document.body;
		if (body === null) return;
		body.style.removeProperty(BODY_BG_IMAGE);
		body.style.removeProperty(BODY_BG_SIZE);
		body.style.removeProperty(BODY_BG_POSITION);
		body.style.removeProperty(BODY_BG_REPEAT);
		body.style.removeProperty(BODY_BG_ATTACHMENT);
	}
	function applyBodyBackgroundImage(imageUrl, dim) {
		const body = document.body;
		if (body === null) return;
		if (imageUrl === void 0 || imageUrl.length === 0) {
			clearBodyBackground();
			return;
		}
		const clamped = clampBackgroundDim(dim);
		const escaped = escapeUrlForCss(imageUrl);
		body.style.setProperty(BODY_BG_IMAGE, `linear-gradient(rgba(0, 0, 0, ${String(clamped)}), rgba(0, 0, 0, ${String(clamped)})), url("${escaped}")`);
		body.style.setProperty(BODY_BG_SIZE, "cover");
		body.style.setProperty(BODY_BG_POSITION, "center");
		body.style.setProperty(BODY_BG_REPEAT, "no-repeat");
		body.style.setProperty(BODY_BG_ATTACHMENT, "fixed");
	}
	function syncSiteCookieAndStylesheet(appearance) {
		if (appearance.theme === "site-dark") {
			setSiteTheme("dark");
			return;
		}
		if (appearance.theme === "site") {
			setSiteTheme("light");
			return;
		}
		forceLightSiteBase();
	}
	function getScreenPixelSize() {
		const dpr = Number.isFinite(window.devicePixelRatio) && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
		return {
			width: Math.round(window.screen.width * dpr),
			height: Math.round(window.screen.height * dpr)
		};
	}
	function computeDownscaleSize(sourceWidth, sourceHeight, maxWidth, maxHeight) {
		if (!Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight) || sourceWidth <= 0 || sourceHeight <= 0) return {
			width: 0,
			height: 0
		};
		if (sourceWidth <= maxWidth && sourceHeight <= maxHeight) return {
			width: Math.round(sourceWidth),
			height: Math.round(sourceHeight)
		};
		const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
		return {
			width: Math.max(1, Math.round(sourceWidth * scale)),
			height: Math.max(1, Math.round(sourceHeight * scale))
		};
	}
	function loadImageElement(src) {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.onload = () => {
				resolve(image);
			};
			image.onerror = () => {
				reject(new Error("Could not decode image"));
			};
			image.src = src;
		});
	}
	function readFileAsDataUrl(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result === "string") {
					resolve(reader.result);
					return;
				}
				reject(new Error("Could not read image file"));
			};
			reader.onerror = () => {
				reject(reader.error ?? new Error("Could not read image file"));
			};
			reader.readAsDataURL(file);
		});
	}
	async function prepareBackgroundImageFile(file) {
		const image = await loadImageElement(await readFileAsDataUrl(file));
		const sourceWidth = image.naturalWidth;
		const sourceHeight = image.naturalHeight;
		const screen = getScreenPixelSize();
		const sized = computeDownscaleSize(sourceWidth, sourceHeight, screen.width, screen.height);
		const canvas = document.createElement("canvas");
		canvas.width = sized.width;
		canvas.height = sized.height;
		const context = canvas.getContext("2d");
		if (context === null) throw new Error("Could not prepare background image");
		context.drawImage(image, 0, 0, sized.width, sized.height);
		return {
			dataUrl: canvas.toDataURL(JPEG_MIME, APPEARANCE_BACKGROUND_JPEG_QUALITY),
			sourceWidth,
			sourceHeight,
			outputWidth: sized.width,
			outputHeight: sized.height,
			belowScreen: sourceWidth < screen.width || sourceHeight < screen.height
		};
	}
	function applyAppearanceTheme(options) {
		const { appearance } = options;
		syncSiteCookieAndStylesheet(appearance);
		applyAppearanceToDocument({
			appearance,
			siteSkinCss: options.siteSkinCss ?? getSiteSkinCss(),
			...options.backgroundDataUrl !== void 0 ? { backgroundDataUrl: options.backgroundDataUrl } : {}
		});
		if (!themeEnablesSkin(appearance.theme)) document.documentElement.classList.remove(RDW_SKIN_CLASS);
		if (appearance.theme === "custom" && appearance.custom !== void 0) {
			const custom = appearance.custom;
			applyBodyBackgroundImage(options.backgroundDataUrl ?? custom.backgroundImage, custom.backgroundDim ?? 0);
			if (custom.backgroundDim !== void 0) document.documentElement.style.setProperty(TOKEN_VAR.backgroundDim, String(clampBackgroundDim(custom.backgroundDim)));
		} else clearBodyBackground();
		return {
			contrastWarning: false,
			contrastRatio: null
		};
	}
	var GRID_FEATURE_ID = gridDensityFeature.id;
	var THEME_OPTIONS = [
		{
			value: APPEARANCE_THEME_SITE,
			label: "Site default"
		},
		{
			value: APPEARANCE_THEME_SITE_DARK,
			label: "Site dark"
		},
		{
			value: APPEARANCE_THEME_LIGHT,
			label: "Light"
		},
		{
			value: APPEARANCE_THEME_DARK,
			label: "Dark"
		},
		{
			value: APPEARANCE_THEME_CUSTOM,
			label: "Custom"
		}
	];
	var GRID_OPTIONS = [
		{
			value: "default",
			label: "Default"
		},
		{
			value: "compact",
			label: "Compact"
		},
		{
			value: "large",
			label: "Large"
		},
		{
			value: "masonry",
			label: "Masonry"
		}
	];
	var BASE_OPTIONS = [{
		value: APPEARANCE_CUSTOM_BASE_LIGHT,
		label: "Light"
	}, {
		value: APPEARANCE_CUSTOM_BASE_DARK,
		label: "Dark"
	}];
	var SECTION_TITLE = "Appearance";
	var THEME_ROW_LABEL = "Site theme";
	var THEME_ROW_HINT = "Light, dark or your own";
	var BASE_ROW_LABEL = "Base";
	var BG_IMAGE_LABEL = "Background image";
	var BG_IMAGE_HINT = "From a link or a file";
	var BG_URL_PLACEHOLDER = "https://… or data URL";
	var BG_DIM_LABEL = "Dim";
	var CHOOSE_LABEL = "Choose…";
	var REMOVE_LABEL = "Remove";
	var RESET_LABEL = "Reset to defaults";
	var GRID_ROW_LABEL = "Grid";
	var SCREEN_HINT_PREFIX = "For this screen use at least ";
	var IMAGE_SIZE_PREFIX = "Image size: ";
	var IMAGE_TOO_SMALL_WARN = "This image is smaller than your screen; it may look soft when stretched.";
	var ACCEPT_IMAGE = "image/*";
	var APPEARANCE_SECTION_CSS = `
${KIT_FOCUS_CSS}
.rdw-appearance {
  display: grid;
  gap: 2px;
}
.rdw-appearance__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--rdw-radius-m);
  font-size: 12.5px;
  color: var(--rdw-text);
}
.rdw-appearance__row--top {
  align-items: flex-start;
}
.rdw-appearance__row:nth-child(even) {
  background: var(--rdw-surface-2);
}
.rdw-appearance__row-text {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.rdw-appearance__row-text small {
  color: var(--rdw-muted);
  font-size: 11px;
}
.rdw-appearance__select {
  width: 110px;
  flex: none;
}
.rdw-appearance__base {
  width: 140px;
  flex: none;
}
.rdw-appearance__bg {
  display: grid;
  gap: 6px;
  width: 100%;
}
.rdw-appearance__bg-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.rdw-appearance__dim {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--rdw-muted);
}
.rdw-appearance__dim input[type="range"] {
  flex: 1;
  min-width: 80px;
  accent-color: var(--rdw-accent);
}
.rdw-appearance__hint {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 11px;
}
.rdw-appearance__warn {
  margin: 0;
  padding: 6px 8px;
  border-radius: var(--rdw-radius-m);
  background: var(--rdw-danger-soft);
  color: var(--rdw-danger);
  font-size: 12px;
}
.rdw-appearance__file {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
.rdw-appearance__footer {
  display: flex;
  justify-content: flex-end;
  padding: 4px 8px 0;
}
`;
	function resolveGridChoice() {
		const stored = getFeatureChoiceValue(GRID_FEATURE_ID);
		const options = gridDensityFeature.choice?.options ?? [];
		if (stored !== void 0 && options.some((option) => option.value === stored)) return stored;
		return gridDensityFeature.choice?.defaultValue ?? "default";
	}
	function ensureCustom(appearance) {
		return appearance.custom ?? createDefaultCustomTheme();
	}
	function persistAndApply(appearance) {
		const parsed = setAppearance(appearance);
		const backgroundDataUrl = getAppearanceBackgroundDataUrl();
		applyAppearanceTheme({
			appearance: parsed,
			siteSkinCss: getSiteSkinCss(),
			...backgroundDataUrl !== void 0 ? { backgroundDataUrl } : {}
		});
	}
	function formatScreenHint() {
		const screen = getScreenPixelSize();
		return `${SCREEN_HINT_PREFIX}${String(screen.width)}x${String(screen.height)}`;
	}
	function AppearanceSection(props) {
		const fileInputId = P();
		const fileRef = T(null);
		const [appearance, setAppearanceState] = d(() => getAppearance());
		const [gridValue, setGridValue] = d(() => resolveGridChoice());
		const [bgUrlDraft, setBgUrlDraft] = d(() => {
			return getAppearance().custom?.backgroundImage ?? "";
		});
		const [fileError, setFileError] = d("");
		const [imageMeta, setImageMeta] = d(null);
		const [screenHint] = d(() => formatScreenHint());
		const custom = ensureCustom(appearance);
		const isCustom = appearance.theme === APPEARANCE_THEME_CUSTOM;
		const hasBackground = (getAppearanceBackgroundDataUrl()?.length ?? 0) > 0 || (custom.backgroundImage?.length ?? 0) > 0 || bgUrlDraft.length > 0;
		function commitAppearance(next) {
			setAppearanceState(next);
			persistAndApply(next);
			setFileError("");
		}
		function onThemeChange(value) {
			const parsed = AppearanceThemeSchema.safeParse(value);
			if (!parsed.success) return;
			const theme = parsed.data;
			if (theme === "custom") {
				commitAppearance({
					theme,
					custom: ensureCustom(appearance)
				});
				return;
			}
			commitAppearance({ theme });
		}
		function onBaseChange(value) {
			if (value !== "light" && value !== "dark") return;
			const base = value;
			const current = ensureCustom(getAppearance());
			commitAppearance({
				theme: APPEARANCE_THEME_CUSTOM,
				custom: {
					base,
					backgroundDim: clampBackgroundDim(current.backgroundDim ?? 0),
					...current.backgroundImage !== void 0 ? { backgroundImage: current.backgroundImage } : {}
				}
			});
		}
		function onBgUrlCommit(url) {
			const trimmed = url.trim();
			setBgUrlDraft(trimmed);
			setImageMeta(null);
			const base = ensureCustom(getAppearance());
			const nextCustom = {
				base: base.base,
				backgroundDim: clampBackgroundDim(base.backgroundDim ?? 0),
				...trimmed.length > 0 ? { backgroundImage: trimmed } : {}
			};
			if (trimmed.length > 0) clearAppearanceBackgroundDataUrl();
			commitAppearance({
				theme: APPEARANCE_THEME_CUSTOM,
				custom: nextCustom
			});
		}
		function onDimChange(raw) {
			const dim = clampBackgroundDim(raw);
			const base = ensureCustom(getAppearance());
			commitAppearance({
				theme: APPEARANCE_THEME_CUSTOM,
				custom: {
					base: base.base,
					backgroundDim: dim,
					...base.backgroundImage !== void 0 ? { backgroundImage: base.backgroundImage } : {}
				}
			});
		}
		async function onFileSelected(file) {
			if (file === void 0) return;
			try {
				const prepared = await prepareBackgroundImageFile(file);
				setAppearanceBackgroundDataUrl(prepared.dataUrl);
				setBgUrlDraft("");
				setImageMeta({
					width: prepared.sourceWidth,
					height: prepared.sourceHeight,
					belowScreen: prepared.belowScreen
				});
				const base = ensureCustom(getAppearance());
				commitAppearance({
					theme: APPEARANCE_THEME_CUSTOM,
					custom: {
						base: base.base,
						backgroundDim: clampBackgroundDim(base.backgroundDim ?? 0)
					}
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : "Could not read image file";
				setFileError(message);
			}
		}
		function onRemoveBackground() {
			clearAppearanceBackgroundDataUrl();
			setBgUrlDraft("");
			setImageMeta(null);
			commitAppearance({
				theme: APPEARANCE_THEME_CUSTOM,
				custom: {
					base: ensureCustom(getAppearance()).base,
					backgroundDim: 0
				}
			});
		}
		function onResetDefaults() {
			clearAppearanceBackgroundDataUrl();
			setBgUrlDraft("");
			setImageMeta(null);
			commitAppearance({
				theme: APPEARANCE_THEME_CUSTOM,
				custom: createDefaultCustomTheme()
			});
		}
		function onGridChange(value) {
			setGridValue(value);
			setFeatureChoiceValue(GRID_FEATURE_ID, value);
			applyCssOnlyFeatureChoice(GRID_FEATURE_ID, value);
		}
		const className = ["rdw-appearance", props.className].filter((part) => part !== void 0 && part.length > 0).join(" ");
		return a$1($, { children: [a$1("style", { children: APPEARANCE_SECTION_CSS }), a$1("section", {
			className,
			"aria-label": SECTION_TITLE,
			children: [
				a$1(SectionLabel, { children: SECTION_TITLE }),
				a$1("div", {
					className: "rdw-appearance__row",
					children: [a$1("div", {
						className: "rdw-appearance__row-text",
						children: [a$1("span", { children: THEME_ROW_LABEL }), a$1("small", { children: THEME_ROW_HINT })]
					}), a$1(Select, {
						className: "rdw-appearance__select",
						options: THEME_OPTIONS,
						value: appearance.theme,
						onChange: onThemeChange
					})]
				}),
				isCustom ? a$1($, { children: [
					a$1("div", {
						className: "rdw-appearance__row",
						children: [a$1("div", {
							className: "rdw-appearance__row-text",
							children: a$1("span", { children: BASE_ROW_LABEL })
						}), a$1(Segmented, {
							className: "rdw-appearance__base",
							options: BASE_OPTIONS,
							value: custom.base,
							label: BASE_ROW_LABEL,
							onChange: onBaseChange
						})]
					}),
					a$1("div", {
						className: "rdw-appearance__row rdw-appearance__row--top",
						children: [a$1("div", {
							className: "rdw-appearance__row-text",
							children: [a$1("span", { children: BG_IMAGE_LABEL }), a$1("small", { children: BG_IMAGE_HINT })]
						}), a$1("div", {
							className: "rdw-appearance__bg",
							onFocusOut: (event) => {
								const root = event.currentTarget;
								const next = event.relatedTarget;
								if (next instanceof Node && root.contains(next)) return;
								onBgUrlCommit(bgUrlDraft);
							},
							children: [
								a$1(TextField, {
									value: bgUrlDraft,
									placeholder: BG_URL_PLACEHOLDER,
									"aria-label": BG_IMAGE_LABEL,
									onChange: (value) => {
										setBgUrlDraft(value);
									}
								}),
								a$1("div", {
									className: "rdw-appearance__bg-actions",
									children: [
										a$1(Button, {
											variant: "secondary",
											size: "s",
											onClick: () => {
												fileRef.current?.click();
											},
											children: CHOOSE_LABEL
										}),
										hasBackground ? a$1(Button, {
											variant: "ghost",
											size: "s",
											onClick: onRemoveBackground,
											children: REMOVE_LABEL
										}) : null,
										a$1("input", {
											ref: fileRef,
											id: fileInputId,
											className: "rdw-appearance__file",
											type: "file",
											accept: ACCEPT_IMAGE,
											"aria-hidden": "true",
											tabIndex: -1,
											onChange: (event) => {
												const file = event.currentTarget.files?.[0];
												onFileSelected(file);
												event.currentTarget.value = "";
											}
										})
									]
								}),
								a$1("p", {
									className: "rdw-appearance__hint",
									children: screenHint
								}),
								imageMeta !== null ? a$1("p", {
									className: "rdw-appearance__hint",
									children: [
										IMAGE_SIZE_PREFIX,
										String(imageMeta.width),
										"x",
										String(imageMeta.height)
									]
								}) : null,
								imageMeta?.belowScreen === true ? a$1("div", {
									className: "rdw-appearance__warn",
									role: "status",
									children: IMAGE_TOO_SMALL_WARN
								}) : null,
								hasBackground ? a$1("label", {
									className: "rdw-appearance__dim",
									children: [
										a$1("span", { children: BG_DIM_LABEL }),
										a$1("input", {
											type: "range",
											min: 0,
											max: .8,
											step: .05,
											value: custom.backgroundDim ?? 0,
											"aria-label": BG_DIM_LABEL,
											onInput: (event) => {
												onDimChange(Number(event.currentTarget.value));
											}
										}),
										a$1("span", { children: String(clampBackgroundDim(custom.backgroundDim ?? 0)) })
									]
								}) : null,
								fileError.length > 0 ? a$1("div", {
									className: "rdw-appearance__warn",
									role: "status",
									children: fileError
								}) : null
							]
						})]
					}),
					a$1("div", {
						className: "rdw-appearance__footer",
						children: a$1(Button, {
							variant: "ghost",
							size: "s",
							onClick: onResetDefaults,
							children: RESET_LABEL
						})
					})
				] }) : null,
				a$1("div", {
					className: "rdw-appearance__row",
					children: [a$1("div", {
						className: "rdw-appearance__row-text",
						children: a$1("span", { children: GRID_ROW_LABEL })
					}), a$1(Select, {
						className: "rdw-appearance__select",
						options: GRID_OPTIONS,
						value: gridValue,
						onChange: onGridChange
					})]
				})
			]
		})] });
	}
	var SECTION_CLASS$2 = "rdw-blacklist";
	var CHIPS_CLASS = "rdw-blacklist-chips";
	var ADD_ROW_CLASS = "rdw-blacklist-add-row";
	var HINT_CLASS$1 = "rdw-blacklist-hint";
	var ADD_LABEL = "Add tag";
	var ADD_BUTTON = "Add";
	var PERMANENT_HINT = "Stored in this browser's site cookie. The list in your account settings is not changed and may overwrite this one after you log in again.";
	var ADD_INPUT_ID = "rdw-blacklist-add";
	var TAG_SPLIT_PATTERN = /[, ]+/;
	var BLACKLIST_SECTION_CSS = `
.${SECTION_CLASS$2} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${SECTION_CLASS$2} .${CHIPS_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.${SECTION_CLASS$2} .${ADD_ROW_CLASS} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-end;
}
.${SECTION_CLASS$2} .${ADD_ROW_CLASS} .rdw-field,
.${SECTION_CLASS$2} .${ADD_ROW_CLASS} .rdw-ac {
  flex: 1 1 12rem;
  margin: 0;
}
.${SECTION_CLASS$2} .${HINT_CLASS$1} {
  margin: 0;
  color: var(--rdw-muted);
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
	function BlacklistSection(props = {}) {
		const includeHeading = props.includeHeading !== false;
		const [tags, setTags] = d(() => readSiteBlacklist());
		const [draft, setDraft] = d("");
		const [suggestions, setSuggestions] = d([]);
		const querierRef = T(createAutocompleteQuerier());
		A(() => {
			const querier = querierRef.current;
			return () => {
				querier.cancel();
			};
		}, []);
		const addTokens = b(() => {
			const tokens = parseAddTokens(draft);
			if (tokens.length === 0) return;
			setTags(persistTags([...readSiteBlacklist(), ...tokens]));
			setDraft("");
			setSuggestions([]);
			querierRef.current.cancel();
		}, [draft]);
		return a$1($, { children: [a$1("style", { children: BLACKLIST_SECTION_CSS }), a$1("section", {
			className: `rdw-section ${SECTION_CLASS$2}`,
			children: [
				includeHeading ? a$1(SectionLabel, { children: "Blacklist" }) : null,
				a$1("ul", {
					className: CHIPS_CLASS,
					children: tags.map((tag) => a$1("li", { children: a$1(Chip, {
						label: tag,
						onRemove: () => {
							const next = readSiteBlacklist().filter((entry) => entry !== tag);
							setTags(persistTags(next));
						}
					}) }, tag))
				}),
				a$1("form", {
					className: ADD_ROW_CLASS,
					onSubmit: (event) => {
						event.preventDefault();
						addTokens();
					},
					children: [a$1(AutocompleteField, {
						id: ADD_INPUT_ID,
						label: ADD_LABEL,
						value: draft,
						suggestions,
						onChange: (value) => {
							setDraft(value);
							querierRef.current.query(value, setSuggestions);
						},
						onSelect: () => {
							querierRef.current.cancel();
							setSuggestions([]);
						}
					}), a$1(Button, {
						type: "submit",
						variant: "primary",
						children: ADD_BUTTON
					})]
				}),
				a$1("p", {
					className: HINT_CLASS$1,
					children: PERMANENT_HINT
				})
			]
		})] });
	}
	var BACKUP_FORMAT = "ruledesk-web-backup";
	var IMPORT_MODE_MERGE = "merge";
	var IMPORT_MODE_REPLACE = "replace";
	var BackupFileSchema = object({
		format: literal(BACKUP_FORMAT),
		version: literal(1),
		exportedAt: string(),
		storage: StorageSchema,
		favs: optional(FavsSchema),
		background: optional(string())
	});
	function getGmGetValue() {
		return GM_getValue;
	}
	function getGmSetValue() {
		return GM_setValue;
	}
	function formatSchemaError(error) {
		const issue = error.issues[0];
		if (issue === void 0) return `${IMPORT_SCHEMA_ERROR_PREFIX}: (root): Invalid data`;
		return `${IMPORT_SCHEMA_ERROR_PREFIX}: ${issue.path.length === 0 ? "(root)" : issue.path.map((segment) => String(segment)).join(".")}: ${issue.message}`;
	}
	function readBackgroundRaw() {
		const raw = getGmGetValue()(APPEARANCE_BACKGROUND_KEY, void 0);
		if (typeof raw !== "string" || raw.length === 0) return;
		return raw;
	}
	function writeBackgroundRaw(value) {
		if (value === void 0 || value.length === 0) {
			getGmSetValue()(APPEARANCE_BACKGROUND_KEY, "");
			return;
		}
		getGmSetValue()(APPEARANCE_BACKGROUND_KEY, value);
	}
	function readFavsForBackup() {
		const raw = getGmGetValue()(FAVS_STORAGE_KEY, void 0);
		if (raw === void 0 || raw === null) return createDefaultFavs();
		const parsed = FavsSchema.safeParse(raw);
		if (!parsed.success) {
			log.error("backup: invalid favs; exporting empty favs", { key: FAVS_STORAGE_KEY });
			return createDefaultFavs();
		}
		return parsed.data;
	}
	function writeFavsForBackup(data) {
		getGmSetValue()(FAVS_STORAGE_KEY, FavsSchema.parse(data));
		clearFavsCache();
	}
	function snapshotCurrentToBackupKey() {
		const background = readBackgroundRaw();
		const snapshot = {
			format: BACKUP_FORMAT,
			version: 1,
			exportedAt: new Date().toISOString(),
			storage: load(),
			favs: readFavsForBackup(),
			...background !== void 0 ? { background } : {}
		};
		getGmSetValue()(STORAGE_BACKUP_KEY, snapshot);
	}
	function mergeArtists(current, incoming) {
		const byTag = new Map();
		for (const entry of current) byTag.set(entry.tag, entry);
		for (const entry of incoming) byTag.set(entry.tag, entry);
		return Array.from(byTag.values());
	}
	function mergeCollections(current, incoming) {
		const byId = new Map();
		for (const entry of current) byId.set(entry.id, entry);
		for (const entry of incoming) byId.set(entry.id, entry);
		return Array.from(byId.values());
	}
	function mergeMarks(current, incoming) {
		const merged = { ...current };
		for (const [postId, flags] of Object.entries(incoming)) merged[postId] = {
			...merged[postId] ?? {},
			...flags
		};
		return merged;
	}
	function mergeFavs(current, incoming) {
		const ids = new Set([...current.ids, ...incoming.ids]);
		const next = {
			version: incoming.version,
			ids: Array.from(ids)
		};
		if (incoming.sync !== void 0) next.sync = incoming.sync;
		else if (current.sync !== void 0) next.sync = current.sync;
		return next;
	}
	function buildSummary(storage, favs) {
		return {
			artistCount: storage.artists.length,
			collectionCount: storage.collections.length,
			favCount: favs.ids.length
		};
	}
	function storageWithoutMarkFavs(storage) {
		const stripped = extractFavIdsFromMarks(storage.marks);
		return {
			...storage,
			marks: stripped.marks
		};
	}
	function applyImportedState(storage, favs, background, applyBackground, applyFavs) {
		snapshotCurrentToBackupKey();
		save(stripLegacyPanelWindowSize(applyFavs ? storage : storageWithoutMarkFavs(storage)).data);
		if (applyFavs && favs !== void 0) writeFavsForBackup(favs);
		if (applyBackground) writeBackgroundRaw(background);
		migrateMarksFavToFavs();
		clearStorageCache();
		clearFavsCache();
		return buildSummary(load(), readFavsForBackup());
	}
	function backupDateStamp(date = new Date()) {
		return `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	}
	function buildBackupFilename(date = new Date()) {
		return `ruledesk-web-backup-${backupDateStamp(date)}.json`;
	}
	function buildBackupFile(options) {
		const storage = load();
		const file = {
			format: BACKUP_FORMAT,
			version: 1,
			exportedAt: new Date().toISOString(),
			storage,
			...options.includeFavorites ? { favs: readFavsForBackup() } : {}
		};
		if (options.includeBackground) {
			const background = readBackgroundRaw();
			if (background !== void 0) return {
				...file,
				background
			};
		}
		return file;
	}
	function serializeBackupFile(file) {
		return `${JSON.stringify(file, null, 2)}\n`;
	}
	function downloadBackupText(json, filename) {
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = filename;
		anchor.rel = "noopener";
		document.body.append(anchor);
		anchor.click();
		anchor.remove();
		URL.revokeObjectURL(url);
	}
	function exportBackupDownload(options) {
		const file = buildBackupFile(options);
		downloadBackupText(serializeBackupFile(file), buildBackupFilename());
		return file;
	}
	function importBackupJson(raw, mode) {
		let json;
		try {
			json = JSON.parse(raw);
		} catch (error) {
			return {
				ok: false,
				error: error instanceof Error ? error.message : "Invalid JSON"
			};
		}
		const parsed = BackupFileSchema.safeParse(json);
		if (!parsed.success) return {
			ok: false,
			error: formatSchemaError(parsed.error)
		};
		const incoming = parsed.data;
		const hasBackgroundField = Object.prototype.hasOwnProperty.call(incoming, "background");
		const hasFavsField = Object.prototype.hasOwnProperty.call(incoming, "favs");
		const incomingFavs = incoming.favs;
		try {
			if (mode === "replace") return {
				ok: true,
				summary: applyImportedState(incoming.storage, hasFavsField ? incomingFavs : void 0, hasBackgroundField ? incoming.background : void 0, true, hasFavsField)
			};
			const currentStorage = load();
			const currentFavs = readFavsForBackup();
			const mergedStorage = {
				version: currentStorage.version,
				collections: mergeCollections(currentStorage.collections, incoming.storage.collections),
				artists: mergeArtists(currentStorage.artists, incoming.storage.artists),
				marks: mergeMarks(currentStorage.marks, incoming.storage.marks),
				settings: incoming.storage.settings,
				updates: incoming.storage.updates ?? currentStorage.updates
			};
			if (mergedStorage.settings === void 0) mergedStorage.settings = createDefaultStorage().settings;
			return {
				ok: true,
				summary: applyImportedState(mergedStorage, hasFavsField && incomingFavs !== void 0 ? mergeFavs(currentFavs, incomingFavs) : void 0, incoming.background, hasBackgroundField, hasFavsField)
			};
		} catch (error) {
			log.error("backup import failed after parse", error);
			clearStorageCache();
			clearFavsCache();
			return {
				ok: false,
				error: error instanceof Error ? error.message : "Import failed unexpectedly"
			};
		}
	}
	var SECTION_CLASS$1 = "rdw-data-section";
	var ACTIONS_CLASS$1 = "rdw-data-actions";
	var HINT_CLASS = "rdw-data-hint";
	var FILE_CLASS = "rdw-data-file";
	var HEADING$1 = "Data";
	var INCLUDE_BACKGROUND_LABEL = "Include background image";
	var INCLUDE_BACKGROUND_ID = "rdw-backup-include-bg";
	var INCLUDE_FAVORITES_LABEL = "Include favorites";
	var INCLUDE_FAVORITES_ID = "rdw-backup-include-favs";
	var FAVORITES_EXPORT_HINT = "Favorites restore via Favorites sync. Include them in the file only if you need to copy the local fav list.";
	var IMPORT_MODE_LABEL = "Import mode";
	var EXPORT_LABEL = UI_TEXT.export;
	var IMPORT_LABEL = UI_TEXT.import;
	var STORAGE_HINT = "Collections, artists, and settings live in Tampermonkey storage. Favorites are optional in this file. Blacklist and site theme are browser cookies and are not included.";
	var MODE_OPTIONS = [{
		value: IMPORT_MODE_MERGE,
		label: "Merge"
	}, {
		value: IMPORT_MODE_REPLACE,
		label: "Replace"
	}];
	var DATA_SECTION_CSS = `
.${SECTION_CLASS$1} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${SECTION_CLASS$1} .${ACTIONS_CLASS$1} {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.${SECTION_CLASS$1} .${HINT_CLASS} {
  margin: 0;
  color: var(--rdw-muted);
  font-size: 12px;
}
.${SECTION_CLASS$1} .${FILE_CLASS} {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
`.trim();
	function formatSummary(summary) {
		return `Imported ${String(summary.artistCount)} artists, ${String(summary.collectionCount)} collections, ${String(summary.favCount)} favorites.`;
	}
	function readFileText(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result === "string") {
					resolve(reader.result);
					return;
				}
				reject(new Error("Could not read file"));
			};
			reader.onerror = () => {
				reject(reader.error ?? new Error("Could not read file"));
			};
			reader.readAsText(file);
		});
	}
	function DataSection(props = {}) {
		const includeHeading = props.includeHeading !== false;
		const fileRef = T(null);
		const [includeBackground, setIncludeBackground] = d(false);
		const [includeFavorites, setIncludeFavorites] = d(false);
		const [mode, setMode] = d(IMPORT_MODE_MERGE);
		const [error, setError] = d("");
		const [summary, setSummary] = d("");
		return a$1($, { children: [a$1("style", { children: DATA_SECTION_CSS }), a$1("section", {
			className: `rdw-section ${SECTION_CLASS$1}`,
			children: [
				includeHeading ? a$1(SectionLabel, { children: HEADING$1 }) : null,
				a$1(Switch, {
					id: INCLUDE_BACKGROUND_ID,
					label: INCLUDE_BACKGROUND_LABEL,
					checked: includeBackground,
					onChange: setIncludeBackground
				}),
				a$1(Switch, {
					id: INCLUDE_FAVORITES_ID,
					label: INCLUDE_FAVORITES_LABEL,
					checked: includeFavorites,
					onChange: setIncludeFavorites
				}),
				a$1("p", {
					className: HINT_CLASS,
					children: FAVORITES_EXPORT_HINT
				}),
				a$1(Segmented, {
					label: IMPORT_MODE_LABEL,
					options: [...MODE_OPTIONS],
					value: mode,
					onChange: (value) => {
						if (value === "merge" || value === "replace") setMode(value);
					}
				}),
				a$1("div", {
					className: ACTIONS_CLASS$1,
					children: [
						a$1(Button, {
							variant: "secondary",
							onClick: () => {
								setError("");
								setSummary("");
								exportBackupDownload({
									includeBackground,
									includeFavorites
								});
							},
							children: EXPORT_LABEL
						}),
						a$1(Button, {
							variant: "secondary",
							onClick: () => {
								fileRef.current?.click();
							},
							children: IMPORT_LABEL
						}),
						a$1("input", {
							ref: fileRef,
							className: FILE_CLASS,
							type: "file",
							accept: "application/json,.json",
							"aria-hidden": "true",
							tabIndex: -1,
							onChange: (event) => {
								const file = event.currentTarget.files?.[0];
								event.currentTarget.value = "";
								if (file === void 0) return;
								setError("");
								setSummary("");
								readFileText(file).then((text) => {
									const result = importBackupJson(text, mode);
									if (!result.ok) {
										setError(`${UI_TEXT.importErrorPrefix} ${result.error}`);
										return;
									}
									setSummary(formatSummary(result.summary));
								}).catch((caught) => {
									const message = caught instanceof Error ? caught.message : "Could not read file";
									setError(`${UI_TEXT.importErrorPrefix} ${message}`);
								});
							}
						})
					]
				}),
				error.length > 0 ? a$1("p", {
					className: "rdw-error",
					children: error
				}) : null,
				summary.length > 0 ? a$1("p", {
					className: "rdw-hint",
					children: summary
				}) : null,
				a$1("p", {
					className: HINT_CLASS,
					children: STORAGE_HINT
				})
			]
		})] });
	}
	var FAVORITES_SYNC_PAGE_PAUSE_MS = 1500;
	var FAVORITES_SYNC_RETRY_DELAYS_MS = [
		1e4,
		3e4,
		6e4
	];
	var FAVORITES_SYNC_MODE_INCREMENTAL = FAVS_SYNC_MODE_INCREMENTAL;
	var FAVORITES_SYNC_MODE_FULL = FAVS_SYNC_MODE_FULL;
	var MY_FAVORITES_LINK_SELECTOR = "li#my-favorites-container a[href*=\"page=favorites\"]";
	var THUMB_SELECTOR = "span.thumb";
	var THUMB_POST_LINK_SELECTOR = "span.thumb a[id^=\"p\"]";
	var PAGINATOR_SELECTOR = "#paginator";
	var LASTPAGE_SELECTOR = "a[name=\"lastpage\"]";
	var NEXT_SELECTOR = "a[name=\"next\"]";
	var REMOVE_LINK_SELECTOR = "a[onclick]";
	var POST_LINK_ID_PATTERN = /^p(\d+)$/;
	var ONCLICK_PID_PATTERN = /[?&]pid=(\d+)/;
	var URL_PARSE_BASE = "https://rule34.xxx";
	var TAB_ID_RANDOM_RADIX = 36;
	var TAB_ID_RANDOM_SLICE_START = 2;
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
	function delay$1(ms, signal) {
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
	function titleSnippetFromHtml(html) {
		try {
			return titleSnippetFromDocument(new DOMParser().parseFromString(html, "text/html"));
		} catch {
			return "";
		}
	}
	function titleSnippetFromDocument(doc) {
		const raw = doc.title.trim();
		if (raw.length <= 80) return raw;
		return raw.slice(0, 80);
	}
	function formatPauseMessage(status, titleSnippet) {
		if (titleSnippet.length === 0) return `HTTP ${String(status)}`;
		return `HTTP ${String(status)}: ${titleSnippet}`;
	}
	function createFavoritesSyncTabId() {
		const random = Math.random().toString(TAB_ID_RANDOM_RADIX).slice(TAB_ID_RANDOM_SLICE_START, 12);
		return `tab-${String(Date.now())}-${random}`;
	}
	function extractUserIdFromDocument(root) {
		const link = root.querySelector(MY_FAVORITES_LINK_SELECTOR);
		if (!(link instanceof HTMLAnchorElement)) return null;
		const href = link.getAttribute("href");
		if (href === null || href.length === 0) return null;
		try {
			return parsePositiveInt(new URL(href, URL_PARSE_BASE).searchParams.get("id"));
		} catch {
			return null;
		}
	}
	function extractUserIdFromFavoritesSearch(search) {
		if (detectPageKind(search) !== "favorites") return null;
		return parsePositiveInt(new URLSearchParams(search).get("id"));
	}
	function resolveFavoritesUserId(root, search, savedUserId) {
		const fromMenu = extractUserIdFromDocument(root);
		if (fromMenu !== null) return fromMenu;
		const fromUrl = extractUserIdFromFavoritesSearch(search);
		if (fromUrl !== null) return fromUrl;
		if (savedUserId !== void 0 && Number.isFinite(savedUserId)) return Math.trunc(savedUserId);
		return null;
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
	function hasPaginator(doc) {
		return doc.querySelector(PAGINATOR_SELECTOR) !== null;
	}
	function readFavoritesSyncMode(sync) {
		const mode = sync?.mode;
		if (mode === FAVORITES_SYNC_MODE_INCREMENTAL || mode === FAVORITES_SYNC_MODE_FULL) return mode;
	}
	function pageIdsAllInLocalSet(pageIds, local) {
		if (pageIds.length === 0) return false;
		for (const id of pageIds) if (!local.has(id)) return false;
		return true;
	}
	function resolveRunMode(unfinished, existing, requested) {
		if (unfinished) return readFavoritesSyncMode(existing) ?? FAVORITES_SYNC_MODE_FULL;
		return requested ?? FAVORITES_SYNC_MODE_INCREMENTAL;
	}
	function persistSyncProgress(fields) {
		const state = {
			nextPid: fields.nextPid,
			lastPid: fields.lastPid,
			startedAt: fields.startedAt,
			running: fields.running,
			userId: fields.userId,
			mode: fields.mode,
			lock: {
				tabId: fields.tabId,
				beatAt: Date.now()
			}
		};
		if (fields.finishedAt !== void 0) state.finishedAt = fields.finishedAt;
		setSyncState(state);
		return state;
	}
	async function fetchFavoritesPageOnce(url, signal) {
		let response;
		try {
			response = await fetch(url, {
				method: "GET",
				credentials: FETCH_CREDENTIALS,
				signal
			});
		} catch (error) {
			if (isAbortError(error)) throw error;
			const message = error instanceof Error ? error.message : "request failed";
			log.warn("favorites sync: fetch failed", url, error);
			return {
				ok: false,
				status: 0,
				titleSnippet: message.slice(0, 80),
				message
			};
		}
		const html = await response.text();
		const titleSnippet = titleSnippetFromHtml(html);
		if (!response.ok) {
			log.warn("favorites sync: HTTP error", response.status, url);
			return {
				ok: false,
				status: response.status,
				titleSnippet,
				message: formatPauseMessage(response.status, titleSnippet)
			};
		}
		const doc = new DOMParser().parseFromString(html, "text/html");
		if (!hasPaginator(doc)) {
			log.warn("favorites sync: missing paginator", url);
			return {
				ok: false,
				status: response.status,
				titleSnippet: titleSnippetFromDocument(doc),
				message: formatPauseMessage(response.status, titleSnippetFromDocument(doc))
			};
		}
		return {
			ok: true,
			doc,
			status: response.status,
			titleSnippet: titleSnippetFromDocument(doc)
		};
	}
	async function fetchFavoritesPageWithRetries(url, signal) {
		let lastFailure = null;
		for (let attempt = 0; attempt <= FAVORITES_SYNC_RETRY_DELAYS_MS.length; attempt += 1) {
			throwIfAborted(signal);
			if (attempt > 0) {
				const delayMs = FAVORITES_SYNC_RETRY_DELAYS_MS[attempt - 1];
				if (delayMs === void 0) break;
				log.warn("favorites sync: retrying after delay", {
					attempt,
					delayMs,
					url
				});
				await delay$1(delayMs, signal);
				throwIfAborted(signal);
			}
			const result = await fetchFavoritesPageOnce(url, signal);
			if (result.ok) return result;
			lastFailure = result;
		}
		if (lastFailure === null) return {
			ok: false,
			status: 0,
			titleSnippet: "",
			message: formatPauseMessage(0, "")
		};
		return lastFailure;
	}
	async function runFavoritesSync(options) {
		const { onProgress, signal } = options;
		const tabId = options.tabId ?? createFavoritesSyncTabId();
		const existing = getSyncState();
		const userId = resolveFavoritesUserId(document, window.location.search, existing?.userId);
		if (userId === null) {
			log.warn("favorites sync: user id not found");
			return {
				status: "error",
				message: FAVORITES_SYNC_ERROR_NOT_LOGGED_IN
			};
		}
		const unfinished = existing !== void 0 && existing.finishedAt === void 0;
		const mode = resolveRunMode(unfinished, existing, options.mode);
		const startedAt = unfinished ? existing.startedAt : new Date().toISOString();
		let pid = unfinished ? existing.nextPid : 0;
		let lastPid = unfinished ? existing.lastPid : 0;
		let persistedNextPid = pid;
		let total = loadFavSet().size;
		let page = pageIndexFromPid(pid);
		let pages = pagesFromLastPid$1(lastPid);
		let sawNonEmptyPage = unfinished && existing.nextPid > 0;
		const writeProgress = (fields) => {
			const nextPid = fields.nextPid ?? persistedNextPid;
			persistedNextPid = nextPid;
			if (fields.lastPid !== void 0) lastPid = fields.lastPid;
			const payload = {
				nextPid,
				lastPid,
				startedAt,
				userId,
				tabId,
				running: fields.running,
				mode
			};
			if (fields.finishedAt !== void 0) payload.finishedAt = fields.finishedAt;
			persistSyncProgress(payload);
		};
		try {
			throwIfAborted(signal);
			writeProgress({ running: true });
			while (true) {
				throwIfAborted(signal);
				const fetched = await fetchFavoritesPageWithRetries(buildFavoritesPageUrl(userId, pid), signal);
				if (!fetched.ok) {
					writeProgress({ running: true });
					return {
						status: "error",
						message: fetched.message
					};
				}
				const { doc } = fetched;
				const cardCount = doc.querySelectorAll(THUMB_SELECTOR).length;
				page = pageIndexFromPid(pid);
				if (cardCount === 0 && sawNonEmptyPage) {
					pages = Math.max(pages, page);
					const finishedAt = new Date().toISOString();
					writeProgress({
						nextPid: pid + 50,
						running: false,
						finishedAt
					});
					onProgress({
						page,
						pages,
						total
					});
					log.info("favorites sync: completed on empty trailing page", {
						total,
						pages,
						pid,
						mode
					});
					return {
						status: "completed",
						total,
						pages
					};
				}
				const resolvedLastPid = resolveLastPid(doc, pid);
				if (resolvedLastPid === null) {
					log.warn("favorites sync: unexpected page", {
						pid,
						cardCount
					});
					writeProgress({ running: true });
					return {
						status: "error",
						message: FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE
					};
				}
				lastPid = resolvedLastPid;
				pages = pagesFromLastPid$1(lastPid);
				if (cardCount === 0) {
					log.warn("favorites sync: unexpected empty page", {
						pid,
						lastPid
					});
					writeProgress({ running: true });
					return {
						status: "error",
						message: FAVORITES_SYNC_ERROR_UNEXPECTED_PAGE
					};
				}
				sawNonEmptyPage = true;
				const ids = collectFavoriteIdsFromDocument(doc);
				const allKnown = pageIdsAllInLocalSet(ids, loadFavSet());
				addFavs(ids);
				total = loadFavSet().size;
				const nextPid = pid + 50;
				writeProgress({
					nextPid,
					lastPid,
					running: true
				});
				onProgress({
					page,
					pages,
					total
				});
				if (mode === FAVORITES_SYNC_MODE_INCREMENTAL && allKnown) {
					const finishedAt = new Date().toISOString();
					writeProgress({
						nextPid,
						lastPid,
						running: false,
						finishedAt
					});
					log.info("favorites sync: incremental early stop", {
						total,
						pages,
						page,
						pid
					});
					return {
						status: "completed",
						total,
						pages
					};
				}
				if (pid >= lastPid) {
					const finishedAt = new Date().toISOString();
					writeProgress({
						nextPid,
						lastPid,
						running: false,
						finishedAt
					});
					log.info("favorites sync: completed", {
						total,
						pages,
						mode
					});
					return {
						status: "completed",
						total,
						pages
					};
				}
				throwIfAborted(signal);
				await delay$1(FAVORITES_SYNC_PAGE_PAUSE_MS, signal);
				throwIfAborted(signal);
				pid = nextPid;
				page = pageIndexFromPid(pid);
			}
		} catch (error) {
			if (isAbortError(error)) {
				writeProgress({ running: false });
				log.info("favorites sync: aborted", {
					pid,
					total,
					mode
				});
				return createAbortResult(total, page, pages);
			}
			log.error("favorites sync: unexpected failure", error);
			writeProgress({ running: true });
			return {
				status: "error",
				message: error instanceof Error ? error.message : "unexpected error"
			};
		}
	}
	var SECTION_CLASS = "rdw-favs-sync";
	var STATUS_CLASS = "rdw-favs-sync-status";
	var ACTIONS_CLASS = "rdw-favs-sync-actions";
	var WARNING_CLASS = "rdw-favs-sync-warning";
	var NOTE_CLASS = "rdw-favs-sync-note";
	var HEADING = "Favorites sync";
	var TEXT_SYNC = "Sync favorites";
	var TEXT_FULL = "Full resync";
	var TEXT_RESUME = "Resume";
	var TEXT_STOP = "Stop";
	var TEXT_WARNING = "Sync stops at the first page of already-known favorites (newest first). Full resync loads every page. One request per 1.5 s";
	var TEXT_NOTE = "Sync only adds favorites. Posts removed on the site stay in the local set.";
	var TEXT_IDLE_COUNT = (count) => `${String(count)} in local favorites set`;
	var TEXT_LAST_SYNC = (iso) => `Last full sync: ${formatSyncDate(iso)}`;
	var TEXT_PAUSED = (page, pages) => `Paused at page ${String(page)} of ${String(pages)}`;
	var TEXT_PROGRESS = (p) => `Page ${String(p.page)} of ${String(p.pages)} · ${String(p.total)} ids`;
	var TEXT_DONE = (total, pages) => `Synced ${String(total)} ids across ${String(pages)} pages`;
	var TEXT_ABORTED = (page, pages, total) => `Stopped at page ${String(page)} of ${String(pages)} · ${String(total)} ids`;
	var TEXT_STARTING = "Starting sync…";
	var PAUSE_SECONDS = FAVORITES_SYNC_PAGE_PAUSE_MS / 1e3;
	var FAVORITES_SYNC_SECTION_CSS = `
.${SECTION_CLASS} {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.${SECTION_CLASS} .${STATUS_CLASS} {
  margin: 0;
  color: var(--rdw-text);
  font-size: 12px;
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
  color: var(--rdw-muted);
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
	function ratioFromProgress(progress) {
		if (progress.pages <= 0) return null;
		return progress.page / progress.pages;
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
	function idleUi() {
		return {
			status: buildStatusText(),
			progress: null,
			waiting: false,
			error: "",
			unfinished: isUnfinished(getSyncState()),
			busy: activeSync !== null
		};
	}
	function progressUi(progress) {
		const ratio = ratioFromProgress(progress);
		return {
			status: TEXT_PROGRESS(progress),
			progress: ratio,
			waiting: ratio === null,
			error: "",
			unfinished: true,
			busy: true
		};
	}
	function applyResult(result) {
		activeSync = null;
		if (result.status === "error") return {
			...idleUi(),
			error: result.message
		};
		if (result.status === "completed") return {
			status: TEXT_DONE(result.total, result.pages),
			progress: result.pages > 0 ? 1 : null,
			waiting: false,
			error: "",
			unfinished: false,
			busy: false
		};
		return {
			status: TEXT_ABORTED(result.page, result.pages, result.total),
			progress: ratioFromProgress({
				page: result.page,
				pages: result.pages,
				total: result.total
			}),
			waiting: false,
			error: "",
			unfinished: isUnfinished(getSyncState()),
			busy: false
		};
	}
	async function startSync(setUi, mode) {
		if (activeSync !== null) return;
		const controller = new AbortController();
		const listeners = new Set();
		activeSync = {
			controller,
			listeners
		};
		listeners.add((progress) => {
			setUi(progressUi(progress));
		});
		setUi({
			status: TEXT_STARTING,
			progress: null,
			waiting: true,
			error: "",
			unfinished: true,
			busy: true
		});
		try {
			const result = await runFavoritesSync({
				onProgress: (progress) => {
					for (const listener of listeners) listener(progress);
				},
				signal: controller.signal,
				...mode !== void 0 ? { mode } : {}
			});
			if (activeSync?.controller === controller) setUi(applyResult(result));
		} catch (error) {
			log.error("favorites sync section: unexpected failure", error);
			if (activeSync?.controller === controller) {
				activeSync = null;
				setUi({
					...idleUi(),
					error: error instanceof Error ? error.message : "unexpected error"
				});
			}
		}
	}
	function FavoritesSyncSection(props = {}) {
		const includeHeading = props.includeHeading !== false;
		const [ui, setUi] = d(() => idleUi());
		A(() => {
			if (activeSync === null) return;
			const listener = (progress) => {
				setUi(progressUi(progress));
			};
			activeSync.listeners.add(listener);
			setUi({
				status: TEXT_STARTING,
				progress: null,
				waiting: true,
				error: "",
				unfinished: true,
				busy: true
			});
			return () => {
				activeSync?.listeners.delete(listener);
			};
		}, []);
		return a$1($, { children: [a$1("style", { children: FAVORITES_SYNC_SECTION_CSS }), a$1("section", {
			className: `rdw-section ${SECTION_CLASS}`,
			children: [
				includeHeading ? a$1(SectionLabel, { children: HEADING }) : null,
				a$1("p", {
					className: STATUS_CLASS,
					children: ui.status
				}),
				a$1(ProgressBar, {
					value: ui.progress,
					waiting: ui.waiting,
					label: "Favorites sync progress"
				}),
				a$1("div", {
					className: ACTIONS_CLASS,
					children: [!ui.unfinished ? a$1($, { children: [a$1(Button, {
						variant: "primary",
						disabled: ui.busy,
						onClick: () => {
							startSync(setUi, FAVORITES_SYNC_MODE_INCREMENTAL);
						},
						children: TEXT_SYNC
					}), a$1(Button, {
						variant: "secondary",
						disabled: ui.busy,
						onClick: () => {
							startSync(setUi, FAVORITES_SYNC_MODE_FULL);
						},
						children: TEXT_FULL
					})] }) : a$1(Button, {
						variant: "secondary",
						disabled: ui.busy,
						onClick: () => {
							startSync(setUi);
						},
						children: TEXT_RESUME
					}), a$1(Button, {
						variant: "secondary",
						disabled: !ui.busy,
						onClick: () => {
							activeSync?.controller.abort();
						},
						children: TEXT_STOP
					})]
				}),
				ui.error.length > 0 ? a$1("p", {
					className: "rdw-error",
					children: ui.error
				}) : null,
				a$1("p", {
					className: WARNING_CLASS,
					children: TEXT_WARNING
				}),
				a$1("p", {
					className: NOTE_CLASS,
					children: TEXT_NOTE
				}),
				a$1("p", {
					className: "rdw-hint",
					children: `Pause between pages: ${String(PAUSE_SECONDS)} s`
				})
			]
		})] });
	}
	var PAGE_FEATURE_SKIP = new Set(["grid-density"]);
	function FeatureModules() {
		const [, bump] = d(0);
		const refresh = () => {
			bump((value) => value + 1);
		};
		return a$1("div", {
			className: PANEL_UI_CLASS.settingsGroup,
			children: FEATURES.filter((feature) => !PAGE_FEATURE_SKIP.has(feature.id)).map((feature) => {
				const label = featurePanelLabel(feature.id, feature.label);
				if (feature.choice !== void 0) {
					const selected = getFeatureChoice(feature.id);
					return a$1("div", {
						className: PANEL_UI_CLASS.settingsRow,
						id: `${FEATURE_CHOICE_ID_PREFIX}${feature.id}`,
						children: a$1(Select, {
							label,
							options: feature.choice.options.map((option) => ({
								value: option.value,
								label: option.label
							})),
							value: selected,
							onChange: (value) => {
								setFeatureChoiceValue(feature.id, value);
								if (feature.cssOnly === true) {
									applyCssOnlyFeatureChoice(feature.id, value);
									refresh();
									return;
								}
								window.location.reload();
							}
						})
					}, feature.id);
				}
				return a$1("div", {
					className: PANEL_UI_CLASS.settingsRow,
					children: a$1(Switch, {
						id: `${FEATURE_CHECKBOX_ID_PREFIX}${feature.id}`,
						label,
						checked: isFeatureEnabled(feature.id),
						onChange: (checked) => {
							setFeatureEnabled(feature.id, checked);
							if (feature.cssOnly === true) {
								applyCssOnlyFeatureEnabled(feature.id, checked);
								refresh();
								return;
							}
							window.location.reload();
						}
					})
				}, feature.id);
			})
		});
	}
	function SettingsPage() {
		const [tweaks, setTweaks] = d(() => getTweaksEnabled());
		const [updatesGroup, setUpdatesGroup] = d(() => getUpdatesGroupSize());
		const [playlistChunk, setPlaylistChunk] = d(() => getPlaylistChunkSize());
		const [gridFavEnabled, setGridFavEnabled] = d(() => getGridFavButtonsEnabled());
		return a$1("div", {
			className: PANEL_UI_CLASS.scrollRegion,
			children: [
				a$1(Card, {
					className: PANEL_UI_CLASS.pageCard,
					children: a$1(AppearanceSection, {})
				}),
				a$1(Card, {
					className: PANEL_UI_CLASS.pageCard,
					children: [a$1(SectionLabel, { children: "Page" }), a$1("div", {
						className: PANEL_UI_CLASS.settingsGroup,
						children: [
							a$1("div", {
								className: PANEL_UI_CLASS.settingsRow,
								children: a$1(Switch, {
									id: TWEAKS_SWITCH_ID,
									label: UI_TEXT.enablePageTweaksLabel,
									checked: tweaks,
									onChange: (checked) => {
										setTweaksEnabled(checked);
										setTweaks(checked);
										window.location.reload();
									}
								})
							}),
							a$1(FeatureModules, {}),
							a$1("div", {
								className: PANEL_UI_CLASS.settingsRow,
								children: a$1(NumberField, {
									id: UPDATES_GROUP_SIZE_ID,
									label: UI_TEXT.updatesGroupSizeLabel,
									value: updatesGroup,
									min: 0,
									step: 1,
									onChange: (value) => {
										setUpdatesGroupSize(value ?? 0);
										setUpdatesGroup(getUpdatesGroupSize());
									}
								})
							}),
							a$1("div", {
								className: PANEL_UI_CLASS.settingsRow,
								children: a$1(NumberField, {
									id: PLAYLIST_CHUNK_SIZE_ID,
									label: UI_TEXT.playlistChunkSizeLabel,
									value: playlistChunk,
									min: 1,
									step: 1,
									onChange: (value) => {
										setPlaylistChunkSize(value ?? 0);
										setPlaylistChunk(getPlaylistChunkSize());
									}
								})
							})
						]
					})]
				}),
				a$1(Card, {
					className: PANEL_UI_CLASS.pageCard,
					children: a$1(BlacklistSection, {})
				}),
				a$1(Card, {
					className: PANEL_UI_CLASS.pageCard,
					children: [
						a$1(SectionLabel, { children: "Favorites" }),
						a$1("div", {
							className: PANEL_UI_CLASS.settingsRow,
							children: a$1(Switch, {
								id: GRID_FAV_CHECKBOX_ID,
								label: UI_TEXT.gridFavButtonsLabel,
								checked: gridFavEnabled,
								onChange: (checked) => {
									setGridFavButtonsEnabled(checked);
									setGridFavButtonsVisible(checked);
									setGridFavEnabled(checked);
								}
							})
						}),
						a$1(FavoritesSyncSection, { includeHeading: false })
					]
				}),
				a$1(Card, {
					className: PANEL_UI_CLASS.pageCard,
					children: a$1(DataSection, {})
				})
			]
		});
	}
	var PAGE_SHELL_CLASS = "rdw-page-shell";
	var PAGE_TITLE_CLASS = "rdw-page-title";
	var PAGE_HOST_CSS = `
:host {
  all: initial;
  font-family: var(--rdw-font);
  font-size: 13px;
  line-height: 1.35;
  color: var(--rdw-text);
  background: transparent;
}
.${PAGE_SHELL_CLASS} {
  box-sizing: border-box;
  max-width: ${String(960)}px;
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
	function PageShell(props) {
		return a$1($, { children: [a$1("style", { children: PAGE_HOST_CSS }), a$1("div", {
			className: PAGE_SHELL_CLASS,
			children: [a$1("h1", {
				className: PAGE_TITLE_CLASS,
				children: props.title
			}), props.children]
		})] });
	}
	function titleForRoute(route) {
		if (route === "collections") return MENU_LABEL.collections;
		if (route === "following") return MENU_LABEL.following;
		return MENU_LABEL.settings;
	}
	function pageForRoute(route) {
		if (route === "collections") return a$1(CollectionsPage, {});
		if (route === "following") return a$1(FollowingPage, {});
		return a$1(SettingsPage, {});
	}
	var hostElement = null;
	var mountPoint = null;
	function syncHostTokens(host) {
		applyTokenProperties(host, resolveTokenPalette(getAppearance()));
	}
	function ensureHost(header) {
		if (hostElement !== null && mountPoint !== null) {
			if (hostElement.parentElement !== header.parentElement) header.after(hostElement);
			return {
				host: hostElement,
				mount: mountPoint
			};
		}
		const existing = document.getElementById(RDW_PAGE_ROOT_ID);
		if (existing !== null) existing.remove();
		const host = document.createElement("div");
		host.id = RDW_PAGE_ROOT_ID;
		const shadow = host.attachShadow({ mode: "open" });
		const mount = document.createElement("div");
		shadow.append(mount);
		header.after(host);
		hostElement = host;
		mountPoint = mount;
		return {
			host,
			mount
		};
	}
	function showRdwPage(route, header) {
		const { host, mount } = ensureHost(header);
		syncHostTokens(host);
		Q(a$1(PageShell, {
			title: titleForRoute(route),
			children: pageForRoute(route)
		}), mount);
	}
	function hideRdwPage() {
		if (mountPoint !== null) Q(null, mountPoint);
		if (hostElement !== null) hostElement.remove();
		hostElement = null;
		mountPoint = null;
		const stray = document.getElementById(RDW_PAGE_ROOT_ID);
		if (stray !== null) stray.remove();
	}
	var CONTENT_ID = "content";
	var FAVORITES_USER_ID_STUB_PID = 0;
	var savedSiteCurrent = null;
	var siteCurrentCaptured = false;
	function isHeaderMenuListItem(listItem, content) {
		if (content !== null && content.contains(listItem)) return false;
		return true;
	}
	function findPostsMenuItem() {
		const content = document.getElementById(CONTENT_ID);
		const anchors = document.querySelectorAll("a");
		for (const node of anchors) {
			if (!(node instanceof HTMLAnchorElement)) continue;
			if ((node.textContent?.trim() ?? "") !== "Posts") continue;
			const listItem = node.closest("li");
			if (listItem === null || !(listItem instanceof HTMLLIElement)) continue;
			if (!isHeaderMenuListItem(listItem, content)) continue;
			return listItem;
		}
		return null;
	}
	function findNavbar() {
		const navbar = document.querySelector(NAVBAR_SELECTOR);
		return navbar instanceof HTMLUListElement ? navbar : null;
	}
	function findHeader$1() {
		const header = document.querySelector(HEADER_SELECTOR);
		return header instanceof HTMLElement ? header : null;
	}
	function persistFavoritesUserId(userId) {
		if (!Number.isFinite(userId) || userId <= 0) return;
		const normalized = Math.trunc(userId);
		const existing = getSyncState();
		if (existing?.userId === normalized) return;
		if (existing !== void 0) {
			setSyncState({
				...existing,
				userId: normalized
			});
			return;
		}
		const now = new Date().toISOString();
		setSyncState({
			nextPid: FAVORITES_USER_ID_STUB_PID,
			lastPid: FAVORITES_USER_ID_STUB_PID,
			startedAt: now,
			finishedAt: now,
			userId: normalized
		});
	}
	function buildFavoritesHrefFromUserId(userId) {
		const params = new URLSearchParams();
		params.set(SEARCH_PARAM_PAGE, FAVORITES_PAGE);
		params.set("s", FAVORITES_SECTION_VIEW);
		params.set("id", String(userId));
		return `${SEARCH_PATH}?${params.toString()}`;
	}
	function resolveFavoritesHref(root = document, search = window.location.search) {
		const userId = resolveFavoritesUserId(root, search, getSyncState()?.userId);
		if (userId === null || userId <= 0) return null;
		persistFavoritesUserId(userId);
		return buildFavoritesHrefFromUserId(userId);
	}
	function ensureMenuLink(id, label, href) {
		const existing = document.getElementById(id);
		if (existing instanceof HTMLLIElement) {
			const anchor = existing.querySelector("a");
			if (anchor instanceof HTMLAnchorElement) {
				anchor.textContent = label;
				anchor.href = href;
			}
			return existing;
		}
		const item = document.createElement("li");
		item.id = id;
		const anchor = document.createElement("a");
		anchor.textContent = label;
		anchor.href = href;
		item.append(anchor);
		return item;
	}
	function hideNativeMyFavorites() {
		const container = document.getElementById(MY_FAVORITES_CONTAINER_ID);
		if (container instanceof HTMLLIElement) container.hidden = true;
	}
	function insertionAnchorAfterFeedOrPosts() {
		const feed = document.getElementById(FEED_MENU_ITEM_ID);
		if (feed instanceof HTMLLIElement) return feed;
		return findPostsMenuItem();
	}
	function installSiteMenu() {
		if (findHeader$1() === null) return;
		const navbar = findNavbar();
		if (navbar === null) return;
		const anchor = insertionAnchorAfterFeedOrPosts();
		if (anchor === null) return;
		const collections = ensureMenuLink(MENU_ITEM_ID.collections, MENU_LABEL.collections, RDW_HASH_COLLECTIONS);
		const following = ensureMenuLink(MENU_ITEM_ID.following, MENU_LABEL.following, RDW_HASH_FOLLOWING);
		if (collections.parentElement !== navbar) anchor.after(collections);
		else if (collections.previousElementSibling !== anchor) anchor.after(collections);
		if (following.previousElementSibling !== collections) collections.after(following);
		const favoritesHref = resolveFavoritesHref();
		const existingFavorites = document.getElementById(MENU_ITEM_ID.favorites);
		if (favoritesHref === null) {
			if (existingFavorites !== null) existingFavorites.remove();
		} else {
			const favorites = ensureMenuLink(MENU_ITEM_ID.favorites, MENU_LABEL.favorites, favoritesHref);
			if (favorites.previousElementSibling !== following) following.after(favorites);
		}
		hideNativeMyFavorites();
		const settings = ensureMenuLink(MENU_ITEM_ID.settings, MENU_LABEL.settings, RDW_HASH_SETTINGS);
		if (settings.parentElement !== navbar || navbar.lastElementChild !== settings) navbar.append(settings);
	}
	function menuItemIdForRoute(route) {
		if (route === "collections") return MENU_ITEM_ID.collections;
		if (route === "following") return MENU_ITEM_ID.following;
		return MENU_ITEM_ID.settings;
	}
	function captureSiteCurrentIfNeeded() {
		if (siteCurrentCaptured) return;
		siteCurrentCaptured = true;
		const navbar = findNavbar();
		if (navbar === null) {
			savedSiteCurrent = null;
			return;
		}
		const current = navbar.querySelector(`li.${CURRENT_PAGE_CLASS$1}`);
		savedSiteCurrent = current instanceof HTMLLIElement && current.id !== MENU_ITEM_ID.collections && current.id !== MENU_ITEM_ID.following && current.id !== MENU_ITEM_ID.favorites && current.id !== MENU_ITEM_ID.settings ? current : null;
	}
	function clearAllOwnCurrent() {
		for (const id of Object.values(MENU_ITEM_ID)) {
			const item = document.getElementById(id);
			if (item instanceof HTMLLIElement) item.classList.remove(CURRENT_PAGE_CLASS$1);
		}
	}
	function setOwnPageCurrentHighlight(route) {
		captureSiteCurrentIfNeeded();
		const navbar = findNavbar();
		if (navbar !== null) for (const child of navbar.querySelectorAll(`li.${CURRENT_PAGE_CLASS$1}`)) child.classList.remove(CURRENT_PAGE_CLASS$1);
		clearAllOwnCurrent();
		const item = document.getElementById(menuItemIdForRoute(route));
		if (item instanceof HTMLLIElement) item.classList.add(CURRENT_PAGE_CLASS$1);
	}
	function clearOwnPageCurrentHighlight() {
		clearAllOwnCurrent();
		if (savedSiteCurrent !== null && savedSiteCurrent.isConnected) savedSiteCurrent.classList.add(CURRENT_PAGE_CLASS$1);
		savedSiteCurrent = null;
		siteCurrentCaptured = false;
	}
	var EVENT_HASHCHANGE = "hashchange";
	var EVENT_POPSTATE = "popstate";
	var EVENT_CLICK = "click";
	var HISTORY_STATE_TITLE = "";
	var routerBound = false;
	function ensureOwnPageStyle() {
		const style = ensureStyleElement(RDW_OWN_PAGE_STYLE_ID);
		style.textContent = buildOwnPageCss();
	}
	function findHeader() {
		const header = document.querySelector(HEADER_SELECTOR);
		return header instanceof HTMLElement ? header : null;
	}
	function enterRoute(route) {
		const header = findHeader();
		if (header === null) return;
		document.documentElement.classList.add(RDW_OWN_PAGE_CLASS);
		showRdwPage(route, header);
		setOwnPageCurrentHighlight(route);
	}
	function leaveRoute() {
		document.documentElement.classList.remove(RDW_OWN_PAGE_CLASS);
		hideRdwPage();
		clearOwnPageCurrentHighlight();
	}
	function syncFromHash() {
		if (findHeader() === null) {
			leaveRoute();
			return;
		}
		const route = parseRdwHash(window.location.hash);
		if (route === null) {
			leaveRoute();
			return;
		}
		enterRoute(route);
	}
	function onHashChange() {
		syncFromHash();
	}
	function onPopState() {
		syncFromHash();
	}
	function isModifiedClick(event) {
		return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
	}
	function navigateToRdwRoute(route) {
		const nextHash = `${RDW_HASH_PREFIX}${route}`;
		const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
		if (parseRdwHash(window.location.hash) !== null) window.history.replaceState(window.history.state, HISTORY_STATE_TITLE, nextUrl);
		else window.history.pushState(window.history.state, HISTORY_STATE_TITLE, nextUrl);
		syncFromHash();
	}
	function onDocumentClick(event) {
		if (event.defaultPrevented || isModifiedClick(event)) return;
		const target = event.target;
		if (!(target instanceof Element)) return;
		const anchor = target.closest("a");
		if (!(anchor instanceof HTMLAnchorElement)) return;
		if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
		let url;
		try {
			url = new URL(anchor.href, window.location.href);
		} catch {
			return;
		}
		if (url.origin !== window.location.origin) return;
		if (url.pathname !== window.location.pathname || url.search !== window.location.search) return;
		const route = parseRdwHash(url.hash);
		if (route === null) return;
		event.preventDefault();
		navigateToRdwRoute(route);
	}
	function startRdwPages() {
		ensureOwnPageStyle();
		if (findHeader() === null) {
			leaveRoute();
			return;
		}
		installSiteMenu();
		if (!routerBound) {
			routerBound = true;
			window.addEventListener(EVENT_HASHCHANGE, onHashChange);
			window.addEventListener(EVENT_POPSTATE, onPopState);
			document.addEventListener(EVENT_CLICK, onDocumentClick);
		}
		syncFromHash();
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
	function syncAppearanceAfterDomReady() {
		const appearance = getAppearance();
		const backgroundDataUrl = getAppearanceBackgroundDataUrl();
		applyAppearanceTheme({
			appearance,
			siteSkinCss: getSiteSkinCss(),
			...backgroundDataUrl !== void 0 ? { backgroundDataUrl } : {}
		});
	}
	function startApp() {
		syncAppearanceAfterDomReady();
		const pageKind = detectPageKind(window.location.search);
		if (pageKind === "list") {
			mountCards();
			mountArtistSidebar();
		} else if (pageKind === "post") mountArtistSidebar();
		else if (pageKind === "favorites") syncFavoritesPage();
		runFeatures(pageKind, window.location.search);
		startRdwPages();
	}
	function applyOwnPageClassEarly() {
		if (parseRdwHash(window.location.hash) === null) return;
		const root = document.documentElement;
		if (root === null) return;
		const style = ensureStyleElement(RDW_OWN_PAGE_STYLE_ID);
		style.textContent = buildOwnPageCss();
		root.classList.add(RDW_OWN_PAGE_CLASS);
	}
	function bootEarly() {
		applyOwnPageClassEarly();
		const appearance = getAppearance();
		const backgroundDataUrl = getAppearanceBackgroundDataUrl();
		applyAppearanceTheme({
			appearance,
			siteSkinCss: getSiteSkinCss(),
			...backgroundDataUrl !== void 0 ? { backgroundDataUrl } : {}
		});
	}
	var FAVORITES_SYNC_LOCK_STALE_MS = 1e4;
	var FAVORITES_SYNC_RESUME_DELAY_MS = 3e3;
	var sessionTabId;
	var resumeAttempted = false;
	function delay(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}
	function getFavoritesSyncRunnerTabId() {
		if (sessionTabId === void 0) sessionTabId = createFavoritesSyncTabId();
		return sessionTabId;
	}
	function shouldResumeStaleFavoritesSync(sync, now) {
		if (sync?.running !== true) return false;
		const lock = sync.lock;
		if (lock === void 0) return true;
		return now - lock.beatAt > FAVORITES_SYNC_LOCK_STALE_MS;
	}
	function shouldSkipForFreshForeignLock(sync, thisTabId, now) {
		if (sync?.running !== true) return false;
		const lock = sync.lock;
		if (lock === void 0) return false;
		if (now - lock.beatAt > 1e4) return false;
		return lock.tabId !== thisTabId;
	}
	async function resumeFavoritesSyncIfStale() {
		const tabId = getFavoritesSyncRunnerTabId();
		const before = getSyncState();
		if (shouldSkipForFreshForeignLock(before, tabId, Date.now())) return false;
		if (!shouldResumeStaleFavoritesSync(before, Date.now())) return false;
		await delay(FAVORITES_SYNC_RESUME_DELAY_MS);
		const after = getSyncState();
		if (shouldSkipForFreshForeignLock(after, tabId, Date.now())) return false;
		if (!shouldResumeStaleFavoritesSync(after, Date.now())) return false;
		const mode = readFavoritesSyncMode(after) ?? FAVORITES_SYNC_MODE_FULL;
		await runFavoritesSync({
			tabId,
			signal: new AbortController().signal,
			onProgress: () => {},
			mode
		});
		return true;
	}
	function maybeResumeFavoritesSync() {
		if (resumeAttempted) return;
		resumeAttempted = true;
		resumeFavoritesSyncIfStale().catch((error) => {
			log.error("favorites sync resume failed", error);
		});
	}
	function whenDomReady(callback) {
		const run = () => {
			callback();
			onDomReadySideEffects();
		};
		if (document.readyState === "interactive" || document.readyState === "complete") {
			run();
			return;
		}
		document.addEventListener("DOMContentLoaded", run, { once: true });
	}
	function onDomReadySideEffects() {
		maybeResumeFavoritesSync();
	}
	bootEarly();
	whenDomReady(() => {
		startApp();
	});
})();
