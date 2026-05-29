export interface ClassDaySchedule {
  day: string
  enabled: boolean
  time: string
}

export type ClassStatus = 'active' | 'archived'

/** Prepaid = lesson credits; monthly = flat fee per month (no token deduction). */
export type ClassBillingMode = 'prepaid' | 'monthly'

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
  billingMode?: ClassBillingMode
  /** Optional reference amount for monthly classes (display only). */
  monthlyFee?: number
  /** Shareable code students enter to request joining (teacher approves). */
  joinCode?: string
}

export interface ManageClassUpdate {
  name: string
  studentIds: number[]
  weeklySchedule: ClassDaySchedule[]
  location: string
  billingMode: ClassBillingMode
  monthlyFee?: number
}

export interface CreateClassInput {
  name: string
  billingMode?: ClassBillingMode
  monthlyFee?: number
}

export type AssignmentStatus = 'draft' | 'published' | 'closed'

export type ClassPostKind = 'assignment' | 'announcement'

/** Optional file attached to an assignment or announcement (Supabase Storage). */
export interface PostAttachment {
  storagePath: string
  fileName: string
  mimeType: string
  sizeBytes: number
}

export interface Assignment {
  id: string
  classKey: string
  kind?: ClassPostKind
  title: string
  description: string
  dueAt: string
  createdAt: string
  status: AssignmentStatus
  /** Optional worksheet / Drive link */
  resourceLink?: string
  /** Optional uploaded file (PDF, image, Word). */
  attachment?: PostAttachment
  /** Max score when graded (assignments only). */
  maxPoints?: number
  /** Whether students may submit after the due date. */
  allowLateSubmissions?: boolean
  /** Extra submits after the first (0 = one attempt only). */
  maxResubmissions?: number
}

export interface AssignmentFormInput {
  /** Set when creating a new post so storage path matches saved id. */
  id?: string
  title: string
  description: string
  dueAt: string
  resourceLink?: string
  attachment?: PostAttachment
  maxPoints: number
  allowLateSubmissions: boolean
  maxResubmissions: number
}

export type AssignmentSubmissionStatus = 'submitted' | 'reviewed'

export interface SubmissionFile {
  id: string
  storagePath: string
  fileName: string
  mimeType: string
  sizeBytes: number
  sortOrder: number
}

export interface AssignmentSubmission {
  id: string
  assignmentId: string
  teacherId: string
  classKey: string
  studentUserId: string
  studentId: number
  note?: string
  attemptNumber: number
  isLate: boolean
  maxPoints: number
  status: AssignmentSubmissionStatus
  score?: number
  feedback?: string
  submittedAt: string
  reviewedAt?: string
  files: SubmissionFile[]
}

/** Per-class enrollment for cloud students (uploads need teacher id). */
export interface ClassEnrollment {
  teacherId: string
  classKey: string
  studentId: number
}

export interface AnnouncementFormInput {
  id?: string
  title: string
  description: string
  resourceLink?: string
  attachment?: PostAttachment
}

export type TopUpPackage = 'standard' | 'intensive' | 'custom'

export type StudentStatus = 'active' | 'archived'

export interface Student {
  id: number
  name: string
  email: string
  studentPhone?: string
  parentPhone?: string
  grade?: string
  status: StudentStatus
  initials: string
  avatarColor: string
  enrolledClasses: string[]
  tokensByClass: Record<string, number>
  tokenCapacityByClass: Record<string, number>
  /** YYYY-MM through which monthly tuition is paid, per class */
  paidThroughMonthByClass?: Record<string, string>
  /** Set when roster row was linked via approved class join */
  studentAccountId?: number
}

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'

export interface JoinRequest {
  id: string
  classKey: string
  studentAccountId: number
  requestedName: string
  status: JoinRequestStatus
  createdAt: string
  reviewedAt?: string
  /** Set when using Supabase (auth user id of student). */
  studentUserId?: string
  /** Owning teacher — set when using Supabase. */
  teacherId?: string
}

export interface StudentAccount {
  id: number
  email: string
  displayName: string
  initials: string
  linkedStudentId?: number
}

export type PaymentRecordType = 'prepaid_topup' | 'monthly_fee'

export interface PaymentRecord {
  id: string
  studentId: number
  classKey: string
  createdAt: string
  type: PaymentRecordType
  lessonsAdded?: number
  packageType?: TopUpPackage
  paidMonthKey?: string
  amountDollars?: number
  paidUpfront: boolean
  note?: string
}

export interface AppDataBackup {
  version: 1 | 2
  exportedAt: string
  user: User | null
  classes: Class[]
  students: Student[]
  attendance: AttendanceLedger
  payments: PaymentRecord[]
  joinRequests?: JoinRequest[]
  studentAccounts?: StudentAccount[]
  assignments?: Assignment[]
}

export interface CreateStudentInput {
  name: string
  studentPhone?: string
  parentPhone?: string
  grade?: string
  classKey: string
  initialTokenBalance?: number
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

export type SessionRole = 'teacher' | 'student'

export type AppView =
  | 'landing'
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'student-login'
  | 'student-signup'
  | 'student-portal'

export type TabId =
  | 'overview'
  | 'classes'
  | 'assignments'
  | 'attendance'
  | 'students'
  | 'settings'

export const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  classes: 'My Classes',
  assignments: 'Assignments',
  attendance: 'Attendance',
  students: 'Students',
  settings: 'Settings',
}

export const HEADER_TITLES: Record<TabId, string> = {
  overview: 'Dashboard Overview',
  classes: 'My Classes',
  assignments: 'All Assignments',
  attendance: 'Attendance',
  students: 'Student Directory',
  settings: 'Account Settings',
}

export type StudentTabId = 'home' | 'classes'

export const STUDENT_TAB_LABELS: Record<StudentTabId, string> = {
  home: 'Home',
  classes: 'Classes',
}

export const STUDENT_HEADER_TITLES: Record<StudentTabId, string> = {
  home: 'Home',
  classes: 'My classes',
}
