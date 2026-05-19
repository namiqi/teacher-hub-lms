import ClassCard from '../ClassCard'
import type { Class } from '../../types'

interface MyClassesTabProps {
  classes: Class[]
  onManageClass: (classId: number) => void
}

export default function MyClassesTab({ classes, onManageClass }: MyClassesTabProps) {
  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-lg font-medium text-slate-900">No classes yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Click &quot;Create Class&quot; to add your first course.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:[grid-template-columns:repeat(4,minmax(0,1fr))]">
      {classes.map((course) => (
        <ClassCard key={course.id} course={course} onManage={onManageClass} />
      ))}
    </div>
  )
}
