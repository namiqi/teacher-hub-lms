import { mimeFromFile, SUBMISSION_BUCKET } from '../submissions/constants'
import { canSubmitAssignment } from '../submissions/rules'
import type {
  Assignment,
  AssignmentSubmission,
  AssignmentSubmissionStatus,
  SubmissionFile,
} from '../../types'
import { getSupabase } from './client'

type SubmissionRow = {
  id: string
  assignment_id: string
  teacher_id: string
  class_key: string
  student_user_id: string
  student_id: number
  note: string | null
  attempt_number: number
  is_late: boolean
  max_points: number
  status: AssignmentSubmissionStatus
  score: number | null
  feedback: string | null
  submitted_at: string
  reviewed_at: string | null
}

type FileRow = {
  id: string
  submission_id: string
  storage_path: string
  file_name: string
  mime_type: string
  size_bytes: number
  sort_order: number
}

function mapFile(row: FileRow): SubmissionFile {
  return {
    id: row.id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    sortOrder: row.sort_order,
  }
}

function mapSubmission(row: SubmissionRow, files: SubmissionFile[]): AssignmentSubmission {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    teacherId: row.teacher_id,
    classKey: row.class_key,
    studentUserId: row.student_user_id,
    studentId: row.student_id,
    note: row.note ?? undefined,
    attemptNumber: row.attempt_number,
    isLate: row.is_late,
    maxPoints: row.max_points,
    status: row.status,
    score: row.score != null ? Number(row.score) : undefined,
    feedback: row.feedback ?? undefined,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at ?? undefined,
    files,
  }
}

async function fetchFilesForSubmissions(
  submissionIds: string[],
): Promise<Map<string, SubmissionFile[]>> {
  const map = new Map<string, SubmissionFile[]>()
  if (submissionIds.length === 0) return map

  const { data, error } = await getSupabase()
    .from('submission_files')
    .select('*')
    .in('submission_id', submissionIds)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(error.message)

  for (const row of (data ?? []) as FileRow[]) {
    const list = map.get(row.submission_id) ?? []
    list.push(mapFile(row))
    map.set(row.submission_id, list)
  }
  return map
}

function storagePathForFile(
  teacherId: string,
  classKey: string,
  assignmentId: string,
  studentUserId: string,
  fileName: string,
): string {
  const safeName = fileName.replace(/[/\\]/g, '_').slice(0, 180)
  const id = crypto.randomUUID()
  return `${teacherId}/${classKey}/${assignmentId}/${studentUserId}/${id}_${safeName}`
}

async function removeSubmissionFiles(
  submissionId: string,
  paths: string[],
): Promise<void> {
  const supabase = getSupabase()
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(SUBMISSION_BUCKET)
      .remove(paths)
    if (storageError) {
      console.warn('[Teacher Hub] storage remove failed', storageError)
    }
  }
  const { error } = await supabase
    .from('submission_files')
    .delete()
    .eq('submission_id', submissionId)
  if (error) throw new Error(error.message)
}

export async function fetchMySubmission(
  assignmentId: string,
  studentUserId: string,
): Promise<AssignmentSubmission | null> {
  const { data, error } = await getSupabase()
    .from('assignment_submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_user_id', studentUserId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const filesMap = await fetchFilesForSubmissions([(data as SubmissionRow).id])
  return mapSubmission(
    data as SubmissionRow,
    filesMap.get((data as SubmissionRow).id) ?? [],
  )
}

export async function fetchSubmissionsForAssignment(
  teacherId: string,
  assignmentId: string,
): Promise<AssignmentSubmission[]> {
  const { data, error } = await getSupabase()
    .from('assignment_submissions')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false })

  if (error) throw new Error(error.message)
  const rows = (data ?? []) as SubmissionRow[]
  const filesMap = await fetchFilesForSubmissions(rows.map((r) => r.id))
  return rows.map((row) => mapSubmission(row, filesMap.get(row.id) ?? []))
}

export async function getSubmissionFileSignedUrl(
  storagePath: string,
  expiresIn = 3600,
): Promise<string> {
  const { data, error } = await getSupabase()
    .storage.from(SUBMISSION_BUCKET)
    .createSignedUrl(storagePath, expiresIn)

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Could not load file preview.')
  }
  return data.signedUrl
}

export async function submitAssignmentWork(params: {
  assignment: Assignment
  teacherId: string
  classKey: string
  studentUserId: string
  studentId: number
  note?: string
  files: File[]
}): Promise<AssignmentSubmission> {
  const { assignment, teacherId, classKey, studentUserId, studentId, note, files } =
    params
  const supabase = getSupabase()

  const existing = await fetchMySubmission(assignment.id, studentUserId)
  const gate = canSubmitAssignment(assignment, existing)
  if (!gate.ok) throw new Error(gate.reason)

  const maxPoints = assignment.maxPoints ?? 10
  const attemptNumber = existing ? existing.attemptNumber + 1 : 1
  const now = new Date().toISOString()

  let submissionId = existing?.id

  if (existing) {
    const oldPaths = existing.files.map((f) => f.storagePath)
    await removeSubmissionFiles(existing.id, oldPaths)

    const { error: updateError } = await supabase
      .from('assignment_submissions')
      .update({
        note: note?.trim() || null,
        attempt_number: attemptNumber,
        is_late: gate.isLate,
        max_points: maxPoints,
        status: 'submitted',
        score: null,
        feedback: null,
        reviewed_at: null,
        submitted_at: now,
      })
      .eq('id', existing.id)

    if (updateError) throw new Error(updateError.message)
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('assignment_submissions')
      .insert({
        assignment_id: assignment.id,
        teacher_id: teacherId,
        class_key: classKey,
        student_user_id: studentUserId,
        student_id: studentId,
        note: note?.trim() || null,
        attempt_number: attemptNumber,
        is_late: gate.isLate,
        max_points: maxPoints,
        status: 'submitted',
        submitted_at: now,
      })
      .select('*')
      .single()

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? 'Could not save submission.')
    }
    submissionId = (inserted as SubmissionRow).id
  }

  if (!submissionId) throw new Error('Submission id missing.')

  const fileInserts: {
    submission_id: string
    storage_path: string
    file_name: string
    mime_type: string
    size_bytes: number
    sort_order: number
  }[] = []
  const uploadedPaths: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const mime = mimeFromFile(file)
    const path = storagePathForFile(
      teacherId,
      classKey,
      assignment.id,
      studentUserId,
      file.name,
    )
    const { error: uploadError } = await supabase.storage
      .from(SUBMISSION_BUCKET)
      .upload(path, file, { upsert: false, contentType: mime })

    if (uploadError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(SUBMISSION_BUCKET).remove(uploadedPaths)
      }
      throw new Error(uploadError.message)
    }
    uploadedPaths.push(path)
    fileInserts.push({
      submission_id: submissionId,
      storage_path: path,
      file_name: file.name,
      mime_type: mime,
      size_bytes: file.size,
      sort_order: i,
    })
  }

  if (fileInserts.length > 0) {
    const { error: filesError } = await supabase.from('submission_files').insert(fileInserts)
    if (filesError) {
      await supabase.storage.from(SUBMISSION_BUCKET).remove(uploadedPaths)
      throw new Error(filesError.message)
    }
  }

  const refreshed = await fetchMySubmission(assignment.id, studentUserId)
  if (!refreshed) throw new Error('Submission saved but could not be loaded.')
  return refreshed
}

export async function saveSubmissionReview(params: {
  submissionId: string
  score: number
  feedback?: string
  maxPoints: number
}): Promise<void> {
  const { submissionId, score, feedback, maxPoints } = params
  if (score < 0 || score > maxPoints) {
    throw new Error(`Score must be between 0 and ${maxPoints}.`)
  }

  const { error } = await getSupabase()
    .from('assignment_submissions')
    .update({
      score,
      feedback: feedback?.trim() || null,
      status: 'reviewed',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', submissionId)

  if (error) throw new Error(error.message)
}
