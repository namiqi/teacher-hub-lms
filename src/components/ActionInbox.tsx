import { AlertCircle, BookOpen, CreditCard } from 'lucide-react'
import {
  actionKindLabel,
  buildActionInboxItems,
  type ActionKind,
} from '../lib/actionInbox'
import type { Class, PaymentRecord, Student } from '../types'

const KIND_ICON: Record<ActionKind, typeof AlertCircle> = {
  prepaid_low: AlertCircle,
  monthly_due: CreditCard,
  payment_owed: CreditCard,
}

interface ActionInboxProps {
  students: Student[]
  classes: Class[]
  payments: PaymentRecord[]
  onGoToStudents: () => void
}

export default function ActionInbox({
  students,
  classes,
  payments,
  onGoToStudents,
}: ActionInboxProps) {
  const items = buildActionInboxItems(students, classes, payments)

  if (items.length === 0) {
    return (
      <section
        className="rounded-xl border bg-white p-4 shadow-sm md:p-5"
        style={{ borderColor: 'rgba(24, 85, 96, 0.15)' }}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#185560]" strokeWidth={2} />
          <h2 className="font-semibold text-slate-900">Needs your attention</h2>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          You&apos;re all caught up — no lesson balances or payments need follow-up.
        </p>
      </section>
    )
  }

  return (
    <section
      className="rounded-xl border bg-white shadow-sm"
      style={{ borderColor: 'rgba(24, 85, 96, 0.15)' }}
    >
      <div
        className="flex items-center justify-between gap-2 border-b px-4 py-3 md:px-5"
        style={{ borderColor: 'rgba(24, 85, 96, 0.1)' }}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-[#185560]" strokeWidth={2} />
          <h2 className="font-semibold text-slate-900">Needs your attention</h2>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            color: '#be123c',
          }}
        >
          {items.length}
        </span>
      </div>
      <ul className="max-h-[min(320px,50vh)] divide-y divide-slate-100 overflow-y-auto">
        {items.map((item) => {
          const Icon = KIND_ICON[item.kind]
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={onGoToStudents}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgba(24,85,96,0.04)] md:px-5 md:py-3.5"
              >
                <div
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'rgba(24, 85, 96, 0.08)' }}
                >
                  <Icon className="h-4 w-4 text-[#185560]" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-slate-900">{item.title}</p>
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {actionKindLabel(item.kind)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{item.subtitle}</p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
