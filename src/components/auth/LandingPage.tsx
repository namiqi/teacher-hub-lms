import {
  BarChart3,
  Calendar,
  GraduationCap,
  Layers,
  Shield,
  Users,
} from 'lucide-react'

interface LandingPageProps {
  onSignIn: () => void
  onGetStarted: () => void
  onStudentPortal: () => void
  onDevBypass: () => void
}

const FEATURES = [
  {
    icon: Layers,
    title: 'Classes in one place',
    description:
      'Create each group you teach, set weekly times, and manage rosters without spreadsheets.',
  },
  {
    icon: Users,
    title: 'Student roster & contacts',
    description:
      'Names, parent phones, and lesson balances—everything you need before each session.',
  },
  {
    icon: Calendar,
    title: 'Attendance that sticks',
    description:
      'Mark present, absent, or excused. Prepaid lessons update automatically when you save.',
  },
  {
    icon: BarChart3,
    title: 'Payment reminders',
    description:
      'See who is running low on lessons so you can follow up before the next class.',
  },
  {
    icon: Shield,
    title: 'Your data, your device',
    description:
      'Works in the browser for now. Cloud sync and accounts come when you are ready to go live.',
  },
  {
    icon: GraduationCap,
    title: 'Built for tutors',
    description:
      'Designed for individual teachers and small practices—not bloated school admin software.',
  },
]

export default function LandingPage({
  onSignIn,
  onGetStarted,
  onStudentPortal,
  onDevBypass,
}: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.25} />
          </div>
          <span className="text-lg font-semibold tracking-tight">Teacher Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSignIn}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={onGetStarted}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500"
          >
            Get Started
          </button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 pb-20 pt-12 lg:px-8 lg:pt-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.15),_transparent_50%)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-800/50 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-blue-300">
              CRM for tutors & teachers
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Run your classes
              <span className="mt-2 block bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                without the spreadsheet chaos.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
              Teacher Hub helps you track students, attendance, and prepaid lessons in one
              calm workspace—built for solo tutors first, with more coming later.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={onGetStarted}
                className="w-full rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-600/30 transition-all hover:bg-blue-500 hover:shadow-blue-500/40 sm:w-auto"
              >
                Get Started — It&apos;s Free
              </button>
              <button
                type="button"
                onClick={onSignIn}
                className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-8 py-3.5 text-sm font-semibold text-slate-200 transition-all hover:border-slate-500 hover:bg-slate-800 sm:w-auto"
              >
                Sign In
              </button>
            </div>
            <button
              type="button"
              onClick={onStudentPortal}
              className="mt-4 text-sm font-medium text-violet-300 underline-offset-4 hover:text-violet-200 hover:underline"
            >
              Student? Join your class →
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                onDevBypass()
              }}
              className="mt-6 rounded-xl border-2 border-dashed border-amber-400/60 bg-amber-500/10 px-6 py-2.5 text-sm font-semibold text-amber-200 transition-all hover:border-amber-400 hover:bg-amber-500/20"
            >
              ⚡ Dev Bypass: try sample data
            </button>
          </div>

          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 p-2 shadow-2xl ring-1 ring-white/10 backdrop-blur">
              <div className="rounded-xl bg-slate-50 p-6 sm:p-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'Students', value: '24' },
                    { label: 'Active Classes', value: '3' },
                    { label: 'Low lesson balance', value: '2' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm"
                    >
                      <p className="text-sm text-slate-500">{stat.label}</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-800 bg-slate-900/50 px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Why teachers choose Teacher Hub
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-400">
                Less busywork, more teaching. Homework and student logins are planned for a
                later version—today is about running your practice.
              </p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <article
                    key={feature.title}
                    className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6 transition-colors hover:border-slate-600 hover:bg-slate-800/60"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <h3 className="mt-4 font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      {feature.description}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center shadow-xl">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Ready to replace your classroom spreadsheets?
            </h2>
            <p className="mt-3 text-blue-100">
              Create an account and set up your first class in minutes.
            </p>
            <button
              type="button"
              onClick={onGetStarted}
              className="mt-8 rounded-xl bg-white px-8 py-3 text-sm font-semibold text-blue-700 shadow-lg transition-transform hover:scale-[1.02]"
            >
              Create your free account
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500 lg:px-8">
        © {new Date().getFullYear()} Teacher Hub. Built for educators.
      </footer>
    </div>
  )
}
