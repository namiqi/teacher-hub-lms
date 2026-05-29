import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import LandingPage from './components/auth/LandingPage'
import LoginView from './components/auth/LoginView'
import SignupView from './components/auth/SignupView'
import StudentLoginView from './components/auth/StudentLoginView'
import StudentSignupView from './components/auth/StudentSignupView'
import StudentPortal from './components/student/StudentPortal'
import Header from './components/Header'
import CreateClassModal from './components/modals/CreateClassModal'
import ManageClassModal from './components/modals/ManageClassModal'
import { generateUniqueClassKey } from './lib/classKeys'
import { generateUniqueClassJoinCode } from './lib/joinCodes'
import {
  approveJoinRequest,
  pendingRequestsForTeacher,
} from './lib/joinRequests'
import { createDefaultWeeklySchedule, formatClassSchedule } from './lib/classSchedule'
import {
  getTokenDeltaForAttendanceChange,
  type AttendanceCellTransition,
} from './lib/attendanceTokens'
import {
  adjustTokenBalance,
  applyTopUp,
  ensureTokenMapsForEnrollment,
  syncClassRosters,
} from './lib/studentTokens'
import MobileBottomNav from './components/MobileBottomNav'
import MobileTopBar from './components/MobileTopBar'
import Sidebar from './components/Sidebar'
import AttendanceTab from './components/tabs/AttendanceTab'
import MyClassesTab from './components/tabs/MyClassesTab'
import TeacherClassWorkspace from './components/teacher/TeacherClassWorkspace'
import {
  buildAnnouncementFromInput,
  buildAssignmentFromInput,
} from './lib/assignments'
import OverviewTab from './components/tabs/OverviewTab'
import SettingsTab from './components/tabs/SettingsTab'
import StudentsTab from './components/tabs/StudentsTab'
import TeacherAssignmentsTab from './components/tabs/TeacherAssignmentsTab'
import { CLASS_GRADIENTS } from './data/classes'
import { STUDENT_AVATAR_COLORS } from './data/students'
import { NEW_STUDENT_TOKEN_CAPACITY } from './lib/classKeys'
import type { TopUpConfirmPayload } from './components/modals/TopUpModal'
import { applyMonthlyPayment, classUsesTokens } from './lib/billing'
import { logger } from './lib/logger'
import { createPaymentId, packageLessons } from './lib/payments'
import {
  buildAppBackup,
  clearSession,
  getInitials,
  loadAssignments,
  loadAttendance,
  loadClasses,
  loadPayments,
  loadJoinRequests,
  loadSessionRole,
  loadStudentAccount,
  loadStudentAccounts,
  loadStudents,
  loadUser,
  parseAppBackup,
  persistAppBackup,
  findStudentAccountByEmail,
  registerStudentAccount,
  saveAttendance,
  saveClasses,
  saveDevBypassUser,
  saveAssignments,
  saveJoinRequests,
  savePayments,
  saveStudentAccounts,
  saveStudentSession,
  saveStudents,
  saveTeacherSession,
  saveUser,
} from './lib/storage'
import { studentEmailFromName } from './lib/utils'
import { initializeEmptyWorkspace, seedDemoWorkspace } from './lib/workspace'
import type { User as SupabaseAuthUser } from '@supabase/supabase-js'
import { routeAuthenticatedUser } from './lib/supabase/appAuth'
import {
  ensureActiveSession,
  ensureProfileRole,
  getSession,
  onAuthStateChange,
  signInWithEmail,
  signInWithGoogle,
  signOutSupabase,
  signUpWithEmail,
} from './lib/supabase/auth'
import { isSupabaseConfigured } from './lib/supabase/client'
import { flushTeacherWorkspaceSave, scheduleTeacherWorkspaceSave } from './lib/supabase/persist'
import { resolveStudentSession } from './lib/supabase/sessionBridge'
import { insertJoinRequestRemote } from './lib/supabase/studentData'
import {
  ensureClassJoinCodesSynced,
  fetchTeacherWorkspace,
  insertStudentEnrollment,
  saveTeacherWorkspace,
  type TeacherCloudState,
  type TeacherWorkspaceData,
  updateJoinRequestStatus,
  updateStudentProfileLink,
} from './lib/supabase/teacherData'
import type {
  AppView,
  AttendanceLedger,
  AttendanceStatus,
  Class,
  CreateClassInput,
  CreateStudentInput,
  ManageClassUpdate,
  AnnouncementFormInput,
  Assignment,
  AssignmentFormInput,
  ClassEnrollment,
  JoinRequest,
  PaymentRecord,
  Student,
  StudentAccount,
  TabId,
  User,
} from './types'

function getInitialView(): AppView {
  if (isSupabaseConfigured()) return 'landing'
  const role = loadSessionRole()
  if (role === 'student') return 'student-portal'
  if (role === 'teacher') return 'dashboard'
  return 'landing'
}

const DEFAULT_USER: User = {
  name: 'Sarah Johnson',
  email: 'sarah.johnson@school.edu',
  initials: 'SJ',
  role: 'Teacher',
  isAuthenticated: true,
}

function App() {
  const useCloud = isSupabaseConfigured()
  const [authReady, setAuthReady] = useState(() => !useCloud)
  const [teacherUserId, setTeacherUserId] = useState<string | null>(null)
  const [studentUserId, setStudentUserId] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<AppView>(getInitialView)
  const [user, setUser] = useState<User>(() => loadUser() ?? DEFAULT_USER)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [manageClassId, setManageClassId] = useState<number | null>(null)
  const [teacherClassId, setTeacherClassId] = useState<number | null>(null)
  const [classes, setClasses] = useState<Class[]>(loadClasses)
  const [students, setStudents] = useState<Student[]>(loadStudents)
  const [attendance, setAttendance] = useState<AttendanceLedger>(() =>
    loadAttendance(loadStudents(loadClasses()), loadClasses()),
  )
  const [attendanceClassKey, setAttendanceClassKey] = useState(() => {
    const loaded = loadClasses()
    return (
      loaded.find((c) => c.status !== 'archived')?.classKey ??
      loaded[0]?.classKey ??
      'math_201'
    )
  })
  const [payments, setPayments] = useState<PaymentRecord[]>(loadPayments)
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>(loadJoinRequests)
  const [studentAccounts, setStudentAccounts] = useState<StudentAccount[]>(
    loadStudentAccounts,
  )
  const [studentAccount, setStudentAccount] = useState<StudentAccount | null>(
    () => (loadSessionRole() === 'student' ? loadStudentAccount() : null),
  )
  const [assignments, setAssignments] = useState<Assignment[]>(() =>
    loadAssignments(loadClasses()),
  )
  const [classEnrollments, setClassEnrollments] = useState<ClassEnrollment[]>([])

  const pendingJoinCount = useMemo(
    () => pendingRequestsForTeacher(joinRequests, classes).length,
    [joinRequests, classes],
  )

  const activeClasses = useMemo(
    () => classes.filter((c) => c.status !== 'archived'),
    [classes],
  )

  const shouldPersistClasses = useRef(false)
  const shouldPersistStudents = useRef(false)
  const shouldPersistAttendance = useRef(false)
  const shouldPersistPayments = useRef(false)
  const shouldPersistJoinRequests = useRef(false)
  const shouldPersistAssignments = useRef(false)

  useEffect(() => {
    if (!shouldPersistClasses.current) return
    saveClasses(classes)
  }, [classes])

  useEffect(() => {
    if (!shouldPersistStudents.current) return
    saveStudents(students)
  }, [students])

  useEffect(() => {
    if (!shouldPersistAttendance.current) return
    saveAttendance(attendance)
  }, [attendance])

  useEffect(() => {
    if (!shouldPersistPayments.current) return
    savePayments(payments)
  }, [payments])

  useEffect(() => {
    if (!shouldPersistJoinRequests.current) return
    saveJoinRequests(joinRequests)
  }, [joinRequests])

  useEffect(() => {
    if (!shouldPersistAssignments.current) return
    saveAssignments(assignments)
  }, [assignments])

  const applyTeacherCloud = useCallback(
    (teacherId: string, state: TeacherCloudState, nextUser: User) => {
      setTeacherUserId(teacherId)
      setStudentUserId(null)
      setUser(nextUser)
      setClasses(state.classes)
      setStudents(state.students)
      setAttendance(state.attendance)
      setPayments(state.payments)
      setAssignments(state.assignments)
      setJoinRequests(state.joinRequests)
      setAttendanceClassKey(
        state.classes.find((c) => c.status === 'active')?.classKey ??
          state.classes[0]?.classKey ??
          '',
      )
      shouldPersistClasses.current = false
      shouldPersistStudents.current = false
      shouldPersistAttendance.current = false
      shouldPersistPayments.current = false
      shouldPersistJoinRequests.current = false
      shouldPersistAssignments.current = false

      void ensureClassJoinCodesSynced(teacherId, state.classes).catch((err) => {
        console.error('[Teacher Hub] Failed to sync class join codes', err)
      })
    },
    [],
  )

  const applyStudentCloud = useCallback(
    (
      studentId: string,
      account: StudentAccount,
      portal: Awaited<ReturnType<typeof resolveStudentSession>>['portal'],
    ) => {
      setStudentUserId(studentId)
      setTeacherUserId(null)
      setStudentAccount(account)
      saveStudentSession(account)
      setClasses(portal.classes)
      setStudents(portal.students)
      setJoinRequests(portal.joinRequests)
      setClassEnrollments(portal.enrollments)
      setAssignments(portal.assignments)
      setPayments(portal.payments)
      setAttendance(portal.attendance)
    },
    [],
  )

  const routeSession = useCallback(async (authUser?: SupabaseAuthUser) => {
    let user = authUser
    if (!user) {
      const session = await getSession()
      user = session?.user ?? undefined
    }
    if (!user) {
      throw new Error('No active session. Try signing in.')
    }
    const routed = await routeAuthenticatedUser(user)
    if (routed.role === 'teacher') {
      const { user, teacherId, state } = routed.payload
      applyTeacherCloud(teacherId, state, user)
      saveTeacherSession()
      setCurrentView('dashboard')
      return
    }
    const { account, studentId, portal } = routed.payload
    applyStudentCloud(studentId, account, portal)
    setCurrentView('student-portal')
  }, [applyTeacherCloud, applyStudentCloud])

  useEffect(() => {
    if (!useCloud) return

    let cancelled = false

    async function init() {
      try {
        await routeSession()
      } catch (err) {
        console.error('[Teacher Hub] Auth bootstrap failed', err)
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    }

    void init()

    const unsub = onAuthStateChange((session, event) => {
      if (!session?.user) {
        if (event === 'SIGNED_OUT') {
          setTeacherUserId(null)
          setStudentUserId(null)
        }
        return
      }
      // Token refresh runs when the window regains focus (e.g. after the file picker).
      // Re-routing the whole app here kicked students back to the home screen.
      if (event === 'TOKEN_REFRESHED') return
      void routeSession().catch((err) => {
        console.error('[Teacher Hub] Auth state sync failed', err)
      })
    })

    return () => {
      cancelled = true
      unsub()
    }
  }, [useCloud, routeSession])

  useEffect(() => {
    if (!useCloud || !teacherUserId) return
    const shouldSave =
      shouldPersistClasses.current ||
      shouldPersistStudents.current ||
      shouldPersistAttendance.current ||
      shouldPersistPayments.current ||
      shouldPersistAssignments.current
    if (!shouldSave) return

    const payload: TeacherWorkspaceData = {
      classes,
      students,
      attendance,
      payments,
      assignments,
    }
    scheduleTeacherWorkspaceSave(teacherUserId, payload)
  }, [
    useCloud,
    teacherUserId,
    classes,
    students,
    attendance,
    payments,
    assignments,
  ])

  useEffect(() => {
    if (useCloud) return
    if (
      currentView === 'student-portal' ||
      currentView === 'student-login' ||
      currentView === 'student-signup'
    ) {
      setClasses(loadClasses())
    }
  }, [currentView, useCloud])

  const refreshJoinRequests = useCallback(async () => {
    if (useCloud && teacherUserId) {
      try {
        const state = await fetchTeacherWorkspace(teacherUserId)
        setJoinRequests(state.joinRequests)
      } catch (err) {
        console.error('[Teacher Hub] Failed to refresh join requests', err)
      }
      return
    }
    setJoinRequests(loadJoinRequests())
  }, [useCloud, teacherUserId])

  const refreshStudentPortal = useCallback(async () => {
    if (!useCloud || !studentUserId) return
    try {
      const { account, portal } = await resolveStudentSession(studentUserId)
      applyStudentCloud(studentUserId, account, portal)
    } catch (err) {
      console.error('[Teacher Hub] Failed to refresh student portal', err)
    }
  }, [useCloud, studentUserId, applyStudentCloud])

  const refreshAssignments = useCallback(() => {
    setAssignments(loadAssignments(classes))
  }, [classes])

  useEffect(() => {
    if (currentView !== 'dashboard') return
    refreshJoinRequests()
    refreshAssignments()
  }, [currentView, activeTab, refreshJoinRequests, refreshAssignments])

  useEffect(() => {
    if (currentView !== 'dashboard' && currentView !== 'student-portal') return
    const onSync = () => {
      void refreshJoinRequests()
      if (currentView === 'dashboard') refreshAssignments()
      // Do not refresh the student portal on focus — closing the file picker
      // triggers focus and was resetting class/assignment navigation.
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') onSync()
    }
    window.addEventListener('focus', onSync)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onSync)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [currentView, refreshJoinRequests, refreshAssignments, refreshStudentPortal])

  const markPersistStudents = () => {
    shouldPersistStudents.current = true
  }

  const markPersistAttendance = () => {
    shouldPersistAttendance.current = true
  }

  const enterDashboard = useCallback((nextUser?: User) => {
    if (nextUser) {
      setUser(nextUser)
      saveUser(nextUser)
    }
    saveTeacherSession()
    setCurrentView('dashboard')
  }, [])

  const handleDevBypass = useCallback(() => {
    const devUser = saveDevBypassUser()
    const demo = seedDemoWorkspace()
    setClasses(demo.classes)
    setStudents(demo.students)
    setAttendance(demo.attendance)
    setPayments([])
    setJoinRequests([])
    setStudentAccounts(loadStudentAccounts())
    setAssignments(loadAssignments(demo.classes))
    setAttendanceClassKey(
      demo.classes.find((c) => c.status === 'active')?.classKey ?? '',
    )
    shouldPersistClasses.current = false
    shouldPersistPayments.current = false
    shouldPersistStudents.current = false
    shouldPersistAttendance.current = false
    shouldPersistJoinRequests.current = false
    shouldPersistAssignments.current = false
    setUser(devUser)
    setCurrentView('dashboard')
  }, [])

  const handleSignOut = useCallback(async () => {
    if (useCloud) {
      await flushTeacherWorkspaceSave()
      await signOutSupabase()
    }
    clearSession()
    setTeacherUserId(null)
    setStudentUserId(null)
    setStudentAccount(null)
    setCurrentView('landing')
    setActiveTab('overview')
  }, [useCloud])

  const handleTeacherSignIn = useCallback(
    async (email: string, password: string) => {
      if (useCloud) {
        const { error } = await signInWithEmail(email, password)
        if (error) throw new Error(error)
        await routeSession()
        return
      }
      enterDashboard({
        ...DEFAULT_USER,
        email: email.trim(),
      })
    },
    [useCloud, enterDashboard, routeSession],
  )

  const handleTeacherGoogleSignIn = useCallback(async () => {
    if (!useCloud) {
      throw new Error('Google sign-in requires Supabase. Add keys to your .env file.')
    }
    const { error } = await signInWithGoogle('teacher')
    if (error) throw new Error(error)
  }, [useCloud])

  const handleTeacherGoogleSignUp = handleTeacherGoogleSignIn

  const handleSignUp = useCallback(
    async (name: string, email: string, password: string) => {
      if (useCloud) {
        const { user, session, error } = await signUpWithEmail(
          email,
          password,
          name,
          'teacher',
        )
        if (error) throw new Error(error)
        if (!user) {
          throw new Error('Check your email to confirm your account, then sign in.')
        }
        if (!session) {
          await ensureActiveSession(email, password)
        }
        await routeSession(user)
        setActiveTab('overview')
        return
      }

      const nextUser: User = {
        name,
        email,
        initials: getInitials(name),
        role: 'Teacher',
        isAuthenticated: true,
      }
      const empty = initializeEmptyWorkspace()
      setClasses(empty.classes)
      setStudents(empty.students)
      setAttendance(empty.attendance)
      setPayments([])
      setJoinRequests([])
      setAttendanceClassKey('')
      shouldPersistClasses.current = false
      shouldPersistStudents.current = false
      shouldPersistAttendance.current = false
      shouldPersistPayments.current = false
      enterDashboard(nextUser)
      setActiveTab('overview')
    },
    [useCloud, enterDashboard, routeSession],
  )

  const handleCreateClass = useCallback((input: CreateClassInput) => {
    setClasses((prev) => {
      const nextId = prev.reduce((max, c) => Math.max(max, c.id), 0) + 1
      const existingKeys = new Set(prev.map((c) => c.classKey))
      const existingJoinCodes = new Set(
        prev.map((c) => c.joinCode).filter(Boolean) as string[],
      )
      const classKey = generateUniqueClassKey(input.name, existingKeys, nextId)
      const weeklySchedule = createDefaultWeeklySchedule()
      const newClass: Class = {
        id: nextId,
        classKey,
        name: input.name,
        status: 'active',
        schedule: formatClassSchedule(weeklySchedule, ''),
        students: 0,
        color: CLASS_GRADIENTS[prev.length % CLASS_GRADIENTS.length],
        studentIds: [],
        weeklySchedule,
        location: '',
        billingMode: input.billingMode ?? 'prepaid',
        monthlyFee: input.monthlyFee,
        joinCode: generateUniqueClassJoinCode(existingJoinCodes),
      }
      return [...prev, newClass]
    })
    shouldPersistClasses.current = true
    setIsModalOpen(false)
    setActiveTab('classes')
  }, [])

  const handleDisbandClass = useCallback((classId: number) => {
    setClasses((prev) => {
      const target = prev.find((c) => c.id === classId)
      const next = prev.map((c) =>
        c.id === classId ? { ...c, status: 'archived' as const } : c,
      )
      if (target) {
        setAttendanceClassKey((key) => {
          if (key !== target.classKey) return key
          return next.find((c) => c.status === 'active')?.classKey ?? key
        })
      }
      return next
    })
    shouldPersistClasses.current = true
    setManageClassId(null)
  }, [])

  const applyAttendanceTokenTransitions = useCallback(
    (classKey: string, transitions: AttendanceCellTransition[]) => {
      if (transitions.length === 0) return
      const cls = classes.find((c) => c.classKey === classKey)
      if (cls && !classUsesTokens(cls)) return

      setStudents((prev) => {
        let next = prev
        for (const { studentId, from, to } of transitions) {
          const delta = getTokenDeltaForAttendanceChange(from, to)
          if (delta === 0) continue
          next = next.map((s) =>
            s.id === studentId ? adjustTokenBalance(s, classKey, delta) : s,
          )
        }
        return next
      })
      markPersistStudents()
    },
    [classes],
  )

  const handleLedgerChange = useCallback(
    (
      ledger: AttendanceLedger,
      classKey: string,
      transitions: AttendanceCellTransition[],
    ) => {
      setAttendance(ledger)
      applyAttendanceTokenTransitions(classKey, transitions)
      markPersistAttendance()
    },
    [applyAttendanceTokenTransitions],
  )

  const handleTopUp = useCallback(
    (payload: TopUpConfirmPayload) => {
      const {
        studentId,
        classKey,
        packageType,
        customAmount,
        paidUpfront,
        paidMonthKey,
        amountDollars,
        note,
      } = payload
      const cls = classes.find((c) => c.classKey === classKey)
      const isMonthly = cls?.billingMode === 'monthly'

      if (isMonthly && paidMonthKey) {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === studentId
              ? applyMonthlyPayment(s, classKey, paidMonthKey)
              : s,
          ),
        )
        markPersistStudents()
      } else {
        const added = packageLessons(packageType, customAmount)
        setStudents((prev) =>
          prev.map((s) =>
            s.id === studentId ? applyTopUp(s, classKey, added) : s,
          ),
        )
        markPersistStudents()
      }

      const record: PaymentRecord = {
        id: createPaymentId(),
        studentId,
        classKey,
        createdAt: new Date().toISOString(),
        type: isMonthly ? 'monthly_fee' : 'prepaid_topup',
        lessonsAdded: isMonthly ? undefined : packageLessons(packageType, customAmount),
        packageType: isMonthly ? undefined : packageType,
        paidMonthKey: isMonthly ? paidMonthKey : undefined,
        amountDollars: isMonthly ? amountDollars : undefined,
        paidUpfront,
        note,
      }
      setPayments((prev) => [...prev, record])
      shouldPersistPayments.current = true
      logger.info('Payment recorded', {
        type: record.type,
        studentId,
        classKey,
        paidUpfront,
      })
    },
    [classes],
  )

  const handleSaveUser = useCallback((nextUser: User) => {
    setUser(nextUser)
    saveUser(nextUser)
  }, [])

  const handleSaveAssignment = useCallback(
    (
      classKey: string,
      input: AssignmentFormInput,
      mode: 'draft' | 'publish',
      existingId?: string,
    ) => {
      setAssignments((prev) => {
        const existing = existingId
          ? prev.find((a) => a.id === existingId)
          : undefined
        const next = buildAssignmentFromInput(
          classKey,
          input,
          mode === 'draft' ? 'draft' : 'published',
          existing,
        )
        if (existingId) {
          return prev.map((a) => (a.id === existingId ? next : a))
        }
        return [...prev, next]
      })
      shouldPersistAssignments.current = true
      logger.info('Assignment saved', { classKey, mode, existingId })
    },
    [],
  )

  const handleSaveAnnouncement = useCallback(
    (
      classKey: string,
      input: AnnouncementFormInput,
      mode: 'draft' | 'publish',
      existingId?: string,
    ) => {
      setAssignments((prev) => {
        const existing = existingId
          ? prev.find((a) => a.id === existingId)
          : undefined
        const next = buildAnnouncementFromInput(
          classKey,
          input,
          mode === 'draft' ? 'draft' : 'published',
          existing,
        )
        if (existingId) {
          return prev.map((a) => (a.id === existingId ? next : a))
        }
        return [...prev, next]
      })
      shouldPersistAssignments.current = true
      logger.info('Announcement saved', { classKey, mode, existingId })
    },
    [],
  )

  const handleDeleteAssignment = useCallback((assignmentId: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId))
    shouldPersistAssignments.current = true
  }, [])

  const handleExportBackup = useCallback(() => {
    const backup = buildAppBackup(
      classes,
      students,
      attendance,
      payments,
      user,
      joinRequests,
      studentAccounts,
      assignments,
    )
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `teacher-hub-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    logger.info('Backup exported')
  }, [classes, students, attendance, payments, user, joinRequests, studentAccounts, assignments])

  const handleImportBackup = useCallback(async (file: File) => {
    const text = await file.text()
    const backup = parseAppBackup(text)
    persistAppBackup(backup)
    setClasses(backup.classes)
    setStudents(backup.students)
    setAttendance(backup.attendance)
    setPayments(backup.payments ?? [])
    setJoinRequests(backup.joinRequests ?? [])
    setStudentAccounts(backup.studentAccounts ?? [])
    setAssignments(loadAssignments(backup.classes))
    if (backup.user) setUser(backup.user)
    setAttendanceClassKey(
      backup.classes.find((c) => c.status === 'active')?.classKey ?? '',
    )
    shouldPersistClasses.current = false
    shouldPersistStudents.current = false
    shouldPersistAttendance.current = false
    shouldPersistPayments.current = false
    shouldPersistJoinRequests.current = false
    shouldPersistAssignments.current = false
  }, [])

  const handleResetWorkspace = useCallback(() => {
    const empty = initializeEmptyWorkspace()
    setClasses(empty.classes)
    setStudents(empty.students)
    setAttendance(empty.attendance)
    setPayments([])
    setJoinRequests([])
    setStudentAccounts([])
    setAssignments([])
    setTeacherClassId(null)
    setAttendanceClassKey('')
    shouldPersistClasses.current = false
    shouldPersistStudents.current = false
    shouldPersistAttendance.current = false
    shouldPersistPayments.current = false
    shouldPersistJoinRequests.current = false
    shouldPersistAssignments.current = false
    logger.info('Workspace reset from settings')
  }, [])

  const handleAddStudent = useCallback(
    (input: CreateStudentInput) => {
      setStudents((prev) => {
        const nextId = prev.reduce((max, s) => Math.max(max, s.id), 0) + 1
        const initialTokenBalance = Math.max(0, input.initialTokenBalance ?? 0)
        const maps = ensureTokenMapsForEnrollment(
          {
            id: nextId,
            name: input.name,
            email: '',
            studentPhone: input.studentPhone ?? '',
            parentPhone: input.parentPhone ?? '',
            grade: input.grade ?? '',
            status: 'active',
            initials: '',
            avatarColor: '',
            enrolledClasses: [],
            tokensByClass: {},
            tokenCapacityByClass: {},
          },
          [input.classKey],
          initialTokenBalance,
        )
        maps.tokenCapacityByClass[input.classKey] = Math.max(
          NEW_STUDENT_TOKEN_CAPACITY,
          initialTokenBalance,
        )

        const newStudent: Student = {
          id: nextId,
          name: input.name,
          email: studentEmailFromName(input.name),
          studentPhone: input.studentPhone ?? '',
          parentPhone: input.parentPhone ?? '',
          grade: input.grade ?? '',
          status: 'active',
          initials: getInitials(input.name),
          avatarColor:
            STUDENT_AVATAR_COLORS[prev.length % STUDENT_AVATAR_COLORS.length],
          enrolledClasses: maps.enrolledClasses,
          tokensByClass: maps.tokensByClass,
          tokenCapacityByClass: maps.tokenCapacityByClass,
        }

        setClasses((clsPrev) => syncClassRosters(clsPrev, [...prev, newStudent]))
        shouldPersistClasses.current = true

        setAttendance((attPrev) => {
          const classRecords = { ...(attPrev.recordsByClass[input.classKey] ?? {}) }
          classRecords[nextId] = Object.fromEntries(
            attPrev.columns.map((col) => [col.dateKey, 'unset' as AttendanceStatus]),
          )
          return {
            ...attPrev,
            recordsByClass: {
              ...attPrev.recordsByClass,
              [input.classKey]: classRecords,
            },
          }
        })

        return [...prev, newStudent]
      })

      markPersistStudents()
      markPersistAttendance()
    },
    [],
  )

  const handleUpdateClass = useCallback(
    (classId: number, update: ManageClassUpdate) => {
      const targetClass = classes.find((c) => c.id === classId)
      if (!targetClass) return

      const scheduleStr = formatClassSchedule(
        update.weeklySchedule,
        update.location,
      )
      const classKey = targetClass.classKey

      setStudents((prev) => {
        const next = prev.map((s) => {
          const inRoster = update.studentIds.includes(s.id)
          const wasEnrolled = s.enrolledClasses.includes(classKey)
          if (inRoster && !wasEnrolled) {
            const maps = ensureTokenMapsForEnrollment(
              s,
              [...s.enrolledClasses, classKey],
              0,
            )
            return { ...s, ...maps }
          }
          if (!inRoster && wasEnrolled) {
            const maps = ensureTokenMapsForEnrollment(
              s,
              s.enrolledClasses.filter((k) => k !== classKey),
              0,
            )
            return { ...s, ...maps }
          }
          return s
        })

        setClasses((clsPrev) =>
          syncClassRosters(
            clsPrev.map((c) => {
              if (c.id === classId) {
                return {
                  ...c,
                  name: update.name,
                  studentIds: update.studentIds,
                  students: update.studentIds.length,
                  weeklySchedule: update.weeklySchedule,
                  location: update.location,
                  billingMode: update.billingMode,
                  monthlyFee: update.monthlyFee,
                  schedule: scheduleStr,
                }
              }
              return c
            }),
            next,
          ),
        )

        setAttendance((attPrev) => {
          const classRecords = { ...(attPrev.recordsByClass[classKey] ?? {}) }
          for (const id of update.studentIds) {
            if (!classRecords[id]) {
              classRecords[id] = Object.fromEntries(
                attPrev.columns.map((col) => [col.dateKey, 'unset' as AttendanceStatus]),
              )
            }
          }
          for (const id of Object.keys(classRecords)) {
            if (!update.studentIds.includes(Number(id))) {
              delete classRecords[Number(id)]
            }
          }
          return {
            ...attPrev,
            recordsByClass: {
              ...attPrev.recordsByClass,
              [classKey]: classRecords,
            },
          }
        })

        return next
      })

      shouldPersistClasses.current = true
      markPersistStudents()
      markPersistAttendance()
    },
    [classes],
  )

  const handleUpdateStudent = useCallback((updated: Student) => {
    const withInitials = {
      ...updated,
      initials: getInitials(updated.name),
    }
    setStudents((prev) => {
      const next = prev.map((s) => (s.id === updated.id ? withInitials : s))
      setClasses((clsPrev) => syncClassRosters(clsPrev, next))
      shouldPersistClasses.current = true
      return next
    })
    markPersistStudents()
  }, [])

  const handleArchiveStudent = useCallback((studentId: number) => {
    setStudents((prev) => {
      const next = prev.map((s) =>
        s.id === studentId ? { ...s, status: 'archived' as const } : s,
      )
      setClasses((clsPrev) => syncClassRosters(clsPrev, next))
      shouldPersistClasses.current = true
      return next
    })
    markPersistStudents()
  }, [])

  const handleReactivateStudent = useCallback((studentId: number) => {
    setStudents((prev) => {
      const next = prev.map((s) =>
        s.id === studentId ? { ...s, status: 'active' as const } : s,
      )
      setClasses((clsPrev) => syncClassRosters(clsPrev, next))
      shouldPersistClasses.current = true
      return next
    })
    markPersistStudents()
  }, [])

  const handleRegenerateJoinCode = useCallback((classId: number) => {
    setClasses((prev) => {
      const codes = new Set(
        prev
          .filter((c) => c.id !== classId)
          .map((c) => c.joinCode)
          .filter(Boolean) as string[],
      )
      return prev.map((c) =>
        c.id === classId
          ? { ...c, joinCode: generateUniqueClassJoinCode(codes) }
          : c,
      )
    })
    shouldPersistClasses.current = true
    logger.info('Class join code regenerated', { classId })
  }, [])

  const handleApproveJoinRequest = useCallback(
    async (requestId: string) => {
      const request = joinRequests.find((r) => r.id === requestId)
      if (!request || request.status !== 'pending') return

      const fallbackAccount: StudentAccount = {
        id: request.studentAccountId,
        email: studentEmailFromName(request.requestedName),
        displayName: request.requestedName,
        initials: getInitials(request.requestedName),
      }
      const accountsForApprove = studentAccounts.some(
        (a) => a.id === request.studentAccountId,
      )
        ? studentAccounts
        : [...studentAccounts, fallbackAccount]

      const result = approveJoinRequest(
        request,
        students,
        classes,
        accountsForApprove,
      )
      const linkedId = result.accounts.find(
        (a) => a.id === request.studentAccountId,
      )?.linkedStudentId

      const nextClasses = syncClassRosters(classes, result.students)
      setStudents(result.students)
      setClasses(nextClasses)
      shouldPersistClasses.current = !useCloud
      shouldPersistStudents.current = !useCloud

      if (linkedId) {
        setAttendance((attPrev) => {
          const classRecords = {
            ...(attPrev.recordsByClass[request.classKey] ?? {}),
          }
          if (!classRecords[linkedId]) {
            classRecords[linkedId] = Object.fromEntries(
              attPrev.columns.map((col) => [
                col.dateKey,
                'unset' as AttendanceStatus,
              ]),
            )
          }
          return {
            ...attPrev,
            recordsByClass: {
              ...attPrev.recordsByClass,
              [request.classKey]: classRecords,
            },
          }
        })
        markPersistAttendance()
      }

      if (!useCloud) {
        saveStudentAccounts(result.accounts)
      }
      setStudentAccounts(result.accounts)
      setJoinRequests((prev) =>
        prev.map((r) => (r.id === requestId ? result.request : r)),
      )
      shouldPersistJoinRequests.current = !useCloud

      if (useCloud && teacherUserId && linkedId) {
        const studentAuthId = request.studentUserId
        if (!studentAuthId) {
          console.error(
            '[Teacher Hub] Join request missing studentUserId; student must re-submit join from the app.',
          )
        } else {
          try {
            await saveTeacherWorkspace(teacherUserId, {
              classes: nextClasses,
              students: result.students,
              attendance,
              payments,
              assignments,
            })
            await updateJoinRequestStatus(
              requestId,
              'approved',
              result.request.reviewedAt,
            )
            await insertStudentEnrollment(
              studentAuthId,
              teacherUserId,
              request.classKey,
              linkedId,
            )
            await updateStudentProfileLink(
              studentAuthId,
              linkedId,
              teacherUserId,
            )
          } catch (err) {
            console.error('[Teacher Hub] Failed to sync join approval', err)
            throw err
          }
        }
      }
    },
    [
      joinRequests,
      students,
      classes,
      studentAccounts,
      attendance,
      payments,
      assignments,
      useCloud,
      teacherUserId,
    ],
  )

  const handleRejectJoinRequest = useCallback(
    async (requestId: string) => {
      const reviewedAt = new Date().toISOString()
      setJoinRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: 'rejected' as const,
                reviewedAt,
              }
            : r,
        ),
      )
      if (useCloud) {
        try {
          await updateJoinRequestStatus(requestId, 'rejected', reviewedAt)
        } catch (err) {
          console.error('[Teacher Hub] Failed to reject join request', err)
        }
      } else {
        shouldPersistJoinRequests.current = true
      }
      logger.info('Join request rejected', { requestId })
    },
    [useCloud],
  )

  const handleStudentSubmitJoin = useCallback(
    async (request: JoinRequest) => {
      if (useCloud) {
        await insertJoinRequestRemote(request)
      } else {
        shouldPersistJoinRequests.current = true
      }
      setJoinRequests((prev) => [...prev, request])
      logger.info('Join request submitted', { classKey: request.classKey })
    },
    [useCloud],
  )

  const handleStudentSignUp = useCallback(
    async (displayName: string, email: string, password: string) => {
      if (useCloud) {
        const { user, session, error } = await signUpWithEmail(
          email,
          password,
          displayName,
          'student',
        )
        if (error) throw new Error(error)
        if (!user) {
          throw new Error('Check your email to confirm your account, then sign in.')
        }
        if (!session) {
          await ensureActiveSession(email, password)
        }
        await ensureProfileRole(user.id, 'student', displayName, email)
        await routeSession(user)
        return
      }

      const account = registerStudentAccount(displayName, email)
      saveStudentSession(account)
      setStudentAccount(account)
      setStudentAccounts(loadStudentAccounts())
      setClasses(loadClasses())
      setJoinRequests(loadJoinRequests())
      setCurrentView('student-portal')
    },
    [useCloud, routeSession],
  )

  const handleStudentSignIn = useCallback(
    async (email: string, password: string) => {
      if (useCloud) {
        const { error } = await signInWithEmail(email, password)
        if (error) throw new Error(error)
        await routeSession()
        return
      }

      const account = findStudentAccountByEmail(email)
      if (!account) {
        throw new Error('No account found for this email. Create an account first.')
      }
      saveStudentSession(account)
      setStudentAccount(account)
      setClasses(loadClasses())
      setJoinRequests(loadJoinRequests())
      setAssignments(loadAssignments(loadClasses()))
      setCurrentView('student-portal')
    },
    [useCloud, routeSession],
  )

  const handleStudentGoogleAuth = useCallback(async () => {
    if (!useCloud) {
      throw new Error('Google sign-in requires Supabase. Add keys to your .env file.')
    }
    const { error } = await signInWithGoogle('student')
    if (error) throw new Error(error)
  }, [useCloud])

  const handleStudentSignOut = useCallback(async () => {
    if (useCloud) {
      await signOutSupabase()
    }
    clearSession()
    setStudentAccount(null)
    setStudentUserId(null)
    setCurrentView('landing')
  }, [useCloud])

  const handleDeleteStudent = useCallback((studentId: number) => {
    setStudents((prev) => {
      const next = prev.filter((s) => s.id !== studentId)
      setClasses((clsPrev) => syncClassRosters(clsPrev, next))
      shouldPersistClasses.current = true
      return next
    })
    setAttendance((prev) => {
      const recordsByClass = { ...prev.recordsByClass }
      for (const key of Object.keys(recordsByClass)) {
        const { [studentId]: _, ...rest } = recordsByClass[key]
        recordsByClass[key] = rest
      }
      return { ...prev, recordsByClass }
    })
    markPersistStudents()
    markPersistAttendance()
  }, [])

  const demoModeBanner =
    import.meta.env.PROD && !useCloud ? (
      <div
        className="border-b border-amber-300 bg-amber-100 px-4 py-2.5 text-center text-sm font-medium text-amber-950"
        role="status"
      >
        Demo mode — accounts are stored in this browser only, not Supabase. Add{' '}
        <code className="rounded bg-amber-200/80 px-1">VITE_SUPABASE_URL</code> and{' '}
        <code className="rounded bg-amber-200/80 px-1">VITE_SUPABASE_ANON_KEY</code> on
        Netlify, then redeploy.
      </div>
    ) : null

  if (useCloud && !authReady) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        {demoModeBanner}
        <div className="flex flex-1 items-center justify-center text-sm text-slate-600">
          Loading…
        </div>
      </div>
    )
  }

  if (currentView === 'landing') {
    return (
      <>
        {demoModeBanner}
        <LandingPage
          onSignIn={() => setCurrentView('login')}
          onGetStarted={() => setCurrentView('signup')}
          onStudentSignUp={() => setCurrentView('student-signup')}
          onStudentSignIn={() => setCurrentView('student-login')}
          onDevBypass={useCloud ? undefined : handleDevBypass}
        />
      </>
    )
  }

  if (currentView === 'student-login') {
    return (
      <StudentLoginView
        onSignIn={handleStudentSignIn}
        onGoogleSignIn={handleStudentGoogleAuth}
        onGoToSignup={() => setCurrentView('student-signup')}
        onBack={() => setCurrentView('landing')}
      />
    )
  }

  if (currentView === 'student-signup') {
    return (
      <StudentSignupView
        onSignUp={handleStudentSignUp}
        onGoogleSignUp={handleStudentGoogleAuth}
        onGoToLogin={() => setCurrentView('student-login')}
        onBack={() => setCurrentView('landing')}
      />
    )
  }

  if (currentView === 'student-portal') {
    if (!studentAccount) {
      return (
        <StudentLoginView
          onSignIn={handleStudentSignIn}
          onGoogleSignIn={handleStudentGoogleAuth}
          onGoToSignup={() => setCurrentView('student-signup')}
          onBack={() => setCurrentView('landing')}
        />
      )
    }
    return (
      <StudentPortal
        account={studentAccount}
        classes={classes}
        students={students}
        joinRequests={joinRequests}
        assignments={assignments}
        payments={payments}
        attendance={attendance}
        enrollmentScopedClasses={useCloud}
        classEnrollments={classEnrollments}
        studentUserId={studentUserId}
        onSignOut={handleStudentSignOut}
        onSubmitJoinRequest={handleStudentSubmitJoin}
      />
    )
  }

  if (currentView === 'login') {
    return (
      <LoginView
        onSignIn={handleTeacherSignIn}
        onGoogleSignIn={handleTeacherGoogleSignIn}
        onGoToSignup={() => setCurrentView('signup')}
        onBack={() => setCurrentView('landing')}
        onDevBypass={useCloud ? undefined : handleDevBypass}
      />
    )
  }

  if (currentView === 'signup') {
    return (
      <SignupView
        onSignUp={handleSignUp}
        onGoogleSignUp={handleTeacherGoogleSignUp}
        onGoToLogin={() => setCurrentView('login')}
        onBack={() => setCurrentView('landing')}
      />
    )
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            students={students}
            classes={activeClasses}
            payments={payments}
            joinRequests={joinRequests}
            studentAccounts={studentAccounts}
            onApproveJoinRequest={handleApproveJoinRequest}
            onRejectJoinRequest={handleRejectJoinRequest}
            onCreateClass={() => setIsModalOpen(true)}
            onGoToStudents={() => setActiveTab('students')}
            onGoToAttendance={() => setActiveTab('attendance')}
          />
        )
      case 'assignments':
        return (
          <TeacherAssignmentsTab
            assignments={assignments}
            classes={activeClasses}
            onSaveAssignment={handleSaveAssignment}
            onSaveAnnouncement={handleSaveAnnouncement}
            onDeleteAssignment={handleDeleteAssignment}
            onGoToClasses={() => setActiveTab('classes')}
          />
        )
      case 'classes': {
        const workspaceClass = activeClasses.find((c) => c.id === teacherClassId)
        if (workspaceClass) {
          return (
            <TeacherClassWorkspace
              cls={workspaceClass}
              students={students}
              assignments={assignments}
              teacherUserId={teacherUserId}
              onBack={() => setTeacherClassId(null)}
              onOpenSettings={() => {
                setManageClassId(workspaceClass.id)
              }}
              onSaveAssignment={handleSaveAssignment}
              onSaveAnnouncement={handleSaveAnnouncement}
              onDeleteAssignment={handleDeleteAssignment}
            />
          )
        }
        return (
          <MyClassesTab
            classes={activeClasses}
            onOpenClass={setTeacherClassId}
            onCreateClass={() => setIsModalOpen(true)}
          />
        )
      }
      case 'attendance':
        return (
          <AttendanceTab
            classes={activeClasses}
            students={students}
            ledger={attendance}
            activeClassKey={attendanceClassKey}
            onActiveClassChange={setAttendanceClassKey}
            onLedgerChange={handleLedgerChange}
            onCreateClass={() => setIsModalOpen(true)}
          />
        )
      case 'students':
        return (
          <StudentsTab
            students={students}
            classes={activeClasses}
            joinRequests={joinRequests}
            studentAccounts={studentAccounts}
            onApproveJoinRequest={handleApproveJoinRequest}
            onRejectJoinRequest={handleRejectJoinRequest}
            onTopUp={handleTopUp}
            onAddStudent={handleAddStudent}
            onCreateClass={() => setIsModalOpen(true)}
            onUpdateStudent={handleUpdateStudent}
            onArchiveStudent={handleArchiveStudent}
            onReactivateStudent={handleReactivateStudent}
            onDeleteStudent={handleDeleteStudent}
            payments={payments}
          />
        )
      case 'settings':
        return (
          <SettingsTab
            user={user}
            onSaveUser={handleSaveUser}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onResetWorkspace={handleResetWorkspace}
            onSignOut={handleSignOut}
          />
        )
      default:
        return (
          <OverviewTab
            students={students}
            classes={activeClasses}
            payments={payments}
            joinRequests={joinRequests}
            studentAccounts={studentAccounts}
            onApproveJoinRequest={handleApproveJoinRequest}
            onRejectJoinRequest={handleRejectJoinRequest}
            onCreateClass={() => setIsModalOpen(true)}
            onGoToStudents={() => setActiveTab('students')}
            onGoToAttendance={() => setActiveTab('attendance')}
          />
        )
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 animate-[fadeIn_0.35s_ease-out]">
      <Sidebar
        activeTab={activeTab}
        user={user}
        pendingJoinCount={pendingJoinCount}
        onTabChange={(tab) => {
          setActiveTab(tab)
          if (tab !== 'classes') setTeacherClassId(null)
        }}
        onSignOut={handleSignOut}
      />

      <MobileTopBar
        user={user}
        activeTab={activeTab}
        onOpenProfile={() => setActiveTab('settings')}
        onSignOut={handleSignOut}
      />

      <div className="flex min-w-0 flex-1 flex-col pt-14 md:pt-0">
        <Header
          activeTab={activeTab}
          onCreateClass={() => setIsModalOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 pb-16 md:p-8 md:pb-0">
          {renderTab()}
        </main>
      </div>

      <MobileBottomNav
        activeTab={activeTab}
        pendingJoinCount={pendingJoinCount}
        onTabChange={(tab) => {
          setActiveTab(tab)
          if (tab !== 'classes') setTeacherClassId(null)
        }}
      />

      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateClass={handleCreateClass}
      />

      <ManageClassModal
        classItem={classes.find((c) => c.id === manageClassId) ?? null}
        students={students}
        isOpen={manageClassId !== null}
        onClose={() => setManageClassId(null)}
        onSave={handleUpdateClass}
        onDisband={handleDisbandClass}
        onRegenerateJoinCode={handleRegenerateJoinCode}
      />
    </div>
  )
}

export default App
