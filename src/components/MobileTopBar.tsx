import { Bell, LogOut, Settings } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { TabId, User } from '../types'
import { HEADER_TITLES } from '../types'

interface MobileTopBarProps {
  user: User
  activeTab: TabId
  onOpenProfile: () => void
  onSignOut: () => void
}

export default function MobileTopBar({
  user,
  activeTab,
  onOpenProfile,
  onSignOut,
}: MobileTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const title =
    activeTab === 'overview' ? 'Teacher Hub' : HEADER_TITLES[activeTab]

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [menuOpen])

  return (
    <header
      className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-sm md:hidden"
      role="banner"
    >
      <div className="min-w-0">
        <span className="block truncate text-base font-bold tracking-tight text-[#185560]">
          {title}
        </span>
        {activeTab === 'overview' && (
          <span className="block truncate text-[10px] font-medium text-slate-500">
            Your teaching workspace
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="rounded-lg p-2 text-[#185560] transition-colors hover:bg-[rgba(24,85,96,0.08)]"
          aria-label="Notifications (coming soon)"
        >
          <Bell className="h-5 w-5" strokeWidth={2.1} />
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#185560] to-[#134851] text-xs font-bold text-white shadow-sm ring-2 ring-white transition-transform active:scale-95"
            aria-label="Account menu"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            {user.initials}
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            >
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onOpenProfile()
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50"
              >
                <Settings className="h-4 w-4 text-slate-500" />
                Account settings
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onSignOut()
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
