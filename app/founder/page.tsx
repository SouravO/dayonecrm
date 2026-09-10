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
} from 'lucide-react'

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

  const startupName = startup ? (startup.name as string) : 'My Startup'

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto' }}>
      {/* ── Top Executive Header ── */}
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: 'var(--color-text-muted)',
              marginBottom: 6,
            }}
          >
            <span>Venture Studio</span>
            <span>/</span>
            <span style={{ color: 'var(--color-text-primary)' }}>{startupName}</span>
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

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
