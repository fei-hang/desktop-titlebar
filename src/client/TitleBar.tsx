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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  InjectFace, PropsLocale, PropsRuntime, SlotComponent, SnapshotSelectorHook,
} from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { WorkspaceSnapshot } from '@deepseek-ai/dsh-api-workspace-controller/client'
// Type-only: pulls the layout SlotMap declaration (the shell.overlay seat).
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: pulls the Session standard-props merge (props.useSessions).
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
// Type-only: pulls the Workspace standard-props merge (props.useWorkspaces).
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type { UseSessions } from '@deepseek-ai/dsh-client-ui-session/client'
import { IconClock, IconNewChat } from './icons.tsx'
import { filterRows, formatTime, toRows } from './rows.ts'
import css from './titlebar.module.css'

/** Business face the registration injects; it reads the Workspace service lazily. */
export interface TitleBarActions {
  /** Start a new conversation in the current Workspace. */
  readonly startSession: () => void
  /** Show one Session's conversation. */
  readonly openSession: (target: SessionId) => void
}

/**
 * Standard seats this bar reads, declared as possibly absent: a Client assembled
 * without the Session or Workspace UI still mounts the overlay, and the bar
 * degrades to an empty history rather than throwing.
 */
interface OptionalStandardProps {
  readonly useSessions?: UseSessions
  readonly useWorkspaces?: SnapshotSelectorHook<WorkspaceSnapshot>
}

/** Full props of the overlay occupant. */
export type TitleBarProps = PropsRuntime<'shell.overlay'>
  & InjectFace<TitleBarActions>
  & PropsLocale<'desktop-titlebar'>
  & OptionalStandardProps

/**
 * The title bar occupant.
 * @param props - framework standard seats, the injected actions, and the copy seat.
 * @returns the strip, its two actions, and the popover while it is open.
 */
export const TitleBar: SlotComponent<TitleBarProps> = (props: TitleBarProps) => {
  const { t, startSession, openSession, useSessions, useWorkspaces } = props
  const snapshot = useSessions === undefined ? undefined : useSessions((state) => state)
  const archivedIds = useWorkspaces === undefined ? undefined : useWorkspaces((state) => state.archivedSessionIds)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const rows = useMemo(() => {
    const archived = new Set<string>((archivedIds ?? []).map((id) => String(id)))
    return toRows(snapshot, t('history.untitled'), archived)
  }, [snapshot, archivedIds, t])

  const visible = useMemo(() => filterRows(rows, query), [rows, query])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      // The popover owns Escape while it is open, or the frame closes something else.
      event.stopPropagation()
      close()
    }
    const onPointerDown = (event: Event): void => {
      const target = event.target
      if (panelRef.current !== null && target instanceof Node && panelRef.current.contains(target)) return
      if (centerRef.current !== null && target instanceof Node && centerRef.current.contains(target)) return
      close()
    }
    window.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('mousedown', onPointerDown, true)
    window.addEventListener('blur', close)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('mousedown', onPointerDown, true)
      window.removeEventListener('blur', close)
    }
  }, [open, close])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  const onNewSession = useCallback(() => {
    close()
    startSession()
  }, [close, startSession])

  const onPick = useCallback((id: string) => {
    close()
    openSession(id as SessionId)
  }, [close, openSession])

  const toggle = useCallback(() => {
    setOpen((previous) => !previous)
    setQuery('')
  }, [])

  return (
    <div className={css.bar} data-window-drag-exclude="" data-open={open ? 'true' : 'false'}>
      <div ref={centerRef} className={css.center}>
        <button type="button" className={css.action} title={t('action.new')} onClick={onNewSession}>
          <IconNewChat size={16} />
          <span>{t('action.new')}</span>
        </button>
        <button
          type="button"
          className={css.action}
          data-open={open ? 'true' : 'false'}
          aria-expanded={open}
          title={t('action.history')}
          onClick={toggle}
        >
          <IconClock size={16} />
          <span>{t('action.history')}</span>
        </button>
      </div>
      {open ? (
        <div ref={panelRef} className={css.panel}>
          <input
            ref={inputRef}
            className={css.search}
            type="text"
            value={query}
            placeholder={t('history.search')}
            spellCheck={false}
            onChange={(event) => { setQuery(event.target.value) }}
          />
          {visible.length === 0 ? (
            <div className={css.empty}>{t('history.empty')}</div>
          ) : (
            <div className={css.list}>
              {visible.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className={css.row}
                  data-active={row.current ? 'true' : 'false'}
                  onClick={() => { onPick(row.id) }}
                >
                  <span className={css.rowTitle}>{row.title}</span>
                  {row.running ? <span className={css.rowTag}>{t('history.running')}</span> : null}
                  {row.archived ? <span className={css.rowTag}>{t('history.archived')}</span> : null}
                  <span className={css.rowTime}>{formatTime(row.time)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
