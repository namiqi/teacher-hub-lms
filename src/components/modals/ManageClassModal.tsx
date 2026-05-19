import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { WEEKDAYS } from '../../lib/classSchedule'
import type { Class, ClassDaySchedule, ManageClassUpdate, Student } from '../../types'

type ModalTab = 'roster' | 'schedule'

interface ManageClassModalProps {
  classItem: Class | null
  students: Student[]
  isOpen: boolean
  onClose: () => void
  onSave: (classId: number, update: ManageClassUpdate) => void
  onDisband: (classId: number) => void
}

export default function ManageClassModal({
  classItem,
  students,
  isOpen,
  onClose,
  onSave,
  onDisband,
}: ManageClassModalProps) {
  const [tab, setTab] = useState<ModalTab>('roster')
  const [studentIds, setStudentIds] = useState<number[]>([])
  const [weeklySchedule, setWeeklySchedule] = useState<ClassDaySchedule[]>([])
  const [location, setLocation] = useState('')
  const [addQuery, setAddQuery] = useState('')
  const [selectedToAdd, setSelectedToAdd] = useState('')

  useEffect(() => {
    if (!classItem || !isOpen) return
    setTab('roster')
    setStudentIds([...classItem.studentIds])
    setWeeklySchedule(classItem.weeklySchedule.map((d) => ({ ...d })))
    setLocation(classItem.location)
    setAddQuery('')
    setSelectedToAdd('')
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [classItem, isOpen])

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
          s.grade.toLowerCase().includes(q) ||
          s.parentContact.toLowerCase().includes(q)),
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
    onSave(classItem.id, { studentIds, weeklySchedule, location })
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
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Manage Class: {classItem.name}
            </h2>
            <p className="text-sm text-slate-500">
              {classItem.students} student{classItem.students === 1 ? '' : 's'} enrolled
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

        <div className="flex gap-1 border-b border-slate-100 px-6">
          <button
            type="button"
            onClick={() => setTab('roster')}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === 'roster'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            👥 Roster Management
          </button>
          <button
            type="button"
            onClick={() => setTab('schedule')}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              tab === 'schedule'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📅 Schedule & Timing
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'roster' ? (
            <div className="space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Add Student to Class...
                </span>
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={addQuery}
                    onChange={(e) => setAddQuery(e.target.value)}
                    placeholder="Search roster..."
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <select
                  value={selectedToAdd}
                  onChange={(e) => setSelectedToAdd(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select a student to add</option>
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
                  className="mt-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                >
                  Add to Class
                </button>
              </label>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Enrolled Students ({enrolled.length})
                </p>
                {enrolled.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
                    No students enrolled yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {enrolled.map((student) => (
                      <li
                        key={student.id}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${student.avatarColor}`}
                          >
                            {student.initials}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.grade}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(student.id)}
                          className="text-xs font-medium text-slate-400 hover:text-rose-600"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Select meeting days and times for this class.
              </p>
              <ul className="space-y-2">
                {WEEKDAYS.map((day) => {
                  const entry = weeklySchedule.find((d) => d.day === day)!
                  return (
                    <li
                      key={day}
                      className="flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3"
                    >
                      <label className="flex min-w-[120px] cursor-pointer items-center gap-2">
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
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </li>
                  )
                })}
              </ul>
              <label className="block pt-2">
                <span className="text-sm font-medium text-slate-700">
                  Classroom Location / Online Link
                </span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Room 204 or https://meet..."
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  Save Class Config
                </button>
              </div>
            </div>
          )}
        </div>

        {tab === 'roster' && (
          <div className="flex justify-end border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Save Class Config
            </button>
          </div>
        )}

        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <p className="mb-2 text-xs text-slate-500">Danger zone</p>
          <button
            type="button"
            onClick={handleDisband}
            className="w-full rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-50"
          >
            🚨 Disband Class (Archive Group)
          </button>
        </div>
      </div>
    </div>
  )
}
