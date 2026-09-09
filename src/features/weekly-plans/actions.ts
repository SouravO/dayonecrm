'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/features/activity/actions'
import type { ActionState, WeeklyPlan } from '@/types'

const WeeklyPlanSchema = z.object({
  startup_id: z.string().uuid(),
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
      ...validated.data,
      goal: validated.data.goal || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'A weekly plan already exists for this week' }
    }
    return { error: 'Failed to create weekly plan' }
  }

  await logActivity({
    startupId: validated.data.startup_id,
    action: 'CREATED_WEEKLY_PLAN',
    entityType: 'weekly_plan',
    entityId: data.id,
    metadata: { week_start: validated.data.week_start, week_end: validated.data.week_end },
  })

  revalidatePath('/founder/weekly-plan')
  return { success: 'Weekly plan created', data }
}

export async function updateWeeklyPlan(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string
  const goal = formData.get('goal') as string

  if (!id) return { error: 'Missing plan ID' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('weekly_plans')
    .update({ goal: goal || null })
    .eq('id', id)

  if (error) return { error: 'Failed to update weekly plan' }

  revalidatePath('/founder/weekly-plan')
  return { success: 'Weekly plan updated' }
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
