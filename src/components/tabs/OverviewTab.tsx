import {
  AlertCircle,
  BookOpen,
  Calendar,
  Clock,
  CreditCard,
  Users,
} from 'lucide-react'
import { useMemo } from 'react'
import { formatTime12h } from '../../lib/classSchedule'
import { classNameForKey, getTokenBalance } from '../../lib/studentTokens'
import type { Class, Student } from '../../types'

const CORPORATE = {
  blue: '#185560',
  blueMuted: 'rgba(24, 85, 96, 0.08)',
  blueBorder: 'rgba(24, 85, 96, 0.15)',
} as const

interface OverviewTabProps {
  students: Student[]
  classes: Class[]
}

interface RenewalEntry {
  studentId: number
  studentName: string
  classKey: string
  className: string
  balance: number
}

function todayWeekday(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
}

function formatRenewalLine(entry: RenewalEntry): string {
  if (entry.balance < 0) {
    return `${entry.studentName} — ${entry.className} (${entry.balance} overdue)`
  }
  return `${entry.studentName} — ${entry.className} (${entry.balance} left)`
}

function isClassScheduledToday(cls: Class, weekday: string): boolean {
  return cls.weeklySchedule.some((d) => d.day === weekday && d.enabled)
}

export default function OverviewTab({ students, classes }: OverviewTabProps) {
  const activeStudents = useMemo(
    () => students.filter((s) => s.status !== 'archived'),
    [students],
  )

  const weekday = todayWeekday()

  const classesToday = useMemo(
    () => classes.filter((c) => isClassScheduledToday(c, weekday)),
    [classes, weekday],
  )

  const renewalEntries = useMemo(() => {
    const entries: RenewalEntry[] = []
    for (const student of activeStudents) {
      for (const classKey of student.enrolledClasses) {
        const balance = getTokenBalance(student, classKey)
        if (balance <= 0) {
          entries.push({
            studentId: student.id,
            studentName: student.name,
            classKey,
            className: classNameForKey(classes, classKey),
            balance,
          })
        }
      }
    }
    return entries.sort((a, b) => a.balance - b.balance)
  }, [activeStudents, classes])

  const studentsNeedingPayment = useMemo(() => {
    const ids = new Set<number>()
    for (const entry of renewalEntries) {
      ids.add(entry.studentId)
    }
    return ids.size
  }, [renewalEntries])

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
      label: 'Payment Reminders',
      value: String(studentsNeedingPayment),
      change:
        renewalEntries.length === 0
          ? 'All accounts current'
          : `${renewalEntries.length} class balance${renewalEntries.length === 1 ? '' : 's'} at or below zero`,
      icon: AlertCircle,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          className="rounded-xl border bg-white shadow-sm"
          style={{ borderColor: CORPORATE.blueBorder }}
        >
          <div
            className="flex items-center gap-2 border-b px-6 py-4"
            style={{ borderColor: CORPORATE.blueBorder }}
          >
            <Calendar className="h-5 w-5" style={{ color: CORPORATE.blue }} strokeWidth={2} />
            <h2 className="font-semibold text-slate-900">Today&apos;s Schedule</h2>
            <span className="ml-auto text-xs font-medium text-slate-400">{weekday}</span>
          </div>
          {todaysSessions.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">
              No classes scheduled for today.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {todaysSessions.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-[rgba(24,85,96,0.04)]"
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
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="rounded-xl border bg-white shadow-sm"
          style={{ borderColor: CORPORATE.blueBorder }}
        >
          <div
            className="flex items-center gap-2 border-b px-6 py-4"
            style={{ borderColor: CORPORATE.blueBorder }}
          >
            <CreditCard className="h-5 w-5" style={{ color: CORPORATE.blue }} strokeWidth={2} />
            <h2 className="font-semibold text-slate-900">💳 Renewals Due</h2>
            {renewalEntries.length > 0 && (
              <span
                className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: 'rgba(244, 63, 94, 0.1)',
                  color: '#be123c',
                }}
              >
                {renewalEntries.length}
              </span>
            )}
          </div>
          {renewalEntries.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium" style={{ color: CORPORATE.blue }}>
                All student accounts are fully paid up.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                No class balances are at or below zero.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {renewalEntries.map((entry) => (
                <li
                  key={`${entry.studentId}-${entry.classKey}`}
                  className="flex items-start gap-3 px-6 py-4 transition-colors hover:bg-[rgba(24,85,96,0.04)]"
                >
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-rose-500"
                    strokeWidth={2}
                  />
                  <p className="text-sm font-medium text-slate-800">
                    {formatRenewalLine(entry)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
