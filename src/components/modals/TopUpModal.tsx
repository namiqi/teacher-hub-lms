import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatTokenLabel } from '../../lib/studentTokens'
import type { Class, Student, TopUpPackage } from '../../types'

interface TopUpModalProps {
  student: Student | null
  classes: Class[]
  isOpen: boolean
  onClose: () => void
  onConfirm: (
    studentId: number,
    classKey: string,
    packageType: TopUpPackage,
    customAmount: number | undefined,
    paidUpfront: boolean,
  ) => void
}

const PACKAGES: { id: TopUpPackage; label: string; lessons: number }[] = [
  { id: 'standard', label: 'Standard Block (8 Lessons)', lessons: 8 },
  { id: 'intensive', label: 'Intensive Block (12 Lessons)', lessons: 12 },
  { id: 'custom', label: 'Custom', lessons: 0 },
]

export default function TopUpModal({
  student,
  classes,
  isOpen,
  onClose,
  onConfirm,
}: TopUpModalProps) {
  const [packageType, setPackageType] = useState<TopUpPackage>('standard')
  const [customAmount, setCustomAmount] = useState('10')
  const [paidUpfront, setPaidUpfront] = useState(true)
  const [targetClassKey, setTargetClassKey] = useState('')

  useEffect(() => {
    if (!isOpen || !student) return
    setPackageType('standard')
    setCustomAmount('10')
    setPaidUpfront(true)
    setTargetClassKey(student.enrolledClasses[0] ?? '')
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, student])

  if (!isOpen || !student) return null

  const enrolledOptions = classes.filter((c) =>
    student.enrolledClasses.includes(c.classKey),
  )

  const activeKey = targetClassKey || student.enrolledClasses[0] || ''

  const handleConfirm = () => {
    if (!activeKey) return
    const amount =
      packageType === 'custom' ? Math.max(1, parseInt(customAmount, 10) || 1) : undefined
    onConfirm(student.id, activeKey, packageType, amount, paidUpfront)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Top Up Pack: {student.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeKey
                ? `Current balance (${enrolledOptions.find((c) => c.classKey === activeKey)?.name ?? activeKey}): ${formatTokenLabel(student, activeKey)}`
                : 'Select a target class below'}
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
          <span className="text-sm font-medium text-slate-700">Select Target Class</span>
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
                  {c.name} — {formatTokenLabel(student, c.classKey)}
                </option>
              ))
            )}
          </select>
        </label>

        <div className="mt-6">
          <p className="text-sm font-medium text-slate-700">Select Package Size</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setPackageType(pkg.id)}
                className={`flex-1 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all ${
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
              <span className="text-xs font-medium text-slate-500">Custom lesson count</span>
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

        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-slate-700">Payment Status</legend>
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
                Paid Upfront <span className="text-slate-500">(Adds tokens immediately)</span>
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
              <span className="text-sm text-slate-700">Pay Later / Promise</span>
            </label>
          </div>
        </fieldset>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!activeKey}
          className="mt-6 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirm Top Up
        </button>
      </div>
    </div>
  )
}
