import { Bell, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { StudentNotificationKind } from '../../lib/studentNotifications'

export interface StudentNotificationMenuItem {
  id: string
  kind: StudentNotificationKind
  title: string
  subtitle: string
  onSelect: () => void
}

interface StudentNotificationsMenuProps {
  items: StudentNotificationMenuItem[]
  variant?: 'mobile' | 'desktop'
}

function kindStyles(kind: StudentNotificationKind): string {
  switch (kind) {
    case 'graded':
      return 'bg-emerald-100 text-emerald-800'
    case 'due_soon':
      return 'bg-rose-100 text-rose-700'
    case 'new_work':
      return 'bg-violet-100 text-violet-800'
    case 'join_approved':
      return 'bg-amber-100 text-amber-800'
  }
}

function kindLabel(kind: StudentNotificationKind): string {
  switch (kind) {
    case 'graded':
      return 'Grade'
    case 'due_soon':
      return 'Due'
    case 'new_work':
      return 'New'
    case 'join_approved':
      return 'Join'
  }
}

export default function StudentNotificationsMenu({
  items,
  variant = 'desktop',
}: StudentNotificationsMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const count = items.length

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const buttonClass =
    variant === 'mobile'
      ? 'relative rounded-lg p-2 text-violet-700 transition-colors hover:bg-violet-50'
      : 'relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={buttonClass}
        aria-label={
          count > 0
            ? `Notifications, ${count} update${count === 1 ? '' : 's'}`
            : 'Notifications'
        }
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Bell className="h-5 w-5" strokeWidth={variant === 'mobile' ? 2.1 : 2} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ${
            variant === 'mobile' ? 'right-0 w-80 max-w-[calc(100vw-2rem)]' : 'right-0 w-96'
          }`}
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Updates</p>
            <p className="text-xs text-slate-500">
              {count === 0
                ? 'Nothing new since your last visit.'
                : `${count} update${count === 1 ? '' : 's'} for you`}
            </p>
          </div>

          {count === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false)
                      item.onSelect()
                    }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <span
                      className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${kindStyles(item.kind)}`}
                    >
                      {kindLabel(item.kind)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-900">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {item.subtitle}
                      </span>
                    </span>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
