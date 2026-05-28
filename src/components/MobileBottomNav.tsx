import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
  Users,
} from 'lucide-react'
import type { TabId } from '../types'

const MOBILE_TABS: {
  id: TabId
  label: string
  icon: typeof LayoutDashboard
}[] = [
  { id: 'overview', label: 'Home', icon: LayoutDashboard },
  { id: 'classes', label: 'Classes', icon: BookOpen },
  { id: 'assignments', label: 'Tasks', icon: ClipboardList },
  { id: 'attendance', label: 'Attend.', icon: CalendarCheck },
  { id: 'students', label: 'Students', icon: Users },
]

interface MobileBottomNavProps {
  activeTab: TabId
  pendingJoinCount?: number
  onTabChange: (tab: TabId) => void
}

export default function MobileBottomNav({
  activeTab,
  pendingJoinCount = 0,
  onTabChange,
}: MobileBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 block h-[60px] border-t border-slate-200 bg-[#0f172a] shadow-[0_-4px_24px_rgba(15,23,42,0.12)] md:hidden"
      role="navigation"
      aria-label="Primary"
    >
      <div className="mx-auto flex h-full max-w-lg items-stretch justify-between px-1 pt-1">
        {MOBILE_TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="relative">
                <Icon
                  className={`h-5 w-5 shrink-0 ${isActive ? 'text-blue-400' : ''}`}
                  strokeWidth={isActive ? 2.25 : 2}
                />
                {id === 'students' && pendingJoinCount > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                    {pendingJoinCount > 9 ? '9+' : pendingJoinCount}
                  </span>
                )}
              </span>
              <span className="truncate px-0.5">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
