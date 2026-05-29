import { Calendar, ChevronRight, Plus } from 'lucide-react'
import { formatAssignmentDue } from '../../../lib/assignments'
import {
  dueSoonStatusLabel,
  type DueSoonItem,
} from '../../../lib/studentNotifications'
import StudentClassCard from '../StudentClassCard'
import type { Class } from '../../../types'

interface StudentHomeTabProps {
  displayName: string
  enrolledClasses: Class[]
  pendingRequestCount: number
  dueSoonItems: DueSoonItem[]
  onOpenClass: (classKey: string) => void
  onOpenAssignment: (classKey: string, assignmentId: string) => void
  onJoinClass: () => void
  onViewRequests: () => void
}

export default function StudentHomeTab({
  displayName,
  enrolledClasses,
  pendingRequestCount,
  dueSoonItems,
  onOpenClass,
  onOpenAssignment,
  onJoinClass,
  onViewRequests,
}: StudentHomeTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Welcome back, {displayName.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          See what&apos;s due and open a class for full details.
        </p>
      </div>

      {pendingRequestCount > 0 && (
        <button
          type="button"
          onClick={onViewRequests}
          className="w-full rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-left text-sm text-amber-900 transition-colors hover:bg-amber-50"
        >
          <span className="font-semibold">
            {pendingRequestCount} join request
            {pendingRequestCount === 1 ? '' : 's'} waiting for teacher approval
          </span>
          <span className="mt-0.5 block text-amber-700/90">View status →</span>
        </button>
      )}

      {dueSoonItems.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-600" />
            <h2 className="font-semibold text-slate-900">Due soon</h2>
          </div>
          <ul className="space-y-2">
            {dueSoonItems.map((item) => (
              <li key={item.assignmentId}>
                <button
                  type="button"
                  onClick={() =>
                    onOpenAssignment(item.classKey, item.assignmentId)
                  }
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:border-violet-200 hover:shadow-md sm:p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-violet-700 sm:text-sm">
                      {item.className}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Due {formatAssignmentDue(item.dueAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset sm:text-xs ${
                        item.isOverdue
                          ? 'bg-rose-50 text-rose-700 ring-rose-600/20'
                          : 'bg-slate-100 text-slate-600 ring-slate-500/20'
                      }`}
                    >
                      {dueSoonStatusLabel(item.workStatus, item.isOverdue)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">My classes</h2>
          <button
            type="button"
            onClick={onJoinClass}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Join a class
          </button>
        </div>

        {enrolledClasses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <p className="font-medium text-slate-800">No classes yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Enter your teacher&apos;s class code and wait for approval to appear here.
            </p>
            <button
              type="button"
              onClick={onJoinClass}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Join a class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {enrolledClasses.map((cls) => (
              <StudentClassCard key={cls.classKey} course={cls} onOpen={onOpenClass} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
