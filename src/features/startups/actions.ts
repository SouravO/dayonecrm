'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/features/activity/actions'
import type { ActionState } from '@/types'

export async function updateStartupLogo(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const startupId = formData.get('startup_id') as string
  const logoUrlInput = (formData.get('logo_url') as string)?.trim() || null
  const removeLogo = formData.get('remove_logo') === 'true'
  const logoFile = formData.get('logo_file') as File | null

  if (!startupId) {
    return { error: 'Startup ID is required' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update company branding.' }
  }

  // Check if user is an ADMIN or a FOUNDER of this startup
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'ADMIN'

  if (!isAdmin) {
    const { data: membership } = await supabase
      .from('startup_members')
      .select('role')
      .eq('startup_id', startupId)
      .eq('user_id', user.id)
      .eq('role', 'FOUNDER')
      .single()

    if (!membership) {
      return { error: 'Only founders or studio admins can modify the company logo.' }
    }
  }

  // Fetch current startup to know previous logo and startup name
  const adminClient = getAdminClient()
  const { data: currentStartup, error: fetchErr } = await adminClient
    .from('startups')
    .select('id, name, logo_url')
    .eq('id', startupId)
    .single()

  if (fetchErr || !currentStartup) {
    return { error: 'Startup not found.' }
  }

  let finalLogoUrl: string | null = currentStartup.logo_url

  if (removeLogo) {
    finalLogoUrl = null
  } else if (logoFile && logoFile.size > 0 && logoFile.name) {
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
      'image/gif',
    ]
    if (!allowedTypes.includes(logoFile.type)) {
      return {
        error: 'Invalid image format. Please upload a PNG, JPEG, SVG, WebP, or GIF.',
      }
    }
    if (logoFile.size > 5 * 1024 * 1024) {
      return { error: 'Logo file size exceeds the 5MB limit.' }
    }

    try {
      const ext = logoFile.name.split('.').pop()?.toLowerCase() || 'png'
      const sanitizedName = (currentStartup.name || 'startup')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 24)
      const fileName = `startups/${sanitizedName}-${Date.now()}.${ext}`
      const buffer = Buffer.from(await logoFile.arrayBuffer())

      const { error: uploadError } = await adminClient.storage
        .from('company-logos')
        .upload(fileName, buffer, {
          contentType: logoFile.type || 'image/png',
          upsert: true,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return { error: 'Failed to upload logo to storage: ' + uploadError.message }
      }

      const { data: pubUrlData } = adminClient.storage
        .from('company-logos')
        .getPublicUrl(fileName)

      if (pubUrlData?.publicUrl) {
        finalLogoUrl = pubUrlData.publicUrl
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error processing logo upload:', err)
      return { error: 'Failed to process logo file upload: ' + message }
    }
  } else if (logoUrlInput) {
    // Basic URL validation
    try {
      new URL(logoUrlInput)
      finalLogoUrl = logoUrlInput
    } catch {
      return { error: 'Please enter a valid URL starting with http:// or https://' }
    }
  }

  // Update startups table
  const { error: updateError } = await adminClient
    .from('startups')
    .update({
      logo_url: finalLogoUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', startupId)

  if (updateError) {
    console.error('Database update error:', updateError)
    return { error: 'Failed to update startup logo in database.' }
  }

  // Log activity
  await logActivity({
    startupId,
    action: finalLogoUrl ? 'UPDATED_LOGO' : 'REMOVED_LOGO',
    entityType: 'startup',
    entityId: startupId,
    metadata: {
      startup_name: currentStartup.name,
      has_logo: Boolean(finalLogoUrl),
    },
  }).catch(() => {})

  // Emit telemetry event so live TV wall catches the change immediately
  try {
    await adminClient.from('telemetry_events').insert({
      startup_id: startupId,
      event_type: 'startups_UPDATE',
    })
  } catch (e) {
    console.error('Failed to emit telemetry event:', e)
  }

  // Revalidate relevant pages
  revalidatePath('/founder')
  revalidatePath('/founder/tasks')
  revalidatePath('/founder/weekly-plan')
  revalidatePath('/founder/staff')
  revalidatePath('/founder/domains')
  revalidatePath('/tv')
  revalidatePath(`/tv/${startupId}`)
  revalidatePath('/admin')
  revalidatePath('/admin/startups')
  revalidatePath(`/admin/startups/${startupId}`)

  return {
    success: finalLogoUrl
      ? 'Startup logo updated successfully! Changes are live across the dashboard and TV wall.'
      : 'Startup logo removed. The venture will now display its monogram initials.',
    data: { logoUrl: finalLogoUrl },
  }
}
