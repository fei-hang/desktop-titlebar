/**
 * Bridge from the bar's menu to the settings dialog.
 *
 * The dialog belongs to `ui-settings-general`, which owns the `sidebar.settings`
 * seat: that package builds the shell store, pins `create()` to the instance it
 * built, and renders the dialog from the same instance. No service exposes it,
 * so the one supported reach is the seat's declared store - the shell pins
 * `create()`, so calling the action here writes the flag the panel subscribes
 * to rather than a detached copy.
 *
 * The seat is absent while the settings domain is still resolving; the menu item
 * then does nothing instead of failing.
 * @module settings
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'

/** The declared seat store, as far as this bridge needs to see it. */
interface SeatStore {
  create(): { actions: Record<string, unknown> }
}

/**
 * The slot ledger read at runtime. `entriesOfSlot` takes any key, but the typed
 * surface only accepts keys some loaded package declared, and this package
 * cannot depend on the sidebar that declares `sidebar.settings`.
 */
interface SeatLedger {
  entriesOfSlot(key: string): readonly { readonly store?: unknown }[]
}

/**
 * Open the settings dialog.
 * @param ctx - client Cordis context, used to read the live slot ledger.
 */
export function openSettings(ctx: ClientContext): void {
  const ledger = ctx.slots as unknown as SeatLedger
  const declared: unknown = ledger.entriesOfSlot('sidebar.settings')[0]?.store
  if (declared === undefined) return
  try {
    const handle = (typeof declared === 'function' ? declared() : declared) as SeatStore | undefined
    if (handle === undefined) return
    const action = handle.create().actions['open']
    if (typeof action !== 'function') return
    ;(action as () => void)()
  } catch (error) {
    console.warn('[dsh-desktop-titlebar] opening settings failed', error)
  }
}
