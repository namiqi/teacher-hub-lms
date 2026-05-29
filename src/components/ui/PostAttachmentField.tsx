import { FileText, Paperclip, X } from 'lucide-react'
import { useRef } from 'react'
import {
  ALLOWED_SUBMISSION_EXTENSIONS,
  validateSubmissionFiles,
} from '../../lib/submissions/constants'
import type { PostAttachment } from '../../types'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface PostAttachmentFieldProps {
  existing?: PostAttachment
  pendingFile: File | null
  onPendingFileChange: (file: File | null) => void
  removeExisting: boolean
  onRemoveExistingChange: (remove: boolean) => void
  disabled?: boolean
  cloudRequired?: boolean
}

export default function PostAttachmentField({
  existing,
  pendingFile,
  onPendingFileChange,
  removeExisting,
  onRemoveExistingChange,
  disabled = false,
  cloudRequired = false,
}: PostAttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const showExisting = existing && !removeExisting && !pendingFile

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const err = validateSubmissionFiles([file])
    if (err) {
      window.alert(err)
      return
    }
    onPendingFileChange(file)
    onRemoveExistingChange(false)
  }

  return (
    <div className="block">
      <span className="text-sm font-medium text-slate-700">
        Attachment (optional)
      </span>
      <p className="mt-0.5 text-xs text-slate-400">
        PDF, PNG, JPEG, or Word — max 10 MB
        {cloudRequired ? ' · requires hosted app' : ''}
      </p>

      {showExisting && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
            {existing.fileName}
          </span>
          <span className="shrink-0 text-xs text-slate-400">
            {formatFileSize(existing.sizeBytes)}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={() => onRemoveExistingChange(true)}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              aria-label="Remove attachment"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {pendingFile && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <Paperclip className="h-4 w-4 shrink-0 text-emerald-700" />
          <span className="min-w-0 flex-1 truncate text-sm text-emerald-900">
            {pendingFile.name}
          </span>
          <span className="shrink-0 text-xs text-emerald-700">
            {formatFileSize(pendingFile.size)}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={() => onPendingFileChange(null)}
              className="rounded p-1 text-emerald-600 hover:bg-emerald-100"
              aria-label="Clear selected file"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {!disabled && !pendingFile && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-[#185560]/40 hover:bg-slate-50"
        >
          <Paperclip className="h-4 w-4" />
          {showExisting ? 'Replace file' : 'Choose file'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_SUBMISSION_EXTENSIONS}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
