# dsh-desktop-titlebar

A DSH Desktop plugin that replaces the window title bar.

It paints a bar across the top of the window in the app's own colours, keeps the
native minimise / maximise / close buttons floating above it, and puts two
actions in the middle: **New Session** and **Session History**. The history
button opens a popover listing the Sessions of the current workspace; picking one
switches to it.

The bar only appears on Windows, where the desktop shell marks the document with
`data-windows-titlebar`, and it hides in fullscreen. Dragging the window by the
bar still works.

## Build

```sh
pnpm install
pnpm build
```

`pnpm build` writes `lib/`, which is build output and is not committed.

## Install

Two ways, either is fine.

### Option 1: the script in this package

```sh
pnpm run install:profile          # into "desktop" (the default)
pnpm run install:profile web      # into "web"
```

The name after the command is the profile; leave it out for `desktop`.

It does three things:

1. adds a link dependency pointing at this directory to
   `~/.dsh/profiles/<name>/package.json`;
2. adds this package's name to `dsh.profile.bundles` in that same file;
3. runs `pnpm install` inside the profile, which turns that link into a real
   module.

### Option 2: the `dsh` command

```sh
# run from this directory
dsh plugin --profile web add .
```

`dsh plugin add` does the same work and resolves dependencies itself. It refuses
the `desktop` profile, though: that one is managed exclusively by the DSH Desktop
application and the command errors out. Use option 1 for `desktop`.

Both are safe to run twice. Restart DSH Desktop afterwards.

## Development

```sh
pnpm check   # typecheck, tests, build, smoke
```
