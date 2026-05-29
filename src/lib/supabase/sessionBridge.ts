import { initializeEmptyWorkspace } from '../workspace'
import type { StudentAccount, User } from '../../types'
import {
  ensureProfileRole,
  fetchTeacherProfile,
  getProfileRole,
  getSession,
} from './auth'
import { isSupabaseConfigured } from './client'
import { fetchStudentPortalData, fetchStudentProfile } from './studentData'
import { fetchTeacherWorkspace } from './teacherData'

export async function resolveTeacherSession(userId: string): Promise<{
  user: User
  workspace: Awaited<ReturnType<typeof fetchTeacherWorkspace>>
}> {
  const user = await fetchTeacherProfile(userId)
  if (!user) throw new Error('Teacher profile not found.')
  const workspace = await fetchTeacherWorkspace(userId)
  return { user, workspace }
}

export async function resolveStudentSession(userId: string): Promise<{
  account: StudentAccount
  portal: Awaited<ReturnType<typeof fetchStudentPortalData>>
}> {
  const account = await fetchStudentProfile(userId)
  if (!account) throw new Error('Student profile not found.')
  const portal = await fetchStudentPortalData(userId, account)
  return { account, portal }
}

export async function bootstrapAuthSession(): Promise<{
  role: 'teacher' | 'student' | null
  userId: string | null
}> {
  if (!isSupabaseConfigured()) return { role: null, userId: null }
  const session = await getSession()
  if (!session?.user) return { role: null, userId: null }
  const role = await getProfileRole(session.user.id)
  return { role, userId: session.user.id }
}

export async function ensureOAuthProfile(
  userId: string,
  email: string,
  metadata: Record<string, unknown>,
): Promise<'teacher' | 'student'> {
  const role =
    metadata.role === 'student' ? 'student' : ('teacher' as const)
  const displayName =
    (typeof metadata.display_name === 'string' && metadata.display_name) ||
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    email.split('@')[0]
  await ensureProfileRole(userId, role, displayName, email)
  return role
}

export function applyEmptyTeacherWorkspace() {
  return initializeEmptyWorkspace()
}
