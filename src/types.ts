export interface ClassDaySchedule {
  day: string
  enabled: boolean
  time: string
}

export type ClassStatus = 'active' | 'archived'

export interface Class {
  id: number
  classKey: string
  name: string
  status: ClassStatus
  students: number
  schedule: string
  color: string
  studentIds: number[]
  weeklySchedule: ClassDaySchedule[]
  location: string
}

export interface ManageClassUpdate {
  studentIds: number[]
  weeklySchedule: ClassDaySchedule[]
  location: string
}

export interface CreateClassInput {
  name: string
}

export type AssignmentStatus = 'active' | 'grading' | 'closed'

export interface Assignment {
  id: number
  title: string
  className: string
  dueDate: string
  submitted: number
  total: number
  status: AssignmentStatus
}

export type StudentStatus = 'active' | 'archived'

export interface Student {
  id: number
  name: string
  email: string
  parentContact: string
  grade: string
  status: StudentStatus
  initials: string
  avatarColor: string
  enrolledClasses: string[]
  tokensByClass: Record<string, number>
  tokenCapacityByClass: Record<string, number>
}

export interface CreateStudentInput {
  name: string
  parentContact: string
  grade: string
  classKey: string
}

export interface User {
  name: string
  email: string
  initials: string
  role: string
  isAuthenticated: boolean
}

export type AttendanceStatus = 'present' | 'excused' | 'absent' | 'unset'

export interface AttendanceColumn {
  id: string
  label: string
  dateKey: string
}

/** @deprecated Legacy row shape — used only when migrating old localStorage */
export interface AttendanceRow {
  studentId: number
  name: string
  tokensLeft: number
  records: Record<string, AttendanceStatus>
}

export interface AttendanceLedger {
  columns: AttendanceColumn[]
  /** classKey → studentId → dateKey → status */
  recordsByClass: Record<string, Record<number, Record<string, AttendanceStatus>>>
}

export type AppView = 'landing' | 'login' | 'signup' | 'dashboard'

export type TabId =
  | 'overview'
  | 'classes'
  | 'attendance'
  | 'students'
  | 'settings'

export const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  classes: 'My Classes',
  attendance: 'Attendance',
  students: 'Students',
  settings: 'Settings',
}

export const HEADER_TITLES: Record<TabId, string> = {
  overview: 'Dashboard Overview',
  classes: 'My Classes',
  attendance: 'Attendance Ledger',
  students: 'Student Directory',
  settings: 'Account Settings',
}

export type TopUpPackage = 'standard' | 'intensive' | 'custom'
