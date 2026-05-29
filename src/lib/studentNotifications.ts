import { isAnnouncement, isVisibleToStudent } from './assignments'
import type { StudentSeenState } from './supabase/studentPortalState'
import type {
  Assignment,
  AssignmentSubmission,
  Class,
  JoinRequest,
} from '../types'

export const DUE_SOON_HORIZON_MS = 7 * 24 * 60 * 60 * 1000
export const DUE_URGENT_MS = 48 * 60 * 60 * 1000

export type StudentWorkStatus = 'not_submitted' | 'awaiting_grade' | 'graded'

export type StudentNotificationKind =
  | 'new_work'
  | 'graded'
  | 'due_soon'
  | 'join_approved'

export interface StudentNotificationItem {
  id: string
  kind: StudentNotificationKind
  title: string
  subtitle: string
  classKey: string
  assignmentId?: string
  submissionId?: string
  joinRequestId?: string
}

export type DueSoonItem = {
  assignmentId: string
  classKey: string
  className: string
  title: string
  dueAt: string
  workStatus: StudentWorkStatus
  isOverdue: boolean
}

export function workStatusForAssignment(
  assignmentId: string,
  submissions: AssignmentSubmission[],
): StudentWorkStatus {
  const sub = submissions.find((s) => s.assignmentId === assignmentId)
  if (!sub) return 'not_submitted'
  if (sub.status === 'reviewed' && sub.score != null) return 'graded'
  return 'awaiting_grade'
}

function classNameMap(classes: Class[]): Map<string, string> {
  return new Map(classes.map((c) => [c.classKey, c.name]))
}

function visibleAssignmentsForStudent(
  assignments: Assignment[],
  enrolledKeys: Set<string>,
): Assignment[] {
  return assignments.filter(
    (a) =>
      !isAnnouncement(a) &&
      enrolledKeys.has(a.classKey) &&
      isVisibleToStudent(a.status),
  )
}

export function buildDueSoonItems(params: {
  assignments: Assignment[]
  enrolledClassKeys: string[]
  classes: Class[]
  submissions: AssignmentSubmission[]
  now?: Date
  limit?: number
}): DueSoonItem[] {
  const {
    assignments,
    enrolledClassKeys,
    classes,
    submissions,
    now = new Date(),
    limit = 5,
  } = params
  const enrolled = new Set(enrolledClassKeys)
  const names = classNameMap(classes)
  const nowMs = now.getTime()
  const horizonMs = nowMs + DUE_SOON_HORIZON_MS

  return visibleAssignmentsForStudent(assignments, enrolled)
    .map((assignment) => {
      const dueMs = new Date(assignment.dueAt).getTime()
      const workStatus = workStatusForAssignment(assignment.id, submissions)
      const isOverdue = !Number.isNaN(dueMs) && dueMs < nowMs
      return { assignment, dueMs, workStatus, isOverdue }
    })
    .filter(({ dueMs, workStatus, isOverdue }) => {
      if (workStatus === 'graded' || workStatus === 'awaiting_grade') return false
      if (Number.isNaN(dueMs)) return false
      if (isOverdue) return true
      return dueMs <= horizonMs
    })
    .sort((a, b) => a.dueMs - b.dueMs)
    .slice(0, limit)
    .map(({ assignment, workStatus, isOverdue }) => ({
      assignmentId: assignment.id,
      classKey: assignment.classKey,
      className: names.get(assignment.classKey) ?? assignment.classKey,
      title: assignment.title,
      dueAt: assignment.dueAt,
      workStatus,
      isOverdue,
    }))
}

export function buildStudentNotificationItems(params: {
  assignments: Assignment[]
  enrolledClassKeys: string[]
  classes: Class[]
  submissions: AssignmentSubmission[]
  joinRequests: JoinRequest[]
  seen: StudentSeenState
  now?: Date
}): StudentNotificationItem[] {
  const {
    assignments,
    enrolledClassKeys,
    classes,
    submissions,
    joinRequests,
    seen,
    now = new Date(),
  } = params

  const enrolled = new Set(enrolledClassKeys)
  const names = classNameMap(classes)
  const nowMs = now.getTime()
  const lastVisitMs = seen.lastVisitAt
    ? new Date(seen.lastVisitAt).getTime()
    : 0
  const seenGraded = new Set(seen.seenGradedSubmissionIds)
  const seenApproved = new Set(seen.seenApprovedRequestIds)
  const items: StudentNotificationItem[] = []
  const usedAssignmentIds = new Set<string>()

  for (const sub of submissions) {
    if (!enrolled.has(sub.classKey)) continue
    if (sub.status !== 'reviewed' || sub.score == null) continue
    if (seenGraded.has(sub.id)) continue
    const assignment = assignments.find((a) => a.id === sub.assignmentId)
    if (!assignment) continue
    items.push({
      id: `graded-${sub.id}`,
      kind: 'graded',
      title: assignment.title,
      subtitle: `${names.get(sub.classKey) ?? sub.classKey} · Score ${sub.score}/${sub.maxPoints}`,
      classKey: sub.classKey,
      assignmentId: sub.assignmentId,
      submissionId: sub.id,
    })
    usedAssignmentIds.add(sub.assignmentId)
  }

  for (const item of buildDueSoonItems({
    assignments,
    enrolledClassKeys,
    classes,
    submissions,
    now,
    limit: 10,
  })) {
    const dueMs = new Date(item.dueAt).getTime()
    const urgent = item.isOverdue || dueMs - nowMs <= DUE_URGENT_MS
    if (!urgent || usedAssignmentIds.has(item.assignmentId)) continue
    items.push({
      id: `due-${item.assignmentId}`,
      kind: 'due_soon',
      title: item.title,
      subtitle: item.isOverdue
        ? `${item.className} · Overdue`
        : `${item.className} · Due soon`,
      classKey: item.classKey,
      assignmentId: item.assignmentId,
    })
    usedAssignmentIds.add(item.assignmentId)
  }

  for (const assignment of visibleAssignmentsForStudent(assignments, enrolled)) {
    if (usedAssignmentIds.has(assignment.id)) continue
    if (!seen.lastVisitAt) continue
    const createdMs = new Date(assignment.createdAt).getTime()
    if (Number.isNaN(createdMs) || createdMs <= lastVisitMs) continue
    items.push({
      id: `new-${assignment.id}`,
      kind: 'new_work',
      title: assignment.title,
      subtitle: `${names.get(assignment.classKey) ?? assignment.classKey} · New assignment`,
      classKey: assignment.classKey,
      assignmentId: assignment.id,
    })
    usedAssignmentIds.add(assignment.id)
  }

  for (const request of joinRequests) {
    if (request.status !== 'approved') continue
    if (seenApproved.has(request.id)) continue
    items.push({
      id: `join-${request.id}`,
      kind: 'join_approved',
      title: names.get(request.classKey) ?? 'Class',
      subtitle: 'You were approved — open your class',
      classKey: request.classKey,
      joinRequestId: request.id,
    })
  }

  const kindOrder: Record<StudentNotificationKind, number> = {
    graded: 0,
    due_soon: 1,
    new_work: 2,
    join_approved: 3,
  }

  return items.sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind])
}

export function dueSoonStatusLabel(
  workStatus: StudentWorkStatus,
  isOverdue: boolean,
): string {
  if (isOverdue) return 'Overdue'
  if (workStatus === 'not_submitted') return 'Not submitted'
  if (workStatus === 'awaiting_grade') return 'Submitted'
  return 'Graded'
}

export function notificationKindLabel(kind: StudentNotificationKind): string {
  switch (kind) {
    case 'graded':
      return 'Grade'
    case 'due_soon':
      return 'Due'
    case 'new_work':
      return 'New'
    case 'join_approved':
      return 'Join'
  }
}

export function notificationKindStyles(kind: StudentNotificationKind): string {
  switch (kind) {
    case 'graded':
      return 'bg-emerald-100 text-emerald-800'
    case 'due_soon':
      return 'bg-rose-100 text-rose-700'
    case 'new_work':
      return 'bg-violet-100 text-violet-800'
    case 'join_approved':
      return 'bg-amber-100 text-amber-800'
  }
}
