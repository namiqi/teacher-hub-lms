import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ClassBillingMode, CreateClassInput } from '../../types'

interface CreateClassModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateClass: (input: CreateClassInput) => void
}

export default function CreateClassModal({
  isOpen,
  onClose,
  onCreateClass,
}: CreateClassModalProps) {
  const [className, setClassName] = useState('')
  const [billingMode, setBillingMode] = useState<ClassBillingMode>('prepaid')
  const [monthlyFee, setMonthlyFee] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setClassName('')
      setBillingMode('prepaid')
      setMonthlyFee('')
      return
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fee = monthlyFee.trim() ? parseFloat(monthlyFee) : undefined
    onCreateClass({
      name: className.trim(),
      billingMode,
      monthlyFee: Number.isFinite(fee) ? fee : undefined,
    })
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
        aria-labelledby="create-class-title"
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="create-class-title" className="text-lg font-semibold text-slate-900">
              Create New Class
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add a new course to your teaching schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Class Name</span>
            <input
              type="text"
              required
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. Algebra II"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <fieldset className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
            <legend className="px-1 text-sm font-medium text-slate-800">Billing</legend>
            <div className="mt-2 flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="create-billing"
                  checked={billingMode === 'prepaid'}
                  onChange={() => setBillingMode('prepaid')}
                />
                Prepaid lessons (track lesson balance)
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="create-billing"
                  checked={billingMode === 'monthly'}
                  onChange={() => setBillingMode('monthly')}
                />
                Monthly flat fee
              </label>
            </div>
            {billingMode === 'monthly' && (
              <label className="mt-3 block">
                <span className="text-xs text-slate-500">Typical monthly amount (optional)</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            )}
          </fieldset>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#185560] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#134851] sm:flex-1"
            >
              Create Class
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
