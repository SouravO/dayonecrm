import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Dashboard' }

export default async function StaffDashboard() {
  const session = await getSession()
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('startup_members')
    .select('startup_id')
    .eq('user_id', session!.id)
    .eq('role', 'STAFF')
    .single()

  const startupId = member?.startup_id

  const today = new Date().toISOString().split('T')[0]

  // Get weekly plans for this startup
  const { data: weeklyPlans } = startupId
    ? await supabase
        .from('weekly_plans')
        .select('*')
        .eq('startup_id', startupId)
        .order('week_start', { ascending: false })
    : { data: [] }

  // Current plan or most recent plan
  const currentPlan =
    weeklyPlans?.find((p) => p.week_start <= today && p.week_end >= today) ||
    weeklyPlans?.[0] ||
    null

  // Get tasks assigned to or created by this user, with domain
  const { data: myTasks } = await supabase
    .from('tasks')
    .select('*, domain:domains(id, name)')
    .or(`assigned_to.eq.${session!.id},created_by.eq.${session!.id}`)
    .order('created_at', { ascending: false })

  const taskStats = {
    total: myTasks?.length || 0,
    done: myTasks?.filter((t) => t.status === 'DONE').length || 0,
    inProgress: myTasks?.filter((t) => t.status === 'IN_PROGRESS').length || 0,
    todo: myTasks?.filter((t) => t.status === 'TODO').length || 0,
    early: myTasks?.filter((t) => t.completion_status === 'EARLY').length || 0,
    onTime: myTasks?.filter((t) => t.completion_status === 'ON_TIME').length || 0,
    late: myTasks?.filter((t) => t.completion_status === 'LATE').length || 0,
  }

  const completionRate =
    taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0

  const activeTasks = (myTasks || []).filter((t) => t.status !== 'DONE')
  const completedTasks = (myTasks || []).filter((t) => t.status === 'DONE')

  const statusColors: Record<string, string> = {
    TODO: 'badge-neutral',
    IN_PROGRESS: 'badge-info',
    DONE: 'badge-success',
  }

  const priorityColors: Record<string, string> = {
    LOW: 'badge-neutral',
    MEDIUM: 'badge-warning',
    HIGH: 'badge-danger',
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hey, {session!.full_name.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here&apos;s your deliverables and sprint progress</p>
        </div>
        <Link href="/staff/tasks" className="btn btn-primary">
          View All Tasks
        </Link>
      </div>

      {/* Stats */}
      <div className="grid-stats" style={{ marginBottom: 32 }}>
        {[
          { label: 'My Tasks', value: taskStats.total, icon: '📋', color: 'var(--color-brand)' },
          { label: 'Completed', value: taskStats.done, icon: '✅', color: 'var(--color-success)' },
          { label: 'In Progress', value: taskStats.inProgress, icon: '🔄', color: 'var(--color-info)' },
          { label: 'Todo', value: taskStats.todo, icon: '📌', color: 'var(--color-warning)' },
          { label: 'Completion Rate', value: `${completionRate}%`, icon: '📈', color: completionRate >= 70 ? 'var(--color-success)' : 'var(--color-danger)' },
          { label: 'Early Completions', value: taskStats.early, icon: '⚡', color: 'var(--color-success)' },
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
        {/* Assigned Deliverables */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>My Active Deliverables ({activeTasks.length})</h2>
            <Link href="/staff/tasks" style={{ fontSize: 12.5, color: 'var(--color-brand)', fontWeight: 600 }}>
              Manage →
            </Link>
          </div>

          {activeTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
              <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                All caught up!
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)' }}>
                You have no pending tasks assigned right now.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeTasks.slice(0, 8).map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--color-surface, #1e293b)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {task.title}
                    </span>
                    <span className={`badge ${statusColors[task.status] || 'badge-neutral'}`} style={{ fontSize: 10 }}>
                      {task.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`badge ${priorityColors[task.priority] || 'badge-neutral'}`} style={{ fontSize: 10 }}>
                      {task.priority}
                    </span>
                    {(task as any).domain?.name && (
                      <span className="badge badge-info" style={{ fontSize: 10 }}>
                        {(task as any).domain.name}
                      </span>
                    )}
                    {task.due_date && (
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        Due {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                Recently Completed ({completedTasks.length})
              </div>
              {completedTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                    fontSize: 13,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <span style={{ color: 'var(--color-success)' }}>✓</span>
                  <span style={{ textDecoration: 'line-through', flex: 1 }}>{task.title}</span>
                  {task.completion_status && (
                    <span className={`badge ${task.completion_status === 'EARLY' ? 'badge-success' : task.completion_status === 'ON_TIME' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: 9 }}>
                      {task.completion_status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current / Active Weekly Plan & Performance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Sprint Focus</h2>
            {currentPlan ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {currentPlan.title || 'Weekly Sprint'}
                  </span>
                  {today >= currentPlan.week_start && today <= currentPlan.week_end ? (
                    <span className="badge badge-success" style={{ fontSize: 10 }}>Current</span>
                  ) : today < currentPlan.week_start ? (
                    <span className="badge badge-info" style={{ fontSize: 10 }}>Upcoming</span>
                  ) : (
                    <span className="badge badge-neutral" style={{ fontSize: 10 }}>Recent</span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                  📅 {new Date(currentPlan.week_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} →{' '}
                  {new Date(currentPlan.week_end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {currentPlan.goal && (
                  <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontStyle: 'italic', padding: '10px 12px', background: 'var(--color-surface, #1e293b)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    &ldquo;{currentPlan.goal}&rdquo;
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <p>No sprint or weekly plan active yet</p>
              </div>
            )}
          </div>

          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>My Performance</h2>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Overall Completion</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{completionRate}%</span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${completionRate}%`,
                    background: completionRate >= 70 ? 'var(--color-success)' : 'var(--color-warning)',
                  }}
                />
              </div>
            </div>
            {[
              { label: '⚡ Early', value: taskStats.early, color: 'var(--color-success)', badge: 'badge-success' },
              { label: '🎯 On-Time', value: taskStats.onTime, color: 'var(--color-info)', badge: 'badge-info' },
              { label: '⏰ Late', value: taskStats.late, color: 'var(--color-warning)', badge: 'badge-warning' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{item.label}</span>
                <span className={`badge ${item.badge}`}>{item.value} tasks</span>
              </div>
            ))}

            <div style={{ marginTop: 20 }}>
              <Link href="/staff/tasks" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                View All My Tasks →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
