'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/features/activity/actions'
import type { ActionState } from '@/types'

const DomainSchema = z.object({
  name: z.string().min(1, 'Domain name is required').max(100),
  description: z.string().optional(),
  startup_id: z.string().uuid(),
})

export async function createDomain(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validated = DomainSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    startup_id: formData.get('startup_id'),
  })

  if (!validated.success) return { error: validated.error.errors[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('domains')
    .insert({
      startup_id: validated.data.startup_id,
      name: validated.data.name,
      description: validated.data.description || null,
    })
    .select()
    .single()

  if (error) return { error: 'Failed to create domain' }

  await logActivity({
    startupId: validated.data.startup_id,
    action: 'CREATED_DOMAIN',
    entityType: 'domain',
    entityId: data.id,
    metadata: { name: validated.data.name },
  })

  revalidatePath('/founder/domains')
  return { success: 'Domain created successfully', data }
}

export async function updateDomain(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!id || !name) return { error: 'Missing required fields' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('domains')
    .update({ name, description: description || null })
    .eq('id', id)

  if (error) return { error: 'Failed to update domain' }

  revalidatePath('/founder/domains')
  return { success: 'Domain updated' }
}

export async function deleteDomain(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string
  if (!id) return { error: 'Missing domain ID' }

  const supabase = await createClient()
  const { error } = await supabase.from('domains').delete().eq('id', id)

  if (error) return { error: 'Failed to delete domain' }

  revalidatePath('/founder/domains')
  return { success: 'Domain deleted' }
}
