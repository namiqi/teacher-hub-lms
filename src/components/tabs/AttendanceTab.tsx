import { ChevronDown, Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { AttendanceCellTransition } from '../../lib/attendanceTokens'
import {
  formatTokenLabel,
  getTokenBalance,
  isClassCritical,
} from '../../lib/studentTokens'
import type {
  AttendanceColumn,
  AttendanceLedger,
  AttendanceStatus,
  Class,
  Student,
} from '../../types'

interface AttendanceTabProps {
  classes: Class[]
  students: Student[]
  ledger: AttendanceLedger
  activeClassKey: string
  onActiveClassChange: (classKey: string) => void
  onLedgerChange: (
    ledger: AttendanceLedger,
    classKey: string,
    transitions: AttendanceCellTransition[],
  ) => void
}

const STATUS_UI: Record<
  AttendanceStatus,
  { dot: string; label: string }
> = {
  present: { dot: 'bg-emerald-500 ring-emerald-200', label: 'Present' },
  excused: { dot: 'bg-amber-400 ring-amber-200', label: 'Excused' },
  absent: { dot: 'bg-rose-500 ring-rose-200', label: 'Absent' },
  unset: { dot: 'bg-slate-200 ring-slate-100', label: 'Unset' },
}

function formatColumnLabel(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00')
  const today = new Date().toISOString().slice(0, 10)
  const short = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (dateKey === today) return `Today (${short})`
  return short
}

export default function AttendanceTab({
  classes,
  students,
  ledger,
  activeClassKey,
  onActiveClassChange,
  onLedgerChange,
}: AttendanceTabProps) {
  const [headerMenuId, setHeaderMenuId] = useState<string | null>(null)
  const [cellMenu, setCellMenu] = useState<{
    studentId: number
    dateKey: string
  } | null>(null)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [editDateValue, setEditDateValue] = useState('')
  const [showAddDate, setShowAddDate] = useState(false)
  const [newDateValue, setNewDateValue] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const classRecords = ledger.recordsByClass[activeClassKey] ?? {}

  const visibleStudents = useMemo(
    () =>
      students.filter(
        (s) =>
          s.status === 'active' && s.enrolledClasses.includes(activeClassKey),
      ),
    [students, activeClassKey],
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setHeaderMenuId(null)
        setCellMenu(null)
        setEditingColumnId(null)
        setShowAddDate(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const commitClassRecords = (
    nextRecords: Record<number, Record<string, AttendanceStatus>>,
    transitions: AttendanceCellTransition[],
  ) => {
    onLedgerChange(
      {
        ...ledger,
        recordsByClass: {
          ...ledger.recordsByClass,
          [activeClassKey]: nextRecords,
        },
      },
      activeClassKey,
      transitions,
    )
  }

  const patchClassRecords = (
    updater: (
      records: Record<number, Record<string, AttendanceStatus>>,
    ) => Record<number, Record<string, AttendanceStatus>>,
    transitions: AttendanceCellTransition[] = [],
  ) => {
    commitClassRecords(updater({ ...classRecords }), transitions)
  }

  const ensureStudentRecord = (studentId: number) => {
    const existing = classRecords[studentId]
    if (existing) return existing
    return Object.fromEntries(
      ledger.columns.map((col) => [col.dateKey, 'unset' as AttendanceStatus]),
    )
  }

  const handleAddColumn = (isoDate: string) => {
    if (!isoDate) return
    if (ledger.columns.some((c) => c.dateKey === isoDate)) {
      setShowAddDate(false)
      return
    }
    const col: AttendanceColumn = {
      id: `col-${isoDate}-${Date.now()}`,
      dateKey: isoDate,
      label: formatColumnLabel(isoDate),
    }
    const nextRecordsByClass = { ...ledger.recordsByClass }
    for (const key of Object.keys(nextRecordsByClass)) {
      const classMap = { ...nextRecordsByClass[key] }
      for (const studentId of Object.keys(classMap)) {
        classMap[Number(studentId)] = {
          ...classMap[Number(studentId)],
          [isoDate]: 'unset',
        }
      }
      nextRecordsByClass[key] = classMap
    }
    onLedgerChange(
      {
        columns: [...ledger.columns, col],
        recordsByClass: nextRecordsByClass,
      },
      activeClassKey,
      [],
    )
    setShowAddDate(false)
    setNewDateValue('')
  }

  const handleChangeDate = (columnId: string, isoDate: string) => {
    if (!isoDate) return
    const col = ledger.columns.find((c) => c.id === columnId)
    if (!col || col.dateKey === isoDate) {
      setEditingColumnId(null)
      return
    }
    const oldKey = col.dateKey
    const nextRecordsByClass = { ...ledger.recordsByClass }
    for (const key of Object.keys(nextRecordsByClass)) {
      const classMap = { ...nextRecordsByClass[key] }
      for (const studentId of Object.keys(classMap)) {
        const row = classMap[Number(studentId)]
        const { [oldKey]: status, ...rest } = row
        classMap[Number(studentId)] = {
          ...rest,
          [isoDate]: status ?? 'unset',
        }
      }
      nextRecordsByClass[key] = classMap
    }
    onLedgerChange(
      {
        columns: ledger.columns.map((c) =>
          c.id === columnId
            ? { ...c, dateKey: isoDate, label: formatColumnLabel(isoDate) }
            : c,
        ),
        recordsByClass: nextRecordsByClass,
      },
      activeClassKey,
      [],
    )
    setEditingColumnId(null)
    setHeaderMenuId(null)
  }

  const handleMarkAllPresent = (dateKey: string) => {
    const transitions: AttendanceCellTransition[] = []
    const next = { ...classRecords }

    for (const student of visibleStudents) {
      const row = {
        ...ensureStudentRecord(student.id),
        ...next[student.id],
      }
      const from = row[dateKey] ?? 'unset'
      if (from !== 'present') {
        transitions.push({ studentId: student.id, from, to: 'present' })
      }
      next[student.id] = { ...row, [dateKey]: 'present' }
    }

    commitClassRecords(next, transitions)
    setHeaderMenuId(null)
  }

  const handleDeleteColumn = (columnId: string) => {
    const col = ledger.columns.find((c) => c.id === columnId)
    if (!col || ledger.columns.length <= 1) return
    const nextRecordsByClass = { ...ledger.recordsByClass }
    for (const key of Object.keys(nextRecordsByClass)) {
      const classMap = { ...nextRecordsByClass[key] }
      for (const studentId of Object.keys(classMap)) {
        const { [col.dateKey]: _, ...rest } = classMap[Number(studentId)]
        classMap[Number(studentId)] = rest
      }
      nextRecordsByClass[key] = classMap
    }
    onLedgerChange(
      {
        columns: ledger.columns.filter((c) => c.id !== columnId),
        recordsByClass: nextRecordsByClass,
      },
      activeClassKey,
      [],
    )
    setHeaderMenuId(null)
  }

  const setCellStatus = (
    studentId: number,
    dateKey: string,
    status: AttendanceStatus,
  ) => {
    const row = {
      ...ensureStudentRecord(studentId),
      ...classRecords[studentId],
    }
    const from = row[dateKey] ?? 'unset'
    if (from === status) {
      setCellMenu(null)
      return
    }

    patchClassRecords(
      (records) => ({
        ...records,
        [studentId]: { ...row, [dateKey]: status },
      }),
      [{ studentId, from, to: status }],
    )
    setCellMenu(null)
  }

  const activeClass = classes.find((c) => c.classKey === activeClassKey)

  return (
    <div ref={containerRef} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Infinite Attendance Ledger</h2>
            <p className="text-sm text-slate-500">
              Blackboard-style grid — tokens and attendance scoped per class
            </p>
          </div>
          <label className="block sm:min-w-[220px]">
            <span className="text-xs font-medium text-slate-500">Active Class</span>
            <select
              value={activeClassKey}
              onChange={(e) => onActiveClassChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {classes.map((c) => (
                <option key={c.classKey} value={c.classKey}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {activeClass && (
          <p className="mt-2 text-xs text-slate-400">
            Showing {visibleStudents.length} enrolled students
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="sticky left-0 z-20 min-w-[180px] border-r border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700">
                Student Name
              </th>
              <th className="sticky left-[180px] z-20 min-w-[120px] border-r border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700">
                Tokens Left
              </th>
              {ledger.columns.map((col) => (
                <th
                  key={col.id}
                  className="relative min-w-[100px] border-r border-slate-100 px-2 py-3 text-center font-medium text-slate-600"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCellMenu(null)
                      setHeaderMenuId(headerMenuId === col.id ? null : col.id)
                      setEditingColumnId(null)
                    }}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-slate-200/80"
                  >
                    {col.label}
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                  {headerMenuId === col.id && (
                    <div className="absolute left-1/2 top-full z-30 mt-1 w-48 -translate-x-1/2 rounded-lg border border-slate-200 bg-white py-1 text-left text-xs shadow-lg">
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                        onClick={() => {
                          setEditingColumnId(col.id)
                          setEditDateValue(col.dateKey)
                        }}
                      >
                        📅 Change Date
                      </button>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                        onClick={() => handleMarkAllPresent(col.dateKey)}
                      >
                        ✓ Mark All Present
                      </button>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDeleteColumn(col.id)}
                      >
                        🗑️ Delete Column
                      </button>
                    </div>
                  )}
                  {editingColumnId === col.id && (
                    <div className="absolute left-1/2 top-full z-30 mt-1 -translate-x-1/2 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                      <input
                        type="date"
                        value={editDateValue}
                        onChange={(e) => setEditDateValue(e.target.value)}
                        className="rounded border border-slate-200 px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        className="mt-1 w-full rounded bg-blue-600 px-2 py-1 text-xs text-white"
                        onClick={() => handleChangeDate(col.id, editDateValue)}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </th>
              ))}
              <th className="min-w-[140px] px-3 py-3">
                {showAddDate ? (
                  <div className="flex flex-col items-center gap-1">
                    <input
                      type="date"
                      value={newDateValue}
                      onChange={(e) => setNewDateValue(e.target.value)}
                      className="rounded border border-slate-200 px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
                      onClick={() => handleAddColumn(newDateValue)}
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddDate(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Column
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleStudents.map((student) => {
              const records = classRecords[student.id] ?? ensureStudentRecord(student.id)
              const tokensLeft = getTokenBalance(student, activeClassKey)
              const critical = isClassCritical(student, activeClassKey)
              const overdrawn = tokensLeft < 0

              return (
                <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-medium text-slate-900">
                    {student.name}
                  </td>
                  <td className="sticky left-[180px] z-10 border-r border-slate-200 bg-white px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        overdrawn
                          ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-300'
                          : critical
                            ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                            : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                      }`}
                      title={formatTokenLabel(student, activeClassKey)}
                    >
                      {overdrawn
                        ? formatTokenLabel(student, activeClassKey)
                        : tokensLeft}
                    </span>
                  </td>
                  {ledger.columns.map((col) => {
                    const status = records[col.dateKey] ?? 'unset'
                    const ui = STATUS_UI[status]
                    const isMenuOpen =
                      cellMenu?.studentId === student.id &&
                      cellMenu?.dateKey === col.dateKey

                    return (
                      <td
                        key={col.id}
                        className="relative border-r border-slate-50 px-2 py-3 text-center"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setHeaderMenuId(null)
                            setCellMenu(
                              isMenuOpen
                                ? null
                                : { studentId: student.id, dateKey: col.dateKey },
                            )
                          }}
                          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ring-2 transition-transform hover:scale-110 ${ui.dot}`}
                          title={ui.label}
                          aria-label={`${student.name} — ${col.label}: ${ui.label}`}
                        />
                        {isMenuOpen && (
                          <div className="absolute left-1/2 top-full z-30 mt-1 w-36 -translate-x-1/2 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-left text-xs shadow-xl">
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-emerald-700 hover:bg-emerald-50"
                              onClick={() =>
                                setCellStatus(student.id, col.dateKey, 'present')
                              }
                            >
                              ✓ Present
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-amber-700 hover:bg-amber-50"
                              onClick={() =>
                                setCellStatus(student.id, col.dateKey, 'excused')
                              }
                            >
                              ⊙ Excused
                            </button>
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-rose-700 hover:bg-rose-50"
                              onClick={() =>
                                setCellStatus(student.id, col.dateKey, 'absent')
                              }
                            >
                              ✕ Absent
                            </button>
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td className="min-w-[140px]" />
                </tr>
              )
            })}
            {visibleStudents.length === 0 && (
              <tr>
                <td
                  colSpan={ledger.columns.length + 3}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  No active students enrolled in this class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
