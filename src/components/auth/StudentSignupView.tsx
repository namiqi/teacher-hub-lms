import { GraduationCap } from 'lucide-react'
import { useState } from 'react'

interface StudentSignupViewProps {
  onSignUp: (displayName: string, email: string) => void
  onGoToLogin: () => void
  onBack: () => void
}

export default function StudentSignupView({
  onSignUp,
  onGoToLogin,
  onBack,
}: StudentSignupViewProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    window.setTimeout(() => {
      setIsSubmitting(false)
      try {
        onSignUp(name.trim(), email.trim())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign up failed.')
      }
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
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">Student account</h1>
            <p className="mt-1 text-sm text-slate-500">
              Then join a class with a code from your teacher
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Your name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </label>
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
              {isSubmitting ? 'Creating…' : 'Create account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onGoToLogin}
              className="font-medium text-violet-600 hover:text-violet-700"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
