import { describe, expect, it } from 'vitest'
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import { filterRows, formatTime, stamp, toRows, type SessionRow } from '../src/client/rows.ts'

const NOW = new Date(2026, 4, 20, 15, 30)

/** One row the projection reads, in the shape the controller stores it. */
type RowInput = Record<string, unknown> & { readonly id: string }

/**
 * Build a session list snapshot from the rows under test.
 * @param rows - the rows to place in the snapshot.
 * @returns the snapshot the projection consumes.
 */
function snapshot(rows: readonly RowInput[]): SessionListState {
  return {
    ids: rows.map((row) => row.id),
    byId: Object.fromEntries(rows.map((row) => [row.id, row])),
    phase: 'ready',
    projectionsBySession: {},
  } as unknown as SessionListState
}

describe('stamp', () => {
  it('keeps finite numbers', () => {
    expect(stamp(1234)).toBe(1234)
  })

  it('parses date strings', () => {
    expect(stamp('2026-05-20T00:00:00.000Z')).toBe(Date.parse('2026-05-20T00:00:00.000Z'))
  })

  it('falls back to zero', () => {
    expect(stamp(undefined)).toBe(0)
    expect(stamp(Number.NaN)).toBe(0)
    expect(stamp('not a date')).toBe(0)
  })
})

describe('formatTime', () => {
  it('is empty without a usable stamp', () => {
    expect(formatTime(0, NOW)).toBe('')
  })

  it('shows clock time for today', () => {
    expect(formatTime(new Date(2026, 4, 20, 9, 5).getTime(), NOW)).toBe('09:05')
  })

  it('shows month and day earlier this year', () => {
    expect(formatTime(new Date(2026, 0, 3, 9, 5).getTime(), NOW)).toBe('01-03')
  })

  it('shows the full date for another year', () => {
    expect(formatTime(new Date(2025, 10, 30, 9, 5).getTime(), NOW)).toBe('2025-11-30')
  })
})

describe('toRows', () => {
  it('is empty without a snapshot', () => {
    expect(toRows(undefined, 'untitled')).toEqual([])
  })

  it('orders newest first and falls back for blank titles', () => {
    const rows = toRows(snapshot([
      { id: 'a', title: 'older', blank: false, running: false, retainedBy: { mainView: 1 }, updatedAt: 10 },
      { id: 'b', title: '', blank: true, running: true, retainedBy: {}, updatedAt: 30 },
      { id: 'c', title: 'middle', blank: false, running: false, retainedBy: {}, updatedAt: 20 },
    ]), 'untitled')
    expect(rows.map((row) => row.id)).toEqual(['b', 'c', 'a'])
    expect(rows[0]?.title).toBe('untitled')
    expect(rows[0]?.running).toBe(true)
    expect(rows[2]?.current).toBe(true)
  })

  it('marks rows the archive set names', () => {
    const rows = toRows(snapshot([
      { id: 'a', title: 'archived', blank: false, running: false, retainedBy: {}, updatedAt: 10 },
    ]), 'untitled', new Set(['a']))
    expect(rows[0]?.archived).toBe(true)
  })
})

describe('filterRows', () => {
  const rows = [
    { id: 'a', title: 'Refactor the parser', archived: false, running: false, current: false, time: 2 },
    { id: 'b', title: 'Title bar', archived: false, running: false, current: false, time: 1 },
  ] satisfies SessionRow[]

  it('keeps everything for a blank query', () => {
    expect(filterRows(rows, '   ')).toHaveLength(2)
  })

  it('matches case-insensitively', () => {
    expect(filterRows(rows, 'PARSER').map((row) => row.id)).toEqual(['a'])
  })

  it('returns a copy rather than the input array', () => {
    expect(filterRows(rows, '')).not.toBe(rows)
  })
})
