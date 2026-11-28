/**
 * The Desktop shell's own update prompt.
 *
 * The check, the download and the install all live in the Electron main
 * process: it owns the release feed, the signature check and the confirmation
 * dialogs, and the page can only ask it to run them. `updates.open()` is the
 * same entry the application menu's "Check for Updates…" uses, so this bar
 * shows the one prompt the shell already knows how to run instead of a second
 * copy of it that could disagree.
 * @module updates
 */

/** The part of the preload bridge this bar reads. */
interface DesktopUpdatesBridge {
  readonly updates?: {
    open(): Promise<void>
  }
}

/**
 * Whether this document is running inside the Desktop shell with its update
 * bridge wired up. A plain browser tab has no updater at all.
 * @returns true when the check can be asked for.
 */
export function canCheckUpdates(): boolean {
  return updatesBridge() !== undefined
}

/**
 * Ask the shell to check for a release. It opens its own progress and result
 * dialogs, so there is nothing to render here.
 * @returns true when the request reached the shell.
 */
export function checkForUpdates(): boolean {
  const bridge = updatesBridge()
  if (bridge === undefined) return false
  void bridge.open().catch(() => {
    // The prompt is the shell's to report; a rejected request leaves this bar
    // with nothing to show and nothing to retry on its own.
  })
  return true
}

/**
 * @returns the bridge when the Desktop preload installed one.
 */
function updatesBridge(): { open(): Promise<void> } | undefined {
  const desktop = (globalThis as typeof globalThis & { dshDesktop?: DesktopUpdatesBridge }).dshDesktop
  const updates = desktop?.updates
  return updates === undefined ? undefined : updates
}
