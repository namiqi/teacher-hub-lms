import type { Class, Student } from '../types'
import { DEFAULT_TOKEN_CAPACITY, NEW_STUDENT_TOKEN_CAPACITY } from './classKeys'

export function getTokenBalance(student: Student, classKey: string): number {
  return student.tokensByClass[classKey] ?? 0
}

export function getTokenCapacity(student: Student, classKey: string): number {
  return student.tokenCapacityByClass[classKey] ?? DEFAULT_TOKEN_CAPACITY
}

export function formatTokenLabel(student: Student, classKey: string): string {
  const left = getTokenBalance(student, classKey)
  const total = getTokenCapacity(student, classKey)
  return `${left} / ${total}`
}

export function isClassCritical(student: Student, classKey: string): boolean {
  return getTokenBalance(student, classKey) <= 0
}

/** Apply attendance-driven token change; balances may go negative. */
export function adjustTokenBalance(
  student: Student,
  classKey: string,
  delta: number,
): Student {
  if (delta === 0) return student
  const current = getTokenBalance(student, classKey)
  return {
    ...student,
    tokensByClass: {
      ...student.tokensByClass,
      [classKey]: current + delta,
    },
  }
}

export function hasAnyCriticalBalance(student: Student): boolean {
  return student.enrolledClasses.some((key) => isClassCritical(student, key))
}

export function classNameForKey(classes: Class[], classKey: string): string {
  return classes.find((c) => c.classKey === classKey)?.name ?? classKey
}

export function syncClassRosters(classes: Class[], students: Student[]): Class[] {
  return classes.map((c) => {
    const studentIds = students
      .filter(
        (s) => s.status === 'active' && s.enrolledClasses.includes(c.classKey),
      )
      .map((s) => s.id)
    return { ...c, studentIds, students: studentIds.length }
  })
}

export function ensureTokenMapsForEnrollment(
  student: Student,
  enrolledClasses: string[],
  defaultBalance = 0,
): Pick<Student, 'enrolledClasses' | 'tokensByClass' | 'tokenCapacityByClass'> {
  const tokensByClass = { ...student.tokensByClass }
  const tokenCapacityByClass = { ...student.tokenCapacityByClass }

  for (const key of enrolledClasses) {
    if (tokensByClass[key] === undefined) {
      tokensByClass[key] = defaultBalance
    }
    if (tokenCapacityByClass[key] === undefined) {
      tokenCapacityByClass[key] = NEW_STUDENT_TOKEN_CAPACITY
    }
  }

  for (const key of Object.keys(tokensByClass)) {
    if (!enrolledClasses.includes(key)) {
      delete tokensByClass[key]
      delete tokenCapacityByClass[key]
    }
  }

  return { enrolledClasses, tokensByClass, tokenCapacityByClass }
}

export function applyTopUp(
  student: Student,
  classKey: string,
  added: number,
): Student {
  const current = getTokenBalance(student, classKey)
  const next = current + added
  return {
    ...student,
    tokensByClass: { ...student.tokensByClass, [classKey]: next },
    tokenCapacityByClass: {
      ...student.tokenCapacityByClass,
      [classKey]: Math.max(getTokenCapacity(student, classKey), next),
    },
  }
}
