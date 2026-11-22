/**
 * The bar's data side: session rows, their ordering, and their timestamp copy.
 * Everything here is pure so it can be tested without a renderer.
 * @module rows
 */
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'

/** One row the history panel can show. */
export interface SessionRow {
  /** Session identity, used as the React key and the open target. */
  readonly id: string
  /** Title shown to the reader, already falling back to the untitled copy. */
  readonly title: string
  /** The session is archived. */
  readonly archived: boolean
  /** The session is running. */
  readonly running: boolean
  /** The session is the one currently on screen. */
  readonly current: boolean
  /** Sort key: epoch milliseconds, 0 when the row carries no usable stamp. */
  readonly time: number
}

/**
 * Read a timestamp as epoch milliseconds.
 * @param value - a finite number or a parsable date string.
 * @returns the epoch milliseconds, or 0 when unusable.
 */
export function stamp(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = typeof value === 'string' ? Date.parse(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Zero-pad a date part to two digits.
 * @param value - the numeric part.
 * @returns the padded text.
 */
function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Format a row stamp the way the panel shows it: clock time for today,
 * month-day for this year, full date otherwise.
 * @param value - the row stamp.
 * @param now - the reference instant; the current time when omitted.
 * @returns the display text, empty when the stamp is unusable.
 */
export function formatTime(value: unknown, now: Date = new Date()): string {
  const time = stamp(value)
  if (time === 0) return ''
  const date = new Date(time)
  const sameYear = date.getFullYear() === now.getFullYear()
  const sameDay = sameYear && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
  const clock = pad(date.getHours()) + ':' + pad(date.getMinutes())
  if (sameDay) return clock
  const monthDay = pad(date.getMonth() + 1) + '-' + pad(date.getDate())
  if (sameYear) return monthDay
  return date.getFullYear() + '-' + monthDay
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
export function toRows(
  snapshot: SessionListState | undefined,
  untitled: string,
  archived: ReadonlySet<string> = new Set(),
): SessionRow[] {
  if (snapshot === undefined) return []
  const rows: SessionRow[] = []
  for (const id of snapshot.ids) {
    const row = snapshot.byId[id]
    if (row === undefined) continue
    const title = row.blank === true ? '' : String(row.title ?? '').trim()
    rows.push({
      id: row.id,
      title: title === '' ? untitled : title,
      archived: archived.has(row.id),
      running: row.running === true,
      current: row.retainedBy !== undefined && (row.retainedBy.mainView || 0) > 0,
      time: stamp(row.updatedAt),
    })
  }
  rows.sort((left, right) => right.time - left.time)
  return rows
}

/**
 * Filter rows by a case-insensitive title substring.
 * @param rows - the rows to filter.
 * @param query - the raw search text; blank keeps every row.
 * @returns the matching rows, in input order.
 */
export function filterRows(rows: readonly SessionRow[], query: string): SessionRow[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return [...rows]
  return rows.filter((row) => row.title.toLowerCase().includes(needle))
}
