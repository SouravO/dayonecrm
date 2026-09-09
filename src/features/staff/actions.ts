'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/features/activity/actions'
import type { ActionState } from '@/types'

const AddStaffSchema = z.object({
  startup_id: z.string().uuid(),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

/**
 * Founder adds a staff member by creating their account with a temporary password.
 * Staff can log in immediately — no email required for MVP.
 */
export async function addStaffMember(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validated = AddStaffSchema.safeParse({
    startup_id: formData.get('startup_id'),
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    password: formData.get('password'),
  })

  if (!validated.success) return { error: validated.error.errors[0].message }

  const supabase = await createClient()

  // Verify founder is authenticated and owns this startup
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { startup_id, full_name, email, phone, password } = validated.data
  const adminClient = createAdminClient()

  // Create Supabase Auth user for staff member (bypasses email rate limits)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (authError || !authData.user) {
    if (authError?.message?.includes('already registered') || authError?.message?.includes('already been registered')) {
      return { error: 'This email is already registered in the system.' }
    }
    return { error: authError?.message || 'Failed to create staff account' }
  }

  const staffUserId = authData.user.id

  // Create profile for staff
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: staffUserId,
    full_name,
    phone: phone || null,
    role: 'STAFF',
  })

  if (profileError) return { error: 'Failed to create staff profile' }

  // Link staff to startup
  const { error: memberError } = await supabase.from('startup_members').insert({
    startup_id,
    user_id: staffUserId,
    role: 'STAFF',
  })

  if (memberError) return { error: 'Failed to add staff to startup' }

  await logActivity({
    startupId: startup_id,
    action: 'ADDED_STAFF',
    entityType: 'profile',
    entityId: staffUserId,
    metadata: { staff_name: full_name, staff_email: email },
  })

  revalidatePath('/founder/staff')
  return {
    success: `${full_name} has been added as staff. They can now log in with ${email}.`,
    data: { staffId: staffUserId },
  }
}

export async function removeStaffMember(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const memberId = formData.get('member_id') as string
  if (!memberId) return { error: 'Missing member ID' }

  const supabase = await createClient()
  const { error } = await supabase.from('startup_members').delete().eq('id', memberId)

  if (error) return { error: 'Failed to remove staff member' }

  revalidatePath('/founder/staff')
  return { success: 'Staff member removed' }
}
