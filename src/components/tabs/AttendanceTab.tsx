import {
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MinusCircle,
  Plus,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { AttendanceCellTransition } from '../../lib/attendanceTokens'
import {
  formatTokenLabel,
  getTokenBalance,
  isClassCritical,
} from '../../lib/studentTokens'
import { isMonthlyClass } from '../../lib/billing'
import EmptyState from '../ui/EmptyState'
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
  onCreateClass: () => void
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

const MOBILE_STATUS_ACTIONS: {
  status: Exclude<AttendanceStatus, 'unset'>
  label: string
  Icon: typeof CheckCircle2
  activeClassName: string
}[] = [
  {
    status: 'present',
    label: 'Present',
    Icon: CheckCircle2,
    activeClassName: 'text-emerald-600',
  },
  {
    status: 'absent',
    label: 'Absent',
    Icon: XCircle,
    activeClassName: 'text-rose-600',
  },
  {
    status: 'excused',
    label: 'Excused',
    Icon: MinusCircle,
    activeClassName: 'text-amber-500',
  },
]

function formatColumnLabel(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00')
  const today = new Date().toISOString().slice(0, 10)
  const short = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (dateKey === today) return `Today (${short})`
  return short
}

/** Local calendar date as YYYY-MM-DD (not UTC midnight drift). */
function localIsoDate(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseIsoLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDaysToIsoDate(iso: string, deltaDays: number): string {
  const dt = parseIsoLocal(iso)
  dt.setDate(dt.getDate() + deltaDays)
  return localIsoDate(dt)
}

/** e.g. "Wednesday, May 20" — attendance cell identity is classKey + this dateKey in recordsByClass. */
function formatLongWeekdayDate(iso: string): string {
  return parseIsoLocal(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default function AttendanceTab({
  classes,
  students,
  ledger,
  activeClassKey,
  onActiveClassChange,
  onLedgerChange,
  onCreateClass,
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
  /** Mobile: which calendar day to show — persisted via recordsByClass[classKey][studentId][dateKey]. */
  const [mobileDateKey, setMobileDateKey] = useState(localIsoDate)
  const mobileDatePickerRef = useRef<HTMLInputElement>(null)

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
    setMobileDateKey(localIsoDate())
  }, [activeClassKey])

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
    // Logical cell: recordsByClass[classKey][studentId][dateKey] === `${classKey}_${dateKey}` per student.
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
  const showLessonTokens = activeClass ? !isMonthlyClass(activeClass) : true

  if (classes.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="No classes yet"
        description="Attendance is tracked per class. Create a class, add students to the roster, then mark who attended each session."
        action={{ label: 'Create a class', onClick: onCreateClass }}
      />
    )
  }

  return (
    <div ref={containerRef} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3 md:px-6 md:py-4">
        <label className="block max-w-xl">
          <span className="text-xs font-medium text-[#185560]">Active Class</span>
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
        {activeClass && (
          <p className="mt-1 text-xs text-slate-400 md:mt-2">
            Showing {visibleStudents.length} enrolled students
          </p>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="sticky left-0 z-20 min-w-[180px] border-r border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700">
                Student Name
              </th>
              {showLessonTokens && (
                <th className="sticky left-[180px] z-20 min-w-[120px] border-r border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700">
                  Lessons left
                </th>
              )}
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
                  {showLessonTokens && (
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
                  )}
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
                  colSpan={ledger.columns.length + (showLessonTokens ? 3 : 2)}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  No active students enrolled in this class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-3">
          <button
            type="button"
            onClick={() => setMobileDateKey((d) => addDaysToIsoDate(d, -1))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-[#185560] transition-colors hover:bg-[rgba(24,85,96,0.06)]"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <div className="relative min-w-0 flex-1 text-center">
            <label className="relative mx-auto block max-w-full cursor-pointer px-2 py-1">
              <span className="pointer-events-none block truncate text-sm font-semibold text-[#185560]">
                {formatLongWeekdayDate(mobileDateKey)}
              </span>
              <input
                ref={mobileDatePickerRef}
                type="date"
                value={mobileDateKey}
                onChange={(e) => {
                  const v = e.target.value
                  if (v) setMobileDateKey(v)
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                aria-label="Choose date"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => setMobileDateKey((d) => addDaysToIsoDate(d, 1))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-[#185560] transition-colors hover:bg-[rgba(24,85,96,0.06)]"
            aria-label="Next day"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>
        {visibleStudents.length > 0 && (
          <div className="border-b border-slate-100 px-4 py-2.5">
            <button
              type="button"
              onClick={() => handleMarkAllPresent(mobileDateKey)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 active:scale-[0.99]"
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
              Mark all present
            </button>
          </div>
        )}
        <ul className="divide-y divide-slate-100">
          {visibleStudents.map((student) => {
            const row = { ...ensureStudentRecord(student.id), ...classRecords[student.id] }
            const status = row[mobileDateKey] ?? 'unset'

            return (
              <li
                key={student.id}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[rgba(24,85,96,0.04)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{student.name}</p>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1 py-1 shadow-sm">
                  {MOBILE_STATUS_ACTIONS.map(({ status: actionStatus, label, Icon, activeClassName }) => {
                    const isActive = status === actionStatus
                    const nextStatus: AttendanceStatus = isActive ? 'unset' : actionStatus
                    return (
                      <button
                        key={actionStatus}
                        type="button"
                        onClick={() => setCellStatus(student.id, mobileDateKey, nextStatus)}
                        className={`rounded-full p-1.5 transition-colors ${
                          isActive ? 'bg-slate-100' : 'hover:bg-slate-50'
                        }`}
                        aria-label={`${label} for ${student.name}`}
                        title={label}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            isActive ? activeClassName : 'text-slate-300'
                          }`}
                          strokeWidth={2.25}
                        />
                      </button>
                    )
                  })}
                </div>
              </li>
            )
          })}
          {visibleStudents.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              No active students enrolled in this class.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
