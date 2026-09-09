import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Startup Detail' }

interface Props {
  params: Promise<{ startupId: string }>
}

export default async function StartupDetailPage({ params }: Props) {
  const { startupId } = await params
  const supabase = await createClient()

  // Fetch startup + members + domains + current week + tasks + performance
  const [
    { data: startup },
    { data: members },
    { data: domains },
    { data: weeklyPlans },
    { data: recentTasks },
    { data: performance },
    { data: activity },
  ] = await Promise.all([
    supabase.from('startups').select('*').eq('id', startupId).single(),
    supabase
      .from('startup_members')
      .select('*, profile:profiles(*)')
      .eq('startup_id', startupId),
    supabase.from('domains').select('*').eq('startup_id', startupId),
    supabase
      .from('weekly_plans')
      .select('*')
      .eq('startup_id', startupId)
      .order('week_start', { ascending: false })
      .limit(4),
    supabase
      .from('tasks')
      .select('*')
      .eq('startup_id', startupId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('weekly_performance')
      .select('*')
      .eq('startup_id', startupId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('activity_logs')
      .select('*')
      .eq('startup_id', startupId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (!startup) notFound()

  const founder = (members || []).find((m) => m.role === 'FOUNDER')
  const staff = (members || []).filter((m) => m.role === 'STAFF')
  const currentPlan = weeklyPlans?.[0]
  const currentPlanTasks = (recentTasks || []).filter(
    (t) => t.weekly_plan_id === currentPlan?.id
  )
  const doneTasks = currentPlanTasks.filter((t) => t.status === 'DONE').length
  const totalTasks = currentPlanTasks.length

  const statusColors: Record<string, string> = {
    ACTIVE: 'badge-success',
    PENDING: 'badge-warning',
    REJECTED: 'badge-danger',
    INACTIVE: 'badge-neutral',
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/admin/startups" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 13 }}>
            ← Startups
          </Link>
          <div className="avatar" style={{ width: 44, height: 44, fontSize: 18 }}>
            {startup.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="page-title">{startup.name}</h1>
            <p className="page-subtitle">{startup.email}</p>
          </div>
        </div>
        <span className={`badge ${statusColors[startup.status] || 'badge-neutral'}`} style={{ fontSize: 13 }}>
          {startup.status}
        </span>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Founder & Staff */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Team</h2>
          {founder && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Founder
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="avatar">{(founder.profile as any)?.full_name?.charAt(0)?.toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{(founder.profile as any)?.full_name}</div>
                </div>
              </div>
            </div>
          )}
          {staff.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Staff ({staff.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {staff.map((m) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar avatar-sm">{(m.profile as any)?.full_name?.charAt(0)?.toUpperCase()}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{(m.profile as any)?.full_name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current Week */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Current Week</h2>
          {currentPlan ? (
            <>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                {new Date(currentPlan.week_start).toLocaleDateString()} →{' '}
                {new Date(currentPlan.week_end).toLocaleDateString()}
              </div>
              {currentPlan.goal && (
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16, fontStyle: 'italic' }}>
                  "{currentPlan.goal}"
                </div>
              )}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Task completion</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {doneTasks}/{totalTasks}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill progress-fill-brand"
                    style={{ width: totalTasks > 0 ? `${(doneTasks / totalTasks) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <p>No weekly plan yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        {/* Domains */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Domains</h2>
          {domains?.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No domains created</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {domains?.map((d) => (
                <span key={d.id} className="badge badge-info">{d.name}</span>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Activity</h2>
          {activity?.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No activity yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activity?.slice(0, 6).map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-brand)', marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {log.action.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 11, marginLeft: 8 }}>
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
