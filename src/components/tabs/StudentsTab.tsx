import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  Search,
  UserPlus,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import StudentDetailDrawer from '../drawers/StudentDetailDrawer'
import AddStudentModal from '../modals/AddStudentModal'
import TopUpModal from '../modals/TopUpModal'
import {
  currentMonthKey,
  formatBillingLabel,
  isMonthlyClass,
  isMonthlyPaidForCurrentMonth,
  isPrepaidBalanceLow,
} from '../../lib/billing'
import {
  classNameForKey,
  getTokenBalance,
  getTokenCapacity,
} from '../../lib/studentTokens'
import type { TopUpConfirmPayload } from '../modals/TopUpModal'
import EmptyState from '../ui/EmptyState'
import PendingJoinRequestsPanel from '../PendingJoinRequestsPanel'
import type {
  Class,
  CreateStudentInput,
  JoinRequest,
  PaymentRecord,
  Student,
  StudentAccount,
} from '../../types'

type RosterView = 'active' | 'archived'

interface StudentsTabProps {
  students: Student[]
  classes: Class[]
  joinRequests: JoinRequest[]
  studentAccounts: StudentAccount[]
  onApproveJoinRequest: (requestId: string) => void
  onRejectJoinRequest: (requestId: string) => void
  onTopUp: (payload: TopUpConfirmPayload) => void
  payments: PaymentRecord[]
  onAddStudent: (input: CreateStudentInput) => void
  onCreateClass: () => void
  onUpdateStudent: (student: Student) => void
  onArchiveStudent: (studentId: number) => void
  onReactivateStudent: (studentId: number) => void
  onDeleteStudent: (studentId: number) => void
}

interface MobileStudentEditSheetProps {
  student: Student | null
  classes: Class[]
  isOpen: boolean
  name: string
  studentPhone: string
  parentPhone: string
  grade: string
  targetClassKey: string
  tokenDelta: number
  onNameChange: (value: string) => void
  onStudentPhoneChange: (value: string) => void
  onParentPhoneChange: (value: string) => void
  onGradeChange: (value: string) => void
  onTargetClassKeyChange: (value: string) => void
  onTokenDeltaChange: (value: number) => void
  onClose: () => void
  onSave: () => void
}

function MobileStudentEditSheet({
  student,
  classes,
  isOpen,
  name,
  studentPhone,
  parentPhone,
  grade,
  targetClassKey,
  tokenDelta,
  onNameChange,
  onStudentPhoneChange,
  onParentPhoneChange,
  onGradeChange,
  onTargetClassKeyChange,
  onTokenDeltaChange,
  onClose,
  onSave,
}: MobileStudentEditSheetProps) {
  if (!isOpen || !student) return null

  const classOptions = classes.filter((c) =>
    student.enrolledClasses.includes(c.classKey),
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 md:items-center md:p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close editor"
        onClick={onClose}
      />
      <div className="relative w-full rounded-t-2xl border border-slate-200 bg-white px-4 pb-32 pt-3 shadow-2xl md:max-w-md md:rounded-2xl md:px-5 md:pb-28">
        <div className="mb-2 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-3 text-sm font-semibold text-[#185560]">{student.name}</p>

        <div className="space-y-2.5">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Student Phone (Optional)
            </span>
            <input
              type="tel"
              value={studentPhone}
              onChange={(e) => onStudentPhoneChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Parent Phone (Optional)
            </span>
            <input
              type="tel"
              value={parentPhone}
              onChange={(e) => onParentPhoneChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-600">Grade Level</span>
            <input
              type="text"
              value={grade}
              onChange={(e) => onGradeChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-600">Token Balance Adjustment</span>
            <div className="mt-1 flex items-center gap-2">
              <select
                value={targetClassKey}
                onChange={(e) => onTargetClassKeyChange(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {classOptions.map((c) => (
                  <option key={c.classKey} value={c.classKey}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2">
              <button
                type="button"
                onClick={() => onTokenDeltaChange(tokenDelta - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                aria-label="Decrease token adjustment"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-[#185560]">
                {tokenDelta >= 0 ? `+${tokenDelta}` : tokenDelta}
              </span>
              <button
                type="button"
                onClick={() => onTokenDeltaChange(tokenDelta + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                aria-label="Increase token adjustment"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </label>
        </div>

        <div className="absolute inset-x-0 bottom-0 border-t border-slate-100 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:px-5">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onSave}
              className="w-full rounded-lg bg-[#185560] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#134851]"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-slate-200 bg-transparent py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function isEnrollmentAttention(
  student: Student,
  classKey: string,
  classes: Class[],
): boolean {
  const cls = classes.find((c) => c.classKey === classKey)
  if (!cls) return false
  if (isMonthlyClass(cls)) {
    return !isMonthlyPaidForCurrentMonth(student, classKey, currentMonthKey())
  }
  return isPrepaidBalanceLow(student, classKey)
}

function TokenBalanceCell({
  student,
  classes,
  focusClassKey,
  onTopUpClick,
  showTopUp,
}: {
  student: Student
  classes: Class[]
  /** When set, show balance for this class only (matches class filter on roster). */
  focusClassKey?: string
  onTopUpClick: () => void
  showTopUp: boolean
}) {
  const keysToConsider = focusClassKey
    ? student.enrolledClasses.filter((k) => k === focusClassKey)
    : student.enrolledClasses

  const critical = keysToConsider.some((key) =>
    isEnrollmentAttention(student, key, classes),
  )

  if (focusClassKey && student.enrolledClasses.includes(focusClassKey)) {
    const cls = classes.find((c) => c.classKey === focusClassKey)
    const monthly = cls ? isMonthlyClass(cls) : false
    const balance = getTokenBalance(student, focusClassKey)
    const capacity = getTokenCapacity(student, focusClassKey)
    const attention = isEnrollmentAttention(student, focusClassKey, classes)
    const overdrawn = !monthly && balance < 0

    return (
      <div className="flex flex-col items-start gap-2" onClick={(e) => e.stopPropagation()}>
        {monthly ? (
          <p
            className={`text-sm font-semibold ${
              attention ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {formatBillingLabel(student, focusClassKey, classes)}
          </p>
        ) : (
          <>
            <p
              className={`text-base font-semibold tabular-nums ${
                overdrawn
                  ? 'text-rose-800'
                  : attention
                    ? 'text-rose-700'
                    : 'text-[#185560]'
              }`}
            >
              {balance} {balance === 1 ? 'lesson' : 'lessons'} left
            </p>
            <p className="text-xs text-slate-500">
              of {capacity} in {classNameForKey(classes, focusClassKey)}
            </p>
          </>
        )}
        {showTopUp && (
          <button
            type="button"
            onClick={onTopUpClick}
            className={
              critical
                ? 'rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700'
                : 'text-xs font-medium text-[#185560] underline-offset-2 hover:underline'
            }
          >
            {critical ? 'Record payment' : 'Top up / record'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap gap-1.5">
        {student.enrolledClasses.map((classKey) => {
          const cls = classes.find((c) => c.classKey === classKey)
          const monthly = cls ? isMonthlyClass(cls) : false
          const balance = getTokenBalance(student, classKey)
          const attention = isEnrollmentAttention(student, classKey, classes)
          const overdrawn = !monthly && balance < 0
          return (
            <span
              key={classKey}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                attention
                  ? overdrawn
                    ? 'bg-rose-100 text-rose-800 ring-rose-300'
                    : 'bg-rose-50 text-rose-700 ring-rose-200'
                  : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              }`}
              title={formatBillingLabel(student, classKey, classes)}
            >
              {attention && <AlertCircle className="h-3 w-3" />}
              <span className="max-w-[88px] truncate">
                {classNameForKey(classes, classKey)}
              </span>
              <span className="opacity-80">
                {monthly
                  ? isMonthlyPaidForCurrentMonth(student, classKey)
                    ? 'paid'
                    : 'due'
                  : `${balance}/${getTokenCapacity(student, classKey)}`}
              </span>
            </span>
          )
        })}
        {student.enrolledClasses.length === 0 && (
          <span className="text-xs text-slate-400">No enrollments</span>
        )}
      </div>
      {showTopUp &&
        (critical ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onTopUpClick()
            }}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Record payment
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onTopUpClick()
            }}
            className="bg-transparent p-0 text-xs font-medium text-[#185560] underline-offset-2 transition-colors hover:text-[#134851] hover:underline"
          >
            Top up / record
          </button>
        ))}
    </div>
  )
}

export default function StudentsTab({
  students,
  classes,
  joinRequests,
  studentAccounts,
  onApproveJoinRequest,
  onRejectJoinRequest,
  onTopUp,
  payments,
  onAddStudent,
  onCreateClass,
  onUpdateStudent,
  onArchiveStudent,
  onReactivateStudent,
  onDeleteStudent,
}: StudentsTabProps) {
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [rosterView, setRosterView] = useState<RosterView>('active')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [topUpStudent, setTopUpStudent] = useState<Student | null>(null)
  const [drawerStudent, setDrawerStudent] = useState<Student | null>(null)
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [editName, setEditName] = useState('')
  const [editStudentPhone, setEditStudentPhone] = useState('')
  const [editParentPhone, setEditParentPhone] = useState('')
  const [editGrade, setEditGrade] = useState('')
  const [editTargetClassKey, setEditTargetClassKey] = useState('')
  const [editTokenDelta, setEditTokenDelta] = useState(0)

  const rosterStudents = useMemo(
    () =>
      students.filter((s) =>
        rosterView === 'active' ? s.status === 'active' : s.status === 'archived',
      ),
    [students, rosterView],
  )

  const filtered = useMemo(() => {
    let list = rosterStudents
    if (classFilter) {
      list = list.filter((s) => s.enrolledClasses.includes(classFilter))
    }
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((s) => {
      const classNames = s.enrolledClasses
        .map((key) => classNameForKey(classes, key).toLowerCase())
        .join(' ')
      return (
        s.name.toLowerCase().includes(q) ||
        (s.studentPhone ?? '').toLowerCase().includes(q) ||
        (s.parentPhone ?? '').toLowerCase().includes(q) ||
        (s.grade ?? '').toLowerCase().includes(q) ||
        classNames.includes(q)
      )
    })
  }, [query, classFilter, rosterStudents, classes])

  const isActiveView = rosterView === 'active'

  const hasActiveFilters = query.trim() !== '' || classFilter !== ''

  const emptyResultsMessage = useMemo(() => {
    if (!isActiveView) {
      return hasActiveFilters
        ? 'No archived students match your filters.'
        : 'The archived vault is empty.'
    }
    if (classFilter && query.trim()) {
      return `No students in ${classNameForKey(classes, classFilter)} match “${query.trim()}”.`
    }
    if (classFilter) {
      return `No students enrolled in ${classNameForKey(classes, classFilter)}.`
    }
    if (query.trim()) {
      return 'No students match your search.'
    }
    return 'No active students on your roster.'
  }, [isActiveView, classFilter, query, classes, hasActiveFilters])

  const balanceLabelForStudent = (student: Student): string => {
    if (student.enrolledClasses.length === 0) return 'No class enrollments'
    if (classFilter && student.enrolledClasses.includes(classFilter)) {
      return formatBillingLabel(student, classFilter, classes)
    }
    return student.enrolledClasses
      .map((classKey) => {
        const className = classNameForKey(classes, classKey)
        return `${className}: ${formatBillingLabel(student, classKey, classes)}`
      })
      .join(' · ')
  }

  const openMobileEditor = (student: Student) => {
    setEditStudent(student)
    setEditName(student.name)
    setEditStudentPhone(student.studentPhone ?? '')
    setEditParentPhone(student.parentPhone ?? '')
    setEditGrade(student.grade ?? '')
    setEditTargetClassKey(student.enrolledClasses[0] ?? '')
    setEditTokenDelta(0)
  }

  const closeMobileEditor = () => {
    setEditStudent(null)
    setEditName('')
    setEditStudentPhone('')
    setEditParentPhone('')
    setEditGrade('')
    setEditTargetClassKey('')
    setEditTokenDelta(0)
  }

  const activeStudentCount = useMemo(
    () => students.filter((s) => s.status === 'active').length,
    [students],
  )

  const saveMobileEditor = () => {
    if (!editStudent) return
    const targetClassKey =
      editTargetClassKey || editStudent.enrolledClasses[0] || ''
    const nextTokensByClass = { ...editStudent.tokensByClass }
    if (targetClassKey) {
      const current = nextTokensByClass[targetClassKey] ?? 0
      nextTokensByClass[targetClassKey] = current + editTokenDelta
    }

    onUpdateStudent({
      ...editStudent,
      name: editName.trim() || editStudent.name,
      studentPhone: editStudentPhone.trim(),
      parentPhone: editParentPhone.trim(),
      grade: editGrade.trim(),
      tokensByClass: nextTokensByClass,
    })
    closeMobileEditor()
  }

  if (
    isActiveView &&
    activeStudentCount === 0 &&
    query.trim() === '' &&
    classes.length === 0
  ) {
    return (
      <>
        <EmptyState
          icon={UserPlus}
          title="Create a class first"
          description="Students are added to a class roster. Set up at least one class, then come back here to add names, contacts, and lesson balances."
          action={{ label: 'Create a class', onClick: onCreateClass }}
        />
      </>
    )
  }

  if (isActiveView && activeStudentCount === 0 && query.trim() === '') {
    return (
      <>
        <EmptyState
          icon={UserPlus}
          title="No students yet"
          description="Add everyone you teach — phone numbers for you and parents, plus how many prepaid lessons they have."
          action={{ label: 'Add your first student', onClick: () => setIsAddOpen(true) }}
        />
        <AddStudentModal
          isOpen={isAddOpen}
          classes={classes}
          onClose={() => setIsAddOpen(false)}
          onAdd={(input) => {
            onAddStudent(input)
            setIsAddOpen(false)
          }}
        />
      </>
    )
  }

  return (
    <>
      <PendingJoinRequestsPanel
        classes={classes}
        joinRequests={joinRequests}
        studentAccounts={studentAccounts}
        onApprove={onApproveJoinRequest}
        onReject={onRejectJoinRequest}
      />
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 md:gap-4 md:px-6 md:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 md:text-base">
                <span className="md:hidden">Students</span>
                <span className="hidden md:inline">Student Roster</span>
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {filtered.length} {filtered.length === 1 ? 'student' : 'students'}
                {classFilter && isActiveView
                  ? ` · ${classNameForKey(classes, classFilter)}`
                  : ''}
              </p>
            </div>
            <div className="hidden flex-wrap items-center gap-3 md:flex">
              <select
                value={rosterView}
                onChange={(e) => {
                  setRosterView(e.target.value as RosterView)
                  setDrawerStudent(null)
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="active">Active Students</option>
                <option value="archived">Archived Vault</option>
              </select>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Filter by class"
              >
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.classKey} value={c.classKey}>
                    {c.name}
                  </option>
                ))}
              </select>
              {isActiveView && (
                <button
                  type="button"
                  onClick={() => setIsAddOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  Add Student
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 md:hidden">
            <div
              className="flex gap-2"
              role="tablist"
              aria-label="Roster view"
            >
              {(
                [
                  { id: 'active' as const, label: 'Active' },
                  { id: 'archived' as const, label: 'Archived' },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={rosterView === id}
                  onClick={() => {
                    setRosterView(id)
                    setDrawerStudent(null)
                    setExpandedStudentId(null)
                  }}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    rosterView === id
                      ? 'bg-[#185560] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {isActiveView && classes.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setClassFilter('')}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    classFilter === ''
                      ? 'bg-[#185560] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All classes
                </button>
                {classes.map((c) => (
                  <button
                    key={c.classKey}
                    type="button"
                    onClick={() => setClassFilter(c.classKey)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      classFilter === c.classKey
                        ? 'bg-[#185560] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-md sm:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search name, phone, grade, class…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setClassFilter('')
                }}
                className="shrink-0 text-sm font-medium text-[#185560] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="block md:hidden">
          <ul className="divide-y divide-slate-100">
            {filtered.map((student) => {
              const isExpanded = expandedStudentId === student.id
              return (
                <li key={student.id} className="bg-white">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedStudentId((prev) =>
                        prev === student.id ? null : student.id,
                      )
                    }
                    className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-[rgba(24,85,96,0.04)]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${student.avatarColor}`}
                      >
                        {student.initials}
                      </div>
                      <span className="truncate font-medium text-slate-900">
                        {student.name}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="space-y-2 border-t border-slate-100 px-4 pb-4 pt-3 text-sm">
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-800">Student Phone:</span>{' '}
                        {student.studentPhone || '—'}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-800">Parent Phone:</span>{' '}
                        {student.parentPhone || '—'}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-800">Grade / Status:</span>{' '}
                        {student.grade || '—'}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-800">
                          {classFilter
                            ? `Balance (${classNameForKey(classes, classFilter)}):`
                            : 'Balance by class:'}
                        </span>{' '}
                        {balanceLabelForStudent(student)}
                      </p>
                      <button
                        type="button"
                        onClick={() => openMobileEditor(student)}
                        className="mt-2 w-full rounded-lg bg-[rgba(24,85,96,0.08)] px-3 py-2.5 text-sm font-semibold text-[#185560] transition-colors hover:bg-[rgba(24,85,96,0.14)]"
                      >
                        Manage Student
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
            {filtered.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-slate-500">
                {emptyResultsMessage}
              </li>
            )}
          </ul>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-6 py-3 font-medium text-slate-500">Student</th>
                <th className="px-6 py-3 font-medium text-slate-500">Student Phone</th>
                <th className="px-6 py-3 font-medium text-slate-500">Parent Phone</th>
                <th className="px-6 py-3 font-medium text-slate-500">Grade</th>
                <th className="px-6 py-3 font-medium text-slate-500">Classes</th>
                {isActiveView && (
                  <th className="px-6 py-3 font-medium text-slate-500">
                    {classFilter
                      ? `Lessons · ${classNameForKey(classes, classFilter)}`
                      : 'Balance (per class)'}
                  </th>
                )}
                <th className="px-6 py-3 font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((student) => (
                <tr
                  key={student.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDrawerStudent(student)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setDrawerStudent(student)
                    }
                  }}
                  className="cursor-pointer transition-colors duration-150 hover:bg-[rgba(24,85,96,0.04)] focus-visible:bg-[rgba(24,85,96,0.06)] focus-visible:outline-none"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${student.avatarColor}`}
                      >
                        {student.initials}
                      </div>
                      <span className="font-medium text-slate-900">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{student.studentPhone || '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{student.parentPhone || '—'}</td>
                  <td className="px-6 py-4 text-slate-600">{student.grade || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {student.enrolledClasses.map((classKey) => (
                        <span
                          key={classKey}
                          className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                        >
                          {classNameForKey(classes, classKey)}
                        </span>
                      ))}
                      {student.enrolledClasses.length === 0 && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                  {isActiveView && (
                    <td className="px-6 py-4">
                      <TokenBalanceCell
                        student={student}
                        classes={classes}
                        focusClassKey={classFilter || undefined}
                        showTopUp
                        onTopUpClick={() => setTopUpStudent(student)}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        student.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                          : 'bg-slate-100 text-slate-600 ring-slate-500/20'
                      }`}
                    >
                      {student.status === 'active' ? 'Active' : 'Archived'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={isActiveView ? 7 : 6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    {emptyResultsMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddStudentModal
        isOpen={isAddOpen}
        classes={classes}
        onClose={() => setIsAddOpen(false)}
        onAdd={(input) => {
          onAddStudent(input)
          setIsAddOpen(false)
        }}
      />

      <TopUpModal
        student={topUpStudent}
        classes={classes}
        preferredClassKey={classFilter || undefined}
        isOpen={topUpStudent !== null}
        onClose={() => setTopUpStudent(null)}
        onConfirm={(payload) => {
          onTopUp(payload)
          setTopUpStudent(null)
        }}
      />

      <StudentDetailDrawer
        student={drawerStudent}
        classes={classes}
        payments={payments}
        isOpen={drawerStudent !== null}
        isVaultView={!isActiveView}
        onClose={() => setDrawerStudent(null)}
        onSave={onUpdateStudent}
        onArchive={onArchiveStudent}
        onReactivate={onReactivateStudent}
        onDelete={onDeleteStudent}
      />

      <MobileStudentEditSheet
        student={editStudent}
        classes={classes}
        isOpen={editStudent !== null}
        name={editName}
        studentPhone={editStudentPhone}
        parentPhone={editParentPhone}
        grade={editGrade}
        targetClassKey={editTargetClassKey}
        tokenDelta={editTokenDelta}
        onNameChange={setEditName}
        onStudentPhoneChange={setEditStudentPhone}
        onParentPhoneChange={setEditParentPhone}
        onGradeChange={setEditGrade}
        onTargetClassKeyChange={setEditTargetClassKey}
        onTokenDeltaChange={setEditTokenDelta}
        onClose={closeMobileEditor}
        onSave={saveMobileEditor}
      />

      {isActiveView && (
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#185560] text-white shadow-xl shadow-[#185560]/30 transition-transform hover:bg-[#134851] active:scale-95 md:hidden"
          aria-label="Add student"
        >
          <UserPlus className="h-6 w-6" strokeWidth={2.3} />
        </button>
      )}
    </>
  )
}
