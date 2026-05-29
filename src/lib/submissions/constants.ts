export const SUBMISSION_BUCKET = 'assignment-submissions'

export const MAX_SUBMISSION_FILES = 3
export const MAX_SUBMISSION_FILE_BYTES = 10 * 1024 * 1024

export const ALLOWED_SUBMISSION_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export const ALLOWED_SUBMISSION_EXTENSIONS =
  '.pdf,.png,.jpg,.jpeg,.doc,.docx'

export function isPreviewableMime(mime: string): boolean {
  return (
    mime === 'application/pdf' ||
    mime === 'image/png' ||
    mime === 'image/jpeg' ||
    mime === 'image/jpg'
  )
}

/** Safe object key segment for Supabase Storage (ASCII only, no spaces). */
export function sanitizeStorageObjectName(fileName: string): string {
  const trimmed = fileName.trim() || 'file'
  const dot = trimmed.lastIndexOf('.')
  const extRaw = dot >= 0 ? trimmed.slice(dot + 1) : ''
  const ext = extRaw.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 10)
  return ext ? `file.${ext}` : 'file'
}

export function mimeFromFile(file: File): string {
  if (file.type && ALLOWED_SUBMISSION_MIME.has(file.type)) return file.type
  const lower = file.name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.doc')) return 'application/msword'
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  return file.type || 'application/octet-stream'
}

export function validateSubmissionFiles(files: File[]): string | null {
  if (files.length === 0) return 'Add at least one file.'
  if (files.length > MAX_SUBMISSION_FILES) {
    return `You can upload up to ${MAX_SUBMISSION_FILES} files.`
  }
  for (const file of files) {
    if (file.size > MAX_SUBMISSION_FILE_BYTES) {
      return `"${file.name}" is too large (max 10 MB per file).`
    }
    const mime = mimeFromFile(file)
    if (!ALLOWED_SUBMISSION_MIME.has(mime)) {
      return `"${file.name}" is not an allowed type (PDF, PNG, JPEG, Word).`
    }
  }
  return null
}
