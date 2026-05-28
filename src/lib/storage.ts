import { buildInitialLedger } from '../data/attendance'
import { migrateAssignment } from './assignments'
import { INITIAL_ASSIGNMENTS } from '../data/assignments'
import { INITIAL_CLASSES } from '../data/classes'
import { INITIAL_STUDENTS } from '../data/students'
import { codeToClassKey, nameToClassKey } from './classKeys'
import {
  generateUniqueClassJoinCode,
  normalizeJoinCodeInput,
} from './joinCodes'
import { createDefaultWeeklySchedule, formatClassSchedule } from './classSchedule'
import { logger } from './logger'
import type {
  AppDataBackup,
  Assignment,
  AttendanceLedger,
  AttendanceRow,
  AttendanceStatus,
  Class,
  ClassBillingMode,
  JoinRequest,
  PaymentRecord,
  SessionRole,
  Student,
  StudentAccount,
  User,
} from '../types'

export const STORAGE_KEYS = {
  classes: 'hub-lms-classes',
  assignments: 'hub-lms-assignments',
  students: 'hub-lms-students',
  attendance: 'hub-lms-attendance',
  user: 'hub-lms-user',
  session: 'hub-lms-session',
  payments: 'hub-lms-payments',
  sessionRole: 'hub-lms-session-role',
  studentAccount: 'hub-lms-student-account',
  joinRequests: 'hub-lms-join-requests',
  studentAccounts: 'hub-lms-student-accounts',
} as const

export const DEV_BYPASS_USER: User = {
  name: 'Prof. Smith',
  role: 'Teacher',
  email: 'teacher@thehub.edu',
  isAuthenticated: true,
  initials: 'PS',
}

type LegacyStudent = Student & {
  className?: string
  parentContact?: string
  tokensLeft?: number
  tokensTotal?: number
}

type LegacyClass = Class & { classKey?: string; code?: string }

type LegacyLedger = AttendanceLedger & { rows?: AttendanceRow[] }

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as T
    return parsed
  } catch {
    return fallback
  }
}

function migrateClasses(raw: LegacyClass[]): Class[] {
  return raw.map((c) => {
    const seed = INITIAL_CLASSES.find((i) => i.id === c.id)
    const legacyCode = (c as LegacyClass).code
    const classKey =
      c.classKey ??
      (legacyCode ? codeToClassKey(legacyCode) : nameToClassKey(c.name)) ??
      seed?.classKey ??
      ''
    const weeklySchedule =
      c.weeklySchedule?.length > 0
        ? c.weeklySchedule
        : (seed?.weeklySchedule ?? createDefaultWeeklySchedule())
    const location = c.location ?? seed?.location ?? ''
    const studentIds =
      c.studentIds?.length > 0
        ? c.studentIds
        : (seed?.studentIds ?? [])

    const { code: _legacyCodeField, ...classFields } = c as LegacyClass

    const status =
      classFields.status === 'archived' || classFields.status === 'active'
        ? classFields.status
        : (seed?.status ?? 'active')

    const billingMode: ClassBillingMode =
      classFields.billingMode === 'monthly' || classFields.billingMode === 'prepaid'
        ? classFields.billingMode
        : (seed?.billingMode ?? 'prepaid')

    return {
      ...seed,
      ...classFields,
      classKey,
      status,
      studentIds,
      students: studentIds.length,
      weeklySchedule,
      location,
      billingMode,
      monthlyFee: classFields.monthlyFee ?? seed?.monthlyFee,
      schedule:
        c.schedule ||
        formatClassSchedule(weeklySchedule, location) ||
        seed?.schedule ||
        '',
    }
  })
}

function normalizeClass(c: Class): Class {
  return {
    ...c,
    billingMode: c.billingMode === 'monthly' ? 'monthly' : 'prepaid',
    joinCode: c.joinCode ? normalizeJoinCodeInput(c.joinCode) : undefined,
  }
}

export function ensureClassJoinCodes(classes: Class[]): Class[] {
  const used = new Set<string>()
  return classes.map((c) => {
    let joinCode = c.joinCode ? normalizeJoinCodeInput(c.joinCode) : ''
    if (!joinCode || used.has(joinCode)) {
      joinCode = generateUniqueClassJoinCode(used)
    }
    used.add(joinCode)
    return { ...c, joinCode }
  })
}

export function loadClasses(): Class[] {
  const raw = readJson<LegacyClass[]>(STORAGE_KEYS.classes, INITIAL_CLASSES)
  const needsMigration = raw.some((c) => !c.classKey || !Array.isArray(c.studentIds))
  const classes = needsMigration ? migrateClasses(raw) : raw
  const normalized = classes.map(normalizeClass)
  const withCodes = ensureClassJoinCodes(normalized)
  const missingJoinCodes = normalized.some((c) => !c.joinCode)
  if (needsMigration || missingJoinCodes) {
    saveClasses(withCodes)
  }
  return withCodes
}

export function loadAssignments(classes: Class[] = loadClasses()): Assignment[] {
  const raw = readJson<Assignment[]>(STORAGE_KEYS.assignments, INITIAL_ASSIGNMENTS)
  const migrated = raw.map((a) =>
    migrateAssignment(a as Parameters<typeof migrateAssignment>[0], classes),
  )
  const needsPersist = raw.some(
    (a, i) =>
      !('classKey' in a && 'dueAt' in a) ||
      migrated[i].id !== (a as Assignment).id,
  )
  if (needsPersist) {
    saveAssignments(migrated)
  }
  return migrated
}

function classKeyFromLegacyName(className: string, classes: Class[]): string | null {
  const match = classes.find((c) => c.name === className)
  return match?.classKey ?? null
}

function migrateStudent(
  s: LegacyStudent,
  classes: Class[],
): Student {
  const seed = INITIAL_STUDENTS.find((i) => i.id === s.id)
  const legacy = s as LegacyStudent & { status?: string }
  const status =
    legacy.status === 'archived' || legacy.status === 'active'
      ? legacy.status
      : legacy.status === 'inactive'
        ? 'archived'
        : (seed?.status ?? 'active')

  if (
    Array.isArray(s.enrolledClasses) &&
    s.tokensByClass &&
    typeof s.tokensByClass === 'object'
  ) {
    return {
      ...seed,
      ...s,
      studentPhone:
        s.studentPhone ??
        (s as LegacyStudent).parentContact ??
        seed?.studentPhone ??
        seed?.parentPhone ??
        '',
      parentPhone:
        s.parentPhone ??
        (s as LegacyStudent).parentContact ??
        seed?.parentPhone ??
        '',
      grade: s.grade ?? seed?.grade ?? '',
      status,
      enrolledClasses: [...s.enrolledClasses],
      tokensByClass: { ...s.tokensByClass },
      tokenCapacityByClass: { ...(s.tokenCapacityByClass ?? {}) },
      paidThroughMonthByClass: { ...(s.paidThroughMonthByClass ?? {}) },
    }
  }

  const legacyClassName = s.className ?? seed?.enrolledClasses?.[0]
    ? classes.find((c) => c.classKey === seed?.enrolledClasses[0])?.name
    : undefined
  const classKey =
    (legacyClassName && classKeyFromLegacyName(legacyClassName, classes)) ??
    seed?.enrolledClasses[0] ??
    classes[0]?.classKey ??
    'math_201'

  const tokensLeft = s.tokensLeft ?? seed?.tokensByClass[classKey] ?? 0
  const tokensTotal = s.tokensTotal ?? seed?.tokenCapacityByClass[classKey] ?? 12

  const enrolledClasses = seed?.enrolledClasses?.length
    ? [...seed.enrolledClasses]
    : [classKey]

  const tokensByClass: Record<string, number> = {
    ...(seed?.tokensByClass ?? {}),
    [classKey]: tokensLeft,
  }
  const tokenCapacityByClass: Record<string, number> = {
    ...(seed?.tokenCapacityByClass ?? {}),
    [classKey]: tokensTotal,
  }

  for (const key of enrolledClasses) {
    if (tokensByClass[key] === undefined) tokensByClass[key] = 0
    if (tokenCapacityByClass[key] === undefined) {
      tokenCapacityByClass[key] = 12
    }
  }

  return {
    id: s.id,
    name: s.name ?? seed?.name ?? '',
    email: s.email ?? seed?.email ?? '',
    studentPhone:
      s.studentPhone ??
      (s as LegacyStudent).parentContact ??
      seed?.studentPhone ??
      seed?.parentPhone ??
      '',
    parentPhone:
      s.parentPhone ??
      (s as LegacyStudent).parentContact ??
      seed?.parentPhone ??
      '',
    grade: s.grade ?? seed?.grade ?? '',
    status,
    initials: s.initials ?? seed?.initials ?? '',
    avatarColor: s.avatarColor ?? seed?.avatarColor ?? 'bg-blue-500',
    enrolledClasses,
    tokensByClass,
    tokenCapacityByClass,
    paidThroughMonthByClass: { ...(s.paidThroughMonthByClass ?? seed?.paidThroughMonthByClass ?? {}) },
  }
}

export function loadStudents(classes: Class[] = loadClasses()): Student[] {
  const raw = readJson<LegacyStudent[]>(STORAGE_KEYS.students, INITIAL_STUDENTS)
  if (raw.length === 0) return INITIAL_STUDENTS
  const migrated = raw.map((s) => migrateStudent(s, classes))
  const needsMigration = raw.some(
    (s) =>
      !Array.isArray(s.enrolledClasses) ||
      !s.tokensByClass ||
      typeof (s as LegacyStudent).tokensLeft === 'number',
  )
  return needsMigration ? migrated : (raw as Student[])
}

function migrateAttendance(
  raw: LegacyLedger,
  students: Student[],
  classes: Class[],
): AttendanceLedger {
  if (raw.recordsByClass && !raw.rows?.length) {
    return {
      columns: raw.columns?.length ? raw.columns : buildInitialLedger().columns,
      recordsByClass: JSON.parse(JSON.stringify(raw.recordsByClass)),
    }
  }

  const columns = raw.columns?.length ? raw.columns : buildInitialLedger().columns
  const recordsByClass: AttendanceLedger['recordsByClass'] = {}

  for (const cls of classes) {
    recordsByClass[cls.classKey] = {}
    const enrolled = students.filter(
      (s) => s.status === 'active' && s.enrolledClasses.includes(cls.classKey),
    )
    for (const student of enrolled) {
      const legacyRow = raw.rows?.find((r) => r.studentId === student.id)
      const records: Record<string, AttendanceStatus> = {}
      for (const col of columns) {
        records[col.dateKey] =
          legacyRow?.records[col.dateKey] ?? ('unset' as AttendanceStatus)
      }
      recordsByClass[cls.classKey][student.id] = records
    }
  }

  return { columns, recordsByClass }
}

export function loadAttendance(
  students: Student[] = loadStudents(),
  classes: Class[] = loadClasses(),
): AttendanceLedger {
  const raw = readJson<LegacyLedger>(STORAGE_KEYS.attendance, buildInitialLedger())
  const hasNewShape = Boolean(raw.recordsByClass) && !raw.rows?.length
  if (hasNewShape) {
    return {
      columns: raw.columns?.length ? raw.columns : buildInitialLedger().columns,
      recordsByClass: raw.recordsByClass,
    }
  }
  return migrateAttendance(raw, students, classes)
}

export function saveClasses(classes: Class[]): void {
  localStorage.setItem(STORAGE_KEYS.classes, JSON.stringify(classes))
}

export function saveAssignments(assignments: Assignment[]): void {
  localStorage.setItem(STORAGE_KEYS.assignments, JSON.stringify(assignments))
}

export function saveStudents(students: Student[]): void {
  localStorage.setItem(STORAGE_KEYS.students, JSON.stringify(students))
}

export function saveAttendance(ledger: AttendanceLedger): void {
  localStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(ledger))
}

export function loadUser(): User | null {
  return readJson<User | null>(STORAGE_KEYS.user, null)
}

export function saveUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
}

export function saveDevBypassUser(): User {
  saveUser(DEV_BYPASS_USER)
  saveTeacherSession()
  return DEV_BYPASS_USER
}

/** @deprecated Use loadSessionRole — kept for compatibility */
export function loadSession(): boolean {
  return loadSessionRole() === 'teacher'
}

export function loadSessionRole(): SessionRole | null {
  const role = localStorage.getItem(STORAGE_KEYS.sessionRole)
  if (role === 'teacher' || role === 'student') return role
  if (localStorage.getItem(STORAGE_KEYS.session) === 'active') return 'teacher'
  return null
}

export function saveTeacherSession(): void {
  localStorage.setItem(STORAGE_KEYS.session, 'active')
  localStorage.setItem(STORAGE_KEYS.sessionRole, 'teacher')
}

export function saveStudentSession(account: StudentAccount): void {
  localStorage.setItem(STORAGE_KEYS.studentAccount, JSON.stringify(account))
  localStorage.setItem(STORAGE_KEYS.sessionRole, 'student')
  localStorage.removeItem(STORAGE_KEYS.session)
}

export function loadStudentAccount(): StudentAccount | null {
  return readJson<StudentAccount | null>(STORAGE_KEYS.studentAccount, null)
}

export function saveStudentAccounts(accounts: StudentAccount[]): void {
  localStorage.setItem(STORAGE_KEYS.studentAccounts, JSON.stringify(accounts))
  if (loadSessionRole() === 'student') {
    const session = loadStudentAccount()
    if (session) {
      const updated = accounts.find((a) => a.id === session.id)
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.studentAccount, JSON.stringify(updated))
      }
    }
  }
}

export function saveStudentAccountRecord(account: StudentAccount): void {
  const all = loadStudentAccounts()
  const next = all.some((a) => a.id === account.id)
    ? all.map((a) => (a.id === account.id ? account : a))
    : [...all, account]
  saveStudentAccounts(next)
}

export function loadStudentAccounts(): StudentAccount[] {
  return readJson<StudentAccount[]>(STORAGE_KEYS.studentAccounts, [])
}

export function loadJoinRequests(): JoinRequest[] {
  return readJson<JoinRequest[]>(STORAGE_KEYS.joinRequests, [])
}

export function saveJoinRequests(requests: JoinRequest[]): void {
  localStorage.setItem(STORAGE_KEYS.joinRequests, JSON.stringify(requests))
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.session)
  localStorage.removeItem(STORAGE_KEYS.sessionRole)
  localStorage.removeItem(STORAGE_KEYS.studentAccount)
}

export function saveSession(): void {
  saveTeacherSession()
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function loadPayments(): PaymentRecord[] {
  return readJson<PaymentRecord[]>(STORAGE_KEYS.payments, [])
}

export function savePayments(payments: PaymentRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.payments, JSON.stringify(payments))
}

export function buildAppBackup(
  classes: Class[],
  students: Student[],
  attendance: AttendanceLedger,
  payments: PaymentRecord[],
  user: User | null,
  joinRequests: JoinRequest[] = loadJoinRequests(),
  studentAccounts: StudentAccount[] = loadStudentAccounts(),
  assignments: Assignment[] = loadAssignments(classes),
): AppDataBackup {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    user,
    classes,
    students,
    attendance,
    payments,
    joinRequests,
    studentAccounts,
    assignments,
  }
}

export function parseAppBackup(raw: string): AppDataBackup {
  const parsed = JSON.parse(raw) as AppDataBackup
  if (parsed.version !== 1 && parsed.version !== 2) {
    throw new Error('Unsupported backup version. Please export a new backup from this app.')
  }
  if (!Array.isArray(parsed.classes) || !Array.isArray(parsed.students)) {
    throw new Error('Invalid backup file: missing classes or students.')
  }
  return parsed
}

export function persistAppBackup(backup: AppDataBackup): void {
  saveClasses(ensureClassJoinCodes(backup.classes.map(normalizeClass)))
  saveStudents(backup.students)
  saveAttendance(backup.attendance)
  savePayments(backup.payments ?? [])
  saveJoinRequests(backup.joinRequests ?? [])
  saveAssignments(
    (backup.assignments ?? []).map((a) =>
      migrateAssignment(a as Parameters<typeof migrateAssignment>[0], backup.classes),
    ),
  )
  localStorage.setItem(
    STORAGE_KEYS.studentAccounts,
    JSON.stringify(backup.studentAccounts ?? []),
  )
  if (backup.user) {
    saveUser(backup.user)
  }
  logger.info('App backup imported', { exportedAt: backup.exportedAt })
}

export function registerStudentAccount(
  displayName: string,
  email: string,
): StudentAccount {
  const accounts = loadStudentAccounts()
  const existing = accounts.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
  )
  if (existing) {
    throw new Error('An account with this email already exists. Try signing in.')
  }
  const account: StudentAccount = {
    id: accounts.reduce((max, a) => Math.max(max, a.id), 0) + 1,
    email: email.trim().toLowerCase(),
    displayName: displayName.trim(),
    initials: getInitials(displayName),
  }
  saveStudentAccountRecord(account)
  return account
}

export function findStudentAccountByEmail(email: string): StudentAccount | undefined {
  const normalized = email.trim().toLowerCase()
  return loadStudentAccounts().find((a) => a.email === normalized)
}

export function clearAllLocalData(): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key)
  }
  logger.info('All local app data cleared')
}
