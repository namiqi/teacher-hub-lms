import { createDefaultWeeklySchedule, formatClassSchedule } from '../lib/classSchedule'
import { INITIAL_STUDENTS } from './students'
import type { Class } from '../types'

const BASE_CLASSES: Omit<
  Class,
  'studentIds' | 'weeklySchedule' | 'location' | 'students'
>[] = [
  {
    id: 1,
    classKey: 'math_201',
    name: 'Algebra II',
    status: 'active',
    schedule: 'Mon, Wed, Fri · 9:00 AM',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 2,
    classKey: 'math_401',
    name: 'Calculus AP',
    status: 'active',
    schedule: 'Mon, Wed, Fri · 11:30 AM',
    color: 'from-violet-500 to-violet-600',
  },
  {
    id: 3,
    classKey: 'math_101',
    name: 'Geometry',
    status: 'active',
    schedule: 'Tue, Thu · 10:00 AM',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 4,
    classKey: 'math_301',
    name: 'Statistics',
    status: 'active',
    schedule: 'Tue, Thu · 1:30 PM',
    color: 'from-amber-500 to-amber-600',
  },
]

function seedWeeklyForClass(name: string) {
  const schedule = createDefaultWeeklySchedule()
  if (name === 'Algebra II') {
    ;['Monday', 'Wednesday', 'Friday'].forEach((day) => {
      const entry = schedule.find((d) => d.day === day)
      if (entry) {
        entry.enabled = true
        entry.time = '09:00'
      }
    })
  }
  if (name === 'Calculus AP') {
    ;['Monday', 'Wednesday', 'Friday'].forEach((day) => {
      const entry = schedule.find((d) => d.day === day)
      if (entry) {
        entry.enabled = true
        entry.time = '11:30'
      }
    })
  }
  if (name === 'Geometry') {
    ;['Tuesday', 'Thursday'].forEach((day) => {
      const entry = schedule.find((d) => d.day === day)
      if (entry) {
        entry.enabled = true
        entry.time = '10:00'
      }
    })
  }
  if (name === 'Statistics') {
    ;['Tuesday', 'Thursday'].forEach((day) => {
      const entry = schedule.find((d) => d.day === day)
      if (entry) {
        entry.enabled = true
        entry.time = '13:30'
      }
    })
  }
  return schedule
}

function buildClass(base: (typeof BASE_CLASSES)[number]): Class {
  const studentIds = INITIAL_STUDENTS.filter(
    (s) => s.status === 'active' && s.enrolledClasses.includes(base.classKey),
  ).map((s) => s.id)
  const weeklySchedule = seedWeeklyForClass(base.name)
  const location =
    base.name === 'Calculus AP'
      ? 'Room 112'
      : base.name === 'Statistics'
        ? 'Room 118'
        : 'Room 204'

  return {
    ...base,
    studentIds,
    students: studentIds.length,
    weeklySchedule,
    location,
    schedule: formatClassSchedule(weeklySchedule, location),
  }
}

export const INITIAL_CLASSES: Class[] = BASE_CLASSES.map(buildClass)

export const CLASS_GRADIENTS = [
  'from-blue-500 to-blue-600',
  'from-violet-500 to-violet-600',
  'from-emerald-500 to-emerald-600',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
  'from-cyan-500 to-cyan-600',
] as const
