import { BookOpen, ChevronRight, Users } from 'lucide-react'
import type { Class } from '../types'

interface ClassCardProps {
  course: Class
  onOpen: (classId: number) => void
}

export default function ClassCard({ course, onOpen }: ClassCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(course.id)}
      className="group flex min-w-0 w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition-all hover:border-[#185560]/25 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#185560]/30 active:scale-[0.99]"
    >
      <div className={`bg-gradient-to-r ${course.color} px-3 py-2.5 sm:py-3`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate text-base font-bold leading-tight text-white">
            {course.name}
          </h3>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/20 backdrop-blur-sm sm:h-8 sm:w-8">
            <BookOpen className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" strokeWidth={2} />
          </div>
        </div>
      </div>

      <div className="space-y-1 p-2.5 sm:p-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Users className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">
            {course.students === 0
              ? 'No students yet'
              : `${course.students} enrolled`}
          </span>
          <ChevronRight
            className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#185560]"
            strokeWidth={2}
            aria-hidden
          />
        </div>
        {course.schedule ? (
          <p className="line-clamp-2 text-left text-xs leading-snug text-slate-600">
            {course.schedule}
          </p>
        ) : null}
      </div>
    </button>
  )
}
