import {
  classNameForKey,
  getTokenBalance,
} from './studentTokens'
import {
  currentMonthKey,
  formatMonthKey,
  isMonthlyClass,
  isMonthlyPaidForCurrentMonth,
  isPrepaidClass,
} from './billing'
import type { Class, PaymentRecord, Student } from '../types'

export type ActionKind =
  | 'prepaid_low'
  | 'monthly_due'
  | 'payment_owed'

export interface ActionItem {
  id: string
  kind: ActionKind
  title: string
  subtitle: string
}

export function buildActionInboxItems(
  students: Student[],
  classes: Class[],
  payments: PaymentRecord[],
): ActionItem[] {
  const items: ActionItem[] = []
  const monthKey = currentMonthKey()
  const activeStudents = students.filter((s) => s.status === 'active')

  for (const student of activeStudents) {
    for (const classKey of student.enrolledClasses) {
      const cls = classes.find((c) => c.classKey === classKey)
      if (!cls) continue
      const className = classNameForKey(classes, classKey)

      if (isPrepaidClass(cls) && getTokenBalance(student, classKey) <= 0) {
        const balance = getTokenBalance(student, classKey)
        items.push({
          id: `prepaid-${student.id}-${classKey}`,
          kind: 'prepaid_low',
          title: student.name,
          subtitle:
            balance < 0
              ? `${className} · ${balance} lessons overdue`
              : `${className} · no lessons left`,
        })
      }

      if (
        isMonthlyClass(cls) &&
        !isMonthlyPaidForCurrentMonth(student, classKey, monthKey)
      ) {
        const paid = student.paidThroughMonthByClass?.[classKey]
        items.push({
          id: `monthly-${student.id}-${classKey}`,
          kind: 'monthly_due',
          title: student.name,
          subtitle: paid
            ? `${className} · due for ${formatMonthKey(monthKey)}`
            : `${className} · monthly fee not recorded`,
        })
      }
    }
  }

  for (const payment of payments) {
    if (payment.paidUpfront) continue
    const student = activeStudents.find((s) => s.id === payment.studentId)
    if (!student) continue
    const className = classNameForKey(classes, payment.classKey)
    const detail =
      payment.type === 'monthly_fee'
        ? `Monthly payment owed · ${className}`
        : `+${payment.lessonsAdded ?? 0} lessons owed · ${className}`
    items.push({
      id: `owed-${payment.id}`,
      kind: 'payment_owed',
      title: student.name,
      subtitle: detail,
    })
  }

  const kindOrder: Record<ActionKind, number> = {
    prepaid_low: 0,
    monthly_due: 1,
    payment_owed: 2,
  }

  return items.sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind])
}

export function actionKindLabel(kind: ActionKind): string {
  switch (kind) {
    case 'prepaid_low':
      return 'Lessons'
    case 'monthly_due':
      return 'Monthly'
    case 'payment_owed':
      return 'Owed'
  }
}
