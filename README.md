# dsh-desktop-titlebar

A DSH Desktop plugin that takes over the window title bar:

- paints a bar across the top of the window in the theme's own colours,
- leaves the native caption buttons (minimise / maximise / close) floating above it,
- puts two actions in the middle of the bar: **新建会话** and **会话历史**.

## How it hooks in

| Piece | Where |
| --- | --- |
| Client bundle | `lib/client.js` (`window.__ModuleLoader__.load`) |
| Slot | `shell.overlay` (list, root scope, rendered inside the layout's overlay layer) |
| New session | `ctx.get('uiWorkspace').startSession()` |
| Session history | `useSessions` snapshot rendered in a popover, opens via `uiWorkspace.openSession(id)` |

The layout already reserves `--dsh-windows-titlebar-height` (40px) at the top of
the frame and paints a drag strip there. The bar sits above that strip, keeps its
own controls `-webkit-app-region: no-drag`, and leaves Electron's
`titleBarOverlay` caption buttons (minimise / maximise / close) floating above it
on the right, so those keep working.

The desktop preload's own caption menu ("应用 / 编辑") is hidden while the bar is
active — the bar owns the whole strip:

```css
html[data-windows-titlebar] [data-windows-menu] { display: none !important; }
```

## The history popover

Clicking **会话历史** opens a panel under the bar. It closes when

- a session row is picked,
- **新建会话** is clicked,
- anything else on the page is pressed (`pointerdown`/`mousedown` in the capture
  phase, including the bar's own empty area — the bar switches to
  `pointer-events: auto` and `no-drag` while the panel is open),
- Escape is pressed,
- the window loses focus (native caption button, minimise, alt-tab).

## Keeping the served bundle fresh

A client bundle's revision comes from the file's mtime/ctime/size, and the module
table only recomputes it when the loader row restarts. `lib/index.js` therefore
declares `inject = ['clientModules']`, calls `clientModules.rebuilt('dsh-desktop-titlebar')`
on activation, and `watchFile`s `lib/client.js` so an edit reaches the page on the
next reload without restarting the row.

Colours come from the same CSS custom properties the host uses
(`--dsw-specific-sidebar-fill`, `--dsw-alias-label-secondary`,
`--dsw-alias-interactive-bg-hover`, `--dsw-alias-label-primary`,
`--dsw-alias-bg-layer-2`, `--dsw-alias-border-l2`), so the bar follows the
light/dark palette without listening to any theme event.

The bar only renders when the document carries `data-windows-titlebar`
(set by the desktop preload on Windows) and hides in fullscreen.

The bar itself is `pointer-events: none` and declares **no** drag region: empty
parts of the strip fall through to the host's own drag region, so dragging the
window by the title bar keeps working, while anything drawn underneath (the
sidebar's collapse toggle at the far left, for instance) still receives its
clicks. Only the two buttons opt back in with `pointer-events: auto`.

## Installing into the desktop profile

```jsonc
// <your home>/.dsh/profiles/desktop/package.json
"dependencies": {
  "dsh-desktop-titlebar": "link:<path to this repo>"
},
"dsh": {
  "profile": {
    "bundles": [
      // ...
      "dsh-desktop-titlebar"
    ]
  }
}
```

`dsh.bundle.patch` is what makes the profile treat this package as a bundle, so
restarting DSH Desktop activates it.
