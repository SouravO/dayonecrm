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
  initialTheme?: 'dark' | 'cream'
  allStartups?: StartupOption[]
}

export function CompanyTvDisplay({
  initialData,
  startupId,
  initialTheme = 'cream',
  allStartups = [],
}: Props) {
  const [data, setData] = useState<TvPayload>(initialData)
  const [currentStartupId, setCurrentStartupId] = useState<string>(startupId || initialData.startup.id)
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

  // Signature Warm Light Cream Theme Palette
  const colors = {
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
    ON_TRACK: { label: 'ON TRACK', bg: '#0369a1', color: '#ffffff' },
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

  const activeStartupObj = allStartups.find((s) => s.id === currentStartupId || s.name.toLowerCase() === startup.name.toLowerCase())
  const activeLogoUrl = activeStartupObj?.logo_url || (startup as any).logo_url

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

      {/* ── 1. TV Executive Header Bar ── */}
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
        {/* Left: Studio Branding + Company Selector with Swapping Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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

          <div style={{ height: 26, width: 1, background: colors.cardBorder }} />

          {/* Company Identity & Swap Dropdown Trigger */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                  padding: '4px 12px 4px 6px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  color: colors.textPrimary,
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
              >
                <CompanyLogo
                  logoUrl={activeLogoUrl}
                  name={startup.name}
                  size={32}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.2px' }}>
                      {startup.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </div>
                  <div style={{ fontSize: 10, color: colors.accentGreen, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                    <span>{startup.status}</span>
                    <span style={{ color: colors.textMuted }}>• Swap Company</span>
                  </div>
                </div>
              </button>

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

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
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
                          padding: '7px 10px',
                          borderRadius: 8,
                          background: isSelected ? 'rgba(202, 47, 43, 0.08)' : 'transparent',
                          border: isSelected ? `1px solid ${colors.brandRed}` : '1px solid transparent',
                          cursor: 'pointer',
                          color: colors.textPrimary,
                          textAlign: 'left',
                          width: '100%',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <CompanyLogo
                            logoUrl={s.logo_url}
                            name={s.name}
                            size={26}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              padding: '5px 14px',
              borderRadius: 100,
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
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
                background: isAutoCycle ? '#fee2e2' : colors.cardBg,
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
                <Pause className="w-3.5 h-3.5 text-red-500" />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Wall Clock */}
          <div style={{ textAlign: 'right', minWidth: 120 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: colors.textPrimary,
                letterSpacing: '0.8px',
                lineHeight: 1.1,
              }}
            >
              {clock || '12:00:00'}
            </div>
            <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>
              {clockDate}
            </div>
          </div>

          <div style={{ height: 26, width: 1, background: colors.cardBorder }} />

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Manual Sync Telemetry */}
            <button
              onClick={() => fetchTelemetry()}
              title="Force Sync Live Telemetry"
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
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-500' : ''}`} />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen TV Mode (F)'}
              style={{
                background: colors.brandRed,
                border: 'none',
                color: '#ffffff',
                height: 32,
                padding: '0 12px',
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
        {/* ── Sprint North Star Banner ── */}
        <div
          style={{
            background: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: 14,
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CompanyLogo
                logoUrl={activeLogoUrl}
                name={startup.name}
                size={36}
              />
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
                  fontSize: 15,
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
                padding: '4px 12px',
                borderRadius: 8,
                background: statusBadgeConfig.bg,
                color: statusBadgeConfig.color,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            >
              {statusBadgeConfig.label}
            </div>

            <div
              style={{
                padding: '4px 12px',
                borderRadius: 8,
                background: colors.subtleCard,
                border: `1px solid ${colors.cardBorder}`,
                fontSize: 11.5,
                fontWeight: 600,
                color: colors.textSecondary,
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
            padding: '12px 18px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flexShrink: 0,
          }}
        >
          {/* Dashbar Header with Stages */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity className="w-4 h-4 text-emerald-500" />
              <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                Sprint Process & Execution Pipeline
              </span>
            </div>

            {/* Pipeline Stage Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Stage 1: Backlog / Todo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#a1a1aa',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
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
                  fontSize: 10.5,
                  color: colors.textSecondary,
                  fontWeight: 600,
                }}
              >
                Target Pace: <span style={{ color: colors.textPrimary, fontWeight: 800 }}>{sprintTargetPace}%</span>
              </div>
            </div>
          </div>

          {/* Continuous Multi-Segment Process Bar */}
          <div
            style={{
              height: 12,
              borderRadius: 6,
              background: '#ede7cf',
              display: 'flex',
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.08)',
              position: 'relative',
            }}
          >
            {/* Done Segment */}
            {donePercent > 0 && (
              <div
                style={{
                  width: `${donePercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
                  transition: 'width 0.4s ease',
                }}
                title={`Delivered: ${donePercent}%`}
              />
            )}

            {/* In Progress Segment */}
            {inProgressPercent > 0 && (
              <div
                style={{
                  width: `${inProgressPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                  transition: 'width 0.4s ease',
                }}
                title={`Active: ${inProgressPercent}%`}
              />
            )}

            {/* Todo / Backlog Segment */}
            {todoPercent > 0 && (
              <div
                style={{
                  width: `${todoPercent}%`,
                  height: '100%',
                  background: '#d5ceb3',
                  transition: 'width 0.4s ease',
                }}
                title={`Backlog: ${todoPercent}%`}
              />
            )}
          </div>

          {/* Functional Domain Readiness Footnote */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: colors.textMuted }}>
            <div>
              <span style={{ fontWeight: 700, color: colors.textSecondary }}>FUNCTIONAL READINESS: </span>
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
          {/* Tile 1: Sprint Completion Percentage */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '12px 16px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Sprint Completion
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', color: colors.brandRed, lineHeight: 1.1, marginTop: 3 }}>
                {metrics.completionRate}%
              </div>
              <div style={{ fontSize: 10.5, color: colors.textSecondary, marginTop: 3 }}>
                {metrics.doneTasks} of {metrics.totalTasks} Tasks Done
              </div>
            </div>

            {/* Circular Progress Ring */}
            <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
              <svg width="44" height="44" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#ede7cf"
                  strokeWidth="3.8"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={colors.brandRed}
                  strokeWidth="3.8"
                  strokeDasharray={`${metrics.completionRate}, 100`}
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
              padding: '12px 16px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Active Execution
              </div>
              <Clock className="w-4 h-4 text-sky-500" />
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1px', color: '#0284c7', lineHeight: 1.1, marginTop: 3 }}>
              {metrics.inProgressTasks}
            </div>
            <div style={{ fontSize: 10.5, color: colors.textSecondary, marginTop: 3 }}>
              Tasks In Progress Now
            </div>
          </div>

          {/* Tile 3: Early & On-Time Velocity */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '12px 16px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Early Deliveries
              </div>
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1px', color: '#059669', lineHeight: 1.1, marginTop: 3 }}>
              {metrics.earlyCount}
            </div>
            <div style={{ fontSize: 10.5, color: colors.textSecondary, marginTop: 3 }}>
              +{metrics.onTimeCount} On-Time Completions
            </div>
          </div>

          {/* Tile 4: Domain Coverage */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '12px 16px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Domain Pillars
              </div>
              <Layers className="w-4 h-4 text-purple-500" />
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1px', color: '#7c3aed', lineHeight: 1.1, marginTop: 3 }}>
              {metrics.domainsCount}
            </div>
            <div style={{ fontSize: 10.5, color: colors.textSecondary, marginTop: 3 }}>
              Functional Areas Active
            </div>
          </div>

          {/* Tile 5: Operators on Deck */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '12px 16px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Startup Staff
              </div>
              <Users2 className="w-4 h-4 text-amber-500" />
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1px', color: '#d97706', lineHeight: 1.1, marginTop: 3 }}>
              {metrics.operatorsCount}
            </div>
            <div style={{ fontSize: 10.5, color: colors.textSecondary, marginTop: 3 }}>
              Team Members Operating
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
              borderRadius: 14,
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              minHeight: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp className="w-4 h-4 text-red-500" />
                <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.2px' }}>
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

            <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.burndown} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tvRedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.brandRed} stopOpacity={0.25} />
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
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              minHeight: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers className="w-4 h-4 text-purple-500" />
                <h3 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.2px' }}>
                  Domain Throughput
                </h3>
              </div>
              <span style={{ fontSize: 10.5, color: colors.textMuted }}>Task Delivery</span>
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
                    <Bar isAnimationActive={false} dataKey="done" name="Completed" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar isAnimationActive={false} dataKey="inProgress" name="Active" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar isAnimationActive={false} dataKey="todo" name="Backlog" fill="#d5ceb3" radius={[4, 4, 0, 0]} />
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
            gridTemplateColumns: '62% 38%',
            gap: 12,
            height: '24%',
            minHeight: 140,
            flexShrink: 0,
          }}
        >
          {/* Active Deliverables Radar */}
          <div
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: 14,
              padding: '12px 18px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              minHeight: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity className="w-4 h-4 text-emerald-500" />
                <h3 style={{ fontSize: 12.5, fontWeight: 800 }}>Sprint Deliverables Radar</h3>
              </div>
              <span style={{ fontSize: 10.5, color: colors.textMuted }}>Active Sprint Backlog</span>
            </div>

            {deliverables.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: colors.textMuted, fontSize: 12 }}>
                No deliverables registered for current weekly sprint
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
                {deliverables.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      padding: '7px 10px',
                      background: colors.subtleCard,
                      border: `1px solid ${colors.cardBorder}`,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: colors.textPrimary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {task.title}
                      </div>
                      <div style={{ fontSize: 9.5, color: colors.textMuted, marginTop: 1, display: 'flex', gap: 6 }}>
                        <span style={{ color: colors.brandRed, fontWeight: 600 }}>{task.domainName}</span>
                        <span>•</span>
                        <span>{task.assigneeName}</span>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 5,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          task.status === 'DONE'
                            ? '#ecfdf5'
                            : task.status === 'IN_PROGRESS'
                            ? '#f0f9ff'
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
              padding: '12px 18px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              minHeight: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target className="w-4 h-4 text-sky-500" />
                <h3 style={{ fontSize: 12.5, fontWeight: 800 }}>Delivery Quality Mix</h3>
              </div>
              <span style={{ fontSize: 10, color: colors.textMuted }}>Accuracy & Pacing</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minHeight: 0 }}>
              {/* Pie Chart */}
              <div style={{ width: 90, height: 90, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      isAnimationActive={false}
                      data={charts.quality}
                      cx="50%"
                      cy="50%"
                      innerRadius={24}
                      outerRadius={40}
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
            background: '#ede7d3',
            borderRadius: 9,
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 11,
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
              fontSize: 10,
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

          <div style={{ fontSize: 10, color: colors.textMuted, flexShrink: 0 }}>
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
