import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import { TasksClient } from '@/components/tasks/TasksClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tasks' }

export default async function FounderTasksPage() {
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

  const [{ data: tasks }, { data: domains }, { data: weeklyPlans }, { data: staff }] =
    await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('startup_id', startupId)
        .order('created_at', { ascending: false }),
      supabase.from('domains').select('*').eq('startup_id', startupId),
      supabase
        .from('weekly_plans')
        .select('id, week_start, week_end, title, goal')
        .eq('startup_id', startupId)
        .order('week_start', { ascending: false }),
      supabase
        .from('startup_members')
        .select('user_id, role, profile:profiles(id, full_name, email)')
        .eq('startup_id', startupId)
        .order('created_at', { ascending: true }),
    ])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Tasks</h1>
          <p className="page-subtitle">{tasks?.length || 0} tasks total</p>
        </div>
      </div>
      <TasksClient
        startupId={startupId}
        tasks={tasks || []}
        domains={domains || []}
        weeklyPlans={weeklyPlans || []}
        staffMembers={staff as any || []}
        isFounder={true}
      />
    </div>
  )
}
