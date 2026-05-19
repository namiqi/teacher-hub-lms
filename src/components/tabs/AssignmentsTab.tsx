import type { Assignment, AssignmentStatus } from '../../types'

const STATUS_STYLES: Record<AssignmentStatus, string> = {
  active: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  grading: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  closed: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  active: 'Active',
  grading: 'Grading',
  closed: 'Closed',
}

interface AssignmentsTabProps {
  assignments: Assignment[]
}

export default function AssignmentsTab({ assignments }: AssignmentsTabProps) {
  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const percent = Math.round(
          (assignment.submitted / assignment.total) * 100,
        )

        return (
          <article
            key={assignment.id}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[assignment.status]}`}
                  >
                    {STATUS_LABELS[assignment.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {assignment.className} · Due {assignment.dueDate}
                </p>
              </div>
              <p className="text-sm font-medium text-slate-700">
                {assignment.submitted}/{assignment.total} submitted
              </p>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex justify-between text-xs text-slate-500">
                <span>Submission progress</span>
                <span className="font-medium text-slate-700">{percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
