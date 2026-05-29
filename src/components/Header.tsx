import { Plus } from 'lucide-react'
import type { TabId } from '../types'
import { HEADER_TITLES } from '../types'
import TeacherNotificationsMenu, {
  type TeacherNotificationItem,
} from './TeacherNotificationsMenu'

interface HeaderProps {
  activeTab: TabId
  onCreateClass: () => void
  notifications: TeacherNotificationItem[]
}

export default function Header({
  activeTab,
  onCreateClass,
  notifications,
}: HeaderProps) {
  return (
    <header className="hidden h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:flex md:px-8">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          {HEADER_TITLES[activeTab]}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <TeacherNotificationsMenu items={notifications} variant="desktop" />

        {(activeTab === 'overview' || activeTab === 'classes') && (
          <button
            type="button"
            onClick={onCreateClass}
            className="hidden items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30 active:scale-[0.98] md:inline-flex"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Create Class
          </button>
        )}
      </div>
    </header>
  )
}
