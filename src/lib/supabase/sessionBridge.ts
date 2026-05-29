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

export async function resolveStudentSession(
  userId: string,
  options?: { displayName?: string; email?: string },
): Promise<{
  account: StudentAccount
  portal: Awaited<ReturnType<typeof fetchStudentPortalData>>
}> {
  const displayName = options?.displayName
  const email = options?.email

  for (let attempt = 0; attempt < 6; attempt++) {
    let account = await fetchStudentProfile(userId)
    if (!account && displayName && email) {
      await ensureProfileRole(userId, 'student', displayName, email)
      account = await fetchStudentProfile(userId)
    }
    if (account) {
      const portal = await fetchStudentPortalData(userId, account)
      return { account, portal }
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  throw new Error(
    'Student profile could not be created. Run supabase/schema-4-rls-insert.sql in Supabase, or add the student row in Table Editor.',
  )
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
