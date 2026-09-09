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

  // Get tasks assigned to or created by this user
  const { data: myTasks } = await supabase
    .from('tasks')
    .select('*')
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

  const currentWeekTasks = (myTasks || []).filter(
    (t) => currentPlan && t.weekly_plan_id === currentPlan.id
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hey, {session!.full_name.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here&apos;s your progress this week</p>
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
        {/* Current week */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Current Week</h2>
          {currentPlan ? (
            <>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                {new Date(currentPlan.week_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} →{' '}
                {new Date(currentPlan.week_end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              {currentPlan.goal && (
                <div style={{ fontSize: 15, color: 'var(--color-text-secondary)', fontStyle: 'italic', marginBottom: 16 }}>
                  "{currentPlan.goal}"
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                MY TASKS THIS WEEK
              </div>
              {currentWeekTasks.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No tasks assigned this week</p>
              ) : (
                currentWeekTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 0',
                      borderBottom: '1px solid var(--color-border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background:
                          task.status === 'DONE'
                            ? 'var(--color-success)'
                            : task.status === 'IN_PROGRESS'
                            ? 'var(--color-info)'
                            : 'var(--color-border)',
                      }}
                    />
                    <span style={{ fontSize: 13, color: task.status === 'DONE' ? 'var(--color-text-muted)' : 'var(--color-text-secondary)', flex: 1, textDecoration: task.status === 'DONE' ? 'line-through' : 'none' }}>
                      {task.title}
                    </span>
                    {task.completion_status && (
                      <span className={`badge ${task.completion_status === 'EARLY' ? 'badge-success' : task.completion_status === 'ON_TIME' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                        {task.completion_status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <p>No weekly plan this week</p>
            </div>
          )}
        </div>

        {/* Completion breakdown */}
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
  )
}
