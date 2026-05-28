import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  ClipboardList,
  MapPin,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  formatAssignmentDue,
  formatPostDate,
  isAnnouncement,
  postKindLabel,
  postKindStyles,
  postsForClass,
} from '../../lib/assignments'
import {
  formatBillingLabel,
  formatMonthKey,
  getPaidThroughMonth,
  isMonthlyClass,
  isPrepaidClass,
} from '../../lib/billing'
import {
  formatStudentPaymentLine,
  paymentsForStudentClass,
} from '../../lib/payments'
import { getTokenBalance, getTokenCapacity } from '../../lib/studentTokens'
import type {
  Assignment,
  AttendanceLedger,
  Class,
  PaymentRecord,
  Student,
} from '../../types'

type StudentClassTabId = 'assignments' | 'class-info'

interface StudentClassDetailProps {
  cls: Class
  student: Student | undefined
  assignments: Assignment[]
  payments: PaymentRecord[]
  attendance: AttendanceLedger
  onBack: () => void
  onOpenAssignment: (assignmentId: string) => void
}

function recentAttendanceSummary(
  ledger: AttendanceLedger,
  classKey: string,
  studentId: number,
): { present: number; absent: number; excused: number } {
  const records = ledger.recordsByClass[classKey]?.[studentId] ?? {}
  let present = 0
  let absent = 0
  let excused = 0
  for (const status of Object.values(records)) {
    if (status === 'present') present++
    else if (status === 'absent') absent++
    else if (status === 'excused') excused++
  }
  return { present, absent, excused }
}

export default function StudentClassDetail({
  cls,
  student,
  assignments,
  payments,
  attendance,
  onBack,
  onOpenAssignment,
}: StudentClassDetailProps) {
  const [tab, setTab] = useState<StudentClassTabId>('assignments')

  useEffect(() => {
    setTab('assignments')
  }, [cls.classKey])

  const classPosts = useMemo(
    () => postsForClass(assignments, cls.classKey, { studentView: true }),
    [assignments, cls.classKey],
  )

  const attendanceStats = useMemo(() => {
    if (!student) return null
    return recentAttendanceSummary(attendance, cls.classKey, student.id)
  }, [attendance, cls.classKey, student])

  const classPayments = useMemo(() => {
    if (!student) return []
    return paymentsForStudentClass(payments, student.id, cls.classKey)
  }, [payments, student, cls.classKey])

  const showLocation =
    cls.location && !cls.schedule.toLowerCase().includes(cls.location.toLowerCase())

  return (
    <div className="space-y-3 sm:space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="hidden items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-violet-700 md:inline-flex"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to classes
      </button>

      <div
        className={`overflow-hidden rounded-xl bg-gradient-to-r sm:rounded-2xl ${cls.color} shadow-md sm:shadow-lg`}
      >
        <div className="flex items-start gap-3 px-3 py-3 text-white sm:px-5 sm:py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm sm:h-11 sm:w-11 sm:rounded-xl">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">{cls.name}</h1>
            <p className="mt-0.5 line-clamp-2 text-xs text-white/85 sm:text-sm">
              {cls.schedule || 'Schedule not set'}
            </p>
            {showLocation && (
              <p className="mt-1 flex items-center gap-1 text-xs text-white/75">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {cls.location}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="-mx-1 flex gap-0.5 overflow-x-auto border-b border-slate-200 px-1">
        <button
          type="button"
          onClick={() => setTab('assignments')}
          className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
            tab === 'assignments'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Posts
          {classPosts.length > 0 && (
            <span className="ml-1.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-800">
              {classPosts.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('class-info')}
          className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
            tab === 'class-info'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Class info
        </button>
      </div>

      {tab === 'assignments' ? (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {classPosts.length === 0 ? (
            <div className="px-4 py-10 text-center sm:px-5">
              <ClipboardList
                className="mx-auto h-9 w-9 text-slate-300"
                strokeWidth={1.5}
              />
              <p className="mt-3 font-medium text-slate-800">Nothing posted yet</p>
              <p className="mt-2 text-sm text-slate-500">
                Assignments and announcements from your teacher will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {classPosts.map((post) => {
                const kind = post.kind ?? 'assignment'
                return (
                  <li key={post.id}>
                    <button
                      type="button"
                      onClick={() => onOpenAssignment(post.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-violet-50/50 sm:px-5 sm:py-4"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-slate-900">{post.title}</p>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${postKindStyles(kind)}`}
                          >
                            {postKindLabel(kind)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {isAnnouncement(post)
                            ? `Posted ${formatPostDate(post.createdAt)}`
                            : `Due ${formatAssignmentDue(post.dueAt)}`}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {student && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="font-semibold text-slate-900">
                {isMonthlyClass(cls) ? 'Monthly plan' : 'Lesson balance'}
              </h2>
              {isPrepaidClass(cls) ? (
                <div className="mt-3">
                  <p className="text-3xl font-semibold text-violet-700">
                    {getTokenBalance(student, cls.classKey)}
                    <span className="text-lg font-normal text-slate-500">
                      {' '}
                      / {getTokenCapacity(student, cls.classKey)} lessons left
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Lessons are used when your teacher marks you present for this
                    class.
                  </p>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-sm text-slate-600">
                    {formatBillingLabel(student, cls.classKey, [cls])}
                  </p>
                  {getPaidThroughMonth(student, cls.classKey) && (
                    <p className="mt-1 text-xs text-slate-500">
                      Last recorded:{' '}
                      {formatMonthKey(getPaidThroughMonth(student, cls.classKey)!)}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {attendanceStats && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="font-semibold text-slate-900">Attendance</h2>
              <p className="mt-1 text-xs text-slate-500">Recorded this term</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <span className="text-emerald-700">
                  <span className="font-semibold">{attendanceStats.present}</span>{' '}
                  present
                </span>
                <span className="text-rose-700">
                  <span className="font-semibold">{attendanceStats.absent}</span>{' '}
                  absent
                </span>
                <span className="text-slate-600">
                  <span className="font-semibold">{attendanceStats.excused}</span>{' '}
                  excused
                </span>
              </div>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
              <h2 className="font-semibold text-slate-900">Payment history</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Top-ups and fees your teacher logged for this class
              </p>
            </div>
            {classPayments.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500 sm:px-5">
                No payments recorded yet for this class.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {classPayments.map((record) => (
                  <li
                    key={record.id}
                    className="px-4 py-3 text-sm text-slate-700 sm:px-5"
                  >
                    {formatStudentPaymentLine(record)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
