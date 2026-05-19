import { BookOpen, Users } from 'lucide-react'
import type { Class } from '../types'

interface ClassCardProps {
  course: Class
  onManage: (classId: number) => void
}

export default function ClassCard({ course, onManage }: ClassCardProps) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      <div className={`bg-gradient-to-r ${course.color} px-3 py-4`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold leading-tight text-white">
              {course.name}
            </h3>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/20 backdrop-blur-sm">
            <BookOpen className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Users className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">
            {course.students === 0
              ? 'No students yet'
              : `${course.students} enrolled`}
          </span>
        </div>
        <p className="line-clamp-2 text-xs leading-snug text-slate-600">{course.schedule}</p>
        <button
          type="button"
          onClick={() => onManage(course.id)}
          className="mt-auto w-full whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
        >
          Manage Class
        </button>
      </div>
    </article>
  )
}
