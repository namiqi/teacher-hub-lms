const STORAGE_PREFIX = 'hub-student-seen-'

export interface StudentSeenState {
  lastVisitAt: string | null
  seenGradedSubmissionIds: string[]
  seenApprovedRequestIds: string[]
}

function storageKey(accountId: number): string {
  return `${STORAGE_PREFIX}${accountId}`
}

function readState(accountId: number): StudentSeenState {
  try {
    const raw = localStorage.getItem(storageKey(accountId))
    if (!raw) {
      return {
        lastVisitAt: null,
        seenGradedSubmissionIds: [],
        seenApprovedRequestIds: [],
      }
    }
    const parsed = JSON.parse(raw) as Partial<StudentSeenState>
    return {
      lastVisitAt: parsed.lastVisitAt ?? null,
      seenGradedSubmissionIds: parsed.seenGradedSubmissionIds ?? [],
      seenApprovedRequestIds: parsed.seenApprovedRequestIds ?? [],
    }
  } catch {
    return {
      lastVisitAt: null,
      seenGradedSubmissionIds: [],
      seenApprovedRequestIds: [],
    }
  }
}

function writeState(accountId: number, state: StudentSeenState): void {
  localStorage.setItem(storageKey(accountId), JSON.stringify(state))
}

export function getStudentSeenState(accountId: number): StudentSeenState {
  return readState(accountId)
}

export function markPortalVisited(accountId: number): void {
  const state = readState(accountId)
  writeState(accountId, {
    ...state,
    lastVisitAt: new Date().toISOString(),
  })
}

export function markGradedSubmissionSeen(
  accountId: number,
  submissionId: string,
): void {
  const state = readState(accountId)
  if (state.seenGradedSubmissionIds.includes(submissionId)) return
  writeState(accountId, {
    ...state,
    seenGradedSubmissionIds: [...state.seenGradedSubmissionIds, submissionId],
  })
}

export function markJoinApprovedSeen(accountId: number, requestId: string): void {
  const state = readState(accountId)
  if (state.seenApprovedRequestIds.includes(requestId)) return
  writeState(accountId, {
    ...state,
    seenApprovedRequestIds: [...state.seenApprovedRequestIds, requestId],
  })
}
