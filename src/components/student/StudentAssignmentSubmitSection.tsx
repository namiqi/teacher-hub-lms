import { ExternalLink, Loader2, Upload } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { isSupabaseConfigured } from '../../lib/supabase/client'
import {
  fetchMySubmission,
  openSubmissionFileInNewTab,
  submitAssignmentWork,
} from '../../lib/supabase/submissions'
import {
  ALLOWED_SUBMISSION_EXTENSIONS,
  validateSubmissionFiles,
} from '../../lib/submissions/constants'
import {
  clearSubmissionDraft,
  getDraftFiles,
  getDraftNote,
  setDraftFiles,
  setDraftNote,
} from '../../lib/submissions/drafts'
import {
  attemptsRemaining,
  canSubmitAssignment,
} from '../../lib/submissions/rules'
import type { Assignment, AssignmentSubmission } from '../../types'

interface StudentAssignmentSubmitSectionProps {
  assignment: Assignment
  teacherId: string
  classKey: string
  studentUserId: string
  studentId: number
}

export default function StudentAssignmentSubmitSection({
  assignment,
  teacherId,
  classKey,
  studentUserId,
  studentId,
}: StudentAssignmentSubmitSectionProps) {
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [note, setNote] = useState(
    () => getDraftNote(assignment.id) ?? '',
  )
  const [files, setFiles] = useState<File[]>(() =>
    getDraftFiles(assignment.id),
  )
  const [error, setError] = useState<string | null>(null)
  const [openingFile, setOpeningFile] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const row = await fetchMySubmission(assignment.id, studentUserId)
      setSubmission(row)
      const draftNote = getDraftNote(assignment.id)
      setNote(draftNote ?? row?.note ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load submission.')
    } finally {
      setLoading(false)
    }
  }, [assignment.id, studentUserId])

  useEffect(() => {
    void load()
  }, [load])

  if (!isSupabaseConfigured()) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Online submissions require the hosted app with Supabase configured.
      </p>
    )
  }

  const gate = canSubmitAssignment(assignment, submission)
  const remaining = attemptsRemaining(assignment, submission)
  const maxPoints = assignment.maxPoints ?? 10

  const handleSubmit = async () => {
    const fileError = validateSubmissionFiles(files)
    if (fileError) {
      setError(fileError)
      return
    }
    if (!gate.ok) {
      setError(gate.reason)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const saved = await submitAssignmentWork({
        assignment,
        teacherId,
        classKey,
        studentUserId,
        studentId,
        note,
        files,
      })
      setSubmission(saved)
      setFiles([])
      clearSubmissionDraft(assignment.id)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const openFile = async (storagePath: string) => {
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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your submission…
      </div>
    )
  }

  return (
    <div className="space-y-4 border-t border-slate-100 pt-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">Your work</h2>
        <p className="mt-1 text-xs text-slate-500">
          Worth up to {maxPoints} points
          {assignment.allowLateSubmissions
            ? ' · Late submissions allowed'
            : ''}
          {remaining > 0 && submission
            ? ` · ${remaining} attempt${remaining === 1 ? '' : 's'} left`
            : !submission && remaining > 0
              ? ` · ${remaining + (submission ? 0 : 1)} submit${remaining === 0 ? '' : 's'} allowed`
              : ''}
        </p>
      </div>

      {submission && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-sm">
          <p className="font-medium text-slate-800">
            {submission.status === 'reviewed' ? 'Graded' : 'Submitted'}
            {submission.isLate ? (
              <span className="ml-2 text-xs font-normal text-amber-700">(late)</span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Attempt {submission.attemptNumber} ·{' '}
            {new Date(submission.submittedAt).toLocaleString()}
          </p>
          {submission.status === 'reviewed' && submission.score != null && (
            <p className="mt-2 font-semibold text-emerald-800">
              Score: {submission.score} / {submission.maxPoints}
            </p>
          )}
          {submission.feedback && (
            <p className="mt-2 whitespace-pre-wrap text-slate-600">{submission.feedback}</p>
          )}
          {submission.note && (
            <p className="mt-2 text-xs text-slate-600">
              <span className="font-medium">Your note:</span> {submission.note}
            </p>
          )}
          {submission.files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {submission.files.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    disabled={openingFile === f.storagePath}
                    onClick={() => void openFile(f.storagePath)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700 hover:underline disabled:opacity-50"
                  >
                    {openingFile === f.storagePath ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ExternalLink className="h-3.5 w-3.5" />
                    )}
                    {f.fileName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {gate.ok ? (
        <div className="space-y-3 rounded-lg border border-slate-200 p-3">
          <div className="block">
            <label
              htmlFor={`note-${assignment.id}`}
              className="text-xs font-medium text-slate-700"
            >
              Note to teacher (optional)
            </label>
            <textarea
              id={`note-${assignment.id}`}
              value={note}
              onChange={(e) => {
                setNote(e.target.value)
                setDraftNote(assignment.id, e.target.value)
              }}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              placeholder="Anything your teacher should know…"
            />
          </div>

          <div className="block">
            <label
              htmlFor={fileInputId}
              className="text-xs font-medium text-slate-700"
            >
              Files {submission ? '(replaces previous files)' : ''}
            </label>
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              multiple
              accept={ALLOWED_SUBMISSION_EXTENSIONS}
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? [])
                setFiles(picked)
                setDraftFiles(assignment.id, picked)
              }}
              className="mt-1 block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-violet-800"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              PDF, PNG, JPEG, or Word · up to 3 files · 10 MB each
            </p>
            {files.length > 0 && (
              <ul className="mt-2 text-xs text-slate-600">
                {files.map((f) => (
                  <li key={`${f.name}-${f.size}`}>{f.name}</li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            disabled={submitting || files.length === 0}
            onClick={() => void handleSubmit()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 sm:w-auto"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {submission ? 'Resubmit' : 'Submit'}
          </button>
        </div>
      ) : (
        !submission && (
          <p className="text-xs text-slate-500">{gate.reason}</p>
        )
      )}

      {error && (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
