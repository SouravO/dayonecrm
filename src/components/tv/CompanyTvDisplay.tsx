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

export interface TvPayload {
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

export interface StartupOption {
  id: string
  name: string
  email?: string
  status: string
  slug: string
  planGoal?: string | null
  tasksCount?: number
  domainsCount?: number
}

interface Props {
  initialData: TvPayload
  startupId: string
  initialTheme?: 'dark' | 'cream'
  allStartups?: StartupOption[]
}

export function CompanyTvDisplay({
  initialData,
  startupId,
  initialTheme = 'dark',
  allStartups = [],
}: Props) {
  const [data, setData] = useState<TvPayload>(initialData)
  const [currentStartupId, setCurrentStartupId] = useState<string>(startupId || initialData.startup.id)
  const [theme, setTheme] = useState<'dark' | 'cream'>(initialTheme)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [countdown, setCountdown] = useState<number>(20)
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

  // Initialize clock and theme from localStorage
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

      // Check if auto-cycle was saved
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
  }, [initialTheme])

  // WakeLock: Keep TV screen on without sleeping
  useEffect(() => {
    let wakeLock: any = null

    const requestWakeLock = async () => {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
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
        setCountdown(20)
      }
    } catch (e) {
      console.error('Failed to sync TV telemetry:', e)
    } finally {
      setIsRefreshing(false)
    }
  }, [currentStartupId])

  // Periodic Telemetry Polling (20s)
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
        setCountdown(20)

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
      // Don't trigger if user is typing in search input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return

      if (e.key.toLowerCase() === 'f') {
        toggleFullscreen()
      } else if (e.key.toLowerCase() === 't') {
        toggleTheme()
      } else if (e.key === 'ArrowRight') {
        handleNextStartup()
      } else if (e.key === 'ArrowLeft') {
        handlePrevStartup()
      } else if (e.key === ' ') {
        e.preventDefault()
        toggleAutoCycle()
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false)
        setIsFleetModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNextStartup, handlePrevStartup])

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
      setTimeout(() => setCopiedUrl(null as any), 2500)
    }
  }

  // Theme color palette
  const isDark = theme === 'dark'
  const colors = isDark
    ? {
        bg: '#0a0908',
        canvasGradient: 'radial-gradient(ellipse at 50% 0%, #171512 0%, #0a0908 75%)',
        cardBg: '#14120f',
        cardBorder: '#27231c',
        cardHighlight: 'rgba(255, 255, 255, 0.04)',
        headerBg: 'rgba(16, 14, 11, 0.96)',
        textPrimary: '#fbf9f4',
        textSecondary: '#a59b8c',
        textMuted: '#6d6559',
        brandRed: '#e63935',
        brandRedDim: 'rgba(230, 57, 53, 0.15)',
        brandRedGlow: 'rgba(230, 57, 53, 0.35)',
        gridLine: '#221f1a',
        chartIdeal: '#6d6559',
        subtleCard: '#181612',
        accentBlue: '#0284c7',
        accentGreen: '#059669',
        accentAmber: '#d97706',
        accentPurple: '#7c3aed',
      }
    : {
        bg: '#f6f2db',
        canvasGradient: 'radial-gradient(circle at 50% -10%, #fcfbf5 0%, #f6f2db 100%)',
        cardBg: '#ffffff',
        cardBorder: '#e5dfcb',
        cardHighlight: 'rgba(255, 255, 255, 0.9)',
        headerBg: 'rgba(253, 251, 246, 0.94)',
        textPrimary: '#1e1b18',
        textSecondary: '#5a5348',
        textMuted: '#8c8375',
        brandRed: '#ca2f2b',
        brandRedDim: 'rgba(202, 47, 43, 0.08)',
        brandRedGlow: 'rgba(202, 47, 43, 0.22)',
        gridLine: '#e6decb',
        chartIdeal: '#aba196',
        subtleCard: '#fbf9f1',
        accentBlue: '#0369a1',
        accentGreen: '#059669',
        accentAmber: '#b45309',
        accentPurple: '#6d28d9',
      }

  const { startup, sprint, metrics, charts, deliverables, recentActivity } = data

  const statusBadgeConfig = {
    AHEAD: { label: 'AHEAD OF SCHEDULE', bg: '#059669', color: '#ffffff' },
    ON_TRACK: { label: 'ON TRACK', bg: isDark ? '#0284c7' : '#0369a1', color: '#ffffff' },
    BEHIND: { label: 'PACE BEHIND', bg: '#d97706', color: '#ffffff' },
    AT_RISK: { label: 'AT RISK', bg: '#ca2f2b', color: '#ffffff' },
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
        position: 'relative',
      }}
    >
      {/* ── Auto-Cycle Top Countdown Line (Shows if Auto-Cycle ON) ── */}
      {isAutoCycle && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            zIndex: 100,
            background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
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

      {/* ── 1. TV Executive Header Bar ── */}
      <header
        style={{
          height: 68,
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
        {/* Left: Studio Branding + Company Selector with Swapping Controls */}
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

          <div style={{ height: 28, width: 1, background: colors.cardBorder }} />

          {/* Company Identity & Swap Dropdown Trigger */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Previous Company Button (<) */}
              {allStartups.length > 1 && (
                <button
                  onClick={handlePrevStartup}
                  title="Previous Company (← Arrow)"
                  style={{
                    background: colors.subtleCard,
                    border: `1px solid ${colors.cardBorder}`,
                    color: colors.textSecondary,
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Main Company Dropdown Trigger */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                title="Click to switch company"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: isDropdownOpen ? colors.cardBorder : colors.subtleCard,
                  border: `1px solid ${isDropdownOpen ? colors.brandRed : colors.cardBorder}`,
                  padding: '5px 12px 5px 6px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  color: colors.textPrimary,
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 7,
                    background: 'linear-gradient(135deg, #ca2f2b 0%, #9e1f1c 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 14,
                    boxShadow: `0 2px 8px ${colors.brandRedGlow}`,
                    flexShrink: 0,
                  }}
                >
                  {startup.initial}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                      {startup.name}
                    </span>
                    <ChevronDown
                      className="w-3.5 h-3.5 text-muted-foreground transition-transform"
                      style={{
                        transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: colors.textMuted,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 10.5, color: colors.textMuted, display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                    <span style={{ color: colors.accentGreen, fontWeight: 700 }}>● {startup.status}</span>
                    <span>•</span>
                    <span>Swap Company</span>
                  </div>
                </div>
              </button>

              {/* Next Company Button (>) */}
              {allStartups.length > 1 && (
                <button
                  onClick={handleNextStartup}
                  title="Next Company (→ Arrow)"
                  style={{
                    background: colors.subtleCard,
                    border: `1px solid ${colors.cardBorder}`,
                    color: colors.textSecondary,
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* ── Dropdown Menu for Swapping Companies ── */}
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: 320,
                  background: colors.cardBg,
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: 14,
                  boxShadow: `0 12px 30px rgba(0, 0, 0, ${isDark ? '0.6' : '0.15'})`,
                  padding: 12,
                  zIndex: 99,
                  backdropFilter: 'blur(20px)',
                  animation: 'fadeIn 0.15s ease-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Select Portfolio Company
                  </div>
                  <span style={{ fontSize: 10.5, color: colors.brandRed, fontWeight: 700 }}>
                    {allStartups.length} Available
                  </span>
                </div>

                {/* Search in Dropdown */}
                {allStartups.length > 4 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: colors.subtleCard,
                      border: `1px solid ${colors.cardBorder}`,
                      borderRadius: 8,
                      padding: '6px 10px',
                      marginBottom: 8,
                    }}
                  >
                    <Search className="w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Find startup..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: colors.textPrimary,
                        fontSize: 12,
                        width: '100%',
                      }}
                      autoFocus
                    />
                  </div>
                )}

                {/* Company Items */}
                <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {filteredStartups.map((s) => {
                    const isSelected = s.id === currentStartupId || s.name.toLowerCase() === startup.name.toLowerCase()
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSelectStartup(s)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: 8,
                          background: isSelected ? (isDark ? 'rgba(230, 57, 53, 0.15)' : 'rgba(202, 47, 43, 0.08)') : 'transparent',
                          border: isSelected ? `1px solid ${colors.brandRed}` : '1px solid transparent',
                          cursor: 'pointer',
                          color: colors.textPrimary,
                          textAlign: 'left',
                          width: '100%',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              background: isSelected
                                ? 'linear-gradient(135deg, #ca2f2b 0%, #9e1f1c 100%)'
                                : colors.subtleCard,
                              color: isSelected ? '#ffffff' : colors.textPrimary,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: 12,
                              flexShrink: 0,
                            }}
                          >
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.name}
                            </div>
                            <div style={{ fontSize: 10, color: colors.textMuted }}>
                              {s.tasksCount ? `${s.tasksCount} sprint tasks` : 'Active feed'}
                            </div>
                          </div>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-red-500" style={{ color: colors.brandRed }} />}
                      </button>
                    )
                  })}
                </div>

                {/* Footer link to Fleet Overview */}
                <div style={{ borderTop: `1px solid ${colors.cardBorder}`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0,
                    }}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>View All Screen URLs</span>
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

        {/* Center: Live Telemetry Stream + Auto-Cycle Carousel Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Live Radar Pulse */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
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

          {/* Auto-Cycle / Wall TV Carousel Toggle Button */}
          {allStartups.length > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: isAutoCycle ? (isDark ? 'rgba(230, 57, 53, 0.2)' : '#fee2e2') : colors.cardBg,
                border: `1px solid ${isAutoCycle ? colors.brandRed : colors.cardBorder}`,
                padding: '4px 10px',
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 700,
                color: isAutoCycle ? colors.brandRed : colors.textSecondary,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onClick={toggleAutoCycle}
              title="Toggle automatic cycling between companies (Spacebar)"
            >
              {isAutoCycle ? (
                <Pause className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>Auto-Cycle: {isAutoCycle ? `${autoCycleSeconds}s` : 'OFF'}</span>

              {isAutoCycle && (
                <span
                  style={{
                    fontSize: 9.5,
                    padding: '2px 6px',
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
        </div>

        {/* Right: Wall Clock + TV Screen Utility Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Wall Clock */}
          <div style={{ textAlign: 'right', minWidth: 120 }}>
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
            {/* Sync Telemetry */}
            <button
              onClick={() => fetchTelemetry()}
              title="Sync Telemetry Now"
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
                background: colors.brandRed,
                border: `1px solid ${colors.brandRed}`,
                color: '#ffffff',
                padding: '6px 13px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                boxShadow: `0 2px 8px ${colors.brandRedGlow}`,
              }}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. TV Main Telemetry Canvas ── */}
      <main
        style={{
          flex: 1,
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          maxWidth: 1920,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          opacity: isSwitching ? 0.3 : 1,
          transition: 'opacity 0.2s ease-in-out',
        }}
      >
        {/* ── Sprint North Star Banner ── */}
        <div
          style={{
            background: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 14,
            padding: '12px 18px',
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
                width: 36,
                height: 36,
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
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: colors.brandRed,
                  marginBottom: 2,
                }}
              >
                Sprint North Star Objective — {startup.name}
              </div>
              <div
                className="font-serif-italic"
                style={{
                  fontSize: 16,
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
                padding: '5px 12px',
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
                padding: '5px 12px',
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
                padding: '5px 12px',
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

        {/* ── 3. Dedicated Process & Execution Dashbar (Full Width) ── */}
        <div
          style={{
            background: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 14,
            padding: '14px 20px',
            boxShadow: `0 2px 10px rgba(0, 0, 0, ${isDark ? '0.25' : '0.04'})`,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            flexShrink: 0,
          }}
        >
          {/* Dashbar Header with Stages */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity className="w-4 h-4 text-emerald-500" />
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                Sprint Process & Execution Pipeline
              </span>
            </div>

            {/* Pipeline Stage Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Stage 1: Backlog / Todo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isDark ? '#52525b' : '#a1a1aa',
                  }}
                />
                <span style={{ color: colors.textMuted }}>Backlog (TODO):</span>
                <span style={{ fontWeight: 800, color: colors.textPrimary }}>
                  {metrics.todoTasks} ({todoPercent}%)
                </span>
              </div>

              {/* Stage 2: Active / In Progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#0284c7',
                    boxShadow: '0 0 8px #0284c7',
                  }}
                />
                <span style={{ color: colors.accentBlue, fontWeight: 600 }}>Active Execution:</span>
                <span style={{ fontWeight: 800, color: '#0284c7' }}>
                  {metrics.inProgressTasks} ({inProgressPercent}%)
                </span>
              </div>

              {/* Stage 3: Completed / Done */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#059669',
                    boxShadow: '0 0 8px #059669',
                  }}
                />
                <span style={{ color: '#059669', fontWeight: 600 }}>Delivered:</span>
                <span style={{ fontWeight: 800, color: '#059669' }}>
                  {metrics.doneTasks} ({donePercent}%)
                </span>
              </div>

              {/* Pace Target Comparison */}
              <div
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: colors.subtleCard,
                  border: `1px solid ${colors.cardBorder}`,
                  fontSize: 11,
                  color: colors.textSecondary,
                  fontWeight: 600,
                }}
              >
                Target Pace: <span style={{ color: colors.textPrimary, fontWeight: 800 }}>{sprintTargetPace}%</span>
              </div>
            </div>
          </div>

          {/* Segmented Glowing Progress Bar */}
          <div style={{ position: 'relative', width: '100%', height: 16, background: isDark ? '#1f1d18' : '#ede8d5', borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
            {/* Done Segment */}
            <div
              style={{
                width: `${donePercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                boxShadow: donePercent > 0 ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none',
                transition: 'width 0.4s ease',
              }}
              title={`Completed: ${metrics.doneTasks} tasks (${donePercent}%)`}
            />

            {/* In Progress Segment */}
            <div
              style={{
                width: `${inProgressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                boxShadow: inProgressPercent > 0 ? '0 0 12px rgba(56, 189, 248, 0.4)' : 'none',
                transition: 'width 0.4s ease',
              }}
              title={`In Progress: ${metrics.inProgressTasks} tasks (${inProgressPercent}%)`}
            />

            {/* Target Pace Marker (Dashed Line) */}
            <div
              style={{
                position: 'absolute',
                left: `${sprintTargetPace}%`,
                top: 0,
                bottom: 0,
                width: 2,
                background: '#ffffff',
                boxShadow: '0 0 6px #ffffff',
                zIndex: 10,
              }}
              title={`Sprint Pace Target: ${sprintTargetPace}%`}
            />
          </div>

          {/* Domain Readiness Trackers (Micro pills per domain) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto', paddingBottom: 2 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Functional Readiness:
            </span>
            {charts.domains.length === 0 ? (
              <span style={{ fontSize: 11, color: colors.textMuted }}>No domains configured yet</span>
            ) : (
              charts.domains.map((d) => (
                <div
                  key={d.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: colors.subtleCard,
                    border: `1px solid ${colors.cardBorder}`,
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontWeight: 700, color: colors.textPrimary }}>{d.name}</span>
                  <span
                    style={{
                      padding: '1px 5px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 800,
                      background: d.rate >= 80 ? 'rgba(5, 150, 105, 0.2)' : d.rate > 0 ? 'rgba(2, 132, 199, 0.2)' : 'rgba(109, 101, 89, 0.2)',
                      color: d.rate >= 80 ? '#059669' : d.rate > 0 ? '#0284c7' : colors.textMuted,
                    }}
                  >
                    {d.rate}% ({d.done}/{d.total})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── 4. High-Impact Big KPI Ribbon (5 Tiles) ── */}
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
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: `0 2px 8px rgba(0, 0, 0, ${isDark ? '0.2' : '0.03'})`,
            }}
          >
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Sprint Completion
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: colors.brandRed, lineHeight: 1.1, marginTop: 4 }}>
                {metrics.completionRate}%
              </div>
              <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                {metrics.doneTasks} of {metrics.totalTasks} Tasks Done
              </div>
            </div>

            {/* Circular Gauge Ring */}
            <div style={{ position: 'relative', width: 50, height: 50 }}>
              <svg width="50" height="50" viewBox="0 0 36 36">
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
              padding: '14px 16px',
              boxShadow: `0 2px 8px rgba(0, 0, 0, ${isDark ? '0.2' : '0.03'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Active Execution
              </div>
              <Clock className="w-4 h-4 text-sky-500" />
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: '#0284c7', lineHeight: 1.1, marginTop: 4 }}>
              {metrics.inProgressTasks}
            </div>
            <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
              Tasks In Progress Now
            </div>
          </div>

          {/* Tile 3: Early & On-Time Velocity */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '14px 16px',
              boxShadow: `0 2px 8px rgba(0, 0, 0, ${isDark ? '0.2' : '0.03'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Early Deliveries
              </div>
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: '#059669', lineHeight: 1.1, marginTop: 4 }}>
              {metrics.earlyCount}
            </div>
            <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
              +{metrics.onTimeCount} On-Time Completions
            </div>
          </div>

          {/* Tile 4: Domain Coverage */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '14px 16px',
              boxShadow: `0 2px 8px rgba(0, 0, 0, ${isDark ? '0.2' : '0.03'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Domain Pillars
              </div>
              <Layers className="w-4 h-4 text-purple-500" />
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: '#7c3aed', lineHeight: 1.1, marginTop: 4 }}>
              {metrics.domainsCount}
            </div>
            <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
              Functional Areas Active
            </div>
          </div>

          {/* Tile 5: Operators on Deck */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '14px 16px',
              boxShadow: `0 2px 8px rgba(0, 0, 0, ${isDark ? '0.2' : '0.03'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Startup Staff
              </div>
              <Users2 className="w-4 h-4 text-amber-500" />
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', color: '#d97706', lineHeight: 1.1, marginTop: 4 }}>
              {metrics.operatorsCount}
            </div>
            <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
              Team Members Operating
            </div>
          </div>
        </div>

        {/* ── 5. Charts Core (Burndown Trajectory AreaChart + Domain BarChart) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '62% 38%',
            gap: 14,
            flex: 1,
            minHeight: 270,
          }}
        >
          {/* Chart 1: Sprint Velocity Burndown Trajectory */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: `0 2px 10px rgba(0, 0, 0, ${isDark ? '0.25' : '0.04'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp className="w-4 h-4 text-red-500" />
                <h3 style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.2px' }}>
                  Weekly Burndown & Execution Trajectory
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11 }}>
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

            <div style={{ flex: 1, minHeight: 180, width: '100%' }}>
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
              borderRadius: 14,
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: `0 2px 10px rgba(0, 0, 0, ${isDark ? '0.25' : '0.04'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers className="w-4 h-4 text-purple-500" />
                <h3 style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.2px' }}>
                  Domain Throughput
                </h3>
              </div>
              <span style={{ fontSize: 11, color: colors.textMuted }}>Task Delivery</span>
            </div>

            <div style={{ flex: 1, minHeight: 180, width: '100%' }}>
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

        {/* ── 6. Bottom Row: Sprint Deliverables Radar + Delivery Quality Mix ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '64% 36%',
            gap: 14,
            minHeight: 170,
            flexShrink: 0,
          }}
        >
          {/* Active Deliverables Radar */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: `0 2px 10px rgba(0, 0, 0, ${isDark ? '0.2' : '0.03'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity className="w-4 h-4 text-emerald-500" />
                <h3 style={{ fontSize: 13, fontWeight: 800 }}>Sprint Deliverables Radar</h3>
              </div>
              <span style={{ fontSize: 10.5, color: colors.textMuted }}>Active Sprint Backlog</span>
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
                  maxHeight: 130,
                }}
              >
                {deliverables.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      padding: '8px 12px',
                      background: colors.subtleCard,
                      border: `1px solid ${colors.cardBorder}`,
                      borderRadius: 9,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: colors.textPrimary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {task.title}
                      </div>
                      <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 1, display: 'flex', gap: 6 }}>
                        <span style={{ color: colors.brandRed, fontWeight: 600 }}>{task.domainName}</span>
                        <span>•</span>
                        <span>{task.assigneeName}</span>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: 5,
                        fontSize: 9.5,
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

          {/* Delivery Quality Mix */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: `0 2px 10px rgba(0, 0, 0, ${isDark ? '0.2' : '0.03'})`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target className="w-4 h-4 text-sky-500" />
                <h3 style={{ fontSize: 13, fontWeight: 800 }}>Delivery Quality Mix</h3>
              </div>
              <span style={{ fontSize: 10.5, color: colors.textMuted }}>Accuracy & Pacing</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
              {/* Pie Chart */}
              <div style={{ width: 100, height: 100, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      isAnimationActive={false}
                      data={charts.quality}
                      cx="50%"
                      cy="50%"
                      innerRadius={28}
                      outerRadius={45}
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
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {charts.quality.map((item) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
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

        {/* ── 7. Bottom News & Milestones Ticker ── */}
        <div
          style={{
            background: isDark ? '#0d0c0a' : '#ede7d3',
            borderRadius: 9,
            padding: '7px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 11.5,
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
              fontSize: 10.5,
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
            {isAutoCycle
              ? `Auto-Cycle Active (${Math.round((autoCycleProgress / 100) * autoCycleSeconds)}s / ${autoCycleSeconds}s)`
              : 'Sync interval: 20s'}
          </div>
        </div>
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
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        background: 'linear-gradient(135deg, #ca2f2b 0%, #9e1f1c 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {s.name.charAt(0).toUpperCase()}
                    </div>
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
