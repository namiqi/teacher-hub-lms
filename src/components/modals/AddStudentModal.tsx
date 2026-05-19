import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Class, CreateStudentInput } from '../../types'

interface AddStudentModalProps {
  isOpen: boolean
  classes: Class[]
  onClose: () => void
  onAdd: (input: CreateStudentInput) => void
}

const EMPTY: CreateStudentInput = {
  name: '',
  parentContact: '',
  grade: '',
  classKey: '',
}

export default function AddStudentModal({
  isOpen,
  classes,
  onClose,
  onAdd,
}: AddStudentModalProps) {
  const [form, setForm] = useState<CreateStudentInput>(EMPTY)

  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY)
      return
    }
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({
      name: form.name.trim(),
      parentContact: form.parentContact.trim(),
      grade: form.grade.trim(),
      classKey: form.classKey,
    })
    setForm(EMPTY)
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
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add Student</h2>
            <p className="mt-1 text-sm text-slate-500">
              New students start with 0 / 8 lessons in the selected class.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Student Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Farid M."
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Parent Contact (Phone / WhatsApp)
            </span>
            <input
              required
              value={form.parentContact}
              onChange={(e) => setForm((f) => ({ ...f, parentContact: e.target.value }))}
              placeholder="+1 (555) 000-0000"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Age / Grade</span>
            <input
              required
              value={form.grade}
              onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
              placeholder="e.g. Grade 9"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Assigned Class</span>
            <select
              required
              value={form.classKey}
              onChange={(e) => setForm((f) => ({ ...f, classKey: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="" disabled>
                Select a class
              </option>
              {classes.map((c) => (
                <option key={c.classKey} value={c.classKey}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add Student
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
