import { Shield } from 'lucide-react'
import { useState } from 'react'

export default function SettingsTab() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
        <p className="mt-1 text-sm text-slate-500">
          Update your account details and public profile.
        </p>

        <form className="mt-6 space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">First Name</span>
              <input
                type="text"
                defaultValue="Sarah"
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Last Name</span>
              <input
                type="text"
                defaultValue="Johnson"
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email Address</span>
            <input
              type="email"
              defaultValue="sarah.johnson@school.edu"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Department</span>
            <input
              type="text"
              defaultValue="Mathematics"
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Save Changes
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <Shield className="h-5 w-5 text-slate-600" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Security</h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage two-factor authentication and account security settings.
            </p>

            <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-4">
              <div>
                <p className="font-medium text-slate-900">
                  Two-Factor Authentication (2FA)
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {twoFactorEnabled
                    ? 'Your account is protected with 2FA.'
                    : 'Add an extra layer of security to your account.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={twoFactorEnabled}
                onClick={() => setTwoFactorEnabled((v) => !v)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  twoFactorEnabled ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition duration-200 ${
                    twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-slate-700">Current Password</span>
              <input
                type="password"
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>
        </div>
      </section>
    </div>
  )
}
