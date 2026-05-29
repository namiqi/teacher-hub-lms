import { isSupabaseConfigured } from './client'
import { getSupabase } from './client'

export interface StudentSeenState {
  lastVisitAt: string | null
  seenGradedSubmissionIds: string[]
  seenApprovedRequestIds: string[]
}

const emptySeen = (): StudentSeenState => ({
  lastVisitAt: null,
  seenGradedSubmissionIds: [],
  seenApprovedRequestIds: [],
})

const LOCAL_PREFIX = 'hub-student-seen-'

function localKey(accountId: number): string {
  return `${LOCAL_PREFIX}${accountId}`
}

function readLocal(accountId: number): StudentSeenState {
  try {
    const raw = localStorage.getItem(localKey(accountId))
    if (!raw) return emptySeen()
    const parsed = JSON.parse(raw) as Partial<StudentSeenState>
    return {
      lastVisitAt: parsed.lastVisitAt ?? null,
      seenGradedSubmissionIds: parsed.seenGradedSubmissionIds ?? [],
      seenApprovedRequestIds: parsed.seenApprovedRequestIds ?? [],
    }
  } catch {
    return emptySeen()
  }
}

function writeLocal(accountId: number, state: StudentSeenState): void {
  localStorage.setItem(localKey(accountId), JSON.stringify(state))
}

function parseRow(row: {
  last_visit_at: string | null
  seen_graded_submission_ids: unknown
  seen_approved_request_ids: unknown
}): StudentSeenState {
  return {
    lastVisitAt: row.last_visit_at,
    seenGradedSubmissionIds: Array.isArray(row.seen_graded_submission_ids)
      ? (row.seen_graded_submission_ids as string[])
      : [],
    seenApprovedRequestIds: Array.isArray(row.seen_approved_request_ids)
      ? (row.seen_approved_request_ids as string[])
      : [],
  }
}

export async function fetchStudentSeenState(params: {
  studentUserId?: string | null
  accountId: number
}): Promise<StudentSeenState> {
  const { studentUserId, accountId } = params
  if (!studentUserId || !isSupabaseConfigured()) {
    return readLocal(accountId)
  }

  const { data, error } = await getSupabase()
    .from('student_portal_state')
    .select(
      'last_visit_at, seen_graded_submission_ids, seen_approved_request_ids',
    )
    .eq('user_id', studentUserId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return emptySeen()
  return parseRow(data)
}

async function upsertCloud(
  studentUserId: string,
  state: StudentSeenState,
): Promise<void> {
  const { error } = await getSupabase().from('student_portal_state').upsert({
    user_id: studentUserId,
    last_visit_at: state.lastVisitAt,
    seen_graded_submission_ids: state.seenGradedSubmissionIds,
    seen_approved_request_ids: state.seenApprovedRequestIds,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(error.message)
}

export async function saveStudentSeenState(params: {
  studentUserId?: string | null
  accountId: number
  state: StudentSeenState
}): Promise<void> {
  const { studentUserId, accountId, state } = params
  if (!studentUserId || !isSupabaseConfigured()) {
    writeLocal(accountId, state)
    return
  }
  await upsertCloud(studentUserId, state)
}

export async function markPortalVisited(params: {
  studentUserId?: string | null
  accountId: number
  current: StudentSeenState
}): Promise<StudentSeenState> {
  const next = {
    ...params.current,
    lastVisitAt: new Date().toISOString(),
  }
  await saveStudentSeenState({
    studentUserId: params.studentUserId,
    accountId: params.accountId,
    state: next,
  })
  return next
}

export async function markGradedSubmissionSeen(params: {
  studentUserId?: string | null
  accountId: number
  current: StudentSeenState
  submissionId: string
}): Promise<StudentSeenState> {
  if (params.current.seenGradedSubmissionIds.includes(params.submissionId)) {
    return params.current
  }
  const next = {
    ...params.current,
    seenGradedSubmissionIds: [
      ...params.current.seenGradedSubmissionIds,
      params.submissionId,
    ],
  }
  await saveStudentSeenState({
    studentUserId: params.studentUserId,
    accountId: params.accountId,
    state: next,
  })
  return next
}

export async function markJoinApprovedSeen(params: {
  studentUserId?: string | null
  accountId: number
  current: StudentSeenState
  requestId: string
}): Promise<StudentSeenState> {
  if (params.current.seenApprovedRequestIds.includes(params.requestId)) {
    return params.current
  }
  const next = {
    ...params.current,
    seenApprovedRequestIds: [
      ...params.current.seenApprovedRequestIds,
      params.requestId,
    ],
  }
  await saveStudentSeenState({
    studentUserId: params.studentUserId,
    accountId: params.accountId,
    state: next,
  })
  return next
}
