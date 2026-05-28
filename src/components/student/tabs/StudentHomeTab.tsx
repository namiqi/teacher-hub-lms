import { Plus } from 'lucide-react'
import StudentClassCard from '../StudentClassCard'
import type { Class } from '../../../types'

interface StudentHomeTabProps {
  displayName: string
  enrolledClasses: Class[]
  pendingRequestCount: number
  onOpenClass: (classKey: string) => void
  onJoinClass: () => void
  onViewRequests: () => void
}

export default function StudentHomeTab({
  displayName,
  enrolledClasses,
  pendingRequestCount,
  onOpenClass,
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
          Open a class for schedule and assignments from your teacher.
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
