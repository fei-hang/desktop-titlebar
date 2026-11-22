window.__ModuleLoader__.load({
	id: "dsh-desktop-titlebar",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		// src/client/locales.ts
		/** Dictionary namespace this package owns. */
		const NS = "desktop-titlebar";
		/** Chinese copy. */
		const zh = {
			"action.new": "新建会话",
			"action.history": "会话历史",
			"history.search": "搜索会话",
			"history.empty": "还没有会话",
			"history.untitled": "未命名会话",
			"history.archived": "已归档",
			"history.running": "进行中"
		};
		/** English copy. */
		const en = {
			"action.new": "New session",
			"action.history": "Session history",
			"history.search": "Search sessions",
			"history.empty": "No sessions yet",
			"history.untitled": "Untitled session",
			"history.archived": "Archived",
			"history.running": "Running"
		};
		// src/client/icons.tsx
		/**
		* Build a 16-grid stroked icon from its children.
		* @param children - the shape elements.
		* @returns the icon component.
		*/
		function glyph(children) {
			return function Icon({ size }) {
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
					width: size ?? 16,
					height: size ?? 16,
					viewBox: "0 0 16 16",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: 1.4,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					"aria-hidden": "true",
					focusable: "false",
					children
				});
			};
		}
		/** New-session glyph: a page with a plus. */
		const IconNewChat = glyph([/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13.5 9.5v3a1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 4 2.5h3" }, "body"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M11.5 1.5v4M9.5 3.5h4" }, "plus")]);
		/** Session-history glyph: a clock face. */
		const IconClock = glyph([/* @__PURE__ */ (0, react_jsx_runtime.jsx)("circle", {
			cx: 8,
			cy: 8,
			r: 6
		}, "dial"), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M8 4.6V8l2.4 1.5" }, "hands")]);
		// src/client/rows.ts
		/**
		* Read a timestamp as epoch milliseconds.
		* @param value - a finite number or a parsable date string.
		* @returns the epoch milliseconds, or 0 when unusable.
		*/
		function stamp(value) {
			if (typeof value === "number" && Number.isFinite(value)) return value;
			const parsed = typeof value === "string" ? Date.parse(value) : NaN;
			return Number.isFinite(parsed) ? parsed : 0;
		}
		/**
		* Zero-pad a date part to two digits.
		* @param value - the numeric part.
		* @returns the padded text.
		*/
		function pad(value) {
			return String(value).padStart(2, "0");
		}
		/**
		* Format a row stamp the way the panel shows it: clock time for today,
		* month-day for this year, full date otherwise.
		* @param value - the row stamp.
		* @param now - the reference instant; the current time when omitted.
		* @returns the display text, empty when the stamp is unusable.
		*/
		function formatTime(value, now = /* @__PURE__ */ new Date()) {
			const time = stamp(value);
			if (time === 0) return "";
			const date = new Date(time);
			const sameYear = date.getFullYear() === now.getFullYear();
			const sameDay = sameYear && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
			const clock = pad(date.getHours()) + ":" + pad(date.getMinutes());
			if (sameDay) return clock;
			const monthDay = pad(date.getMonth() + 1) + "-" + pad(date.getDate());
			if (sameYear) return monthDay;
			return date.getFullYear() + "-" + monthDay;
		}
		/**
		* Project the session list into panel rows, newest first.
		*
		* Archive state is not a Session field: the Session summary carries no
		* `archived` flag, so the Host-confirmed archive set has to be supplied by the
		* caller (the Workspace snapshot owns it).
		* @param snapshot - the session list snapshot, absent before the store arrives.
		* @param untitled - copy for a row whose title is empty.
		* @param archived - session ids the Host reports as archived; empty when absent.
		* @returns the rows to render.
		*/
		function toRows(snapshot, untitled, archived = /* @__PURE__ */ new Set()) {
			if (snapshot === void 0) return [];
			const rows = [];
			for (const id of snapshot.ids) {
				const row = snapshot.byId[id];
				if (row === void 0) continue;
				const title = row.blank === true ? "" : String(row.title ?? "").trim();
				rows.push({
					id: row.id,
					title: title === "" ? untitled : title,
					archived: archived.has(row.id),
					running: row.running === true,
					current: row.retainedBy !== void 0 && (row.retainedBy.mainView || 0) > 0,
					time: stamp(row.updatedAt)
				});
			}
			rows.sort((left, right) => right.time - left.time);
			return rows;
		}
		/**
		* Filter rows by a case-insensitive title substring.
		* @param rows - the rows to filter.
		* @param query - the raw search text; blank keeps every row.
		* @returns the matching rows, in input order.
		*/
		function filterRows(rows, query) {
			const needle = query.trim().toLowerCase();
			if (needle === "") return [...rows];
			return rows.filter((row) => row.title.toLowerCase().includes(needle));
		}
		// \0dsh-css:src\client\titlebar.module.css.mjs
		const css = "div._7LawxW_bar{height:var(--dsh-windows-titlebar-height,40px);box-sizing:border-box;font-family:var(--dsw-font-family,inherit);color:var(--dsw-alias-label-secondary);pointer-events:none;z-index:1;user-select:none;background:0 0;justify-content:center;align-items:center;display:flex;position:absolute;top:0;left:0;right:0}html:not([data-windows-titlebar]) div._7LawxW_bar,html[data-fullscreen] div._7LawxW_bar{display:none}html[data-windows-titlebar] [data-windows-menu],html[data-windows-titlebar] [data-sidebar-opener]{display:none!important}html[data-windows-titlebar]:not(:has([data-sidebar-collapsed=true])) [data-sidebar-toggle]:not([role=toolbar] *){display:none!important}html[data-windows-titlebar]:has([data-sidebar-collapsed=true]) [class*=newSession]{display:none!important}div._7LawxW_bar[data-open=true]{pointer-events:auto;-webkit-app-region:no-drag}div._7LawxW_center{pointer-events:auto;-webkit-app-region:no-drag;align-items:center;gap:2px;display:flex}button._7LawxW_action{height:28px;color:var(--dsw-alias-label-secondary);font:inherit;cursor:default;white-space:nowrap;-webkit-app-region:no-drag;background:0 0;border:0;border-radius:6px;align-items:center;gap:6px;padding:0 10px;font-size:13px;line-height:1;display:inline-flex}button._7LawxW_action:hover,button._7LawxW_action[data-open=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}button._7LawxW_action:focus-visible{outline:2px solid var(--dsw-alias-border-selected,#4d6bfe);outline-offset:-2px}div._7LawxW_panel{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,#7f7f7f3d);background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-base,#fff));width:min(440px,100vw - 32px);max-height:min(60vh,480px);color:var(--dsw-alias-label-primary);pointer-events:auto;-webkit-app-region:no-drag;z-index:61;border-radius:10px;flex-direction:column;padding-bottom:6px;display:flex;position:absolute;top:calc(100% + 6px);left:50%;transform:translate(-50%);box-shadow:0 12px 32px #0000003d}input._7LawxW_search{border:1px solid var(--dsw-alias-border-l2,#7f7f7f3d);background:var(--dsw-alias-bg-layer-1,transparent);height:30px;color:var(--dsw-alias-label-primary);font:inherit;border-radius:6px;outline:none;margin:8px;padding:0 10px;font-size:13px}input._7LawxW_search:focus{border-color:var(--dsw-alias-border-selected,#4d6bfe)}input._7LawxW_search::placeholder{color:var(--dsw-alias-label-tertiary)}div._7LawxW_list{flex-direction:column;gap:2px;min-height:0;padding:0 6px;display:flex;overflow-y:auto}button._7LawxW_row{width:100%;height:32px;color:var(--dsw-alias-label-primary);font:inherit;text-align:left;cursor:default;-webkit-app-region:no-drag;background:0 0;border:0;border-radius:6px;flex:none;align-items:center;gap:8px;padding:0 8px;font-size:13px;display:flex}button._7LawxW_row:hover,button._7LawxW_row[data-active=true]{background:var(--dsw-alias-interactive-bg-hover)}button._7LawxW_row:focus-visible{outline:2px solid var(--dsw-alias-border-selected,#4d6bfe);outline-offset:-2px}span._7LawxW_rowTitle{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}span._7LawxW_rowTag{background:var(--dsw-alias-bg-layer-1,#7f7f7f29);color:var(--dsw-alias-label-tertiary);border-radius:999px;flex:none;padding:1px 6px;font-size:11px;line-height:16px}span._7LawxW_rowTime{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;flex:none;margin-left:auto;font-size:12px}div._7LawxW_empty{color:var(--dsw-alias-label-tertiary);text-align:center;padding:14px 12px 18px;font-size:13px}";
		const tagId = "dsh-desktop-titlebar/titlebar.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-desktop-titlebar";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var titlebar_module_css_default = {
			"action": "_7LawxW_action",
			"bar": "_7LawxW_bar",
			"center": "_7LawxW_center",
			"empty": "_7LawxW_empty",
			"list": "_7LawxW_list",
			"panel": "_7LawxW_panel",
			"row": "_7LawxW_row",
			"rowTag": "_7LawxW_rowTag",
			"rowTime": "_7LawxW_rowTime",
			"rowTitle": "_7LawxW_rowTitle",
			"search": "_7LawxW_search"
		};
		// src/client/TitleBar.tsx
		/**
		* The bar itself: a full-width strip that keeps the window draggable, with the
		* two actions centred in it and the session-history popover hanging below.
		*
		* The strip never takes pointer events of its own, so the empty title bar stays
		* a drag region; only the centred controls and the open popover opt in. That is
		* also why the popover closes on a capture-phase press anywhere else: the press
		* has to be seen before the window chrome handles it.
		* @module TitleBar
		*/
		/**
		* The title bar occupant.
		* @param props - framework standard seats, the injected actions, and the copy seat.
		* @returns the strip, its two actions, and the popover while it is open.
		*/
		const TitleBar = (props) => {
			const { t, startSession, openSession, useSessions, useWorkspaces } = props;
			const snapshot = useSessions === void 0 ? void 0 : useSessions((state) => state);
			const archivedIds = useWorkspaces === void 0 ? void 0 : useWorkspaces((state) => state.archivedSessionIds);
			const [open, setOpen] = (0, react.useState)(false);
			const [query, setQuery] = (0, react.useState)("");
			const panelRef = (0, react.useRef)(null);
			const centerRef = (0, react.useRef)(null);
			const inputRef = (0, react.useRef)(null);
			const rows = (0, react.useMemo)(() => {
				const archived = new Set((archivedIds ?? []).map((id) => String(id)));
				return toRows(snapshot, t("history.untitled"), archived);
			}, [
				snapshot,
				archivedIds,
				t
			]);
			const visible = (0, react.useMemo)(() => filterRows(rows, query), [rows, query]);
			const close = (0, react.useCallback)(() => {
				setOpen(false);
				setQuery("");
			}, []);
			(0, react.useEffect)(() => {
				if (!open) return void 0;
				const onKeyDown = (event) => {
					if (event.key !== "Escape") return;
					event.stopPropagation();
					close();
				};
				const onPointerDown = (event) => {
					const target = event.target;
					if (panelRef.current !== null && target instanceof Node && panelRef.current.contains(target)) return;
					if (centerRef.current !== null && target instanceof Node && centerRef.current.contains(target)) return;
					close();
				};
				window.addEventListener("keydown", onKeyDown, true);
				document.addEventListener("pointerdown", onPointerDown, true);
				document.addEventListener("mousedown", onPointerDown, true);
				window.addEventListener("blur", close);
				return () => {
					window.removeEventListener("keydown", onKeyDown, true);
					document.removeEventListener("pointerdown", onPointerDown, true);
					document.removeEventListener("mousedown", onPointerDown, true);
					window.removeEventListener("blur", close);
				};
			}, [open, close]);
			(0, react.useEffect)(() => {
				if (!open) return;
				inputRef.current?.focus();
			}, [open]);
			const onNewSession = (0, react.useCallback)(() => {
				close();
				startSession();
			}, [close, startSession]);
			const onPick = (0, react.useCallback)((id) => {
				close();
				openSession(id);
			}, [close, openSession]);
			const toggle = (0, react.useCallback)(() => {
				setOpen((previous) => !previous);
				setQuery("");
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: titlebar_module_css_default.bar,
				"data-window-drag-exclude": "",
				"data-open": open ? "true" : "false",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					ref: centerRef,
					className: titlebar_module_css_default.center,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: titlebar_module_css_default.action,
						title: t("action.new"),
						onClick: onNewSession,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconNewChat, { size: 16 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("action.new") })]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: titlebar_module_css_default.action,
						"data-open": open ? "true" : "false",
						"aria-expanded": open,
						title: t("action.history"),
						onClick: toggle,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconClock, { size: 16 }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("action.history") })]
					})]
				}), open ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					ref: panelRef,
					className: titlebar_module_css_default.panel,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						ref: inputRef,
						className: titlebar_module_css_default.search,
						type: "text",
						value: query,
						placeholder: t("history.search"),
						spellCheck: false,
						onChange: (event) => {
							setQuery(event.target.value);
						}
					}), visible.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: titlebar_module_css_default.empty,
						children: t("history.empty")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: titlebar_module_css_default.list,
						children: visible.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: titlebar_module_css_default.row,
							"data-active": row.current ? "true" : "false",
							onClick: () => {
								onPick(row.id);
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: titlebar_module_css_default.rowTitle,
									children: row.title
								}),
								row.running ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: titlebar_module_css_default.rowTag,
									children: t("history.running")
								}) : null,
								row.archived ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: titlebar_module_css_default.rowTag,
									children: t("history.archived")
								}) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: titlebar_module_css_default.rowTime,
									children: formatTime(row.time)
								})
							]
						}, row.id))
					})]
				}) : null]
			});
		};
		// src/client/index.ts
		/**
		* Required services. `uiWorkspace` is deliberately absent: ui-workspace waits
		* for the layout frame, which is already loaded by the time this bundle runs,
		* but declaring the edge would only make the fiber order matter. The actions
		* read the service lazily on click instead.
		*/
		const inject = ["slots", "locale"];
		/**
		* Register the bar and its dictionaries.
		* @param ctx - client Cordis context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "desktop-titlebar: dictionaries");
			/**
			* Read the Workspace navigation service, which is absent until its UI loads.
			* A missing service is an expected state, not a failure: the bar still draws
			* its two actions, and they simply do nothing until the Workspace UI is up.
			*/
			const navigation = () => {
				try {
					return ctx.get("uiWorkspace");
				} catch {
					return;
				}
			};
			const actions = {
				startSession: () => {
					const workspace = navigation();
					if (workspace === void 0) return;
					try {
						const result = workspace.startSession();
						if (result instanceof Promise) result.catch((error) => {
							console.warn("[dsh-desktop-titlebar] startSession failed", error);
						});
					} catch (error) {
						console.warn("[dsh-desktop-titlebar] startSession failed", error);
					}
				},
				openSession: (target) => {
					const workspace = navigation();
					if (workspace === void 0) return;
					try {
						workspace.openSession(target);
					} catch (error) {
						console.warn("[dsh-desktop-titlebar] openSession failed", error);
					}
				}
			};
			ctx.effect(() => ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "desktop-titlebar",
				order: 10,
				locale: NS,
				inject: () => actions
			}, TitleBar)), "desktop-titlebar: bar");
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map