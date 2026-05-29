import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react'
import {
  formatAssignmentDue,
  formatPostDate,
  isAnnouncement,
  postKindLabel,
  postKindStyles,
} from '../../lib/assignments'
import StudentAssignmentSubmitSection from './StudentAssignmentSubmitSection'
import type { Assignment } from '../../types'

interface StudentAssignmentDetailProps {
  assignment: Assignment
  className: string
  classKey: string
  teacherId?: string
  studentUserId?: string | null
  studentId?: number
  onBack: () => void
}

export default function StudentAssignmentDetail({
  assignment,
  className,
  classKey,
  teacherId,
  studentUserId,
  studentId,
  onBack,
}: StudentAssignmentDetailProps) {
  const announcement = isAnnouncement(assignment)
  const kind = assignment.kind ?? 'assignment'

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-violet-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {className}
      </button>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-violet-50/50 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">{assignment.title}</h1>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${postKindStyles(kind)}`}
            >
              {postKindLabel(kind)}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
            <Calendar className="h-4 w-4 text-violet-600" />
            {announcement
              ? `Posted ${formatPostDate(assignment.createdAt)}`
              : `Due ${formatAssignmentDue(assignment.dueAt)}`}
          </p>
        </div>
        <div className="space-y-4 px-6 py-5">
          {assignment.description ? (
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                {announcement ? 'Message' : 'Instructions'}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {assignment.description}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              {announcement
                ? 'No additional message.'
                : 'No additional instructions.'}
            </p>
          )}

          {assignment.resourceLink && (
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Link</h2>
              <a
                href={assignment.resourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-800 hover:underline"
              >
                Open link
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {!announcement &&
            (teacherId && studentUserId && studentId != null ? (
              <StudentAssignmentSubmitSection
                assignment={assignment}
                teacherId={teacherId}
                classKey={classKey}
                studentUserId={studentUserId}
                studentId={studentId}
              />
            ) : (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Sign in with your student account on the hosted app to submit work
                here.
              </p>
            ))}
        </div>
      </article>
    </div>
  )
}
