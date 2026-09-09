import type { PerformanceStatus } from '@/types'

interface PerformanceInput {
  completionRate: number   // 0-100
  earlyRate: number        // 0-100
  overdueCount: number
  totalTasks: number
}

/**
 * Determines startup performance status based on task metrics.
 *
 * AHEAD:    completion >= 90% AND early rate >= 30%
 * ON_TRACK: completion >= 70%
 * BEHIND:   completion >= 40%
 * AT_RISK:  completion < 40% or significant overdue tasks
 *
 * Logic is isolated here so it can be updated independently of UI.
 */
export function calculatePerformanceStatus(
  input: PerformanceInput
): PerformanceStatus {
  const { completionRate, earlyRate, overdueCount, totalTasks } = input

  // AT_RISK: high overdue ratio or very low completion
  const overdueRatio = totalTasks > 0 ? overdueCount / totalTasks : 0
  if (completionRate < 40 || overdueRatio >= 0.4) return 'AT_RISK'

  // AHEAD: excellent completion + finishing early
  if (completionRate >= 90 && earlyRate >= 30) return 'AHEAD'

  // ON_TRACK: healthy completion
  if (completionRate >= 70) return 'ON_TRACK'

  // BEHIND: below target
  return 'BEHIND'
}
