import { LayoutDashboard, UserPlus } from 'lucide-react'
import type { StudentTabId } from '../../types'

const MOBILE_TABS: {
  id: StudentTabId
  label: string
  icon: typeof LayoutDashboard
}[] = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
  { id: 'requests', label: 'Requests', icon: UserPlus },
]

interface StudentMobileNavProps {
  activeTab: StudentTabId
  pendingRequestCount?: number
  onTabChange: (tab: StudentTabId) => void
}

export default function StudentMobileNav({
  activeTab,
  pendingRequestCount = 0,
  onTabChange,
}: StudentMobileNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 block h-[60px] border-t border-slate-200 bg-[#0f172a] shadow-[0_-4px_24px_rgba(15,23,42,0.12)] md:hidden"
      role="navigation"
      aria-label="Student navigation"
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
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="relative">
                <Icon
                  className={`h-5 w-5 shrink-0 ${isActive ? 'text-violet-400' : ''}`}
                  strokeWidth={isActive ? 2.25 : 2}
                />
                {id === 'requests' && pendingRequestCount > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white">
                    {pendingRequestCount > 9 ? '9+' : pendingRequestCount}
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
