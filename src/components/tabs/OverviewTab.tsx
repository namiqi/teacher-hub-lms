import { BookOpen, Calendar, Clock, Users } from 'lucide-react'
import { useMemo } from 'react'
import { formatTime12h } from '../../lib/classSchedule'
import { buildActionInboxItems } from '../../lib/actionInbox'
import ActionInbox from '../ActionInbox'
import OnboardingPanel from '../OnboardingPanel'
import PendingJoinRequestsPanel from '../PendingJoinRequestsPanel'
import { isWorkspaceSetup } from '../../lib/workspace'
import type {
  Class,
  JoinRequest,
  PaymentRecord,
  Student,
  StudentAccount,
} from '../../types'

const CORPORATE = {
  blue: '#185560',
  blueMuted: 'rgba(24, 85, 96, 0.08)',
  blueBorder: 'rgba(24, 85, 96, 0.15)',
} as const

interface OverviewTabProps {
  students: Student[]
  classes: Class[]
  payments: PaymentRecord[]
  joinRequests: JoinRequest[]
  studentAccounts: StudentAccount[]
  onApproveJoinRequest: (requestId: string) => void
  onRejectJoinRequest: (requestId: string) => void
  onCreateClass: () => void
  onGoToStudents: () => void
  onGoToAttendance: () => void
}

function todayWeekday(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
}

function isClassScheduledToday(cls: Class, weekday: string): boolean {
  return cls.weeklySchedule.some((d) => d.day === weekday && d.enabled)
}

export default function OverviewTab({
  students,
  classes,
  payments,
  joinRequests,
  studentAccounts,
  onApproveJoinRequest,
  onRejectJoinRequest,
  onCreateClass,
  onGoToStudents,
  onGoToAttendance,
}: OverviewTabProps) {
  const showOnboarding = !isWorkspaceSetup(classes, students)
  const activeStudents = useMemo(
    () => students.filter((s) => s.status !== 'archived'),
    [students],
  )

  const weekday = todayWeekday()
  const actionItems = useMemo(
    () => buildActionInboxItems(students, classes, payments),
    [students, classes, payments],
  )

  const classesToday = useMemo(
    () => classes.filter((c) => isClassScheduledToday(c, weekday)),
    [classes, weekday],
  )

  const todaysSessions = useMemo(() => {
    return classesToday
      .map((cls) => {
        const slot = cls.weeklySchedule.find((d) => d.day === weekday && d.enabled)
        return {
          id: cls.id,
          name: cls.name,
          time: slot ? formatTime12h(slot.time) : '',
          location: cls.location || 'No location set',
        }
      })
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [classesToday, weekday])

  const attentionCount = actionItems.length

  const metrics = [
    {
      label: 'Total Students',
      value: String(activeStudents.length),
      change: `${activeStudents.length} active on roster`,
      icon: Users,
    },
    {
      label: 'Classes Today',
      value: String(classesToday.length),
      change:
        classesToday.length === 1
          ? '1 session scheduled'
          : `${classesToday.length} sessions scheduled`,
      icon: BookOpen,
    },
    {
      label: 'Needs Attention',
      value: String(attentionCount),
      change:
        attentionCount === 0
          ? 'Payments and balances are current'
          : `${attentionCount} payment or balance item${attentionCount === 1 ? '' : 's'}`,
      icon: Calendar,
    },
  ]

  return (
    <div className="space-y-5 md:space-y-6">
      {showOnboarding && (
        <OnboardingPanel
          classes={classes}
          students={students}
          onCreateClass={onCreateClass}
          onGoToStudents={onGoToStudents}
          onGoToAttendance={onGoToAttendance}
        />
      )}

      <PendingJoinRequestsPanel
        classes={classes}
        joinRequests={joinRequests}
        studentAccounts={studentAccounts}
        onApprove={onApproveJoinRequest}
        onReject={onRejectJoinRequest}
      />

      <section
        className="rounded-xl border bg-white shadow-sm"
        style={{ borderColor: CORPORATE.blueBorder }}
      >
        <div
          className="flex items-center gap-2 border-b px-4 py-3 md:px-6 md:py-4"
          style={{ borderColor: CORPORATE.blueBorder }}
        >
          <Calendar className="h-5 w-5" style={{ color: CORPORATE.blue }} strokeWidth={2} />
          <h2 className="font-semibold text-slate-900">Today&apos;s schedule</h2>
        </div>
        {todaysSessions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500 md:px-6 md:py-10">
            No classes scheduled for today.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {todaysSessions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={onGoToAttendance}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgba(24,85,96,0.04)] md:gap-4 md:px-6 md:py-4"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: CORPORATE.blueMuted }}
                  >
                    <Clock className="h-4 w-4" style={{ color: CORPORATE.blue }} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.location}</p>
                  </div>
                  <span
                    className="shrink-0 text-sm font-medium"
                    style={{ color: CORPORATE.blue }}
                  >
                    {item.time}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ActionInbox
        students={students}
        classes={classes}
        payments={payments}
        onGoToStudents={onGoToStudents}
      />

      <div className="hidden gap-5 sm:grid-cols-2 lg:grid-cols-3 md:grid">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            style={{ borderColor: CORPORATE.blueBorder }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                <p
                  className="mt-2 text-3xl font-semibold tracking-tight"
                  style={{ color: CORPORATE.blue }}
                >
                  {metric.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">{metric.change}</p>
              </div>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: CORPORATE.blueMuted,
                  color: CORPORATE.blue,
                }}
              >
                <metric.icon className="h-5 w-5" strokeWidth={2} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
