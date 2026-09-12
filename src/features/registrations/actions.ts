'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/features/activity/actions'
import type { ActionState } from '@/types'

const RegisterSchema = z.object({
  startup_name: z.string().min(2, 'Startup name must be at least 2 characters'),
  founder_name: z.string().min(2, 'Founder name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  logo_url: z.string().optional(),
})

export async function registerStartup(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validated = RegisterSchema.safeParse({
    startup_name: formData.get('startup_name'),
    founder_name: formData.get('founder_name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    password: formData.get('password'),
    logo_url: (formData.get('logo_url') as string)?.trim() || undefined,
  })

  if (!validated.success) {
    return { error: validated.error.errors[0].message }
  }

  const { startup_name, founder_name, email, phone, password, logo_url } = validated.data
  const adminClient = getAdminClient()

  // Process logo file upload if provided
  let finalLogoUrl: string | null = logo_url || null
  const logoFile = formData.get('logo_file') as File | null

  if (logoFile && logoFile.size > 0 && logoFile.name) {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml', 'image/gif']
    if (!allowedTypes.includes(logoFile.type)) {
      return { error: 'Invalid logo format. Please upload a PNG, JPEG, SVG, or WebP image.' }
    }
    if (logoFile.size > 5 * 1024 * 1024) {
      return { error: 'Logo file size exceeds 5MB limit.' }
    }

    try {
      const ext = logoFile.name.split('.').pop()?.toLowerCase() || 'png'
      const sanitizedName = startup_name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 24)
      const fileName = `${sanitizedName}-${Date.now()}.${ext}`
      const buffer = Buffer.from(await logoFile.arrayBuffer())

      const { error: uploadError } = await adminClient.storage
        .from('company-logos')
        .upload(fileName, buffer, {
          contentType: logoFile.type || 'image/png',
          upsert: true,
        })

      if (!uploadError) {
        const { data: pubUrlData } = adminClient.storage
          .from('company-logos')
          .getPublicUrl(fileName)
        if (pubUrlData?.publicUrl) {
          finalLogoUrl = pubUrlData.publicUrl
        }
      } else {
        console.error('Logo upload error:', uploadError)
      }
    } catch (err) {
      console.error('Error processing logo upload:', err)
    }
  }

  // 1. Create Supabase Auth user via Admin API
  // Bypasses email rate limits and auto-confirms email so admin approval controls access
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: founder_name },
  })

  if (authError || !authData.user) {
    if (authError?.message?.includes('already registered') || authError?.message?.includes('already been registered')) {
      return { error: 'This email is already registered.' }
    }
    return { error: authError?.message || 'Failed to create account' }
  }

  const userId = authData.user.id

  // 2. Create founder profile
  const { error: profileError } = await adminClient.from('profiles').insert({
    id: userId,
    full_name: founder_name,
    phone: phone || null,
    role: 'FOUNDER',
  })

  if (profileError) {
    return { error: 'Failed to create profile. Please try again.' }
  }

  // 3. Create startup record (PENDING status)
  const { data: startup, error: startupError } = await adminClient
    .from('startups')
    .insert({
      name: startup_name,
      email,
      phone: phone || null,
      logo_url: finalLogoUrl,
      status: 'PENDING',
    })
    .select()
    .single()

  if (startupError || !startup) {
    return { error: 'Failed to create startup. Please try again.' }
  }

  // 4. Create startup_members entry linking founder to startup
  const { error: memberError } = await adminClient.from('startup_members').insert({
    startup_id: startup.id,
    user_id: userId,
    role: 'FOUNDER',
  })

  if (memberError) {
    return { error: 'Failed to link founder to startup.' }
  }

  // 5. Create registration request
  const { error: reqError } = await adminClient.from('registration_requests').insert({
    startup_id: startup.id,
    status: 'PENDING',
  })

  if (reqError) {
    return { error: 'Failed to submit registration request.' }
  }

  return {
    success: 'Registration submitted! Day One Admin will review your application.',
    data: { startupId: startup.id },
  }
}

const ApproveSchema = z.object({
  requestId: z.string().uuid(),
  startupId: z.string().uuid(),
})

export async function approveRegistration(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validated = ApproveSchema.safeParse({
    requestId: formData.get('requestId'),
    startupId: formData.get('startupId'),
  })

  if (!validated.success) return { error: 'Invalid request' }

  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'ADMIN') return { error: 'Unauthorized' }

  const { requestId, startupId } = validated.data

  // Update registration request
  const { error: reqError } = await supabase
    .from('registration_requests')
    .update({ status: 'APPROVED', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', requestId)

  if (reqError) return { error: 'Failed to approve registration' }

  // Update startup status to ACTIVE
  const { error: startupError } = await supabase
    .from('startups')
    .update({ status: 'ACTIVE' })
    .eq('id', startupId)

  if (startupError) return { error: 'Failed to activate startup' }

  await logActivity({
    startupId,
    action: 'APPROVED_REGISTRATION',
    entityType: 'registration_request',
    entityId: requestId,
    metadata: { approved_by: user.id },
  })

  revalidatePath('/admin/registrations')
  revalidatePath('/admin')

  return { success: 'Registration approved. Founder can now log in.' }
}

const RejectSchema = z.object({
  requestId: z.string().uuid(),
  startupId: z.string().uuid(),
  rejection_reason: z.string().min(1, 'Rejection reason is required'),
})

export async function rejectRegistration(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validated = RejectSchema.safeParse({
    requestId: formData.get('requestId'),
    startupId: formData.get('startupId'),
    rejection_reason: formData.get('rejection_reason'),
  })

  if (!validated.success) return { error: validated.error.errors[0].message }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'ADMIN') return { error: 'Unauthorized' }

  const { requestId, startupId, rejection_reason } = validated.data

  const { error: reqError } = await supabase
    .from('registration_requests')
    .update({
      status: 'REJECTED',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason,
    })
    .eq('id', requestId)

  if (reqError) return { error: 'Failed to reject registration' }

  await supabase
    .from('startups')
    .update({ status: 'REJECTED' })
    .eq('id', startupId)

  await logActivity({
    startupId,
    action: 'REJECTED_REGISTRATION',
    entityType: 'registration_request',
    entityId: requestId,
    metadata: { rejected_by: user.id, reason: rejection_reason },
  })

  revalidatePath('/admin/registrations')
  revalidatePath('/admin')

  return { success: 'Registration rejected.' }
}
