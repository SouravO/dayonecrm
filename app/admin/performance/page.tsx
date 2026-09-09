import { createClient } from '@/lib/supabase/server'
import { PerformanceCharts } from '@/components/charts/PerformanceCharts'
import type { Metadata } from 'next'
import type { WeeklyPerformance } from '@/types'

export const metadata: Metadata = { title: 'Performance Analytics' }

export default async function PerformancePage() {
  const supabase = await createClient()

  // Get all startups
  const { data: startups } = await supabase
    .from('startups')
    .select('id, name')
    .eq('status', 'ACTIVE')

  // Get latest performance per startup (for comparison chart)
  const { data: allPerformances } = await supabase
    .from('weekly_performance')
    .select('*, weekly_plan:weekly_plans(week_start, week_end)')
    .order('created_at', { ascending: false })

  // Build bar chart data (latest perf per startup)
  const latestPerfByStartup: Record<string, WeeklyPerformance> = {}
  for (const p of (allPerformances || []) as WeeklyPerformance[]) {
    if (!latestPerfByStartup[p.startup_id]) latestPerfByStartup[p.startup_id] = p
  }

  const barData = (startups || [])
    .map((s) => {
      const p = latestPerfByStartup[s.id]
      return {
        name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
        completion: p ? Math.round(p.completion_rate) : 0,
        early: p ? Math.round(p.early_rate) : 0,
        onTime: p ? Math.round(p.on_time_rate) : 0,
        late: p ? Math.round(p.late_rate) : 0,
      }
    })
    .sort((a, b) => b.completion - a.completion)

  // Build trend data (average completion per week across all startups)
  const weeklyMap: Record<string, number[]> = {}
  for (const p of allPerformances || []) {
    const wp = p.weekly_plan as { week_start: string } | null
    const weekKey = wp?.week_start
      ? new Date(wp.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : p.created_at?.slice(0, 10)
    if (weekKey) {
      if (!weeklyMap[weekKey]) weeklyMap[weekKey] = []
      weeklyMap[weekKey].push(p.completion_rate)
    }
  }

  const trendData = Object.entries(weeklyMap)
    .map(([week, rates]) => ({
      week,
      completion: Math.round(rates.reduce((a, b) => a + b, 0) / rates.length),
    }))
    .slice(-8)

  // Build task status breakdown across all startups
  const { data: taskCounts } = await supabase
    .from('tasks')
    .select('status, due_date')
  
  const statusCounts = {
    Completed: 0,
    'In Progress': 0,
    Pending: 0,
    Overdue: 0,
  }
  const now = new Date()
  for (const task of taskCounts || []) {
    if (task.status === 'DONE') statusCounts.Completed++
    else if (task.status === 'IN_PROGRESS') statusCounts['In Progress']++
    else if (task.due_date && new Date(task.due_date) < now) statusCounts.Overdue++
    else statusCounts.Pending++
  }

  const statusData = [
    { name: 'Completed', value: statusCounts.Completed, color: '#6366f1' },
    { name: 'In Progress', value: statusCounts['In Progress'], color: '#22c55e' },
    { name: 'Pending', value: statusCounts.Pending, color: '#f59e0b' },
    { name: 'Overdue', value: statusCounts.Overdue, color: '#ef4444' },
  ]

  // Performance table
  const perfStatusClass: Record<string, string> = {
    AHEAD: 'status-ahead',
    ON_TRACK: 'status-on-track',
    BEHIND: 'status-behind',
    AT_RISK: 'status-at-risk',
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance Analytics</h1>
          <p className="page-subtitle">Portfolio-wide performance metrics and trends</p>
        </div>
      </div>

      {/* Charts */}
      <PerformanceCharts barData={barData} trendData={trendData} statusData={statusData} />

      {/* Performance table */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Startup Performance Summary</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Startup</th>
                <th>Completion %</th>
                <th>Early %</th>
                <th>On-Time %</th>
                <th>Late %</th>
                <th>Overdue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(startups || []).length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    No active startups with performance data
                  </td>
                </tr>
              ) : (
                (startups || []).map((startup) => {
                  const p = latestPerfByStartup[startup.id]
                  return (
                    <tr key={startup.id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {startup.name}
                      </td>
                      <td>
                        {p ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                              {Math.round(p.completion_rate)}%
                            </span>
                            <div className="progress-bar" style={{ width: 60 }}>
                              <div
                                className="progress-fill progress-fill-brand"
                                style={{ width: `${p.completion_rate}%` }}
                              />
                            </div>
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ color: 'var(--color-success)' }}>
                        {p ? `${Math.round(p.early_rate)}%` : '—'}
                      </td>
                      <td style={{ color: 'var(--color-info)' }}>
                        {p ? `${Math.round(p.on_time_rate)}%` : '—'}
                      </td>
                      <td style={{ color: 'var(--color-warning)' }}>
                        {p ? `${Math.round(p.late_rate)}%` : '—'}
                      </td>
                      <td style={{ color: p?.overdue_tasks ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                        {p ? p.overdue_tasks : '—'}
                      </td>
                      <td>
                        {p ? (
                          <span className={`badge ${perfStatusClass[p.performance_status] || 'badge-neutral'}`}>
                            {p.performance_status}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No data</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
