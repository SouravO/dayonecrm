import { getAdminClient } from '@/lib/supabase/admin'

export interface TvPayload {
  timestamp: string
  startup: {
    id: string
    name: string
    email: string
    status: string
    initial: string
  }
  sprint: {
    id: string | null
    weekStart: string
    weekEnd: string
    goal: string
    daysRemaining: number
    status: 'AHEAD' | 'ON_TRACK' | 'BEHIND' | 'AT_RISK'
  }
  metrics: {
    totalTasks: number
    doneTasks: number
    inProgressTasks: number
    todoTasks: number
    earlyCount: number
    onTimeCount: number
    lateCount: number
    completionRate: number
    operatorsCount: number
    domainsCount: number
  }
  charts: {
    burndown: Array<{ day: string; ideal: number; actual: number | null; completed: number }>
    domains: Array<{ name: string; total: number; done: number; inProgress: number; todo: number; rate: number }>
    quality: Array<{ name: string; value: number; color: string }>
  }
  deliverables: Array<{
    id: string
    title: string
    status: string
    priority: string
    completion_status: string | null
    domainName: string
    assigneeName: string
    dueDate: string | null
  }>
  recentActivity: Array<{ id: string; action: string; time: string }>
}

export interface TvStartupSummary {
  id: string
  name: string
  email: string
  status: string
  slug: string
  planGoal: string | null
  tasksCount: number
  domainsCount: number
}

export function getWeekBoundaries(date: Date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday as start of week
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return {
    mondayStr: monday.toISOString().split('T')[0],
    sundayStr: sunday.toISOString().split('T')[0],
    monday,
    sunday,
  }
}

export async function getAllTvStartups(): Promise<TvStartupSummary[]> {
  const supabase = getAdminClient()

  // Fetch all startups
  const { data: startups } = await supabase
    .from('startups')
    .select('*')
    .order('name', { ascending: true })

  // Fetch weekly plans, tasks, domains
  const [plansRes, tasksRes, domainsRes] = await Promise.all([
    supabase.from('weekly_plans').select('startup_id, goal, week_start, week_end'),
    supabase.from('tasks').select('startup_id, status'),
    supabase.from('domains').select('startup_id'),
  ])

  const plans = plansRes.data || []
  const tasks = tasksRes.data || []
  const domains = domainsRes.data || []

  return (startups || []).map((s) => {
    const sPlans = plans.filter((p) => p.startup_id === s.id)
    const latestPlan = sPlans[sPlans.length - 1]
    const sTasks = tasks.filter((t) => t.startup_id === s.id)
    const sDomains = domains.filter((d) => d.startup_id === s.id)
    const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || s.id

    return {
      id: s.id,
      name: s.name,
      email: s.email,
      status: s.status,
      slug: slug || s.id,
      planGoal: latestPlan?.goal || null,
      tasksCount: sTasks.length,
      domainsCount: sDomains.length,
    }
  })
}

export async function getTvTelemetry(idOrSlug: string): Promise<TvPayload | null> {
  const supabase = getAdminClient()

  // 1. Resolve Startup by UUID or Name/Slug
  let startup: {
    id: string
    name: string
    email: string
    status: string
    created_at: string
  } | null = null

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)

  if (isUuid) {
    const { data } = await supabase
      .from('startups')
      .select('*')
      .eq('id', idOrSlug)
      .maybeSingle()
    startup = data
  }

  if (!startup) {
    // Try resolving by slug or name
    const normalizedQuery = idOrSlug.replace(/-/g, ' ').trim()
    const { data } = await supabase
      .from('startups')
      .select('*')
      .ilike('name', `%${normalizedQuery}%`)
      .limit(1)
      .maybeSingle()
    startup = data
  }

  if (!startup) {
    return null
  }

  const startupId = startup.id
  const { mondayStr, sundayStr, sunday } = getWeekBoundaries()
  const todayStr = new Date().toISOString().split('T')[0]

  // Calculate days remaining in current sprint (until Sunday)
  const now = new Date()
  const diffMs = sunday.getTime() - now.getTime()
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

  // 2. Fetch Weekly Plan (Active sprint for this week or most recent)
  let { data: currentPlan } = await supabase
    .from('weekly_plans')
    .select('*')
    .eq('startup_id', startupId)
    .lte('week_start', todayStr)
    .gte('week_end', todayStr)
    .maybeSingle()

  if (!currentPlan) {
    // Fallback: get the latest plan
    const { data: latestPlan } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('startup_id', startupId)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle()
    currentPlan = latestPlan
  }

  // 3. Fetch Domains
  const { data: domains } = await supabase
    .from('domains')
    .select('*')
    .eq('startup_id', startupId)
    .order('name', { ascending: true })

  // 4. Fetch Tasks
  const { data: rawTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('startup_id', startupId)
    .order('created_at', { ascending: false })

  if (tasksError) {
    console.error('Error fetching tasks for TV telemetry:', tasksError)
  }

  const assignedUserIds = (rawTasks || [])
    .map((t) => t.assigned_to)
    .filter((id): id is string => Boolean(id))

  const { data: profiles } =
    assignedUserIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', assignedUserIds)
      : { data: [] }

  const profileMap = new Map((profiles || []).map((p) => [p.id, p.full_name]))

  const tasks = (rawTasks || []).map((t) => ({
    ...t,
    assigneeName: t.assigned_to ? profileMap.get(t.assigned_to) || 'Operator' : 'Unassigned',
  }))

  // 5. Fetch Staff count
  const { count: staffCount } = await supabase
    .from('startup_members')
    .select('*', { count: 'exact', head: true })
    .eq('startup_id', startupId)

  // 6. Fetch Recent Activity Logs
  const { data: activities } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('startup_id', startupId)
    .order('created_at', { ascending: false })
    .limit(8)

  // Compute Metrics
  const allTasks = tasks || []
  const totalTasks = allTasks.length
  const doneTasks = allTasks.filter((t) => t.status === 'DONE')
  const inProgressTasks = allTasks.filter((t) => t.status === 'IN_PROGRESS')
  const todoTasks = allTasks.filter((t) => t.status === 'TODO')

  const earlyCount = doneTasks.filter((t) => t.completion_status === 'EARLY').length
  const onTimeCount = doneTasks.filter((t) => t.completion_status === 'ON_TIME').length
  const lateCount = doneTasks.filter((t) => t.completion_status === 'LATE').length

  const completionRate = totalTasks > 0 ? Math.round((doneTasks.length / totalTasks) * 100) : 0

  // Determine Sprint Status
  let sprintStatus: 'AHEAD' | 'ON_TRACK' | 'BEHIND' | 'AT_RISK' = 'ON_TRACK'
  if (totalTasks === 0) {
    sprintStatus = 'ON_TRACK'
  } else if (completionRate >= 80 || earlyCount >= 2) {
    sprintStatus = 'AHEAD'
  } else if (lateCount > 2 || (daysRemaining <= 2 && completionRate < 50)) {
    sprintStatus = 'AT_RISK'
  } else if (completionRate < 40 && daysRemaining <= 3) {
    sprintStatus = 'BEHIND'
  }

  // 7. Compute Burndown Trajectory Data (Mon -> Sun)
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const idealStep = totalTasks > 0 ? totalTasks / 6 : 1
  const burndownData = dayNames.map((day, idx) => {
    const idealRemaining = Math.max(0, Math.round(totalTasks - idx * idealStep))
    const dayOffset = idx
    const targetDay = new Date(mondayStr)
    targetDay.setDate(targetDay.getDate() + dayOffset)
    const targetDayStr = targetDay.toISOString().split('T')[0]

    const completedByDay = doneTasks.filter((t) => {
      if (!t.completed_at) return false
      return t.completed_at.split('T')[0] <= targetDayStr
    }).length

    const actualRemaining = Math.max(0, totalTasks - completedByDay)

    return {
      day,
      ideal: totalTasks > 0 ? idealRemaining : 0,
      actual: targetDayStr <= todayStr ? actualRemaining : null,
      completed: completedByDay,
    }
  })

  // 8. Compute Domain Throughput Comparison
  const domainThroughput = (domains || []).map((d) => {
    const dTasks = allTasks.filter((t) => t.domain_id === d.id)
    const dDone = dTasks.filter((t) => t.status === 'DONE').length
    const dInProgress = dTasks.filter((t) => t.status === 'IN_PROGRESS').length
    const dTodo = dTasks.filter((t) => t.status === 'TODO').length
    const rate = dTasks.length > 0 ? Math.round((dDone / dTasks.length) * 100) : 0

    return {
      name: d.name,
      total: dTasks.length,
      done: dDone,
      inProgress: dInProgress,
      todo: dTodo,
      rate,
    }
  })

  // 9. Compute Quality Distribution
  const qualityData = [
    { name: 'Early', value: earlyCount, color: '#10b981' },
    { name: 'On-Time', value: onTimeCount, color: '#0ea5e9' },
    { name: 'Late', value: lateCount, color: '#f59e0b' },
    { name: 'Active', value: inProgressTasks.length + todoTasks.length, color: '#6366f1' },
  ].filter((item) => item.value > 0)

  const displayQualityData =
    qualityData.length > 0
      ? qualityData
      : [
          { name: 'In Progress', value: inProgressTasks.length || 1, color: '#0ea5e9' },
          { name: 'Pending', value: todoTasks.length || 1, color: '#a1a1aa' },
        ]

  // 10. Active Deliverables List (Formatted for TV Wall view)
  const deliverables = allTasks.slice(0, 10).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    completion_status: t.completion_status,
    domainName: domains?.find((d) => d.id === t.domain_id)?.name || 'General',
    assigneeName: t.assigneeName || 'Unassigned',
    dueDate: t.due_date,
  }))

  return {
    timestamp: new Date().toISOString(),
    startup: {
      id: startup.id,
      name: startup.name,
      email: startup.email,
      status: startup.status,
      initial: startup.name.charAt(0).toUpperCase(),
    },
    sprint: {
      id: currentPlan?.id || null,
      weekStart: currentPlan?.week_start || mondayStr,
      weekEnd: currentPlan?.week_end || sundayStr,
      goal: currentPlan?.goal || 'Drive weekly domain outcomes and ship product milestones.',
      daysRemaining,
      status: sprintStatus,
    },
    metrics: {
      totalTasks,
      doneTasks: doneTasks.length,
      inProgressTasks: inProgressTasks.length,
      todoTasks: todoTasks.length,
      earlyCount,
      onTimeCount,
      lateCount,
      completionRate,
      operatorsCount: staffCount || 1,
      domainsCount: domains?.length || 0,
    },
    charts: {
      burndown: burndownData,
      domains: domainThroughput,
      quality: displayQualityData,
    },
    deliverables,
    recentActivity: (activities || []).map((a) => ({
      id: a.id,
      action: a.action,
      time: a.created_at,
    })),
  }
}
