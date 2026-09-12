'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Copy,
  Check,
  Search,
  ExternalLink,
  Sliders,
  Sparkles,
  LayoutGrid,
} from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { CompanyLogo } from '@/components/brand/CompanyLogo'
import type { TvPayload } from '@/lib/tv/telemetry'
import { createClient } from '@/lib/supabase/client'

export interface StartupOption {
  id: string
  name: string
  email?: string
  status: string
  slug: string
  planGoal?: string | null
  tasksCount?: number
  domainsCount?: number
  logo_url?: string | null
  sector?: string
  stage?: 'MVP' | 'GTM' | 'Growth'
}

interface Props {
  initialData: TvPayload
  startupId: string
  initialTheme?: 'cream'
  allStartups?: StartupOption[]
}

export function CompanyTvDisplay({
  initialData,
  startupId,
  allStartups = [],
}: Props) {
  const [data, setData] = useState<TvPayload>(initialData)
  const [currentStartupId, setCurrentStartupId] = useState<string>(startupId || initialData.startup.id)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('')
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [isRealtimeEvent, setIsRealtimeEvent] = useState(false)
  const [clock, setClock] = useState<string>('')
  const [clockDate, setClockDate] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  // Company Swapper Dropdown & Auto-Cycle state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [companySearch, setCompanySearch] = useState('')
  const [isAutoCycle, setIsAutoCycle] = useState(false)
  const [autoCycleSeconds, setAutoCycleSeconds] = useState(15)
  const [autoCycleProgress, setAutoCycleProgress] = useState(0)
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Ensure current startup matches data
  useEffect(() => {
    if (initialData?.startup?.id) {
      setData(initialData)
      setCurrentStartupId(initialData.startup.id)
    }
  }, [initialData])

  // Clear legacy dark mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dayone_tv_theme')
      const savedCycle = localStorage.getItem('dayone_tv_autocycle')
      if (savedCycle === 'true') {
        setIsAutoCycle(true)
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

  // WakeLock: Keep TV screen awake without sleeping
  useEffect(() => {
    let wakeLock: any = null

    const requestWakeLock = async () => {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen')
        } catch {
          // not supported
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Telemetry Fetch Function for active startup
  const fetchTelemetry = useCallback(async (targetId?: string) => {
    const idToFetch = targetId || currentStartupId
    try {
      setIsRefreshing(true)
      const res = await fetch(`/api/tv/${idToFetch}`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setLastUpdatedTime(
          new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })
        )
      }
    } catch (e) {
      console.error('Failed to sync TV telemetry:', e)
    } finally {
      setIsRefreshing(false)
    }
  }, [currentStartupId])

  // ── Event-Driven Realtime Subscription (Zero Polling) ──
  // Subscribes to Supabase Realtime changes on telemetry_events, tasks, weekly_plans, and domains.
  // When ANY change occurs in the database, the dashboard immediately updates without unnecessary periodic API calls.
  useEffect(() => {
    const supabase = createClient()

    // Primary Realtime Channel for Telemetry
    const channel = supabase
      .channel(`tv-telemetry-${currentStartupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'telemetry_events',
        },
        (payload) => {
          const newEvent = payload.new as { startup_id?: string; event_type?: string }
          // Trigger fetch if the event belongs to this startup or is studio-wide
          if (!newEvent?.startup_id || newEvent.startup_id === currentStartupId) {
            setIsRealtimeEvent(true)
            setTimeout(() => setIsRealtimeEvent(false), 2500)
            fetchTelemetry()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          setIsRealtimeEvent(true)
          setTimeout(() => setIsRealtimeEvent(false), 2500)
          fetchTelemetry()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_plans',
        },
        () => {
          setIsRealtimeEvent(true)
          setTimeout(() => setIsRealtimeEvent(false), 2500)
          fetchTelemetry()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs',
        },
        () => {
          setIsRealtimeEvent(true)
          setTimeout(() => setIsRealtimeEvent(false), 2500)
          fetchTelemetry()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true)
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsRealtimeConnected(false)
        }
      })

    // Fallback Heartbeat: A very low-frequency check (every 10 minutes) strictly to recover from extended network sleep
    const fallbackHeartbeat = setInterval(() => {
      fetchTelemetry()
    }, 10 * 60 * 1000)

    return () => {
      clearInterval(fallbackHeartbeat)
      supabase.removeChannel(channel)
    }
  }, [currentStartupId, fetchTelemetry])

  // Handle Switch to Specific Startup
  const handleSelectStartup = useCallback(async (targetStartup: StartupOption) => {
    if (targetStartup.id === currentStartupId && !isSwitching) {
      setIsDropdownOpen(false)
      return
    }

    setIsSwitching(true)
    setIsDropdownOpen(false)
    setAutoCycleProgress(0)

    try {
      const res = await fetch(`/api/tv/${targetStartup.id}`, { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        setData(json)
        setCurrentStartupId(targetStartup.id)
        setLastUpdatedTime(
          new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })
        )

        // Update URL path without full page reload
        if (typeof window !== 'undefined') {
          const newUrl = `/tv/${targetStartup.slug || targetStartup.id}`
          window.history.replaceState(null, '', newUrl)
        }
      }
    } catch (err) {
      console.error('Failed to swap startup telemetry:', err)
    } finally {
      setTimeout(() => setIsSwitching(false), 250)
    }
  }, [currentStartupId, isSwitching])

  // Previous and Next Startup Handlers
  const currentStartupIndex = allStartups.findIndex(
    (s) => s.id === currentStartupId || s.name.toLowerCase() === data.startup.name.toLowerCase()
  )

  const handlePrevStartup = useCallback(() => {
    if (allStartups.length <= 1) return
    const prevIdx = (currentStartupIndex - 1 + allStartups.length) % allStartups.length
    handleSelectStartup(allStartups[prevIdx])
  }, [allStartups, currentStartupIndex, handleSelectStartup])

  const handleNextStartup = useCallback(() => {
    if (allStartups.length <= 1) return
    const nextIdx = (currentStartupIndex + 1) % allStartups.length
    handleSelectStartup(allStartups[nextIdx])
  }, [allStartups, currentStartupIndex, handleSelectStartup])

  // Auto-Cycle Ticker (Cycles through companies automatically)
  useEffect(() => {
    if (!isAutoCycle || allStartups.length <= 1 || isDropdownOpen) {
      return
    }

    const stepMs = 250
    const totalMs = autoCycleSeconds * 1000
    const increment = (stepMs / totalMs) * 100

    const cycleInterval = setInterval(() => {
      setAutoCycleProgress((prev) => {
        if (prev >= 100) {
          handleNextStartup()
          return 0
        }
        return prev + increment
      })
    }, stepMs)

    return () => clearInterval(cycleInterval)
  }, [isAutoCycle, allStartups.length, autoCycleSeconds, isDropdownOpen, handleNextStartup])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return

      if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        toggleFullscreen()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNextStartup()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrevStartup()
      } else if (e.key === ' ') {
        e.preventDefault()
        toggleAutoCycle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNextStartup, handlePrevStartup])

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const toggleAutoCycle = () => {
    const next = !isAutoCycle
    setIsAutoCycle(next)
    setAutoCycleProgress(0)
    localStorage.setItem('dayone_tv_autocycle', next ? 'true' : 'false')
  }

  const copyCurrentTvLink = () => {
    if (typeof window !== 'undefined') {
      const activeSlug = data.startup.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const url = `${window.location.origin}/tv/${activeSlug}`
      navigator.clipboard.writeText(url)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2500)
    }
  }

  // Studio Telemetry Warm Editorial Cream Palette (matching reference design)
  const colors = {
    bg: '#f5eedc',
    canvasGradient: 'linear-gradient(180deg, #f7f1e1 0%, #f4edd9 100%)',
    cardBg: '#ffffff',
    cardBorder: '#e7ddcb',
    cardShadow: '0 1px 3px rgba(30, 27, 24, 0.04), 0 1px 2px rgba(30, 27, 24, 0.02)',
    headerBg: '#f5eedc',
    textPrimary: '#18181b',
    textSecondary: '#4b5563',
    textMuted: '#78716c',
    brandRed: '#ca2f2b',
    brandRedDark: '#991b1b',
    brandRedSoft: '#f87171',
    brandRedFaint: '#fef2f2',
    brandRedBorder: '#fecaca',
    brandRedDim: 'rgba(202, 47, 43, 0.08)',
    brandRedGlow: 'rgba(202, 47, 43, 0.22)',
    brandWatermark: 'rgba(202, 47, 43, 0.25)',
    gridLine: '#ede5d6',
    chartIdeal: '#a8a29e',
    subtleCard: '#fcfbf8',
    accentBlue: '#0284c7',
    accentGreen: '#15803d',
    accentGreenBg: '#ecfdf5',
    accentGreenBorder: '#bbf7d0',
    accentAmber: '#d97706',
    accentPurple: '#7c3aed',
  }

  const { startup, sprint, metrics, charts, deliverables, recentActivity } = data

  const statusBadgeConfig = {
    AHEAD: { label: 'AHEAD OF SCHEDULE', bg: '#ecfdf5', color: '#15803d', border: '#bbf7d0' },
    ON_TRACK: { label: 'ON TRACK', bg: '#ecfdf5', color: '#15803d', border: '#bbf7d0' },
    BEHIND: { label: 'PACE BEHIND', bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
    AT_RISK: { label: 'AT RISK', bg: '#fef2f2', color: '#ca2f2b', border: '#fecaca' },
  }[sprint.status]

  // Filter startups for dropdown
  const filteredStartups = allStartups.filter((s) =>
    s.name.toLowerCase().includes(companySearch.toLowerCase())
  )

  // Calculate Process Dashbar Values
  const totalTasks = metrics.totalTasks
  const donePercent = totalTasks > 0 ? Math.round((metrics.doneTasks / totalTasks) * 100) : 0
  const inProgressPercent = totalTasks > 0 ? Math.round((metrics.inProgressTasks / totalTasks) * 100) : 0
  const todoPercent = totalTasks > 0 ? Math.max(0, 100 - donePercent - inProgressPercent) : 0

  // Calculate Sprint Expected Pace (Mon=0% -> Sun=100%)
  const sprintTargetPace = Math.min(100, Math.max(0, Math.round(((7 - sprint.daysRemaining) / 7) * 100)))

  // Calculate Trajectory Color Indication (Emerald / Sky Blue / Amber)
  const targetExpectedTasks = Math.round((sprintTargetPace / 100) * totalTasks)
  const isTrajectoryAhead = metrics.doneTasks > targetExpectedTasks
  const isTrajectoryOnTrack = metrics.doneTasks >= Math.max(1, targetExpectedTasks - 1)
  const isTrajectoryLagging = !isTrajectoryAhead && !isTrajectoryOnTrack && totalTasks > 0

  let trajectoryColor = '#059669' // Emerald
  let trajectoryBadgeBg = '#ecfdf5'
  let trajectoryBadgeColor = '#065f46'
  let trajectoryBadgeBorder = '#a7f3d0'
  let trajectoryStatusLabel = 'ON TRACK'

  if (isTrajectoryAhead) {
    trajectoryColor = '#059669'
    trajectoryBadgeBg = '#ecfdf5'
    trajectoryBadgeColor = '#065f46'
    trajectoryBadgeBorder = '#a7f3d0'
    trajectoryStatusLabel = `AHEAD (+${metrics.doneTasks - targetExpectedTasks})`
  } else if (isTrajectoryOnTrack) {
    trajectoryColor = '#0284c7' // Electric Sky Blue
    trajectoryBadgeBg = '#f0f9ff'
    trajectoryBadgeColor = '#0369a1'
    trajectoryBadgeBorder = '#bae6fd'
    trajectoryStatusLabel = 'PACING WELL'
  } else if (isTrajectoryLagging) {
    trajectoryColor = '#ea580c' // Warm Coral / Orange
    trajectoryBadgeBg = '#fff7ed'
    trajectoryBadgeColor = '#9a3412'
    trajectoryBadgeBorder = '#fed7aa'
    trajectoryStatusLabel = 'NEEDS PUSH'
  }

  const activeStartupObj = allStartups.find((s) => s.id === currentStartupId || s.name.toLowerCase() === startup.name.toLowerCase())
  const activeLogoUrl = activeStartupObj?.logo_url || (startup as any).logo_url
  const activeSector = data.sector || activeStartupObj?.sector || 'Skincare / Beauty Tech'
  const activeStage = data.stage || activeStartupObj?.stage || 'MVP'
  const healthScore = data.healthScore || { score: 78, status: 'On Track' }
  const blockersAnalysis = data.blockersAnalysis || {
    totalLaggingCount: 0,
    criticalBlockers: [],
    laggingDomains: [],
  }
  const criticalBlockers = blockersAnalysis.criticalBlockers || []
  const laggingDomains = blockersAnalysis.laggingDomains || []

  return (
    <div
      style={{
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: colors.bg,
        backgroundImage: colors.canvasGradient,
        color: colors.textPrimary,
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Auto-Cycle Top Countdown Line ── */}
      {isAutoCycle && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.08)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${autoCycleProgress}%`,
              background: 'linear-gradient(90deg, #ca2f2b 0%, #f59e0b 50%, #10b981 100%)',
              boxShadow: '0 0 10px rgba(202, 47, 43, 0.8)',
              transition: 'width 250ms linear',
            }}
          />
        </div>
      )}

      {/* ── 1. TV Executive Header Bar (Matching Reference Image) ── */}
      <header
        style={{
          height: 60,
          background: colors.headerBg,
          borderBottom: `1px solid ${colors.cardBorder}`,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          backdropFilter: 'blur(16px)',
          zIndex: 40,
        }}
      >
        {/* Left: Studio Branding + Title Block matching reference design */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/tv" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: colors.brandRed, letterSpacing: '-0.5px', lineHeight: 1 }}>
              dayone
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: colors.brandRed, letterSpacing: '0.2px', marginTop: 1 }}>
              venture studio by iQue
            </div>
          </Link>

          <div style={{ height: 32, width: 1, background: colors.cardBorder }} />

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: colors.brandRed, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              Venture Studio Dashboard
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: colors.textPrimary, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Common Performance System
            </div>
            <div style={{ fontSize: 10, color: colors.textMuted, fontWeight: 500 }}>
              One system. 5 startups. Distinct journeys.
            </div>
          </div>
        </div>

        {/* Center: Live Telemetry Stream + Auto-Cycle Carousel Control + Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Live Realtime Event-Driven Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 100,
              background: isRealtimeEvent ? '#dcfce7' : colors.accentGreenBg,
              border: `1px solid ${isRealtimeEvent ? '#86efac' : colors.accentGreenBorder}`,
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.6px',
              color: colors.accentGreen,
              transition: 'all 0.25s ease',
              boxShadow: isRealtimeEvent ? '0 0 12px rgba(22, 163, 74, 0.4)' : 'none',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: colors.accentGreen,
                display: 'inline-block',
                boxShadow: isRealtimeEvent ? '0 0 8px #16a34a' : 'none',
              }}
            />
            <span>{isRealtimeEvent ? 'DATA UPDATED' : isRealtimeConnected ? 'LIVE REALTIME' : 'LIVE TELEMETRY'}</span>
            <span style={{ opacity: 0.75, fontSize: 10, fontFamily: 'var(--font-mono)' }}>
              {isRealtimeEvent ? '● Just Now' : lastUpdatedTime ? `Sync: ${lastUpdatedTime}` : '● Listening'}
            </span>
          </div>

          {/* Auto-Cycle / Wall TV Carousel Toggle Button */}
          {allStartups.length > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: isAutoCycle ? '#fee2e2' : colors.cardBg,
                border: `1px solid ${isAutoCycle ? colors.brandRed : colors.cardBorder}`,
                padding: '4px 12px',
                borderRadius: 100,
                fontSize: 10.5,
                fontWeight: 700,
                color: isAutoCycle ? colors.brandRed : colors.textSecondary,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onClick={toggleAutoCycle}
              title="Toggle automatic cycling between companies (Spacebar)"
            >
              {isAutoCycle ? (
                <Pause className="w-3.5 h-3.5 text-red-600" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>Auto-Cycle: {isAutoCycle ? `${autoCycleSeconds}s` : 'OFF'}</span>

              {isAutoCycle && (
                <span
                  style={{
                    fontSize: 9.5,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: colors.brandRed,
                    color: '#ffffff',
                    fontWeight: 800,
                    marginLeft: 2,
                  }}
                >
                  {currentStartupIndex + 1}/{allStartups.length}
                </span>
              )}
            </div>
          )}

          {/* Clock */}
          <div style={{ textAlign: 'right', minWidth: 90, marginLeft: 4 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: colors.textPrimary,
                letterSpacing: '0.5px',
                lineHeight: 1.1,
              }}
            >
              {clock || '12:00:00'}
            </div>
            <div style={{ fontSize: 9.5, color: colors.textMuted, marginTop: 1 }}>
              {clockDate}
            </div>
          </div>
        </div>

        {/* Right: Screen count + Company Selector with Spotlight badge + Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Screen Indicator */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: colors.textPrimary, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                STARTUP SCREEN {String(currentStartupIndex + 1).padStart(2, '0')} / {String(allStartups.length || 5).padStart(2, '0')}
              </span>
              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                <span style={{ width: 12, height: 4, borderRadius: 2, background: colors.brandRed }} />
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#d4d4d8' }} />
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#d4d4d8' }} />
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#d4d4d8' }} />
              </div>
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: colors.textMuted, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Weekly Performance Overview
            </div>
          </div>

          {/* Company Identity & Swap Dropdown Trigger */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {allStartups.length > 1 && (
                <button
                  onClick={handlePrevStartup}
                  title="Previous Company (← Arrow)"
                  style={{
                    background: colors.cardBg,
                    border: `1px solid ${colors.cardBorder}`,
                    color: colors.textSecondary,
                    width: 34,
                    height: 40,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: colors.cardShadow,
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Main Company Dropdown Trigger matching reference */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                title="Click to switch company"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: colors.cardBg,
                  border: `1px solid ${isDropdownOpen ? colors.brandRed : colors.cardBorder}`,
                  padding: '3px 12px 3px 8px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  color: colors.textPrimary,
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  boxShadow: colors.cardShadow,
                }}
              >
                <CompanyLogo
                  logoUrl={activeLogoUrl}
                  name={startup.name}
                  size={30}
                />
                <div style={{ lineHeight: 1.15 }}>
                  <div style={{ fontSize: 8.5, fontWeight: 800, color: colors.brandRed, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                    Startup Spotlight
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.2px', color: colors.textPrimary }}>
                      {startup.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </div>
                  <div style={{ fontSize: 9.5, color: colors.textMuted, fontWeight: 500 }}>
                    {activeStartupObj?.sector || 'Skincare / Beauty Tech'}
                  </div>
                </div>
              </button>

              {allStartups.length > 1 && (
                <button
                  onClick={handleNextStartup}
                  title="Next Company (→ Arrow)"
                  style={{
                    background: colors.cardBg,
                    border: `1px solid ${colors.cardBorder}`,
                    color: colors.textSecondary,
                    width: 34,
                    height: 40,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: colors.cardShadow,
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Manual Refresh */}
              <button
                onClick={() => fetchTelemetry()}
                title="Force Sync Live Telemetry"
                style={{
                  background: colors.cardBg,
                  border: `1px solid ${colors.cardBorder}`,
                  color: colors.textSecondary,
                  width: 34,
                  height: 40,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: colors.cardShadow,
                }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-500' : ''}`} />
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen TV Mode (F)'}
                style={{
                  background: colors.cardBg,
                  border: `1px solid ${colors.cardBorder}`,
                  color: colors.textSecondary,
                  width: 34,
                  height: 40,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: colors.cardShadow,
                }}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  width: 300,
                  background: colors.cardBg,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: 12,
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
                  padding: 10,
                  zIndex: 100,
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 6px', borderBottom: `1px solid ${colors.cardBorder}`, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Select Studio Startup
                  </span>
                  <span style={{ fontSize: 10, color: colors.brandRed, fontWeight: 700 }}>
                    {allStartups.length} Available
                  </span>
                </div>

                {allStartups.length > 4 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: colors.subtleCard,
                      border: `1px solid ${colors.cardBorder}`,
                      borderRadius: 7,
                      padding: '5px 8px',
                      marginBottom: 6,
                    }}
                  >
                    <Search className="w-3.5 h-3.5 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Filter startups..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: 11,
                        color: colors.textPrimary,
                        width: '100%',
                      }}
                      autoFocus
                    />
                  </div>
                )}

                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {filteredStartups.map((s) => {
                    const isSelected = s.id === currentStartupId || s.name.toLowerCase() === startup.name.toLowerCase()
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelectStartup(s)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: 8,
                          background: isSelected ? '#fee2e2' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CompanyLogo logoUrl={s.logo_url} name={s.name} size={22} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: isSelected ? 800 : 600, color: isSelected ? colors.brandRed : colors.textPrimary }}>
                              {s.name}
                            </div>
                            <div style={{ fontSize: 9.5, color: colors.textMuted }}>
                              {s.tasksCount ? `${s.tasksCount} sprint tasks` : s.status}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-red-600" />}
                      </div>
                    )
                  })}
                </div>

                {/* Quick Fleet Modal Launcher */}
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${colors.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false)
                      setIsFleetModalOpen(true)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.textSecondary,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0,
                    }}
                  >
                    <LayoutGrid className="w-3 h-3 text-stone-400" />
                    <span>View All Fleet TVs</span>
                  </button>

                  <button
                    onClick={copyCurrentTvLink}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.brandRed,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0,
                    }}
                  >
                    {copiedUrl ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUrl ? 'Copied' : 'Copy TV Link'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. TV Main Telemetry Canvas ── */}
      <main
        style={{
          flex: 1,
          padding: '10px 22px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 10,
          maxWidth: 1920,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          minHeight: 0,
          opacity: isSwitching ? 0.3 : 1,
          transition: 'opacity 0.2s ease-in-out',
        }}
      >
        {/* ── 1. Executive Spotlight Company Banner (High Visibility On TV) ── */}
        <div
          style={{
            background: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 16,
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: colors.cardShadow,
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
            {/* Prominent High-Visibility Logo Box */}
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: '#ffffff',
                border: '1.5px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                overflow: 'hidden',
              }}
            >
              <CompanyLogo
                logoUrl={activeLogoUrl}
                name={startup.name}
                size={54}
              />
            </div>

            {/* Company Identification & North Star Hierarchy */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Row 1: Commanding Company Name & Sector Tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2, flexWrap: 'wrap' }}>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: '-0.4px',
                    color: colors.textPrimary,
                    margin: 0,
                    lineHeight: 1.15,
                  }}
                >
                  {startup.name}
                </h1>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(202, 47, 43, 0.08)',
                    color: colors.brandRed,
                    border: '1px solid rgba(202, 47, 43, 0.22)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                  }}
                >
                  {activeSector}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 6,
                    background: colors.subtleCard,
                    color: colors.textSecondary,
                    border: `1px solid ${colors.cardBorder}`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  STAGE: {activeStage}
                </span>
              </div>

              {/* Row 2: Sprint North Star Objective */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    color: colors.brandRed,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <Target size={12} />
                  Sprint North Star:
                </span>
                <span
                  className="font-serif-italic"
                  style={{
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: colors.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  &ldquo;{sprint.goal}&rdquo;
                </span>
              </div>
            </div>
          </div>

          {/* Sprint Details Chips matching reference */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* High-Visibility Numeric Health Score Badge */}
            <div
              style={{
                padding: '4px 12px',
                borderRadius: 100,
                background:
                  healthScore.score >= 70
                    ? 'rgba(16, 185, 129, 0.09)'
                    : healthScore.score >= 50
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(202, 47, 43, 0.1)',
                color:
                  healthScore.score >= 70
                    ? '#059669'
                    : healthScore.score >= 50
                    ? '#d97706'
                    : colors.brandRed,
                border: `1px solid ${
                  healthScore.score >= 70
                    ? 'rgba(16, 185, 129, 0.25)'
                    : healthScore.score >= 50
                    ? 'rgba(245, 158, 11, 0.3)'
                    : 'rgba(202, 47, 43, 0.25)'
                }`,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 9.5, fontWeight: 900, color: colors.textMuted, letterSpacing: '0.8px' }}>HEALTH:</span>
              <span style={{ fontSize: 13, fontWeight: 900 }}>
                {healthScore.score}
                <span style={{ fontSize: 9.5, opacity: 0.7 }}>/100</span>
              </span>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background:
                    healthScore.score >= 70
                      ? '#059669'
                      : healthScore.score >= 50
                      ? '#d97706'
                      : colors.brandRed,
                }}
              />
              <span style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 800 }}>
                {healthScore.status}
              </span>
            </div>

            <div
              style={{
                padding: '4px 12px',
                borderRadius: 100,
                background: statusBadgeConfig.bg,
                color: statusBadgeConfig.color,
                border: `1px solid ${statusBadgeConfig.border}`,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusBadgeConfig.color }} />
              <span>{statusBadgeConfig.label}</span>
            </div>

            <div
              style={{
                padding: '4px 12px',
                borderRadius: 8,
                background: colors.subtleCard,
                border: `1px solid ${colors.cardBorder}`,
                fontSize: 11.5,
                fontWeight: 700,
                color: colors.textPrimary,
              }}
            >
              {sprint.daysRemaining}d Remaining in Sprint
            </div>

            <div
              style={{
                padding: '4px 12px',
                borderRadius: 8,
                background: colors.subtleCard,
                border: `1px solid ${colors.cardBorder}`,
                fontSize: 11.5,
                color: colors.textMuted,
                fontWeight: 500,
              }}
            >
              {sprint.weekStart} → {sprint.weekEnd}
            </div>

            {/* Editorial Watermark Motto */}
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: 12.5,
                color: colors.brandWatermark,
                marginLeft: 4,
              }}
            >
              Building something brighter.
            </div>
          </div>
        </div>

        {/* ── 3. Dedicated Process & Execution Dashbar (Full Width) ── */}
        <div
          style={{
            background: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 16,
            padding: '12px 18px',
            boxShadow: colors.cardShadow,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flexShrink: 0,
          }}
        >
          {/* Dashbar Header with Stages */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity className="w-4 h-4 text-red-600" />
              <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.6px', textTransform: 'uppercase', color: colors.textPrimary }}>
                Sprint Process & Execution Pipeline
              </span>
            </div>

            {/* Pipeline Stage Indicators matching reference */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Stage 1: Backlog / Todo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#a8a29e',
                  }}
                />
                <span style={{ color: colors.textMuted }}>Backlog (TODO):</span>
                <span style={{ fontWeight: 800, color: colors.textPrimary }}>
                  {metrics.todoTasks} ({todoPercent}%)
                </span>
              </div>

              {/* Stage 2: Active / In Progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#f97316',
                  }}
                />
                <span style={{ color: '#ea580c', fontWeight: 600 }}>Active Execution:</span>
                <span style={{ fontWeight: 800, color: '#ea580c' }}>
                  {metrics.inProgressTasks} ({inProgressPercent}%)
                </span>
              </div>

              {/* Stage 3: Completed / Done */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: colors.brandRed,
                  }}
                />
                <span style={{ color: colors.brandRed, fontWeight: 700 }}>Delivered:</span>
                <span style={{ fontWeight: 800, color: colors.brandRed }}>
                  {metrics.doneTasks} ({donePercent}%)
                </span>
              </div>

              {/* Pace Target Comparison */}
              <div
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  background: colors.subtleCard,
                  border: `1px solid ${colors.cardBorder}`,
                  fontSize: 10.5,
                  color: colors.textSecondary,
                  fontWeight: 600,
                }}
              >
                Target Pace: <span style={{ color: colors.brandRed, fontWeight: 900 }}>{sprintTargetPace}%</span>
              </div>
            </div>
          </div>

          {/* Continuous Multi-Segment Process Bar in warm studio tones */}
          <div
            style={{
              height: 12,
              borderRadius: 6,
              background: '#f4ede0',
              display: 'flex',
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.06)',
              position: 'relative',
            }}
          >
            {/* Done Segment (Crimson Brand Red) */}
            {donePercent > 0 && (
              <div
                style={{
                  width: `${donePercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ca2f2b 0%, #991b1b 100%)',
                  transition: 'width 0.4s ease',
                }}
                title={`Delivered: ${donePercent}%`}
              />
            )}

            {/* In Progress Segment (Vibrant Coral Orange) */}
            {inProgressPercent > 0 && (
              <div
                style={{
                  width: `${inProgressPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
                  transition: 'width 0.4s ease',
                }}
                title={`Active: ${inProgressPercent}%`}
              />
            )}

            {/* Todo / Backlog Segment (Warm Taupe) */}
            {todoPercent > 0 && (
              <div
                style={{
                  width: `${todoPercent}%`,
                  height: '100%',
                  background: '#e5decb',
                  transition: 'width 0.4s ease',
                }}
                title={`Backlog: ${todoPercent}%`}
              />
            )}
          </div>

          {/* Functional Domain Readiness Footnote */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: colors.textMuted }}>
            <div>
              <span style={{ fontWeight: 800, color: colors.textPrimary }}>FUNCTIONAL READINESS: </span>
              {charts.domains.length > 0 ? (
                charts.domains.map((dom, i) => (
                  <span key={dom.name}>
                    {dom.name} ({dom.rate}%){i < charts.domains.length - 1 ? ' • ' : ''}
                  </span>
                ))
              ) : (
                <span>No domains configured yet</span>
              )}
            </div>
          </div>
        </div>

        {/* ── 4. Key Performance Indicators (5 Metric Tiles Across Width) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 10,
            flexShrink: 0,
          }}
        >
          {/* Tile 1: Venture Health Score (Numeric 0-100 derived from Todo KPIs) */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 16,
              padding: '12px 16px',
              boxShadow: colors.cardShadow,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Venture Health
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 3 }}>
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    letterSpacing: '-1px',
                    color:
                      healthScore.score >= 70
                        ? '#059669'
                        : healthScore.score >= 50
                        ? '#d97706'
                        : colors.brandRed,
                    lineHeight: 1.1,
                  }}
                >
                  {healthScore.score}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.textMuted }}>/100</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background:
                      healthScore.score >= 70
                        ? '#059669'
                        : healthScore.score >= 50
                        ? '#d97706'
                        : colors.brandRed,
                  }}
                />
                <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: colors.textSecondary }}>
                  {healthScore.status}
                </span>
              </div>
            </div>

            {/* Circular Gauge Ring */}
            <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
              <svg width="44" height="44" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#fee2e2"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={
                    healthScore.score >= 70
                      ? '#059669'
                      : healthScore.score >= 50
                      ? '#d97706'
                      : colors.brandRed
                  }
                  strokeWidth="3.8"
                  strokeDasharray={`${healthScore.score}, 100`}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9.5,
                  fontWeight: 900,
                  color:
                    healthScore.score >= 70
                      ? '#059669'
                      : healthScore.score >= 50
                      ? '#d97706'
                      : colors.brandRed,
                }}
              >
                <Activity size={16} />
              </div>
            </div>
          </div>

          {/* Tile 2: Sprint Completion */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 16,
              padding: '12px 16px',
              boxShadow: colors.cardShadow,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Sprint Completion
              </div>
              <Target className="w-4 h-4 text-red-600" />
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: colors.brandRed, lineHeight: 1.1, marginTop: 3 }}>
              {metrics.completionRate}%
            </div>
            <div style={{ fontSize: 10.5, color: colors.textSecondary, marginTop: 3 }}>
              {metrics.doneTasks} of {metrics.totalTasks} Tasks Shipped
            </div>
          </div>

          {/* Tile 3: Active Execution */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 16,
              padding: '12px 16px',
              boxShadow: colors.cardShadow,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Active Execution
              </div>
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: '#ea580c', lineHeight: 1.1, marginTop: 3 }}>
              {metrics.inProgressTasks}
            </div>
            <div style={{ fontSize: 10.5, color: colors.textSecondary, marginTop: 3 }}>
              Tasks In Progress Now
            </div>
          </div>

          {/* Tile 4: Critical Blockers & Lagging Items */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${criticalBlockers.length > 0 ? 'rgba(202, 47, 43, 0.3)' : colors.cardBorder}`,
              borderRadius: 16,
              padding: '12px 16px',
              boxShadow: colors.cardShadow,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Critical Blockers
              </div>
              <AlertTriangle
                className={`w-4 h-4 ${criticalBlockers.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}
              />
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: '-1px',
                color: criticalBlockers.length > 0 ? colors.brandRed : '#059669',
                lineHeight: 1.1,
                marginTop: 3,
              }}
            >
              {criticalBlockers.length}
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: criticalBlockers.length > 0 ? colors.brandRed : '#059669',
                fontWeight: 700,
                marginTop: 3,
              }}
            >
              {criticalBlockers.length > 0
                ? `${criticalBlockers.length} Blocked • ${laggingDomains.filter((d: any) => d.isLagging).length} Lagging Domains`
                : 'All Domains On Pace'}
            </div>
          </div>

          {/* Tile 5: Domain Coverage */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 16,
              padding: '12px 16px',
              boxShadow: colors.cardShadow,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Domain Pillars
              </div>
              <Layers className="w-4 h-4 text-purple-600" />
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: colors.textPrimary, lineHeight: 1.1, marginTop: 3 }}>
              {metrics.domainsCount}
            </div>
            <div style={{ fontSize: 10.5, color: colors.textSecondary, marginTop: 3 }}>
              Functional Areas Active
            </div>
          </div>
        </div>

        {/* ── 5. Charts Core (Burndown Trajectory AreaChart + Domain BarChart) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '62% 38%',
            gap: 12,
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Chart 1: Sprint Velocity Burndown Trajectory */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 16,
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: colors.cardShadow,
              minHeight: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: `${trajectoryColor}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp className="w-4 h-4" style={{ color: trajectoryColor }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.2px', color: colors.textPrimary, margin: 0 }}>
                    Weekly Output & Execution Trajectory
                  </h3>
                  <div style={{ fontSize: 10, color: colors.textMuted }}>
                    Cumulative Shipped Deliverables (Ascending Pace)
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 2, background: '#94a3b8', borderRadius: 1 }} />
                  <span style={{ color: colors.textMuted }}>Target Pace</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 3, background: trajectoryColor, borderRadius: 2 }} />
                  <span style={{ color: trajectoryColor, fontWeight: 800 }}>Shipped Output</span>
                </div>
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: 4,
                    fontSize: 9.5,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    background: trajectoryBadgeBg,
                    color: trajectoryBadgeColor,
                    border: `1px solid ${trajectoryBadgeBorder}`,
                  }}
                >
                  {trajectoryStatusLabel}
                </span>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.burndown} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tvVelocityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={trajectoryColor} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={trajectoryColor} stopOpacity={0.02} />
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
                    formatter={(value: any, name: any) => {
                      if (name === 'Target Pace') return [`${value} tasks`, 'Target Pace']
                      if (name === 'Shipped Tasks') return [`${value} tasks`, 'Cumulative Shipped']
                      return [value, name || '']
                    }}
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="targetCompleted"
                    name="Target Pace"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="transparent"
                  />
                  <Area
                    isAnimationActive={false}
                    connectNulls={false}
                    type="monotone"
                    dataKey="completed"
                    name="Shipped Tasks"
                    stroke={trajectoryColor}
                    strokeWidth={3.5}
                    fill="url(#tvVelocityGradient)"
                    dot={{ fill: trajectoryColor, r: 4.5, stroke: '#ffffff', strokeWidth: 1.5 }}
                    activeDot={{ r: 6.5, fill: trajectoryColor }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Domain Throughput Bar Chart in Brand Crimson & Coral */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 16,
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: colors.cardShadow,
              minHeight: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: '#10b98115',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Layers className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.2px', color: colors.textPrimary, margin: 0 }}>
                    Domain Throughput
                  </h3>
                  <div style={{ fontSize: 10, color: colors.textMuted }}>
                    Functional Delivery Velocity
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: 2 }} />
                  <span style={{ color: colors.textMuted }}>Shipped</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, background: '#0ea5e9', borderRadius: 2 }} />
                  <span style={{ color: colors.textMuted }}>In Progress</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, background: '#cbd5e1', borderRadius: 2 }} />
                  <span style={{ color: colors.textMuted }}>Backlog</span>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
              {charts.domains.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: colors.textMuted, fontSize: 12 }}>
                  <Layers className="w-8 h-8 opacity-40 mb-2" />
                  <span>Configure domains to track functional throughput</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.domains} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} />
                    <XAxis dataKey="name" tick={{ fill: colors.textMuted, fontSize: 10.5 }} axisLine={{ stroke: colors.gridLine }} />
                    <YAxis tick={{ fill: colors.textMuted, fontSize: 10.5 }} axisLine={{ stroke: colors.gridLine }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: colors.cardBg,
                        borderColor: colors.cardBorder,
                        borderRadius: 8,
                        color: colors.textPrimary,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10.5, color: colors.textMuted }} />
                    <Bar isAnimationActive={false} dataKey="done" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar isAnimationActive={false} dataKey="inProgress" name="Active" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar isAnimationActive={false} dataKey="todo" name="Backlog" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ── 6. Bottom Row: Critical Blockers Radar ("Which") & Domain Lag Diagnostic ("Where") ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '58% 42%',
            gap: 12,
            height: '24%',
            minHeight: 140,
            flexShrink: 0,
          }}
        >
          {/* Panel A: Critical Blockers & Lagging Todos ("WHICH is lagging") */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${criticalBlockers.length > 0 ? 'rgba(202, 47, 43, 0.25)' : colors.cardBorder}`,
              borderRadius: 16,
              padding: '12px 18px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: colors.cardShadow,
              minHeight: 0,
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle className={`w-4 h-4 ${criticalBlockers.length > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
                <h3 style={{ fontSize: 12.5, fontWeight: 900, color: colors.textPrimary, letterSpacing: '-0.2px', margin: 0 }}>
                  Critical Blockers & Lagging Radar
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 100,
                    background: criticalBlockers.length > 0 ? 'rgba(202, 47, 43, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: criticalBlockers.length > 0 ? colors.brandRed : '#059669',
                    border: `1px solid ${criticalBlockers.length > 0 ? 'rgba(202, 47, 43, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {criticalBlockers.length > 0 ? `${criticalBlockers.length} Items Requiring Intervention` : 'All Clear'}
                </span>
              </div>
            </div>

            {criticalBlockers.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: colors.textMuted, fontSize: 12 }}>
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2 opacity-80" />
                <span style={{ fontWeight: 800, color: colors.textPrimary, fontSize: 13 }}>Zero Active Blockers</span>
                <span style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>All sprint deliverables are executing to pace without operational stalls.</span>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                  overflowY: 'auto',
                  flex: 1,
                  minHeight: 0,
                }}
              >
                {criticalBlockers.slice(0, 4).map((task: any, idx: number) => (
                  <div
                    key={task.id || idx}
                    style={{
                      padding: '8px 11px',
                      background: colors.subtleCard,
                      border: '1px solid rgba(202, 47, 43, 0.2)',
                      borderRadius: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: colors.brandRed,
                            color: '#ffffff',
                            fontSize: 10,
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            fontWeight: 800,
                            color: colors.textPrimary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {task.title}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontSize: 9,
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          background: 'rgba(202, 47, 43, 0.12)',
                          color: colors.brandRed,
                          border: '1px solid rgba(202, 47, 43, 0.25)',
                          flexShrink: 0,
                        }}
                      >
                        {task.urgency || 'CRITICAL'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'rgba(202, 47, 43, 0.08)',
                            color: colors.brandRed,
                            fontWeight: 800,
                            fontSize: 9.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {task.domainName}
                        </span>
                        <span style={{ color: colors.textMuted, fontSize: 9.5 }}>• {task.assigneeName}</span>
                      </div>
                      <span style={{ color: colors.brandRed, fontWeight: 700, fontSize: 9.5, flexShrink: 0 }}>
                        {task.lagReason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Script Watermark in Bottom Right corner */}
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                right: 14,
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: 12,
                color: colors.brandWatermark,
                pointerEvents: 'none',
              }}
            >
              Relentless Focus
            </div>
          </div>

          {/* Panel B: Domain Lag & Pacing Diagnostic ("WHERE is lagging") */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 16,
              padding: '12px 18px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: colors.cardShadow,
              minHeight: 0,
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers className="w-4 h-4 text-red-600" />
                <h3 style={{ fontSize: 12.5, fontWeight: 900, color: colors.textPrimary, letterSpacing: '-0.2px', margin: 0 }}>
                  Domain Pacing & Lag Diagnostic
                </h3>
              </div>
              <div style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600 }}>
                Target Pace: <span style={{ color: colors.brandRed, fontWeight: 900 }}>{sprintTargetPace}%</span>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: 6 }}>
              {(laggingDomains.length > 0 ? laggingDomains : charts.domains).slice(0, 4).map((dom: any) => {
                const hasTasks = (dom.total || 0) > 0
                const isLagging = hasTasks && (dom.isLagging || (dom.rate < sprintTargetPace - 15))
                const isOnTrack = hasTasks && !isLagging && dom.rate >= sprintTargetPace
                const isInactive = !hasTasks

                const badgeText = isInactive
                  ? 'NO TASKS'
                  : isLagging
                  ? 'LAGGING'
                  : isOnTrack
                  ? 'ON TRACK'
                  : 'PACING'

                const badgeBg = isInactive
                  ? 'rgba(0, 0, 0, 0.05)'
                  : isLagging
                  ? 'rgba(202, 47, 43, 0.12)'
                  : isOnTrack
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(245, 158, 11, 0.12)'

                const badgeColor = isInactive
                  ? colors.textMuted
                  : isLagging
                  ? colors.brandRed
                  : isOnTrack
                  ? '#059669'
                  : '#d97706'

                const badgeBorder = isInactive
                  ? 'rgba(0, 0, 0, 0.12)'
                  : isLagging
                  ? 'rgba(202, 47, 43, 0.25)'
                  : isOnTrack
                  ? 'rgba(16, 185, 129, 0.25)'
                  : 'rgba(245, 158, 11, 0.25)'

                const statusText = isInactive
                  ? 'No sprint deliverables'
                  : dom.lagReason || (isLagging ? `Trailing by ${sprintTargetPace - (dom.rate || 0)}%` : 'On Pace')

                return (
                  <div key={dom.name} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 800, color: colors.textPrimary }}>{dom.name}</span>
                        <span style={{ fontSize: 9.5, color: colors.textMuted }}>
                          ({dom.done || 0}/{dom.total || 0} done)
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 10,
                            color: isLagging ? colors.brandRed : colors.textMuted,
                            fontWeight: isLagging ? 800 : 500,
                          }}
                        >
                          {statusText}
                        </span>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: 4,
                            fontSize: 9,
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            background: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeBorder}`,
                          }}
                        >
                          {badgeText}
                        </span>
                      </div>
                    </div>

                    {/* Mini Progress Bar with Target Pace Line Marker */}
                    <div
                      style={{
                        position: 'relative',
                        height: 6,
                        background: '#f4ede0',
                        borderRadius: 3,
                        overflow: 'visible',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, dom.rate || 0)}%`,
                          height: '100%',
                          background: isInactive
                            ? '#d1d5db'
                            : isLagging
                            ? 'linear-gradient(90deg, #ca2f2b 0%, #ef4444 100%)'
                            : 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                          borderRadius: 3,
                          transition: 'width 0.4s ease',
                        }}
                      />
                      {/* Sprint Target Pace Marker */}
                      {hasTasks && (
                        <div
                          style={{
                            position: 'absolute',
                            left: `${sprintTargetPace}%`,
                            top: -2,
                            bottom: -2,
                            width: 2,
                            background: colors.textPrimary,
                            borderRadius: 1,
                            opacity: 0.7,
                          }}
                          title={`Target Pace: ${sprintTargetPace}%`}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Script Watermark in Bottom Right corner */}
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                right: 14,
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: 12,
                color: colors.brandWatermark,
                pointerEvents: 'none',
              }}
            >
              Domain Rigor
            </div>
          </div>
        </div>

        {/* ── 7. Bottom Studio System Bar (Matching Reference Design) ── */}
        <footer
          style={{
            background: colors.bg,
            borderTop: `1px solid ${colors.cardBorder}`,
            padding: '6px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          {/* Left: Studio Operating System Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: colors.brandRed, fontWeight: 900, letterSpacing: '0.12em' }}>
              DAYONE
            </span>
            <span style={{ color: '#d4cbb8' }}>|</span>
            <span style={{ color: '#3f3f46', fontWeight: 800, letterSpacing: '0.1em' }}>
              5 STARTUPS
            </span>
            <span style={{ color: '#d4cbb8' }}>|</span>
            <span style={{ color: '#3f3f46', fontWeight: 800, letterSpacing: '0.1em' }}>
              ONE OPERATING SYSTEM
            </span>
          </div>

          {/* Center: Live Studio Dispatch Ticker & Star */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: '46%' }}>
            <span style={{ color: colors.brandRed, fontSize: 14 }}>✦</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                color: colors.brandRed,
                fontWeight: 800,
                fontSize: 10,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>DISPATCH:</span>
            </div>
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: colors.textSecondary, fontSize: 11 }}>
              {recentActivity.length > 0 ? (
                <span>Recent: {recentActivity[0].action.replace(/_/g, ' ')} • Recorded on Day One Platform</span>
              ) : (
                <span>Live sprint telemetry active for {startup.name} • All domain operations connected</span>
              )}
            </div>
          </div>

          {/* Right: Studio Motto & Telemetry Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#52525b', fontWeight: 800, letterSpacing: '0.12em', fontSize: 10.5, textTransform: 'uppercase' }}>
              PEOPLE × BRANDS × BIGGER POSSIBILITIES
            </span>
            <span style={{ fontSize: 10, color: colors.textMuted }}>
              {isAutoCycle
                ? `Auto-Cycle (${Math.round((autoCycleProgress / 100) * autoCycleSeconds)}s)`
                : isRealtimeConnected
                ? 'Realtime: Listening for DB events'
                : 'Realtime: Connected'}
            </span>
          </div>
        </footer>
      </main>

      {/* ── Fleet Modal (When user wants all screen URLs) ── */}
      {isFleetModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 150,
            padding: 20,
          }}
          onClick={() => setIsFleetModalOpen(false)}
        >
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 16,
              padding: 24,
              maxWidth: 580,
              width: '100%',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>Portfolio Multi-TV Fleet</h3>
                <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  Direct permanent URLs designed for 1080p / 4K Wall Displays
                </p>
              </div>
              <button
                onClick={() => setIsFleetModalOpen(false)}
                style={{
                  background: colors.subtleCard,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: 8,
                  padding: '5px 10px',
                  color: colors.textSecondary,
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Close (Esc)
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
              {allStartups.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: colors.subtleCard,
                    border: `1px solid ${colors.cardBorder}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CompanyLogo
                      logoUrl={s.logo_url}
                      name={s.name}
                      size={28}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: 10.5, color: colors.textMuted }}>/tv/{s.slug}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => {
                        handleSelectStartup(s)
                        setIsFleetModalOpen(false)
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 6,
                        background: colors.brandRed,
                        color: '#ffffff',
                        border: 'none',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Switch Here
                    </button>
                    <button
                      onClick={() => {
                        const origin = typeof window !== 'undefined' ? window.location.origin : ''
                        navigator.clipboard.writeText(`${origin}/tv/${s.slug}`)
                        alert(`Copied: ${origin}/tv/${s.slug}`)
                      }}
                      title="Copy URL"
                      style={{
                        padding: '5px 8px',
                        borderRadius: 6,
                        background: colors.cardBg,
                        border: `1px solid ${colors.cardBorder}`,
                        color: colors.textSecondary,
                        cursor: 'pointer',
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
