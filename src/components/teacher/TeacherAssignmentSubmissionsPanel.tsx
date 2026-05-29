import { ExternalLink, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { LoadingRow, LoadingSpinner } from '../ui/Loading'
import {
  fetchSubmissionsForAssignment,
  openSubmissionFileInNewTab,
  saveSubmissionReview,
} from '../../lib/supabase/submissions'
import type { Assignment, AssignmentSubmission, Student } from '../../types'

interface TeacherAssignmentSubmissionsPanelProps {
  assignment: Assignment
  students: Student[]
  teacherUserId: string
  onClose: () => void
  onReviewed?: () => void
}

type StudentRowStatus = 'needs_review' | 'graded' | 'not_submitted'

function rowStatus(sub: AssignmentSubmission | undefined): StudentRowStatus {
  if (!sub) return 'not_submitted'
  if (sub.status === 'reviewed') return 'graded'
  return 'needs_review'
}

function statusLabel(status: StudentRowStatus, sub?: AssignmentSubmission): string {
  switch (status) {
    case 'needs_review':
      return sub?.isLate ? 'Needs review (late)' : 'Needs review'
    case 'graded':
      return sub?.score != null ? `Graded · ${sub.score}/${sub.maxPoints}` : 'Graded'
    case 'not_submitted':
      return 'Not submitted'
  }
}

function statusBadgeClass(status: StudentRowStatus): string {
  switch (status) {
    case 'needs_review':
      return 'bg-rose-50 text-rose-800 ring-rose-600/20'
    case 'graded':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
    case 'not_submitted':
      return 'bg-slate-100 text-slate-600 ring-slate-500/20'
  }
}

export default function TeacherAssignmentSubmissionsPanel({
  assignment,
  students,
  teacherUserId,
  onClose,
  onReviewed,
}: TeacherAssignmentSubmissionsPanelProps) {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [scoreInput, setScoreInput] = useState('')
  const [feedbackInput, setFeedbackInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [openingFile, setOpeningFile] = useState<string | null>(null)

  const enrolled = useMemo(
    () =>
      students
        .filter(
          (s) => s.status === 'active' && s.enrolledClasses.includes(assignment.classKey),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [students, assignment.classKey],
  )

  const maxPoints = assignment.maxPoints ?? 10

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchSubmissionsForAssignment(teacherUserId, assignment.id)
      setSubmissions(rows)
      return rows
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load submissions.')
      return []
    } finally {
      setLoading(false)
    }
  }, [assignment.id, teacherUserId])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const rows = await load()
      if (cancelled || enrolled.length === 0) return
      const byStudent = new Map(rows.map((r) => [r.studentId, r]))
      const needsReview = enrolled.find(
        (s) => byStudent.get(s.id)?.status === 'submitted',
      )
      const firstWithWork = enrolled.find((s) => byStudent.has(s.id))
      const pick = needsReview ?? firstWithWork ?? enrolled[0]
      setSelectedStudentId(pick.id)
    })()
    return () => {
      cancelled = true
    }
  }, [load, enrolled])

  const byStudentId = useMemo(() => {
    const map = new Map<number, AssignmentSubmission>()
    for (const s of submissions) map.set(s.studentId, s)
    return map
  }, [submissions])

  const selectedStudent = useMemo(
    () => enrolled.find((s) => s.id === selectedStudentId),
    [enrolled, selectedStudentId],
  )

  const selectedSubmission = selectedStudentId
    ? byStudentId.get(selectedStudentId)
    : undefined

  const selectedStatus = rowStatus(selectedSubmission)

  const summary = useMemo(() => {
    let needsReview = 0
    let graded = 0
    let notSubmitted = 0
    for (const student of enrolled) {
      const status = rowStatus(byStudentId.get(student.id))
      if (status === 'needs_review') needsReview++
      else if (status === 'graded') graded++
      else notSubmitted++
    }
    return { needsReview, graded, notSubmitted }
  }, [enrolled, byStudentId])

  useEffect(() => {
    if (!selectedSubmission) {
      setScoreInput('')
      setFeedbackInput('')
      return
    }
    setScoreInput(
      selectedSubmission.score != null ? String(selectedSubmission.score) : '',
    )
    setFeedbackInput(selectedSubmission.feedback ?? '')
  }, [selectedSubmission])

  const handleOpenFile = async (storagePath: string) => {
    setOpeningFile(storagePath)
    setError(null)
    try {
      await openSubmissionFileInNewTab(storagePath)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open file.')
    } finally {
      setOpeningFile(null)
    }
  }

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return
    const score = Number(scoreInput)
    if (Number.isNaN(score)) {
      setError('Enter a valid score.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await saveSubmissionReview({
        submissionId: selectedSubmission.id,
        score,
        feedback: feedbackInput,
        maxPoints,
      })
      await load()
      onReviewed?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save grade.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-slate-900">
                Submissions
              </h2>
              <p className="truncate text-sm text-slate-500">{assignment.title}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {!loading && (
            <p className="mt-2 text-xs text-slate-500">
              {summary.needsReview > 0 && (
                <span className="font-medium text-rose-700">
                  {summary.needsReview} need review
                </span>
              )}
              {summary.needsReview > 0 && summary.graded > 0 && ' · '}
              {summary.graded > 0 && (
                <span>{summary.graded} graded</span>
              )}
              {(summary.needsReview > 0 || summary.graded > 0) &&
                summary.notSubmitted > 0 &&
                ' · '}
              {summary.notSubmitted > 0 && (
                <span>{summary.notSubmitted} not submitted</span>
              )}
            </p>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <div className="max-h-52 overflow-y-auto border-b border-slate-100 sm:max-h-none sm:w-60 sm:border-b-0 sm:border-r">
            {loading ? (
              <LoadingRow message="Loading submissions…" variant="teacher" />
            ) : enrolled.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No students in this class.</p>
            ) : (
              <ul className="py-1">
                {enrolled.map((student) => {
                  const sub = byStudentId.get(student.id)
                  const status = rowStatus(sub)
                  const active = student.id === selectedStudentId
                  return (
                    <li key={student.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentId(student.id)}
                        className={`w-full px-4 py-3 text-left transition-colors ${
                          active
                            ? 'bg-[#185560]/10'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`truncate text-sm font-medium ${
                              active ? 'text-[#185560]' : 'text-slate-900'
                            }`}
                          >
                            {student.name}
                          </span>
                          {status === 'needs_review' && (
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500"
                              aria-hidden
                            />
                          )}
                        </div>
                        <span
                          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusBadgeClass(status)}`}
                        >
                          {statusLabel(status, sub)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {!selectedStudent ? (
              <p className="text-sm text-slate-500">Select a student from the list.</p>
            ) : selectedStatus === 'not_submitted' ? (
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900">{selectedStudent.name}</h3>
                <p className="text-sm text-slate-500">
                  This student has not submitted work for this assignment yet.
                </p>
              </div>
            ) : selectedSubmission ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedStudent.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Attempt {selectedSubmission.attemptNumber} ·{' '}
                    {new Date(selectedSubmission.submittedAt).toLocaleString()}
                    {selectedSubmission.isLate && (
                      <span className="ml-1 text-amber-700">(late)</span>
                    )}
                  </p>
                </div>

                {selectedSubmission.note && (
                  <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    <span className="font-medium text-slate-800">Student note:</span>{' '}
                    {selectedSubmission.note}
                  </p>
                )}

                {selectedSubmission.files.length === 0 ? (
                  <p className="text-sm text-amber-700">
                    No files attached to this submission.
                  </p>
                ) : (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Files
                    </h4>
                    <ul className="mt-2 space-y-2">
                      {selectedSubmission.files.map((f) => (
                        <li
                          key={f.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                        >
                          <span className="min-w-0 truncate text-sm font-medium text-slate-800">
                            {f.fileName}
                          </span>
                          <button
                            type="button"
                            disabled={openingFile === f.storagePath}
                            onClick={() =>
                              void handleOpenFile(f.storagePath)
                            }
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-[#185560] ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {openingFile === f.storagePath ? (
                              <LoadingSpinner size="sm" variant="teacher" />
                            ) : (
                              <ExternalLink className="h-3.5 w-3.5" />
                            )}
                            Open
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Opens in a new browser tab (PDF, images, Word).
                    </p>
                  </div>
                )}

                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <label className="block">
                    <span className="text-xs font-medium text-slate-700">
                      Score (out of {maxPoints})
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={maxPoints}
                      step={0.5}
                      value={scoreInput}
                      onChange={(e) => setScoreInput(e.target.value)}
                      className="mt-1 w-full max-w-[8rem] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-slate-700">Feedback</span>
                    <textarea
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Comments for the student…"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSaveGrade()}
                    className="rounded-lg bg-[#185560] px-4 py-2 text-sm font-semibold text-white hover:bg-[#134851] disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save grade'}
                  </button>
                </div>
              </div>
            ) : null}

            {error && (
              <p className="mt-3 text-xs font-medium text-rose-600" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
