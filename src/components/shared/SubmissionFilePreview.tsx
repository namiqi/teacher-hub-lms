import { resolvePreviewMime } from '../../lib/submissions/constants'

interface SubmissionFilePreviewProps {
  url: string
  mimeType: string
  fileName: string
  onOpenInNewTab?: () => void
  className?: string
}

export default function SubmissionFilePreview({
  url,
  mimeType,
  fileName,
  onOpenInNewTab,
  className = 'h-72 w-full sm:h-96',
}: SubmissionFilePreviewProps) {
  const mime = resolvePreviewMime(mimeType, fileName)

  if (mime.startsWith('image/')) {
    return (
      <img
        src={url}
        alt={fileName}
        className={`${className} max-h-[28rem] rounded-lg border border-slate-200 bg-slate-50 object-contain`}
      />
    )
  }

  if (mime === 'application/pdf') {
    return (
      <div className="space-y-2">
        <object
          data={url}
          type="application/pdf"
          className={`${className} rounded-lg border border-slate-200 bg-white`}
        >
          <embed
            src={url}
            type="application/pdf"
            className={`${className} rounded-lg border border-slate-200`}
          />
        </object>
        {onOpenInNewTab && (
          <p className="text-center text-xs text-slate-500">
            PDF not showing?{' '}
            <button
              type="button"
              onClick={onOpenInNewTab}
              className="font-semibold text-[#185560] hover:underline"
            >
              Open in a new tab
            </button>
          </p>
        )}
      </div>
    )
  }

  return null
}
