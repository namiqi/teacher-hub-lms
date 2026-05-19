import {
  BookOpen,
  CalendarCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from 'lucide-react'
import type { TabId, User } from '../types'
import { TAB_LABELS } from '../types'

interface NavItem {
  id: TabId
  icon: typeof LayoutDashboard
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', icon: LayoutDashboard },
  { id: 'classes', icon: BookOpen },
  { id: 'attendance', icon: CalendarCheck },
  { id: 'students', icon: Users },
  { id: 'settings', icon: Settings },
]

interface SidebarProps {
  activeTab: TabId
  user: User
  onTabChange: (tab: TabId) => void
  onSignOut: () => void
}

export default function Sidebar({
  activeTab,
  user,
  onTabChange,
  onSignOut,
}: SidebarProps) {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-[#0f172a] text-slate-300">
      <div className="flex items-center gap-3 border-b border-slate-700/60 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
          <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.25} />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-white">
            Teacher Hub
          </p>
          <p className="text-xs text-slate-400">LMS Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        {NAV_ITEMS.map(({ id, icon: Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600/15 text-white shadow-sm ring-1 ring-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] shrink-0 ${
                  isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
                strokeWidth={2}
              />
              {TAB_LABELS[id]}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />
              )}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-slate-700/60 p-4">
        <div className="rounded-xl bg-slate-800/50 p-3 ring-1 ring-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-400">{user.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600/80 bg-slate-900/40 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-500 hover:bg-slate-700/50 hover:text-white"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  )
}
