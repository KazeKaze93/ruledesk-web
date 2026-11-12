// ==UserScript==
// @name         RuleDesk Web
// @namespace    https://github.com/kazekaze93/ruledesk-web
// @version      0.6.3
// @description  Collections, favorites, artist updates, and page tweaks for rule34.xxx
// @downloadURL  https://raw.githubusercontent.com/KazeKaze93/ruledesk-web/main/dist/ruledesk-web.user.js
// @updateURL    https://raw.githubusercontent.com/KazeKaze93/ruledesk-web/main/dist/ruledesk-web.user.js
// @match        https://rule34.xxx/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function() {
	"use strict";
	var STORAGE_KEY = "ruledesk-web.storage";
	var STORAGE_BACKUP_KEY = "ruledesk-web.storage.backup";
	var FAVS_STORAGE_KEY = "ruledesk-web.favs";
	var DEBUG_KEY = "ruledesk-web.debug";
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
	var PANEL_ROOT_ID = "ruledesk-web-root";
	var TOGGLE_BUTTON_ID = "ruledesk-web-toggle";
	var DOCUMENT_STYLE_ID = "ruledesk-web-document-style";
	var UPDATES_BAR_ID = "ruledesk-web-updates-bar";
	var SITE_THEME_COOKIE_NAME = "theme";
	var SITE_THEME_COOKIE_VALUE_DARK = "dark";
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
	var number = /^-?\d+(?:\.\d+)?$/;
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
		inst._zod.pattern = number;
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
					if (typeof key === "string" && number.test(key) && keyResult.issues.length) {
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
	function _gte(value, params) {
		return new $ZodCheckGreaterThan({
			check: "greater_than",
			...normalizeParams(params),
			value,
			inclusive: true
		});
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
	var TagTypeSchema = _enum([TAG_TYPE_INCLUDE, TAG_TYPE_EXCLUDE]);
	var TagEntrySchema = object({
		tag: string().check(_minLength(1)),
		type: TagTypeSchema
	});
	var CollectionSchema = object({
		id: string().check(_minLength(1)),
		name: string().check(_minLength(1)),
		tags: array(TagEntrySchema)
	});
	var ArtistEntrySchema = object({ tag: string().check(_minLength(1)) });
	var MarkFlagsSchema = object({
		fav: optional(boolean()),
		seen: optional(boolean())
	});
	var SettingsSchema = object({
		gridFavButtons: boolean(),
		updatesGroupSize: optional(int().check(_nonnegative())),
		tweaksEnabled: optional(boolean()),
		features: optional(record(string(), boolean())),
		featureChoice: optional(record(string(), string())),
		featureState: optional(record(string(), unknown()))
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
	function createDefaultFavs() {
		return {
			version: 1,
			ids: []
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
				tweaksEnabled: true
			},
			updates: { seenPostId: 0 }
		};
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
	function normalizePostId(id) {
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
					const normalized = normalizePostId(postId);
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
		const normalized = normalizePostId(id);
		if (normalized === null) return false;
		return ensureCache().has(normalized);
	}
	function addFav(id) {
		const normalized = normalizePostId(id);
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
		const normalized = normalizePostId(id);
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
			const normalized = normalizePostId(id);
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
				const normalized = normalizePostId(postId);
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
			tweaksEnabled: resolveTweaksEnabled(data)
		};
		if (data.settings?.features !== void 0) next.features = { ...data.settings.features };
		if (data.settings?.featureChoice !== void 0) next.featureChoice = { ...data.settings.featureChoice };
		if (data.settings?.featureState !== void 0) next.featureState = { ...data.settings.featureState };
		return next;
	}
	function load() {
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
	function save(data) {
		writeData(StorageSchema.parse(data));
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
			updatesGroupSize: incoming.updatesGroupSize ?? current.updatesGroupSize
		};
		if (incoming.tweaksEnabled !== void 0) merged.tweaksEnabled = incoming.tweaksEnabled;
		else if (current.tweaksEnabled !== void 0) merged.tweaksEnabled = current.tweaksEnabled;
		const features = mergeBooleanRecord(current.features, incoming.features);
		if (features !== void 0) merged.features = features;
		const featureChoice = mergeStringRecord(current.featureChoice, incoming.featureChoice);
		if (featureChoice !== void 0) merged.featureChoice = featureChoice;
		const featureState = mergeUnknownRecord(current.featureState, incoming.featureState);
		if (featureState !== void 0) merged.featureState = featureState;
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
			tweaksEnabled: true
		};
		save(merged);
		addFavs(Array.from(favIdsToMerge));
		return merged;
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
	var FEATURE_ID$4 = "grid-density";
	var COMPACT_PX = 150;
	var LARGE_PX = 250;
	function sizeCss(choiceValue, px) {
		const bodyClass = featureChoiceBodyClass(FEATURE_ID$4, choiceValue);
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
	var gridDensityFeature = {
		id: FEATURE_ID$4,
		label: "Grid size",
		pages: ["list", "favorites"],
		defaultEnabled: true,
		cssOnly: true,
		choice: {
			options: [
				{
					value: "compact",
					label: "Compact"
				},
				{
					value: "default",
					label: "Default"
				},
				{
					value: "large",
					label: "Large"
				}
			],
			defaultValue: "default"
		},
		css: [sizeCss("compact", COMPACT_PX), sizeCss("large", LARGE_PX)].join("\n"),
		mount: () => {}
	};
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
	var FOLLOWED_BADGE_FEATURE_ID = "followed-badge";
	var SEEN_DIM_FEATURE_ID = "seen-dim";
	var FOLLOWED_BADGE_CLASS = "rdw-followed-badge";
	var SEEN_CLASS = "rdw-seen";
	var FOLLOWED_BADGE_LABEL = "Following badge";
	var FOLLOWED_BADGE_TITLE_PREFIX = "Following: ";
	var SEEN_DIM_LABEL = "Dim seen posts";
	var BADGE_OFFSET_PX = "4px";
	var BADGE_SIZE_PX = "18px";
	var BADGE_FONT_SIZE_PX = "12px";
	var SEEN_DIM_OPACITY = "0.4";
	var SEEN_DIM_HOVER_OPACITY = "1";
	var ALT_TAG_SEPARATOR = " ";
	var BADGE_TAG_JOIN = ", ";
	var BADGE_CHECKMARK = "✓";
	function findThumbLink$1(thumb, postId) {
		if (postId !== null) {
			const byId = thumb.querySelector(`#p${postId}`);
			if (byId instanceof HTMLAnchorElement) return byId;
		}
		const byHref = thumb.querySelector(SITE_SELECTORS.thumbLink);
		return byHref instanceof HTMLAnchorElement ? byHref : null;
	}
	function collectIncludeTags(search) {
		const entries = readTagsFromLocation(search);
		const includes = new Set();
		if (entries === null) return includes;
		for (const entry of entries) {
			if (entry.type !== "include") continue;
			const normalized = normalizeArtistTag(entry.tag);
			if (normalized !== null) includes.add(normalized);
		}
		return includes;
	}
	function followedBadgeCaption(tags) {
		return `${FOLLOWED_BADGE_TITLE_PREFIX}${tags.join(BADGE_TAG_JOIN)}`;
	}
	function findBadgeArtistTags(thumb, includeTags) {
		const preview = thumb.querySelector(SITE_SELECTORS.previewImage);
		if (!(preview instanceof HTMLImageElement)) {
			log.warn("followed-badge: missing img.preview on thumb", thumb.id);
			return [];
		}
		const alt = preview.alt.trim();
		if (alt.length === 0) return [];
		const matched = [];
		const seen = new Set();
		for (const raw of alt.split(ALT_TAG_SEPARATOR)) {
			if (raw.length === 0) continue;
			if (!isFollowingArtist(raw)) continue;
			const normalized = normalizeArtistTag(raw);
			if (normalized === null) continue;
			if (includeTags.has(normalized)) continue;
			if (seen.has(normalized)) continue;
			seen.add(normalized);
			matched.push(normalized);
		}
		return matched;
	}
	function ensureFollowedBadge(thumb, includeTags) {
		if (thumb.querySelector(`.${FOLLOWED_BADGE_CLASS}`) !== null) return;
		const artistTags = findBadgeArtistTags(thumb, includeTags);
		if (artistTags.length === 0) return;
		const link = findThumbLink$1(thumb, extractPostIdFromThumb(thumb));
		if (link === null) {
			log.warn("followed-badge: missing post link on thumb", thumb.id);
			return;
		}
		ensureThumbAnchor(thumb);
		const caption = followedBadgeCaption(artistTags);
		const badge = document.createElement("span");
		badge.className = FOLLOWED_BADGE_CLASS;
		badge.textContent = BADGE_CHECKMARK;
		badge.title = caption;
		badge.setAttribute("aria-label", caption);
		link.after(badge);
	}
	function mountFollowedBadge(ctx) {
		const includeTags = collectIncludeTags(ctx.search);
		const thumbs = document.querySelectorAll(SITE_SELECTORS.thumb);
		for (const thumb of thumbs) {
			if (!(thumb instanceof HTMLElement)) continue;
			ensureFollowedBadge(thumb, includeTags);
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
		const marks = load().marks;
		const thumbs = document.querySelectorAll(SITE_SELECTORS.thumb);
		for (const thumb of thumbs) {
			if (!(thumb instanceof HTMLElement)) continue;
			const postId = extractPostIdFromThumb(thumb);
			if (postId === null) continue;
			if (marks[postId]?.seen === true) thumb.classList.add(SEEN_CLASS);
		}
	}
	var followedBadgeFeature = {
		id: FOLLOWED_BADGE_FEATURE_ID,
		label: FOLLOWED_BADGE_LABEL,
		pages: ["list"],
		defaultEnabled: true,
		css: `
body.${featureBodyClass(FOLLOWED_BADGE_FEATURE_ID)} .${FOLLOWED_BADGE_CLASS} {
  position: absolute;
  top: ${BADGE_OFFSET_PX};
  left: ${BADGE_OFFSET_PX};
  z-index: 5;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${BADGE_SIZE_PX};
  height: ${BADGE_SIZE_PX};
  padding: 0;
  border: 1px solid #333;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #111;
  font-size: ${BADGE_FONT_SIZE_PX};
  line-height: 1;
  pointer-events: none;
  overflow: hidden;
}

@supports (anchor-name: --a) {
  body.${featureBodyClass(FOLLOWED_BADGE_FEATURE_ID)} .${FOLLOWED_BADGE_CLASS} {
    position-anchor: ${THUMB_ANCHOR_NAME};
    top: calc(anchor(top) + ${BADGE_OFFSET_PX});
    left: calc(anchor(left) + ${BADGE_OFFSET_PX});
  }
}
`,
		mount: mountFollowedBadge
	};
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
	var FEATURE_ID$3 = "menu-cleanup";
	var FEATURE_LABEL$3 = "Clean header menu";
	var CONTENT_ID = "content";
	var HIDDEN_CLASS$1 = "rdw-menu-hidden";
	var BODY_FEATURE_CLASS$1 = featureBodyClass(FEATURE_ID$3);
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
	var FEATURE_PAGES$3 = [
		"list",
		"post",
		"favorites",
		"other"
	];
	var FEATURE_CSS$3 = `body.${BODY_FEATURE_CLASS$1} li.${HIDDEN_CLASS$1} { display:none !important; }`;
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
			listItem.classList.add(HIDDEN_CLASS$1);
		}
	}
	var menuCleanupFeature = {
		id: FEATURE_ID$3,
		label: FEATURE_LABEL$3,
		pages: [...FEATURE_PAGES$3],
		defaultEnabled: true,
		cssOnly: true,
		css: FEATURE_CSS$3,
		mount: mountMenuCleanup
	};
	var PAGER_ID = "pager";
	var PAGER_ROOT_ID = "rdw-pager";
	var PAGER_CLASS = "rdw-pager";
	var PAGER_LINK_CLASS = "rdw-pager-link";
	var PAGER_LINK_DISABLED_CLASS = "rdw-pager-link--disabled";
	var PAGER_PAGE_CLASS = "rdw-pager-page";
	var PAGER_SEP_CLASS = "rdw-pager-sep";
	var SELECTOR_PAGINATION = "div.pagination";
	var SELECTOR_NEXT_LINK = "a[alt=\"next\"]";
	var SELECTOR_IMAGE_LIST = "div.image-list";
	var DEFAULT_STEP = 42;
	var TEXT_PREV = "‹ Prev";
	var TEXT_NEXT = "Next ›";
	var TEXT_SEP = "|";
	var LABEL_PREV = "Previous page";
	var LABEL_NEXT = "Next page";
	var WARN_NO_HOST$1 = "pager: image-list missing; pager not mounted";
	var BODY_CLASS$1 = featureBodyClass(PAGER_ID);
	function readPid$1(search) {
		const rawSearch = search.startsWith("?") ? search.slice(1) : search;
		const raw = new URLSearchParams(rawSearch).get("pid");
		if (raw === null || raw.trim().length === 0) return 0;
		const value = Number(raw);
		if (!Number.isFinite(value) || value < 0) return 0;
		return Math.floor(value);
	}
	function readPidFromHref(href) {
		try {
			const raw = new URL(href, window.location.href).searchParams.get("pid");
			if (raw === null || raw.trim().length === 0) return null;
			const value = Number(raw);
			if (!Number.isFinite(value) || value < 0) return null;
			return Math.floor(value);
		} catch {
			return null;
		}
	}
	function hrefForPid(baseSearch, pid) {
		const rawSearch = baseSearch.startsWith("?") ? baseSearch.slice(1) : baseSearch;
		const params = new URLSearchParams(rawSearch);
		if (pid <= 0) params.delete("pid");
		else params.set("pid", String(pid));
		const query = params.toString();
		const path = window.location.pathname;
		return query.length > 0 ? `${path}?${query}` : path;
	}
	function findNextLink() {
		const pagination = document.querySelector(SELECTOR_PAGINATION);
		if (pagination === null) return null;
		const link = pagination.querySelector(SELECTOR_NEXT_LINK);
		return link instanceof HTMLAnchorElement ? link : null;
	}
	function resolveStep(currentPid, nextLink) {
		if (nextLink === null) return {
			step: DEFAULT_STEP,
			hasNext: false,
			nextPid: null
		};
		const parsed = readPidFromHref(nextLink.getAttribute("href") ?? "");
		if (parsed === null) {
			const step = DEFAULT_STEP;
			return {
				step,
				hasNext: true,
				nextPid: currentPid + step
			};
		}
		const delta = parsed - currentPid;
		return {
			step: delta > 0 ? delta : DEFAULT_STEP,
			hasNext: true,
			nextPid: parsed
		};
	}
	function isEditableOrPanelEvent(event) {
		for (const node of event.composedPath()) {
			if (!(node instanceof Element)) continue;
			if (node.id === "ruledesk-web-root") return true;
			const tag = node.tagName;
			if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
			if (node instanceof HTMLElement && node.isContentEditable) return true;
		}
		return false;
	}
	function createDisabledControl(text, label) {
		const span = document.createElement("span");
		span.className = `${PAGER_LINK_CLASS} ${PAGER_LINK_DISABLED_CLASS}`;
		span.setAttribute("aria-disabled", "true");
		span.setAttribute("aria-label", label);
		span.textContent = text;
		return span;
	}
	function createLinkControl(text, label, href) {
		const anchor = document.createElement("a");
		anchor.className = PAGER_LINK_CLASS;
		anchor.href = href;
		anchor.setAttribute("aria-label", label);
		anchor.textContent = text;
		return anchor;
	}
	function createSep() {
		const sep = document.createElement("span");
		sep.className = PAGER_SEP_CLASS;
		sep.setAttribute("aria-hidden", "true");
		sep.textContent = TEXT_SEP;
		return sep;
	}
	function buildPagerRoot(pageNumber, prevHref, nextHref) {
		const root = document.createElement("nav");
		root.id = PAGER_ROOT_ID;
		root.className = PAGER_CLASS;
		root.setAttribute("aria-label", "Pagination");
		const prev = prevHref === null ? createDisabledControl(TEXT_PREV, LABEL_PREV) : createLinkControl(TEXT_PREV, LABEL_PREV, prevHref);
		const page = document.createElement("span");
		page.className = PAGER_PAGE_CLASS;
		page.textContent = `Page ${pageNumber}`;
		const next = nextHref === null ? createDisabledControl(TEXT_NEXT, LABEL_NEXT) : createLinkControl(TEXT_NEXT, LABEL_NEXT, nextHref);
		root.append(prev, createSep(), page, createSep(), next);
		return root;
	}
	function findImageList() {
		const imageList = document.querySelector(SELECTOR_IMAGE_LIST);
		if (imageList === null || imageList.parentNode === null) return null;
		return imageList;
	}
	function removeExistingPager() {
		const existing = document.getElementById(PAGER_ROOT_ID);
		if (existing !== null) existing.remove();
	}
	var keyboardHandler = null;
	function detachKeyboardNav() {
		if (keyboardHandler !== null) {
			document.removeEventListener("keydown", keyboardHandler);
			keyboardHandler = null;
		}
	}
	function attachKeyboardNav(prevHref, nextHref) {
		detachKeyboardNav();
		const onKeyDown = (event) => {
			if (event.defaultPrevented) return;
			if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
			if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
			if (isEditableOrPanelEvent(event)) return;
			const targetHref = event.key === "ArrowLeft" ? prevHref : nextHref;
			if (targetHref === null) return;
			event.preventDefault();
			window.location.assign(targetHref);
		};
		keyboardHandler = onKeyDown;
		document.addEventListener("keydown", onKeyDown);
	}
	function mountPager(ctx) {
		const currentPid = readPid$1(ctx.search);
		const { step, hasNext, nextPid } = resolveStep(currentPid, findNextLink());
		const prevPid = currentPid > 0 ? Math.max(0, currentPid - step) : null;
		const pageNumber = Math.floor(currentPid / step) + 1;
		const prevHref = prevPid === null ? null : hrefForPid(ctx.search, prevPid);
		const nextHref = hasNext && nextPid !== null ? hrefForPid(ctx.search, nextPid) : null;
		const imageList = findImageList();
		if (imageList === null) {
			detachKeyboardNav();
			log.warn(WARN_NO_HOST$1);
			return;
		}
		removeExistingPager();
		const root = buildPagerRoot(pageNumber, prevHref, nextHref);
		imageList.parentNode?.insertBefore(root, imageList);
		attachKeyboardNav(prevHref, nextHref);
	}
	var pagerFeature = {
		id: PAGER_ID,
		label: "Top pagination",
		pages: ["list"],
		defaultEnabled: true,
		css: `
body.${BODY_CLASS$1} .${PAGER_CLASS} {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.3;
}
body.${BODY_CLASS$1} .${PAGER_LINK_CLASS} {
  color: inherit;
  text-decoration: none;
  border-radius: 2px;
}
body.${BODY_CLASS$1} .${PAGER_LINK_CLASS}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}
body.${BODY_CLASS$1} .${PAGER_LINK_DISABLED_CLASS} {
  opacity: 0.45;
  pointer-events: none;
  cursor: default;
}
body.${BODY_CLASS$1} .${PAGER_PAGE_CLASS} {
  font-variant-numeric: tabular-nums;
}
body.${BODY_CLASS$1} .${PAGER_SEP_CLASS} {
  opacity: 0.55;
  user-select: none;
}
`.trim(),
		mount: mountPager
	};
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
			const score = parseVoteScore(await fetchText(buildVoteUrl(postId)));
			if (score === void 0) return { status: "added" };
			return {
				status: "added",
				score
			};
		} catch (error) {
			log.warn("vote request failed after addfav", postId, error);
			return { status: "added" };
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
	var FEATURE_ID$2 = "post-actions";
	var FEATURE_LABEL$2 = "Post actions";
	var FEATURE_PAGES$2 = ["post"];
	var HOST_RIGHT_COL_ID = "right-col";
	var HOST_POST_VIEW_ID = "post-view";
	var ORIGINAL_LINK_TEXT = "Original image";
	var SCORE_SPAN_ID_PREFIX = "psc";
	var CLASS_BAR = "rdw-post-actions";
	var CLASS_FAV_WRAP = "rdw-post-actions-fav-wrap";
	var CLASS_FAV_BUTTON = "rdw-post-actions-fav";
	var CLASS_FAV_LABEL = "rdw-post-actions-fav-label";
	var CLASS_FOLLOW = "rdw-post-actions-follow";
	var CLASS_ORIGINAL = "rdw-post-actions-original";
	var CLASS_SCORE = "rdw-post-actions-score";
	var TEXT_FAVORITE = "Favorite";
	var TEXT_IN_FAVORITES = "In favorites";
	var TEXT_FOLLOW = "Follow";
	var TEXT_FOLLOWING = "Following";
	var TEXT_ORIGINAL = "Original";
	var TEXT_SCORE_PREFIX = "Score: ";
	var LABEL_ORIGINAL = "Open original image";
	var WARN_NO_HOST = "post-actions: #right-col and #post-view missing; not mounted";
	var FOCUS_OUTLINE = "2px solid #4c8bf5";
	var FOCUS_OUTLINE_OFFSET = "2px";
	var BODY_SELECTOR = `body.${featureBodyClass(FEATURE_ID$2)}`;
	var FEATURE_CSS$2 = `
${BODY_SELECTOR} #${POST_ACTIONS_ID}.${CLASS_BAR} {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  line-height: 1.3;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_WRAP} {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_BUTTON},
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FOLLOW},
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_ORIGINAL} {
  color: inherit;
  background: transparent;
  border: 1px solid currentColor;
  border-radius: 2px;
  padding: 0.15rem 0.45rem;
  cursor: pointer;
  text-decoration: none;
  font: inherit;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_BUTTON}.${CSS_CLASS.cardFavMarked},
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FOLLOW}[aria-pressed="true"] {
  font-weight: 600;
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FAV_BUTTON}:focus-visible,
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_FOLLOW}:focus-visible,
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_ORIGINAL}:focus-visible {
  outline: ${FOCUS_OUTLINE};
  outline-offset: ${FOCUS_OUTLINE_OFFSET};
}
${BODY_SELECTOR} #${POST_ACTIONS_ID} .${CLASS_SCORE} {
  font-variant-numeric: tabular-nums;
}
`.trim();
	function findHost() {
		const rightCol = document.getElementById(HOST_RIGHT_COL_ID);
		if (rightCol !== null) return rightCol;
		return document.getElementById(HOST_POST_VIEW_ID);
	}
	function removeExistingBar$1() {
		const existing = document.getElementById(POST_ACTIONS_ID);
		if (existing !== null) existing.remove();
	}
	function extractArtistTagFromLi$1(li) {
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
	function collectArtistTags() {
		const sidebar = document.querySelector(SITE_SELECTORS.tagSidebar);
		if (sidebar === null) return [];
		const tags = [];
		const seen = new Set();
		const rows = sidebar.querySelectorAll(SITE_SELECTORS.tagTypeArtist);
		for (const row of rows) {
			const tag = extractArtistTagFromLi$1(row);
			if (tag === null || seen.has(tag)) continue;
			seen.add(tag);
			tags.push(tag);
		}
		return tags;
	}
	function findOriginalHref() {
		const links = document.querySelectorAll("a[href]");
		for (const node of links) {
			if (!(node instanceof HTMLAnchorElement)) continue;
			if (node.textContent?.trim() !== ORIGINAL_LINK_TEXT) continue;
			const href = node.getAttribute("href");
			if (href === null || href.length === 0 || href === "#") continue;
			return href;
		}
		return null;
	}
	function readScoreText(postId) {
		const span = document.getElementById(`${SCORE_SPAN_ID_PREFIX}${postId}`);
		if (span === null) return null;
		const text = span.textContent?.trim() ?? "";
		return text.length > 0 ? text : null;
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
	function createFollowButton(tag) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = CLASS_FOLLOW;
		button.dataset.rdwArtistTag = tag;
		applyFollowState$1(button, isFollowingArtist(tag));
		button.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			const following = button.getAttribute("aria-pressed") === "true";
			try {
				if (following) {
					removeArtist(tag);
					applyFollowState$1(button, false);
				} else {
					addArtist(tag);
					applyFollowState$1(button, true);
				}
			} catch {
				applyFollowState$1(button, isFollowingArtist(tag));
			}
		});
		return button;
	}
	function applyFollowState$1(button, following) {
		const tag = button.dataset.rdwArtistTag ?? "";
		const verb = following ? TEXT_FOLLOWING : TEXT_FOLLOW;
		button.setAttribute("aria-pressed", following ? "true" : "false");
		button.setAttribute("aria-label", `${verb} ${tag}`);
		button.textContent = `${verb} ${tag}`;
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
	function buildBar(ctx) {
		const bar = document.createElement("div");
		bar.id = POST_ACTIONS_ID;
		bar.className = CLASS_BAR;
		bar.setAttribute("role", "toolbar");
		bar.setAttribute("aria-label", FEATURE_LABEL$2);
		const postId = readPostIdFromSearch(ctx.search);
		let scoreLabel = null;
		if (postId !== null) {
			const scoreText = readScoreText(postId);
			if (scoreText !== null) scoreLabel = createScoreLabel(scoreText);
			bar.append(createPostFavControl(postId, scoreLabel));
		}
		for (const tag of collectArtistTags()) bar.append(createFollowButton(tag));
		const originalHref = findOriginalHref();
		if (originalHref !== null) bar.append(createOriginalLink(originalHref));
		if (scoreLabel !== null) bar.append(scoreLabel);
		return bar;
	}
	function mountPostActions(ctx) {
		const host = findHost();
		if (host === null) {
			log.warn(WARN_NO_HOST);
			return;
		}
		removeExistingBar$1();
		const bar = buildBar(ctx);
		host.insertBefore(bar, host.firstChild);
	}
	var postActionsFeature = {
		id: FEATURE_ID$2,
		label: FEATURE_LABEL$2,
		pages: [...FEATURE_PAGES$2],
		defaultEnabled: true,
		css: FEATURE_CSS$2,
		mount: mountPostActions
	};
	var FEATURE_ID$1 = "search-tokens";
	var FEATURE_LABEL$1 = "Show search tags as a list under the search field";
	var FEATURE_PAGES$1 = ["list", "post"];
	var TAGS_INPUT_SELECTOR = "input[name=\"tags\"]";
	var TAG_SIDEBAR_SELECTOR$1 = "ul#tag-sidebar";
	var ROOT_ID = "rdw-search-tokens";
	var ROOT_CLASS = "rdw-search-tokens";
	var TOKEN_CLASS = "rdw-search-token";
	var TOKEN_EXCLUDE_CLASS = "rdw-search-token--exclude";
	var HIDDEN_CLASS = "rdw-search-tokens--hidden";
	var EXCLUDE_PREFIX = "-";
	var TOKEN_SPLIT_RE = /\s+/;
	var MULTI_SPACE_RE = /\s+/g;
	var POLL_INTERVAL_MS = 700;
	var EVENT_INPUT = "input";
	var EVENT_CHANGE = "change";
	var EVENT_AWESOMPLETE_SELECT = "awesomplete-selectcomplete";
	var EVENT_AWESOMPLETE_CLOSE = "awesomplete-close";
	var EVENT_CLICK = "click";
	var WARN_NO_FORM = "search-tokens: search form not found; not mounted";
	var BODY_CLASS = featureBodyClass(FEATURE_ID$1);
	var FEATURE_CSS$1 = [
		`body.${BODY_CLASS} .${ROOT_CLASS} {`,
		"  display: flex;",
		"  flex-wrap: wrap;",
		"  gap: 0.25rem;",
		"  max-width: 100%;",
		"  margin: 0.25rem 0;",
		"}",
		`body.${BODY_CLASS} .${ROOT_CLASS}.${HIDDEN_CLASS} {`,
		"  display: none;",
		"}",
		`body.${BODY_CLASS} button.${TOKEN_CLASS} {`,
		"  max-width: 100%;",
		"  overflow-wrap: anywhere;",
		"  word-break: break-word;",
		"  font: inherit;",
		"  line-height: 1.2;",
		"  padding: 0.1rem 0.35rem;",
		"  border: 1px solid #666;",
		"  border-radius: 2px;",
		"  background: #f0f0f0;",
		"  color: inherit;",
		"  cursor: pointer;",
		"}",
		`body.${BODY_CLASS} button.${TOKEN_CLASS}.${TOKEN_EXCLUDE_CLASS} {`,
		"  background: #f5e0e0;",
		"  border-color: #a66;",
		"}",
		`body.${BODY_CLASS} button.${TOKEN_CLASS}:focus-visible {`,
		"  outline: 2px solid #4c8bf5;",
		"  outline-offset: 2px;",
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
	function removeTokenAt(value, index) {
		const tokens = parseTokens(value);
		if (index < 0 || index >= tokens.length) return normalizeSpaces(value);
		tokens.splice(index, 1);
		return tokens.join(" ");
	}
	function ariaLabelForToken(token) {
		return `Remove ${token} from search`;
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
	function renderTokens(root, input) {
		const tokens = parseTokens(input.value);
		root.replaceChildren();
		if (tokens.length === 0) {
			root.classList.add(HIDDEN_CLASS);
			return;
		}
		root.classList.remove(HIDDEN_CLASS);
		for (let index = 0; index < tokens.length; index += 1) {
			const token = tokens[index];
			if (token === void 0) continue;
			const button = document.createElement("button");
			button.type = "button";
			button.className = TOKEN_CLASS;
			if (token.startsWith(EXCLUDE_PREFIX)) button.classList.add(TOKEN_EXCLUDE_CLASS);
			button.textContent = token;
			button.setAttribute("aria-label", ariaLabelForToken(token));
			const tokenIndex = index;
			button.addEventListener(EVENT_CLICK, () => {
				input.value = removeTokenAt(input.value, tokenIndex);
				input.dispatchEvent(new Event(EVENT_INPUT, { bubbles: true }));
				input.focus();
				renderTokens(root, input);
			});
			root.append(button);
		}
	}
	function mountSearchTokens(_ctx) {
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
		let lastValue = input.value;
		renderTokens(root, input);
		const refresh = () => {
			lastValue = input.value;
			renderTokens(root, input);
		};
		const onInputLike = () => {
			refresh();
		};
		input.addEventListener(EVENT_INPUT, onInputLike);
		input.addEventListener(EVENT_CHANGE, onInputLike);
		input.addEventListener(EVENT_AWESOMPLETE_SELECT, onInputLike);
		input.addEventListener(EVENT_AWESOMPLETE_CLOSE, onInputLike);
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
	var searchTokensFeature = {
		id: FEATURE_ID$1,
		label: FEATURE_LABEL$1,
		pages: [...FEATURE_PAGES$1],
		defaultEnabled: true,
		css: FEATURE_CSS$1,
		mount: mountSearchTokens
	};
	var FEATURE_ID = "tag-groups";
	var FEATURE_LABEL = "Collapse General and Meta tags";
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
		pagerFeature,
		menuCleanupFeature,
		{
			id: FEATURE_ID,
			label: FEATURE_LABEL,
			pages: [...FEATURE_PAGES],
			defaultEnabled: true,
			css: FEATURE_CSS,
			mount: mountTagGroups
		},
		searchTokensFeature,
		followedBadgeFeature,
		seenDimFeature,
		postActionsFeature,
		gridDensityFeature
	];
	var mountedIds = new Set();
	var activePageKind = null;
	var activeSearch = "";
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
	var FAVORITES_SYNC_PAGE_PAUSE_MS = 1500;
	var MY_FAVORITES_LINK_SELECTOR = "li#my-favorites-container a[href*=\"page=favorites\"]";
	var THUMB_SELECTOR = "span.thumb";
	var THUMB_POST_LINK_SELECTOR = "span.thumb a[id^=\"p\"]";
	var PAGINATOR_SELECTOR = "#paginator";
	var LASTPAGE_SELECTOR = "a[name=\"lastpage\"]";
	var REMOVE_LINK_SELECTOR = "a[onclick]";
	var POST_LINK_ID_PATTERN = /^p(\d+)$/;
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
	function parsePidFromHref(href) {
		try {
			return parsePositiveInt(new URL(href, URL_PARSE_BASE).searchParams.get("pid"));
		} catch {
			return null;
		}
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
		if (!(lastpage instanceof HTMLAnchorElement)) return currentPid;
		const fromHref = parsePidFromHref(lastpage.href);
		if (fromHref !== null) return fromHref;
		const fromAttr = parsePositiveInt(lastpage.getAttribute("pid"));
		if (fromAttr !== null) return fromAttr;
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
				const cardCount = doc.querySelectorAll(THUMB_SELECTOR).length;
				lastPid = resolveLastPid(doc, pid);
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
	function createFavoritesSyncSection() {
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
		section.append(title, status, progress, actions, error, warning, note, pauseHint);
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
	var PANEL_CSS = `
:host {
  all: initial;
  font-family: Segoe UI, system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: #1a1a1a;
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
  border: 1px solid #444;
  border-radius: 999px;
  background: #111;
  color: #fff;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
}

.${CSS_CLASS.toggle}:focus-visible {
  outline: 2px solid #4c8bf5;
  outline-offset: 2px;
}

.${CSS_CLASS.panel} {
  display: none;
  width: min(360px, calc(100vw - 32px));
  max-height: min(70vh, 560px);
  overflow: auto;
  background: #f7f7f7;
  border: 1px solid #333;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
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
  border-bottom: 1px solid #ccc;
  background: #ececec;
  position: sticky;
  top: 0;
}

.${CSS_CLASS.title} {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.${CSS_CLASS.close} {
  border: 1px solid #666;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  min-width: 32px;
  min-height: 32px;
  width: 32px;
  height: 32px;
  padding: 0;
  color: #1a1a1a;
  font-size: 18px;
  line-height: 1;
}

.${CSS_CLASS.body} {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
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
  color: #444;
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
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
}

.${CSS_CLASS.itemName} {
  border: 0;
  background: transparent;
  color: #0b57d0;
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
  outline: 2px solid #4c8bf5;
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
  border: 1px solid #666;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  min-height: 32px;
  padding: 4px 8px;
  font: inherit;
}

.${CSS_CLASS.primaryButton} {
  border: 1px solid #0b57d0;
  background: #0b57d0;
  color: #fff;
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
  border: 1px solid #a12828;
  background: #a12828;
  color: #fff;
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
  color: #333;
}

.${CSS_CLASS.input} {
  border: 1px solid #666;
  border-radius: 4px;
  min-height: 32px;
  padding: 4px 8px;
  font: inherit;
  background: #fff;
}

.${CSS_CLASS.hint} {
  margin: 0;
  color: #555;
  font-size: 12px;
}

.${CSS_CLASS.error} {
  margin: 0;
  color: #a12828;
  font-size: 12px;
}

.${CSS_CLASS.hidden} {
  display: none !important;
}

${FAVORITES_SYNC_SECTION_CSS}
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
	function ensureDocumentStyles() {
		if (document.getElementById("ruledesk-web-document-style") !== null) return;
		const style = document.createElement("style");
		style.id = DOCUMENT_STYLE_ID;
		style.textContent = `${BASE_GRID_CSS}\n${CARD_CSS}`;
		document.head.append(style);
	}
	function findThumbLink(thumb, postId) {
		const byId = thumb.querySelector(`#p${postId}`);
		if (byId instanceof HTMLAnchorElement) return byId;
		const byHref = thumb.querySelector(SITE_SELECTORS.thumbLink);
		return byHref instanceof HTMLAnchorElement ? byHref : null;
	}
	function attachFavButton(thumb, postId, marked) {
		if (thumb.querySelector(SITE_SELECTORS.cardFavButton) !== null) return;
		const link = findThumbLink(thumb, postId);
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
	function buildSaveSection(controller) {
		const saveSection = document.createElement("section");
		saveSection.className = CSS_CLASS.section;
		const searchTags = controller.currentSearchTags();
		const canSave = searchTags !== null && searchTags.length > 0;
		if (controller.getMode().kind === "save") {
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
			input.value = controller.getNameDraft();
			input.addEventListener("input", () => {
				controller.setNameDraft(input.value);
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
				controller.setMode({ kind: "list" });
				controller.render();
			});
			actions.append(saveBtn, cancelBtn);
			form.append(field, actions);
			form.addEventListener("submit", (event) => {
				event.preventDefault();
				const tags = controller.currentSearchTags();
				if (tags === null || tags.length === 0) {
					controller.setMode({ kind: "list" });
					controller.render();
					return;
				}
				const name = controller.getNameDraft().trim();
				if (name.length === 0) return;
				addCollection(name, tags);
				controller.setMode({ kind: "list" });
				controller.render();
			});
			saveSection.append(form);
			queueMicrotask(() => {
				input.focus();
				input.select();
			});
			return saveSection;
		}
		const saveBtn = document.createElement("button");
		saveBtn.type = "button";
		saveBtn.className = CSS_CLASS.primaryButton;
		saveBtn.textContent = UI_TEXT.saveCurrent;
		saveBtn.disabled = !canSave;
		saveBtn.addEventListener("click", () => {
			const tags = controller.currentSearchTags();
			if (tags === null || tags.length === 0) return;
			controller.setNameDraft(serialize(tags));
			controller.setMode({ kind: "save" });
			controller.render();
		});
		saveSection.append(saveBtn);
		if (!canSave) {
			const hint = document.createElement("p");
			hint.className = CSS_CLASS.hint;
			hint.textContent = UI_TEXT.notOnSearchPage;
			saveSection.append(hint);
		}
		return saveSection;
	}
	function buildCollectionRow(collection, controller) {
		const item = document.createElement("li");
		item.className = CSS_CLASS.listItem;
		const mode = controller.getMode();
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
			input.value = controller.getNameDraft();
			input.addEventListener("input", () => {
				controller.setNameDraft(input.value);
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
				controller.setMode({ kind: "list" });
				controller.render();
			});
			actions.append(saveBtn, cancelBtn);
			form.append(field, actions);
			form.addEventListener("submit", (event) => {
				event.preventDefault();
				const nextName = controller.getNameDraft().trim();
				if (nextName.length === 0) return;
				renameCollection(collection.id, nextName);
				controller.setMode({ kind: "list" });
				controller.render();
			});
			item.append(form);
			queueMicrotask(() => {
				input.focus();
				input.select();
			});
			return item;
		}
		if (mode.kind === "confirm-delete" && mode.id === collection.id) {
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
				controller.setMode({ kind: "list" });
				controller.render();
			});
			const cancelBtn = document.createElement("button");
			cancelBtn.type = "button";
			cancelBtn.className = CSS_CLASS.secondaryButton;
			cancelBtn.textContent = UI_TEXT.cancel;
			cancelBtn.addEventListener("click", () => {
				controller.setMode({ kind: "list" });
				controller.render();
			});
			actions.append(confirmBtn, cancelBtn);
			item.append(prompt, actions);
			return item;
		}
		const nameBtn = document.createElement("button");
		nameBtn.type = "button";
		nameBtn.className = CSS_CLASS.itemName;
		nameBtn.textContent = collection.name;
		nameBtn.setAttribute("aria-label", `${UI_TEXT.openCollection}: ${collection.name}`);
		nameBtn.addEventListener("click", () => {
			window.location.assign(buildSearchUrl(collection.tags));
		});
		const actions = document.createElement("div");
		actions.className = CSS_CLASS.itemActions;
		const renameBtn = document.createElement("button");
		renameBtn.type = "button";
		renameBtn.className = CSS_CLASS.iconButton;
		renameBtn.textContent = UI_TEXT.rename;
		renameBtn.setAttribute("aria-label", `${UI_TEXT.rename}: ${collection.name}`);
		renameBtn.addEventListener("click", () => {
			controller.setNameDraft(collection.name);
			controller.setMode({
				kind: "rename",
				id: collection.id
			});
			controller.render();
		});
		const deleteBtn = document.createElement("button");
		deleteBtn.type = "button";
		deleteBtn.className = CSS_CLASS.iconButton;
		deleteBtn.textContent = UI_TEXT.delete;
		deleteBtn.setAttribute("aria-label", `${UI_TEXT.delete}: ${collection.name}`);
		deleteBtn.addEventListener("click", () => {
			controller.setMode({
				kind: "confirm-delete",
				id: collection.id
			});
			controller.render();
		});
		actions.append(renameBtn, deleteBtn);
		item.append(nameBtn, actions);
		return item;
	}
	function buildCollectionsSection(collections, controller) {
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
			return collectionsSection;
		}
		const list = document.createElement("ul");
		list.className = CSS_CLASS.list;
		for (const collection of collections) list.append(buildCollectionRow(collection, controller));
		collectionsSection.append(list);
		return collectionsSection;
	}
	function buildFeatureSettingsRows() {
		const rows = [];
		for (const feature of FEATURES) {
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
			if (feature.choice === void 0) continue;
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
		}
		return rows;
	}
	function buildSettingsSection() {
		const section = document.createElement("section");
		section.className = CSS_CLASS.section;
		const title = document.createElement("h3");
		title.className = CSS_CLASS.sectionTitle;
		title.textContent = UI_TEXT.settingsHeading;
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
		section.append(title, tweaksRow);
		const themeRow = document.createElement("div");
		themeRow.className = CSS_CLASS.checkboxRow;
		const themeCheckbox = document.createElement("input");
		themeCheckbox.type = "checkbox";
		themeCheckbox.id = SITE_DARK_THEME_CHECKBOX_ID;
		themeCheckbox.className = CSS_CLASS.checkbox;
		themeCheckbox.checked = getSiteTheme() === "dark";
		themeCheckbox.addEventListener("change", () => {
			setSiteTheme(themeCheckbox.checked ? "dark" : "light");
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
		section.append(favRow);
		return section;
	}
	function buildArtistsSection(artists, controller) {
		const section = document.createElement("section");
		section.className = CSS_CLASS.section;
		const title = document.createElement("h3");
		title.className = CSS_CLASS.sectionTitle;
		title.textContent = UI_TEXT.artistsHeading;
		section.append(title);
		const form = document.createElement("form");
		form.className = CSS_CLASS.form;
		const field = document.createElement("div");
		field.className = CSS_CLASS.field;
		const label = document.createElement("label");
		label.className = CSS_CLASS.label;
		label.htmlFor = "rdw-artist-tag";
		label.textContent = UI_TEXT.artistTagLabel;
		const input = document.createElement("input");
		input.id = "rdw-artist-tag";
		input.className = CSS_CLASS.input;
		input.type = "text";
		input.value = controller.getArtistDraft();
		input.addEventListener("input", () => {
			controller.setArtistDraft(input.value);
		});
		field.append(label, input);
		const actions = document.createElement("div");
		actions.className = CSS_CLASS.formActions;
		const addBtn = document.createElement("button");
		addBtn.type = "submit";
		addBtn.className = CSS_CLASS.primaryButton;
		addBtn.textContent = UI_TEXT.artistAdd;
		actions.append(addBtn);
		form.append(field, actions);
		form.addEventListener("submit", (event) => {
			event.preventDefault();
			const normalized = normalizeArtistTag(controller.getArtistDraft());
			if (normalized === null) {
				controller.setArtistError(UI_TEXT.artistInvalid);
				controller.render();
				return;
			}
			try {
				addArtist(normalized);
				controller.setArtistDraft("");
				controller.setArtistError("");
				controller.render();
			} catch {
				controller.setArtistError(UI_TEXT.artistDuplicate);
				controller.render();
			}
		});
		section.append(form);
		if (controller.getArtistError().length > 0) {
			const error = document.createElement("p");
			error.className = CSS_CLASS.error;
			error.textContent = controller.getArtistError();
			section.append(error);
		}
		if (artists.length === 0) {
			const empty = document.createElement("p");
			empty.className = CSS_CLASS.hint;
			empty.textContent = UI_TEXT.artistsEmpty;
			section.append(empty);
		} else {
			const list = document.createElement("ul");
			list.className = CSS_CLASS.list;
			for (const artist of artists) {
				const item = document.createElement("li");
				item.className = CSS_CLASS.listItem;
				const nameBtn = document.createElement("button");
				nameBtn.type = "button";
				nameBtn.className = CSS_CLASS.itemName;
				nameBtn.textContent = artist.tag;
				nameBtn.setAttribute("aria-label", `${UI_TEXT.artistOpenSearch}: ${artist.tag}`);
				nameBtn.addEventListener("click", () => {
					window.location.assign(buildSearchUrl([{
						tag: artist.tag,
						type: TAG_TYPE_INCLUDE
					}]));
				});
				const itemActions = document.createElement("div");
				itemActions.className = CSS_CLASS.itemActions;
				const removeBtn = document.createElement("button");
				removeBtn.type = "button";
				removeBtn.className = CSS_CLASS.iconButton;
				removeBtn.textContent = UI_TEXT.artistRemove;
				removeBtn.setAttribute("aria-label", `${UI_TEXT.artistUnfollow}: ${artist.tag}`);
				removeBtn.addEventListener("click", () => {
					removeArtist(artist.tag);
					controller.render();
				});
				itemActions.append(removeBtn);
				item.append(nameBtn, itemActions);
				list.append(item);
			}
			section.append(list);
		}
		const groupField = document.createElement("div");
		groupField.className = CSS_CLASS.field;
		const groupLabel = document.createElement("label");
		groupLabel.className = CSS_CLASS.label;
		groupLabel.htmlFor = "rdw-updates-group-size";
		groupLabel.textContent = UI_TEXT.updatesGroupSizeLabel;
		const groupInput = document.createElement("input");
		groupInput.id = "rdw-updates-group-size";
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
		const seen = getSeenPostId();
		const seenHint = document.createElement("p");
		seenHint.className = CSS_CLASS.hint;
		seenHint.textContent = seen > 0 ? `${UI_TEXT.seenUpTo}${String(seen)}` : UI_TEXT.seenNothing;
		section.append(seenHint);
		const updatesActions = document.createElement("div");
		updatesActions.className = CSS_CLASS.toolbar;
		const queries = buildUpdatesQueries(artists.map((entry) => entry.tag), seen, getUpdatesGroupSize());
		if (queries.length === 0) {
			const disabled = document.createElement("button");
			disabled.type = "button";
			disabled.className = CSS_CLASS.primaryButton;
			disabled.textContent = UI_TEXT.openUpdates;
			disabled.disabled = true;
			updatesActions.append(disabled);
		} else if (queries.length === 1) {
			const openBtn = document.createElement("button");
			openBtn.type = "button";
			openBtn.className = CSS_CLASS.primaryButton;
			openBtn.textContent = UI_TEXT.openUpdates;
			const onlyQuery = queries[0];
			openBtn.addEventListener("click", () => {
				if (onlyQuery === void 0) return;
				window.location.assign(buildUpdatesSearchUrl(onlyQuery));
			});
			updatesActions.append(openBtn);
		} else queries.forEach((query, index) => {
			const openBtn = document.createElement("button");
			openBtn.type = "button";
			openBtn.className = CSS_CLASS.secondaryButton;
			openBtn.textContent = `${UI_TEXT.openUpdatesGroup} ${String(index + 1)}`;
			openBtn.addEventListener("click", () => {
				window.location.assign(buildUpdatesSearchUrl(query));
			});
			updatesActions.append(openBtn);
		});
		section.append(updatesActions);
		return section;
	}
	function buildToolbar(controller) {
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
		return toolbar;
	}
	function mountPanel(target = document.body) {
		if (document.getElementById("ruledesk-web-root") !== null) return;
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
		let mode = { kind: "list" };
		let importError = "";
		let nameDraft = "";
		let artistDraft = "";
		let artistError = "";
		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = ".json,application/json";
		fileInput.className = CSS_CLASS.hidden;
		fileInput.setAttribute("aria-hidden", "true");
		fileInput.tabIndex = -1;
		root.append(fileInput);
		const controller = {
			getMode: () => mode,
			setMode: (next) => {
				mode = next;
			},
			getNameDraft: () => nameDraft,
			setNameDraft: (value) => {
				nameDraft = value;
			},
			getArtistDraft: () => artistDraft,
			setArtistDraft: (value) => {
				artistDraft = value;
			},
			getArtistError: () => artistError,
			setArtistError: (value) => {
				artistError = value;
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
			currentSearchTags: () => readTagsFromLocation(window.location.search)
		};
		function setOpen(next) {
			open = next;
			panel.classList.toggle(CSS_CLASS.panelOpen, open);
			panel.hidden = !open;
			toggle.setAttribute("aria-expanded", open ? "true" : "false");
			toggle.setAttribute("aria-label", open ? UI_TEXT.toggleClose : UI_TEXT.toggleOpen);
			if (open) {
				render();
				const focusTarget = panel.querySelector("button, input");
				if (focusTarget instanceof HTMLElement) focusTarget.focus();
			} else {
				mode = { kind: "list" };
				importError = "";
				toggle.focus();
			}
		}
		function renderList(collections, artists) {
			panel.replaceChildren();
			const body = document.createElement("div");
			body.className = CSS_CLASS.body;
			const saveSection = buildSaveSection(controller);
			const settingsSection = buildSettingsSection();
			const favoritesSyncSection = createFavoritesSyncSection();
			const artistsSection = buildArtistsSection(artists, controller);
			const collectionsSection = buildCollectionsSection(collections, controller);
			const toolbar = buildToolbar(controller);
			if (controller.getImportError().length > 0) {
				const error = document.createElement("p");
				error.className = CSS_CLASS.error;
				error.textContent = `${UI_TEXT.importErrorPrefix} ${controller.getImportError()}`;
				body.append(saveSection, settingsSection, favoritesSyncSection, artistsSection, collectionsSection, toolbar, error);
			} else body.append(saveSection, settingsSection, favoritesSyncSection, artistsSection, collectionsSection, toolbar);
			panel.append(buildHeader(controller), body);
		}
		function render() {
			const data = load();
			renderList(data.collections, data.artists);
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
		fileInput.addEventListener("change", () => {
			const file = fileInput.files?.item(0);
			if (file === null || file === void 0) return;
			const reader = new FileReader();
			reader.addEventListener("load", () => {
				try {
					importJson(typeof reader.result === "string" ? reader.result : "");
					importError = "";
					mode = { kind: "list" };
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
	function buildReloadHref(artistTags, seenPostId) {
		const first = buildUpdatesQueries(artistTags, seenPostId, getUpdatesGroupSize())[0];
		if (first === void 0) return window.location.href;
		return buildUpdatesSearchUrl(first);
	}
	function removeExistingBar(root) {
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
		const link = document.createElement("a");
		link.className = CSS_CLASS.itemName;
		link.href = buildUpdatesSearchUrl(stripUpdatesIdFilter(tagsParam));
		link.textContent = UI_TEXT.showAllFollowedPosts;
		const wrap = document.createElement("div");
		wrap.className = CSS_CLASS.updatesBarActions;
		wrap.append(text, link);
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
	function mountFullBar(imageList, search, artistTags) {
		const bar = createBarShell();
		if (imageList.querySelectorAll(SITE_SELECTORS.thumb).length === 0) {
			const empty = document.createElement("p");
			empty.className = CSS_CLASS.hint;
			empty.textContent = UI_TEXT.noNewPosts;
			bar.append(empty);
			insertBeforeImageList(imageList, bar);
			return;
		}
		if (readPid(search) > 0) {
			const hint = document.createElement("p");
			hint.className = CSS_CLASS.hint;
			hint.textContent = UI_TEXT.goToPageOneToMark;
			bar.append(hint);
			insertBeforeImageList(imageList, bar);
			return;
		}
		const pageMax = maxThumbPostId(imageList);
		const seen = getSeenPostId();
		const actions = document.createElement("div");
		actions.className = CSS_CLASS.updatesBarActions;
		if (pageMax <= seen) {
			const hint = document.createElement("p");
			hint.className = CSS_CLASS.hint;
			hint.textContent = `${UI_TEXT.alreadyMarkedSeenPrefix}${String(seen)}${UI_TEXT.alreadyMarkedSeenSuffix}`;
			const openLink = document.createElement("a");
			openLink.className = CSS_CLASS.itemName;
			openLink.href = buildReloadHref(artistTags, seen);
			openLink.textContent = UI_TEXT.openUpdates;
			actions.append(hint, openLink);
			bar.append(actions);
			insertBeforeImageList(imageList, bar);
			return;
		}
		const markButton = document.createElement("button");
		markButton.type = "button";
		markButton.className = CSS_CLASS.primaryButton;
		markButton.textContent = UI_TEXT.markAllSeen;
		markButton.addEventListener("click", () => {
			const nextSeen = Math.max(getSeenPostId(), maxThumbPostId(imageList));
			setSeenPostId(nextSeen);
			bar.replaceChildren();
			const confirm = document.createElement("p");
			confirm.className = CSS_CLASS.hint;
			confirm.textContent = `${UI_TEXT.markedSeenConfirm}${String(nextSeen)}`;
			const reload = document.createElement("a");
			reload.className = CSS_CLASS.itemName;
			reload.href = buildReloadHref(artistTags, nextSeen);
			reload.textContent = UI_TEXT.reloadUpdates;
			const wrap = document.createElement("div");
			wrap.className = CSS_CLASS.updatesBarActions;
			wrap.append(confirm, reload);
			bar.append(wrap);
		});
		actions.append(markButton);
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
		removeExistingBar(root);
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
		mountFullBar(imageList, search, artistTags);
	}
	mountPanel();
	var pageKind = detectPageKind(window.location.search);
	if (pageKind === "list") {
		mountCards();
		mountArtistSidebar();
		mountUpdatesBar();
	} else if (pageKind === "post") mountArtistSidebar();
	else if (pageKind === "favorites") syncFavoritesPage();
	runFeatures(pageKind, window.location.search);
})();
