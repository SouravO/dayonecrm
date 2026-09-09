import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { PerformanceStatus, TaskStatus, TaskPriority, CompletionStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string as "Sep 7, 2025"
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Formats a date range "Sep 7 → Sep 13"
 */
export function formatWeekRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${s} → ${e}`
}

/**
 * Returns relative time string like "2 hours ago"
 */
export function timeAgo(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHrs = Math.round(diffMin / 60)
  const diffDays = Math.round(diffHrs / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

/**
 * Returns color class for performance status badge
 */
export function getPerformanceStatusColor(status: PerformanceStatus): string {
  switch (status) {
    case 'AHEAD': return 'status-ahead'
    case 'ON_TRACK': return 'status-on-track'
    case 'BEHIND': return 'status-behind'
    case 'AT_RISK': return 'status-at-risk'
  }
}

/**
 * Returns color class for task status badge
 */
export function getTaskStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'TODO': return 'badge-neutral'
    case 'IN_PROGRESS': return 'badge-info'
    case 'DONE': return 'badge-success'
  }
}

/**
 * Returns color class for task priority badge
 */
export function getTaskPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case 'LOW': return 'badge-neutral'
    case 'MEDIUM': return 'badge-warning'
    case 'HIGH': return 'badge-danger'
  }
}

/**
 * Returns color for completion status
 */
export function getCompletionStatusColor(status: CompletionStatus): string {
  switch (status) {
    case 'EARLY': return 'badge-success'
    case 'ON_TIME': return 'badge-info'
    case 'LATE': return 'badge-danger'
  }
}

/**
 * Formats percentage to 1 decimal place
 */
export function formatPct(value: number): string {
  return `${Math.round(value)}%`
}

/**
 * Gets start/end of current week (Mon–Sun)
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon ...
  const diffToMon = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMon)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday, end: sunday }
}

/**
 * Converts Date to YYYY-MM-DD string (for DB date fields)
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}
