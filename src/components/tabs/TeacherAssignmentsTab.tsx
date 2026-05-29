import { BookOpen, ClipboardList, Inbox, Pencil } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchUnreviewedCountsByAssignment } from '../../lib/supabase/submissions'
import {
  assignmentStatusLabel,
  assignmentStatusStyles,
  formatAssignmentDue,
  formatPostDate,
  isAnnouncement,
  postKindLabel,
  postKindStyles,
} from '../../lib/assignments'
import { classNameForKey } from '../../lib/studentTokens'
import AnnouncementFormModal from '../modals/AnnouncementFormModal'
import AssignmentFormModal from '../modals/AssignmentFormModal'
import EmptyState from '../ui/EmptyState'
import TeacherAssignmentSubmissionsPanel from '../teacher/TeacherAssignmentSubmissionsPanel'
import type {
  AnnouncementFormInput,
  Assignment,
  AssignmentFormInput,
  Class,
  Student,
} from '../../types'

interface TeacherAssignmentsTabProps {
  assignments: Assignment[]
  classes: Class[]
  students: Student[]
  teacherUserId?: string | null
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
  onGoToClasses: () => void
  onSubmissionsReviewed?: () => void
}

export default function TeacherAssignmentsTab({
  assignments,
  classes,
  students,
  teacherUserId,
  onSaveAssignment,
  onSaveAnnouncement,
  onDeleteAssignment,
  onGoToClasses,
  onSubmissionsReviewed,
}: TeacherAssignmentsTabProps) {
  const [editing, setEditing] = useState<Assignment | null>(null)
  const [assignmentFormOpen, setAssignmentFormOpen] = useState(false)
  const [announcementFormOpen, setAnnouncementFormOpen] = useState(false)
  const [submissionsFor, setSubmissionsFor] = useState<Assignment | null>(null)
  const [unreviewedCounts, setUnreviewedCounts] = useState<Record<string, number>>(
    {},
  )

  const activeClassKeys = useMemo(
    () => new Set(classes.filter((c) => c.status === 'active').map((c) => c.classKey)),
    [classes],
  )

  const sorted = useMemo(
    () =>
      [...assignments]
        .filter((a) => activeClassKeys.has(a.classKey))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [assignments, activeClassKeys],
  )

  const gradableAssignmentIds = useMemo(
    () =>
      sorted
        .filter((p) => !isAnnouncement(p) && p.status !== 'draft')
        .map((p) => p.id),
    [sorted],
  )

  const refreshUnreviewedCounts = useCallback(() => {
    if (!teacherUserId || gradableAssignmentIds.length === 0) {
      setUnreviewedCounts({})
      return
    }
    void fetchUnreviewedCountsByAssignment(teacherUserId, gradableAssignmentIds)
      .then(setUnreviewedCounts)
      .catch(() => setUnreviewedCounts({}))
  }, [teacherUserId, gradableAssignmentIds])

  useEffect(() => {
    refreshUnreviewedCounts()
  }, [refreshUnreviewedCounts])

  const studentsForClass = useCallback(
    (classKey: string) => {
      const cls = classes.find((c) => c.classKey === classKey)
      if (!cls) return []
      const idSet = new Set(cls.studentIds)
      return students.filter((s) => idSet.has(s.id))
    },
    [classes, students],
  )

  const openEdit = (post: Assignment) => {
    setEditing(post)
    if (isAnnouncement(post)) {
      setAnnouncementFormOpen(true)
    } else {
      setAssignmentFormOpen(true)
    }
  }

  const editingClassName = editing
    ? classNameForKey(classes, editing.classKey)
    : ''

  const totalUnreviewed = useMemo(
    () => Object.values(unreviewedCounts).reduce((sum, n) => sum + n, 0),
    [unreviewedCounts],
  )

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No posts yet"
        description="Create an assignment or announcement from a class workspace."
        action={{ label: 'Go to My Classes', onClick: onGoToClasses }}
      />
    )
  }

  return (
    <>
      <p className="mb-4 text-sm text-slate-500">
        All posts across your classes.
        {totalUnreviewed > 0 && (
          <span className="ml-1 font-medium text-rose-600">
            · {totalUnreviewed} submission{totalUnreviewed === 1 ? '' : 's'} need
            grading
          </span>
        )}
      </p>
      <ul className="space-y-2 sm:space-y-3">
        {sorted.map((post) => {
          const kind = post.kind ?? 'assignment'
          const unreviewed = unreviewedCounts[post.id] ?? 0
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
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 sm:text-sm">
                    <span className="inline-flex items-center gap-1 font-medium text-[#185560]">
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      {classNameForKey(classes, post.classKey)}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span>
                      {isAnnouncement(post)
                        ? `Posted ${formatPostDate(post.createdAt)}`
                        : `Due ${formatAssignmentDue(post.dueAt)}`}
                    </span>
                    {post.attachment && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span>Has attachment</span>
                      </>
                    )}
                  </p>
                  {post.description ? (
                    <p className="mt-2 line-clamp-2 text-xs text-slate-600 sm:text-sm">
                      {post.description}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs italic text-slate-400">
                      No description
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!isAnnouncement(post) &&
                    teacherUserId &&
                    post.status !== 'draft' && (
                      <button
                        type="button"
                        onClick={() => setSubmissionsFor(post)}
                        className="relative inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Inbox className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Submissions</span>
                        {unreviewed > 0 && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                            {unreviewed > 9 ? '9+' : unreviewed}
                          </span>
                        )}
                      </button>
                    )}
                  <button
                    type="button"
                    onClick={() => openEdit(post)}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <AssignmentFormModal
        isOpen={assignmentFormOpen}
        className={editingClassName}
        classKey={editing?.classKey ?? ''}
        teacherUserId={teacherUserId}
        assignment={editing && !isAnnouncement(editing) ? editing : null}
        onClose={() => {
          setAssignmentFormOpen(false)
          setEditing(null)
        }}
        onSaveDraft={(input) => {
          if (!editing) return
          onSaveAssignment(editing.classKey, input, 'draft', editing.id)
        }}
        onPublish={(input) => {
          if (!editing) return
          onSaveAssignment(editing.classKey, input, 'publish', editing.id)
        }}
        onDelete={
          editing && !isAnnouncement(editing)
            ? () => {
                onDeleteAssignment(editing.id)
                setAssignmentFormOpen(false)
                setEditing(null)
              }
            : undefined
        }
      />

      <AnnouncementFormModal
        isOpen={announcementFormOpen}
        className={editingClassName}
        classKey={editing?.classKey ?? ''}
        teacherUserId={teacherUserId}
        announcement={editing && isAnnouncement(editing) ? editing : null}
        onClose={() => {
          setAnnouncementFormOpen(false)
          setEditing(null)
        }}
        onSaveDraft={(input) => {
          if (!editing) return
          onSaveAnnouncement(editing.classKey, input, 'draft', editing.id)
        }}
        onPublish={(input) => {
          if (!editing) return
          onSaveAnnouncement(editing.classKey, input, 'publish', editing.id)
        }}
        onDelete={
          editing && isAnnouncement(editing)
            ? () => {
                onDeleteAssignment(editing.id)
                setAnnouncementFormOpen(false)
                setEditing(null)
              }
            : undefined
        }
      />

      {submissionsFor && teacherUserId && (
        <TeacherAssignmentSubmissionsPanel
          assignment={submissionsFor}
          students={studentsForClass(submissionsFor.classKey)}
          teacherUserId={teacherUserId}
          onClose={() => {
            setSubmissionsFor(null)
            refreshUnreviewedCounts()
            onSubmissionsReviewed?.()
          }}
          onReviewed={() => {
            refreshUnreviewedCounts()
            onSubmissionsReviewed?.()
          }}
        />
      )}
    </>
  )
}
