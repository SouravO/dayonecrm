import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { WeeklyPerformance } from '@/types'
import { calculatePerformanceStatus } from '@/lib/performance/calculatePerformanceStatus'

export const metadata: Metadata = { title: 'Startups' }

export default async function StartupsPage() {
  const supabase = await createClient()

  const { data: startups } = await supabase
    .from('startups')
    .select('*')
    .order('created_at', { ascending: false })

  // Get latest weekly performance for each startup
  const { data: performances } = await supabase
    .from('weekly_performance')
    .select('*')
    .order('created_at', { ascending: false })

  const perfByStartup = ((performances || []) as WeeklyPerformance[]).reduce<Record<string, WeeklyPerformance>>(
    (acc, p) => {
      if (!acc[p.startup_id]) acc[p.startup_id] = p
      return acc
    },
    {}
  )

  const statusColors: Record<string, string> = {
    ACTIVE: 'badge-success',
    PENDING: 'badge-warning',
    REJECTED: 'badge-danger',
    INACTIVE: 'badge-neutral',
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Startups</h1>
          <p className="page-subtitle">Portfolio overview — {startups?.length || 0} startups</p>
        </div>
      </div>

      {startups?.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🚀</div>
          <h3>No startups yet</h3>
          <p>Approved registrations will appear here</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Startup</th>
                <th>Status</th>
                <th>Completion</th>
                <th>Early %</th>
                <th>On-Time %</th>
                <th>Late %</th>
                <th>Performance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {startups?.map((startup) => {
                const perf = perfByStartup[startup.id]
                const perfStatus = perf
                  ? calculatePerformanceStatus({
                      completionRate: perf.completion_rate,
                      earlyRate: perf.early_rate,
                      overdueCount: perf.overdue_tasks,
                      totalTasks: perf.total_tasks,
                    })
                  : null

                const perfStatusClass = perfStatus
                  ? {
                      AHEAD: 'status-ahead',
                      ON_TRACK: 'status-on-track',
                      BEHIND: 'status-behind',
                      AT_RISK: 'status-at-risk',
                    }[perfStatus]
                  : null

                return (
                  <tr key={startup.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">
                          {startup.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div
                            style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}
                          >
                            {startup.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                            {startup.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${statusColors[startup.status] || 'badge-neutral'}`}>
                        {startup.status}
                      </span>
                    </td>
                    <td>
                      {perf ? (
                        <div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {Math.round(perf.completion_rate)}%
                          </div>
                          <div className="progress-bar" style={{ marginTop: 4, width: 80 }}>
                            <div
                              className="progress-fill progress-fill-brand"
                              style={{ width: `${perf.completion_rate}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--color-success)' }}>
                      {perf ? `${Math.round(perf.early_rate)}%` : '—'}
                    </td>
                    <td style={{ color: 'var(--color-info)' }}>
                      {perf ? `${Math.round(perf.on_time_rate)}%` : '—'}
                    </td>
                    <td style={{ color: 'var(--color-warning)' }}>
                      {perf ? `${Math.round(perf.late_rate)}%` : '—'}
                    </td>
                    <td>
                      {perfStatusClass ? (
                        <span className={`badge ${perfStatusClass}`}>{perfStatus}</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No data</span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/admin/startups/${startup.id}`}
                        className="btn btn-ghost btn-sm"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
