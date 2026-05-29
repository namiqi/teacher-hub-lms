import { ArrowLeft, LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { StudentAccount, StudentTabId } from '../../types'
import { STUDENT_HEADER_TITLES } from '../../types'
import StudentNotificationsMenu, {
  type StudentNotificationMenuItem,
} from './StudentNotificationsMenu'

interface StudentMobileTopBarProps {
  account: StudentAccount
  activeTab: StudentTabId
  classDetailName?: string | null
  notifications: StudentNotificationMenuItem[]
  onBackFromClass?: () => void
  onSignOut: () => void
}

export default function StudentMobileTopBar({
  account,
  activeTab,
  classDetailName,
  notifications,
  onBackFromClass,
  onSignOut,
}: StudentMobileTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const inClassDetail = Boolean(classDetailName)

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
      <div className="flex min-w-0 items-center gap-2">
        {inClassDetail && onBackFromClass && (
          <button
            type="button"
            onClick={onBackFromClass}
            className="shrink-0 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
            aria-label="Back to classes"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        <div className="min-w-0">
          <span className="block truncate text-base font-bold tracking-tight text-violet-900">
            {inClassDetail ? classDetailName : 'Teacher Hub'}
          </span>
          <span className="block truncate text-[10px] font-medium text-slate-500">
            {inClassDetail ? 'Class details' : STUDENT_HEADER_TITLES[activeTab]}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <StudentNotificationsMenu items={notifications} variant="mobile" />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-bold text-white shadow-sm ring-2 ring-white transition-transform active:scale-95"
            aria-label="Account menu"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            {account.initials}
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            >
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="truncate text-sm font-medium text-slate-900">
                  {account.displayName}
                </p>
                <p className="truncate text-xs text-slate-500">{account.email}</p>
              </div>
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
