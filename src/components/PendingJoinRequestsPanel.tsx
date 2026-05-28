import { Check, UserPlus, X } from 'lucide-react'
import { pendingRequestsForTeacher } from '../lib/joinRequests'
import { classNameForKey } from '../lib/studentTokens'
import type { Class, JoinRequest, StudentAccount } from '../types'

interface PendingJoinRequestsPanelProps {
  classes: Class[]
  joinRequests: JoinRequest[]
  studentAccounts: StudentAccount[]
  onApprove: (requestId: string) => void
  onReject: (requestId: string) => void
}

export default function PendingJoinRequestsPanel({
  classes,
  joinRequests,
  studentAccounts,
  onApprove,
  onReject,
}: PendingJoinRequestsPanelProps) {
  const pending = pendingRequestsForTeacher(joinRequests, classes)

  if (pending.length === 0) return null

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-amber-700" strokeWidth={2} />
        <h2 className="font-semibold text-slate-900">
          Pending join requests
          <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-900">
            {pending.length}
          </span>
        </h2>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Students entered your class code. Approve to add them to the roster, or reject
        spam.
      </p>
      <ul className="mt-4 space-y-3">
        {pending.map((request) => {
          const account = studentAccounts.find(
            (a) => a.id === request.studentAccountId,
          )
          return (
            <li
              key={request.id}
              className="flex flex-col gap-3 rounded-lg border border-white bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{request.requestedName}</p>
                <p className="text-sm text-slate-500">
                  Wants to join{' '}
                  <span className="font-medium text-slate-700">
                    {classNameForKey(classes, request.classKey)}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {account?.email ?? 'Unknown account'} ·{' '}
                  {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onReject(request.id)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:flex-initial"
                >
                  <X className="h-4 w-4" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(request.id)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#185560] px-3 py-2 text-sm font-semibold text-white hover:bg-[#134851] sm:flex-initial"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
