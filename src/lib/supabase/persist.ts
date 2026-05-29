import type { TeacherWorkspaceData } from './teacherData'
import { saveTeacherWorkspace } from './teacherData'

let saveTimer: ReturnType<typeof setTimeout> | null = null
let pending: { teacherId: string; data: TeacherWorkspaceData } | null = null

export function scheduleTeacherWorkspaceSave(
  teacherId: string,
  data: TeacherWorkspaceData,
  delayMs = 800,
): void {
  pending = { teacherId, data }
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    const payload = pending
    pending = null
    saveTimer = null
    if (!payload) return
    try {
      await saveTeacherWorkspace(payload.teacherId, payload.data)
    } catch (err) {
      console.error('[Teacher Hub] Failed to save workspace', err)
    }
  }, delayMs)
}

export async function flushTeacherWorkspaceSave(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  if (!pending) return
  const payload = pending
  pending = null
  await saveTeacherWorkspace(payload.teacherId, payload.data)
}
