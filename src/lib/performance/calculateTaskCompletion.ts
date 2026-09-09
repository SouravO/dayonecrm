import type { CompletionStatus } from '@/types'

/**
 * Calculates whether a task was completed EARLY, ON_TIME, or LATE
 * based on completion timestamp vs due date.
 *
 * EARLY: completed before the due date
 * ON_TIME: completed on the due date
 * LATE: completed after the due date
 */
export function calculateTaskCompletionStatus(
  completedAt: string | Date,
  dueDate: string | Date
): CompletionStatus {
  const completedDay = new Date(completedAt)
  completedDay.setHours(0, 0, 0, 0)

  const dueDay = new Date(dueDate)
  dueDay.setHours(0, 0, 0, 0)

  if (completedDay < dueDay) return 'EARLY'
  if (completedDay.getTime() === dueDay.getTime()) return 'ON_TIME'
  return 'LATE'
}

/**
 * Checks if a task with status TODO or IN_PROGRESS is overdue
 * (due date is in the past and not yet completed)
 */
export function isTaskOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'DONE') return false
  const due = new Date(dueDate)
  due.setHours(23, 59, 59, 999)
  return due < new Date()
}
