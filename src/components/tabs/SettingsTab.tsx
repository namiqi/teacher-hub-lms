import { Download, LogOut, RotateCcw, Upload, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { logger } from '../../lib/logger'
import type { User as AppUser } from '../../types'

interface SettingsTabProps {
  user: AppUser
  onSaveUser: (user: AppUser) => void
  onExportBackup: () => void
  onImportBackup: (file: File) => Promise<void>
  onResetWorkspace: () => void
  onSignOut: () => void
}

export default function SettingsTab({
  user,
  onSaveUser,
  onExportBackup,
  onImportBackup,
  onResetWorkspace,
  onSignOut,
}: SettingsTabProps) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName(user.name)
    setEmail(user.email)
  }, [user])

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName || !trimmedEmail) return

    const next: AppUser = {
      ...user,
      name: trimmedName,
      email: trimmedEmail,
      initials: trimmedName
        .split(/\s+/)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    }
    onSaveUser(next)
    setSavedMessage('Profile saved.')
    logger.info('Profile updated', { email: trimmedEmail })
    window.setTimeout(() => setSavedMessage(null), 3000)
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportError(null)
    setIsImporting(true)
    try {
      await onImportBackup(file)
      setSavedMessage('Backup restored successfully.')
      window.setTimeout(() => setSavedMessage(null), 4000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed.'
      setImportError(message)
      logger.error('Backup import failed', err)
    } finally {
      setIsImporting(false)
    }
  }

  const handleReset = () => {
    const confirmed = window.confirm(
      'Reset all classes, students, attendance, and payments? Your profile will be kept. This cannot be undone.',
    )
    if (!confirmed) return
    onResetWorkspace()
    setSavedMessage('Workspace reset.')
    window.setTimeout(() => setSavedMessage(null), 3000)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {savedMessage && (
        <p
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          role="status"
        >
          {savedMessage}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(24,85,96,0.08)]">
            <User className="h-5 w-5 text-[#185560]" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your name appears in the sidebar and on exports.
            </p>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleProfileSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Full name</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-[#185560] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#134851]"
          >
            Save profile
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Data &amp; safety</h2>
        <p className="mt-1 text-sm text-slate-500">
          Everything is stored in this browser for now. Export regularly so you don&apos;t
          lose your roster.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onExportBackup}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
          >
            <Download className="h-4 w-4" strokeWidth={2} />
            Export backup (JSON)
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" strokeWidth={2} />
            {isImporting ? 'Importing…' : 'Import backup'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>

        {importError && (
          <p className="mt-3 text-sm text-rose-600" role="alert">
            {importError}
          </p>
        )}

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50/80 p-4">
          <p className="text-sm font-medium text-amber-900">Reset workspace</p>
          <p className="mt-1 text-sm text-amber-800/90">
            Clears classes, students, attendance, and payment history. Your profile stays.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-50"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={2} />
            Reset all teaching data
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:hidden">
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          Sign out
        </button>
      </section>
    </div>
  )
}
