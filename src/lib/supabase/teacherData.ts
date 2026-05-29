import { migrateAssignment } from '../assignments'
import { buildInitialLedger } from '../../data/attendance'
import { ensureClassJoinCodes, loadClasses as loadLocalClasses } from '../storage'
import { normalizeJoinCodeInput } from '../joinCodes'
import type {
  Assignment,
  AttendanceLedger,
  Class,
  JoinRequest,
  PaymentRecord,
  Student,
} from '../../types'
import { getSupabase } from './client'

export type TeacherWorkspaceData = {
  classes: Class[]
  students: Student[]
  attendance: AttendanceLedger
  payments: PaymentRecord[]
  assignments: Assignment[]
}

export type TeacherCloudState = TeacherWorkspaceData & {
  joinRequests: JoinRequest[]
}

const emptyWorkspace = (): TeacherWorkspaceData => ({
  classes: [],
  students: [],
  attendance: buildInitialLedger(),
  payments: [],
  assignments: [],
})

function parseWorkspace(raw: unknown): TeacherWorkspaceData {
  if (!raw || typeof raw !== 'object') return emptyWorkspace()
  const w = raw as Record<string, unknown>
  const classes = Array.isArray(w.classes) ? (w.classes as Class[]) : []
  const students = Array.isArray(w.students) ? (w.students as Student[]) : []
  const attendance =
    w.attendance && typeof w.attendance === 'object'
      ? (w.attendance as AttendanceLedger)
      : buildInitialLedger()
  const payments = Array.isArray(w.payments) ? (w.payments as PaymentRecord[]) : []
  const assignmentsRaw = Array.isArray(w.assignments) ? w.assignments : []
  const assignments = assignmentsRaw.map((a) =>
    migrateAssignment(a as Parameters<typeof migrateAssignment>[0], classes),
  )
  return {
    classes: ensureClassJoinCodes(classes),
    students,
    attendance,
    payments,
    assignments,
  }
}

export async function fetchTeacherWorkspace(
  teacherId: string,
): Promise<TeacherCloudState> {
  const supabase = getSupabase()

  const [{ data: wsRow, error: wsError }, { data: joinRows, error: joinError }] =
    await Promise.all([
      supabase
        .from('teacher_workspaces')
        .select('workspace')
        .eq('teacher_id', teacherId)
        .maybeSingle(),
      supabase
        .from('join_requests')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false }),
    ])

  if (wsError) throw new Error(wsError.message)
  if (joinError) throw new Error(joinError.message)

  const workspace = parseWorkspace(wsRow?.workspace)

  const joinRequests: JoinRequest[] = (joinRows ?? []).map((row) => ({
    id: row.id,
    classKey: row.class_key,
    studentAccountId: row.student_account_id,
    studentUserId: row.student_user_id,
    teacherId: row.teacher_id,
    requestedName: row.requested_name,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at ?? undefined,
  }))

  return { ...workspace, joinRequests }
}

export async function saveTeacherWorkspace(
  teacherId: string,
  data: TeacherWorkspaceData,
): Promise<void> {
  const supabase = getSupabase()
  const classes = ensureClassJoinCodes(data.classes)

  const { error: wsError } = await supabase.from('teacher_workspaces').upsert({
    teacher_id: teacherId,
    workspace: {
      classes,
      students: data.students,
      attendance: data.attendance,
      payments: data.payments,
      assignments: data.assignments,
    },
    updated_at: new Date().toISOString(),
  })
  if (wsError) throw new Error(wsError.message)

  await syncClassJoinCodes(teacherId, classes)
}

async function syncClassJoinCodes(teacherId: string, classes: Class[]): Promise<void> {
  const supabase = getSupabase()
  await supabase.from('class_join_codes').delete().eq('teacher_id', teacherId)

  const rows = classes
    .filter((c) => c.status === 'active' && c.joinCode)
    .map((c) => ({
      join_code: normalizeJoinCodeInput(c.joinCode!),
      teacher_id: teacherId,
      class_key: c.classKey,
    }))

  if (rows.length > 0) {
    const { error } = await supabase.from('class_join_codes').insert(rows)
    if (error) throw new Error(error.message)
  }
}

export async function upsertJoinRequestRow(
  teacherId: string,
  request: JoinRequest,
): Promise<void> {
  const { error } = await getSupabase().from('join_requests').upsert({
    id: request.id,
    teacher_id: teacherId,
    class_key: request.classKey,
    student_user_id: request.studentUserId!,
    student_account_id: request.studentAccountId,
    requested_name: request.requestedName,
    status: request.status,
    created_at: request.createdAt,
    reviewed_at: request.reviewedAt ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function updateJoinRequestStatus(
  requestId: string,
  status: JoinRequest['status'],
  reviewedAt?: string,
): Promise<void> {
  const { error } = await getSupabase()
    .from('join_requests')
    .update({
      status,
      reviewed_at: reviewedAt ?? new Date().toISOString(),
    })
    .eq('id', requestId)
  if (error) throw new Error(error.message)
}

export async function insertStudentEnrollment(
  studentUserId: string,
  teacherId: string,
  classKey: string,
  studentId: number,
): Promise<void> {
  const { error } = await getSupabase().from('student_enrollments').upsert({
    student_user_id: studentUserId,
    teacher_id: teacherId,
    class_key: classKey,
    student_id: studentId,
  })
  if (error) throw new Error(error.message)
}

export async function updateStudentProfileLink(
  userId: string,
  linkedStudentId: number,
  teacherId: string,
): Promise<void> {
  const { error } = await getSupabase()
    .from('student_profiles')
    .update({
      linked_student_id: linkedStudentId,
      primary_teacher_id: teacherId,
    })
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}

/** Fallback when teacher has no row yet — use local seed for dev migration */
export function getLocalFallbackWorkspace(): TeacherWorkspaceData {
  return {
    classes: loadLocalClasses(),
    students: [],
    attendance: buildInitialLedger(),
    payments: [],
    assignments: [],
  }
}
