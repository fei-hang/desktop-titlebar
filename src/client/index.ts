/**
 * Browser half of the desktop title bar plugin.
 *
 * The bar is an occupant of the frame's `shell.overlay` seat: a click-through
 * floating layer the layout declares at root scope. Registering into it means
 * the bar lives inside the window chrome without the frame knowing about it.
 * @module index
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
// Type-only: pulls the SlotRegistry service merge (ctx.slots).
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: pulls the locale service merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the uiWorkspace service merge (ctx.get('uiWorkspace')).
import type { UiWorkspace } from '@deepseek-ai/dsh-client-ui-workspace/client'
// Type-only: pulls the layout SlotMap declaration (the shell.overlay seat).
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { NS, en, zh } from './locales.ts'
import { openSettings } from './settings.ts'
import { TitleBar, type TitleBarActions } from './TitleBar.tsx'

/**
 * Required services. `uiWorkspace` is deliberately absent: ui-workspace waits
 * for the layout frame, which is already loaded by the time this bundle runs,
 * but declaring the edge would only make the fiber order matter. The actions
 * read the service lazily on click instead.
 */
export const inject = ['slots', 'locale']

/**
 * Register the bar and its dictionaries.
 * @param ctx - client Cordis context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'desktop-titlebar: dictionaries')

  /**
   * Read the Workspace navigation service, which is absent until its UI loads.
   * A missing service is an expected state, not a failure: the bar still draws
   * its two actions, and they simply do nothing until the Workspace UI is up.
   */
  const navigation = (): UiWorkspace | undefined => {
    try {
      return ctx.get('uiWorkspace')
    } catch {
      return undefined
    }
  }

  const actions: TitleBarActions = {
    startSession: () => {
      const workspace = navigation()
      if (workspace === undefined) return
      try {
        // The service is typed `void`, but an async implementation would return a
        // promise; a rejected one must not surface as an unhandled rejection.
        const result: unknown = workspace.startSession()
        if (result instanceof Promise) {
          result.catch((error: unknown) => {
            console.warn('[dsh-desktop-titlebar] startSession failed', error)
          })
        }
      } catch (error) {
        console.warn('[dsh-desktop-titlebar] startSession failed', error)
      }
    },
    openSession: (target: SessionId) => {
      const workspace = navigation()
      if (workspace === undefined) return
      try {
        workspace.openSession(target)
      } catch (error) {
        console.warn('[dsh-desktop-titlebar] openSession failed', error)
      }
    },
    openSettings: () => { openSettings(ctx) },
  }

  ctx.effect(() => ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'desktop-titlebar',
    order: 10,
    locale: NS,
    inject: () => actions,
  }, TitleBar)), 'desktop-titlebar: bar')
}
