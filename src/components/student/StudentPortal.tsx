import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import JoinClassModal from './JoinClassModal'
import StudentAssignmentDetail from './StudentAssignmentDetail'
import StudentClassDetail from './StudentClassDetail'
import StudentMobileNav from './StudentMobileNav'
import StudentMobileTopBar from './StudentMobileTopBar'
import StudentSidebar from './StudentSidebar'
import StudentHomeTab from './tabs/StudentHomeTab'
import StudentJoinRequestsTab from './tabs/StudentJoinRequestsTab'
import type {
  Assignment,
  AttendanceLedger,
  Class,
  ClassEnrollment,
  JoinRequest,
  PaymentRecord,
  Student,
  StudentAccount,
  StudentTabId,
} from '../../types'
import { STUDENT_HEADER_TITLES } from '../../types'

const STUDENT_NAV_STORAGE_KEY = 'teacherhub-student-nav'

function readStoredNav(): {
  classKey: string | null
  assignmentId: string | null
} {
  try {
    const raw = sessionStorage.getItem(STUDENT_NAV_STORAGE_KEY)
    if (!raw) return { classKey: null, assignmentId: null }
    const parsed = JSON.parse(raw) as {
      classKey?: string | null
      assignmentId?: string | null
    }
    return {
      classKey: parsed.classKey ?? null,
      assignmentId: parsed.assignmentId ?? null,
    }
  } catch {
    return { classKey: null, assignmentId: null }
  }
}

interface StudentPortalProps {
  account: StudentAccount
  classes: Class[]
  students: Student[]
  joinRequests: JoinRequest[]
  assignments: Assignment[]
  payments: PaymentRecord[]
  attendance: AttendanceLedger
  /** When true, `classes` is already filtered to this student's enrollments (Supabase). */
  enrollmentScopedClasses?: boolean
  classEnrollments?: ClassEnrollment[]
  studentUserId?: string | null
  onSignOut: () => void
  onSubmitJoinRequest: (request: JoinRequest) => void | Promise<void>
}

export default function StudentPortal({
  account,
  classes,
  students,
  joinRequests,
  assignments,
  payments,
  attendance,
  enrollmentScopedClasses = false,
  classEnrollments = [],
  studentUserId,
  onSignOut,
  onSubmitJoinRequest,
}: StudentPortalProps) {
  const [activeTab, setActiveTab] = useState<StudentTabId>('home')
  const [selectedClassKey, setSelectedClassKey] = useState<string | null>(
    () => readStoredNav().classKey,
  )
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(
    () => readStoredNav().assignmentId,
  )
  const [joinOpen, setJoinOpen] = useState(false)

  useEffect(() => {
    sessionStorage.setItem(
      STUDENT_NAV_STORAGE_KEY,
      JSON.stringify({
        classKey: selectedClassKey,
        assignmentId: selectedAssignmentId,
      }),
    )
  }, [selectedClassKey, selectedAssignmentId])

  const linkedStudent = useMemo(
    () =>
      account.linkedStudentId
        ? students.find((s) => s.id === account.linkedStudentId)
        : undefined,
    [account.linkedStudentId, students],
  )

  const myRequests = useMemo(
    () =>
      joinRequests
        .filter((r) => r.studentAccountId === account.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [joinRequests, account.id],
  )

  const pendingRequestCount = useMemo(
    () => myRequests.filter((r) => r.status === 'pending').length,
    [myRequests],
  )

  const enrolledClasses = useMemo(() => {
    if (enrollmentScopedClasses) {
      return classes.filter((c) => c.status === 'active')
    }
    if (!linkedStudent) return []
    return linkedStudent.enrolledClasses
      .map((key) => classes.find((c) => c.classKey === key))
      .filter((c): c is Class => Boolean(c && c.status === 'active'))
  }, [enrollmentScopedClasses, linkedStudent, classes])

  const selectedClass = useMemo(
    () =>
      selectedClassKey
        ? enrolledClasses.find((c) => c.classKey === selectedClassKey)
        : undefined,
    [selectedClassKey, enrolledClasses],
  )

  const selectedAssignment = useMemo(
    () =>
      selectedAssignmentId
        ? assignments.find((a) => a.id === selectedAssignmentId)
        : undefined,
    [selectedAssignmentId, assignments],
  )

  const navClassKey =
    selectedClass?.classKey ??
    selectedAssignment?.classKey ??
    selectedClassKey ??
    null

  const selectedEnrollment = useMemo(() => {
    if (!navClassKey) return undefined
    return classEnrollments.find((e) => e.classKey === navClassKey)
  }, [navClassKey, classEnrollments])

  const openClass = (classKey: string) => {
    setSelectedClassKey(classKey)
    setSelectedAssignmentId(null)
  }

  const closeClass = () => {
    setSelectedClassKey(null)
    setSelectedAssignmentId(null)
  }

  const handleTabChange = (tab: StudentTabId) => {
    setActiveTab(tab)
    setSelectedClassKey(null)
    setSelectedAssignmentId(null)
  }

  const pageTitle = selectedAssignment
    ? selectedAssignment.title
    : selectedClass
      ? selectedClass.name
      : STUDENT_HEADER_TITLES[activeTab]

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <StudentSidebar
        account={account}
        activeTab={activeTab}
        pendingRequestCount={pendingRequestCount}
        onTabChange={handleTabChange}
        onSignOut={onSignOut}
      />

      <StudentMobileTopBar
        account={account}
        activeTab={activeTab}
        classDetailName={
          selectedAssignment
            ? selectedAssignment.title
            : selectedClass?.name ?? null
        }
        onBackFromClass={
          selectedAssignment
            ? () => setSelectedAssignmentId(null)
            : selectedClass
              ? closeClass
              : undefined
        }
        onSignOut={onSignOut}
      />

      <div className="flex min-w-0 flex-1 flex-col pt-14 md:pt-0">
        <header className="hidden border-b border-slate-200 bg-white px-8 py-5 md:block">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {pageTitle}
          </h1>
          {!selectedClass && (
            <p className="mt-0.5 text-sm text-slate-500">
              {activeTab === 'home'
                ? 'Select a class to view schedule and assignments'
                : 'Requests waiting for your teacher to approve'}
            </p>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-8 md:pb-8">
          {selectedAssignment ? (
            <StudentAssignmentDetail
              assignment={selectedAssignment}
              className={
                selectedClass?.name ??
                classes.find((c) => c.classKey === selectedAssignment.classKey)
                  ?.name ??
                'Class'
              }
              classKey={selectedAssignment.classKey}
              teacherId={selectedEnrollment?.teacherId}
              studentUserId={studentUserId}
              studentId={selectedEnrollment?.studentId}
              onBack={() => setSelectedAssignmentId(null)}
            />
          ) : selectedClass ? (
            <StudentClassDetail
              cls={selectedClass}
              student={linkedStudent}
              assignments={assignments}
              payments={payments}
              attendance={attendance}
              onBack={closeClass}
              onOpenAssignment={setSelectedAssignmentId}
            />
          ) : activeTab === 'home' ? (
            <StudentHomeTab
              displayName={account.displayName}
              enrolledClasses={enrolledClasses}
              pendingRequestCount={pendingRequestCount}
              onOpenClass={openClass}
              onJoinClass={() => setJoinOpen(true)}
              onViewRequests={() => setActiveTab('requests')}
            />
          ) : (
            <StudentJoinRequestsTab
              classes={classes}
              requests={myRequests}
              onJoinClass={() => setJoinOpen(true)}
            />
          )}
        </main>
      </div>

      <StudentMobileNav
        activeTab={activeTab}
        pendingRequestCount={pendingRequestCount}
        onTabChange={handleTabChange}
      />

      {!selectedClass && !selectedAssignment && (
        <button
          type="button"
          onClick={() => setJoinOpen(true)}
          className="fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl shadow-violet-600/30 transition-transform hover:bg-violet-700 active:scale-95 md:hidden"
          aria-label="Join a class"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      )}

      <JoinClassModal
        isOpen={joinOpen}
        account={account}
        students={students}
        joinRequests={joinRequests}
        studentUserId={studentUserId}
        onClose={() => setJoinOpen(false)}
        onSubmit={onSubmitJoinRequest}
      />
    </div>
  )
}
