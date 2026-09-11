import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { CompanyLogo } from '@/components/brand/CompanyLogo'

export const metadata: Metadata = { title: 'Admin Dashboard' }

async function getAdminStats() {
  const supabase = await createClient()

  const [
    { count: totalStartups },
    { count: activeStartups },
    { count: pendingRegistrations },
    { count: totalTasksThisWeek },
    { count: completedTasks },
    { count: overdueTasks },
  ] = await Promise.all([
    supabase.from('startups').select('*', { count: 'exact', head: true }),
    supabase
      .from('startups')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE'),
    supabase
      .from('registration_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING'),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'DONE')
      .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'DONE')
      .lt('due_date', new Date().toISOString().split('T')[0]),
  ])

  return {
    totalStartups: totalStartups ?? 0,
    activeStartups: activeStartups ?? 0,
    pendingRegistrations: pendingRegistrations ?? 0,
    totalTasksThisWeek: totalTasksThisWeek ?? 0,
    completedTasks: completedTasks ?? 0,
    overdueTasks: overdueTasks ?? 0,
  }
}

async function getRecentActivity() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)
  return data || []
}

async function getStartupsOverview() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('startups')
    .select('id, name, status, created_at, logo_url')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })
    .limit(6)
  return data || []
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${days}d ago`
}

export default async function AdminDashboard() {
  const [stats, activity, startups] = await Promise.all([
    getAdminStats(),
    getRecentActivity(),
    getStartupsOverview(),
  ])

  const statCards = [
    { label: 'Total Startups', value: stats.totalStartups, icon: '🏢', color: 'var(--color-brand)' },
    { label: 'Active Startups', value: stats.activeStartups, icon: '✅', color: 'var(--color-success)' },
    {
      label: 'Pending Reviews',
      value: stats.pendingRegistrations,
      icon: '⏳',
      color: stats.pendingRegistrations > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)',
      link: '/admin/registrations',
    },
    { label: 'Tasks This Week', value: stats.totalTasksThisWeek, icon: '📋', color: 'var(--color-info)' },
    { label: 'Completed Tasks', value: stats.completedTasks, icon: '🎯', color: 'var(--color-success)' },
    {
      label: 'Overdue Tasks',
      value: stats.overdueTasks,
      icon: '🔴',
      color: stats.overdueTasks > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)',
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Control Tower</h1>
          <p className="page-subtitle">Portfolio overview and real-time performance monitoring</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/tv" target="_blank" className="btn btn-secondary">
            📺 Live TV Wall View
          </Link>
          {stats.pendingRegistrations > 0 && (
            <Link href="/admin/registrations" className="btn btn-primary">
              Review {stats.pendingRegistrations} Pending{' '}
              {stats.pendingRegistrations === 1 ? 'Application' : 'Applications'}
            </Link>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid-stats" style={{ marginBottom: 32 }}>
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 22 }}>{card.icon}</span>
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: card.color,
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {card.value}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Active Startups */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Active Startups</h2>
            <Link
              href="/admin/startups"
              style={{ fontSize: 13, color: 'var(--color-brand)', textDecoration: 'none' }}
            >
              View all →
            </Link>
          </div>

          {startups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚀</div>
              <h3>No active startups yet</h3>
              <p>Approved startups will appear here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {startups.map((startup) => (
                <Link
                  key={startup.id}
                  href={`/admin/startups/${startup.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      transition: 'border-color 0.15s',
                      cursor: 'pointer',
                    }}
                  >
                    <CompanyLogo logoUrl={startup.logo_url} name={startup.name} size={36} />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {startup.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        Active since {new Date(startup.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="badge badge-success">ACTIVE</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Activity</h2>
            <Link
              href="/admin/activity"
              style={{ fontSize: 13, color: 'var(--color-brand)', textDecoration: 'none' }}
            >
              View all →
            </Link>
          </div>

          {activity.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚡</div>
              <h3>No activity yet</h3>
              <p>Actions across all startups will appear here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activity.map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--color-brand)',
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      {log.action.replace(/_/g, ' ').toLowerCase()}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {timeAgo(log.created_at)}
                    </div>
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
