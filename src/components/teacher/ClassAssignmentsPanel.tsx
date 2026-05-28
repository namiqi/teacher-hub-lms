import {
  ClipboardList,
  Megaphone,
  MoreVertical,
  Pencil,
  Plus,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  assignmentStatusLabel,
  assignmentStatusStyles,
  formatAssignmentDue,
  formatPostDate,
  isAnnouncement,
  postKindLabel,
  postKindStyles,
  postsForClass,
} from '../../lib/assignments'
import AnnouncementFormModal from '../modals/AnnouncementFormModal'
import AssignmentFormModal from '../modals/AssignmentFormModal'
import type {
  AnnouncementFormInput,
  Assignment,
  AssignmentFormInput,
  Class,
} from '../../types'

interface ClassAssignmentsPanelProps {
  cls: Class
  assignments: Assignment[]
  onSaveAssignment: (
    classKey: string,
    input: AssignmentFormInput,
    mode: 'draft' | 'publish',
    existingId?: string,
  ) => void
  onSaveAnnouncement: (
    classKey: string,
    input: AnnouncementFormInput,
    mode: 'draft' | 'publish',
    existingId?: string,
  ) => void
  onDeleteAssignment: (assignmentId: string) => void
}

function PostMoreMenu({
  title,
  onDelete,
}: {
  title: string
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete "${title}"?\n\nThis cannot be undone.`,
    )
    if (confirmed) onDelete()
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        aria-label="More actions"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[8.5rem] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            className="w-full px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
          >
            Delete…
          </button>
        </div>
      )}
    </div>
  )
}

export default function ClassAssignmentsPanel({
  cls,
  assignments,
  onSaveAssignment,
  onSaveAnnouncement,
  onDeleteAssignment,
}: ClassAssignmentsPanelProps) {
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [assignmentFormOpen, setAssignmentFormOpen] = useState(false)
  const [announcementFormOpen, setAnnouncementFormOpen] = useState(false)
  const [editing, setEditing] = useState<Assignment | null>(null)
  const createMenuRef = useRef<HTMLDivElement>(null)

  const classPosts = postsForClass(assignments, cls.classKey)

  useEffect(() => {
    if (!createMenuOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setCreateMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [createMenuOpen])

  const openCreateAssignment = () => {
    setEditing(null)
    setCreateMenuOpen(false)
    setAssignmentFormOpen(true)
  }

  const openCreateAnnouncement = () => {
    setEditing(null)
    setCreateMenuOpen(false)
    setAnnouncementFormOpen(true)
  }

  const openEdit = (post: Assignment) => {
    setEditing(post)
    if (isAnnouncement(post)) {
      setAnnouncementFormOpen(true)
    } else {
      setAssignmentFormOpen(true)
    }
  }

  return (
    <>
      <div className="relative mb-3 sm:mb-4" ref={createMenuRef}>
        <button
          type="button"
          onClick={() => setCreateMenuOpen((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#185560] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#134851] active:scale-[0.99] sm:py-4 sm:text-base"
          aria-expanded={createMenuOpen}
          aria-haspopup="menu"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          Create post
        </button>
        {createMenuOpen && (
          <div
            role="menu"
            className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
              <button
                type="button"
                role="menuitem"
                onClick={openCreateAssignment}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50"
              >
                <ClipboardList className="h-4 w-4 text-slate-500" />
                Assignment
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={openCreateAnnouncement}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50"
              >
                <Megaphone className="h-4 w-4 text-slate-500" />
                Announcement
              </button>
            </div>
          )}
      </div>

      {classPosts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center sm:px-6 sm:py-14">
          <ClipboardList
            className="mx-auto h-9 w-9 text-slate-300 sm:h-10 sm:w-10"
            strokeWidth={1.5}
          />
          <p className="mt-3 font-medium text-slate-800">Nothing here yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Post an announcement or assignment for your class.
          </p>
        </div>
      ) : (
        <ul className="space-y-2 sm:space-y-3">
          {classPosts.map((post) => {
            const kind = post.kind ?? 'assignment'
            return (
              <li
                key={post.id}
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{post.title}</h3>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset sm:text-xs ${postKindStyles(kind)}`}
                      >
                        {postKindLabel(kind)}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset sm:text-xs ${assignmentStatusStyles(post.status)}`}
                      >
                        {assignmentStatusLabel(post.status, post)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                      {isAnnouncement(post)
                        ? `Posted ${formatPostDate(post.createdAt)}`
                        : `Due ${formatAssignmentDue(post.dueAt)}`}
                    </p>
                    {post.description && (
                      <p className="mt-1.5 line-clamp-2 text-xs text-slate-600 sm:mt-2 sm:text-sm">
                        {post.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(post)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <PostMoreMenu
                      title={post.title}
                      onDelete={() => onDeleteAssignment(post.id)}
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <AssignmentFormModal
        isOpen={assignmentFormOpen}
        className={cls.name}
        assignment={editing && !isAnnouncement(editing) ? editing : null}
        onClose={() => {
          setAssignmentFormOpen(false)
          setEditing(null)
        }}
        onSaveDraft={(input) =>
          onSaveAssignment(cls.classKey, input, 'draft', editing?.id)
        }
        onPublish={(input) =>
          onSaveAssignment(cls.classKey, input, 'publish', editing?.id)
        }
      />

      <AnnouncementFormModal
        isOpen={announcementFormOpen}
        className={cls.name}
        announcement={editing && isAnnouncement(editing) ? editing : null}
        onClose={() => {
          setAnnouncementFormOpen(false)
          setEditing(null)
        }}
        onSaveDraft={(input) =>
          onSaveAnnouncement(cls.classKey, input, 'draft', editing?.id)
        }
        onPublish={(input) =>
          onSaveAnnouncement(cls.classKey, input, 'publish', editing?.id)
        }
      />
    </>
  )
}
