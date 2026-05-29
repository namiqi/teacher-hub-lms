import {
  BarChart3,
  Building2,
  Calendar,
  Check,
  GraduationCap,
  Layers,
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
      'Hosted in the cloud with secure backups. Your roster and billing data stay under your account.',
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

/** USD ≈ 1.70 AZN (CBAR peg). Competitor refs: Teachworks ~$17/mo, TutorCruncher $30–80/mo. */
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
  onStudentPortal,
  onDevBypass,
}: LandingPageProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleTierCta = (tier: PricingTier) => {
    if (tier.id === 'individual') {
      onGetStarted()
      return
    }
    if (tier.id === 'organization') {
      onGetStarted()
      return
    }
    window.location.href = 'mailto:sales@teacherhub.app?subject=Schools%20plan%20inquiry'
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0f172a]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <GraduationCap className="h-5 w-5 text-white" strokeWidth={2.25} />
            </div>
            <span className="text-lg font-semibold tracking-tight">Teacher Hub</span>
          </div>
          <nav className="hidden items-center gap-6 sm:flex">
            <button
              type="button"
              onClick={() => scrollTo('features')}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollTo('pricing')}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              Pricing
            </button>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onSignIn}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white sm:px-4"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 sm:px-4"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 pb-20 pt-12 lg:px-8 lg:pt-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.15),_transparent_50%)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-800/50 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-blue-300">
              CRM for tutors, studios & schools
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Run your classes
              <span className="mt-2 block bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                without the spreadsheet chaos.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
              Teacher Hub helps you track students, attendance, and prepaid lessons—whether
              you teach solo, run a studio, or manage a whole school.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={onGetStarted}
                className="w-full rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-600/30 transition-all hover:bg-blue-500 hover:shadow-blue-500/40 sm:w-auto"
              >
                Plans from 20 ₼/month
              </button>
              <button
                type="button"
                onClick={() => scrollTo('pricing')}
                className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-8 py-3.5 text-sm font-semibold text-slate-200 transition-all hover:border-slate-500 hover:bg-slate-800 sm:w-auto"
              >
                View pricing
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

        <section
          id="features"
          className="scroll-mt-20 border-t border-slate-800 bg-slate-900/50 px-6 py-20 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Why teachers choose Teacher Hub
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-400">
                Less busywork, more teaching. Every plan includes the core tools you need
                to run classes day to day.
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

        <section
          id="pricing"
          className="scroll-mt-20 border-t border-slate-800 px-6 py-20 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Simple pricing that grows with you
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-400">
                Priced below international tutoring CRMs, with no commission on your
                lesson revenue. Pay for hosting and software that saves you hours each
                week.
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
                or revenue fees. Teacher Hub uses a flat monthly price in manats—no cut of
                what you charge students.
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
                <p className="mt-1 text-sm text-slate-400">
                  See what&apos;s included at each level
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b border-slate-700/60">
                      <th className="px-6 py-4 text-sm font-medium text-slate-400">
                        Feature
                      </th>
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
                        <td className="px-4 py-3.5 text-center bg-blue-600/5">
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
              All plans include a 14-day trial. Prices in Azerbaijani manat (₼); USD
              equivalents use the official ~1.70 ₼/USD rate. No commission on lesson
              payments you collect from families.
            </p>
          </div>
        </section>

        <section className="px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center shadow-xl">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Ready to replace your classroom spreadsheets?
            </h2>
            <p className="mt-3 text-blue-100">
              Try free for 14 days, then from 20 ₼/month when billed annually.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onGetStarted}
                className="w-full rounded-xl bg-white px-8 py-3 text-sm font-semibold text-blue-700 shadow-lg transition-transform hover:scale-[1.02] sm:w-auto"
              >
                Start your 14-day trial
              </button>
              <button
                type="button"
                onClick={() => scrollTo('pricing')}
                className="w-full rounded-xl border border-white/30 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Compare plans
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500 lg:px-8">
        © {new Date().getFullYear()} Teacher Hub. Built for educators.
      </footer>
    </div>
  )
}
