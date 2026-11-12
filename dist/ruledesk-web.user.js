// ==UserScript==
// @name         RuleDesk Web
// @namespace    https://github.com/kazekaze93/ruledesk-web
// @version      0.2.0
// @description  Collections and list-card favorites for rule34.xxx (local marks + same-origin fav)
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
	var DEBUG_KEY = "ruledesk-web.debug";
	var SITE_ORIGIN = "https://rule34.xxx";
	var SEARCH_PATH = "/index.php";
	var SEARCH_PAGE = "post";
	var SEARCH_SECTION = "list";
	var SEARCH_PARAM_PAGE = "page";
	var SEARCH_PARAM_TAGS = "tags";
	var ADDFAV_PATH = "/public/addfav.php";
	var VOTE_PATH = "/index.php";
	var VOTE_PARAM_PAGE = "page";
	var VOTE_PARAM_TYPE = "type";
	var VOTE_PAGE = "post";
	var VOTE_SECTION = "vote";
	var FETCH_CREDENTIALS = "same-origin";
	var TAG_TYPE_INCLUDE = "include";
	var TAG_TYPE_EXCLUDE = "exclude";
	var EXPORT_FILENAME = "ruledesk-web-collections.json";
	var EXPORT_MIME = "application/json";
	var IMPORT_SCHEMA_ERROR_PREFIX = "File is not a RuleDesk Web export";
	var PANEL_ROOT_ID = "ruledesk-web-root";
	var TOGGLE_BUTTON_ID = "ruledesk-web-toggle";
	var DOCUMENT_STYLE_ID = "ruledesk-web-document-style";
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
		cardFavLabel: "Add post to favorites",
		cardFavGlyph: "★",
		cardFavErrorTitle: "Could not add to favorites"
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
		cardFavPending: "rdw-card-fav--pending"
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
	var SITE_SELECTORS = {
		thumb: "span.thumb",
		thumbLink: "a[href*=\"s=view\"]",
		previewImage: "img.preview",
		cardFavButton: "button.rdw-card-fav"
	};
	var THUMB_ID_PATTERN = /^s(\d+)$/;
	function extractPostIdFromThumb(thumb) {
		const match = THUMB_ID_PATTERN.exec(thumb.id);
		if (match === null) return null;
		const postId = match[1];
		return postId === void 0 ? null : postId;
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
	var ArtistEntrySchema = object({
		tag: string().check(_minLength(1)),
		lastSeenPostId: int().check(_nonnegative())
	});
	var StorageSchema = object({
		version: literal(1),
		collections: array(CollectionSchema),
		artists: array(ArtistEntrySchema),
		marks: record(string(), object({ fav: optional(boolean()) }))
	});
	function createDefaultStorage() {
		return {
			version: 1,
			collections: [],
			artists: [],
			marks: {}
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
	function load() {
		const raw = readRaw();
		if (raw === void 0 || raw === null) return createDefaultStorage();
		const parsed = StorageSchema.safeParse(raw);
		if (!parsed.success) {
			backupInvalid(raw);
			return createDefaultStorage();
		}
		return parsed.data;
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
	function setPostFavMark(postId, fav) {
		const data = load();
		const previous = data.marks[postId] ?? {};
		data.marks[postId] = {
			...previous,
			fav
		};
		save(data);
	}
	function exportJson() {
		const data = load();
		return `${JSON.stringify(data, null, 2)}\n`;
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
	function importJson(raw) {
		let json;
		try {
			json = JSON.parse(raw);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Invalid JSON";
			throw new Error(message);
		}
		const parsed = StorageSchema.safeParse(json);
		if (!parsed.success) throw formatSchemaImportError(parsed.error);
		const incoming = parsed.data;
		const current = load();
		const merged = {
			version: current.version,
			collections: mergeCollections(current.collections, incoming.collections),
			artists: mergeArtists(current.artists, incoming.artists),
			marks: {
				...current.marks,
				...incoming.marks
			}
		};
		save(merged);
		return merged;
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
.${CSS_CLASS.input}:focus-visible {
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
`;
	var CARD_CSS = `
.${CSS_CLASS.thumb} {
  position: relative;
}

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
  background: #fff;
  color: #333;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
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
  opacity: 0.55;
  cursor: wait;
}
`;
	function isPostListPage(search) {
		const params = new URLSearchParams(search);
		return params.get("page") === "post" && params.get("s") === "list";
	}
	function ensureDocumentStyles() {
		if (document.getElementById("ruledesk-web-document-style") !== null) return;
		const style = document.createElement("style");
		style.id = DOCUMENT_STYLE_ID;
		style.textContent = CARD_CSS;
		document.head.append(style);
	}
	function applyButtonState(button, state, errorTitle) {
		button.classList.remove(CSS_CLASS.cardFavMarked, CSS_CLASS.cardFavError, CSS_CLASS.cardFavPending);
		button.disabled = state === "pending";
		button.setAttribute("aria-pressed", state === "marked" ? "true" : "false");
		button.removeAttribute("title");
		if (state === "pending") {
			button.classList.add(CSS_CLASS.cardFavPending);
			return;
		}
		if (state === "marked") {
			button.classList.add(CSS_CLASS.cardFavMarked);
			return;
		}
		if (state === "error") {
			button.classList.add(CSS_CLASS.cardFavError);
			button.title = errorTitle ?? UI_TEXT.cardFavErrorTitle;
		}
	}
	function attachFavButton(thumb, postId, marked) {
		if (thumb.querySelector(SITE_SELECTORS.cardFavButton) !== null) return;
		thumb.classList.add(CSS_CLASS.thumb);
		const button = document.createElement("button");
		button.type = "button";
		button.className = CSS_CLASS.cardFav;
		button.textContent = UI_TEXT.cardFavGlyph;
		button.setAttribute("aria-label", `${UI_TEXT.cardFavLabel} ${postId}`);
		applyButtonState(button, marked ? "marked" : "idle");
		button.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			handleFavClick(button, postId);
		});
		thumb.append(button);
	}
	async function handleFavClick(button, postId) {
		if (button.disabled || button.getAttribute("aria-pressed") === "true") return;
		applyButtonState(button, "pending");
		const result = await addFavorite(postId);
		if (result.status === "added" || result.status === "already") {
			setPostFavMark(postId, true);
			applyButtonState(button, "marked");
			return;
		}
		if (result.status === "not_logged_in") {
			applyButtonState(button, "error", UI_TEXT.cardFavErrorTitle);
			log.warn("Favorite requires login", postId);
			return;
		}
		applyButtonState(button, "error", UI_TEXT.cardFavErrorTitle);
		log.warn("Favorite failed", postId, result);
	}
	function mountCards(root = document, search = window.location.search) {
		if (!isPostListPage(search)) return;
		ensureDocumentStyles();
		const marks = load().marks;
		const thumbs = root.querySelectorAll(SITE_SELECTORS.thumb);
		for (const thumb of thumbs) {
			if (!(thumb instanceof HTMLElement)) continue;
			const postId = extractPostIdFromThumb(thumb);
			if (postId === null) continue;
			attachFavButton(thumb, postId, marks[postId]?.fav === true);
		}
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
	function buildSearchUrl(tags) {
		const encoded = tags.map((entry) => {
			const raw = entry.type === "exclude" ? `-${entry.tag}` : entry.tag;
			return encodeURIComponent(raw);
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
		function renderList(collections) {
			panel.replaceChildren();
			const body = document.createElement("div");
			body.className = CSS_CLASS.body;
			const saveSection = buildSaveSection(controller);
			const collectionsSection = buildCollectionsSection(collections, controller);
			const toolbar = buildToolbar(controller);
			if (controller.getImportError().length > 0) {
				const error = document.createElement("p");
				error.className = CSS_CLASS.error;
				error.textContent = `${UI_TEXT.importErrorPrefix} ${controller.getImportError()}`;
				body.append(saveSection, collectionsSection, toolbar, error);
			} else body.append(saveSection, collectionsSection, toolbar);
			panel.append(buildHeader(controller), body);
		}
		function render() {
			renderList(load().collections);
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
	mountPanel();
	mountCards();
})();
