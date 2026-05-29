import { CalendarCheck, ChevronRight, ClipboardList, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatAssignmentDue } from '../../lib/assignments'
import { isSupabaseConfigured } from '../../lib/supabase/client'
import { fetchMySubmissionsForClass } from '../../lib/supabase/submissions'
import {
  attendanceStatusLabel,
  attendanceStatusStyles,
  attendanceSummaryFromHistory,
  averageGradePercent,
  buildAttendanceHistory,
  buildStudentGradeRows,
  gradeStatusLabel,
  gradeStatusStyles,
} from '../../lib/studentPerformance'
import type {
  Assignment,
  AssignmentSubmission,
  AttendanceLedger,
  Student,
} from '../../types'

interface StudentClassPerformanceProps {
  classKey: string
  student: Student | undefined
  studentUserId?: string | null
  assignments: Assignment[]
  attendance: AttendanceLedger
  onOpenAssignment: (assignmentId: string) => void
}

export default function StudentClassPerformance({
  classKey,
  student,
  studentUserId,
  assignments,
  attendance,
  onOpenAssignment,
}: StudentClassPerformanceProps) {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [gradesError, setGradesError] = useState<string | null>(null)

  const useCloud = isSupabaseConfigured()

  const loadGrades = useCallback(async () => {
    if (!useCloud || !studentUserId) {
      setSubmissions([])
      return
    }
    setLoadingGrades(true)
    setGradesError(null)
    try {
      const rows = await fetchMySubmissionsForClass(studentUserId, classKey)
      setSubmissions(rows)
    } catch (err) {
      setGradesError(err instanceof Error ? err.message : 'Could not load grades.')
      setSubmissions([])
    } finally {
      setLoadingGrades(false)
    }
  }, [useCloud, studentUserId, classKey])

  useEffect(() => {
    void loadGrades()
  }, [loadGrades])

  const gradeRows = useMemo(
    () => buildStudentGradeRows(assignments, submissions, classKey),
    [assignments, submissions, classKey],
  )

  const avgPercent = useMemo(() => averageGradePercent(gradeRows), [gradeRows])

  const attendanceHistory = useMemo(() => {
    if (!student) return []
    return buildAttendanceHistory(attendance, classKey, student.id)
  }, [attendance, classKey, student])

  const attendanceStats = useMemo(
    () => attendanceSummaryFromHistory(attendanceHistory),
    [attendanceHistory],
  )

  const gradedCount = gradeRows.filter((r) => r.status === 'graded').length

  return (
    <div className="space-y-4">
      {(avgPercent != null || attendanceHistory.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {avgPercent != null && (
            <div className="rounded-xl border border-violet-200 bg-violet-50/80 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-violet-700">
                Average grade
              </p>
              <p className="mt-1 text-3xl font-bold text-violet-900">{avgPercent}%</p>
              <p className="mt-1 text-xs text-violet-700/80">
                From {gradedCount} graded assignment{gradedCount === 1 ? '' : 's'}
              </p>
            </div>
          )}
          {attendanceHistory.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Attendance
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="text-emerald-700">
                  <span className="font-semibold">{attendanceStats.present}</span> present
                </span>
                <span className="text-rose-700">
                  <span className="font-semibold">{attendanceStats.absent}</span> absent
                </span>
                <span className="text-amber-700">
                  <span className="font-semibold">{attendanceStats.excused}</span> excused
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="font-semibold text-slate-900">Assignment grades</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Scores and feedback from your teacher
          </p>
        </div>

        {!useCloud ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500 sm:px-5">
            Online grades appear when you sign in on the hosted app with Supabase.
          </p>
        ) : loadingGrades ? (
          <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading grades…
          </p>
        ) : gradesError ? (
          <p className="px-4 py-8 text-center text-sm text-rose-600 sm:px-5">{gradesError}</p>
        ) : gradeRows.length === 0 ? (
          <div className="px-4 py-10 text-center sm:px-5">
            <ClipboardList className="mx-auto h-9 w-9 text-slate-300" strokeWidth={1.5} />
            <p className="mt-3 font-medium text-slate-800">No assignments yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Grades will show here once your teacher posts and marks work.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {gradeRows.map(({ assignment, submission, status }) => (
              <li key={assignment.id}>
                <button
                  type="button"
                  onClick={() => onOpenAssignment(assignment.id)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-violet-50/50 sm:px-5 sm:py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{assignment.title}</p>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${gradeStatusStyles(status)}`}
                      >
                        {gradeStatusLabel(status)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Due {formatAssignmentDue(assignment.dueAt)}
                    </p>
                    {status === 'graded' && submission?.score != null && (
                      <p className="mt-2 text-lg font-semibold text-emerald-800">
                        {submission.score} / {submission.maxPoints}
                      </p>
                    )}
                    {submission?.feedback && (
                      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        <span className="font-medium text-slate-800">Teacher:</span>{' '}
                        {submission.feedback}
                      </p>
                    )}
                    {status === 'awaiting_grade' && submission && (
                      <p className="mt-1 text-xs text-amber-700">
                        Submitted{' '}
                        {new Date(submission.submittedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                        {submission.isLate ? ' (late)' : ''}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="font-semibold text-slate-900">Attendance record</h2>
          <p className="mt-0.5 text-xs text-slate-500">How you were marked for each class day</p>
        </div>
        {!student ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500 sm:px-5">
            Link your account to a class roster to see attendance.
          </p>
        ) : attendanceHistory.length === 0 ? (
          <div className="px-4 py-10 text-center sm:px-5">
            <CalendarCheck className="mx-auto h-9 w-9 text-slate-300" strokeWidth={1.5} />
            <p className="mt-3 font-medium text-slate-800">No attendance recorded yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Your teacher will mark present, absent, or excused after each session.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {attendanceHistory.map((row) => (
              <li
                key={row.dateKey}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5"
              >
                <span className="font-medium text-slate-800">{row.label}</span>
                <span
                  className={`font-semibold ${attendanceStatusStyles(row.status)}`}
                >
                  {attendanceStatusLabel(row.status)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
