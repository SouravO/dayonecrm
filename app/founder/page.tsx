import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Founder Dashboard' }

export default async function FounderDashboard() {
  const session = await getSession()
  const supabase = await createClient()

  // Get startup info
  const { data: member } = await supabase
    .from('startup_members')
    .select('startup_id, startup:startups(*)')
    .eq('user_id', session!.id)
    .eq('role', 'FOUNDER')
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startup = (Array.isArray(member?.startup) ? member?.startup[0] : member?.startup) as Record<string, unknown> | null
  const startupId = member?.startup_id

  // Get current week plan
  const today = new Date().toISOString().split('T')[0]
  const { data: currentPlan } = startupId
    ? await supabase
        .from('weekly_plans')
        .select('*')
        .eq('startup_id', startupId)
        .lte('week_start', today)
        .gte('week_end', today)
        .single()
    : { data: null }

  // Get task counts
  const { data: tasks } = startupId
    ? await supabase.from('tasks').select('status, completion_status').eq('startup_id', startupId)
    : { data: [] }

  const taskStats = {
    total: tasks?.length || 0,
    done: tasks?.filter((t) => t.status === 'DONE').length || 0,
    inProgress: tasks?.filter((t) => t.status === 'IN_PROGRESS').length || 0,
    todo: tasks?.filter((t) => t.status === 'TODO').length || 0,
    early: tasks?.filter((t) => t.completion_status === 'EARLY').length || 0,
    onTime: tasks?.filter((t) => t.completion_status === 'ON_TIME').length || 0,
    late: tasks?.filter((t) => t.completion_status === 'LATE').length || 0,
  }

  // Get staff count
  const { count: staffCount } = startupId
    ? await supabase
        .from('startup_members')
        .select('*', { count: 'exact', head: true })
        .eq('startup_id', startupId)
        .eq('role', 'STAFF')
    : { count: 0 }

  // Get domains count
  const { count: domainCount } = startupId
    ? await supabase
        .from('domains')
        .select('*', { count: 'exact', head: true })
        .eq('startup_id', startupId)
    : { count: 0 }

  const completionRate =
    taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0

  const currentPlanTasks = (tasks || []).filter(
    (t) => currentPlan && 'weekly_plan_id' in t
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {startup ? (startup.name as string) : 'My Startup'}
          </h1>
          <p className="page-subtitle">Founder command center</p>
        </div>
        <Link href="/founder/weekly-plan" className="btn btn-primary">
          + New Weekly Plan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid-stats" style={{ marginBottom: 32 }}>
        {[
          { label: 'Total Tasks', value: taskStats.total, icon: '📋', color: 'var(--color-brand)' },
          { label: 'Completed', value: taskStats.done, icon: '✅', color: 'var(--color-success)' },
          { label: 'In Progress', value: taskStats.inProgress, icon: '🔄', color: 'var(--color-info)' },
          { label: 'Staff Members', value: staffCount || 0, icon: '👥', color: 'var(--color-warning)' },
          { label: 'Domains', value: domainCount || 0, icon: '🗂️', color: 'var(--color-brand)' },
          { label: 'Completion Rate', value: `${completionRate}%`, icon: '📈', color: completionRate >= 70 ? 'var(--color-success)' : 'var(--color-warning)' },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div style={{ fontSize: 22, marginBottom: 10 }}>{stat.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, lineHeight: 1, marginBottom: 6 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Current Week Plan */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Current Week</h2>
            <Link href="/founder/weekly-plan" style={{ fontSize: 13, color: 'var(--color-brand)', textDecoration: 'none' }}>
              Manage →
            </Link>
          </div>
          {currentPlan ? (
            <>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                {new Date(currentPlan.week_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} →{' '}
                {new Date(currentPlan.week_end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              {currentPlan.goal && (
                <div style={{ fontSize: 15, color: 'var(--color-text-secondary)', fontStyle: 'italic', marginBottom: 20, lineHeight: 1.6 }}>
                  "{currentPlan.goal}"
                </div>
              )}
            </>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <div className="empty-state-icon">📅</div>
              <h3>No plan this week</h3>
              <p style={{ marginBottom: 16 }}>Create a weekly plan to organize your team</p>
              <Link href="/founder/weekly-plan" className="btn btn-primary btn-sm">
                Create Plan
              </Link>
            </div>
          )}

          {/* Task progress summary */}
          {taskStats.total > 0 && (
            <div>
              {[
                { label: 'Completed', value: taskStats.done, total: taskStats.total, color: 'var(--color-success)' },
                { label: 'In Progress', value: taskStats.inProgress, total: taskStats.total, color: 'var(--color-info)' },
                { label: 'Todo', value: taskStats.todo, total: taskStats.total, color: 'var(--color-warning)' },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {item.value}/{item.total}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completion breakdown */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Completion Breakdown</h2>
          {taskStats.done === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <p>No completed tasks yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Early', value: taskStats.early, icon: '⚡', color: 'var(--color-success)', badge: 'badge-success' },
                { label: 'On-Time', value: taskStats.onTime, icon: '🎯', color: 'var(--color-info)', badge: 'badge-info' },
                { label: 'Late', value: taskStats.late, icon: '⏰', color: 'var(--color-warning)', badge: 'badge-warning' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        {item.label} Completion
                      </span>
                      <span className={`badge ${item.badge}`}>
                        {item.value} tasks
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${taskStats.done > 0 ? (item.value / taskStats.done) * 100 : 0}%`,
                          background: item.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 12 }}>
              QUICK ACTIONS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/founder/tasks" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                📋 Create Task
              </Link>
              <Link href="/founder/staff" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                👥 Add Staff Member
              </Link>
              <Link href="/founder/domains" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                🗂️ Manage Domains
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
