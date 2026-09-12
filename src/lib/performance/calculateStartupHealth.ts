import type { Task, Domain } from '@/types'

export interface BlockerItem {
  id: string
  title: string
  domainName: string
  assigneeName: string
  status: string
  priority: string
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  lagReason: string
  dueDate?: string | null
  daysOverdue?: number
}

export interface DomainHealth {
  id: string
  name: string
  total: number
  done: number
  inProgress: number
  todo: number
  rate: number
  isLagging: boolean
  lagReason: string
  overdueCount: number
}

export interface StartupHealthSummary {
  score: number // 0 - 100
  status: 'Optimal' | 'On Track' | 'Attention' | 'At Risk'
  statusBadgeColor: string
  velocityScore: number // 0 - 45
  momentumScore: number // 0 - 35
  blockerScore: number // 0 - 20
  totalTasks: number
  doneTasks: number
  inProgressTasks: number
  todoTasks: number
  overdueTasks: number
  completionRate: number
  blockers: BlockerItem[]
  domains: DomainHealth[]
}

export function calculateStartupHealth(
  tasks: Task[],
  domains: Domain[],
  profileMap?: Map<string, string>
): StartupHealthSummary {
  const todayStr = new Date().toISOString().split('T')[0]
  const todayDate = new Date(todayStr + 'T00:00:00')

  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === 'DONE')
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS')
  const todoTasks = tasks.filter((t) => t.status === 'TODO')

  const completionRate = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0

  // 1. Identify Overdue & Critical Blockers
  const blockers: BlockerItem[] = []
  let overdueTasksCount = 0

  for (const t of tasks) {
    const isDone = t.status === 'DONE'
    const hasDueDate = Boolean(t.due_date)
    let isOverdue = false
    let daysOverdue = 0

    if (!isDone && hasDueDate && t.due_date! < todayStr) {
      isOverdue = true
      overdueTasksCount++
      const due = new Date(t.due_date! + 'T00:00:00')
      daysOverdue = Math.max(1, Math.round((todayDate.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
    }

    const isHighStalled = t.priority === 'HIGH' && t.status === 'TODO'
    const isKeywordBlocked =
      (t.title || '').toLowerCase().includes('block') ||
      (t.title || '').toLowerCase().includes('delay') ||
      (t.title || '').toLowerCase().includes('stuck')

    if (isOverdue || isHighStalled || isKeywordBlocked) {
      let lagReason = 'Stalled deliverable'
      let urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'HIGH'

      if (isOverdue) {
        lagReason = `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue (due ${t.due_date})`
        urgency = daysOverdue > 3 ? 'CRITICAL' : 'HIGH'
      } else if (isKeywordBlocked) {
        lagReason = 'Reported roadblock or external vendor dependency'
        urgency = 'CRITICAL'
      } else if (isHighStalled) {
        lagReason = 'High-priority deliverable not yet started'
        urgency = 'HIGH'
      }

      const domainObj = domains.find((d) => d.id === t.domain_id)
      const domainName = domainObj?.name || 'General'
      const assigneeName = t.assigned_to
        ? profileMap?.get(t.assigned_to) || 'Team Member'
        : 'Unassigned'

      blockers.push({
        id: t.id,
        title: t.title,
        domainName,
        assigneeName,
        status: t.status,
        priority: t.priority,
        urgency,
        lagReason,
        dueDate: t.due_date,
        daysOverdue: daysOverdue > 0 ? daysOverdue : undefined,
      })
    }
  }

  // Sort blockers by urgency: CRITICAL first, then by days overdue descending
  blockers.sort((a, b) => {
    if (a.urgency === 'CRITICAL' && b.urgency !== 'CRITICAL') return -1
    if (a.urgency !== 'CRITICAL' && b.urgency === 'CRITICAL') return 1
    return (b.daysOverdue || 0) - (a.daysOverdue || 0)
  })

  // 2. Domain Health Breakdown
  const domainHealthList: DomainHealth[] = domains.map((d) => {
    const dTasks = tasks.filter((t) => t.domain_id === d.id)
    const dDone = dTasks.filter((t) => t.status === 'DONE').length
    const dInProgress = dTasks.filter((t) => t.status === 'IN_PROGRESS').length
    const dTodo = dTasks.filter((t) => t.status === 'TODO').length
    const rate = dTasks.length > 0 ? Math.round((dDone / dTasks.length) * 100) : 0

    const dOverdue = dTasks.filter(
      (t) => t.status !== 'DONE' && t.due_date && t.due_date < todayStr
    ).length

    const isLagging = (dTasks.length > 0 && rate < 40 && dOverdue > 0) || dOverdue >= 2

    let lagReason = 'On track'
    if (dOverdue > 0) {
      lagReason = `${dOverdue} overdue deliverable${dOverdue > 1 ? 's' : ''}`
    } else if (rate < 30 && dTasks.length > 0) {
      lagReason = `Low completion rate (${rate}%)`
    }

    return {
      id: d.id,
      name: d.name,
      total: dTasks.length,
      done: dDone,
      inProgress: dInProgress,
      todo: dTodo,
      rate,
      isLagging,
      lagReason,
      overdueCount: dOverdue,
    }
  })

  // 3. Health Score Calculation (0 - 100)
  // Velocity Score: based on completion rate (up to 45 pts)
  const velocityScore = Math.min(45, Math.round((completionRate / 100) * 45))

  // Momentum Score: active work in progress (up to 35 pts)
  const activeFraction =
    totalTasks > 0
      ? (doneTasks.length + inProgressTasks.length * 0.7) / totalTasks
      : 0.8
  const momentumScore = Math.min(35, Math.round(activeFraction * 35))

  // Blocker Score: 20 max, penalized by blockers & overdue tasks
  const blockerPenalty = Math.min(20, blockers.filter((b) => b.urgency === 'CRITICAL').length * 6 + overdueTasksCount * 4)
  const blockerScore = Math.max(0, 20 - blockerPenalty)

  const rawScore = totalTasks === 0 ? 80 : velocityScore + momentumScore + blockerScore
  const score = Math.min(100, Math.max(15, rawScore))

  let status: 'Optimal' | 'On Track' | 'Attention' | 'At Risk' = 'On Track'
  let statusBadgeColor = '#059669' // green

  if (score >= 85) {
    status = 'Optimal'
    statusBadgeColor = '#059669'
  } else if (score >= 68) {
    status = 'On Track'
    statusBadgeColor = '#0284c7' // blue
  } else if (score >= 48) {
    status = 'Attention'
    statusBadgeColor = '#d97706' // amber
  } else {
    status = 'At Risk'
    statusBadgeColor = '#ca2f2b' // red
  }

  return {
    score,
    status,
    statusBadgeColor,
    velocityScore,
    momentumScore,
    blockerScore,
    totalTasks,
    doneTasks: doneTasks.length,
    inProgressTasks: inProgressTasks.length,
    todoTasks: todoTasks.length,
    overdueTasks: overdueTasksCount,
    completionRate,
    blockers,
    domains: domainHealthList,
  }
}
