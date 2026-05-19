import { GraduationCap } from 'lucide-react'
import { useState } from 'react'

interface LoginViewProps {
  onSignIn: () => void
  onGoToSignup: () => void
  onBack: () => void
  onDevBypass: () => void
}

export default function LoginView({
  onSignIn,
  onGoToSignup,
  onBack,
  onDevBypass,
}: LoginViewProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    window.setTimeout(() => {
      setIsSubmitting(false)
      onSignIn()
    }, 400)
  }

  const handleDevBypass = (e: React.MouseEvent) => {
    e.preventDefault()
    onDevBypass()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md transition-opacity duration-300">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
        >
          ← Back to home
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/25">
              <GraduationCap className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to your Hub LMS dashboard
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
                placeholder="you@school.edu"
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">Remember me</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleDevBypass}
            className="mt-4 w-full rounded-lg border-2 border-dashed border-amber-400/80 bg-amber-50 py-2.5 text-sm font-semibold text-amber-900 transition-all hover:border-amber-500 hover:bg-amber-100"
          >
            ⚡ Dev Bypass: Sign In as Prof. Smith
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={onGoToSignup}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
