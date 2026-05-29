import type { Assignment, AssignmentSubmission, AttendanceLedger, AttendanceStatus } from '../types'

export type StudentGradeStatus = 'not_submitted' | 'awaiting_grade' | 'graded'

export type StudentGradeRow = {
  assignment: Assignment
  submission?: AssignmentSubmission
  status: StudentGradeStatus
}

export type AttendanceHistoryRow = {
  dateKey: string
  label: string
  status: AttendanceStatus
}

function formatDateKey(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return dateKey
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function buildStudentGradeRows(
  assignments: Assignment[],
  submissions: AssignmentSubmission[],
  classKey: string,
): StudentGradeRow[] {
  const byAssignment = new Map(submissions.map((s) => [s.assignmentId, s]))

  return assignments
    .filter((a) => a.classKey === classKey && a.kind !== 'announcement')
    .sort((a, b) => new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime())
    .map((assignment) => {
      const submission = byAssignment.get(assignment.id)
      let status: StudentGradeStatus = 'not_submitted'
      if (submission) {
        status =
          submission.status === 'reviewed' && submission.score != null
            ? 'graded'
            : 'awaiting_grade'
      }
      return { assignment, submission, status }
    })
}

export function averageGradePercent(rows: StudentGradeRow[]): number | null {
  const graded = rows.filter(
    (r) => r.status === 'graded' && r.submission?.score != null,
  )
  if (graded.length === 0) return null
  const sum = graded.reduce((acc, r) => {
    const score = r.submission!.score!
    const max = r.submission!.maxPoints || r.assignment.maxPoints || 10
    return acc + (score / max) * 100
  }, 0)
  return Math.round(sum / graded.length)
}

export function buildAttendanceHistory(
  ledger: AttendanceLedger,
  classKey: string,
  studentId: number,
): AttendanceHistoryRow[] {
  const records = ledger.recordsByClass[classKey]?.[studentId] ?? {}
  const labelByDate = new Map(ledger.columns.map((c) => [c.dateKey, c.label]))

  return Object.entries(records)
    .filter(([, status]) => status && status !== 'unset')
    .map(([dateKey, status]) => ({
      dateKey,
      label: labelByDate.get(dateKey) || formatDateKey(dateKey),
      status: status as AttendanceStatus,
    }))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
}

export function attendanceSummaryFromHistory(rows: AttendanceHistoryRow[]): {
  present: number
  absent: number
  excused: number
} {
  let present = 0
  let absent = 0
  let excused = 0
  for (const row of rows) {
    if (row.status === 'present') present++
    else if (row.status === 'absent') absent++
    else if (row.status === 'excused') excused++
  }
  return { present, absent, excused }
}

export function gradeStatusLabel(status: StudentGradeStatus): string {
  switch (status) {
    case 'graded':
      return 'Graded'
    case 'awaiting_grade':
      return 'Awaiting grade'
    case 'not_submitted':
      return 'Not submitted'
  }
}

export function gradeStatusStyles(status: StudentGradeStatus): string {
  switch (status) {
    case 'graded':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
    case 'awaiting_grade':
      return 'bg-amber-50 text-amber-800 ring-amber-600/20'
    case 'not_submitted':
      return 'bg-slate-100 text-slate-600 ring-slate-500/20'
  }
}

export function attendanceStatusLabel(status: AttendanceStatus): string {
  switch (status) {
    case 'present':
      return 'Present'
    case 'absent':
      return 'Absent'
    case 'excused':
      return 'Excused'
    default:
      return '—'
  }
}

export function attendanceStatusStyles(status: AttendanceStatus): string {
  switch (status) {
    case 'present':
      return 'text-emerald-700'
    case 'absent':
      return 'text-rose-700'
    case 'excused':
      return 'text-amber-700'
    default:
      return 'text-slate-500'
  }
}
