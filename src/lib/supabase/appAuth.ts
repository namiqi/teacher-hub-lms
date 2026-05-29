import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { StudentAccount, User } from '../../types'
import {
  ensureProfileRole,
  getProfileRole,
} from './auth'
import { resolveStudentSession, resolveTeacherSession } from './sessionBridge'
import type { StudentPortalData } from './studentData'
import type { TeacherCloudState } from './teacherData'

export type TeacherSessionPayload = {
  user: User
  teacherId: string
  state: TeacherCloudState
}

export type StudentSessionPayload = {
  account: StudentAccount
  studentId: string
  portal: StudentPortalData
}

export async function routeAuthenticatedUser(
  authUser: SupabaseUser,
): Promise<
  | { role: 'teacher'; payload: TeacherSessionPayload }
  | { role: 'student'; payload: StudentSessionPayload }
> {
  const metadata = authUser.user_metadata ?? {}
  const email = authUser.email ?? ''
  const pending = sessionStorage.getItem('pending_oauth_role')
  const pendingRole =
    pending === 'student' || pending === 'teacher' ? pending : null
  if (pendingRole) sessionStorage.removeItem('pending_oauth_role')

  const displayName =
    (typeof metadata.display_name === 'string' && metadata.display_name) ||
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    email.split('@')[0] ||
    'User'

  let role = await getProfileRole(authUser.id)

  if (!role) {
    const inferred: 'teacher' | 'student' =
      pendingRole ??
      (metadata.role === 'student' ? 'student' : 'teacher')
    await ensureProfileRole(authUser.id, inferred, displayName, email)
    role = inferred
  } else if (pendingRole) {
    await ensureProfileRole(authUser.id, pendingRole, displayName, email)
    role = pendingRole
  }

  if (role === 'student') {
    await ensureProfileRole(authUser.id, 'student', displayName, email)
    const { account, portal } = await resolveStudentSession(authUser.id, {
      displayName,
      email,
    })
    return {
      role: 'student',
      payload: { account, studentId: authUser.id, portal },
    }
  }

  const { user, workspace } = await resolveTeacherSession(authUser.id)
  return {
    role: 'teacher',
    payload: { user, teacherId: authUser.id, state: workspace },
  }
}
