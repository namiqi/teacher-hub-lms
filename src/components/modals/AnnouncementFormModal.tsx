import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AnnouncementFormInput, Assignment } from '../../types'

interface AnnouncementFormModalProps {
  isOpen: boolean
  className: string
  announcement?: Assignment | null
  onClose: () => void
  onSaveDraft: (input: AnnouncementFormInput) => void
  onPublish: (input: AnnouncementFormInput) => void
  onDelete?: () => void
}

export default function AnnouncementFormModal({
  isOpen,
  className,
  announcement,
  onClose,
  onSaveDraft,
  onPublish,
  onDelete,
}: AnnouncementFormModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [resourceLink, setResourceLink] = useState('')

  const isEdit = Boolean(announcement)

  useEffect(() => {
    if (!isOpen) return
    if (announcement) {
      setTitle(announcement.title)
      setDescription(announcement.description)
      setResourceLink(announcement.resourceLink ?? '')
    } else {
      setTitle('')
      setDescription('')
      setResourceLink('')
    }
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, announcement])

  if (!isOpen) return null

  const buildInput = (): AnnouncementFormInput | null => {
    const trimmed = title.trim()
    if (!trimmed) return null
    return {
      title: trimmed,
      description: description.trim(),
      resourceLink: resourceLink.trim() || undefined,
    }
  }

  const handleDraft = () => {
    const input = buildInput()
    if (!input) return
    onSaveDraft(input)
    onClose()
  }

  const handlePublish = () => {
    const input = buildInput()
    if (!input) return
    onPublish(input)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? 'Edit announcement' : 'New announcement'}
            </h2>
            <p className="text-sm text-slate-500">{className}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Title *</span>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#185560] focus:outline-none focus:ring-2 focus:ring-[#185560]/20"
              placeholder="e.g. Class cancelled Friday"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Message</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#185560] focus:outline-none focus:ring-2 focus:ring-[#185560]/20"
              placeholder="What students should know…"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Link (optional)
            </span>
            <input
              type="url"
              value={resourceLink}
              onChange={(e) => setResourceLink(e.target.value)}
              placeholder="https://…"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#185560] focus:outline-none focus:ring-2 focus:ring-[#185560]/20"
            />
          </label>
        </form>

        <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4">
          {onDelete && announcement && (
            <button
              type="button"
              onClick={() => {
                const confirmed = window.confirm(
                  `Delete "${announcement.title}"?\n\nThis cannot be undone.`,
                )
                if (confirmed) onDelete()
              }}
              className="w-full rounded-lg border border-rose-200 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 sm:mr-auto sm:w-auto sm:border-0 sm:px-0 sm:py-0 sm:text-left sm:underline-offset-2 sm:hover:underline"
            >
              Delete announcement
            </button>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDraft}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={handlePublish}
              className="rounded-lg bg-[#185560] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#134851]"
            >
              {announcement?.status === 'published' ? 'Save & keep published' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
