import ClassCard from '../ClassCard'
import EmptyState from '../ui/EmptyState'
import { BookOpen, Plus } from 'lucide-react'
import type { Class } from '../../types'

interface MyClassesTabProps {
  classes: Class[]
  onOpenClass: (classId: number) => void
  onCreateClass: () => void
}

export default function MyClassesTab({
  classes,
  onOpenClass,
  onCreateClass,
}: MyClassesTabProps) {
  if (classes.length === 0) {
    return (
      <>
        <EmptyState
          icon={BookOpen}
          title="No classes yet"
          description="Create a class for each group you teach — for example “Tuesday Math” or “English 101”. You can add students and track attendance after that."
          action={{ label: 'Create your first class', onClick: onCreateClass }}
        />
        <button
          type="button"
          onClick={onCreateClass}
          className="fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#185560] text-white shadow-xl shadow-[#185560]/30 transition-transform hover:bg-[#134851] active:scale-95 md:hidden"
          aria-label="Create class"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:[grid-template-columns:repeat(4,minmax(0,1fr))]">
        {classes.map((course) => (
          <ClassCard key={course.id} course={course} onOpen={onOpenClass} />
        ))}
      </div>
      <button
        type="button"
        onClick={onCreateClass}
        className="fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#185560] text-white shadow-xl shadow-[#185560]/30 transition-transform hover:bg-[#134851] active:scale-95 md:hidden"
        aria-label="Create class"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </>
  )
}
