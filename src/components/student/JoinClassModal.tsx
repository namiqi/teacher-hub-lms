import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  canSubmitJoinRequest,
  createJoinRequest,
  findClassByJoinCode,
} from '../../lib/joinRequests'
import { formatJoinCodeForDisplay } from '../../lib/joinCodes'
import { isSupabaseConfigured } from '../../lib/supabase/client'
import {
  canSubmitJoinRequestRemote,
  findClassByJoinCodeRemote,
} from '../../lib/supabase/studentData'
import { loadClasses } from '../../lib/storage'
import type { JoinRequest, Student, StudentAccount } from '../../types'

interface JoinClassModalProps {
  isOpen: boolean
  account: StudentAccount
  students: Student[]
  joinRequests: JoinRequest[]
  studentUserId?: string | null
  onClose: () => void
  onSubmit: (request: JoinRequest) => void | Promise<void>
}

export default function JoinClassModal({
  isOpen,
  account,
  students,
  joinRequests,
  studentUserId,
  onClose,
  onSubmit,
}: JoinClassModalProps) {
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState(account.displayName)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const useCloud = isSupabaseConfigured()

  useEffect(() => {
    if (!isOpen) return
    setCode('')
    setDisplayName(account.displayName)
    setError(null)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, account.displayName])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (useCloud && studentUserId) {
        const found = await findClassByJoinCodeRemote(code)
        if (!found) {
          setError(
            'Class code not found. Ask your teacher to open the app and copy the code again from Manage class (teacher must save their class first).',
          )
          return
        }
        const { cls, teacherId } = found
        const gate = await canSubmitJoinRequestRemote(
          studentUserId,
          account,
          cls.classKey,
          teacherId,
        )
        if (!gate.ok) {
          setError(gate.reason)
          return
        }
        const request = createJoinRequest(account, cls, displayName, {
          studentUserId,
          teacherId,
        })
        await onSubmit(request)
        onClose()
        return
      }

      const freshClasses = loadClasses()
      const cls = findClassByJoinCode(freshClasses, code)
      if (!cls) {
        const hasActiveClasses = freshClasses.some((c) => c.status === 'active')
        setError(
          hasActiveClasses
            ? 'Invalid class code. Copy it again from Manage class (with or without the dash).'
            : 'No classes found in this browser. Teacher and student must use the same browser profile (not incognito vs normal).',
        )
        return
      }
      const gate = canSubmitJoinRequest(account, cls.classKey, joinRequests, students)
      if (!gate.ok) {
        setError(gate.reason)
        return
      }
      const request = createJoinRequest(account, cls, displayName)
      await onSubmit(request)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-md rounded-t-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Join a class</h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter the code your teacher shared. They must approve before you appear on
              the roster.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Class code</span>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC-123"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 font-mono text-lg tracking-widest uppercase focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
            {code.trim() && (
              <p className="mt-1 text-xs text-slate-400">
                Formatted: {formatJoinCodeForDisplay(code)}
              </p>
            )}
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Your name (for teacher)</span>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </label>
          {error && (
            <p className="text-sm text-rose-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting…' : 'Request to join'}
          </button>
        </form>
      </div>
    </div>
  )
}
