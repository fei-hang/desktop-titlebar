/**
 * Read-only face of the background-job client service (`ctx.jobs`), reduced to
 * what this bar needs: subscribe to the roster and watch a Session's rows.
 *
 * The registry only reports rows for Sessions someone watches, and unowned jobs
 * are reported to every watcher, so a window-wide count watches every Session
 * and then de-duplicates by job id.
 * @module jobs
 */
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** One job row, as the roster hands it out. */
export interface JobRow {
  readonly id: string
  readonly kind: string
  readonly label: string
  readonly status: string
  readonly owner?: SessionId
}

/** The roster snapshot: rows grouped by the Session that watches them. */
export interface JobsSnapshotLike {
  readonly rows: Readonly<Record<string, readonly JobRow[]>>
}

/** Observable half of the job client service. */
export interface JobsObservable {
  getSnapshot(): JobsSnapshotLike
  subscribe(listener: () => void): () => void
}

/** The slice of the job client service this package reads. */
export interface JobsFace {
  readonly state: JobsObservable
  watchRows(sessionId: SessionId): () => void
  kill(sessionId: SessionId, id: string): Promise<unknown>
}

/** Stable empty roster, so a missing service keeps snapshot identity. */
export const EMPTY_JOBS: JobsSnapshotLike = { rows: {} }

/**
 * Whether a job still holds execution resources.
 * @param job - one roster row.
 * @returns true while the job runs or is stopping.
 */
export function isLive(job: JobRow): boolean {
  return job.status === 'running' || job.status === 'stopping'
}

/** A live job, flattened out of the per-Session roster. */
export interface LiveJob {
  readonly id: string
  readonly kind: string
  readonly label: string
  readonly status: string
  readonly owner: string | undefined
}

/**
 * Merge every watched Session's rows into one de-duplicated live set.
 * @param snapshot - the roster snapshot.
 * @returns live jobs, each id once, newest first.
 */
export function liveJobs(snapshot: JobsSnapshotLike): LiveJob[] {
  const seen = new Map<string, LiveJob>()
  for (const rows of Object.values(snapshot.rows)) {
    for (const job of rows) {
      if (!isLive(job) || seen.has(job.id)) continue
      seen.set(job.id, {
        id: job.id,
        kind: job.kind,
        label: job.label,
        status: job.status,
        owner: job.owner === undefined ? undefined : String(job.owner),
      })
    }
  }
  return [...seen.values()].sort((left, right) => left.label.localeCompare(right.label))
}
