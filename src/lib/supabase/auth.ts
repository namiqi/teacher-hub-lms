import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import type { SessionRole, User } from '../../types'
import { getInitials } from '../storage'
import { getSupabase, isSupabaseConfigured } from './client'

export type AppRole = SessionRole

/** Friendlier message for Supabase free-tier auth email limits. */
export function formatAuthError(message: string): string {
  if (/rate limit/i.test(message)) {
    return (
      'Sign-up is temporarily blocked by Supabase (free plan allows very few auth emails per hour, and each sign-up attempt counts). ' +
      'Wait about an hour, use Sign in if you already registered, or create the user in Supabase → Authentication → Users → Add user (enable Auto-confirm), then Sign in here.'
    )
  }
  return message
}

export function mapTeacherUser(
  profile: { display_name: string; email: string; initials: string },
): User {
  return {
    name: profile.display_name,
    email: profile.email,
    initials: profile.initials || getInitials(profile.display_name),
    role: 'Teacher',
    isAuthenticated: true,
  }
}

export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null
  const { data } = await getSupabase().auth.getSession()
  return data.session
}

export async function getProfileRole(userId: string): Promise<AppRole | null> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data.role === 'student' ? 'student' : 'teacher'
}

export async function fetchTeacherProfile(userId: string): Promise<User | null> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('display_name, email, initials')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) return null
  return mapTeacherUser(data)
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  role: AppRole,
): Promise<{
  user: SupabaseUser | null
  session: Session | null
  error: string | null
}> {
  const { data, error } = await getSupabase().auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        role,
        display_name: displayName.trim(),
      },
    },
  })
  if (error) return { user: null, session: null, error: formatAuthError(error.message) }
  return { user: data.user, session: data.session, error: null }
}

/** Sign-up may return a user without a session until sign-in (or email confirm). */
export async function ensureActiveSession(
  email: string,
  password: string,
): Promise<void> {
  const { data } = await getSupabase().auth.getSession()
  if (data.session) return

  const { error } = await getSupabase().auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw new Error(formatAuthError(error.message))
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const { error } = await getSupabase().auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  return { error: error ? formatAuthError(error.message) : null }
}

export async function signInWithGoogle(role: AppRole): Promise<{ error: string | null }> {
  sessionStorage.setItem('pending_oauth_role', role)
  const redirectTo = `${window.location.origin}${window.location.pathname}`
  const { error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  return { error: error?.message ?? null }
}

export async function signOutSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) return
  await getSupabase().auth.signOut()
}

export function onAuthStateChange(
  callback: (session: Session | null) => void,
): () => void {
  if (!isSupabaseConfigured()) return () => {}
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => data.subscription.unsubscribe()
}

/** Create or repair profile + teacher workspace / student profile rows. */
export async function ensureProfileRole(
  userId: string,
  role: AppRole,
  displayName: string,
  email: string,
): Promise<void> {
  const supabase = getSupabase()
  const initials = getInitials(displayName)

  const { data: existing } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', userId)
    .maybeSingle()

  if (!existing) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      role,
      display_name: displayName,
      email,
      initials,
    })
    if (profileError) throw new Error(profileError.message)
  } else if (existing.role !== role) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role, display_name: displayName, email, initials })
      .eq('id', userId)
    if (updateError) throw new Error(updateError.message)
  }

  if (role === 'teacher') {
    const { data: workspace } = await supabase
      .from('teacher_workspaces')
      .select('teacher_id')
      .eq('teacher_id', userId)
      .maybeSingle()

    if (!workspace) {
      const { error } = await supabase.from('teacher_workspaces').insert({
        teacher_id: userId,
        workspace: emptyWorkspaceJson(),
      })
      if (error) throw new Error(error.message)
    }
    return
  }

  const { data: studentRow } = await supabase
    .from('student_profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!studentRow) {
    const { error } = await supabase.from('student_profiles').insert({
      user_id: userId,
      display_name: displayName,
      email,
      initials,
    })
    if (error) throw new Error(error.message)
  }
}

function emptyWorkspaceJson() {
  return {
    classes: [],
    students: [],
    attendance: { columns: [], recordsByClass: {} },
    payments: [],
    assignments: [],
  }
}
