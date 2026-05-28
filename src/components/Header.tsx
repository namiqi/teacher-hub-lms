import { Bell, Plus } from 'lucide-react'
import type { TabId } from '../types'
import { HEADER_TITLES } from '../types'

interface HeaderProps {
  activeTab: TabId
  onCreateClass: () => void
}

export default function Header({ activeTab, onCreateClass }: HeaderProps) {
  return (
    <header className="hidden h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:flex md:px-8">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          {HEADER_TITLES[activeTab]}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </span>
        </button>

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
