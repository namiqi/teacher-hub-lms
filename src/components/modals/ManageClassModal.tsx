import { Copy, Plus, RefreshCw, Search, UserPlus, X } from 'lucide-react'
import { useState as useReactState } from 'react'
import { formatJoinCodeForDisplay } from '../../lib/joinCodes'
import { useEffect, useMemo, useState } from 'react'
import { WEEKDAYS } from '../../lib/classSchedule'
import type {
  Class,
  ClassBillingMode,
  ClassDaySchedule,
  ManageClassUpdate,
  Student,
} from '../../types'

type ModalTab = 'roster' | 'invite' | 'schedule'

interface ManageClassModalProps {
  classItem: Class | null
  students: Student[]
  isOpen: boolean
  onClose: () => void
  onSave: (classId: number, update: ManageClassUpdate) => void
  onDisband: (classId: number) => void
  onRegenerateJoinCode: (classId: number) => void
}

export default function ManageClassModal({
  classItem,
  students,
  isOpen,
  onClose,
  onSave,
  onDisband,
  onRegenerateJoinCode,
}: ManageClassModalProps) {
  const [copied, setCopied] = useReactState(false)
  const [tab, setTab] = useState<ModalTab>('roster')
  const [className, setClassName] = useState('')
  const [studentIds, setStudentIds] = useState<number[]>([])
  const [weeklySchedule, setWeeklySchedule] = useState<ClassDaySchedule[]>([])
  const [location, setLocation] = useState('')
  const [billingMode, setBillingMode] = useState<ClassBillingMode>('prepaid')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [addQuery, setAddQuery] = useState('')
  const [selectedToAdd, setSelectedToAdd] = useState('')

  useEffect(() => {
    if (!isOpen || !classItem) return
    setTab('roster')
    setAddQuery('')
    setSelectedToAdd('')
  }, [isOpen, classItem?.id])

  useEffect(() => {
    if (!classItem || !isOpen) return
    setClassName(classItem.name)
    setStudentIds([...classItem.studentIds])
    setWeeklySchedule(classItem.weeklySchedule.map((d) => ({ ...d })))
    setLocation(classItem.location)
    setBillingMode(classItem.billingMode === 'monthly' ? 'monthly' : 'prepaid')
    setMonthlyFee(
      classItem.monthlyFee != null ? String(classItem.monthlyFee) : '',
    )
  }, [classItem, isOpen])

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const enrolled = useMemo(
    () =>
      studentIds
        .map((id) => students.find((s) => s.id === id))
        .filter((s): s is Student => Boolean(s)),
    [studentIds, students],
  )

  const availableToAdd = useMemo(() => {
    const q = addQuery.trim().toLowerCase()
    return students.filter(
      (s) =>
        s.status === 'active' &&
        !studentIds.includes(s.id) &&
        (!q ||
          s.name.toLowerCase().includes(q) ||
          (s.grade ?? '').toLowerCase().includes(q) ||
          (s.studentPhone ?? '').toLowerCase().includes(q) ||
          (s.parentPhone ?? '').toLowerCase().includes(q)),
    )
  }, [students, studentIds, addQuery])

  if (!isOpen || !classItem) return null

  const handleAddStudent = () => {
    const id = Number(selectedToAdd)
    if (!id || studentIds.includes(id)) return
    setStudentIds((prev) => [...prev, id])
    setSelectedToAdd('')
    setAddQuery('')
  }

  const handleRemove = (id: number) => {
    setStudentIds((prev) => prev.filter((sid) => sid !== id))
  }

  const toggleDay = (day: string, enabled: boolean) => {
    setWeeklySchedule((prev) =>
      prev.map((d) => (d.day === day ? { ...d, enabled } : d)),
    )
  }

  const setDayTime = (day: string, time: string) => {
    setWeeklySchedule((prev) =>
      prev.map((d) => (d.day === day ? { ...d, time } : d)),
    )
  }

  const handleSave = () => {
    const trimmedName = className.trim()
    if (!trimmedName) return
    const fee = monthlyFee.trim() ? parseFloat(monthlyFee) : undefined
    onSave(classItem.id, {
      name: trimmedName,
      studentIds,
      weeklySchedule,
      location,
      billingMode,
      monthlyFee: Number.isFinite(fee) ? fee : undefined,
    })
    onClose()
  }

  const handleDisband = () => {
    const confirmed = window.confirm(
      'Are you sure you want to archive this class? This will hide it from active dashboards.',
    )
    if (!confirmed) return
    onDisband(classItem.id)
    onClose()
  }

  const tabClass = (active: boolean) =>
    `flex-1 border-b-2 py-3 text-center text-sm font-medium transition-colors ${
      active
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-slate-500 hover:text-slate-800'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex h-[min(92vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:h-[min(680px,90vh)] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0 flex-1 pr-2">
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Class name</span>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="mt-0.5 w-full truncate rounded-lg border border-transparent bg-transparent px-0 py-0.5 text-lg font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-200 focus:bg-white focus:px-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="Class name"
              />
            </label>
            <p className="mt-1 text-sm text-slate-500">
              {enrolled.length} enrolled · Settings
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="-mb-px flex shrink-0 border-b border-slate-100">
          <button type="button" onClick={() => setTab('roster')} className={tabClass(tab === 'roster')}>
            Roster
          </button>
          <button type="button" onClick={() => setTab('invite')} className={tabClass(tab === 'invite')}>
            Invite
          </button>
          <button
            type="button"
            onClick={() => setTab('schedule')}
            className={tabClass(tab === 'schedule')}
          >
            Schedule
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {tab === 'roster' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Enrolled ({enrolled.length})
                </p>
                {enrolled.length === 0 ? (
                  <p className="mt-2 rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
                    No students yet. Add below or approve join requests on Home.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {enrolled.map((student) => (
                      <li
                        key={student.id}
                        className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${student.avatarColor}`}
                          >
                            {student.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">
                              {student.name}
                            </p>
                            <p className="text-xs text-slate-500">{student.grade}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(student.id)}
                          className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                <p className="text-xs font-medium text-slate-600">Add from your roster</p>
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={addQuery}
                    onChange={(e) => setAddQuery(e.target.value)}
                    placeholder="Search name or grade…"
                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <select
                    value={selectedToAdd}
                    onChange={(e) => setSelectedToAdd(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Choose student…</option>
                    {availableToAdd.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.grade}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedToAdd}
                    onClick={handleAddStudent}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#185560] px-3 py-2 text-sm font-semibold text-white hover:bg-[#134851] disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'invite' && (
            <div className="flex min-h-full flex-col justify-center space-y-4 py-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <UserPlus className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Student join code</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Students enter this in their portal. You approve requests on Home or
                    Students.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-violet-200 bg-violet-50/40 px-4 py-4 text-center">
                <p className="font-mono text-2xl font-bold tracking-[0.2em] text-violet-900 sm:text-3xl">
                  {classItem.joinCode
                    ? formatJoinCodeForDisplay(classItem.joinCode)
                    : '—'}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!classItem.joinCode) return
                      try {
                        await navigator.clipboard.writeText(classItem.joinCode)
                        setCopied(true)
                        window.setTimeout(() => setCopied(false), 2000)
                      } catch {
                        setCopied(false)
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-50"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? 'Copied!' : 'Copy code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRegenerateJoinCode(classItem.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    New code
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'schedule' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Meeting days, location, and how this class is billed.
              </p>
              <ul className="space-y-2">
                {WEEKDAYS.map((day) => {
                  const entry = weeklySchedule.find((d) => d.day === day)!
                  return (
                    <li
                      key={day}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5 sm:px-4"
                    >
                      <label className="flex min-w-[7rem] cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={entry.enabled}
                          onChange={(e) => toggleDay(day, e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700">{day}</span>
                      </label>
                      <input
                        type="time"
                        value={entry.time}
                        disabled={!entry.enabled}
                        onChange={(e) => setDayTime(day, e.target.value)}
                        className="ml-auto rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </li>
                  )
                })}
              </ul>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Location / link</span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Room 204 or meeting URL"
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>

              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:p-4">
                <p className="text-sm font-medium text-slate-800">Billing</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/40">
                    <input
                      type="radio"
                      name="billing"
                      checked={billingMode === 'prepaid'}
                      onChange={() => setBillingMode('prepaid')}
                    />
                    Prepaid lessons
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/40">
                    <input
                      type="radio"
                      name="billing"
                      checked={billingMode === 'monthly'}
                      onChange={() => setBillingMode('monthly')}
                    />
                    Monthly fee
                  </label>
                </div>
                {billingMode === 'monthly' && (
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                    placeholder="Typical monthly amount (optional)"
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                )}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleDisband}
                  className="w-full rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  Archive this class
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!className.trim()}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
