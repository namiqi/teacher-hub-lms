import { ArrowLeft, Settings, Users } from 'lucide-react'
import type {
  AnnouncementFormInput,
  Assignment,
  AssignmentFormInput,
  Class,
  Student,
} from '../../types'
import ClassAssignmentsPanel from './ClassAssignmentsPanel'

interface TeacherClassWorkspaceProps {
  cls: Class
  students: Student[]
  assignments: Assignment[]
  teacherUserId?: string | null
  onBack: () => void
  onOpenSettings: () => void
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
  onSubmissionsReviewed?: () => void
}

export default function TeacherClassWorkspace({
  cls,
  students,
  assignments,
  teacherUserId,
  onBack,
  onOpenSettings,
  onSaveAssignment,
  onSaveAnnouncement,
  onDeleteAssignment,
  onSubmissionsReviewed,
}: TeacherClassWorkspaceProps) {
  const enrolled = students.filter(
    (s) => s.status === 'active' && s.enrolledClasses.includes(cls.classKey),
  )

  return (
    <div className="space-y-3 sm:space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#185560]"
      >
        <ArrowLeft className="h-4 w-4" />
        All classes
      </button>

      <div
        className={`overflow-hidden rounded-xl bg-gradient-to-r sm:rounded-2xl ${cls.color} shadow-md sm:shadow-lg`}
      >
        <div className="flex items-center gap-3 px-3 py-3 text-white sm:px-5 sm:py-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
              {cls.name}
            </h1>
            <p className="mt-0.5 flex items-center gap-2 truncate text-xs text-white/80 sm:text-sm">
              <span className="inline-flex shrink-0 items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {enrolled.length}
              </span>
              <span className="truncate opacity-90">{cls.schedule}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-2.5 py-2 text-xs font-semibold backdrop-blur-sm hover:bg-white/20 sm:px-3 sm:text-sm"
            aria-label="Class settings"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      <ClassAssignmentsPanel
        cls={cls}
        students={students}
        assignments={assignments}
        teacherUserId={teacherUserId}
        onSaveAssignment={onSaveAssignment}
        onSaveAnnouncement={onSaveAnnouncement}
        onDeleteAssignment={onDeleteAssignment}
        onSubmissionsReviewed={onSubmissionsReviewed}
      />
    </div>
  )
}
