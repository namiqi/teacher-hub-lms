import { logger } from './logger'
import { normalizeJoinCodeInput } from './joinCodes'
import { getInitials } from './storage'
import { ensureTokenMapsForEnrollment } from './studentTokens'
import { studentEmailFromName } from './utils'
import type {
  Class,
  JoinRequest,
  Student,
  StudentAccount,
} from '../types'
import { NEW_STUDENT_TOKEN_CAPACITY } from './classKeys'

export function findClassByJoinCode(
  classes: Class[],
  codeInput: string,
): Class | undefined {
  const normalized = normalizeJoinCodeInput(codeInput)
  return classes.find(
    (c) =>
      c.status === 'active' &&
      c.joinCode &&
      normalizeJoinCodeInput(c.joinCode) === normalized,
  )
}

export function pendingRequestsForTeacher(
  requests: JoinRequest[],
  classes: Class[],
): JoinRequest[] {
  const activeKeys = new Set(
    classes.filter((c) => c.status === 'active').map((c) => c.classKey),
  )
  return requests.filter(
    (r) => r.status === 'pending' && activeKeys.has(r.classKey),
  )
}

export function canSubmitJoinRequest(
  account: StudentAccount,
  classKey: string,
  requests: JoinRequest[],
  students: Student[],
): { ok: true } | { ok: false; reason: string } {
  if (account.linkedStudentId) {
    const linked = students.find((s) => s.id === account.linkedStudentId)
    if (
      linked?.status === 'active' &&
      linked.enrolledClasses.includes(classKey)
    ) {
      return { ok: false, reason: 'You are already in this class.' }
    }
  }

  const existingPending = requests.find(
    (r) =>
      r.status === 'pending' &&
      r.studentAccountId === account.id &&
      r.classKey === classKey,
  )
  if (existingPending) {
    return { ok: false, reason: 'You already have a pending request for this class.' }
  }

  const recentPending = requests.filter(
    (r) =>
      r.status === 'pending' &&
      r.studentAccountId === account.id &&
      Date.now() - new Date(r.createdAt).getTime() < 60_000,
  )
  if (recentPending.length >= 3) {
    return {
      ok: false,
      reason: 'Please wait a minute before submitting more join requests.',
    }
  }

  return { ok: true }
}

export function createJoinRequest(
  account: StudentAccount,
  cls: Class,
  requestedName: string,
): JoinRequest {
  return {
    id: `join-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    classKey: cls.classKey,
    studentAccountId: account.id,
    requestedName: requestedName.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
}

export function approveJoinRequest(
  request: JoinRequest,
  students: Student[],
  classes: Class[],
  accounts: StudentAccount[],
): {
  students: Student[]
  accounts: StudentAccount[]
  request: JoinRequest
} {
  const account = accounts.find((a) => a.id === request.studentAccountId)
  const cls = classes.find((c) => c.classKey === request.classKey)
  if (!account || !cls) {
    throw new Error('Missing account or class for this request.')
  }

  let nextStudents = [...students]
  let linkedId = account.linkedStudentId

  if (linkedId) {
    const existing = nextStudents.find((s) => s.id === linkedId)
    if (existing) {
      if (!existing.enrolledClasses.includes(request.classKey)) {
        const maps = ensureTokenMapsForEnrollment(
          existing,
          [...existing.enrolledClasses, request.classKey],
          0,
        )
        nextStudents = nextStudents.map((s) =>
          s.id === linkedId ? { ...s, ...maps, status: 'active' as const } : s,
        )
      }
    } else {
      linkedId = undefined
    }
  }

  if (!linkedId) {
    const nextId =
      nextStudents.reduce((max, s) => Math.max(max, s.id), 0) + 1
    const name = request.requestedName.trim() || account.displayName
    const maps = ensureTokenMapsForEnrollment(
      {
        id: nextId,
        name,
        email: account.email || studentEmailFromName(name),
        studentPhone: '',
        parentPhone: '',
        grade: '',
        status: 'active',
        initials: getInitials(name),
        avatarColor: '',
        enrolledClasses: [],
        tokensByClass: {},
        tokenCapacityByClass: {},
      },
      [request.classKey],
      0,
    )
    maps.tokenCapacityByClass[request.classKey] = NEW_STUDENT_TOKEN_CAPACITY

    const newStudent: Student = {
      id: nextId,
      name,
      email: account.email || studentEmailFromName(name),
      studentPhone: '',
      parentPhone: '',
      grade: '',
      status: 'active',
      initials: getInitials(name),
      avatarColor: 'bg-violet-500',
      enrolledClasses: maps.enrolledClasses,
      tokensByClass: maps.tokensByClass,
      tokenCapacityByClass: maps.tokenCapacityByClass,
      studentAccountId: account.id,
    }
    nextStudents = [...nextStudents, newStudent]
    linkedId = nextId
  } else {
    nextStudents = nextStudents.map((s) =>
      s.id === linkedId
        ? {
            ...s,
            name: request.requestedName.trim() || s.name,
            studentAccountId: account.id,
          }
        : s,
    )
  }

  const nextAccounts = accounts.map((a) =>
    a.id === account.id ? { ...a, linkedStudentId: linkedId } : a,
  )

  const approvedRequest: JoinRequest = {
    ...request,
    status: 'approved',
    reviewedAt: new Date().toISOString(),
  }

  logger.info('Join request approved', {
    requestId: request.id,
    classKey: request.classKey,
    studentId: linkedId,
  })

  return {
    students: nextStudents,
    accounts: nextAccounts,
    request: approvedRequest,
  }
}
