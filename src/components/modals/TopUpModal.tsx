import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { currentMonthKey, formatBillingLabel, isMonthlyClass } from '../../lib/billing'
import { formatTokenLabel } from '../../lib/studentTokens'
import type { Class, Student, TopUpPackage } from '../../types'

export interface TopUpConfirmPayload {
  studentId: number
  classKey: string
  packageType: TopUpPackage
  customAmount: number | undefined
  paidUpfront: boolean
  paidMonthKey?: string
  amountDollars?: number
  note?: string
}

interface TopUpModalProps {
  student: Student | null
  classes: Class[]
  isOpen: boolean
  /** When set (e.g. from class filter on roster), pre-select this class for payment. */
  preferredClassKey?: string
  onClose: () => void
  onConfirm: (payload: TopUpConfirmPayload) => void
}

const PACKAGES: { id: TopUpPackage; label: string; lessons: number }[] = [
  { id: 'standard', label: 'Standard (8 lessons)', lessons: 8 },
  { id: 'intensive', label: 'Intensive (12 lessons)', lessons: 12 },
  { id: 'custom', label: 'Custom', lessons: 0 },
]

export default function TopUpModal({
  student,
  classes,
  isOpen,
  preferredClassKey,
  onClose,
  onConfirm,
}: TopUpModalProps) {
  const [packageType, setPackageType] = useState<TopUpPackage>('standard')
  const [customAmount, setCustomAmount] = useState('10')
  const [paidUpfront, setPaidUpfront] = useState(true)
  const [targetClassKey, setTargetClassKey] = useState('')
  const [paidMonthKey, setPaidMonthKey] = useState(currentMonthKey())
  const [amountDollars, setAmountDollars] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!isOpen || !student) return
    setPackageType('standard')
    setCustomAmount('10')
    setPaidUpfront(true)
    const preferred =
      preferredClassKey &&
      student.enrolledClasses.includes(preferredClassKey)
        ? preferredClassKey
        : ''
    setTargetClassKey(preferred || (student.enrolledClasses[0] ?? ''))
    setPaidMonthKey(currentMonthKey())
    setAmountDollars('')
    setNote('')
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, student, preferredClassKey])

  const enrolledOptions = useMemo(
    () => classes.filter((c) => student?.enrolledClasses.includes(c.classKey)),
    [classes, student],
  )

  const activeKey = targetClassKey || student?.enrolledClasses[0] || ''
  const activeClass = enrolledOptions.find((c) => c.classKey === activeKey)
  const isMonthly = activeClass ? isMonthlyClass(activeClass) : false

  if (!isOpen || !student) return null

  const handleConfirm = () => {
    if (!activeKey) return
    const amount =
      packageType === 'custom' ? Math.max(1, parseInt(customAmount, 10) || 1) : undefined
    const dollars = amountDollars.trim()
      ? Math.max(0, parseFloat(amountDollars) || 0)
      : undefined

    onConfirm({
      studentId: student.id,
      classKey: activeKey,
      packageType,
      customAmount: amount,
      paidUpfront,
      paidMonthKey: isMonthly ? paidMonthKey : undefined,
      amountDollars: isMonthly ? dollars : undefined,
      note: note.trim() || undefined,
    })
  }

  const balanceLabel = activeKey
    ? isMonthly
      ? formatBillingLabel(student, activeKey, classes)
      : formatTokenLabel(student, activeKey)
    : ''

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isMonthly ? 'Record payment' : 'Top up lessons'}: {student.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeKey ? `Current: ${balanceLabel}` : 'Select a class below'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-6 block">
          <span className="text-sm font-medium text-slate-700">Class</span>
          <select
            value={activeKey}
            onChange={(e) => setTargetClassKey(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {enrolledOptions.length === 0 ? (
              <option value="">No enrolled classes</option>
            ) : (
              enrolledOptions.map((c) => (
                <option key={c.classKey} value={c.classKey}>
                  {c.name}
                  {isMonthlyClass(c) ? ' · Monthly' : ` · ${formatTokenLabel(student, c.classKey)}`}
                </option>
              ))
            )}
          </select>
        </label>

        {isMonthly ? (
          <>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">Paid for month</span>
              <input
                type="month"
                value={paidMonthKey}
                onChange={(e) => setPaidMonthKey(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">
                Amount (optional, for your records)
              </span>
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder={activeClass?.monthlyFee ? String(activeClass.monthlyFee) : '0.00'}
                value={amountDollars}
                onChange={(e) => setAmountDollars(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </>
        ) : (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700">Package size</p>
            <div className="mt-2 flex flex-col gap-2">
              {PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setPackageType(pkg.id)}
                  className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                    packageType === pkg.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600/30'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {pkg.label}
                </button>
              ))}
            </div>
            {packageType === 'custom' && (
              <label className="mt-3 block">
                <span className="text-xs font-medium text-slate-500">Lesson count</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
            )}
          </div>
        )}

        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700">Note (optional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Cash, bank transfer"
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </label>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-slate-700">Payment status</legend>
          <div className="mt-2 space-y-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/50">
              <input
                type="radio"
                name="payment"
                checked={paidUpfront}
                onChange={() => setPaidUpfront(true)}
                className="mt-0.5 text-blue-600"
              />
              <span className="text-sm text-slate-700">
                Paid now
                {!isMonthly && (
                  <span className="text-slate-500"> (adds lessons immediately)</span>
                )}
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/50">
              <input
                type="radio"
                name="payment"
                checked={!paidUpfront}
                onChange={() => setPaidUpfront(false)}
                className="mt-0.5 text-blue-600"
              />
              <span className="text-sm text-slate-700">Pay later / owed</span>
            </label>
          </div>
        </fieldset>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!activeKey}
          className="mt-6 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isMonthly ? 'Save payment' : 'Confirm top up'}
        </button>
      </div>
    </div>
  )
}
