type LoadingVariant = 'teacher' | 'student' | 'neutral'
type LoadingSize = 'sm' | 'md' | 'lg'

const SPINNER_RING: Record<LoadingSize, string> = {
  sm: 'h-4 w-4 border-[1.5px]',
  md: 'h-9 w-9 border-2',
  lg: 'h-12 w-12 border-2',
}

const SPINNER_DOT: Record<LoadingSize, string> = {
  sm: 'h-1 w-1',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
}

const ACCENT: Record<LoadingVariant, string> = {
  teacher: '#185560',
  student: '#7c3aed',
  neutral: '#64748b',
}

interface LoadingSpinnerProps {
  size?: LoadingSize
  variant?: LoadingVariant
  className?: string
  label?: string
}

export function LoadingSpinner({
  size = 'md',
  variant = 'neutral',
  className = '',
  label = 'Loading',
}: LoadingSpinnerProps) {
  const accent = ACCENT[variant]
  const ring = SPINNER_RING[size]
  const dot = SPINNER_DOT[size]

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      role="status"
      aria-label={label}
    >
      <span
        className={`${ring} animate-spin rounded-full border-slate-200/90`}
        style={{
          borderTopColor: accent,
          borderRightColor: `${accent}33`,
          animationDuration: '0.85s',
        }}
      />
      {size !== 'sm' && (
        <span
          className={`absolute ${dot} rounded-full`}
          style={{ backgroundColor: accent }}
        />
      )}
    </div>
  )
}

interface LoadingStateProps {
  message?: string
  size?: LoadingSize
  variant?: LoadingVariant
  className?: string
  minHeight?: string
  inset?: boolean
}

/** Centered loading block for panels, tabs, and modals. */
export function LoadingState({
  message,
  size = 'md',
  variant = 'neutral',
  className = '',
  minHeight = 'min-h-[8rem]',
  inset = false,
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-4 py-10 text-center ${minHeight} ${
        inset ? 'rounded-xl bg-slate-50/80' : ''
      } ${className}`}
    >
      <LoadingSpinner size={size} variant={variant} label={message ?? 'Loading'} />
      {message && (
        <p className="max-w-xs text-sm font-medium tracking-tight text-slate-500">
          {message}
        </p>
      )}
    </div>
  )
}

interface LoadingScreenProps {
  message?: string
  variant?: LoadingVariant
}

/** Full-page bootstrap loading (auth, initial sync). */
export function LoadingScreen({
  message = 'Loading your workspace…',
  variant = 'teacher',
}: LoadingScreenProps) {
  const accent = ACCENT[variant]

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span
          className="absolute inset-0 animate-ping rounded-full opacity-40"
          style={{ backgroundColor: `${accent}22` }}
        />
        <span
          className="absolute inset-1 animate-spin rounded-full border-2 border-slate-200/90"
          style={{
            borderTopColor: accent,
            borderRightColor: `${accent}44`,
            animationDuration: '1s',
          }}
        />
        <span
          className="relative h-2.5 w-2.5 rounded-full shadow-sm"
          style={{ backgroundColor: accent }}
        />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold text-slate-800">Teacher Hub</p>
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </div>
  )
}

/** Compact inline loading row (lists, sidebars). */
export function LoadingRow({
  message = 'Loading…',
  variant = 'neutral',
  className = '',
}: {
  message?: string
  variant?: LoadingVariant
  className?: string
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-5 text-sm text-slate-500 ${className}`}
    >
      <LoadingSpinner size="sm" variant={variant} label={message} />
      <span>{message}</span>
    </div>
  )
}
