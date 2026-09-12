import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { CompanyLogo } from '@/components/brand/CompanyLogo'
import { calculateStartupHealth, StartupHealthSummary } from '@/lib/performance/calculateStartupHealth'
import type { Task, Domain } from '@/types'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  MonitorPlay,
  Users2,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'

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

interface StartupHealthCardData {
  id: string
  name: string
  logo_url: string | null
  created_at: string
  health: StartupHealthSummary
  teamCount: number
}

async function getPortfolioHealth(): Promise<{
  cards: StartupHealthCardData[]
  avgHealth: number
  atRiskCount: number
  totalBlockers: number
}> {
  const supabase = await createClient()

  const [
    { data: startups },
    { data: tasks },
    { data: domains },
    { data: members },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from('startups')
      .select('id, name, status, created_at, logo_url')
      .eq('status', 'ACTIVE')
      .order('name', { ascending: true }),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('domains').select('*'),
    supabase.from('startup_members').select('startup_id, user_id, role'),
    supabase.from('profiles').select('id, full_name'),
  ])

  const profileMap = new Map((profiles || []).map((p) => [p.id, p.full_name]))
  const allTasks = (tasks as Task[]) || []
  const allDomains = (domains as Domain[]) || []

  const cards: StartupHealthCardData[] = (startups || []).map((s) => {
    const sTasks = allTasks.filter((t) => t.startup_id === s.id)
    const sDomains = allDomains.filter((d) => d.startup_id === s.id)
    const sMembers = (members || []).filter((m) => m.startup_id === s.id)

    const health = calculateStartupHealth(sTasks, sDomains, profileMap)

    return {
      id: s.id,
      name: s.name,
      logo_url: s.logo_url,
      created_at: s.created_at,
      health,
      teamCount: sMembers.length,
    }
  })

  // Sort: At Risk / Attention first so admin sees lagging startups immediately
  cards.sort((a, b) => a.health.score - b.health.score)

  const avgHealth =
    cards.length > 0
      ? Math.round(cards.reduce((sum, c) => sum + c.health.score, 0) / cards.length)
      : 0
  const atRiskCount = cards.filter((c) => c.health.status === 'At Risk' || c.health.status === 'Attention').length
  const totalBlockers = cards.reduce((sum, c) => sum + c.health.blockers.length, 0)

  return { cards, avgHealth, atRiskCount, totalBlockers }
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
  const [stats, activity, startups, portfolioHealth] = await Promise.all([
    getAdminStats(),
    getRecentActivity(),
    getStartupsOverview(),
    getPortfolioHealth(),
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

      {/* ── Portfolio Health & Startup Diagnostics ── */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Portfolio Health & Performance Command
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              Live execution score, delivery velocity, and critical blockers across all ventures
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 100,
                background: '#ffffff',
                border: '1px solid #e5dfcb',
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Studio Avg Health:</span>
              <strong style={{ color: 'var(--color-text-primary)', fontSize: 14 }}>
                {portfolioHealth.avgHealth}/100
              </strong>
            </div>

            {portfolioHealth.atRiskCount > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 100,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {portfolioHealth.atRiskCount} {portfolioHealth.atRiskCount === 1 ? 'Startup' : 'Startups'} Need Support
              </span>
            )}

            <Link href="/admin/performance" className="btn btn-secondary btn-sm">
              Full Analytics →
            </Link>
          </div>
        </div>

        {/* Startup Health Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 16,
          }}
        >
          {portfolioHealth.cards.map((c) => {
            const hasBlockers = c.health.blockers.length > 0

            return (
              <div
                key={c.id}
                className="card"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  borderColor:
                    c.health.status === 'At Risk'
                      ? '#fca5a5'
                      : c.health.status === 'Attention'
                      ? '#fcd34d'
                      : 'var(--color-border)',
                  background:
                    c.health.status === 'At Risk'
                      ? 'linear-gradient(to bottom, #ffffff, #fffdfd)'
                      : '#ffffff',
                }}
              >
                {/* Header: Logo, Name, and Health Score Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <CompanyLogo logoUrl={c.logo_url} name={c.name} size={40} />
                    <div style={{ minWidth: 0 }}>
                      <Link
                        href={`/admin/startups/${c.id}`}
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--color-text-primary)',
                          textDecoration: 'none',
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.name}
                      </Link>
                      <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>
                        {c.teamCount} team member{c.teamCount === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>

                  {/* Health Score Pill */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 9px',
                        borderRadius: 8,
                        background: `${c.health.statusBadgeColor}15`,
                        border: `1px solid ${c.health.statusBadgeColor}35`,
                        color: c.health.statusBadgeColor,
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      <span>{c.health.score}</span>
                      <span style={{ fontSize: 9.5, opacity: 0.8, textTransform: 'uppercase' }}>/100</span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: c.health.statusBadgeColor,
                        marginTop: 2,
                      }}
                    >
                      {c.health.status}
                    </span>
                  </div>
                </div>

                {/* Completion Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                      Sprint Delivery
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {c.health.completionRate}% ({c.health.doneTasks}/{c.health.totalTasks} tasks)
                    </span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div
                      className="progress-fill progress-fill-brand"
                      style={{ width: `${c.health.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Critical Blockers Status */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: hasBlockers ? '#fff7ed' : '#f0fdf4',
                    border: `1px solid ${hasBlockers ? '#fed7aa' : '#bbf7d0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {hasBlockers ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    )}
                    <span style={{ fontWeight: 600, color: hasBlockers ? '#9a3412' : '#166534' }}>
                      {hasBlockers
                        ? `${c.health.blockers.length} active blocker${c.health.blockers.length > 1 ? 's' : ''}`
                        : 'Pacing healthy • No blockers'}
                    </span>
                  </div>

                  {c.health.overdueTasks > 0 && (
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: '#b91c1c',
                        background: '#fef2f2',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {c.health.overdueTasks} overdue
                    </span>
                  )}
                </div>

                {/* Bottom Actions: TV Wall Link + Details Link */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 6 }}>
                  <Link
                    href={`/tv/${c.id}`}
                    target="_blank"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 11.5 }}
                  >
                    <MonitorPlay className="w-3 h-3 text-purple-600" />
                    <span>TV Display</span>
                  </Link>
                  <Link
                    href={`/admin/startups/${c.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 11.5 }}
                  >
                    <span>Venture Hub</span>
                    <ArrowRight className="w-3 h-3 text-gray-500" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
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
