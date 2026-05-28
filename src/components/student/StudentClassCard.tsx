import { BookOpen, ChevronRight, MapPin } from 'lucide-react'
import type { Class } from '../../types'

interface StudentClassCardProps {
  course: Class
  onOpen: (classKey: string) => void
}

export default function StudentClassCard({ course, onOpen }: StudentClassCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(course.classKey)}
      className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-all hover:border-violet-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-violet-500/30"
    >
      <div className={`bg-gradient-to-r ${course.color} px-4 py-5`}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-lg font-bold leading-tight text-white">
            {course.name}
          </h3>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <BookOpen className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="line-clamp-2 text-sm text-slate-600">{course.schedule}</p>
        {course.location && (
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span className="truncate">{course.location}</span>
          </p>
        )}
        <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-violet-700 group-hover:text-violet-800">
          Open class
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  )
}
