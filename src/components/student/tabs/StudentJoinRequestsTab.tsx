import { Plus } from 'lucide-react'
import { classNameForKey } from '../../../lib/studentTokens'
import type { Class, JoinRequest } from '../../../types'

interface StudentJoinRequestsTabProps {
  classes: Class[]
  requests: JoinRequest[]
  onJoinClass: () => void
}

export default function StudentJoinRequestsTab({
  classes,
  requests,
  onJoinClass,
}: StudentJoinRequestsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Join requests
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track classes you&apos;ve asked to join. Your teacher approves each request.
          </p>
        </div>
        <button
          type="button"
          onClick={onJoinClass}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Join a class
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-800">No requests yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Use a class code from your teacher to send a join request.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {requests.map((r) => (
            <li
              key={r.id}
              className="flex items-start justify-between gap-4 px-5 py-4"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {classNameForKey(classes, r.classKey)}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  as {r.requestedName} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                  r.status === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : r.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                }`}
              >
                {r.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
