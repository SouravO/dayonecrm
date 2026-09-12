import { createClient } from '@/lib/supabase/server'
import { PerformanceCharts } from '@/components/charts/PerformanceCharts'
import { CompanyLogo } from '@/components/brand/CompanyLogo'
import { calculateStartupHealth } from '@/lib/performance/calculateStartupHealth'
import type { Metadata } from 'next'
import type { WeeklyPerformance, Task, Domain } from '@/types'
import Link from 'next/link'
import { MonitorPlay, AlertTriangle, CheckCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Performance Analytics' }

export default async function PerformancePage() {
  const supabase = await createClient()

  // Get all active startups, latest performance, raw tasks, and domains
  const [
    { data: startups },
    { data: allPerformances },
    { data: rawTasks },
    { data: rawDomains },
  ] = await Promise.all([
    supabase
      .from('startups')
      .select('id, name, logo_url')
      .eq('status', 'ACTIVE')
      .order('name', { ascending: true }),
    supabase
      .from('weekly_performance')
      .select('*, weekly_plan:weekly_plans(week_start, week_end)')
      .order('created_at', { ascending: false }),
    supabase.from('tasks').select('*'),
    supabase.from('domains').select('*'),
  ])

  const tasks = (rawTasks as Task[]) || []
  const domains = (rawDomains as Domain[]) || []

  // Build bar chart data (latest perf per startup with live task fallback)
  const latestPerfByStartup: Record<string, WeeklyPerformance> = {}
  for (const p of (allPerformances || []) as WeeklyPerformance[]) {
    if (!latestPerfByStartup[p.startup_id]) latestPerfByStartup[p.startup_id] = p
  }

  // Precompute live health & blockers for all startups
  const startupHealthMap = new Map()
  for (const s of startups || []) {
    const sTasks = tasks.filter((t) => t.startup_id === s.id)
    const sDomains = domains.filter((d) => d.startup_id === s.id)
    const health = calculateStartupHealth(sTasks, sDomains)
    startupHealthMap.set(s.id, health)
  }

  const barData = (startups || [])
    .map((s) => {
      const p = latestPerfByStartup[s.id]
      const h = startupHealthMap.get(s.id)
      const completion = p ? Math.round(p.completion_rate) : h?.completionRate || 0

      return {
        name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
        completion,
        early: p ? Math.round(p.early_rate) : 0,
        onTime: p ? Math.round(p.on_time_rate) : completion,
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
  const statusCounts = {
    Completed: 0,
    'In Progress': 0,
    Pending: 0,
    Overdue: 0,
  }
  const todayStr = new Date().toISOString().split('T')[0]
  for (const task of tasks) {
    if (task.status === 'DONE') statusCounts.Completed++
    else if (task.status === 'IN_PROGRESS') statusCounts['In Progress']++
    else if (task.due_date && task.due_date < todayStr) statusCounts.Overdue++
    else statusCounts.Pending++
  }

  const statusData = [
    { name: 'Completed', value: statusCounts.Completed, color: '#ca2f2b' },
    { name: 'In Progress', value: statusCounts['In Progress'], color: '#10b981' },
    { name: 'Pending', value: statusCounts.Pending, color: '#f59e0b' },
    { name: 'Overdue', value: statusCounts.Overdue, color: '#e11d48' },
  ]

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
          <p className="page-subtitle">Portfolio-wide performance metrics, health scores, and trends</p>
        </div>
        <Link href="/tv" target="_blank" className="btn btn-secondary">
          <MonitorPlay className="w-4 h-4 text-purple-600" />
          <span>Launch TV Wall View</span>
        </Link>
      </div>

      {/* Charts */}
      <PerformanceCharts barData={barData} trendData={trendData} statusData={statusData} />

      {/* Performance table */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Startup Performance & Health Summary</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Startup</th>
                <th>Health Score</th>
                <th>Completion %</th>
                <th>Tasks</th>
                <th>Critical Blockers</th>
                <th>Overdue</th>
                <th>Action</th>
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
                  const health = startupHealthMap.get(startup.id)
                  const completionRate = p ? Math.round(p.completion_rate) : health?.completionRate || 0
                  const hasBlockers = health && health.blockers.length > 0

                  return (
                    <tr key={startup.id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <CompanyLogo logoUrl={startup.logo_url} name={startup.name} size={30} />
                          <Link
                            href={`/admin/startups/${startup.id}`}
                            style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}
                          >
                            {startup.name}
                          </Link>
                        </div>
                      </td>

                      {/* Health Score */}
                      <td>
                        {health ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: 13,
                                color: health.statusBadgeColor,
                                background: `${health.statusBadgeColor}15`,
                                padding: '2px 8px',
                                borderRadius: 6,
                                border: `1px solid ${health.statusBadgeColor}35`,
                              }}
                            >
                              {health.score}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: health.statusBadgeColor }}>
                              {health.status}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Completion Rate */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {completionRate}%
                          </span>
                          <div className="progress-bar" style={{ width: 60 }}>
                            <div
                              className="progress-fill progress-fill-brand"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Tasks breakdown */}
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                        {health ? `${health.doneTasks} / ${health.totalTasks} done` : '—'}
                      </td>

                      {/* Critical Blockers */}
                      <td>
                        {hasBlockers ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#9a3412',
                              background: '#fff7ed',
                              border: '1px solid #fed7aa',
                              padding: '2px 8px',
                              borderRadius: 6,
                            }}
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {health.blockers.length} blocker{health.blockers.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#166534',
                            }}
                          >
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            None
                          </span>
                        )}
                      </td>

                      {/* Overdue */}
                      <td style={{ color: (health?.overdueTasks || 0) > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)', fontWeight: (health?.overdueTasks || 0) > 0 ? 700 : 400 }}>
                        {health ? health.overdueTasks : '—'}
                      </td>

                      {/* TV Action Link */}
                      <td>
                        <Link
                          href={`/tv/${startup.id}`}
                          target="_blank"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: 11.5 }}
                        >
                          <MonitorPlay className="w-3 h-3 text-purple-600" />
                          <span>TV</span>
                        </Link>
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
