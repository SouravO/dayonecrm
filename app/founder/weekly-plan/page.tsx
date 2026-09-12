import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import { WeeklyPlanClient } from '@/components/weekly-plan/WeeklyPlanClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Weekly Plan' }

interface Props {
  searchParams?: Promise<{ plan?: string }>
}

export default async function WeeklyPlanPage(props: Props) {
  const session = await getSession()
  const supabase = await createClient()
  const searchParams = props.searchParams ? await props.searchParams : {}

  const { data: member } = await supabase
    .from('startup_members')
    .select('startup_id')
    .eq('user_id', session!.id)
    .eq('role', 'FOUNDER')
    .single()

  const startupId = member?.startup_id
  if (!startupId) return <div>Startup not found</div>

  const today = new Date().toISOString().split('T')[0]

  const [{ data: allPlans }, { data: domains }, { data: staff }] = await Promise.all([
    supabase
      .from('weekly_plans')
      .select('*')
      .eq('startup_id', startupId)
      .order('week_start', { ascending: false }),
    supabase.from('domains').select('*').eq('startup_id', startupId),
    supabase
      .from('startup_members')
      .select('user_id, role, profile:profiles(id, full_name, email)')
      .eq('startup_id', startupId)
      .order('created_at', { ascending: true }),
  ])

  // Determine active plan:
  // 1. By query param ?plan=<id>
  // 2. Or the plan covering today
  // 3. Or most recent plan
  let activePlan = null
  if (allPlans && allPlans.length > 0) {
    if (searchParams.plan) {
      activePlan = allPlans.find((p) => p.id === searchParams.plan) || null
    }
    if (!activePlan) {
      activePlan = allPlans.find((p) => p.week_start <= today && p.week_end >= today) || allPlans[0]
    }
  }

  const { data: tasks } = activePlan
    ? await supabase
        .from('tasks')
        .select('*')
        .eq('weekly_plan_id', activePlan.id)
        .order('created_at', { ascending: true })
    : { data: [] }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Weekly Plans & Sprints</h1>
          <p className="page-subtitle">Organize and track your startup&apos;s sprint execution</p>
        </div>
      </div>
      <WeeklyPlanClient
        startupId={startupId}
        allPlans={allPlans || []}
        activePlan={activePlan}
        domains={domains || []}
        tasks={tasks || []}
        staffMembers={(staff as any) || []}
      />
    </div>
  )
}
