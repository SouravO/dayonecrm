import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { SessionUser } from '@/types'

export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return {
    id: user.id,
    email: user.email!,
    role: profile.role,
    full_name: profile.full_name,
  }
}
