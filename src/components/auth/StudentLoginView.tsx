import { GraduationCap } from 'lucide-react'
import { useState } from 'react'
import { findStudentAccountByEmail } from '../../lib/storage'

interface StudentLoginViewProps {
  onSignIn: (accountId: number) => void
  onGoToSignup: () => void
  onBack: () => void
}

export default function StudentLoginView({
  onSignIn,
  onGoToSignup,
  onBack,
}: StudentLoginViewProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    const account = findStudentAccountByEmail(email)
    window.setTimeout(() => {
      setIsSubmitting(false)
      if (!account) {
        setError('No student account found for this email. Sign up first.')
        return
      }
      onSignIn(account.id)
    }, 300)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Back to home
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-600/25">
              <GraduationCap className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">Student sign in</h1>
            <p className="mt-1 text-sm text-slate-500">
              Use the email you registered with (demo — no password yet)
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            New here?{' '}
            <button
              type="button"
              onClick={onGoToSignup}
              className="font-medium text-violet-600 hover:text-violet-700"
            >
              Create student account
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
