import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatBillingLabel } from '../../lib/billing'
import { formatPaymentRecord, paymentsForStudent } from '../../lib/payments'
import {
  classNameForKey,
  ensureTokenMapsForEnrollment,
} from '../../lib/studentTokens'
import type { Class, PaymentRecord, Student } from '../../types'

interface StudentDetailDrawerProps {
  student: Student | null
  classes: Class[]
  payments: PaymentRecord[]
  isOpen: boolean
  isVaultView: boolean
  onClose: () => void
  onSave: (student: Student) => void
  onArchive: (studentId: number) => void
  onReactivate: (studentId: number) => void
  onDelete: (studentId: number) => void
}

export default function StudentDetailDrawer({
  student,
  classes,
  payments,
  isOpen,
  isVaultView,
  onClose,
  onSave,
  onArchive,
  onReactivate,
  onDelete,
}: StudentDetailDrawerProps) {
  const [draft, setDraft] = useState<Student | null>(null)
  const [selectedClassKeys, setSelectedClassKeys] = useState<string[]>([])

  useEffect(() => {
    if (student) {
      setDraft({ ...student })
      setSelectedClassKeys([...student.enrolledClasses])
    }
  }, [student])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !student || !draft) return null

  const studentPayments = paymentsForStudent(payments, student.id)

  const toggleClass = (classKey: string) => {
    setSelectedClassKeys((prev) => {
      const next = prev.includes(classKey)
        ? prev.filter((k) => k !== classKey)
        : [...prev, classKey]
      const maps = ensureTokenMapsForEnrollment(draft, next, 0)
      setDraft((d) =>
        d
          ? {
              ...d,
              enrolledClasses: maps.enrolledClasses,
              tokensByClass: maps.tokensByClass,
              tokenCapacityByClass: maps.tokenCapacityByClass,
            }
          : d,
      )
      return next
    })
  }

  const handleSave = () => {
    const maps = ensureTokenMapsForEnrollment(draft, selectedClassKeys, 0)
    onSave({
      ...draft,
      name: draft.name.trim(),
      studentPhone: (draft.studentPhone ?? '').trim(),
      parentPhone: (draft.parentPhone ?? '').trim(),
      grade: (draft.grade ?? '').trim(),
      enrolledClasses: maps.enrolledClasses,
      tokensByClass: maps.tokensByClass,
      tokenCapacityByClass: maps.tokenCapacityByClass,
    })
    onClose()
  }

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Permanently delete ${student.name}? This cannot be undone.`,
    )
    if (confirmed) {
      onDelete(student.id)
      onClose()
    }
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close drawer"
      />
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-[slideIn_0.25s_ease-out]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Student Profile</h2>
            <p className="text-sm text-slate-500">{student.initials} · ID #{student.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mb-6 flex items-center gap-4">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white ${student.avatarColor}`}
            >
              {student.initials}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{student.name}</p>
              <p className="text-sm text-slate-500">
                {selectedClassKeys.length === 0
                  ? 'No class enrollments'
                  : selectedClassKeys
                      .map((key) => formatBillingLabel(draft, key, classes))
                      .join(' · ')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => d && { ...d, name: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Student Phone (Optional)
              </span>
              <input
                value={draft.studentPhone ?? ''}
                onChange={(e) =>
                  setDraft((d) => d && { ...d, studentPhone: e.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Parent Phone (Optional)
              </span>
              <input
                value={draft.parentPhone ?? ''}
                onChange={(e) =>
                  setDraft((d) => d && { ...d, parentPhone: e.target.value })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Grade / Status (Optional)</span>
              <input
                value={draft.grade ?? ''}
                onChange={(e) => setDraft((d) => d && { ...d, grade: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>

            <fieldset>
              <legend className="text-sm font-medium text-slate-700">
                Class enrollments
              </legend>
              <p className="mt-1 text-xs text-slate-500">
                Check classes to enroll; new classes start with 0 tokens.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {classes.map((c) => {
                  const checked = selectedClassKeys.includes(c.classKey)
                  return (
                    <label
                      key={c.classKey}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                        checked
                          ? 'border-blue-300 bg-blue-50/60'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleClass(c.classKey)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-800">{c.name}</span>
                      </span>
                      {checked && (
                        <span className="text-xs font-medium text-slate-600">
                          {formatBillingLabel(draft, c.classKey, classes)}
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            </fieldset>

            {selectedClassKeys.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedClassKeys.map((key) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    {classNameForKey(classes, key)}
                    <span className="text-slate-400">·</span>
                    {formatBillingLabel(draft, key, classes)}
                  </span>
                ))}
              </div>
            )}

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-medium text-slate-800">Payment history</h3>
              {studentPayments.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No payments recorded yet.</p>
              ) : (
                <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                  {studentPayments.slice(0, 20).map((record) => (
                    <li
                      key={record.id}
                      className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs text-slate-700"
                    >
                      {formatPaymentRecord(
                        record,
                        classNameForKey(classes, record.classKey),
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="mt-6 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Save Changes
          </button>

          {isVaultView ? (
            <button
              type="button"
              onClick={() => {
                onReactivate(student.id)
                onClose()
              }}
              className="mt-3 w-full rounded-lg border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Reactivate
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onArchive(student.id)
                onClose()
              }}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Archive Student
            </button>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-slate-400 underline-offset-2 hover:text-rose-600 hover:underline"
          >
            Delete Permanently
          </button>
        </div>
      </aside>
    </>
  )
}
