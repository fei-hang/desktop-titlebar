
window.__ModuleLoader__.load({
  id: 'dsh-desktop-titlebar',
  factory: function (require) {
    var React = require('react');
    var h = React.createElement;

    /**
     * Icons are drawn here instead of being taken from the primitives package:
     * a client bundle only resolves the modules its package lists as inject
     * edges, and the two shapes are small enough to keep local.
     */
    function glyph(children) {
      return function Icon(props) {
        return h('svg', {
          width: (props && props.size) || 16,
          height: (props && props.size) || 16,
          viewBox: '0 0 16 16',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
          focusable: 'false',
        }, children);
      };
    }

    var IconNewChat = glyph([
      h('path', { key: 'body', d: 'M13.5 9.5v3a1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5V4A1.5 1.5 0 0 1 4 2.5h3' }),
      h('path', { key: 'plus', d: 'M11.5 1.5v4M9.5 3.5h4' }),
    ]);
    var IconClock = glyph([
      h('circle', { key: 'dial', cx: 8, cy: 8, r: 6 }),
      h('path', { key: 'hands', d: 'M8 4.6V8l2.4 1.5' }),
    ]);
    var NS = 'desktop-titlebar';
    var STYLE_ID = 'dsh-desktop-titlebar/titlebar.css';

    var CSS = "\ndiv.dsh-titlebar-bar {\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  height: var(--dsh-windows-titlebar-height, 40px);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  box-sizing: border-box;\n  background: transparent;\n  font-family: var(--dsw-font-family, inherit);\n  color: var(--dsw-alias-label-secondary);\n  pointer-events: none;\n  z-index: 1;\n  user-select: none;\n}\nhtml:not([data-windows-titlebar]) div.dsh-titlebar-bar,\nhtml[data-fullscreen] div.dsh-titlebar-bar {\n  display: none;\n}\nhtml[data-windows-titlebar] [data-windows-menu],\nhtml[data-windows-titlebar] [data-sidebar-opener] {\n  display: none !important;\n}\nhtml[data-windows-titlebar]:not(:has([data-sidebar-collapsed=\"true\"])) [data-sidebar-toggle] {\n  display: none !important;\n}\nhtml[data-windows-titlebar]:has([data-sidebar-collapsed=true]) [class*=newSession] {\n  display: none !important;\n}\ndiv.dsh-titlebar-bar[data-open=\"true\"] {\n  pointer-events: auto;\n  -webkit-app-region: no-drag;\n}\ndiv.dsh-titlebar-center {\n  display: flex;\n  align-items: center;\n  gap: 2px;\n  pointer-events: auto;\n  -webkit-app-region: no-drag;\n}\nbutton.dsh-titlebar-action {\n  height: 28px;\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  padding: 0 10px;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  font: inherit;\n  font-size: 13px;\n  line-height: 1;\n  cursor: default;\n  white-space: nowrap;\n  -webkit-app-region: no-drag;\n}\nbutton.dsh-titlebar-action:hover {\n  background: var(--dsw-alias-interactive-bg-hover);\n  color: var(--dsw-alias-label-primary);\n}\nbutton.dsh-titlebar-action[data-open=\"true\"] {\n  background: var(--dsw-alias-interactive-bg-hover);\n  color: var(--dsw-alias-label-primary);\n}\nbutton.dsh-titlebar-action:focus-visible {\n  outline: 2px solid var(--dsw-alias-border-selected, #4d6bfe);\n  outline-offset: -2px;\n}\ndiv.dsh-titlebar-panel {\n  position: absolute;\n  top: calc(100% + 6px);\n  left: 50%;\n  transform: translateX(-50%);\n  width: min(440px, calc(100vw - 32px));\n  max-height: min(60vh, 480px);\n  display: flex;\n  flex-direction: column;\n  box-sizing: border-box;\n  padding-bottom: 6px;\n  border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.24));\n  border-radius: 10px;\n  background: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-base, #ffffff));\n  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.24);\n  color: var(--dsw-alias-label-primary);\n  pointer-events: auto;\n  -webkit-app-region: no-drag;\n  z-index: 61;\n}\ninput.dsh-titlebar-search {\n  height: 30px;\n  margin: 8px;\n  padding: 0 10px;\n  border: 1px solid var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.24));\n  border-radius: 6px;\n  background: var(--dsw-alias-bg-layer-1, transparent);\n  color: var(--dsw-alias-label-primary);\n  font: inherit;\n  font-size: 13px;\n  outline: none;\n}\ninput.dsh-titlebar-search:focus {\n  border-color: var(--dsw-alias-border-selected, #4d6bfe);\n}\ninput.dsh-titlebar-search::placeholder {\n  color: var(--dsw-alias-label-tertiary);\n}\ndiv.dsh-titlebar-list {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  padding: 0 6px;\n  overflow-y: auto;\n  min-height: 0;\n}\nbutton.dsh-titlebar-row {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  width: 100%;\n  height: 32px;\n  flex: none;\n  padding: 0 8px;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--dsw-alias-label-primary);\n  font: inherit;\n  font-size: 13px;\n  text-align: left;\n  cursor: default;\n  -webkit-app-region: no-drag;\n}\nbutton.dsh-titlebar-row:hover,\nbutton.dsh-titlebar-row[data-active=\"true\"] {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\nbutton.dsh-titlebar-row:focus-visible {\n  outline: 2px solid var(--dsw-alias-border-selected, #4d6bfe);\n  outline-offset: -2px;\n}\nspan.dsh-titlebar-row-title {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\nspan.dsh-titlebar-row-tag {\n  flex: none;\n  padding: 1px 6px;\n  border-radius: 999px;\n  background: var(--dsw-alias-bg-layer-1, rgba(127, 127, 127, 0.16));\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\nspan.dsh-titlebar-row-time {\n  margin-left: auto;\n  flex: none;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 12px;\n  font-variant-numeric: tabular-nums;\n}\ndiv.dsh-titlebar-empty {\n  padding: 14px 12px 18px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 13px;\n  text-align: center;\n}\n";

    var zh = {
      'action.new': '新建会话',
      'action.history': '会话历史',
      'history.search': '搜索会话',
      'history.empty': '还没有会话',
      'history.untitled': '未命名会话',
      'history.archived': '已归档',
      'history.running': '进行中',
    };
    var en = {
      'action.new': 'New session',
      'action.history': 'Session history',
      'history.search': 'Search sessions',
      'history.empty': 'No sessions yet',
      'history.untitled': 'Untitled session',
      'history.archived': 'Archived',
      'history.running': 'Running',
    };

    function installStyle() {
      if (typeof document === 'undefined' || document.head === null) return function () {};
      var existing = document.querySelector('style[data-plugin-css=' + JSON.stringify(STYLE_ID) + ']');
      if (existing !== null) return function () {};
      var tag = document.createElement('style');
      tag.dataset.plugin = 'dsh-desktop-titlebar';
      tag.dataset.pluginCss = STYLE_ID;
      tag.textContent = CSS;
      document.head.appendChild(tag);
      return function () {
        tag.remove();
      };
    }

    function stamp(value) {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      var parsed = typeof value === 'string' ? Date.parse(value) : NaN;
      return Number.isFinite(parsed) ? parsed : 0;
    }

    function pad(value) {
      return String(value).padStart(2, '0');
    }

    function formatTime(value) {
      var time = stamp(value);
      if (time === 0) return '';
      var date = new Date(time);
      var now = new Date();
      var sameYear = date.getFullYear() === now.getFullYear();
      var sameDay = sameYear && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
      if (sameDay) return pad(date.getHours()) + ':' + pad(date.getMinutes());
      if (sameYear) return pad(date.getMonth() + 1) + '-' + pad(date.getDate());
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    }

    function icon(component) {
      return component === undefined ? null : h(component, { size: 16 });
    }

    /**
     * The title bar itself: a full-width strip that keeps the window draggable,
     * with the two actions centred in it. Nothing is rendered outside Windows
     * (the bar is display:none there) or in fullscreen.
     */
    function TitleBar(props) {
      var t = props.t;
      var useSessions = props.useSessions;
      var openSession = props.openSession;

      var snapshot = useSessions === undefined ? undefined : useSessions(function (state) { return state; });
      var openState = React.useState(false);
      var open = openState[0];
      var setOpen = openState[1];
      var queryState = React.useState('');
      var query = queryState[0];
      var setQuery = queryState[1];
      var panelRef = React.useRef(null);
      var centerRef = React.useRef(null);
      var inputRef = React.useRef(null);

      var rows = React.useMemo(function () {
        if (snapshot === undefined) return [];
        var ids = snapshot.ids || [];
        var byId = snapshot.byId || {};
        var items = [];
        for (var index = 0; index < ids.length; index += 1) {
          var row = byId[ids[index]];
          if (row === undefined) continue;
          var title = row.blank === true ? '' : String(row.title || '').trim();
          items.push({
            id: row.id,
            title: title === '' ? t('history.untitled') : title,
            archived: row.archived === true,
            running: row.running === true,
            current: row.retainedBy !== undefined && (row.retainedBy.mainView || 0) > 0,
            time: stamp(row.updatedAt),
          });
        }
        items.sort(function (left, right) { return right.time - left.time; });
        return items;
      }, [snapshot, t]);

      var visible = React.useMemo(function () {
        var needle = query.trim().toLowerCase();
        if (needle === '') return rows;
        return rows.filter(function (row) { return row.title.toLowerCase().indexOf(needle) !== -1; });
      }, [rows, query]);

      var close = React.useCallback(function () {
        setOpen(false);
        setQuery('');
      }, []);

      React.useEffect(function () {
        if (!open) return undefined;
        var onKeyDown = function (event) {
          if (event.key === 'Escape') {
            event.stopPropagation();
            close();
          }
        };
        var onPointerDown = function (event) {
          var target = event.target;
          if (panelRef.current !== null && panelRef.current.contains(target)) return;
          if (centerRef.current !== null && centerRef.current.contains(target)) return;
          close();
        };
        window.addEventListener('keydown', onKeyDown, true);
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('mousedown', onPointerDown, true);
        window.addEventListener('blur', close);
        return function () {
          window.removeEventListener('keydown', onKeyDown, true);
          document.removeEventListener('pointerdown', onPointerDown, true);
          document.removeEventListener('mousedown', onPointerDown, true);
          window.removeEventListener('blur', close);
        };
      }, [open, close]);

      React.useEffect(function () {
        if (!open) return;
        var input = inputRef.current;
        if (input === null) return;
        input.focus();
      }, [open]);

      var onNewSession = React.useCallback(function () {
        close();
        props.startSession();
      }, [close, props]);

      var onPick = React.useCallback(function (id) {
        close();
        openSession(id);
      }, [close, openSession]);

      var toggle = React.useCallback(function () {
        setOpen(function (previous) { return !previous; });
        setQuery('');
      }, []);

      var panel = null;
      if (open) {
        var children = [
          h('input', {
            key: 'search',
            ref: inputRef,
            className: 'dsh-titlebar-search',
            type: 'text',
            value: query,
            placeholder: t('history.search'),
            spellCheck: false,
            onChange: function (event) { setQuery(event.target.value); },
          }),
        ];
        if (visible.length === 0) {
          children.push(h('div', { key: 'empty', className: 'dsh-titlebar-empty' }, t('history.empty')));
        } else {
          children.push(h('div', { key: 'list', className: 'dsh-titlebar-list' }, visible.map(function (row) {
            var badges = [];
            if (row.running) badges.push(h('span', { key: 'running', className: 'dsh-titlebar-row-tag' }, t('history.running')));
            if (row.archived) badges.push(h('span', { key: 'archived', className: 'dsh-titlebar-row-tag' }, t('history.archived')));
            return h('button', {
              key: row.id,
              type: 'button',
              className: 'dsh-titlebar-row',
              'data-active': row.current ? 'true' : 'false',
              onClick: function () { onPick(row.id); },
            },
              h('span', { className: 'dsh-titlebar-row-title' }, row.title),
              badges,
              h('span', { className: 'dsh-titlebar-row-time' }, formatTime(row.time)),
            );
          })));
        }
        panel = h('div', { ref: panelRef, className: 'dsh-titlebar-panel' }, children);
      }

      return h('div', {
        className: 'dsh-titlebar-bar',
        'data-window-drag-exclude': '',
        'data-open': open ? 'true' : 'false',
      },
        h('div', { ref: centerRef, className: 'dsh-titlebar-center' },
          h('button', {
            type: 'button',
            className: 'dsh-titlebar-action',
            title: t('action.new'),
            onClick: onNewSession,
          }, icon(IconNewChat), h('span', null, t('action.new'))),
          h('button', {
            type: 'button',
            className: 'dsh-titlebar-action',
            'data-open': open ? 'true' : 'false',
            'aria-expanded': open ? 'true' : 'false',
            title: t('action.history'),
            onClick: toggle,
          }, icon(IconClock), h('span', null, t('action.history'))),
        ),
        panel,
      );
    }

    var inject = ['slots', 'locale'];

    function apply(ctx) {
      ctx.effect(installStyle, 'dsh-desktop-titlebar: styles');

      ctx.effect(function registerCopy() {
        return ctx.locale.register(NS, { zh: zh, en: en });
      }, 'dsh-desktop-titlebar: dictionaries');

      function navigation() {
        try {
          return ctx.get('uiWorkspace');
        } catch (error) {
          return undefined;
        }
      }

      function startSession() {
        var workspace = navigation();
        if (workspace === undefined) return;
        try {
          var result = workspace.startSession();
          if (result !== undefined && typeof result.catch === 'function') {
            result.catch(function (error) {
              console.warn('[dsh-desktop-titlebar] startSession failed', error);
            });
          }
        } catch (error) {
          console.warn('[dsh-desktop-titlebar] startSession failed', error);
        }
      }

      function openSession(sessionId) {
        var workspace = navigation();
        if (workspace === undefined) return;
        try {
          workspace.openSession(sessionId);
        } catch (error) {
          console.warn('[dsh-desktop-titlebar] openSession failed', error);
        }
      }

      ctx.effect(function registerBar() {
        return ctx.slots.inject('shell.overlay', function contribute() {
          return ctx.slots.register({
            name: 'shell.overlay',
            id: 'desktop-titlebar',
            order: 10,
            locale: NS,
            inject: function () {
              return { startSession: startSession, openSession: openSession };
            },
          }, TitleBar);
        });
      }, 'dsh-desktop-titlebar: bar');
    }

    return { apply: apply, inject: inject };
  },
});
