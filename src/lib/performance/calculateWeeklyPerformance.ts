import type {
  Task,
  WeeklyPerformance,
  PerformanceStatus,
  WeeklyCompletionStatus,
} from '@/types'
import { calculateTaskCompletionStatus, isTaskOverdue } from './calculateTaskCompletion'
import { calculatePerformanceStatus } from './calculatePerformanceStatus'

/**
 * Calculates full weekly performance metrics from a list of tasks.
 * This is the single source of truth for performance aggregation.
 */
export function calculateWeeklyPerformance(
  tasks: Task[],
  startupId: string,
  weeklyPlanId: string,
  plannedEndDate: string
): Omit<WeeklyPerformance, 'id' | 'created_at' | 'updated_at'> {
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'DONE')
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS')
  const pending = tasks.filter((t) => t.status === 'TODO')
  const overdue = tasks.filter((t) => isTaskOverdue(t.due_date, t.status))

  // Among completed tasks, categorize by completion timing
  const earlyTasks = completed.filter(
    (t) =>
      t.completed_at &&
      t.due_date &&
      calculateTaskCompletionStatus(t.completed_at, t.due_date) === 'EARLY'
  )
  const onTimeTasks = completed.filter(
    (t) =>
      t.completed_at &&
      t.due_date &&
      calculateTaskCompletionStatus(t.completed_at, t.due_date) === 'ON_TIME'
  )
  const lateTasks = completed.filter(
    (t) =>
      t.completed_at &&
      t.due_date &&
      calculateTaskCompletionStatus(t.completed_at, t.due_date) === 'LATE'
  )

  const completionRate = total > 0 ? (completed.length / total) * 100 : 0
  const earlyRate =
    completed.length > 0 ? (earlyTasks.length / completed.length) * 100 : 0
  const onTimeRate =
    completed.length > 0 ? (onTimeTasks.length / completed.length) * 100 : 0
  const lateRate =
    completed.length > 0 ? (lateTasks.length / completed.length) * 100 : 0

  const performanceStatus: PerformanceStatus = calculatePerformanceStatus({
    completionRate,
    earlyRate,
    overdueCount: overdue.length,
    totalTasks: total,
  })

  // Weekly completion: when did the last task complete?
  let actualCompletionDate: string | null = null
  let daysEarly: number | null = null
  let weeklyCompletionStatus: WeeklyCompletionStatus = 'INCOMPLETE'

  if (total > 0 && completed.length === total) {
    // All tasks done — find the latest completion date
    const completionDates = completed
      .filter((t) => t.completed_at)
      .map((t) => new Date(t.completed_at!))
    const lastCompletion = new Date(Math.max(...completionDates.map((d) => d.getTime())))
    actualCompletionDate = lastCompletion.toISOString().split('T')[0]

    const plannedEnd = new Date(plannedEndDate)
    plannedEnd.setHours(0, 0, 0, 0)
    const actualEnd = new Date(actualCompletionDate)
    actualEnd.setHours(0, 0, 0, 0)

    const diffMs = plannedEnd.getTime() - actualEnd.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays > 0) {
      weeklyCompletionStatus = 'COMPLETED_EARLY'
      daysEarly = diffDays
    } else if (diffDays === 0) {
      weeklyCompletionStatus = 'COMPLETED_ON_TIME'
      daysEarly = 0
    } else {
      weeklyCompletionStatus = 'COMPLETED_LATE'
      daysEarly = diffDays // negative = days late
    }
  }

  return {
    startup_id: startupId,
    weekly_plan_id: weeklyPlanId,
    total_tasks: total,
    completed_tasks: completed.length,
    pending_tasks: pending.length,
    in_progress_tasks: inProgress.length,
    early_tasks: earlyTasks.length,
    on_time_tasks: onTimeTasks.length,
    late_tasks: lateTasks.length,
    overdue_tasks: overdue.length,
    completion_rate: Math.round(completionRate * 100) / 100,
    early_rate: Math.round(earlyRate * 100) / 100,
    on_time_rate: Math.round(onTimeRate * 100) / 100,
    late_rate: Math.round(lateRate * 100) / 100,
    performance_status: performanceStatus,
    planned_end_date: plannedEndDate,
    actual_completion_date: actualCompletionDate,
    days_early: daysEarly,
    weekly_completion_status: weeklyCompletionStatus,
  }
}
