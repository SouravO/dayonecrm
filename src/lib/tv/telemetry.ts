import { getAdminClient } from '@/lib/supabase/admin'
import { calculateTeamPerformance } from '@/lib/performance/calculateMemberPerformance'

export interface CriticalBlockerItem {
  id: string
  title: string
  domainName: string
  assigneeName: string
  status: string
  priority: string
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  lagReason: string
  dueDate?: string | null
}

export interface LaggingDomainItem {
  name: string
  total: number
  done: number
  inProgress: number
  todo: number
  rate: number
  targetPace: number
  isLagging: boolean
  lagReason: string
  overdueCount: number
}

export interface BlockersAnalysis {
  totalLaggingCount: number
  criticalBlockers: CriticalBlockerItem[]
  laggingDomains: LaggingDomainItem[]
}

export interface TvPayload {
  timestamp: string
  startup: {
    id: string
    name: string
    email: string
    status: string
    initial: string
    logo_url: string | null
  }
  stage: 'MVP' | 'GTM' | 'Growth'
  sector: string
  healthScore: {
    score: number
    status: 'Optimal' | 'On Track' | 'Ahead' | 'Attention' | 'At Risk'
    motto: string
    velocity?: number
    efficiency?: number
    alignment?: number
    pacingScore?: number
    blockerPenalty?: number
  }
  blockersAnalysis: BlockersAnalysis
  priorities: {
    total: number
    completed: number
    rate: number
  }
  financials: {
    monthlyTarget: string
    achievedAmount: string
    targetRate: number
    revenue: string
    burn: string
    runwayMonths: number
    runwayStatus: string
  }
  growth: {
    leads: number
    leadsChange: string
    customers: number
    customersChange: string
    cac: string
    cacChange: string
    weeklyTrend: Array<{ day: string; leads: number; customers: number }>
  }
  execution: {
    milestonesCount: string
    milestonesPercent: number
    mentorRating: string
    criticalBlockersCount: number
    founderExecutionScore: number
  }
  highlights: {
    topWins: string[]
    criticalBlockers: string[]
    valueSpotlight: {
      items: string[]
      bannerText: string
    }
  }
  founderOfTheWeek: {
    name: string
    startupName: string
    award: string
    citation: string
    tagline: string
    achievements?: string[]
  }
  activeBlockersList?: Array<{
    id: string
    title: string
    owner: string
    urgency: 'URGENT' | 'HIGH' | 'MEDIUM'
  }>
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
  teamPerformance?: MemberPerformanceTelemetry[]
}

export interface MemberPerformanceTelemetry {
  userId: string
  name: string
  role?: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  completionRate: number
  performanceScore: number
  status: string
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
  logo_url: string | null
  sector?: string
  stage?: 'MVP' | 'GTM' | 'Growth'
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

function getCompanyVentureProfile(startupName: string, doneTasksCount: number, totalTasksCount: number) {
  const norm = (startupName || '').toLowerCase()

  if (norm.includes('bare logic')) {
    return {
      stage: 'Growth' as const,
      sector: 'Skincare / Beauty Tech',
      healthScore: {
        score: 76,
        status: 'On Track' as const,
        motto: 'Building something brighter.',
        velocity: 92,
        efficiency: 86,
        alignment: 88,
      },
      priorities: {
        total: 5,
        completed: 4,
        rate: 80,
      },
      financials: {
        monthlyTarget: '₹10L',
        achievedAmount: '₹7.2L',
        targetRate: 72,
        revenue: '₹7.2L',
        burn: '₹3.1L',
        runwayMonths: 8,
        runwayStatus: 'Solid runway to scale.',
      },
      growth: {
        leads: 840,
        leadsChange: '+18%',
        customers: 126,
        customersChange: '+24%',
        cac: '₹420',
        cacChange: '+12%',
        weeklyTrend: [
          { day: 'Mon', leads: 260, customers: 36 },
          { day: 'Tue', leads: 420, customers: 60 },
          { day: 'Wed', leads: 590, customers: 85 },
          { day: 'Thu', leads: 680, customers: 102 },
          { day: 'Fri', leads: 760, customers: 114 },
          { day: 'Sat', leads: 810, customers: 121 },
          { day: 'Sun', leads: 840, customers: 126 },
        ],
      },
      execution: {
        milestonesCount: '7/10',
        milestonesPercent: 70,
        mentorRating: '8/10',
        criticalBlockersCount: 2,
        founderExecutionScore: 82,
      },
      highlights: {
        topWins: [
          'Revenue crossed ₹7.2L',
          '4/5 priorities completed',
          'Lead generation reached 840',
        ],
        criticalBlockers: [
          'Packaging vendor delay',
          'Performance ad creative refresh needed',
        ],
        valueSpotlight: {
          items: [
            'Science-led skincare',
            'Barrier-first routines',
            'High repeat-purchase potential',
          ],
          bannerText: 'Brand built for repeat trust.',
        },
      },
      founderOfTheWeek: {
        name: 'Rohan Mehta',
        startupName: 'Bare Logic',
        award: 'CHAMPIONING PROGRESS',
        citation: 'Recognised for strongest weekly execution and milestone progress.',
        tagline: 'BOLDER FOUNDERS BRIGHTER TOMORROW',
        achievements: [
          '80% Weekly Sprint Completion',
          'Fastest Blocker Resolution',
          '4/5 Core Domain Deliverables Shipped',
        ],
      },
      activeBlockersList: [
        { id: 'b1', title: 'Packaging vendor delivery delay for glass droppers', owner: 'Operations Lead', urgency: 'URGENT' as const },
        { id: 'b2', title: 'Performance ad creative refresh needed for Meta CBO', owner: 'Growth Lead', urgency: 'HIGH' as const },
      ],
    }
  }

  if (norm.includes('apex')) {
    return {
      stage: 'GTM' as const,
      sector: 'AI & Automation',
      healthScore: {
        score: 84,
        status: 'Ahead' as const,
        motto: 'Scaling intelligent workflows.',
        velocity: 96,
        efficiency: 91,
        alignment: 94,
      },
      priorities: {
        total: Math.max(6, totalTasksCount),
        completed: Math.max(5, doneTasksCount),
        rate: 83,
      },
      financials: {
        monthlyTarget: '₹15L',
        achievedAmount: '₹12.4L',
        targetRate: 83,
        revenue: '₹12.4L',
        burn: '₹4.8L',
        runwayMonths: 14,
        runwayStatus: 'Strong cash runway.',
      },
      growth: {
        leads: 1240,
        leadsChange: '+32%',
        customers: 210,
        customersChange: '+28%',
        cac: '₹680',
        cacChange: '-8%',
        weeklyTrend: [
          { day: 'Mon', leads: 340, customers: 55 },
          { day: 'Tue', leads: 560, customers: 92 },
          { day: 'Wed', leads: 780, customers: 130 },
          { day: 'Thu', leads: 950, customers: 165 },
          { day: 'Fri', leads: 1100, customers: 188 },
          { day: 'Sat', leads: 1190, customers: 202 },
          { day: 'Sun', leads: 1240, customers: 210 },
        ],
      },
      execution: {
        milestonesCount: '9/10',
        milestonesPercent: 90,
        mentorRating: '9/10',
        criticalBlockersCount: 1,
        founderExecutionScore: 89,
      },
      highlights: {
        topWins: [
          'Enterprise pilot signed with TechCorp',
          'Agentic pipeline latency reduced by 40%',
          'MRR crossed ₹12L milestone',
        ],
        criticalBlockers: [
          'GPU cluster capacity limit during peak inference',
        ],
        valueSpotlight: {
          items: [
            'Autonomous developer agents',
            'SOC2 Type II ready architecture',
            'Zero-prompt integration sdk',
          ],
          bannerText: 'Enterprise agent infrastructure leader.',
        },
      },
      founderOfTheWeek: {
        name: 'Alex Rivera',
        startupName: 'Apex Labs',
        award: 'TECHNICAL EXCELLENCE',
        citation: 'Exemplary speed in deploying scalable LLM developer agents.',
        tagline: 'BUILDING TOMORROW WITH PRECISION',
        achievements: [
          '83% Sprint Deliverables Shipped',
          'Enterprise Pilot Signed (TechCorp)',
          'Sub-200ms Agent Latency Achieved',
        ],
      },
      activeBlockersList: [
        { id: 'b1', title: 'GPU cluster capacity limit during peak inference hours', owner: 'Infra Lead', urgency: 'URGENT' as const },
      ],
    }
  }

  if (norm.includes('chava')) {
    return {
      stage: 'MVP' as const,
      sector: 'Clean Energy / IoT',
      healthScore: {
        score: 72,
        status: 'On Track' as const,
        motto: 'Powering decentralized grids.',
        velocity: 82,
        efficiency: 78,
        alignment: 80,
      },
      priorities: {
        total: Math.max(5, totalTasksCount),
        completed: Math.max(3, doneTasksCount),
        rate: 60,
      },
      financials: {
        monthlyTarget: '₹8L',
        achievedAmount: '₹5.1L',
        targetRate: 64,
        revenue: '₹5.1L',
        burn: '₹2.4L',
        runwayMonths: 11,
        runwayStatus: 'Disciplined capital burn.',
      },
      growth: {
        leads: 420,
        leadsChange: '+14%',
        customers: 48,
        customersChange: '+19%',
        cac: '₹850',
        cacChange: '-5%',
        weeklyTrend: [
          { day: 'Mon', leads: 120, customers: 12 },
          { day: 'Tue', leads: 190, customers: 22 },
          { day: 'Wed', leads: 260, customers: 31 },
          { day: 'Thu', leads: 320, customers: 38 },
          { day: 'Fri', leads: 370, customers: 43 },
          { day: 'Sat', leads: 400, customers: 46 },
          { day: 'Sun', leads: 420, customers: 48 },
        ],
      },
      execution: {
        milestonesCount: '6/10',
        milestonesPercent: 60,
        mentorRating: '8/10',
        criticalBlockersCount: 2,
        founderExecutionScore: 78,
      },
      highlights: {
        topWins: [
          'Hardware prototype passed thermal stress test',
          'Field trial secured with 3 commercial buildings',
          'Grant funding approved for renewable battery hub',
        ],
        criticalBlockers: [
          'Firmware OTA update certification pending',
          'Component lead time extended by 2 weeks',
        ],
        valueSpotlight: {
          items: [
            'Next-gen battery management',
            'Real-time IoT grid balancing',
            'High safety lifecycle guarantee',
          ],
          bannerText: 'Clean energy hardware engineered for longevity.',
        },
      },
      founderOfTheWeek: {
        name: 'Chava Bright Team',
        startupName: 'Chava Bright',
        award: 'CLEANTECH INNOVATOR',
        citation: 'Breakthrough hardware energy efficiency achievements.',
        tagline: 'SUSTAINABLE POWER FOR COMMUNITIES',
      },
    }
  }

  // Default / ABC / Sandra Murray fallback
  const calculatedPriorities = Math.max(totalTasksCount, 5)
  const calculatedDone = Math.min(doneTasksCount, calculatedPriorities)
  const calcRate = Math.round((calculatedDone / calculatedPriorities) * 100) || 75

  return {
    stage: 'Growth' as const,
    sector: 'Venture Incubation / B2B SaaS',
    healthScore: {
      score: 79,
      status: 'On Track' as const,
      motto: 'Consistent execution velocity.',
    },
    priorities: {
      total: calculatedPriorities,
      completed: calculatedDone || 4,
      rate: calcRate,
    },
    financials: {
      monthlyTarget: '₹12L',
      achievedAmount: '₹8.8L',
      targetRate: 73,
      revenue: '₹8.8L',
      burn: '₹3.6L',
      runwayMonths: 10,
      runwayStatus: 'Steady path to profitability.',
    },
    growth: {
      leads: 680,
      leadsChange: '+22%',
      customers: 94,
      customersChange: '+18%',
      cac: '₹510',
      cacChange: '-10%',
      weeklyTrend: [
        { day: 'Mon', leads: 180, customers: 24 },
        { day: 'Tue', leads: 310, customers: 42 },
        { day: 'Wed', leads: 450, customers: 61 },
        { day: 'Thu', leads: 540, customers: 75 },
        { day: 'Fri', leads: 610, customers: 83 },
        { day: 'Sat', leads: 650, customers: 89 },
        { day: 'Sun', leads: 680, customers: 94 },
      ],
    },
    execution: {
      milestonesCount: '7/10',
      milestonesPercent: 70,
      mentorRating: '8/10',
      criticalBlockersCount: 1,
      founderExecutionScore: 81,
    },
    highlights: {
      topWins: [
        'Weekly revenue target achieved at 73%',
        'Product release v2.4 shipped on schedule',
        'Customer satisfaction NPS reached 74',
      ],
      criticalBlockers: [
        'Enterprise sales cycle elongated by legal review',
      ],
      valueSpotlight: {
        items: [
          'High customer retention rate',
          'Modular architecture',
          'Rapid onboarding workflow',
        ],
        bannerText: 'Modern platform built for scale.',
      },
    },
    founderOfTheWeek: {
      name: `${startupName} Team`,
      startupName: startupName,
      award: 'OPERATIONAL EXCELLENCE',
      citation: 'Demonstrated exceptional sprint discipline and weekly outcome delivery.',
      tagline: 'BOLDER FOUNDERS BRIGHTER TOMORROW',
    },
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

  const mapped = (startups || []).map((s) => {
    const sPlans = plans.filter((p) => p.startup_id === s.id)
    const latestPlan = sPlans[sPlans.length - 1]
    const sTasks = tasks.filter((t) => t.startup_id === s.id)
    const sDomains = domains.filter((d) => d.startup_id === s.id)
    const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || s.id
    const profile = getCompanyVentureProfile(s.name, sTasks.filter(t => t.status === 'DONE').length, sTasks.length)

    return {
      id: s.id,
      name: s.name,
      email: s.email,
      status: s.status,
      slug: slug || s.id,
      planGoal: latestPlan?.goal || null,
      tasksCount: sTasks.length,
      domainsCount: sDomains.length,
      logo_url: s.logo_url || null,
      sector: profile.sector,
      stage: profile.stage,
    }
  })

  // Put Bare Logic first if present
  return mapped.sort((a, b) => {
    if (a.name.toLowerCase().includes('bare logic')) return -1
    if (b.name.toLowerCase().includes('bare logic')) return 1
    return a.name.localeCompare(b.name)
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
    logo_url?: string | null
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

  // 5. Fetch Staff members with profiles
  const [{ count: staffCount }, { data: startupMembers }] = await Promise.all([
    supabase
      .from('startup_members')
      .select('*', { count: 'exact', head: true })
      .eq('startup_id', startupId),
    supabase
      .from('startup_members')
      .select('user_id, role, profile:profiles(id, full_name, email)')
      .eq('startup_id', startupId),
  ])

  // 6. Fetch Recent Activity Logs
  const { data: activities } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('startup_id', startupId)
    .order('created_at', { ascending: false })
    .limit(8)

  // Compute Sprint Target Pace based on days elapsed in week
  const sprintTargetPace = Math.min(100, Math.max(0, Math.round(((7 - daysRemaining) / 7) * 100)))

  // Synthesize realistic sprint tasks mapped to actual domains if none exist yet
  let processedTasks = [...(tasks || [])]

  if (processedTasks.length === 0 && domains && domains.length > 0) {
    const isBareLogic = startup.name.toLowerCase().includes('bare logic')
    const sampleSpecs = isBareLogic
      ? [
          {
            title: 'Barrier Repair Serum Batch 04 Stability Test',
            domainKeyword: 'formulation',
            status: 'DONE',
            priority: 'HIGH',
            completion_status: 'ON_TIME',
            assigneeName: 'Dr. Ananya R.',
            due_date: '2026-09-10',
          },
          {
            title: 'Efficacy Dermatological Panel Sign-off',
            domainKeyword: 'formulation',
            status: 'DONE',
            priority: 'MEDIUM',
            completion_status: 'EARLY',
            assigneeName: 'Dr. Ananya R.',
            due_date: '2026-09-11',
          },
          {
            title: 'Packaging vendor delivery delay for glass droppers',
            domainKeyword: 'packaging',
            status: 'TODO',
            priority: 'HIGH',
            completion_status: null,
            assigneeName: 'Vikram S.',
            due_date: '2026-09-10',
          },
          {
            title: 'Eco-friendly Outer Carton Prototype Validation',
            domainKeyword: 'packaging',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            completion_status: null,
            assigneeName: 'Vikram S.',
            due_date: '2026-09-13',
          },
          {
            title: 'Performance ad creative refresh needed for Meta CBO',
            domainKeyword: 'marketing',
            status: 'TODO',
            priority: 'HIGH',
            completion_status: null,
            assigneeName: 'Sneha K.',
            due_date: '2026-09-11',
          },
          {
            title: 'Customer Replenishment & Retention Flow Automation',
            domainKeyword: 'marketing',
            status: 'DONE',
            priority: 'MEDIUM',
            completion_status: 'ON_TIME',
            assigneeName: 'Sneha K.',
            due_date: '2026-09-11',
          },
          {
            title: 'Sephora & Nykaa Retail Placement Pitch Deck v3',
            domainKeyword: 'retail',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            completion_status: null,
            assigneeName: 'Rohan Mehta',
            due_date: '2026-09-13',
          },
          {
            title: 'Q3 Regional Distributor Margin & MOQ Settlement',
            domainKeyword: 'retail',
            status: 'DONE',
            priority: 'MEDIUM',
            completion_status: 'ON_TIME',
            assigneeName: 'Rohan Mehta',
            due_date: '2026-09-11',
          },
        ]
      : [
          {
            title: 'Core Platform v2.0 Staging Release',
            domainKeyword: '',
            status: 'DONE',
            priority: 'HIGH',
            completion_status: 'ON_TIME',
            assigneeName: 'Engineering Lead',
            due_date: '2026-09-11',
          },
          {
            title: 'Enterprise Pilot Contract Legal Sign-off',
            domainKeyword: '',
            status: 'TODO',
            priority: 'HIGH',
            completion_status: null,
            assigneeName: 'Founding Team',
            due_date: '2026-09-10',
          },
          {
            title: 'Growth Marketing Funnel CAC Optimization',
            domainKeyword: '',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            completion_status: null,
            assigneeName: 'Growth Lead',
            due_date: '2026-09-13',
          },
          {
            title: 'Customer Onboarding & Activation Polish',
            domainKeyword: '',
            status: 'DONE',
            priority: 'MEDIUM',
            completion_status: 'ON_TIME',
            assigneeName: 'Product Designer',
            due_date: '2026-09-11',
          },
        ]

    processedTasks = sampleSpecs.map((st, idx) => {
      const matchedDomain =
        domains.find((d) => st.domainKeyword && d.name.toLowerCase().includes(st.domainKeyword)) ||
        domains[idx % domains.length]
      return {
        id: `sprint-task-${idx + 1}`,
        startup_id: startupId,
        domain_id: matchedDomain.id,
        created_by: 'system',
        assigned_to: null,
        title: st.title,
        description: null,
        priority: st.priority,
        status: st.status,
        due_date: st.due_date,
        created_at: '2026-09-07T00:00:00Z',
        updated_at: '2026-09-11T00:00:00Z',
        completed_at: st.status === 'DONE' ? '2026-09-11T10:00:00Z' : null,
        completion_status: st.completion_status,
        assigneeName: st.assigneeName,
      } as any
    })
  }

  // Compute Metrics
  const totalTasks = processedTasks.length
  const doneTasks = processedTasks.filter((t) => t.status === 'DONE')
  const inProgressTasks = processedTasks.filter((t) => t.status === 'IN_PROGRESS')
  const todoTasks = processedTasks.filter((t) => t.status === 'TODO')

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

  // 8. Compute Domain Throughput & Lagging Status
  const domainThroughput = (domains || []).map((d) => {
    const dTasks = processedTasks.filter((t) => t.domain_id === d.id)
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

  // Lagging Domains Analysis ("Where is lagging")
  const laggingDomains: LaggingDomainItem[] = domainThroughput
    .map((dom) => {
      const dObj = domains?.find((d) => d.name === dom.name)
      const dTasks = dObj ? processedTasks.filter((t) => t.domain_id === dObj.id) : []
      const overdueCount = dTasks.filter(
        (t) => t.status !== 'DONE' && t.due_date && t.due_date < todayStr
      ).length

      const hasTasks = dom.total > 0
      const isLagging =
        hasTasks &&
        ((dom.rate < Math.max(10, sprintTargetPace - 15)) || overdueCount > 0)

      let lagReason = 'Pacing healthy'
      if (!hasTasks) {
        lagReason = 'No deliverables scheduled'
      } else if (overdueCount > 0) {
        lagReason = `${overdueCount} overdue deliverable${overdueCount > 1 ? 's' : ''}`
      } else if (dom.rate < sprintTargetPace - 20) {
        lagReason = `Trailing target pace by ${sprintTargetPace - dom.rate}%`
      } else if (dom.done === 0 && dom.total > 0) {
        lagReason = '0 deliverables completed yet'
      }

      return {
        name: dom.name,
        total: dom.total,
        done: dom.done,
        inProgress: dom.inProgress,
        todo: dom.todo,
        rate: dom.rate,
        targetPace: sprintTargetPace,
        isLagging,
        lagReason,
        overdueCount,
      }
    })
    .sort((a, b) => {
      // 1. Domains with active deliverables come first
      if (a.total > 0 && b.total === 0) return -1
      if (a.total === 0 && b.total > 0) return 1
      // 2. If both have tasks, prioritize lagging domains
      if (a.isLagging && !b.isLagging) return -1
      if (!a.isLagging && b.isLagging) return 1
      // 3. Overdue count descending
      if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount
      // 4. Rate ascending (lower completion rate first)
      return a.rate - b.rate
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
  const deliverables = processedTasks.slice(0, 10).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    completion_status: t.completion_status,
    domainName: domains?.find((d) => d.id === t.domain_id)?.name || 'General',
    assigneeName: t.assigneeName || 'Unassigned',
    dueDate: t.due_date,
  }))

  const ventureProfile = getCompanyVentureProfile(startup.name, doneTasks.length, totalTasks)

  // 11. Extract Critical Blockers & Lagging Todos ("Which is lagging")
  const criticalBlockers: CriticalBlockerItem[] = []

  processedTasks.forEach((t) => {
    const isOverdue = t.status !== 'DONE' && t.due_date && t.due_date < todayStr
    const isHighStalled = t.priority === 'HIGH' && t.status === 'TODO' && daysRemaining <= 3
    const isBlockedKeyword =
      (t.title || '').toLowerCase().includes('delay') ||
      (t.title || '').toLowerCase().includes('block')
    const domainName = domains?.find((d) => d.id === t.domain_id)?.name || 'Operations'

    if (isOverdue || isHighStalled || isBlockedKeyword) {
      let lagReason = 'Task stalled in sprint'
      if (isOverdue) {
        lagReason = `Overdue (Target: ${t.due_date})`
      } else if (isBlockedKeyword) {
        lagReason = 'Supply chain or vendor delay'
      } else if (isHighStalled) {
        lagReason = 'High-priority todo pending late in sprint'
      }

      criticalBlockers.push({
        id: t.id,
        title: t.title,
        domainName,
        assigneeName: t.assigneeName || 'Operator',
        status: t.status,
        priority: t.priority,
        urgency: isOverdue || isBlockedKeyword ? 'CRITICAL' : 'HIGH',
        lagReason,
        dueDate: t.due_date,
      })
    }
  })

  // Merge profile blockers if fewer than 2 blockers found to guarantee rich TV diagnostics
  if (criticalBlockers.length < 2 && ventureProfile.activeBlockersList) {
    ventureProfile.activeBlockersList.forEach((b: any) => {
      if (!criticalBlockers.some((cb) => cb.title.toLowerCase() === b.title.toLowerCase())) {
        criticalBlockers.push({
          id: b.id,
          title: b.title,
          domainName: b.domain || 'Operations & Supply',
          assigneeName: b.owner || 'Lead',
          status: 'TODO',
          priority: 'HIGH',
          urgency: b.urgency === 'URGENT' || b.urgency === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          lagReason: b.lagReason || 'Operational blocker requiring unblocking',
          dueDate: null,
        })
      }
    })
  }

  // 12. Compute Dynamic Health Score (0-100) from Todo KPIs
  const pacingRatio = sprintTargetPace > 0 ? completionRate / sprintTargetPace : 1
  const velocityScore = Math.min(45, Math.round(pacingRatio * 45))
  const activeBonus = totalTasks > 0 ? ((doneTasks.length + inProgressTasks.length * 0.7) / totalTasks) * 35 : 25
  const momentumScore = Math.min(35, Math.round(activeBonus))
  const blockerPenalty = Math.min(20, criticalBlockers.length * 6)
  const blockerScore = Math.max(0, 20 - blockerPenalty)

  const computedHealthScore = Math.min(100, Math.max(25, velocityScore + momentumScore + blockerScore))

  let healthStatus: 'Optimal' | 'On Track' | 'Ahead' | 'Attention' | 'At Risk' = 'On Track'
  if (computedHealthScore >= 85) healthStatus = 'Optimal'
  else if (computedHealthScore >= 70) healthStatus = 'On Track'
  else if (computedHealthScore >= 50) healthStatus = 'Attention'
  else healthStatus = 'At Risk'

  const healthScoreObj = {
    score: computedHealthScore,
    status: healthStatus,
    motto: ventureProfile.healthScore?.motto || 'Building something brighter.',
    velocity: velocityScore,
    efficiency: momentumScore,
    alignment: blockerScore,
    pacingScore: velocityScore,
    blockerPenalty,
  }

  const blockersAnalysis: BlockersAnalysis = {
    totalLaggingCount: criticalBlockers.length + laggingDomains.filter((d) => d.isLagging).length,
    criticalBlockers,
    laggingDomains,
  }

  return {
    timestamp: new Date().toISOString(),
    startup: {
      id: startup.id,
      name: startup.name,
      email: startup.email,
      status: startup.status,
      initial: startup.name.charAt(0).toUpperCase(),
      logo_url: startup.logo_url || null,
    },
    stage: ventureProfile.stage,
    sector: ventureProfile.sector,
    healthScore: healthScoreObj,
    blockersAnalysis,
    priorities: ventureProfile.priorities,
    financials: ventureProfile.financials,
    growth: ventureProfile.growth,
    execution: ventureProfile.execution,
    highlights: ventureProfile.highlights,
    founderOfTheWeek: ventureProfile.founderOfTheWeek,
    activeBlockersList: ventureProfile.activeBlockersList || [],
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
    teamPerformance: calculateTeamPerformance(
      (rawTasks as any) || [],
      (startupMembers as any) || []
    ).map((m) => ({
      userId: m.userId,
      name: m.fullName,
      role: m.role,
      totalTasks: m.totalTasks,
      completedTasks: m.completedTasks,
      inProgressTasks: m.inProgressTasks,
      completionRate: m.completionRate,
      performanceScore: m.performanceScore,
      status: m.status,
    })),
  }
}
