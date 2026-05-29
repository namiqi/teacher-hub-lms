import { isVisibleToStudent } from '../assignments'
import type { Assignment, AssignmentSubmission } from '../../types'

export function maxSubmitAttempts(assignment: Assignment): number {
  return 1 + (assignment.maxResubmissions ?? 0)
}

export function canSubmitAssignment(
  assignment: Assignment,
  existing: AssignmentSubmission | null,
  now = new Date(),
): { ok: true; isLate: boolean } | { ok: false; reason: string } {
  if (assignment.kind === 'announcement') {
    return { ok: false, reason: 'Announcements cannot be submitted to.' }
  }
  if (!isVisibleToStudent(assignment.status)) {
    return { ok: false, reason: 'This assignment is not open for submissions.' }
  }

  const due = new Date(assignment.dueAt)
  const pastDue = !Number.isNaN(due.getTime()) && now.getTime() > due.getTime()

  if (pastDue && !assignment.allowLateSubmissions) {
    return { ok: false, reason: 'The due date has passed.' }
  }

  const max = maxSubmitAttempts(assignment)
  const used = existing?.attemptNumber ?? 0
  if (existing && used >= max) {
    return { ok: false, reason: 'You have no resubmissions remaining.' }
  }

  return { ok: true, isLate: pastDue }
}

export function attemptsRemaining(
  assignment: Assignment,
  existing: AssignmentSubmission | null,
): number {
  const max = maxSubmitAttempts(assignment)
  const used = existing?.attemptNumber ?? 0
  return Math.max(0, max - used)
}
