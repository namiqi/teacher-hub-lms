import { normalizeJoinCodeInput } from '../joinCodes'
import type { Class, JoinRequest, StudentAccount } from '../../types'
import { getSupabase } from './client'

export async function fetchStudentProfile(
  userId: string,
): Promise<StudentAccount | null> {
  const { data, error } = await getSupabase()
    .from('student_profiles')
    .select('legacy_account_id, display_name, email, initials, linked_student_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: Number(data.legacy_account_id),
    email: data.email,
    displayName: data.display_name,
    initials: data.initials,
    linkedStudentId: data.linked_student_id ?? undefined,
  }
}

export async function findClassByJoinCodeRemote(
  codeInput: string,
): Promise<{ cls: Class; teacherId: string } | null> {
  const normalized = normalizeJoinCodeInput(codeInput)
  const { data: codeRow, error } = await getSupabase()
    .from('class_join_codes')
    .select('teacher_id, class_key')
    .eq('join_code', normalized)
    .maybeSingle()

  if (error || !codeRow) return null

  const { data: wsRow, error: wsError } = await getSupabase()
    .from('teacher_workspaces')
    .select('workspace')
    .eq('teacher_id', codeRow.teacher_id)
    .maybeSingle()

  if (wsError || !wsRow?.workspace) return null

  const classes = (wsRow.workspace as { classes?: Class[] }).classes ?? []
  const cls = classes.find(
    (c) =>
      c.classKey === codeRow.class_key &&
      c.status === 'active',
  )
  if (!cls) return null

  return { cls, teacherId: codeRow.teacher_id }
}

export async function canSubmitJoinRequestRemote(
  studentUserId: string,
  _account: StudentAccount,
  classKey: string,
  teacherId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { data: enrollment } = await getSupabase()
    .from('student_enrollments')
    .select('id')
    .eq('student_user_id', studentUserId)
    .eq('teacher_id', teacherId)
    .eq('class_key', classKey)
    .maybeSingle()

  if (enrollment) {
    return { ok: false, reason: 'You are already in this class.' }
  }

  const { data: pending } = await getSupabase()
    .from('join_requests')
    .select('id')
    .eq('student_user_id', studentUserId)
    .eq('teacher_id', teacherId)
    .eq('class_key', classKey)
    .eq('status', 'pending')
    .maybeSingle()

  if (pending) {
    return { ok: false, reason: 'You already have a pending request for this class.' }
  }

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
  const { count } = await getSupabase()
    .from('join_requests')
    .select('id', { count: 'exact', head: true })
    .eq('student_user_id', studentUserId)
    .eq('status', 'pending')
    .gte('created_at', oneMinuteAgo)

  if ((count ?? 0) >= 3) {
    return {
      ok: false,
      reason: 'Please wait a minute before submitting more join requests.',
    }
  }

  return { ok: true }
}

export async function insertJoinRequestRemote(request: JoinRequest): Promise<void> {
  const { error } = await getSupabase().from('join_requests').insert({
    id: request.id,
    teacher_id: request.teacherId!,
    class_key: request.classKey,
    student_user_id: request.studentUserId!,
    student_account_id: request.studentAccountId,
    requested_name: request.requestedName,
    status: request.status,
    created_at: request.createdAt,
  })
  if (error) throw new Error(error.message)
}

export async function fetchJoinRequestsForStudent(
  userId: string,
): Promise<JoinRequest[]> {
  const { data, error } = await getSupabase()
    .from('join_requests')
    .select('*')
    .eq('student_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => ({
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
}

export type StudentPortalData = {
  joinRequests: JoinRequest[]
  classes: Class[]
  students: import('../../types').Student[]
  assignments: import('../../types').Assignment[]
  payments: import('../../types').PaymentRecord[]
  attendance: import('../../types').AttendanceLedger
}

export async function fetchStudentPortalData(
  userId: string,
  account: StudentAccount,
): Promise<StudentPortalData> {
  const joinRequests = await fetchJoinRequestsForStudent(userId)

  const { data: enrollments, error: enrollError } = await getSupabase()
    .from('student_enrollments')
    .select('teacher_id, class_key, student_id')
    .eq('student_user_id', userId)

  if (enrollError) throw new Error(enrollError.message)

  const classes: Class[] = []
  const students: import('../../types').Student[] = []
  const assignments: import('../../types').Assignment[] = []
  const payments: import('../../types').PaymentRecord[] = []
  let attendance: import('../../types').AttendanceLedger = {
    columns: [],
    recordsByClass: {},
  }

  const teacherIds = [...new Set((enrollments ?? []).map((e) => e.teacher_id))]

  for (const teacherId of teacherIds) {
    const { data: wsRow } = await getSupabase()
      .from('teacher_workspaces')
      .select('workspace')
      .eq('teacher_id', teacherId)
      .maybeSingle()

    if (!wsRow?.workspace) continue
    const w = wsRow.workspace as {
      classes?: Class[]
      students?: import('../../types').Student[]
      assignments?: import('../../types').Assignment[]
      payments?: import('../../types').PaymentRecord[]
      attendance?: import('../../types').AttendanceLedger
    }

    const enrolledKeys = new Set(
      (enrollments ?? [])
        .filter((e) => e.teacher_id === teacherId)
        .map((e) => e.class_key),
    )

    for (const c of w.classes ?? []) {
      if (enrolledKeys.has(c.classKey)) classes.push(c)
    }

    const myStudentIds = new Set(
      (enrollments ?? [])
        .filter((e) => e.teacher_id === teacherId)
        .map((e) => e.student_id),
    )

    for (const s of w.students ?? []) {
      if (myStudentIds.has(s.id)) students.push(s)
    }

    for (const a of w.assignments ?? []) {
      if (enrolledKeys.has(a.classKey)) assignments.push(a)
    }

    for (const p of w.payments ?? []) {
      if (myStudentIds.has(p.studentId)) payments.push(p)
    }

    if (w.attendance) {
      attendance = {
        columns: w.attendance.columns?.length
          ? w.attendance.columns
          : attendance.columns,
        recordsByClass: {
          ...attendance.recordsByClass,
          ...w.attendance.recordsByClass,
        },
      }
    }
  }

  if (students.length === 0 && account.linkedStudentId) {
    // pending approval only — no enrollments yet
  }

  return {
    joinRequests,
    classes,
    students,
    assignments,
    payments,
    attendance,
  }
}
