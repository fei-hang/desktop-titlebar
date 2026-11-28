/**
 * The bar itself: a full-width strip that keeps the window draggable, a menu on
 * the left, the two actions centred in it, the unread and running-job badges to
 * their right, and the popovers hanging below.
 *
 * The strip never takes pointer events of its own, so the empty title bar stays
 * a drag region; only the controls and the open popovers opt in. That is also
 * why they close on a capture-phase press anywhere else: the press has to be
 * seen before the window chrome handles it.
 * @module TitleBar
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
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
import type { UseSessionStatus, UseSessions } from '@deepseek-ai/dsh-client-ui-session/client'
import { IconClock, IconMenu, IconNewChat } from './icons.tsx'
import { RestartOverlay, type RestartPhase } from './restart-dialog.tsx'
import { canCheckUpdates, checkForUpdates } from './updates.ts'
import { filterRows, formatTime, toRows } from './rows.ts'
import { EMPTY_JOBS, liveJobs, type JobsFace } from './jobs.ts'
import css from './titlebar.module.css'

/** Business face the registration injects; it reads the Workspace service lazily. */
export interface TitleBarActions {
  /** Start a new conversation in the current Workspace. */
  readonly startSession: () => void
  /** Show one Session's conversation. */
  readonly openSession: (target: SessionId) => void
  /** Open the settings dialog. */
  readonly openSettings: () => void
  /** Background-job roster, absent until the job client service is up. */
  readonly jobs: JobsFace | undefined
}

/**
 * Standard seats this bar reads, declared as possibly absent: a Client assembled
 * without the Session or Workspace UI still mounts the overlay, and the bar
 * degrades to an empty history rather than throwing.
 */
interface OptionalStandardProps {
  readonly useSessions?: UseSessions
  readonly useSessionStatus?: UseSessionStatus
  readonly useWorkspaces?: SnapshotSelectorHook<WorkspaceSnapshot>
}

/** Full props of the overlay occupant. */
export type TitleBarProps = PropsRuntime<'shell.overlay'>
  & InjectFace<TitleBarActions>
  & PropsLocale<'desktop-titlebar'>
  & OptionalStandardProps

/** Host route that restarts the application. */
const RESTART_PATH = '/dsh-titlebar/restart'

/** Separator used to turn the Session id list into one stable effect key. */
const ID_SEPARATOR = '\u0000'

/** One Session waiting for acknowledgement. */
interface UnreadEntry {
  readonly id: string
  readonly title: string
  readonly time: number
}

/**
 * Ask the Host to restart DSH.
 * @returns true when the Host accepted the request.
 */
async function requestRestart(): Promise<boolean> {
  try {
    const response = await fetch(RESTART_PATH, { method: 'POST' })
    return response.ok
  } catch (error) {
    console.warn('[dsh-desktop-titlebar] restart request failed', error)
    return false
  }
}

/**
 * The title bar occupant.
 * @param props - framework standard seats, the injected actions, and the copy seat.
 * @returns the strip, its menu, its actions, its badges, and the open popovers.
 */
export const TitleBar: SlotComponent<TitleBarProps> = (props: TitleBarProps) => {
  const {
    t, startSession, openSession, openSettings, jobs,
    useSessions, useSessionStatus, useWorkspaces,
  } = props
  const snapshot = useSessions === undefined ? undefined : useSessions((state) => state)
  const archivedIds = useWorkspaces === undefined ? undefined : useWorkspaces((state) => state.archivedSessionIds)
  const statuses = useSessionStatus === undefined ? undefined : useSessionStatus((state) => state)
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadOpen, setUnreadOpen] = useState(false)
  const [jobsOpen, setJobsOpen] = useState(false)
  const [restartPhase, setRestartPhase] = useState<RestartPhase>('closed')
  const [query, setQuery] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const centerRef = useRef<HTMLDivElement>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const unreadRef = useRef<HTMLDivElement>(null)
  const jobsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const rows = useMemo(() => {
    const archived = new Set<string>((archivedIds ?? []).map((id) => String(id)))
    return toRows(snapshot, t('history.untitled'), archived)
  }, [snapshot, archivedIds, t])

  const visible = useMemo(() => filterRows(rows, query), [rows, query])

  const subscribeJobs = useMemo(() => (jobs === undefined
    ? (_listener: () => void) => () => {}
    : (listener: () => void) => jobs.state.subscribe(listener)), [jobs])
  const readJobs = useMemo(() => (jobs === undefined
    ? () => EMPTY_JOBS
    : () => jobs.state.getSnapshot()), [jobs])
  const roster = useSyncExternalStore(subscribeJobs, readJobs, readJobs)

  // The roster only reports Sessions someone watches, so a window-wide count has
  // to watch every listed Session, not just the open one.
  const watchKey = (snapshot?.ids ?? []).map((id) => String(id)).join(ID_SEPARATOR)
  useEffect(() => {
    if (jobs === undefined || watchKey === '') return undefined
    const disposers = watchKey.split(ID_SEPARATOR).map((id) => jobs.watchRows(id as SessionId))
    return () => { for (const dispose of disposers) dispose() }
  }, [jobs, watchKey])

  const live = useMemo(() => liveJobs(roster), [roster])

  const unread = useMemo(() => {
    if (statuses === undefined) return [] as UnreadEntry[]
    const known = new Map(rows.map((row) => [row.id, row]))
    const list: UnreadEntry[] = []
    for (const [id, status] of statuses) {
      if (!status.completionUnread) continue
      const key = String(id)
      const row = known.get(key)
      list.push({ id: key, title: row?.title ?? t('history.untitled'), time: row?.time ?? 0 })
    }
    return list.sort((left, right) => right.time - left.time)
  }, [statuses, rows, t])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
  }, [])

  /** Dismiss the two badge popovers; the history popover keeps its own reset. */
  const closeBadges = useCallback(() => {
    setUnreadOpen(false)
    setJobsOpen(false)
  }, [])

  const expanded = open || menuOpen || unreadOpen || jobsOpen

  useEffect(() => {
    if (!expanded) return undefined
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      // An open popover owns Escape while it is open, or the frame closes something else.
      event.stopPropagation()
      close()
      closeMenu()
      closeBadges()
    }
    const onPointerDown = (event: Event): void => {
      const target = event.target
      if (!(target instanceof Node)) {
        close()
        closeMenu()
        closeBadges()
        return
      }
      for (const ref of [panelRef, centerRef, leftRef, unreadRef, jobsRef]) {
        if (ref.current !== null && ref.current.contains(target)) return
      }
      close()
      closeMenu()
      closeBadges()
    }
    window.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('mousedown', onPointerDown, true)
    window.addEventListener('blur', close)
    window.addEventListener('blur', closeMenu)
    window.addEventListener('blur', closeBadges)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('mousedown', onPointerDown, true)
      window.removeEventListener('blur', close)
      window.removeEventListener('blur', closeMenu)
      window.removeEventListener('blur', closeBadges)
    }
  }, [expanded, close, closeMenu, closeBadges])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  const onNewSession = useCallback(() => {
    close()
    closeMenu()
    closeBadges()
    startSession()
  }, [close, closeMenu, closeBadges, startSession])

  const onPick = useCallback((id: string) => {
    close()
    closeBadges()
    openSession(id as SessionId)
  }, [close, closeBadges, openSession])

  const toggle = useCallback(() => {
    setMenuOpen(false)
    closeBadges()
    setOpen((previous) => !previous)
    setQuery('')
  }, [closeBadges])

  const toggleMenu = useCallback(() => {
    close()
    closeBadges()
    setMenuOpen((previous) => !previous)
  }, [close, closeBadges])

  /** One unread Session needs no list: the click is the navigation. */
  const onUnread = useCallback(() => {
    const only = unread.length === 1 ? unread[0] : undefined
    if (only !== undefined) {
      onPick(only.id)
      return
    }
    close()
    setJobsOpen(false)
    setUnreadOpen((previous) => !previous)
  }, [unread, onPick, close])

  const toggleJobs = useCallback(() => {
    close()
    setUnreadOpen(false)
    setJobsOpen((previous) => !previous)
  }, [close])

  const onSettings = useCallback(() => {
    closeMenu()
    openSettings()
  }, [closeMenu, openSettings])

  /** The shell owns the prompt, so this only hands the request over. */
  const onCheckUpdates = useCallback(() => {
    closeMenu()
    checkForUpdates()
  }, [closeMenu])

  /** The menu only asks; the dialog owns the decision. */
  const askRestart = useCallback(() => {
    closeMenu()
    setRestartPhase('confirm')
  }, [closeMenu])

  const cancelRestart = useCallback(() => {
    setRestartPhase('closed')
  }, [])

  const confirmRestart = useCallback(() => {
    // The waiting state is the whole page from here on: an accepted request ends
    // with the application going away, so nothing ever leaves it.
    setRestartPhase('restarting')
    void requestRestart().then((accepted) => {
      if (!accepted) setRestartPhase('failed')
    })
  }, [])

  const unreadLabel = t(unread.length === 1 ? 'unread.count.one' : 'unread.count.other', { count: unread.length })
  const jobsLabel = t(live.length === 1 ? 'jobs.count.one' : 'jobs.count.other', { count: live.length })

  return (
    <div className={css.bar} data-window-drag-exclude="" data-open={expanded ? 'true' : 'false'}>
      <div ref={leftRef} className={css.left}>
        <button
          type="button"
          className={css.icon}
          data-open={menuOpen ? 'true' : 'false'}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title={t('action.menu')}
          onClick={toggleMenu}
        >
          <IconMenu size={16} />
        </button>
        {menuOpen ? (
          <div className={css.menu} role="menu">
            <button type="button" role="menuitem" className={css.menuItem} onClick={onSettings}>
              {t('menu.settings')}
            </button>
            {canCheckUpdates() ? (
              <button type="button" role="menuitem" className={css.menuItem} onClick={onCheckUpdates}>
                {t('menu.checkUpdates')}
              </button>
            ) : null}
            <button type="button" role="menuitem" className={css.menuItem} onClick={askRestart}>
              {t('menu.restart')}
            </button>
          </div>
        ) : null}
      </div>
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
        {/* Anchored past the end of the row, so a badge appearing never shifts the
            two actions: the count changes, the buttons do not move. */}
        <div className={css.status}>
          {unread.length === 0 ? null : (
            <div ref={unreadRef} className={css.badge}>
              <button
                type="button"
                className={css.action}
                data-open={unreadOpen ? 'true' : 'false'}
                aria-haspopup={unread.length > 1 ? 'menu' : undefined}
                aria-expanded={unread.length > 1 ? unreadOpen : undefined}
                title={unreadLabel}
                onClick={onUnread}
              >
                <span className={css.dot} aria-hidden="true" />
                <span>{unreadLabel}</span>
              </button>
              {unreadOpen && unread.length > 1 ? (
                <div className={css.popover} role="menu" aria-label={t('unread.list')}>
                  {unread.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      role="menuitem"
                      className={css.row}
                      onClick={() => { onPick(entry.id) }}
                    >
                      <span className={css.rowTitle}>{entry.title}</span>
                      <span className={css.rowTime}>{formatTime(entry.time)}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
          {live.length === 0 ? null : (
            <div ref={jobsRef} className={css.badge}>
              <button
                type="button"
                className={css.action}
                data-open={jobsOpen ? 'true' : 'false'}
                aria-haspopup="menu"
                aria-expanded={jobsOpen}
                title={jobsLabel}
                onClick={toggleJobs}
              >
                <span className={css.pulse} aria-hidden="true" />
                <span>{jobsLabel}</span>
              </button>
              {jobsOpen ? (
                <div className={css.popover} role="menu" aria-label={t('jobs.list')}>
                  {live.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      role="menuitem"
                      className={css.row}
                      disabled={job.owner === undefined}
                      onClick={() => { if (job.owner !== undefined) onPick(job.owner) }}
                    >
                      <span className={css.rowTitle}>{job.label}</span>
                      <span className={css.rowTag}>
                        {job.status === 'stopping' ? t('jobs.status.stopping') : t('jobs.status.running')}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
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
      <RestartOverlay
        phase={restartPhase}
        t={t}
        onCancel={cancelRestart}
        onConfirm={confirmRestart}
      />
    </div>
  )
}
