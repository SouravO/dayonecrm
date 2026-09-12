'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/features/activity/actions'
import type { ActionState, WeeklyPlan } from '@/types'

const WeeklyPlanSchema = z.object({
  startup_id: z.string().uuid(),
  title: z.string().optional(),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  week_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  goal: z.string().optional(),
})

export async function createWeeklyPlan(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validated = WeeklyPlanSchema.safeParse({
    startup_id: formData.get('startup_id'),
    title: formData.get('title') || undefined,
    week_start: formData.get('week_start'),
    week_end: formData.get('week_end'),
    goal: formData.get('goal') || undefined,
  })

  if (!validated.success) return { error: validated.error.errors[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('weekly_plans')
    .insert({
      startup_id: validated.data.startup_id,
      title: validated.data.title || null,
      week_start: validated.data.week_start,
      week_end: validated.data.week_end,
      goal: validated.data.goal || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return { error: 'Failed to create weekly plan: ' + error.message }
  }

  await logActivity({
    startupId: validated.data.startup_id,
    action: 'CREATED_WEEKLY_PLAN',
    entityType: 'weekly_plan',
    entityId: data.id,
    metadata: { title: validated.data.title, week_start: validated.data.week_start, week_end: validated.data.week_end },
  })

  revalidatePath('/founder/weekly-plan')
  revalidatePath('/founder/tasks')
  revalidatePath('/staff')
  revalidatePath('/staff/tasks')
  revalidatePath('/tv')
  return { success: 'Weekly plan created', data }
}

export async function updateWeeklyPlan(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string
  if (!id) return { error: 'Missing plan ID' }

  const supabase = await createClient()
  const updates: Record<string, unknown> = {}
  if (formData.has('title')) updates.title = formData.get('title')?.toString().trim() || null
  if (formData.has('goal')) updates.goal = formData.get('goal')?.toString().trim() || null
  if (formData.has('week_start')) updates.week_start = formData.get('week_start')?.toString().trim()
  if (formData.has('week_end')) updates.week_end = formData.get('week_end')?.toString().trim()

  const { error } = await supabase
    .from('weekly_plans')
    .update(updates)
    .eq('id', id)

  if (error) return { error: 'Failed to update weekly plan' }

  revalidatePath('/founder/weekly-plan')
  revalidatePath('/founder/tasks')
  revalidatePath('/staff')
  revalidatePath('/tv')
  return { success: 'Weekly plan updated' }
}

export async function deleteWeeklyPlan(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string
  if (!id) return { error: 'Missing plan ID' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('weekly_plans')
    .delete()
    .eq('id', id)

  if (error) return { error: 'Failed to delete weekly plan' }

  revalidatePath('/founder/weekly-plan')
  revalidatePath('/founder/tasks')
  revalidatePath('/staff')
  revalidatePath('/tv')
  return { success: 'Weekly plan deleted' }
}

export async function getCurrentWeekPlan(startupId: string): Promise<WeeklyPlan | null> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('weekly_plans')
    .select('*')
    .eq('startup_id', startupId)
    .lte('week_start', today)
    .gte('week_end', today)
    .single()

  return data
}
