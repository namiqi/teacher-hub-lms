import { buildInitialLedger } from '../data/attendance'
import { INITIAL_ASSIGNMENTS } from '../data/assignments'
import { INITIAL_CLASSES } from '../data/classes'
import { INITIAL_STUDENTS } from '../data/students'
import { codeToClassKey, nameToClassKey } from './classKeys'
import { createDefaultWeeklySchedule, formatClassSchedule } from './classSchedule'
import type {
  Assignment,
  AttendanceLedger,
  AttendanceRow,
  AttendanceStatus,
  Class,
  Student,
  User,
} from '../types'

export const STORAGE_KEYS = {
  classes: 'hub-lms-classes',
  assignments: 'hub-lms-assignments',
  students: 'hub-lms-students',
  attendance: 'hub-lms-attendance',
  user: 'hub-lms-user',
  session: 'hub-lms-session',
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

    return {
      ...seed,
      ...classFields,
      classKey,
      status,
      studentIds,
      students: studentIds.length,
      weeklySchedule,
      location,
      schedule:
        c.schedule ||
        formatClassSchedule(weeklySchedule, location) ||
        seed?.schedule ||
        '',
    }
  })
}

export function loadClasses(): Class[] {
  const raw = readJson<LegacyClass[]>(STORAGE_KEYS.classes, INITIAL_CLASSES)
  const needsMigration = raw.some((c) => !c.classKey || !Array.isArray(c.studentIds))
  return needsMigration ? migrateClasses(raw) : raw
}

export function loadAssignments(): Assignment[] {
  return readJson(STORAGE_KEYS.assignments, INITIAL_ASSIGNMENTS)
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
      parentContact: s.parentContact ?? seed?.parentContact ?? '',
      grade: s.grade ?? seed?.grade ?? '',
      status,
      enrolledClasses: [...s.enrolledClasses],
      tokensByClass: { ...s.tokensByClass },
      tokenCapacityByClass: { ...(s.tokenCapacityByClass ?? {}) },
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
    parentContact: s.parentContact ?? seed?.parentContact ?? '',
    grade: s.grade ?? seed?.grade ?? '',
    status,
    initials: s.initials ?? seed?.initials ?? '',
    avatarColor: s.avatarColor ?? seed?.avatarColor ?? 'bg-blue-500',
    enrolledClasses,
    tokensByClass,
    tokenCapacityByClass,
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
  saveSession()
  return DEV_BYPASS_USER
}

export function loadSession(): boolean {
  return localStorage.getItem(STORAGE_KEYS.session) === 'active'
}

export function saveSession(): void {
  localStorage.setItem(STORAGE_KEYS.session, 'active')
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.session)
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
