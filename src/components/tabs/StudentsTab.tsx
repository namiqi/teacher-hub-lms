import { AlertCircle, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import StudentDetailDrawer from '../drawers/StudentDetailDrawer'
import AddStudentModal from '../modals/AddStudentModal'
import TopUpModal from '../modals/TopUpModal'
import {
  classNameForKey,
  getTokenBalance,
  getTokenCapacity,
  hasAnyCriticalBalance,
  isClassCritical,
} from '../../lib/studentTokens'
import type { Class, CreateStudentInput, Student, TopUpPackage } from '../../types'

type RosterView = 'active' | 'archived'

interface StudentsTabProps {
  students: Student[]
  classes: Class[]
  onTopUp: (
    studentId: number,
    classKey: string,
    packageType: TopUpPackage,
    customAmount: number | undefined,
    paidUpfront: boolean,
  ) => void
  onAddStudent: (input: CreateStudentInput) => void
  onUpdateStudent: (student: Student) => void
  onArchiveStudent: (studentId: number) => void
  onReactivateStudent: (studentId: number) => void
  onDeleteStudent: (studentId: number) => void
}

function TokenBalanceCell({
  student,
  classes,
  onTopUpClick,
  showTopUp,
}: {
  student: Student
  classes: Class[]
  onTopUpClick: () => void
  showTopUp: boolean
}) {
  const critical = hasAnyCriticalBalance(student)

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-1.5">
        {student.enrolledClasses.map((classKey) => {
          const balance = getTokenBalance(student, classKey)
          const low = isClassCritical(student, classKey)
          const overdrawn = balance < 0
          return (
            <span
              key={classKey}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                overdrawn
                  ? 'bg-rose-100 text-rose-800 ring-rose-300'
                  : low
                    ? 'bg-rose-50 text-rose-700 ring-rose-200'
                    : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              }`}
              title={classNameForKey(classes, classKey)}
            >
              {low && <AlertCircle className="h-3 w-3" />}
              <span className="max-w-[72px] truncate">
                {classNameForKey(classes, classKey)}
              </span>
              <span className="opacity-80">
                {balance}/{getTokenCapacity(student, classKey)}
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
            + Top Up Pack
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
            Renew Early
          </button>
        ))}
    </div>
  )
}

export default function StudentsTab({
  students,
  classes,
  onTopUp,
  onAddStudent,
  onUpdateStudent,
  onArchiveStudent,
  onReactivateStudent,
  onDeleteStudent,
}: StudentsTabProps) {
  const [query, setQuery] = useState('')
  const [rosterView, setRosterView] = useState<RosterView>('active')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [topUpStudent, setTopUpStudent] = useState<Student | null>(null)
  const [drawerStudent, setDrawerStudent] = useState<Student | null>(null)

  const rosterStudents = useMemo(
    () =>
      students.filter((s) =>
        rosterView === 'active' ? s.status === 'active' : s.status === 'archived',
      ),
    [students, rosterView],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rosterStudents
    return rosterStudents.filter((s) => {
      const classNames = s.enrolledClasses
        .map((key) => classNameForKey(classes, key).toLowerCase())
        .join(' ')
      return (
        s.name.toLowerCase().includes(q) ||
        s.parentContact.toLowerCase().includes(q) ||
        s.grade.toLowerCase().includes(q) ||
        classNames.includes(q)
      )
    })
  }, [query, rosterStudents, classes])

  const isActiveView = rosterView === 'active'

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Student Roster</h2>
              <p className="text-sm text-slate-500">{filtered.length} students</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search students..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-6 py-3 font-medium text-slate-500">Student</th>
                <th className="px-6 py-3 font-medium text-slate-500">Parent Contact</th>
                <th className="px-6 py-3 font-medium text-slate-500">Grade</th>
                <th className="px-6 py-3 font-medium text-slate-500">Classes</th>
                {isActiveView && (
                  <th className="px-6 py-3 font-medium text-slate-500">Token Balance</th>
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
                  <td className="px-6 py-4 text-slate-600">{student.parentContact}</td>
                  <td className="px-6 py-4 text-slate-600">{student.grade}</td>
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
                    colSpan={isActiveView ? 6 : 5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    {isActiveView
                      ? 'No active students match your search.'
                      : 'The archived vault is empty.'}
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
        isOpen={topUpStudent !== null}
        onClose={() => setTopUpStudent(null)}
        onConfirm={(studentId, classKey, packageType, customAmount, paidUpfront) => {
          onTopUp(studentId, classKey, packageType, customAmount, paidUpfront)
          setTopUpStudent(null)
        }}
      />

      <StudentDetailDrawer
        student={drawerStudent}
        classes={classes}
        isOpen={drawerStudent !== null}
        isVaultView={!isActiveView}
        onClose={() => setDrawerStudent(null)}
        onSave={onUpdateStudent}
        onArchive={onArchiveStudent}
        onReactivate={onReactivateStudent}
        onDelete={onDeleteStudent}
      />
    </>
  )
}
