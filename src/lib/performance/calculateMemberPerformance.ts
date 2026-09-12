import type { Task } from '@/types'
import { calculateTaskCompletionStatus, isTaskOverdue } from './calculateTaskCompletion'

export interface MemberPerformance {
  userId: string
  fullName: string
  email?: string | null
  role?: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  earlyCount: number
  onTimeCount: number
  lateCount: number
  overdueCount: number
  completionRate: number
  avgHoursToComplete: number | null
  avgHoursToStart: number | null
  performanceScore: number // 0 - 100
  status: 'EXCELLING' | 'ON_TRACK' | 'NEEDS_SUPPORT' | 'LAGGING'
}

export interface MemberInput {
  userId: string
  fullName: string
  email?: string | null
  role?: string
}

/**
 * Calculates detailed performance metrics for an individual member based on assigned or created tasks.
 */
export function calculateMemberPerformance(
  tasks: Task[],
  member: MemberInput
): MemberPerformance {
  const memberTasks = tasks.filter(
    (t) => t.assigned_to === member.userId || (!t.assigned_to && t.created_by === member.userId)
  )

  const totalTasks = memberTasks.length
  const completedTasks = memberTasks.filter((t) => t.status === 'DONE')
  const inProgressTasks = memberTasks.filter((t) => t.status === 'IN_PROGRESS')
  const todoTasks = memberTasks.filter((t) => t.status === 'TODO')

  const todayStr = new Date().toISOString().split('T')[0]

  let earlyCount = 0
  let onTimeCount = 0
  let lateCount = 0
  let overdueCount = 0

  let totalCompleteHours = 0
  let completeDurationCount = 0

  let totalStartHours = 0
  let startDurationCount = 0

  for (const t of memberTasks) {
    if (t.status === 'DONE') {
      const status =
        t.completion_status ||
        (t.completed_at && t.due_date
          ? calculateTaskCompletionStatus(t.completed_at, t.due_date)
          : 'ON_TIME')

      if (status === 'EARLY') earlyCount++
      else if (status === 'LATE') lateCount++
      else onTimeCount++

      // Duration to complete: from started_at (fallback created_at) to completed_at
      if (t.completed_at) {
        const startTs = new Date(t.started_at || t.created_at).getTime()
        const endTs = new Date(t.completed_at).getTime()
        if (endTs >= startTs) {
          const hours = (endTs - startTs) / (1000 * 60 * 60)
          totalCompleteHours += hours
          completeDurationCount++
        }
      }
    } else {
      if (isTaskOverdue(t.due_date, t.status) || (t.due_date && t.due_date < todayStr)) {
        overdueCount++
      }
    }

    // Duration to start
    if (t.started_at && t.created_at) {
      const createdTs = new Date(t.created_at).getTime()
      const startTs = new Date(t.started_at).getTime()
      if (startTs >= createdTs) {
        const hours = (startTs - createdTs) / (1000 * 60 * 60)
        totalStartHours += hours
        startDurationCount++
      }
    }
  }

  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

  const avgHoursToComplete =
    completeDurationCount > 0
      ? Math.round((totalCompleteHours / completeDurationCount) * 10) / 10
      : null

  const avgHoursToStart =
    startDurationCount > 0
      ? Math.round((totalStartHours / startDurationCount) * 10) / 10
      : null

  // Performance score calculation (0 - 100)
  // 1. Completion rate contributes up to 50 points
  const rateScore = (completionRate / 100) * 50

  // 2. Timeliness contributes up to 30 points (early + on-time vs late)
  const timelyTasks = earlyCount + onTimeCount
  const timelinessRatio = completedTasks.length > 0 ? timelyTasks / completedTasks.length : 0.8
  const timelinessScore = timelinessRatio * 30

  // 3. Activity / momentum contributes up to 20 points
  const activeRatio = totalTasks > 0 ? (inProgressTasks.length * 0.5) / totalTasks : 0
  const activeScore = Math.min(20, activeRatio * 20 + 10)

  // 4. Overdue penalty: -8 points per overdue task, max 30 penalty
  const overduePenalty = Math.min(30, overdueCount * 8)

  const rawScore = rateScore + timelinessScore + activeScore - overduePenalty
  const performanceScore = totalTasks === 0 ? 75 : Math.max(10, Math.min(100, Math.round(rawScore)))

  let status: 'EXCELLING' | 'ON_TRACK' | 'NEEDS_SUPPORT' | 'LAGGING' = 'ON_TRACK'
  if (totalTasks === 0) {
    status = 'ON_TRACK'
  } else if (performanceScore >= 85) {
    status = 'EXCELLING'
  } else if (performanceScore >= 65) {
    status = 'ON_TRACK'
  } else if (performanceScore >= 45 || overdueCount <= 1) {
    status = 'NEEDS_SUPPORT'
  } else {
    status = 'LAGGING'
  }

  return {
    userId: member.userId,
    fullName: member.fullName,
    email: member.email,
    role: member.role,
    totalTasks,
    completedTasks: completedTasks.length,
    inProgressTasks: inProgressTasks.length,
    todoTasks: todoTasks.length,
    earlyCount,
    onTimeCount,
    lateCount,
    overdueCount,
    completionRate,
    avgHoursToComplete,
    avgHoursToStart,
    performanceScore,
    status,
  }
}

/**
 * Calculates team performance for an entire startup's staff/founders.
 */
export function calculateTeamPerformance(
  tasks: Task[],
  members: Array<{
    user_id: string
    role?: string
    profile?: { id: string; full_name: string; email?: string | null } | null
  }>
): MemberPerformance[] {
  const result: MemberPerformance[] = []

  for (const m of members) {
    const fullName = m.profile?.full_name || 'Team Member'
    const email = m.profile?.email || null
    const perf = calculateMemberPerformance(tasks, {
      userId: m.user_id,
      fullName,
      email,
      role: m.role,
    })
    result.push(perf)
  }

  // Sort: members with active/assigned tasks first, then by performance score descending
  result.sort((a, b) => {
    if (a.totalTasks === 0 && b.totalTasks > 0) return 1
    if (a.totalTasks > 0 && b.totalTasks === 0) return -1
    return b.performanceScore - a.performanceScore
  })

  return result
}
