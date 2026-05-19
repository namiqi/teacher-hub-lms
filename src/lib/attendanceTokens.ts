import type { AttendanceStatus } from '../types'

/** Present and absent consume one lesson token; excused and unset do not. */
export function statusConsumesToken(status: AttendanceStatus): boolean {
  return status === 'present' || status === 'absent'
}

/**
 * Token delta when attendance changes for one cell.
 * Negative = deduct, positive = refund.
 */
export function getTokenDeltaForAttendanceChange(
  from: AttendanceStatus,
  to: AttendanceStatus,
): number {
  if (from === to) return 0
  const fromConsumes = statusConsumesToken(from)
  const toConsumes = statusConsumesToken(to)
  if (!fromConsumes && toConsumes) return -1
  if (fromConsumes && !toConsumes) return 1
  return 0
}

export interface AttendanceCellTransition {
  studentId: number
  from: AttendanceStatus
  to: AttendanceStatus
}

export function totalTokenDelta(transitions: AttendanceCellTransition[]): number {
  return transitions.reduce(
    (sum, t) => sum + getTokenDeltaForAttendanceChange(t.from, t.to),
    0,
  )
}
