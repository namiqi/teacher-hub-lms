import { Bell, Calendar, ChevronRight } from 'lucide-react'
import { formatAssignmentDue } from '../../../lib/assignments'
import { classNameForKey } from '../../../lib/studentTokens'
import {
  dueSoonStatusLabel,
  notificationKindLabel,
  notificationKindStyles,
  type DueSoonItem,
  type StudentNotificationKind,
} from '../../../lib/studentNotifications'
import type { Class, JoinRequest } from '../../../types'

export type HomeUpdateItem = {
  id: string
  kind: StudentNotificationKind
  title: string
  subtitle: string
  onSelect: () => void
}

interface StudentHomeTabProps {
  displayName: string
  updateItems: HomeUpdateItem[]
  dueSoonItems: DueSoonItem[]
  joinRequests: JoinRequest[]
  classes: Class[]
  onOpenAssignment: (classKey: string, assignmentId: string) => void
  onJoinClass: () => void
}

export default function StudentHomeTab({
  displayName,
  updateItems,
  dueSoonItems,
  joinRequests,
  classes,
  onOpenAssignment,
  onJoinClass,
}: StudentHomeTabProps) {
  const pendingRequests = joinRequests.filter((r) => r.status === 'pending')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Welcome back, {displayName.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your latest updates and upcoming deadlines.
        </p>
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Bell className="h-4 w-4 text-violet-600" />
          <h2 className="font-semibold text-slate-900">Updates</h2>
          {updateItems.length > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
              {updateItems.length}
            </span>
          )}
        </div>
        {updateItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center">
            <p className="text-sm text-slate-500">You&apos;re all caught up.</p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
            {updateItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={item.onSelect}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 sm:px-5"
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${notificationKindStyles(item.kind)}`}
                  >
                    {notificationKindLabel(item.kind)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {item.subtitle}
                    </span>
                  </span>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pendingRequests.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-slate-900">Waiting for approval</h2>
          <ul className="space-y-2">
            {pendingRequests.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-amber-950">
                    {classNameForKey(classes, r.classKey)}
                  </p>
                  <p className="mt-0.5 text-xs text-amber-800/80">
                    Join request pending · teacher must approve
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900">
                  Pending
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onJoinClass}
            className="mt-3 text-sm font-medium text-violet-700 hover:text-violet-800 hover:underline"
          >
            Join another class
          </button>
        </section>
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

      {enrolledClassesHint(joinRequests, dueSoonItems, updateItems) && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-center sm:px-6">
          <p className="text-sm text-slate-600">
            Browse your enrolled classes from the{' '}
            <span className="font-medium text-violet-700">Classes</span> tab.
          </p>
        </div>
      )}
    </div>
  )
}

function enrolledClassesHint(
  joinRequests: JoinRequest[],
  dueSoonItems: DueSoonItem[],
  updateItems: HomeUpdateItem[],
): boolean {
  return (
    joinRequests.filter((r) => r.status === 'pending').length === 0 &&
    dueSoonItems.length === 0 &&
    updateItems.length === 0
  )
}
