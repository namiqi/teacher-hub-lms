import { ExternalLink, FileText } from 'lucide-react'
import { useState } from 'react'
import { openPostAttachmentInNewTab } from '../../lib/supabase/postAttachments'
import type { PostAttachment } from '../../types'

interface PostAttachmentLinkProps {
  attachment: PostAttachment
}

export default function PostAttachmentLink({ attachment }: PostAttachmentLinkProps) {
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = async () => {
    setError(null)
    setOpening(true)
    try {
      await openPostAttachmentInNewTab(attachment.storagePath)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open file.')
    } finally {
      setOpening(false)
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-800">Attachment</h2>
      <button
        type="button"
        onClick={() => void handleOpen()}
        disabled={opening}
        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="truncate">{attachment.fileName}</span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
      </button>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  )
}
