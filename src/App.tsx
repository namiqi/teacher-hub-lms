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
  JoinRequest,
  PaymentRecord,
  Student,
  StudentAccount,
  TabId,
  User,
} from './types'

function getInitialView(): AppView {
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

  useEffect(() => {
    if (
      currentView === 'student-portal' ||
      currentView === 'student-login' ||
      currentView === 'student-signup'
    ) {
      setClasses(loadClasses())
    }
  }, [currentView])

  const refreshJoinRequests = useCallback(() => {
    setJoinRequests(loadJoinRequests())
  }, [])

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
      refreshJoinRequests()
      refreshAssignments()
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
  }, [currentView, refreshJoinRequests, refreshAssignments])

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

  const handleSignOut = useCallback(() => {
    clearSession()
    setCurrentView('landing')
    setActiveTab('overview')
  }, [])

  const handleSignUp = useCallback(
    (name: string, email: string) => {
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
    [enterDashboard],
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
    (requestId: string) => {
      const request = joinRequests.find((r) => r.id === requestId)
      if (!request || request.status !== 'pending') return

      const result = approveJoinRequest(
        request,
        students,
        classes,
        studentAccounts,
      )
      const linkedId = result.accounts.find(
        (a) => a.id === request.studentAccountId,
      )?.linkedStudentId

      setStudents(result.students)
      setClasses((clsPrev) => syncClassRosters(clsPrev, result.students))
      shouldPersistClasses.current = true
      shouldPersistStudents.current = true

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

      saveStudentAccounts(result.accounts)
      setStudentAccounts(result.accounts)
      setJoinRequests((prev) =>
        prev.map((r) => (r.id === requestId ? result.request : r)),
      )
      shouldPersistJoinRequests.current = true
    },
    [joinRequests, students, classes, studentAccounts],
  )

  const handleRejectJoinRequest = useCallback((requestId: string) => {
    setJoinRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected' as const,
              reviewedAt: new Date().toISOString(),
            }
          : r,
      ),
    )
    shouldPersistJoinRequests.current = true
    logger.info('Join request rejected', { requestId })
  }, [])

  const handleStudentSubmitJoin = useCallback((request: JoinRequest) => {
    setJoinRequests((prev) => [...prev, request])
    shouldPersistJoinRequests.current = true
    logger.info('Join request submitted', { classKey: request.classKey })
  }, [])

  const handleStudentSignUp = useCallback((displayName: string, email: string) => {
    try {
      const account = registerStudentAccount(displayName, email)
      saveStudentSession(account)
      setStudentAccount(account)
      setStudentAccounts(loadStudentAccounts())
      setCurrentView('student-portal')
    } catch (err) {
      throw err
    }
  }, [])

  const handleStudentSignIn = useCallback((accountId: number) => {
    const account = loadStudentAccounts().find((a) => a.id === accountId)
    if (!account) return
    saveStudentSession(account)
    setStudentAccount(account)
    setCurrentView('student-portal')
  }, [])

  const handleStudentSignOut = useCallback(() => {
    clearSession()
    setStudentAccount(null)
    setCurrentView('landing')
  }, [])

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

  if (currentView === 'landing') {
    return (
      <LandingPage
        onSignIn={() => setCurrentView('login')}
        onGetStarted={() => setCurrentView('signup')}
        onStudentPortal={() => setCurrentView('student-login')}
        onDevBypass={handleDevBypass}
      />
    )
  }

  if (currentView === 'student-login') {
    return (
      <StudentLoginView
        onSignIn={handleStudentSignIn}
        onGoToSignup={() => setCurrentView('student-signup')}
        onBack={() => setCurrentView('landing')}
      />
    )
  }

  if (currentView === 'student-signup') {
    return (
      <StudentSignupView
        onSignUp={handleStudentSignUp}
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
        onSignOut={handleStudentSignOut}
        onSubmitJoinRequest={handleStudentSubmitJoin}
      />
    )
  }

  if (currentView === 'login') {
    return (
      <LoginView
        onSignIn={() =>
          enterDashboard({
            ...DEFAULT_USER,
            email: 'teacher@thehub.edu',
          })
        }
        onGoToSignup={() => setCurrentView('signup')}
        onBack={() => setCurrentView('landing')}
        onDevBypass={handleDevBypass}
      />
    )
  }

  if (currentView === 'signup') {
    return (
      <SignupView
        onSignUp={handleSignUp}
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
