import {
  BarChart3,
  Building2,
  Calendar,
  Check,
  GraduationCap,
  Layers,
  Mail,
  Minus,
  School,
  Shield,
  User,
  Users,
  X,
} from 'lucide-react'

interface LandingPageProps {
  onSignIn: () => void
  onGetStarted: () => void
  onStudentSignUp: () => void
  onStudentSignIn: () => void
  onDevBypass?: () => void
}

const NAV_ITEMS = [
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'about', label: 'About us' },
  { id: 'contact', label: 'Contact' },
] as const

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
    title: 'Secure cloud sync',
    description:
      'Your roster and billing data stay under your account, backed up and available anywhere.',
  },
  {
    icon: GraduationCap,
    title: 'Built for tutors',
    description:
      'Designed for individual teachers and small practices—not bloated school admin software.',
  },
]

type TierId = 'individual' | 'organization' | 'schools'

interface PricingTier {
  id: TierId
  name: string
  tagline: string
  price: string
  priceNote: string
  icon: typeof User
  highlighted?: boolean
  badge?: string
  cta: string
  limits: {
    teachers: string
    students: string
    classes: string
    admins: string
  }
  includes: string[]
  notIncluded?: string[]
}

const MARKET_BENCHMARKS = [
  { name: 'Teachworks', range: '~$17–48/mo', azn: '~29–82 ₼', note: '+ per-lesson fees' },
  { name: 'TutorCruncher', range: '$30–80/mo', azn: '~51–136 ₼', note: '+ % of revenue' },
  { name: 'FreshLearn', range: 'from $35/mo', azn: '~60 ₼', note: 'course platform' },
  { name: 'Teacher Hub', range: 'from 20 ₼/mo', azn: '20–79 ₼', note: 'flat price, no % cut' },
]

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'individual',
    name: 'Individual',
    tagline: 'Solo tutors & private teachers',
    price: '25 ₼',
    priceNote: 'per month · or 20 ₼/mo billed yearly (240 ₼/yr)',
    icon: User,
    badge: 'Solo tutors',
    cta: 'Start 14-day trial',
    limits: {
      teachers: '1 teacher',
      students: 'Up to 40 students',
      classes: 'Up to 8 active classes',
      admins: '—',
    },
    includes: [
      'Class roster & weekly schedule',
      'Attendance & prepaid lesson tracking',
      'Assignments & announcements (class feed)',
      'Student join codes (teacher approval)',
      'Payment & top-up logging',
      'JSON backup export/import',
      'Mobile-friendly teacher & student portals',
    ],
    notIncluded: ['Multiple teacher accounts', 'Studio admin dashboard', 'Priority support'],
  },
  {
    id: 'organization',
    name: 'Small organization',
    tagline: 'Studios, agencies & small schools',
    price: '79 ₼',
    priceNote: 'per month · or 69 ₼/mo billed yearly (~$46 USD)',
    icon: Building2,
    highlighted: true,
    badge: 'Most popular',
    cta: 'Start 14-day trial',
    limits: {
      teachers: 'Up to 10 teachers',
      students: 'Up to 250 students',
      classes: 'Unlimited classes',
      admins: '2 studio admins',
    },
    includes: [
      'Everything in Individual',
      'Shared student directory across teachers',
      'Studio-wide billing & payment reports',
      'Role-based access (teacher vs admin)',
      'Branded student portal (your logo & colors)',
      'Email digests for join requests & low balances',
      'Cloud sync across devices',
    ],
    notIncluded: ['District SSO', 'Custom contracts & SLA'],
  },
  {
    id: 'schools',
    name: 'Schools',
    tagline: 'Departments, campuses & districts',
    price: 'From 149 ₼',
    priceNote: 'per month · custom annual contracts (~$88+ USD)',
    icon: School,
    cta: 'Contact sales',
    limits: {
      teachers: 'Unlimited teachers',
      students: '1,000+ students',
      classes: 'Unlimited classes',
      admins: 'Unlimited admins',
    },
    includes: [
      'Everything in Small organization',
      'Multi-campus & department structure',
      'Google / Microsoft SSO (SAML)',
      'SIS import & roster automation',
      'District analytics & usage reports',
      'Dedicated onboarding & training',
      '99.9% uptime SLA & priority support',
    ],
  },
]

type CompareRow = {
  label: string
  individual: string | boolean
  organization: string | boolean
  schools: string | boolean
}

const COMPARE_ROWS: CompareRow[] = [
  { label: 'Teacher accounts', individual: '1', organization: '10', schools: 'Unlimited' },
  { label: 'Students', individual: '40', organization: '250', schools: '1,000+' },
  { label: 'Active classes', individual: '8', organization: 'Unlimited', schools: 'Unlimited' },
  { label: 'Admin seats', individual: false, organization: '2', schools: 'Unlimited' },
  { label: 'Student portal', individual: true, organization: true, schools: true },
  { label: 'Class feed (posts)', individual: true, organization: true, schools: true },
  { label: 'Join codes & approvals', individual: true, organization: true, schools: true },
  { label: 'Prepaid & monthly billing', individual: true, organization: true, schools: true },
  { label: 'Cloud sync', individual: false, organization: true, schools: true },
  { label: 'Multi-teacher studio', individual: false, organization: true, schools: true },
  { label: 'SSO (Google / Microsoft)', individual: false, organization: false, schools: true },
  { label: 'SIS / roster import', individual: false, organization: false, schools: true },
  { label: 'Priority support', individual: false, organization: 'Email', schools: 'Dedicated' },
]

function CompareCell({ value }: { value: string | boolean }) {
  if (value === true) {
    return <Check className="mx-auto h-5 w-5 text-emerald-400" strokeWidth={2.5} />
  }
  if (value === false) {
    return <Minus className="mx-auto h-5 w-5 text-slate-600" strokeWidth={2} />
  }
  return <span className="text-sm font-medium text-slate-200">{value}</span>
}

export default function LandingPage({
  onSignIn,
  onGetStarted,
  onStudentSignUp,
  onStudentSignIn,
  onDevBypass,
}: LandingPageProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleTierCta = (tier: PricingTier) => {
    if (tier.id === 'individual' || tier.id === 'organization') {
      onGetStarted()
      return
    }
    window.location.href = 'mailto:sales@teacherhub.app?subject=Schools%20plan%20inquiry'
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0f172a]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.25} />
            </div>
            <span className="text-lg font-semibold tracking-tight">Teacher Hub</span>
          </div>

          <nav className="order-3 flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:order-none sm:w-auto sm:justify-end">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={onSignIn}
            className="order-2 rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800 sm:order-none"
          >
            Sign in
          </button>
        </div>
      </header>

      <main>
        {/* Hero — sign in / sign up first, no pricing */}
        <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pt-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.12),_transparent_55%)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Run your classes
              <span className="mt-2 block text-slate-300">without spreadsheet chaos</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Sign in or create an account. Teachers manage classes and rosters; students
              join with a code from their teacher.
            </p>
          </div>

          <div className="relative mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2 sm:gap-6">
            <article className="flex flex-col rounded-2xl border border-blue-500/30 bg-slate-800/50 p-6 shadow-lg shadow-blue-900/10 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <GraduationCap className="h-5 w-5" strokeWidth={2} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white">I&apos;m a teacher / tutor</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                Manage classes, attendance, lesson balances, and student join requests.
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500"
                >
                  Create teacher account
                </button>
                <button
                  type="button"
                  onClick={onSignIn}
                  className="w-full rounded-xl border border-slate-600 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800/80"
                >
                  Sign in
                </button>
              </div>
            </article>

            <article className="flex flex-col rounded-2xl border border-violet-500/30 bg-slate-800/50 p-6 shadow-lg shadow-violet-900/10 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
                <Users className="h-5 w-5" strokeWidth={2} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-white">I&apos;m a student</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                Join your class with a code from your teacher after you create an account.
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={onStudentSignUp}
                  className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500"
                >
                  Create student account
                </button>
                <button
                  type="button"
                  onClick={onStudentSignIn}
                  className="w-full rounded-xl border border-slate-600 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800/80"
                >
                  Sign in
                </button>
              </div>
            </article>
          </div>

          <p className="relative mx-auto mt-8 max-w-lg text-center text-xs text-slate-500">
            New here? Pick the card that matches you.{' '}
            <button
              type="button"
              onClick={() => scrollTo('pricing')}
              className="font-medium text-blue-400 underline-offset-2 hover:text-blue-300 hover:underline"
            >
              View pricing
            </button>{' '}
            when you&apos;re ready.
          </p>

          {import.meta.env.DEV && onDevBypass && (
            <div className="relative mt-6 text-center">
              <button
                type="button"
                onClick={onDevBypass}
                className="rounded-xl border-2 border-dashed border-amber-400/60 bg-amber-500/10 px-6 py-2.5 text-sm font-semibold text-amber-200 transition-all hover:border-amber-400 hover:bg-amber-500/20"
              >
                Dev bypass: try sample data
              </button>
            </div>
          )}
        </section>

        <section
          id="features"
          className="scroll-mt-20 border-t border-slate-800 bg-slate-900/50 px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-white">Features</h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-400">
                Less busywork, more teaching. Core tools to run classes day to day.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

        <section
          id="pricing"
          className="scroll-mt-20 border-t border-slate-800 px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Pricing
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-400">
                Flat monthly pricing in manats—no commission on what you charge students.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-slate-700/60 bg-slate-800/40 p-5 sm:p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                How we compared (2026)
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Tools like Teachworks and TutorCruncher charge roughly{' '}
                <span className="text-slate-200">$17–80 USD/month</span> (about{' '}
                <span className="text-slate-200">29–136 ₼</span>), often plus per-lesson
                or revenue fees.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/60 text-slate-500">
                      <th className="pb-2 pr-4 font-medium">Product</th>
                      <th className="pb-2 pr-4 font-medium">USD (approx.)</th>
                      <th className="pb-2 pr-4 font-medium">AZN (approx.)</th>
                      <th className="pb-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {MARKET_BENCHMARKS.map((row) => (
                      <tr
                        key={row.name}
                        className={`border-b border-slate-700/30 last:border-0 ${
                          row.name === 'Teacher Hub' ? 'bg-blue-600/10 text-white' : ''
                        }`}
                      >
                        <td className="py-2.5 pr-4 font-medium">{row.name}</td>
                        <td className="py-2.5 pr-4">{row.range}</td>
                        <td className="py-2.5 pr-4">{row.azn}</td>
                        <td className="py-2.5 text-slate-400">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-stretch">
              {PRICING_TIERS.map((tier) => {
                const Icon = tier.icon
                return (
                  <article
                    key={tier.id}
                    className={`relative flex flex-col rounded-2xl border p-6 sm:p-8 ${
                      tier.highlighted
                        ? 'border-blue-500/60 bg-gradient-to-b from-blue-600/20 to-slate-800/60 shadow-xl shadow-blue-600/10 ring-1 ring-blue-500/30 lg:scale-[1.02]'
                        : 'border-slate-700/60 bg-slate-800/40'
                    }`}
                  >
                    {tier.badge && (
                      <span
                        className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                          tier.highlighted
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {tier.badge}
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          tier.highlighted
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700/80 text-slate-300'
                        }`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
                        <p className="text-sm text-slate-400">{tier.tagline}</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <p className="text-4xl font-bold tracking-tight text-white">
                        {tier.price}
                        {tier.price.includes('₼') && !tier.price.startsWith('From') && (
                          <span className="text-lg font-medium text-slate-400">/mo</span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{tier.priceNote}</p>
                    </div>

                    <dl className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Teachers
                        </dt>
                        <dd className="mt-0.5 text-sm font-medium text-slate-200">
                          {tier.limits.teachers}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Students
                        </dt>
                        <dd className="mt-0.5 text-sm font-medium text-slate-200">
                          {tier.limits.students}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Classes
                        </dt>
                        <dd className="mt-0.5 text-sm font-medium text-slate-200">
                          {tier.limits.classes}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          Admins
                        </dt>
                        <dd className="mt-0.5 text-sm font-medium text-slate-200">
                          {tier.limits.admins}
                        </dd>
                      </div>
                    </dl>

                    <ul className="mt-6 flex-1 space-y-2.5">
                      {tier.includes.map((item) => (
                        <li key={item} className="flex gap-2.5 text-sm text-slate-300">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                            strokeWidth={2.5}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                      {tier.notIncluded?.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2.5 text-sm text-slate-500 line-through decoration-slate-600"
                        >
                          <X className="mt-0.5 h-4 w-4 shrink-0 opacity-50" strokeWidth={2} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() => handleTierCta(tier)}
                      className={`mt-8 w-full rounded-xl py-3 text-sm font-semibold transition-all ${
                        tier.highlighted
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500'
                          : 'border border-slate-600 bg-slate-800 text-white hover:border-slate-500 hover:bg-slate-700'
                      }`}
                    >
                      {tier.cta}
                    </button>
                  </article>
                )
              })}
            </div>

            <div className="mt-16 overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/30">
              <div className="border-b border-slate-700/60 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">Compare plans</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b border-slate-700/60">
                      <th className="px-6 py-4 text-sm font-medium text-slate-400">Feature</th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-white">
                        Individual
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-blue-300">
                        Small org
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-white">
                        Schools
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_ROWS.map((row) => (
                      <tr
                        key={row.label}
                        className="border-b border-slate-700/40 last:border-0"
                      >
                        <td className="px-6 py-3.5 text-sm text-slate-400">{row.label}</td>
                        <td className="px-4 py-3.5 text-center">
                          <CompareCell value={row.individual} />
                        </td>
                        <td className="bg-blue-600/5 px-4 py-3.5 text-center">
                          <CompareCell value={row.organization} />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <CompareCell value={row.schools} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-slate-500">
              14-day trial on paid plans. Prices in Azerbaijani manat (₼).
            </p>
          </div>
        </section>

        <section
          id="about"
          className="scroll-mt-20 border-t border-slate-800 bg-slate-900/50 px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white">About us</h2>
            <p className="mt-6 text-left text-base leading-relaxed text-slate-400 sm:text-center">
              Teacher Hub is built for educators who run classes—not enterprise IT
              departments. We focus on rosters, attendance, prepaid lessons, and a simple
              student portal so tutors, studios, and schools can spend less time in
              spreadsheets and more time teaching.
            </p>
            <p className="mt-4 text-left text-base leading-relaxed text-slate-400 sm:text-center">
              Whether you teach on your own or coordinate a small team, the same tools
              help you stay organized. Larger organization and school features are on our
              roadmap as we grow with your feedback.
            </p>
          </div>
        </section>

        <section
          id="contact"
          className="scroll-mt-20 border-t border-slate-800 px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white">Contact</h2>
            <p className="mt-4 text-slate-400">
              Questions about plans, schools, or partnerships? We&apos;d love to hear from you.
            </p>
            <a
              href="mailto:hello@teacherhub.app"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-6 py-3.5 text-sm font-semibold text-white ring-1 ring-slate-600 transition-colors hover:bg-slate-700"
            >
              <Mail className="h-4 w-4" strokeWidth={2} />
              hello@teacherhub.app
            </a>
            <p className="mt-4 text-sm text-slate-500">
              Schools plan:{' '}
              <a
                href="mailto:sales@teacherhub.app"
                className="text-blue-400 hover:text-blue-300"
              >
                sales@teacherhub.app
              </a>
            </p>
          </div>
        </section>

        <section className="border-t border-slate-800 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-10 text-center shadow-xl sm:px-8">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Ready to get started?
            </h2>
            <p className="mt-2 text-sm text-blue-100">
              Create a free teacher account or sign in to your existing one.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onGetStarted}
                className="w-full rounded-xl bg-white px-8 py-3 text-sm font-semibold text-blue-700 shadow-lg transition-transform hover:scale-[1.02] sm:w-auto"
              >
                Create teacher account
              </button>
              <button
                type="button"
                onClick={onSignIn}
                className="w-full rounded-xl border border-white/30 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Sign in
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 px-4 py-8 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className="transition-colors hover:text-slate-300"
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-4">© {new Date().getFullYear()} Teacher Hub. Built for educators.</p>
      </footer>
    </div>
  )
}
