import type { ClassDaySchedule } from '../types'

export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export function createDefaultWeeklySchedule(): ClassDaySchedule[] {
  return WEEKDAYS.map((day) => ({
    day,
    enabled: false,
    time: '09:00',
  }))
}

export function formatTime12h(time24: string): string {
  const [h, m] = time24.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return time24
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`
}

export function formatClassSchedule(
  weeklySchedule: ClassDaySchedule[],
  location: string,
): string {
  const dayParts = weeklySchedule
    .filter((d) => d.enabled)
    .map((d) => `${d.day.slice(0, 3)} · ${formatTime12h(d.time)}`)

  if (dayParts.length === 0) {
    return location.trim() || 'No schedule set'
  }

  const scheduleStr = dayParts.join(', ')
  const loc = location.trim()
  return loc ? `${scheduleStr} · ${loc}` : scheduleStr
}
