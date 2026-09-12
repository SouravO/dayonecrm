import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import { WeeklyPlanClient } from '@/components/weekly-plan/WeeklyPlanClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Weekly Plan' }

export default async function WeeklyPlanPage() {
  const session = await getSession()
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('startup_members')
    .select('startup_id')
    .eq('user_id', session!.id)
    .eq('role', 'FOUNDER')
    .single()

  const startupId = member?.startup_id
  if (!startupId) return <div>Startup not found</div>

  const today = new Date().toISOString().split('T')[0]

  const [{ data: currentPlan }, { data: domains }, { data: staff }] = await Promise.all([
    supabase
      .from('weekly_plans')
      .select('*')
      .eq('startup_id', startupId)
      .lte('week_start', today)
      .gte('week_end', today)
      .single(),
    supabase.from('domains').select('*').eq('startup_id', startupId),
    supabase
      .from('startup_members')
      .select('user_id, role, profile:profiles(id, full_name, email)')
      .eq('startup_id', startupId)
      .order('created_at', { ascending: true }),
  ])

  const { data: tasks } = currentPlan
    ? await supabase
        .from('tasks')
        .select('*')
        .eq('weekly_plan_id', currentPlan.id)
        .order('created_at', { ascending: true })
    : { data: [] }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Weekly Plan</h1>
          <p className="page-subtitle">Organize this week&apos;s execution</p>
        </div>
      </div>
      <WeeklyPlanClient
        startupId={startupId}
        currentPlan={currentPlan}
        domains={domains || []}
        tasks={tasks || []}
        staffMembers={(staff as any) || []}
      />
    </div>
  )
}
