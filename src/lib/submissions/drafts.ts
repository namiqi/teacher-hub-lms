/** In-memory draft files survive brief remounts (e.g. auth/focus churn). */
const draftFiles = new Map<string, File[]>()
const draftNotes = new Map<string, string>()

export function getDraftFiles(assignmentId: string): File[] {
  return draftFiles.get(assignmentId) ?? []
}

export function setDraftFiles(assignmentId: string, files: File[]): void {
  if (files.length === 0) draftFiles.delete(assignmentId)
  else draftFiles.set(assignmentId, files)
}

export function getDraftNote(assignmentId: string): string | undefined {
  return draftNotes.get(assignmentId)
}

export function setDraftNote(assignmentId: string, note: string): void {
  if (!note.trim()) draftNotes.delete(assignmentId)
  else draftNotes.set(assignmentId, note)
}

export function clearSubmissionDraft(assignmentId: string): void {
  draftFiles.delete(assignmentId)
  draftNotes.delete(assignmentId)
}
