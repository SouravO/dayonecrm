import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  Users2,
  Layers,
  TrendingUp,
  Plus,
  CalendarPlus,
  CalendarRange,
  Compass,
  Zap,
  Target,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  UserPlus,
  ListTodo,
  Sparkles,
  MonitorPlay,
  ShieldAlert,
  Activity,
  AlertCircle,
  Clock4,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  Award,
  BarChart3,
} from 'lucide-react'
import { CompanyLogo } from '@/components/brand/CompanyLogo'
import { FounderLogoManager } from '@/components/brand/FounderLogoManager'
import { calculateStartupHealth } from '@/lib/performance/calculateStartupHealth'
import { calculateTeamPerformance } from '@/lib/performance/calculateMemberPerformance'
import type { Task, Domain } from '@/types'

export const metadata: Metadata = { title: 'Founder Command Center — Day One' }

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
  const startupName = (startup?.name as string) || 'My Startup'
  const startupLogoUrl = (startup?.logo_url as string) || null

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

  // Get full tasks, domains, and startup members in parallel
  const [
    { data: rawTasks },
    { data: rawDomains },
    { data: rawMembers },
  ] = await Promise.all([
    startupId
      ? supabase
          .from('tasks')
          .select('*')
          .eq('startup_id', startupId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    startupId
      ? supabase
          .from('domains')
          .select('*')
          .eq('startup_id', startupId)
          .order('name', { ascending: true })
      : Promise.resolve({ data: [] }),
    startupId
      ? supabase
          .from('startup_members')
          .select('user_id, role, profile:profiles(id, full_name, email)')
          .eq('startup_id', startupId)
      : Promise.resolve({ data: [] }),
  ])

  const allTasks = (rawTasks as Task[]) || []
  const domains = (rawDomains as Domain[]) || []
  const members = (rawMembers as any[]) || []

  // Build profile name lookup map
  const profileMap = new Map<string, string>()
  members.forEach((m) => {
    if (m.profile?.id && m.profile?.full_name) {
      profileMap.set(m.profile.id, m.profile.full_name)
    }
  })

  // Calculate Health & Critical Blockers
  const health = calculateStartupHealth(allTasks, domains, profileMap)

  // Calculate Team / Contributor Performance
  const teamPerf = calculateTeamPerformance(allTasks, members)

  const taskStats = {
    total: allTasks.length,
    done: allTasks.filter((t) => t.status === 'DONE').length,
    inProgress: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
    todo: allTasks.filter((t) => t.status === 'TODO').length,
    early: allTasks.filter((t) => t.completion_status === 'EARLY').length,
    onTime: allTasks.filter((t) => t.completion_status === 'ON_TIME').length,
    late: allTasks.filter((t) => t.completion_status === 'LATE').length,
  }

  const staffCount = members.filter((m) => m.role === 'STAFF').length
  const domainCount = domains.length

  const completionRate =
    taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto' }}>
      {/* ── Top Executive Header with Company Logo ── */}
      <div className="page-header" style={{ marginBottom: 28, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {startupId ? (
            <FounderLogoManager
              startupId={startupId}
              startupName={startupName}
              currentLogoUrl={startupLogoUrl}
              size={54}
              variant="avatar"
            />
          ) : (
            <CompanyLogo logoUrl={startupLogoUrl} name={startupName} size={54} />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-neutral" style={{ fontSize: 11, letterSpacing: '0.3px' }}>
                Day One Studio
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '2px 8px',
                  borderRadius: 100,
                  fontSize: 10,
                  fontWeight: 600,
                  background: '#ecfdf5',
                  color: '#065f46',
                  border: '1px solid #a7f3d0',
                  marginLeft: 4,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#059669',
                  }}
                />
                Active Portfolio Venture
              </span>
            </div>

            <h1 className="page-title" style={{ fontSize: 28, letterSpacing: '-0.6px' }}>
              {startupName} Command Center
            </h1>
            <p className="page-subtitle" style={{ fontSize: 13.5 }}>
              Real-time execution tracking, domain alignment, and weekly sprint metrics.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {startupId && (
            <>
              <FounderLogoManager
                startupId={startupId}
                startupName={startupName}
                currentLogoUrl={startupLogoUrl}
                variant="button"
              />
              <Link
                href={`/tv/${startupId}`}
                target="_blank"
                className="btn btn-secondary btn-sm"
                title="Launch dedicated TV mission control screen for wall display"
              >
                <MonitorPlay className="w-3.5 h-3.5 text-purple-600" />
                <span>TV Display</span>
              </Link>
            </>
          )}
          <Link href="/founder/tasks" className="btn btn-secondary btn-sm">
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </Link>
          <Link href="/founder/weekly-plan" className="btn btn-primary btn-sm">
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>+ New Weekly Plan</span>
          </Link>
        </div>
      </div>

      {/* ── 6-Metric Balanced Executive Row ── */}
      <div className="grid-stats" style={{ marginBottom: 28 }}>
        {[
          {
            label: 'Total Tasks',
            value: taskStats.total,
            icon: <CheckSquare className="w-4 h-4 text-[#ca2f2b]" />,
            iconBg: 'rgba(202, 47, 43, 0.08)',
            iconBorder: 'rgba(202, 47, 43, 0.16)',
            subtext: `${taskStats.todo} pending`,
          },
          {
            label: 'Completed',
            value: taskStats.done,
            icon: <CheckCircle2 className="w-4 h-4 text-[#059669]" />,
            iconBg: 'rgba(5, 150, 105, 0.08)',
            iconBorder: 'rgba(5, 150, 105, 0.16)',
            subtext: `${taskStats.early} early`,
          },
          {
            label: 'In Progress',
            value: taskStats.inProgress,
            icon: <Clock className="w-4 h-4 text-[#0284c7]" />,
            iconBg: 'rgba(2, 132, 199, 0.08)',
            iconBorder: 'rgba(2, 132, 199, 0.16)',
            subtext: 'Active',
          },
          {
            label: 'Completion',
            value: `${completionRate}%`,
            icon: <TrendingUp className="w-4 h-4 text-[#ca2f2b]" />,
            iconBg: 'rgba(202, 47, 43, 0.08)',
            iconBorder: 'rgba(202, 47, 43, 0.16)',
            subtext: 'Rate',
            isProgress: true,
          },
          {
            label: 'Operators',
            value: staffCount || 0,
            icon: <Users2 className="w-4 h-4 text-[#d97706]" />,
            iconBg: 'rgba(217, 119, 6, 0.08)',
            iconBorder: 'rgba(217, 119, 6, 0.16)',
            subtext: 'Staff',
          },
          {
            label: 'Domains',
            value: domainCount || 0,
            icon: <Layers className="w-4 h-4 text-[#7c3aed]" />,
            iconBg: 'rgba(124, 58, 237, 0.08)',
            iconBorder: 'rgba(124, 58, 237, 0.16)',
            subtext: 'Areas',
          },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: stat.iconBg,
                  border: `1px solid ${stat.iconBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {stat.icon}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                {stat.subtext}
              </span>
            </div>

            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.5px',
                lineHeight: 1.1,
                marginBottom: 4,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
              }}
            >
              {stat.label}
            </div>

            {stat.isProgress && (
              <div style={{ marginTop: 8 }}>
                <div className="progress-bar" style={{ height: 4 }}>
                  <div
                    className="progress-fill progress-fill-brand"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Executive Health & Critical Blockers Diagnostic Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 20,
          marginBottom: 28,
        }}
      >
        {/* Card 1: Venture Health & Pacing Index */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 16,
              borderBottom: '1px solid #ede7d3',
              marginBottom: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(202, 47, 43, 0.08)',
                  border: '1px solid rgba(202, 47, 43, 0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-brand)',
                }}
              >
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Venture Health Score
                </h2>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Live Execution Index
                </div>
              </div>
            </div>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px',
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 700,
                color: health.statusBadgeColor,
                background: `${health.statusBadgeColor}15`,
                border: `1px solid ${health.statusBadgeColor}35`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: health.statusBadgeColor,
                }}
              />
              {health.status}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
            {/* Big Health Number Gauge */}
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: `radial-gradient(circle, #ffffff 58%, ${health.statusBadgeColor}15 100%)`,
                border: `3px solid ${health.statusBadgeColor}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 4px 14px ${health.statusBadgeColor}20`,
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: health.statusBadgeColor,
                  lineHeight: 1,
                  letterSpacing: '-1px',
                }}
              >
                {health.score}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginTop: 3,
                }}
              >
                Score / 100
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                {health.score >= 80
                  ? 'Strong velocity and deliverable cadence. Team is meeting milestone targets with minimal impediment.'
                  : health.score >= 60
                  ? 'Operational pace is stable. Maintain vigilance on pending deliverables approaching target due dates.'
                  : 'Execution lag detected. Immediate intervention required on overdue deliverables and blocked items.'}
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Overdue: <strong style={{ color: health.overdueTasks > 0 ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>{health.overdueTasks}</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  In Flight: <strong style={{ color: 'var(--color-info)' }}>{health.inProgressTasks}</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Completion: <strong style={{ color: 'var(--color-success)' }}>{health.completionRate}%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-scores breakdown bars */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 14, borderTop: '1px solid #ede7d3' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Velocity Index</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{health.velocityScore} / 45</span>
              </div>
              <div className="progress-bar" style={{ height: 4 }}>
                <div className="progress-fill progress-fill-brand" style={{ width: `${(health.velocityScore / 45) * 100}%` }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Active Momentum</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{health.momentumScore} / 35</span>
              </div>
              <div className="progress-bar" style={{ height: 4 }}>
                <div className="progress-fill" style={{ width: `${(health.momentumScore / 35) * 100}%`, background: 'var(--color-info)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Blocker Hygiene</span>
                <span style={{ fontWeight: 600, color: health.blockerScore >= 15 ? 'var(--color-success)' : 'var(--color-danger)' }}>{health.blockerScore} / 20</span>
              </div>
              <div className="progress-bar" style={{ height: 4 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${(health.blockerScore / 20) * 100}%`,
                    background: health.blockerScore >= 15 ? 'var(--color-success)' : 'var(--color-danger)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Critical Blockers & Lagging Areas */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 16,
              borderBottom: '1px solid #ede7d3',
              marginBottom: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: health.blockers.length > 0 ? 'rgba(202, 47, 43, 0.08)' : 'rgba(5, 150, 105, 0.08)',
                  border: `1px solid ${health.blockers.length > 0 ? 'rgba(202, 47, 43, 0.16)' : 'rgba(5, 150, 105, 0.16)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: health.blockers.length > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                }}
              >
                {health.blockers.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Critical Blockers & Lag
                </h2>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Where & Which Work is Stalled
                </div>
              </div>
            </div>

            <span
              className={`badge ${health.blockers.length > 0 ? 'badge-danger' : 'badge-success'}`}
              style={{ fontSize: 11 }}
            >
              {health.blockers.length} {health.blockers.length === 1 ? 'Blocker' : 'Blockers'}
            </span>
          </div>

          {health.blockers.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 16px',
                textAlign: 'center',
                background: '#fcfbfa',
                border: '1px dashed #e2dbbe',
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <CheckCircle className="w-6 h-6" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                Zero Blockers Detected
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', maxWidth: 280, margin: 0 }}>
                All deliverables are tracking within their planned timelines with no overdue items.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {health.blockers.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: b.urgency === 'CRITICAL' ? '#fff5f5' : '#fffbeb',
                    border: `1px solid ${b.urgency === 'CRITICAL' ? '#fecaca' : '#fde68a'}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4,
                          letterSpacing: '0.4px',
                          background: b.urgency === 'CRITICAL' ? '#ca2f2b' : '#d97706',
                          color: '#ffffff',
                        }}
                      >
                        {b.urgency}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                        {b.domainName}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        • {b.assigneeName}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        marginBottom: 3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {b.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: b.urgency === 'CRITICAL' ? '#991b1b' : '#92400e', fontWeight: 500 }}>
                      ⚠️ {b.lagReason}
                    </div>
                  </div>

                  <Link
                    href="/founder/tasks"
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: 'var(--color-brand)',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: '#ffffff',
                      border: '1px solid #e5dfcb',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <span>Resolve</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}

              {health.blockers.length > 4 && (
                <div style={{ textAlign: 'center', paddingTop: 4 }}>
                  <Link
                    href="/founder/tasks"
                    style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-brand)', textDecoration: 'none' }}
                  >
                    +{health.blockers.length - 4} more blocked tasks → View all in Tasks
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Lagging Domains Pill Summary */}
          {health.domains.some((d) => d.isLagging) && (
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #ede7d3' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Lagging Operational Pillars:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {health.domains
                  .filter((d) => d.isLagging)
                  .map((ld) => (
                    <span
                      key={ld.id}
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <AlertOctagon className="w-3 h-3" />
                      {ld.name}: {ld.lagReason}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main 2-Column Workspaces ── */}
      <div className="grid-2">
        {/* ── Column 1: Current Weekly Sprint ── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 16,
              borderBottom: '1px solid #ede7d3',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(202, 47, 43, 0.08)',
                  border: '1px solid rgba(202, 47, 43, 0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-brand)',
                }}
              >
                <CalendarRange className="w-4 h-4" />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Current Sprint Cadence
                </h2>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Weekly Studio Execution
                </div>
              </div>
            </div>

            <Link
              href="/founder/weekly-plan"
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--color-brand)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Manage Plan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {currentPlan ? (
            <div style={{ flex: 1 }}>
              {/* Active Plan Date Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span className="badge badge-brand">
                  Active Sprint
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  {new Date(currentPlan.week_start + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  —{' '}
                  {new Date(currentPlan.week_end + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {/* Goal Quote Block */}
              {currentPlan.goal ? (
                <div
                  style={{
                    padding: '16px 18px',
                    background: '#fdfcf7',
                    border: '1px solid #e5dfcb',
                    borderRadius: 12,
                    marginBottom: 20,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      color: 'var(--color-brand)',
                      marginBottom: 6,
                    }}
                  >
                    Sprint Objective
                  </div>
                  <div
                    className="font-serif-italic"
                    style={{
                      fontSize: 15,
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.6,
                    }}
                  >
                    &ldquo;{currentPlan.goal}&rdquo;
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '14px 16px',
                    background: '#fdfcf7',
                    border: '1px dashed #e2dbbe',
                    borderRadius: 10,
                    fontSize: 13,
                    color: 'var(--color-text-muted)',
                    marginBottom: 20,
                  }}
                >
                  No specific sprint objective written yet.{' '}
                  <Link href="/founder/weekly-plan" style={{ color: 'var(--color-brand)' }}>
                    Add goal →
                  </Link>
                </div>
              )}

              {/* Task Breakdown Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)' }}>
                  Delivery Progress ({taskStats.done}/{taskStats.total} Tasks)
                </div>

                {[
                  { label: 'Completed Deliverables', value: taskStats.done, total: taskStats.total, color: 'var(--color-success)', badge: 'badge-success' },
                  { label: 'In Progress (Active Work)', value: taskStats.inProgress, total: taskStats.total, color: 'var(--color-info)', badge: 'badge-info' },
                  { label: 'Pending in Backlog', value: taskStats.todo, total: taskStats.total, color: 'var(--color-warning)', badge: 'badge-warning' },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        {item.label}
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {item.value} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>/ {item.total}</span>
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
            </div>
          ) : (
            /* Studio Empty State (Inspiring & Actionable) */
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '36px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(202, 47, 43, 0.12) 0%, rgba(202, 47, 43, 0.04) 100%)',
                  border: '1px solid rgba(202, 47, 43, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-brand)',
                  marginBottom: 16,
                }}
              >
                <Compass className="w-6 h-6" />
              </div>

              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  marginBottom: 6,
                }}
              >
                No Active Sprint Initialized
              </h3>
              <p
                style={{
                  fontSize: 13.5,
                  color: 'var(--color-text-secondary)',
                  maxWidth: 360,
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                Day One startups operate on strict weekly execution cycles. Create this week&apos;s plan to align all domains on target milestones.
              </p>

              <Link href="/founder/weekly-plan" className="btn btn-primary btn-sm" style={{ marginBottom: 28 }}>
                <Plus className="w-4 h-4" />
                <span>Initialize Sprint Plan</span>
              </Link>

              {/* 3-Step Execution Pipeline */}
              <div
                style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 8,
                  padding: '12px 14px',
                  background: '#fcfbfa',
                  border: '1px solid #e5dfcb',
                  borderRadius: 12,
                  textAlign: 'left',
                }}
              >
                <div style={{ borderRight: '1px solid #e5dfcb', paddingRight: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-brand)' }}>STEP 01</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>Define Goal</div>
                </div>
                <div style={{ borderRight: '1px solid #e5dfcb', paddingRight: 8, paddingLeft: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-brand)' }}>STEP 02</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>Assign Domains</div>
                </div>
                <div style={{ paddingLeft: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-brand)' }}>STEP 03</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>Track Cadence</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Column 2: Velocity & Domain Operations ── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 16,
              borderBottom: '1px solid #ede7d3',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(5, 150, 105, 0.08)',
                  border: '1px solid rgba(5, 150, 105, 0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-success)',
                }}
              >
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Velocity & Quick Actions
                </h2>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Execution Quality & Operations
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                background: '#f8f6ed',
                padding: '3px 8px',
                borderRadius: 6,
                border: '1px solid #e2dbbe',
              }}
            >
              Sprint Cadence
            </span>
          </div>

          {/* Delivery Velocity Breakdown */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)', marginBottom: 12 }}>
              Delivery Velocity Breakdown
            </div>

            {taskStats.done === 0 ? (
              <div
                style={{
                  padding: '16px',
                  background: '#fcfbfa',
                  border: '1px dashed #e2dbbe',
                  borderRadius: 10,
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--color-text-muted)',
                }}
              >
                Tasks marked DONE will compute early, on-time, and late velocity.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  {
                    label: 'Early Delivery',
                    value: taskStats.early,
                    desc: 'Completed ahead of due date',
                    icon: <Zap className="w-3.5 h-3.5 text-[#059669]" />,
                    badgeClass: 'badge-success',
                    pct: Math.round((taskStats.early / taskStats.done) * 100),
                  },
                  {
                    label: 'On-Time Delivery',
                    value: taskStats.onTime,
                    desc: 'Delivered precisely on schedule',
                    icon: <Target className="w-3.5 h-3.5 text-[#0284c7]" />,
                    badgeClass: 'badge-info',
                    pct: Math.round((taskStats.onTime / taskStats.done) * 100),
                  },
                  {
                    label: 'Late Deliveries',
                    value: taskStats.late,
                    desc: 'Completed after targeted date',
                    icon: <AlertTriangle className="w-3.5 h-3.5 text-[#ca2f2b]" />,
                    badgeClass: 'badge-danger',
                    pct: Math.round((taskStats.late / taskStats.done) * 100),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      background: '#ffffff',
                      border: '1px solid #e5dfcb',
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: '#fbf9f1',
                        border: '1px solid #e5dfcb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {item.label}
                        </span>
                        <span className={`badge ${item.badgeClass}`}>
                          {item.value} tasks ({item.pct}%)
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Studio Quick Actions Roster */}
          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)', marginBottom: 10 }}>
              Startup Management Actions
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                {
                  href: '/founder/tasks',
                  title: 'Create Domain Task',
                  desc: 'Assign deliverable to Dev, Growth, or Ops',
                  icon: <CheckSquare className="w-4 h-4 text-[#ca2f2b]" />,
                  iconBg: 'rgba(202, 47, 43, 0.08)',
                },
                {
                  href: '/founder/staff',
                  title: 'Manage Operators',
                  desc: 'Invite startup team members and assign roles',
                  icon: <UserPlus className="w-4 h-4 text-[#059669]" />,
                  iconBg: 'rgba(5, 150, 105, 0.08)',
                },
                {
                  href: '/founder/domains',
                  title: 'Configure Domains',
                  desc: 'Structure functional operational pillars',
                  icon: <Layers className="w-4 h-4 text-[#d97706]" />,
                  iconBg: 'rgba(217, 119, 6, 0.08)',
                },
              ].map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: '#fcfbfa',
                    border: '1px solid #e5dfcb',
                    borderRadius: 10,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  className="quick-action-row"
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: action.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {action.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {action.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>
                      {action.desc}
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#8c8375] action-arrow" />
                </Link>
              ))}
              {startupId && (
                <FounderLogoManager
                  startupId={startupId}
                  startupName={startupName}
                  currentLogoUrl={startupLogoUrl}
                  variant="quick-action"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Team & Contributor Performance Table ── */}
      <div className="card" style={{ marginTop: 28 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 16,
            borderBottom: '1px solid #ede7d3',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(202, 47, 43, 0.08)',
                border: '1px solid rgba(202, 47, 43, 0.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-brand)',
              }}
            >
              <Users2 className="w-4 h-4" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Team Performance & Contributor Intelligence
              </h2>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Individual delivery rates, completion velocity, and active workload distribution
              </div>
            </div>
          </div>

          <Link
            href="/founder/staff"
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--color-brand)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>Manage Team ({members.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {teamPerf.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 13,
            }}
          >
            No team members added yet. Invite staff from the{' '}
            <Link href="/founder/staff" style={{ color: 'var(--color-brand)' }}>
              Staff Management page
            </Link>
            .
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ede7d3', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Operator
                  </th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Role
                  </th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Tasks (Done / Active)
                  </th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px', minWidth: 140 }}>
                    Completion Rate
                  </th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Delivery Timeliness
                  </th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Overdue
                  </th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Score & Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamPerf.map((m) => {
                  const statusColors = {
                    EXCELLING: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
                    ON_TRACK: { bg: '#f0f9ff', text: '#075985', border: '#bae6fd' },
                    NEEDS_SUPPORT: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
                    LAGGING: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
                  }
                  const badgeStyle = statusColors[m.status] || statusColors.ON_TRACK

                  return (
                    <tr
                      key={m.userId}
                      style={{
                        borderBottom: '1px solid #f2ede0',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Operator Name & Avatar */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'var(--color-brand)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 12,
                              flexShrink: 0,
                            }}
                          >
                            {m.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              {m.fullName}
                            </div>
                            {m.email && (
                              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                {m.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '12px' }}>
                        <span className={`badge ${m.role === 'FOUNDER' ? 'badge-brand' : 'badge-neutral'}`}>
                          {m.role || 'STAFF'}
                        </span>
                      </td>

                      {/* Tasks breakdown */}
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {m.completedTasks}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)' }}> / {m.totalTasks}</span>
                        {m.inProgressTasks > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--color-info)', marginLeft: 6 }}>
                            ({m.inProgressTasks} active)
                          </span>
                        )}
                      </td>

                      {/* Completion Bar */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ height: 6, flex: 1, minWidth: 60 }}>
                            <div
                              className="progress-fill progress-fill-brand"
                              style={{ width: `${m.completionRate}%` }}
                            />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', width: 34 }}>
                            {m.completionRate}%
                          </span>
                        </div>
                      </td>

                      {/* Timeliness Split */}
                      <td style={{ padding: '12px' }}>
                        {m.completedTasks === 0 ? (
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>—</span>
                        ) : (
                          <div style={{ display: 'flex', gap: 4 }}>
                            {m.earlyCount > 0 && (
                              <span style={{ fontSize: 10.5, padding: '1px 6px', borderRadius: 4, background: '#ecfdf5', color: '#065f46', fontWeight: 600 }}>
                                {m.earlyCount} early
                              </span>
                            )}
                            {m.onTimeCount > 0 && (
                              <span style={{ fontSize: 10.5, padding: '1px 6px', borderRadius: 4, background: '#f0f9ff', color: '#0369a1', fontWeight: 600 }}>
                                {m.onTimeCount} on-time
                              </span>
                            )}
                            {m.lateCount > 0 && (
                              <span style={{ fontSize: 10.5, padding: '1px 6px', borderRadius: 4, background: '#fff1f2', color: '#be123c', fontWeight: 600 }}>
                                {m.lateCount} late
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Overdue Count */}
                      <td style={{ padding: '12px' }}>
                        {m.overdueCount > 0 ? (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#991b1b',
                              background: '#fef2f2',
                              padding: '2px 8px',
                              borderRadius: 4,
                              border: '1px solid #fecaca',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <AlertCircle className="w-3 h-3" />
                            {m.overdueCount} overdue
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 500 }}>
                            0
                          </span>
                        )}
                      </td>

                      {/* Score & Status */}
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                            {m.performanceScore}
                          </span>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: 6,
                              background: badgeStyle.bg,
                              color: badgeStyle.text,
                              border: `1px solid ${badgeStyle.border}`,
                              letterSpacing: '0.3px',
                            }}
                          >
                            {m.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
