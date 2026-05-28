import type { Class, ClassBillingMode, Student } from '../types'
import { getTokenBalance } from './studentTokens'

export function getClassBillingMode(cls: Class): ClassBillingMode {
  return cls.billingMode ?? 'prepaid'
}

export function isPrepaidClass(cls: Class): boolean {
  return getClassBillingMode(cls) === 'prepaid'
}

export function isMonthlyClass(cls: Class): boolean {
  return getClassBillingMode(cls) === 'monthly'
}

/** Local calendar month as YYYY-MM */
export function currentMonthKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function formatMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  if (!y || !m) return monthKey
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function getPaidThroughMonth(
  student: Student,
  classKey: string,
): string | undefined {
  return student.paidThroughMonthByClass?.[classKey]
}

export function isMonthlyPaidForCurrentMonth(
  student: Student,
  classKey: string,
  monthKey = currentMonthKey(),
): boolean {
  const paid = getPaidThroughMonth(student, classKey)
  if (!paid) return false
  return paid >= monthKey
}

export function isPrepaidBalanceLow(student: Student, classKey: string): boolean {
  return getTokenBalance(student, classKey) <= 0
}

export function formatBillingLabel(
  student: Student,
  classKey: string,
  classes: Class[],
): string {
  const cls = classes.find((c) => c.classKey === classKey)
  if (cls && isMonthlyClass(cls)) {
    const paid = getPaidThroughMonth(student, classKey)
    if (!paid) return 'Monthly · not paid'
    if (isMonthlyPaidForCurrentMonth(student, classKey)) {
      return `Monthly · paid (${formatMonthKey(paid)})`
    }
    return `Monthly · due (last: ${formatMonthKey(paid)})`
  }
  const left = getTokenBalance(student, classKey)
  const total = student.tokenCapacityByClass[classKey] ?? 0
  return `${left} / ${total} lessons`
}

export function classUsesTokens(cls: Class): boolean {
  return isPrepaidClass(cls)
}

export function applyMonthlyPayment(
  student: Student,
  classKey: string,
  monthKey: string,
): Student {
  return {
    ...student,
    paidThroughMonthByClass: {
      ...(student.paidThroughMonthByClass ?? {}),
      [classKey]: monthKey,
    },
  }
}
