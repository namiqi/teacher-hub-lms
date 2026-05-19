import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import LandingPage from './components/auth/LandingPage'
import LoginView from './components/auth/LoginView'
import SignupView from './components/auth/SignupView'
import Header from './components/Header'
import CreateClassModal from './components/modals/CreateClassModal'
import ManageClassModal from './components/modals/ManageClassModal'
import { generateUniqueClassKey } from './lib/classKeys'
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
import Sidebar from './components/Sidebar'
import AttendanceTab from './components/tabs/AttendanceTab'
import MyClassesTab from './components/tabs/MyClassesTab'
import OverviewTab from './components/tabs/OverviewTab'
import SettingsTab from './components/tabs/SettingsTab'
import StudentsTab from './components/tabs/StudentsTab'
import { CLASS_GRADIENTS } from './data/classes'
import { STUDENT_AVATAR_COLORS } from './data/students'
import { NEW_STUDENT_TOKEN_CAPACITY } from './lib/classKeys'
import {
  clearSession,
  getInitials,
  loadAttendance,
  loadClasses,
  loadSession,
  loadStudents,
  loadUser,
  saveAttendance,
  saveClasses,
  saveDevBypassUser,
  saveSession,
  saveStudents,
  saveUser,
} from './lib/storage'
import { studentEmailFromName } from './lib/utils'
import type {
  AppView,
  AttendanceLedger,
  AttendanceStatus,
  Class,
  CreateClassInput,
  CreateStudentInput,
  ManageClassUpdate,
  Student,
  TabId,
  TopUpPackage,
  User,
} from './types'

const DEFAULT_USER: User = {
  name: 'Sarah Johnson',
  email: 'sarah.johnson@school.edu',
  initials: 'SJ',
  role: 'Teacher',
  isAuthenticated: true,
}

const PACKAGE_LESSONS: Record<Exclude<TopUpPackage, 'custom'>, number> = {
  standard: 8,
  intensive: 12,
}

function App() {
  const [currentView, setCurrentView] = useState<AppView>(() =>
    loadSession() ? 'dashboard' : 'landing',
  )
  const [user, setUser] = useState<User>(() => loadUser() ?? DEFAULT_USER)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [manageClassId, setManageClassId] = useState<number | null>(null)
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

  const activeClasses = useMemo(
    () => classes.filter((c) => c.status !== 'archived'),
    [classes],
  )

  const shouldPersistClasses = useRef(false)
  const shouldPersistStudents = useRef(false)
  const shouldPersistAttendance = useRef(false)

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
    saveSession()
    setCurrentView('dashboard')
  }, [])

  const handleDevBypass = useCallback(() => {
    const devUser = saveDevBypassUser()
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
      enterDashboard(nextUser)
    },
    [enterDashboard],
  )

  const handleCreateClass = useCallback((input: CreateClassInput) => {
    setClasses((prev) => {
      const nextId = prev.reduce((max, c) => Math.max(max, c.id), 0) + 1
      const existingKeys = new Set(prev.map((c) => c.classKey))
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
    [],
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
    (
      studentId: number,
      classKey: string,
      packageType: TopUpPackage,
      customAmount: number | undefined,
      _paidUpfront: boolean,
    ) => {
      const added =
        packageType === 'custom'
          ? (customAmount ?? 8)
          : PACKAGE_LESSONS[packageType]

      setStudents((prev) =>
        prev.map((s) =>
          s.id === studentId ? applyTopUp(s, classKey, added) : s,
        ),
      )

      markPersistStudents()
    },
    [],
  )

  const handleAddStudent = useCallback(
    (input: CreateStudentInput) => {
      setStudents((prev) => {
        const nextId = prev.reduce((max, s) => Math.max(max, s.id), 0) + 1
        const maps = ensureTokenMapsForEnrollment(
          {
            id: nextId,
            name: input.name,
            email: '',
            parentContact: input.parentContact,
            grade: input.grade,
            status: 'active',
            initials: '',
            avatarColor: '',
            enrolledClasses: [],
            tokensByClass: {},
            tokenCapacityByClass: {},
          },
          [input.classKey],
          0,
        )
        maps.tokenCapacityByClass[input.classKey] = NEW_STUDENT_TOKEN_CAPACITY

        const newStudent: Student = {
          id: nextId,
          name: input.name,
          email: studentEmailFromName(input.name),
          parentContact: input.parentContact,
          grade: input.grade,
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
                  studentIds: update.studentIds,
                  students: update.studentIds.length,
                  weeklySchedule: update.weeklySchedule,
                  location: update.location,
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
        onDevBypass={handleDevBypass}
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
        return <OverviewTab students={students} classes={activeClasses} />
      case 'classes':
        return (
          <MyClassesTab
            classes={activeClasses}
            onManageClass={setManageClassId}
          />
        )
      case 'attendance':
        return (
          <AttendanceTab
            classes={activeClasses}
            students={students}
            ledger={attendance}
            activeClassKey={attendanceClassKey}
            onActiveClassChange={setAttendanceClassKey}
            onLedgerChange={handleLedgerChange}
          />
        )
      case 'students':
        return (
          <StudentsTab
            students={students}
            classes={activeClasses}
            onTopUp={handleTopUp}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onArchiveStudent={handleArchiveStudent}
            onReactivateStudent={handleReactivateStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )
      case 'settings':
        return <SettingsTab />
      default:
        return <OverviewTab students={students} classes={activeClasses} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 animate-[fadeIn_0.35s_ease-out]">
      <Sidebar
        activeTab={activeTab}
        user={user}
        onTabChange={setActiveTab}
        onSignOut={handleSignOut}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          activeTab={activeTab}
          onCreateClass={() => setIsModalOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-8">{renderTab()}</main>
      </div>

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
      />
    </div>
  )
}

export default App
