'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  Sun,
  Moon,
  Zap,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users2,
  Layers,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Compass,
} from 'lucide-react'
import { Logo } from '@/components/brand/Logo'

interface TvPayload {
  timestamp: string
  startup: {
    id: string
    name: string
    email: string
    status: string
    initial: string
  }
  sprint: {
    id: string | null
    weekStart: string
    weekEnd: string
    goal: string
    daysRemaining: number
    status: 'AHEAD' | 'ON_TRACK' | 'BEHIND' | 'AT_RISK'
  }
  metrics: {
    totalTasks: number
    doneTasks: number
    inProgressTasks: number
    todoTasks: number
    earlyCount: number
    onTimeCount: number
    lateCount: number
    completionRate: number
    operatorsCount: number
    domainsCount: number
  }
  charts: {
    burndown: Array<{ day: string; ideal: number; actual: number | null; completed: number }>
    domains: Array<{ name: string; total: number; done: number; inProgress: number; todo: number; rate: number }>
    quality: Array<{ name: string; value: number; color: string }>
  }
  deliverables: Array<{
    id: string
    title: string
    status: string
    priority: string
    completion_status: string | null
    domainName: string
    assigneeName: string
    dueDate: string | null
  }>
  recentActivity: Array<{ id: string; action: string; time: string }>
}

interface Props {
  initialData: TvPayload
  startupId: string
  initialTheme?: 'dark' | 'cream'
}

export function CompanyTvDisplay({ initialData, startupId, initialTheme = 'dark' }: Props) {
  const [data, setData] = useState<TvPayload>(initialData)
  const [theme, setTheme] = useState<'dark' | 'cream'>(initialTheme)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastSync, setLastSync] = useState<Date>(new Date())
  const [countdown, setCountdown] = useState<number>(20)
  const [clock, setClock] = useState<string>('')
  const [clockDate, setClockDate] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Initialize clock and theme from URL/localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const urlTheme = urlParams.get('theme') as 'dark' | 'cream' | null
      if (urlTheme === 'dark' || urlTheme === 'cream') {
        setTheme(urlTheme)
      } else if (initialTheme) {
        setTheme(initialTheme)
      } else {
        const savedTheme = localStorage.getItem('dayone_tv_theme') as 'dark' | 'cream' | null
        if (savedTheme) setTheme(savedTheme)
      }
    }

    const updateClock = () => {
      const now = new Date()
      setClock(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
      setClockDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      )
    }

    updateClock()
    const clockInterval = setInterval(updateClock, 1000)
    return () => clearInterval(clockInterval)
  }, [])

  // WakeLock: Keep TV screen on without sleeping
  useEffect(() => {
    let wakeLock: any = null

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen')
        } catch (err) {
          // Wake lock request failed or not supported in this browser
        }
      }
    }

    requestWakeLock()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLock) wakeLock.release().catch(() => {})
    }
  }, [])

  // Telemetry Fetch Function
  const fetchTelemetry = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const res = await fetch(`/api/tv/${startupId}`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setLastSync(new Date())
        setCountdown(20)
      }
    } catch (e) {
      console.error('Failed to sync TV telemetry:', e)
    } finally {
      setIsRefreshing(false)
    }
  }, [startupId])

  // 20s Polling Cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchTelemetry()
          return 20
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [fetchTelemetry])

  // Keyboard shortcut: F for fullscreen, T for theme toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') {
        toggleFullscreen()
      } else if (e.key.toLowerCase() === 't') {
        toggleTheme()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, theme])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'cream' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('dayone_tv_theme', nextTheme)
  }

  // Color variables depending on TV display mode
  const isDark = theme === 'dark'
  const colors = isDark
    ? {
        bg: '#0a0908',
        canvasGradient: 'radial-gradient(ellipse at 50% 0%, #171512 0%, #0a0908 75%)',
        cardBg: '#14120f',
        cardBorder: '#27231c',
        cardHighlight: 'rgba(255, 255, 255, 0.04)',
        headerBg: 'rgba(16, 14, 11, 0.95)',
        textPrimary: '#fbf9f4',
        textSecondary: '#a59b8c',
        textMuted: '#6d6559',
        brandRed: '#e63935',
        brandRedDim: 'rgba(230, 57, 53, 0.15)',
        brandRedGlow: 'rgba(230, 57, 53, 0.35)',
        gridLine: '#221f1a',
        chartIdeal: '#6d6559',
        subtleCard: '#181612',
      }
    : {
        bg: '#f6f2db',
        canvasGradient: 'radial-gradient(circle at 50% -10%, #fcfbf5 0%, #f6f2db 100%)',
        cardBg: '#ffffff',
        cardBorder: '#e5dfcb',
        cardHighlight: 'rgba(255, 255, 255, 0.9)',
        headerBg: 'rgba(253, 251, 246, 0.92)',
        textPrimary: '#1e1b18',
        textSecondary: '#5a5348',
        textMuted: '#8c8375',
        brandRed: '#ca2f2b',
        brandRedDim: 'rgba(202, 47, 43, 0.08)',
        brandRedGlow: 'rgba(202, 47, 43, 0.22)',
        gridLine: '#e6decb',
        chartIdeal: '#aba196',
        subtleCard: '#fbf9f1',
      }

  const { startup, sprint, metrics, charts, deliverables, recentActivity } = data

  const statusBadgeConfig = {
    AHEAD: { label: 'AHEAD OF SCHEDULE', bg: '#059669', color: '#ffffff' },
    ON_TRACK: { label: 'ON TRACK', bg: isDark ? '#0284c7' : '#0369a1', color: '#ffffff' },
    BEHIND: { label: 'PACE BEHIND', bg: '#d97706', color: '#ffffff' },
    AT_RISK: { label: 'AT RISK', bg: '#ca2f2b', color: '#ffffff' },
  }[sprint.status]

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg,
        backgroundImage: colors.canvasGradient,
        color: colors.textPrimary,
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* ── 1. TV Executive Header Bar ── */}
      <header
        style={{
          height: 64,
          background: colors.headerBg,
          borderBottom: `1px solid ${colors.cardBorder}`,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          backdropFilter: 'blur(12px)',
          zIndex: 40,
        }}
      >
        {/* Left: Studio Branding + Company Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/tv" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Logo size="icon" />
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.3px', color: colors.textPrimary }}>
                DAY ONE
              </div>
              <div
                className="font-serif-italic"
                style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}
              >
                tv mission control
              </div>
            </div>
          </Link>

          <div style={{ height: 24, width: 1, background: colors.cardBorder }} />

          {/* Company Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #ca2f2b 0%, #9e1f1c 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 14,
                boxShadow: `0 2px 8px ${colors.brandRedGlow}`,
              }}
            >
              {startup.initial}
            </div>

            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.4px', lineHeight: 1.1 }}>
                {startup.name}
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>Dedicated Studio Wall Feed</span>
                <span>•</span>
                <span style={{ color: '#059669', fontWeight: 600 }}>Active Venture</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Live Pulsing Telemetry Radar Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 14px',
            borderRadius: 100,
            background: isDark ? 'rgba(5, 150, 105, 0.12)' : '#ecfdf5',
            border: `1px solid ${isDark ? 'rgba(5, 150, 105, 0.3)' : '#a7f3d0'}`,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.8px',
            color: '#059669',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#059669',
              boxShadow: '0 0 10px #059669',
              display: 'inline-block',
              animation: 'pulse 1.8s infinite',
            }}
          />
          <span>LIVE TELEMETRY STREAM</span>
          <span style={{ opacity: 0.6, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
            ({countdown}s)
          </span>
        </div>

        {/* Right: Wall Clock + TV Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Real-time High-Contrast Wall Clock */}
          <div style={{ textAlign: 'right', minWidth: 130 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.5px',
                color: colors.textPrimary,
                lineHeight: 1,
              }}
            >
              {clock || '--:--:--'}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: colors.textMuted, marginTop: 3 }}>
              {clockDate}
            </div>
          </div>

          <div style={{ height: 24, width: 1, background: colors.cardBorder }} />

          {/* TV Utility Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Manual refresh button */}
            <button
              onClick={fetchTelemetry}
              title="Sync Telemetry"
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
                color: colors.textSecondary,
                padding: '6px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
              }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-500' : ''}`} />
            </button>

            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light Cream' : 'Dark'} Mode (T)`}
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
                color: colors.textSecondary,
                padding: '6px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
              }}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Fullscreen button */}
            <button
              onClick={toggleFullscreen}
              title="Fullscreen Mode (F)"
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
                color: colors.textSecondary,
                padding: '6px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. TV Main Telemetry Canvas ── */}
      <main
        style={{
          flex: 1,
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxWidth: 1920,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* ── Sprint North Star Banner ── */}
        <div
          style={{
            background: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 14,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: `0 2px 10px rgba(0, 0, 0, ${isDark ? '0.3' : '0.04'})`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: colors.brandRedDim,
                border: `1px solid ${isDark ? 'rgba(230, 57, 53, 0.3)' : 'rgba(202, 47, 43, 0.2)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.brandRed,
                flexShrink: 0,
              }}
            >
              <Compass className="w-5 h-5" />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: colors.brandRed,
                  marginBottom: 2,
                }}
              >
                Sprint North Star Objective
              </div>
              <div
                className="font-serif-italic"
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: colors.textPrimary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                &ldquo;{sprint.goal}&rdquo;
              </div>
            </div>
          </div>

          {/* Sprint Details Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: statusBadgeConfig.bg,
                color: statusBadgeConfig.color,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              {statusBadgeConfig.label}
            </div>

            <div
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: colors.subtleCard,
                border: `1px solid ${colors.cardBorder}`,
                fontSize: 12,
                fontWeight: 600,
                color: colors.textSecondary,
              }}
            >
              {sprint.daysRemaining}d Remaining in Sprint
            </div>

            <div
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: colors.subtleCard,
                border: `1px solid ${colors.cardBorder}`,
                fontSize: 12,
                color: colors.textMuted,
              }}
            >
              {sprint.weekStart} → {sprint.weekEnd}
            </div>
          </div>
        </div>

        {/* ── 3. High-Impact Big KPI Ribbon (5 Tiles) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 14,
            flexShrink: 0,
          }}
        >
          {/* Tile 1: Sprint Completion */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: `0 2px 8px rgba(0, 0, 0, ${isDark ? '0.2' : '0.03'})`,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Sprint Completion
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1px', color: colors.brandRed, lineHeight: 1.1, marginTop: 4 }}>
                {metrics.completionRate}%
              </div>
              <div style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 4 }}>
                {metrics.doneTasks} of {metrics.totalTasks} Tasks Done
              </div>
            </div>

            {/* Circular Gauge Ring */}
            <div style={{ position: 'relative', width: 54, height: 54 }}>
              <svg width="54" height="54" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={colors.cardBorder}
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={colors.brandRed}
                  strokeWidth="3.8"
                  strokeDasharray={`${metrics.completionRate}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 800,
                  color: colors.textPrimary,
                }}
              >
                {metrics.completionRate}%
              </div>
            </div>
          </div>

          {/* Tile 2: Active Deliverables */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '16px 18px',
              boxShadow: `0 2px 8px rgba(0, 0, 0, ${isDark ? '0.2' : '0.03'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Active Execution
              </div>
              <Clock className="w-4 h-4 text-sky-500" />
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1px', color: '#0284c7', lineHeight: 1.1, marginTop: 4 }}>
              {metrics.inProgressTasks}
            </div>
            <div style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 4 }}>
              Tasks In Progress Now
            </div>
          </div>

          {/* Tile 3: Early & On-Time Velocity */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '16px 18px',
              boxShadow: `0 2px 8px rgba(0, 0, 0, ${isDark ? '0.2' : '0.03'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Early Deliveries
              </div>
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1px', color: '#059669', lineHeight: 1.1, marginTop: 4 }}>
              {metrics.earlyCount}
            </div>
            <div style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 4 }}>
              +{metrics.onTimeCount} On-Time Completions
            </div>
          </div>

          {/* Tile 4: Domain Coverage */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '16px 18px',
              boxShadow: `0 2px 8px rgba(0, 0, 0, ${isDark ? '0.2' : '0.03'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Domain Pillars
              </div>
              <Layers className="w-4 h-4 text-purple-500" />
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1px', color: '#7c3aed', lineHeight: 1.1, marginTop: 4 }}>
              {metrics.domainsCount}
            </div>
            <div style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 4 }}>
              Functional Areas Active
            </div>
          </div>

          {/* Tile 5: Operators on Deck */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '16px 18px',
              boxShadow: `0 2px 8px rgba(0, 0, 0, ${isDark ? '0.2' : '0.03'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Startup Staff
              </div>
              <Users2 className="w-4 h-4 text-amber-500" />
            </div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-1px', color: '#d97706', lineHeight: 1.1, marginTop: 4 }}>
              {metrics.operatorsCount}
            </div>
            <div style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 4 }}>
              Team Members Operating
            </div>
          </div>
        </div>

        {/* ── 4. Charts Core (Burndown AreaChart + Domain Throughput BarChart) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '62% 38%',
            gap: 16,
            flex: 1,
            minHeight: 290,
          }}
        >
          {/* Chart 1: Sprint Velocity Burndown Trajectory */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 16,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: `0 2px 10px rgba(0, 0, 0, ${isDark ? '0.25' : '0.04'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp className="w-4 h-4 text-red-500" />
                <h3 style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.2px' }}>
                  Weekly Burndown & Execution Trajectory
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 3, background: colors.chartIdeal, borderRadius: 2 }} />
                  <span style={{ color: colors.textMuted }}>Target Pace</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 3, background: colors.brandRed, borderRadius: 2 }} />
                  <span style={{ color: colors.brandRed, fontWeight: 700 }}>Actual Work</span>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 200, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.burndown} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tvRedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.brandRed} stopOpacity={isDark ? 0.35 : 0.25} />
                      <stop offset="95%" stopColor={colors.brandRed} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} />
                  <XAxis dataKey="day" tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={{ stroke: colors.gridLine }} />
                  <YAxis tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={{ stroke: colors.gridLine }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                      borderRadius: 8,
                      color: colors.textPrimary,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="ideal"
                    name="Target Remaining"
                    stroke={colors.chartIdeal}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="transparent"
                  />
                  <Area
                    isAnimationActive={false}
                    connectNulls={true}
                    type="monotone"
                    dataKey="actual"
                    name="Actual Remaining"
                    stroke={colors.brandRed}
                    strokeWidth={3}
                    fill="url(#tvRedGradient)"
                    dot={{ fill: colors.brandRed, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Domain Throughput Bar Chart */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 16,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: `0 2px 10px rgba(0, 0, 0, ${isDark ? '0.25' : '0.04'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers className="w-4 h-4 text-purple-500" />
                <h3 style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.2px' }}>
                  Domain Throughput
                </h3>
              </div>
              <span style={{ fontSize: 11, color: colors.textMuted }}>Task Delivery</span>
            </div>

            <div style={{ flex: 1, minHeight: 200, width: '100%' }}>
              {charts.domains.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: colors.textMuted, fontSize: 13 }}>
                  <Layers className="w-8 h-8 opacity-40 mb-2" />
                  <span>Configure domains to track functional throughput</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.domains} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} />
                    <XAxis dataKey="name" tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={{ stroke: colors.gridLine }} />
                    <YAxis tick={{ fill: colors.textMuted, fontSize: 11 }} axisLine={{ stroke: colors.gridLine }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.cardBorder,
                        borderRadius: 8,
                        color: colors.textPrimary,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: colors.textMuted }} />
                    <Bar isAnimationActive={false} dataKey="done" name="Completed" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar isAnimationActive={false} dataKey="inProgress" name="Active" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar isAnimationActive={false} dataKey="todo" name="Backlog" fill={isDark ? '#3a342c' : '#d5ceb3'} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ── 5. Bottom Row: Live Deliverables Radar + Recent Milestones Feed ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '65% 35%',
            gap: 16,
            minHeight: 180,
            flexShrink: 0,
          }}
        >
          {/* Active Deliverables Radar */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 16,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: `0 2px 10px rgba(0, 0, 0, ${isDark ? '0.2' : '0.03'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity className="w-4 h-4 text-emerald-500" />
                <h3 style={{ fontSize: 13.5, fontWeight: 800 }}>Sprint Deliverables Radar</h3>
              </div>
              <span style={{ fontSize: 11, color: colors.textMuted }}>Showing latest deliverables</span>
            </div>

            {deliverables.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: colors.textMuted, fontSize: 13 }}>
                No deliverables registered for current weekly sprint
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                  overflowY: 'auto',
                  maxHeight: 140,
                }}
              >
                {deliverables.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      padding: '8px 12px',
                      background: colors.subtleCard,
                      border: `1px solid ${colors.cardBorder}`,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: colors.textPrimary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {task.title}
                      </div>
                      <div style={{ fontSize: 10.5, color: colors.textMuted, marginTop: 1, display: 'flex', gap: 6 }}>
                        <span style={{ color: colors.brandRed, fontWeight: 600 }}>{task.domainName}</span>
                        <span>•</span>
                        <span>{task.assigneeName}</span>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          task.status === 'DONE'
                            ? '#ecfdf5'
                            : task.status === 'IN_PROGRESS'
                            ? '#f0f9ff'
                            : isDark
                            ? '#27231c'
                            : '#f4efd5',
                        color:
                          task.status === 'DONE'
                            ? '#065f46'
                            : task.status === 'IN_PROGRESS'
                            ? '#0369a1'
                            : colors.textSecondary,
                        flexShrink: 0,
                      }}
                    >
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quality Donut / Live Feed */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 16,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: `0 2px 10px rgba(0, 0, 0, ${isDark ? '0.2' : '0.03'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target className="w-4 h-4 text-sky-500" />
                <h3 style={{ fontSize: 13.5, fontWeight: 800 }}>Delivery Quality Mix</h3>
              </div>
              <span style={{ fontSize: 11, color: colors.textMuted }}>Speed & Accuracy</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
              {/* Pie Chart */}
              <div style={{ width: 110, height: 110, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      isAnimationActive={false}
                      data={charts.quality}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {charts.quality.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Quality Legend */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {charts.quality.map((item) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                      <span style={{ color: colors.textSecondary }}>{item.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: colors.textPrimary }}>{item.value} tasks</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 6. Bottom News & Milestones Ticker ── */}
        <div
          style={{
            background: isDark ? '#0d0c0a' : '#ede7d3',
            borderRadius: 10,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 12,
            color: colors.textSecondary,
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: colors.brandRed,
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>STUDIO DISPATCH</span>
          </div>

          <div style={{ height: 14, width: 1, background: colors.cardBorder, flexShrink: 0 }} />

          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>
            {recentActivity.length > 0 ? (
              <span>
                Recent: {recentActivity[0].action.replace(/_/g, ' ')} • Recorded on Day One Platform
              </span>
            ) : (
              <span>
                Live sprint cadence monitoring active for {startup.name} • All domain operations connected
              </span>
            )}
          </div>

          <div style={{ fontSize: 10.5, color: colors.textMuted, flexShrink: 0 }}>
            Sync interval: 20s
          </div>
        </div>
      </main>
    </div>
  )
}
