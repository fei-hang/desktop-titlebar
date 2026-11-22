/**
 * The restart flow's two surfaces: a confirmation dialog centred in the page, and
 * the full-page waiting state that replaces it once the Host accepted the request.
 *
 * Both portal to `document.body`. The bar lives in the frame's overlay layer,
 * which is a stacking context of its own, so anything rendered in place would be
 * clipped to the strip and sit under the columns.
 * @module restart-dialog
 */
import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import css from './restart.module.css'

/** Where the restart flow currently stands. */
export type RestartPhase = 'closed' | 'confirm' | 'restarting' | 'failed'

/** Props of the overlay. */
export interface RestartOverlayProps {
  readonly phase: RestartPhase
  readonly t: PropsLocale<'desktop-titlebar'>['t']
  /** Dismiss the dialog without restarting. */
  readonly onCancel: () => void
  /** Ask the Host to restart. */
  readonly onConfirm: () => void
}

/**
 * Render the restart surfaces for the current phase.
 * @param props - phase, copy seat, and the two intents.
 * @returns the portalled dialog, the waiting state, or null while closed.
 */
export function RestartOverlay({ phase, t, onCancel, onConfirm }: RestartOverlayProps) {
  const waiting = phase === 'restarting'

  const onKeyDown = useCallback((event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || waiting) return
    // The dialog owns Escape while it is up, or the frame closes something else.
    event.stopPropagation()
    onCancel()
  }, [onCancel, waiting])

  useEffect(() => {
    if (phase === 'closed') return undefined
    window.addEventListener('keydown', onKeyDown, true)
    return () => { window.removeEventListener('keydown', onKeyDown, true) }
  }, [phase, onKeyDown])

  if (phase === 'closed') return null

  if (waiting) {
    return createPortal(
      <div className={css.waiting} role="alertdialog" aria-busy="true" aria-live="assertive" aria-label={t('restart.loading')}>
        <div className={css.waitingCard}>
          <span className={css.spinner} aria-hidden="true" />
          <span className={css.waitingTitle}>{t('restart.loading')}</span>
          <span className={css.waitingHint}>{t('restart.loading.hint')}</span>
        </div>
      </div>,
      document.body,
    )
  }

  return createPortal(
    <div className={css.scrim} data-shortcut-modal="restart">
      <div className={css.dialog} role="dialog" aria-modal="true" aria-labelledby="dsh-titlebar-restart-title">
        <h2 id="dsh-titlebar-restart-title" className={css.title}>{t('restart.confirm.title')}</h2>
        <p className={css.body}>{phase === 'failed' ? t('restart.failed') : t('restart.confirm.body')}</p>
        <div className={css.actions}>
          <button type="button" className={css.ghost} onClick={onCancel}>
            {phase === 'failed' ? t('restart.confirm.close') : t('restart.confirm.cancel')}
          </button>
          {phase === 'failed' ? null : (
            <button type="button" className={css.primary} onClick={onConfirm} autoFocus>
              {t('restart.confirm.ok')}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
