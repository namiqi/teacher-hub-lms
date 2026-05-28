import type {
  AnnouncementFormInput,
  Assignment,
  AssignmentFormInput,
  AssignmentStatus,
  Class,
  ClassPostKind,
} from '../types'

export type { AnnouncementFormInput, AssignmentFormInput }

export function isAnnouncement(post: Assignment): boolean {
  return post.kind === 'announcement'
}

export function postKindLabel(kind: ClassPostKind = 'assignment'): string {
  return kind === 'announcement' ? 'Announcement' : 'Assignment'
}

export function postKindStyles(kind: ClassPostKind = 'assignment'): string {
  return kind === 'announcement'
    ? 'bg-violet-50 text-violet-800 ring-violet-600/20'
    : 'bg-slate-100 text-slate-600 ring-slate-500/20'
}

export function formatPostDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function createAssignmentId(): string {
  return `assign-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createAnnouncementId(): string {
  return `announce-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function formatAssignmentDue(dueAt: string): string {
  const d = new Date(dueAt)
  if (Number.isNaN(d.getTime())) return dueAt
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDueForInput(dueAt: string): string {
  const d = new Date(dueAt)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function parseDueFromInput(value: string): string {
  if (!value.trim()) return new Date().toISOString()
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

export function isVisibleToStudent(status: AssignmentStatus): boolean {
  return status === 'published' || status === 'closed'
}

function postSortTime(post: Assignment): number {
  if (isAnnouncement(post)) {
    return new Date(post.createdAt).getTime()
  }
  return new Date(post.dueAt).getTime()
}

export function assignmentsForClass(
  assignments: Assignment[],
  classKey: string,
  { studentView = false }: { studentView?: boolean } = {},
): Assignment[] {
  return assignments
    .filter((a) => a.classKey === classKey)
    .filter((a) => !studentView || isVisibleToStudent(a.status))
    .sort((a, b) => postSortTime(b) - postSortTime(a))
}

/** Class feed: newest first (by createdAt). */
export function postsForClass(
  assignments: Assignment[],
  classKey: string,
  { studentView = false }: { studentView?: boolean } = {},
): Assignment[] {
  return assignments
    .filter((a) => a.classKey === classKey)
    .filter((a) => !studentView || isVisibleToStudent(a.status))
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
}

export function assignmentStatusLabel(
  status: AssignmentStatus,
  post?: Assignment,
): string {
  if (post && isAnnouncement(post)) {
    return status === 'draft' ? 'Draft' : 'Published'
  }
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'published':
      return 'Published'
    case 'closed':
      return 'Ended'
  }
}

export function assignmentStatusStyles(status: AssignmentStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-slate-100 text-slate-600 ring-slate-500/20'
    case 'published':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
    case 'closed':
      return 'bg-slate-100 text-slate-600 ring-slate-500/20'
  }
}

type LegacyAssignment = {
  id: number | string
  title: string
  className?: string
  classKey?: string
  dueDate?: string
  dueAt?: string
  description?: string
  status?: string
  submitted?: number
  total?: number
  resourceLink?: string
  createdAt?: string
}

export function migrateAssignment(
  raw: LegacyAssignment,
  classes: Class[],
): Assignment {
  if (raw.classKey && raw.dueAt && typeof raw.id === 'string') {
    const kind =
      (raw as { kind?: string }).kind === 'announcement'
        ? 'announcement'
        : 'assignment'
    return {
      id: raw.id,
      classKey: raw.classKey,
      kind,
      title: raw.title,
      description: raw.description ?? '',
      dueAt: raw.dueAt,
      createdAt: raw.createdAt ?? new Date().toISOString(),
      status:
        raw.status === 'draft' || raw.status === 'published' || raw.status === 'closed'
          ? raw.status
          : 'published',
      resourceLink: raw.resourceLink?.trim() || undefined,
    }
  }

  const classKey =
    raw.classKey ??
    classes.find((c) => c.name === raw.className)?.classKey ??
    'unknown'

  let status: AssignmentStatus = 'published'
  if (raw.status === 'draft') status = 'draft'
  else if (raw.status === 'closed') status = 'closed'
  else if (raw.status === 'grading' || raw.status === 'active') status = 'published'

  let dueAt = raw.dueAt ?? ''
  if (!dueAt && raw.dueDate) {
    const parsed = new Date(raw.dueDate)
    dueAt = Number.isNaN(parsed.getTime())
      ? new Date().toISOString()
      : parsed.toISOString()
  }
  if (!dueAt) dueAt = new Date().toISOString()

  return {
    id: typeof raw.id === 'string' ? raw.id : `assign-legacy-${raw.id}`,
    classKey,
    kind: 'assignment',
    title: raw.title,
    description: raw.description ?? '',
    dueAt,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    status,
    resourceLink: raw.resourceLink?.trim() || undefined,
  }
}

export function buildAssignmentFromInput(
  classKey: string,
  input: AssignmentFormInput,
  status: 'draft' | 'published',
  existing?: Assignment,
): Assignment {
  const now = new Date().toISOString()
  return {
    id: existing?.id ?? createAssignmentId(),
    classKey,
    kind: 'assignment',
    title: input.title.trim(),
    description: input.description.trim(),
    dueAt: input.dueAt,
    createdAt: existing?.createdAt ?? now,
    status,
    resourceLink: input.resourceLink?.trim() || undefined,
  }
}

export function buildAnnouncementFromInput(
  classKey: string,
  input: AnnouncementFormInput,
  status: 'draft' | 'published',
  existing?: Assignment,
): Assignment {
  const now = new Date().toISOString()
  return {
    id: existing?.id ?? createAnnouncementId(),
    classKey,
    kind: 'announcement',
    title: input.title.trim(),
    description: input.description.trim(),
    dueAt: existing?.dueAt ?? now,
    createdAt: existing?.createdAt ?? now,
    status: status === 'draft' ? 'draft' : 'published',
    resourceLink: input.resourceLink?.trim() || undefined,
  }
}
