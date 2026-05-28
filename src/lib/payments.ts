import type { PaymentRecord, TopUpPackage } from '../types'

export function createPaymentId(): string {
  return `pay-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function packageLessons(
  packageType: TopUpPackage,
  customAmount?: number,
): number {
  if (packageType === 'custom') return Math.max(1, customAmount ?? 8)
  if (packageType === 'intensive') return 12
  return 8
}

export function formatPaymentRecord(record: PaymentRecord, className: string): string {
  const date = new Date(record.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  if (record.type === 'monthly_fee') {
    const month = record.paidMonthKey ? ` · ${record.paidMonthKey}` : ''
    const amount =
      record.amountDollars != null ? ` · $${record.amountDollars.toFixed(2)}` : ''
    const status = record.paidUpfront ? 'Paid' : 'Owed'
    return `${date} — ${className} monthly ${status}${month}${amount}`
  }

  const lessons = record.lessonsAdded ?? 0
  const status = record.paidUpfront ? 'Paid' : 'Owed'
  return `${date} — ${className} +${lessons} lessons (${status})`
}

export function sortPaymentsNewestFirst(records: PaymentRecord[]): PaymentRecord[] {
  return [...records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function paymentsForStudent(
  records: PaymentRecord[],
  studentId: number,
): PaymentRecord[] {
  return sortPaymentsNewestFirst(records.filter((r) => r.studentId === studentId))
}

export function paymentsForStudentClass(
  records: PaymentRecord[],
  studentId: number,
  classKey: string,
): PaymentRecord[] {
  return sortPaymentsNewestFirst(
    records.filter((r) => r.studentId === studentId && r.classKey === classKey),
  )
}

export function formatStudentPaymentLine(record: PaymentRecord): string {
  const date = new Date(record.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  if (record.type === 'monthly_fee') {
    const month = record.paidMonthKey
      ? new Date(`${record.paidMonthKey}-01`).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })
      : 'Monthly fee'
    const amount =
      record.amountDollars != null
        ? ` · $${record.amountDollars.toFixed(0)}`
        : ''
    return `${date} — ${month}${amount}`
  }
  const lessons = record.lessonsAdded ?? 0
  return `${date} — +${lessons} lesson${lessons === 1 ? '' : 's'}`
}
