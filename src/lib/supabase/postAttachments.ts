import {
  mimeFromFile,
  sanitizeStorageObjectName,
  validateSubmissionFiles,
} from '../submissions/constants'
import type { PostAttachment } from '../../types'
import { getSupabase } from './client'

export const POST_ATTACHMENT_BUCKET = 'post-attachments'

export function postAttachmentStoragePath(
  teacherId: string,
  classKey: string,
  postId: string,
  fileName: string,
): string {
  const safe = sanitizeStorageObjectName(fileName)
  const uuid = crypto.randomUUID()
  return `${teacherId}/${classKey}/${postId}/${uuid}-${safe}`
}

export async function uploadPostAttachment(
  teacherId: string,
  classKey: string,
  postId: string,
  file: File,
): Promise<PostAttachment> {
  const validation = validateSubmissionFiles([file])
  if (validation) throw new Error(validation)

  const mime = mimeFromFile(file)
  const storagePath = postAttachmentStoragePath(
    teacherId,
    classKey,
    postId,
    file.name,
  )

  const { error } = await getSupabase()
    .storage.from(POST_ATTACHMENT_BUCKET)
    .upload(storagePath, file, { upsert: false, contentType: mime })

  if (error) throw new Error(error.message)

  return {
    storagePath,
    fileName: file.name,
    mimeType: mime,
    sizeBytes: file.size,
  }
}

export async function deletePostAttachment(storagePath: string): Promise<void> {
  const { error } = await getSupabase()
    .storage.from(POST_ATTACHMENT_BUCKET)
    .remove([storagePath])
  if (error) {
    console.warn('[Teacher Hub] post attachment remove failed', error)
  }
}

export async function openPostAttachmentInNewTab(
  storagePath: string,
): Promise<void> {
  const { data, error } = await getSupabase()
    .storage.from(POST_ATTACHMENT_BUCKET)
    .createSignedUrl(storagePath, 3600, { download: false })

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Could not open file.')
  }
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
}

export async function resolvePostAttachmentForSave(params: {
  teacherUserId?: string | null
  classKey: string
  postId: string
  existing?: PostAttachment
  pendingFile: File | null
  removeExisting: boolean
}): Promise<PostAttachment | undefined> {
  const {
    teacherUserId,
    classKey,
    postId,
    existing,
    pendingFile,
    removeExisting,
  } = params

  if (removeExisting && existing) {
    if (teacherUserId) await deletePostAttachment(existing.storagePath)
    return undefined
  }

  if (pendingFile) {
    if (!teacherUserId) {
      throw new Error(
        'File uploads require the hosted app with Supabase configured.',
      )
    }
    return uploadPostAttachment(teacherUserId, classKey, postId, pendingFile)
  }

  return existing
}
