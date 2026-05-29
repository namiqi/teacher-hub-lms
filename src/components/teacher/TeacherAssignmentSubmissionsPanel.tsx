import { Download, ExternalLink, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { isPreviewableMime } from '../../lib/submissions/constants'
import {
  fetchSubmissionsForAssignment,
  getSubmissionFileBlobUrl,
  openSubmissionFileInNewTab,
  saveSubmissionReview,
} from '../../lib/supabase/submissions'
import SubmissionFilePreview from '../shared/SubmissionFilePreview'
import type { Assignment, AssignmentSubmission, Student } from '../../types'

type PreviewState = {
  url: string
  mimeType: string
  fileName: string
  storagePath: string
}

interface TeacherAssignmentSubmissionsPanelProps {
  assignment: Assignment
  students: Student[]
  teacherUserId: string
  onClose: () => void
  onReviewed?: () => void
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [scoreInput, setScoreInput] = useState('')
  const [feedbackInput, setFeedbackInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const enrolled = useMemo(
    () =>
      students.filter(
        (s) => s.status === 'active' && s.enrolledClasses.includes(assignment.classKey),
      ),
    [students, assignment.classKey],
  )

  const maxPoints = assignment.maxPoints ?? 10

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await fetchSubmissionsForAssignment(teacherUserId, assignment.id)
      setSubmissions(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load submissions.')
    } finally {
      setLoading(false)
    }
  }, [assignment.id, teacherUserId])

  useEffect(() => {
    void load()
  }, [load])

  const byStudentId = useMemo(() => {
    const map = new Map<number, AssignmentSubmission>()
    for (const s of submissions) map.set(s.studentId, s)
    return map
  }, [submissions])

  const selected = selectedId
    ? submissions.find((s) => s.id === selectedId)
    : undefined

  useEffect(() => {
    if (!selected) {
      setScoreInput('')
      setFeedbackInput('')
      setPreview(null)
      return
    }
    setScoreInput(selected.score != null ? String(selected.score) : '')
    setFeedbackInput(selected.feedback ?? '')
    setPreview(null)
  }, [selected])

  useEffect(() => {
    return () => {
      if (preview?.url.startsWith('blob:')) URL.revokeObjectURL(preview.url)
    }
  }, [preview])

  const openPreview = async (path: string, mime: string, fileName: string) => {
    setPreviewLoading(true)
    setError(null)
    if (preview?.url.startsWith('blob:')) URL.revokeObjectURL(preview.url)
    setPreview(null)
    try {
      if (isPreviewableMime(mime) || fileName.toLowerCase().endsWith('.pdf')) {
        const blobUrl = await getSubmissionFileBlobUrl(path, mime, fileName)
        setPreview({
          url: blobUrl,
          mimeType: mime,
          fileName,
          storagePath: path,
        })
      } else {
        await openSubmissionFileInNewTab(path, fileName)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open file.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSaveGrade = async () => {
    if (!selected) return
    const score = Number(scoreInput)
    if (Number.isNaN(score)) {
      setError('Enter a valid score.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await saveSubmissionReview({
        submissionId: selected.id,
        score,
        feedback: feedbackInput,
        maxPoints,
      })
      await load()
      setSelectedId(selected.id)
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
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 pr-4">
            <h2 className="truncate text-lg font-semibold text-slate-900">
              Submissions
            </h2>
            <p className="truncate text-sm text-slate-500">{assignment.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <div className="max-h-48 overflow-y-auto border-b border-slate-100 sm:max-h-none sm:w-56 sm:border-b-0 sm:border-r">
            {loading ? (
              <p className="flex items-center gap-2 p-4 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </p>
            ) : (
              <ul className="py-1">
                {enrolled.map((student) => {
                  const sub = byStudentId.get(student.id)
                  const active = sub?.id === selectedId
                  return (
                    <li key={student.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(sub?.id ?? null)}
                        disabled={!sub}
                        className={`w-full px-4 py-2.5 text-left text-sm ${
                          active
                            ? 'bg-[#185560]/10 font-semibold text-[#185560]'
                            : sub
                              ? 'text-slate-800 hover:bg-slate-50'
                              : 'cursor-default text-slate-400'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span className="truncate">{student.name}</span>
                          {sub?.status === 'submitted' && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full bg-rose-500"
                              aria-label="Needs review"
                            />
                          )}
                        </span>
                        <span className="text-xs font-normal opacity-80">
                          {sub
                            ? sub.status === 'reviewed' && sub.score != null
                              ? `${sub.score}/${sub.maxPoints}`
                              : sub.isLate
                                ? 'Submitted (late)'
                                : 'Needs review'
                            : 'Not submitted'}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {!selected ? (
              <p className="text-sm text-slate-500">
                Select a student who has submitted work to review and grade.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-slate-600">
                  <p>
                    Attempt {selected.attemptNumber} ·{' '}
                    {new Date(selected.submittedAt).toLocaleString()}
                  </p>
                  {selected.note && (
                    <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs">
                      <span className="font-medium">Student note:</span> {selected.note}
                    </p>
                  )}
                </div>

                {selected.files.length === 0 ? (
                  <p className="text-sm text-amber-700">
                    No files attached to this submission.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selected.files.map((f) => (
                      <li
                        key={f.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                          {f.fileName}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            void openPreview(f.storagePath, f.mimeType, f.fileName)
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#185560] hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {isPreviewableMime(f.mimeType) ? 'Preview' : 'Open'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void openSubmissionFileInNewTab(f.storagePath, f.fileName).catch(
                              (err) =>
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : 'Could not download file.',
                                ),
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {previewLoading && (
                  <p className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading preview…
                  </p>
                )}

                {preview && (
                  <SubmissionFilePreview
                    url={preview.url}
                    mimeType={preview.mimeType}
                    fileName={preview.fileName}
                    onOpenInNewTab={() =>
                      void openSubmissionFileInNewTab(
                        preview.storagePath,
                        preview.fileName,
                      ).catch((err) =>
                        setError(
                          err instanceof Error ? err.message : 'Could not open file.',
                        ),
                      )
                    }
                  />
                )}

                <div className="space-y-3 border-t border-slate-100 pt-3">
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
            )}
            {error && (
              <p className="mt-3 text-xs font-medium text-rose-600">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
