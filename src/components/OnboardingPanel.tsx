import { BookOpen, CalendarCheck, Check, Users } from 'lucide-react'
import type { Class, Student } from '../types'

interface OnboardingPanelProps {
  classes: Class[]
  students: Student[]
  onCreateClass: () => void
  onGoToStudents: () => void
  onGoToAttendance: () => void
}

export default function OnboardingPanel({
  classes,
  students,
  onCreateClass,
  onGoToStudents,
  onGoToAttendance,
}: OnboardingPanelProps) {
  const hasClass = classes.some((c) => c.status === 'active')
  const activeStudents = students.filter((s) => s.status === 'active')
  const hasEnrollment = activeStudents.some((s) => s.enrolledClasses.length > 0)

  const steps = [
    {
      id: 'class',
      label: 'Create your first class',
      detail: 'Set your schedule and name each group you teach.',
      done: hasClass,
      action: hasClass ? undefined : onCreateClass,
      actionLabel: 'Create class',
      icon: BookOpen,
    },
    {
      id: 'students',
      label: 'Add students to a class',
      detail: 'Build your roster with contact info and lesson balances.',
      done: hasEnrollment,
      action: hasClass && !hasEnrollment ? onGoToStudents : undefined,
      actionLabel: 'Add students',
      icon: Users,
    },
    {
      id: 'attendance',
      label: 'Take attendance',
      detail: 'Mark who showed up — lesson credits update automatically.',
      done: false,
      action: hasEnrollment ? onGoToAttendance : undefined,
      actionLabel: 'Open attendance',
      icon: CalendarCheck,
    },
  ] as const

  const completedCount = steps.filter((s) => s.done).length

  return (
    <section
      className="rounded-xl border bg-white p-5 shadow-sm sm:p-6"
      style={{ borderColor: 'rgba(24, 85, 96, 0.15)' }}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#185560]">
            Getting started
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Set up your teaching workspace
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {completedCount === 0
              ? 'Follow these steps instead of starting from a blank screen.'
              : `${completedCount} of ${steps.length} steps complete — keep going.`}
          </p>
        </div>
      </div>

      <ol className="mt-5 space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isLocked =
            step.id === 'students' && !hasClass
              ? true
              : step.id === 'attendance' && !hasEnrollment

          return (
            <li
              key={step.id}
              className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
                step.done
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : isLocked
                    ? 'border-slate-100 bg-slate-50/80 opacity-80'
                    : 'border-slate-200 bg-slate-50/30'
              }`}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    step.done
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200'
                  }`}
                >
                  {step.done ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    index + 1
                  )}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-[#185560]" strokeWidth={2} />
                    <p className="font-medium text-slate-900">{step.label}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{step.detail}</p>
                  {isLocked && (
                    <p className="mt-1 text-xs text-slate-400">
                      {step.id === 'students'
                        ? 'Create a class first.'
                        : 'Add at least one enrolled student first.'}
                    </p>
                  )}
                </div>
              </div>
              {step.action && !step.done && !isLocked && (
                <button
                  type="button"
                  onClick={step.action}
                  className="shrink-0 rounded-lg bg-[#185560] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#134851] sm:ml-4"
                >
                  {step.actionLabel}
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
