'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/features/activity/actions'
import { calculateTaskCompletionStatus } from '@/lib/performance/calculateTaskCompletion'
import { calculateWeeklyPerformance } from '@/lib/performance/calculateWeeklyPerformance'
import type { ActionState } from '@/types'

const TaskSchema = z.object({
  startup_id: z.string().uuid(),
  weekly_plan_id: z.string().uuid().optional(),
  domain_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  title: z.string().min(1, 'Task title is required').max(255),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  due_date: z.string().optional(),
})

export async function createTask(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validated = TaskSchema.safeParse({
    startup_id: formData.get('startup_id'),
    weekly_plan_id: formData.get('weekly_plan_id') || undefined,
    domain_id: formData.get('domain_id') || undefined,
    assigned_to: formData.get('assigned_to') || undefined,
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    priority: formData.get('priority') || 'MEDIUM',
    due_date: formData.get('due_date') || undefined,
  })

  if (!validated.success) return { error: validated.error.errors[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // If self_assign flag is set (staff creating their own task), auto-assign to themselves
  const selfAssign = formData.get('self_assign') === 'true'
  const assignedTo = selfAssign ? user.id : (validated.data.assigned_to || null)

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      startup_id: validated.data.startup_id,
      weekly_plan_id: validated.data.weekly_plan_id || null,
      domain_id: validated.data.domain_id || null,
      assigned_to: assignedTo,
      created_by: user.id,
      title: validated.data.title,
      description: validated.data.description || null,
      priority: validated.data.priority,
      status: 'TODO',
      due_date: validated.data.due_date || null,
    })
    .select()
    .single()

  if (error) return { error: 'Failed to create task' }

  await logActivity({
    startupId: validated.data.startup_id,
    action: 'CREATED_TASK',
    entityType: 'task',
    entityId: data.id,
    metadata: { title: validated.data.title, priority: validated.data.priority },
  })

  revalidatePath('/founder/tasks')
  revalidatePath('/staff/tasks')
  revalidatePath('/founder/weekly-plan')
  revalidatePath('/staff')
  revalidatePath('/tv')

  return { success: 'Task created', data }
}

export async function updateTask(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string
  if (!id) return { error: 'Missing task ID' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Fetch current task
  const { data: existingTask } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (!existingTask) return { error: 'Task not found' }

  const updates: Record<string, unknown> = {}

  if (formData.has('title')) {
    const title = formData.get('title')?.toString().trim()
    if (!title) return { error: 'Task title is required' }
    updates.title = title
  }

  if (formData.has('description')) {
    const desc = formData.get('description')?.toString().trim()
    updates.description = desc || null
  }

  if (formData.has('priority')) {
    const priority = formData.get('priority')?.toString()
    if (priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
      updates.priority = priority
    }
  }

  if (formData.has('due_date')) {
    const dueDate = formData.get('due_date')?.toString().trim()
    updates.due_date = dueDate || null
  }

  if (formData.has('assigned_to')) {
    const assignedTo = formData.get('assigned_to')?.toString().trim()
    updates.assigned_to = assignedTo || null
  }

  if (formData.has('domain_id')) {
    const domainId = formData.get('domain_id')?.toString().trim()
    updates.domain_id = domainId || null
  }

  if (formData.has('weekly_plan_id')) {
    const planId = formData.get('weekly_plan_id')?.toString().trim()
    updates.weekly_plan_id = planId || null
  }

  if (formData.has('status')) {
    const newStatus = formData.get('status')?.toString()
    if (newStatus && ['TODO', 'IN_PROGRESS', 'DONE'].includes(newStatus)) {
      updates.status = newStatus
      if (newStatus === 'IN_PROGRESS' && !existingTask.started_at) {
        updates.started_at = new Date().toISOString()
      } else if (newStatus === 'DONE' && existingTask.status !== 'DONE') {
        const completedAt = new Date().toISOString()
        updates.completed_at = completedAt
        if (!existingTask.started_at) {
          updates.started_at = completedAt
        }
        const effectiveDueDate = (updates.due_date as string | null) ?? existingTask.due_date
        if (effectiveDueDate) {
          updates.completion_status = calculateTaskCompletionStatus(completedAt, effectiveDueDate)
        }
      } else if (newStatus !== 'DONE') {
        updates.completed_at = null
        updates.completion_status = null
      }
    }
  }

  const { error } = await supabase.from('tasks').update(updates).eq('id', id)

  if (error) return { error: 'Failed to update task' }

  await logActivity({
    startupId: existingTask.startup_id,
    action: 'UPDATED_TASK',
    entityType: 'task',
    entityId: id,
    metadata: { title: updates.title ?? existingTask.title },
  })

  // Recalculate weekly performance if related to a weekly plan
  const planIdToRecalc = (updates.weekly_plan_id ?? existingTask.weekly_plan_id) as string | null
  if (planIdToRecalc) {
    await recalculateWeeklyPerformance(existingTask.startup_id, planIdToRecalc)
  }

  revalidatePath('/founder/tasks')
  revalidatePath('/founder/weekly-plan')
  revalidatePath('/staff/tasks')
  revalidatePath('/staff')
  revalidatePath('/founder')
  revalidatePath('/tv')

  return { success: 'Task updated successfully' }
}

export async function updateTaskStatus(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('task_id') as string
  const status = formData.get('status') as string

  if (!id || !status) return { error: 'Missing required fields' }
  if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) return { error: 'Invalid status' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Get existing task to check due_date
  const { data: task } = await supabase
    .from('tasks')
    .select('due_date, startup_id, weekly_plan_id, title, started_at')
    .eq('id', id)
    .single()

  if (!task) return { error: 'Task not found' }

  const updates: Record<string, unknown> = { status }

  if (status === 'IN_PROGRESS' && !task.started_at) {
    updates.started_at = new Date().toISOString()
  }

  if (status === 'DONE') {
    const completedAt = new Date().toISOString()
    updates.completed_at = completedAt
    if (!task.started_at) {
      updates.started_at = completedAt
    }

    if (task.due_date) {
      updates.completion_status = calculateTaskCompletionStatus(completedAt, task.due_date)
    }

    await logActivity({
      startupId: task.startup_id,
      action: 'COMPLETED_TASK',
      entityType: 'task',
      entityId: id,
      metadata: {
        title: task.title,
        completion_status: updates.completion_status,
      },
    })

    // Recalculate weekly performance if part of a plan
    if (task.weekly_plan_id) {
      await recalculateWeeklyPerformance(task.startup_id, task.weekly_plan_id)
    }
  } else {
    // Uncompleting a task — clear completion data
    if (status !== 'DONE') {
      updates.completed_at = null
      updates.completion_status = null
    }
    await logActivity({
      startupId: task.startup_id,
      action: 'UPDATED_TASK_STATUS',
      entityType: 'task',
      entityId: id,
      metadata: { title: task.title, new_status: status },
    })
  }

  const { error } = await supabase.from('tasks').update(updates).eq('id', id)
  if (error) return { error: 'Failed to update task status' }

  // Add task update comment
  const comment = formData.get('comment') as string
  if (comment) {
    await supabase.from('task_updates').insert({
      task_id: id,
      user_id: user.id,
      comment,
    })
  }

  revalidatePath('/founder/tasks')
  revalidatePath('/staff/tasks')
  revalidatePath('/founder/weekly-plan')
  revalidatePath('/staff')
  revalidatePath('/founder')
  revalidatePath('/tv')

  return { success: 'Task status updated' }
}

export async function deleteTask(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = formData.get('id') as string
  if (!id) return { error: 'Missing task ID' }

  const supabase = await createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) return { error: 'Failed to delete task' }

  revalidatePath('/founder/tasks')
  revalidatePath('/staff/tasks')

  return { success: 'Task deleted' }
}

/**
 * Recalculates and upserts weekly_performance for a given plan.
 * Called automatically when a task is completed.
 */
async function recalculateWeeklyPerformance(
  startupId: string,
  weeklyPlanId: string
): Promise<void> {
  try {
    const supabase = await createClient()

    const { data: plan } = await supabase
      .from('weekly_plans')
      .select('week_end')
      .eq('id', weeklyPlanId)
      .single()

    if (!plan) return

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('weekly_plan_id', weeklyPlanId)

    if (!tasks) return

    const performance = calculateWeeklyPerformance(
      tasks,
      startupId,
      weeklyPlanId,
      plan.week_end
    )

    await supabase.from('weekly_performance').upsert(
      { ...performance, updated_at: new Date().toISOString() },
      { onConflict: 'startup_id,weekly_plan_id' }
    )
  } catch (err) {
    console.error('Failed to recalculate weekly performance:', err)
  }
}
