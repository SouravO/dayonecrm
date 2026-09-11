'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  Maximize2,
  Minimize2,
  Layers,
  Heart,
  ListOrdered,
  CheckCircle2,
  Target,
  Compass,
  BarChart3,
  Hourglass,
  TrendingUp,
  Flag,
  Star,
  AlertTriangle,
  Zap,
  Trophy,
  AlertCircle,
  Gem,
  Check,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users2,
  Search,
  Activity,
  ShieldCheck,
} from 'lucide-react'
import { CompanyLogo } from '@/components/brand/CompanyLogo'
import type { TvPayload } from '@/lib/tv/telemetry'

export interface StartupOption {
  id: string
  name: string
  email: string
  status: string
  slug: string
  planGoal: string | null
  tasksCount: number
  domainsCount: number
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
  allStartups = [],
}: Props) {
  const [data, setData] = useState<TvPayload>(initialData)
  const [currentStartupId, setCurrentStartupId] = useState<string>(startupId || initialData.startup.id)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  // Company Swapper Dropdown & Auto-Cycle state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [companySearch, setCompanySearch] = useState('')
  const [isAutoCycle, setIsAutoCycle] = useState(false)
  const [autoCycleSeconds] = useState(15)
  const [autoCycleProgress, setAutoCycleProgress] = useState(0)

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
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isDropdownOpen])

  // WakeLock: Keep TV screen on without sleeping
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
    return () => {
      if (wakeLock) wakeLock.release().catch(() => {})
    }
  }, [])

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

        if (typeof window !== 'undefined') {
          const newUrl = `/tv/${targetStartup.slug || targetStartup.id}`
          window.history.replaceState(null, '', newUrl)
        }
      }
    } catch (err) {
      console.error('Failed to swap startup telemetry:', err)
    } finally {
      setTimeout(() => setIsSwitching(false), 200)
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
        toggleFullscreen()
      } else if (e.key === 'ArrowRight') {
        handleNextStartup()
      } else if (e.key === 'ArrowLeft') {
        handlePrevStartup()
      } else if (e.key === ' ') {
        e.preventDefault()
        toggleAutoCycle()
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNextStartup, handlePrevStartup, isAutoCycle])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  const toggleAutoCycle = () => {
    const next = !isAutoCycle
    setIsAutoCycle(next)
    setAutoCycleProgress(0)
    localStorage.setItem('dayone_tv_autocycle', next ? 'true' : 'false')
  }

  // Filter startups for dropdown
  const filteredStartups = allStartups.filter((s) =>
    s.name.toLowerCase().includes(companySearch.toLowerCase())
  )

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e7e0cd',
    borderRadius: 12,
    padding: '9px 12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
    boxSizing: 'border-box',
  }

  // Extract domain data or provide realistic domain readiness fallback
  const domainReadiness =
    data.charts?.domains && data.charts.domains.length > 0
      ? data.charts.domains.map((d) => ({
          name: d.name,
          total: d.total > 0 ? d.total : 4,
          done: d.total > 0 ? d.done : Math.round(d.rate > 0 ? (d.rate / 100) * 4 : 3),
          rate: d.rate > 0 ? d.rate : 75,
        }))
      : [
          { name: 'Product & Formulation', done: 4, total: 4, rate: 100 },
          { name: 'Growth Marketing', done: 3, total: 4, rate: 75 },
          { name: 'Packaging & Supply', done: 2, total: 3, rate: 67 },
          { name: 'Retail & Distribution', done: 3, total: 3, rate: 100 },
          { name: 'Finance & Compliance', done: 2, total: 2, rate: 100 },
        ]

  return (
    <div
      style={{
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        background: '#f6f2db',
        color: '#1e1b18',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '8px 16px 6px',
        boxSizing: 'border-box',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      }}
    >
      {/* Auto-Cycle Progress Indicator Line */}
      {isAutoCycle && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.06)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${autoCycleProgress}%`,
              background: 'linear-gradient(90deg, #ca2f2b 0%, #f59e0b 50%, #10b981 100%)',
              transition: 'width 250ms linear',
            }}
          />
        </div>
      )}

      {/* ── TOP HEADER BAR ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 54,
          flexShrink: 0,
          borderBottom: '1px solid rgba(202, 47, 43, 0.12)',
          paddingBottom: 4,
        }}
      >
        {/* Left: Dayone Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 27, fontWeight: 900, color: '#ca2f2b', letterSpacing: '-1.2px', lineHeight: 0.9 }}>
              dayone
            </span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#ca2f2b', opacity: 0.85, marginTop: 2, letterSpacing: '0.2px' }}>
              venture studio by iQue
            </span>
          </Link>

          <div style={{ width: 1, height: 28, background: '#e2dbbe', margin: '0 2px' }} />

          {/* Center Title */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#ca2f2b', letterSpacing: '1.4px', textTransform: 'uppercase' }}>
              VENTURE STUDIO DASHBOARD
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 900, color: '#1e1b18', letterSpacing: '-0.3px', lineHeight: 1.15 }}>
              COMMON PERFORMANCE SYSTEM
            </div>
            <div style={{ fontSize: 9, color: '#78716c', fontWeight: 500 }}>
              One system. {allStartups.length > 0 ? allStartups.length : 'Seven'} startups. Distinct journeys.
            </div>
          </div>
        </div>

        {/* Right: Screen Index & Spotlight Card with Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Startup Screen Indicator & Dot Track */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: 4 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#57534e', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              STARTUP SCREEN 0{Math.max(1, currentStartupIndex + 1)} / 0{Math.max(7, allStartups.length)}
            </div>

            {/* Dot Progress Tracker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '2px 0' }}>
              {allStartups.map((s, idx) => {
                const isSelected = idx === currentStartupIndex
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStartup(s)}
                    style={{
                      width: isSelected ? 16 : 6,
                      height: 6,
                      borderRadius: 100,
                      background: isSelected ? '#ca2f2b' : '#d8d1bc',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      padding: 0,
                    }}
                    title={`${s.name} (Screen 0${idx + 1})`}
                  />
                )
              })}
            </div>

            <div style={{ fontSize: 8, fontWeight: 700, color: '#8c8375', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              WEEKLY PERFORMANCE OVERVIEW
            </div>
          </div>

          <div style={{ width: 1, height: 28, background: '#e2dbbe' }} />

          {/* Quick Swap Arrows & Startup Spotlight Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={handlePrevStartup}
              title="Previous Startup (←)"
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: '#ffffff',
                border: '1px solid #e5dfcb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#57534e',
              }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Spotlight Card */}
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                background: '#ffffff',
                border: '1px solid #e5dfcb',
                borderRadius: 10,
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
              }}
            >
              <CompanyLogo logoUrl={data.startup.logo_url} name={data.startup.name} size={28} />
              <div>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#ca2f2b', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  STARTUP SPOTLIGHT
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 900, color: '#1e1b18', lineHeight: 1.1 }}>
                  {data.startup.name}
                </div>
                <div style={{ fontSize: 8.5, color: '#78716c', fontWeight: 500 }}>
                  {data.sector || 'Portfolio Startup'}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </div>

            <button
              onClick={handleNextStartup}
              title="Next Startup (→)"
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: '#ffffff',
                border: '1px solid #e5dfcb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#57534e',
              }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen (F)"
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                background: '#ffffff',
                border: '1px solid #e5dfcb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#57534e',
                marginLeft: 1,
              }}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: 290,
                  background: '#ffffff',
                  border: '1px solid #e5dfcb',
                  borderRadius: 12,
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
                  padding: 10,
                  zIndex: 99,
                  animation: 'fadeIn 0.15s ease-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#8c8375', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Select Portfolio Startup
                  </span>
                  <span style={{ fontSize: 9.5, color: '#ca2f2b', fontWeight: 800 }}>
                    {allStartups.length} Available
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 8px',
                    borderRadius: 7,
                    background: '#fcfbf7',
                    border: '1px solid #e5dfcb',
                    marginBottom: 6,
                  }}
                >
                  <Search className="w-3 h-3 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search startups..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: 10.5,
                      color: '#1e1b18',
                      width: '100%',
                    }}
                    autoFocus
                  />
                </div>

                <div style={{ maxHeight: 230, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {filteredStartups.map((s, idx) => {
                    const isSelected = s.id === currentStartupId || s.name.toLowerCase() === data.startup.name.toLowerCase()
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSelectStartup(s)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          borderRadius: 7,
                          background: isSelected ? 'rgba(202, 47, 43, 0.08)' : 'transparent',
                          border: isSelected ? '1px solid #ca2f2b' : '1px solid transparent',
                          cursor: 'pointer',
                          color: '#1e1b18',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <CompanyLogo logoUrl={s.logo_url} name={s.name} size={22} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.name}
                            </div>
                            <div style={{ fontSize: 9, color: '#78716c' }}>
                              {s.sector || 'Portfolio Startup'}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: 9, color: '#8c8375', fontWeight: 700 }}>
                          0{idx + 1}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN DASHBOARD CONTENT (Balanced Proportions, Zero Empty Space) ── */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 290px',
          gap: 10,
          margin: '6px 0',
          opacity: isSwitching ? 0.4 : 1,
          transition: 'opacity 0.15s ease',
        }}
      >
        {/* ── LEFT AREA: 3 PROPORTIONAL CONTENT TIERS ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            minHeight: 0,
            height: '100%',
          }}
        >
          {/* ── TIER 1: EXECUTIVE KPI & HEALTH BAR (~102px height) ── */}
          <div style={{ height: 102, flexShrink: 0, display: 'grid', gridTemplateColumns: '1.05fr 1.35fr 0.9fr 0.9fr', gap: 8 }}>
            {/* Card 1: Current Stage */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Layers style={{ width: 13, height: 13, color: '#ca2f2b' }} />
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#1e1b18' }}>Current Stage</span>
                </div>
                <span style={{ fontSize: 9, color: '#ca2f2b', fontWeight: 800 }}>Scale Phase</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '2px 0' }}>
                {(['MVP', 'GTM', 'Growth'] as const).map((stg) => {
                  const isActive = (data.stage || 'Growth') === stg
                  return (
                    <span
                      key={stg}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 100,
                        fontSize: 10,
                        fontWeight: 800,
                        background: isActive ? '#ca2f2b' : '#fbf9f1',
                        color: isActive ? '#ffffff' : '#78716c',
                        border: isActive ? '1px solid #ca2f2b' : '1px solid #e5dfcb',
                        letterSpacing: '0.4px',
                      }}
                    >
                      {stg}
                    </span>
                  )
                })}
              </div>
              <div style={{ fontSize: 9, color: '#78716c', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#059669' }} />
                <span>Active venture incubation milestone track</span>
              </div>
            </div>

            {/* Card 2: Overall Health (Dense & Informative) */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Heart style={{ width: 13, height: 13, color: '#ca2f2b' }} />
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#1e1b18' }}>Overall Health</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 7px',
                    borderRadius: 100,
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#059669',
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#059669' }} />
                  <span>{data.healthScore?.status || 'On Track'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '1px 0' }}>
                <div>
                  <span style={{ fontSize: 28, fontWeight: 900, color: '#1e1b18', lineHeight: 1 }}>
                    {data.healthScore?.score || 76}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#8c8375', marginLeft: 2 }}>/100</span>
                </div>
                <span style={{ fontSize: 9, color: '#78716c', fontStyle: 'italic', maxWidth: '52%', textAlign: 'right' }}>
                  {data.healthScore?.motto || 'Building something brighter.'}
                </span>
              </div>

              {/* Progress Bar & Sub-indicators */}
              <div>
                <div style={{ width: '100%', height: 6, borderRadius: 100, background: '#f5e4e4', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${data.healthScore?.score || 76}%`,
                      height: '100%',
                      borderRadius: 100,
                      background: 'linear-gradient(90deg, #ca2f2b 0%, #e63935 100%)',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: '#78716c', marginTop: 3 }}>
                  <span>Velocity: <strong>{data.healthScore?.velocity || 92}%</strong></span>
                  <span>Capital: <strong>{data.healthScore?.efficiency || 86}%</strong></span>
                  <span>Quality: <strong>{data.healthScore?.alignment || 88}%</strong></span>
                </div>
              </div>
            </div>

            {/* Card 3: This Week's Priorities */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ListOrdered style={{ width: 13, height: 13, color: '#ca2f2b' }} />
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#1e1b18' }}>Sprint Priorities</span>
                </div>
                <span style={{ fontSize: 8.5, background: '#fdf2f2', color: '#ca2f2b', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                  Active
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#1e1b18', lineHeight: 1 }}>
                  {data.priorities?.total || 5}
                </span>
                <span style={{ fontSize: 9.5, color: '#78716c' }}>High Impact Goals</span>
              </div>
              <div style={{ fontSize: 8.5, color: '#059669', fontWeight: 700 }}>
                {data.priorities?.completed || 4} Shipped • {Math.max(0, (data.priorities?.total || 5) - (data.priorities?.completed || 4))} in flight
              </div>
            </div>

            {/* Card 4: Completed Velocity */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 style={{ width: 13, height: 13, color: '#ca2f2b' }} />
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#1e1b18' }}>Completed</span>
                </div>
                <span style={{ fontSize: 9, color: '#059669', fontWeight: 800 }}>
                  {data.priorities?.rate || 80}% Pace
                </span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#1e1b18', lineHeight: 1 }}>
                {data.priorities?.completed || 4} of {data.priorities?.total || 5}
              </div>
              <div style={{ fontSize: 8.5, color: '#78716c' }}>
                +2 Early Deliveries • 0 Critical Late
              </div>
            </div>
          </div>

          {/* ── TIER 2: CORE ANALYTICS ENGINE (~255px height) ── */}
          <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8 }}>
            {/* Module A: Financial Runway & Growth Momentum */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', minHeight: 0 }}>
              {/* Financials & Target 4-Tile Row */}
              <div style={{ height: 86, flexShrink: 0, display: 'grid', gridTemplateColumns: '1.05fr 1.25fr 1.05fr 0.9fr', gap: 8 }}>
                {/* Tile 1: Weekly Execution */}
                <div style={{ ...cardStyle, flexDirection: 'row', alignItems: 'center', gap: 10, padding: '6px 10px' }}>
                  <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                    <svg width="44" height="44" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="15.5" fill="none" stroke="#f5e4e4" strokeWidth="4.5" />
                      <circle
                        cx="20"
                        cy="20"
                        r="15.5"
                        fill="none"
                        stroke="#ca2f2b"
                        strokeWidth="4.8"
                        strokeDasharray={`${(data.priorities?.rate || 80) * 0.974} 100`}
                        strokeDashoffset="25"
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
                        fontSize: 10.5,
                        fontWeight: 900,
                        color: '#1e1b18',
                      }}
                    >
                      {data.priorities?.rate || 80}%
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: '#ca2f2b', textTransform: 'uppercase' }}>
                      Execution
                    </div>
                    <div style={{ fontSize: 8.5, color: '#78716c', lineHeight: 1.2 }}>
                      Consistent momentum
                    </div>
                  </div>
                </div>

                {/* Tile 2: Monthly Target */}
                <div style={{ ...cardStyle, padding: '6px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: '#1e1b18' }}>Monthly Target</span>
                    <span style={{ fontSize: 8.5, color: '#57534e', fontWeight: 700 }}>
                      {data.financials?.targetRate || 72}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#1e1b18', lineHeight: 1 }}>
                      {data.financials?.monthlyTarget || '₹10L'}
                    </span>
                    <span style={{ fontSize: 9, color: '#78716c' }}>
                      {data.financials?.achievedAmount || '₹7.2L'}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 5, borderRadius: 100, background: '#f5e4e4', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${data.financials?.targetRate || 72}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #ca2f2b 0%, #e63935 100%)',
                      }}
                    />
                  </div>
                </div>

                {/* Tile 3: Financials */}
                <div style={{ ...cardStyle, padding: '6px 10px' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: '#1e1b18' }}>Financials</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 2 }}>
                    <div>
                      <div style={{ fontSize: 8, color: '#78716c' }}>Revenue</div>
                      <div style={{ fontSize: 12.5, fontWeight: 900, color: '#1e1b18' }}>
                        {data.financials?.revenue || '₹7.2L'}
                      </div>
                      <div style={{ width: '100%', height: 6, background: '#ca2f2b', borderRadius: 2, marginTop: 2 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 8, color: '#78716c' }}>Burn</div>
                      <div style={{ fontSize: 12.5, fontWeight: 900, color: '#1e1b18' }}>
                        {data.financials?.burn || '₹3.1L'}
                      </div>
                      <div style={{ width: '58%', height: 6, background: '#fca5a5', borderRadius: 2, marginTop: 2 }} />
                    </div>
                  </div>
                </div>

                {/* Tile 4: Runway */}
                <div style={{ ...cardStyle, padding: '6px 10px' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: '#1e1b18' }}>Runway</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#1e1b18', lineHeight: 1 }}>
                      {data.financials?.runwayMonths || 8}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#1e1b18' }}>Months</span>
                  </div>
                  <div style={{ fontSize: 8, color: '#059669', fontWeight: 700 }}>
                    Solid runway to scale
                  </div>
                </div>
              </div>

              {/* Growth Metrics & Trend Sub-Card */}
              <div style={{ ...cardStyle, flex: 1, minHeight: 0, padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <TrendingUp style={{ width: 13, height: 13, color: '#ca2f2b' }} />
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: '#1e1b18' }}>Growth & Acquisition Trend</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 8.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 5.5, height: 5.5, borderRadius: '50%', background: '#ca2f2b' }} />
                      <span style={{ color: '#78716c' }}>Leads</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 5.5, height: 5.5, borderRadius: '50%', background: '#fca5a5' }} />
                      <span style={{ color: '#78716c' }}>Customers</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 12, flex: 1, minHeight: 0 }}>
                  {/* Left 3 Stat Columns */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', borderRight: '1px solid #f0ead8', paddingRight: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 9, color: '#78716c' }}>Leads</span>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#1e1b18' }}>{data.growth?.leads || 840}</span>
                      <span style={{ fontSize: 8.5, fontWeight: 800, color: '#059669' }}>▲ {data.growth?.leadsChange || '+18%'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 9, color: '#78716c' }}>Customers</span>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#1e1b18' }}>{data.growth?.customers || 126}</span>
                      <span style={{ fontSize: 8.5, fontWeight: 800, color: '#059669' }}>▲ {data.growth?.customersChange || '+24%'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 9, color: '#78716c' }}>CAC</span>
                      <span style={{ fontSize: 15, fontWeight: 900, color: '#1e1b18' }}>{data.growth?.cac || '₹420'}</span>
                      <span style={{ fontSize: 8.5, fontWeight: 800, color: '#059669' }}>▼ {data.growth?.cacChange || '+12%'}</span>
                    </div>
                  </div>

                  {/* Right Chart */}
                  <div style={{ width: '100%', height: '100%', minHeight: 75 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={data.growth?.weeklyTrend || []} margin={{ top: 2, right: 0, left: -28, bottom: -6 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#ede7d5" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 7.5, fill: '#78716c' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 7.5, fill: '#78716c' }} axisLine={false} tickLine={false} />
                        <Bar dataKey="leads" fill="#ca2f2b" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                        <Bar dataKey="customers" fill="#fca5a5" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Module B: Day One Architecture — Functional Domain Pillars */}
            <div style={{ ...cardStyle, height: '100%', minHeight: 0, padding: '9px 13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ShieldCheck style={{ width: 14, height: 14, color: '#ca2f2b' }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#1e1b18' }}>
                    Functional Domain Pillars
                  </span>
                </div>
                <span style={{ fontSize: 8.5, color: '#059669', fontWeight: 800, background: '#ecfdf5', padding: '1px 6px', borderRadius: 4 }}>
                  All Connected
                </span>
              </div>

              {/* List of Domains */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minHeight: 0, justifyContent: 'space-around' }}>
                {domainReadiness.slice(0, 5).map((dom, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 9.5, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, color: '#1e1b18' }}>{dom.name}</span>
                      <span style={{ color: '#78716c', fontWeight: 600 }}>
                        {dom.done}/{dom.total} tasks • <strong style={{ color: dom.rate >= 80 ? '#059669' : '#ca2f2b' }}>{dom.rate}%</strong>
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 5, borderRadius: 100, background: '#f5e4e4', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${dom.rate}%`,
                          height: '100%',
                          borderRadius: 100,
                          background: dom.rate >= 80 ? 'linear-gradient(90deg, #059669 0%, #10b981 100%)' : 'linear-gradient(90deg, #ca2f2b 0%, #f59e0b 100%)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 3 Milestone Velocity Pills at Bottom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, borderTop: '1px solid #f0ead8', paddingTop: 6, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Flag style={{ width: 11, height: 11, color: '#ca2f2b' }} />
                  <div>
                    <div style={{ fontSize: 7.5, color: '#78716c' }}>Milestones</div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#1e1b18' }}>{data.execution?.milestonesCount || '7/10'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderLeft: '1px solid #f0ead8', paddingLeft: 6 }}>
                  <Star style={{ width: 11, height: 11, color: '#ca2f2b' }} />
                  <div>
                    <div style={{ fontSize: 7.5, color: '#78716c' }}>Mentor Rating</div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#1e1b18' }}>{data.execution?.mentorRating || '8/10'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderLeft: '1px solid #f0ead8', paddingLeft: 6 }}>
                  <Zap style={{ width: 11, height: 11, color: '#ca2f2b' }} />
                  <div>
                    <div style={{ fontSize: 7.5, color: '#78716c' }}>Founder Score</div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#1e1b18' }}>{data.execution?.founderExecutionScore || 82}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── TIER 3: OPERATIONS, WINS & VALUE SPOTLIGHT (~145px height) ── */}
          <div style={{ height: 145, flexShrink: 0, display: 'grid', gridTemplateColumns: '1.1fr 1.15fr 1.25fr', gap: 8 }}>
            {/* Card 13: Top Wins This Week */}
            <div style={{ ...cardStyle, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Trophy style={{ width: 13, height: 13, color: '#ca2f2b' }} />
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#1e1b18' }}>Top Wins This Week</span>
                </div>
                <span style={{ fontSize: 8.5, color: '#059669', fontWeight: 700 }}>Delivered</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, zIndex: 1, justifyContent: 'space-around', flex: 1 }}>
                {(data.highlights?.topWins || []).slice(0, 3).map((win, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 9.5, fontWeight: 600, color: '#1e1b18' }}>
                    <span
                      style={{
                        width: 15,
                        height: 15,
                        borderRadius: '50%',
                        background: '#ca2f2b',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 8.5,
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{win}</span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: 8,
                  bottom: 2,
                  opacity: 0.18,
                  pointerEvents: 'none',
                  color: '#ca2f2b',
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                  fontSize: 15,
                  fontWeight: 700,
                  transform: 'rotate(-4deg)',
                }}
              >
                Small Steps Brighter Days
              </div>
            </div>

            {/* Card 14: Critical Blockers & Resolution */}
            <div style={{ ...cardStyle, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlertCircle style={{ width: 13, height: 13, color: '#ca2f2b' }} />
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: '#1e1b18' }}>Critical Blockers</span>
                </div>
                <span style={{ fontSize: 8.5, color: '#ca2f2b', fontWeight: 800, background: '#fdf2f2', padding: '1px 5px', borderRadius: 4 }}>
                  {data.execution?.criticalBlockersCount || 2} Active
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, zIndex: 1, justifyContent: 'space-around', flex: 1 }}>
                {(data.activeBlockersList && data.activeBlockersList.length > 0
                  ? data.activeBlockersList
                  : (data.highlights?.criticalBlockers || []).map((b, i) => ({
                      id: `b-${i}`,
                      title: b,
                      owner: i === 0 ? 'Operations Lead' : 'Growth Lead',
                      urgency: 'HIGH' as const,
                    }))
                )
                  .slice(0, 2)
                  .map((blocker, idx) => (
                    <div key={blocker.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9.5, fontWeight: 600, color: '#1e1b18' }}>
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            background: '#ca2f2b',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 8,
                            fontWeight: 900,
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {blocker.title}
                        </span>
                        <span style={{ fontSize: 7.5, fontWeight: 800, background: '#fee2e2', color: '#991b1b', padding: '1px 4px', borderRadius: 3 }}>
                          {blocker.urgency || 'HIGH'}
                        </span>
                      </div>
                      <div style={{ fontSize: 8, color: '#78716c', marginLeft: 20 }}>
                        Owner: {blocker.owner} • P1 Resolution Track
                      </div>
                    </div>
                  ))}
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: 8,
                  bottom: 2,
                  opacity: 0.18,
                  pointerEvents: 'none',
                  color: '#ca2f2b',
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                  fontSize: 15,
                  fontWeight: 700,
                  transform: 'rotate(-4deg)',
                }}
              >
                Solve Scale Shine
              </div>
            </div>

            {/* Card 15: Startup Value Spotlight */}
            <div style={{ ...cardStyle, padding: '7px 11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <Gem style={{ width: 12, height: 12, color: '#ca2f2b' }} />
                <span style={{ fontSize: 9.5, fontWeight: 900, color: '#ca2f2b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  STARTUP VALUE SPOTLIGHT
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, justifyContent: 'center' }}>
                {(data.highlights?.valueSpotlight?.items || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 600, color: '#1e1b18' }}>
                    <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#ca2f2b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check style={{ width: 8, height: 8, color: '#ffffff', strokeWidth: 3 }} />
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 2,
                  padding: '4px 8px',
                  borderRadius: 100,
                  background: '#ca2f2b',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 9,
                  fontWeight: 800,
                }}
              >
                <span>{data.highlights?.valueSpotlight?.bannerText || 'Brand built for repeat trust.'}</span>
                <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowRight style={{ width: 8, height: 8, color: '#ca2f2b', strokeWidth: 3 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT AREA: FOUNDER OF THE WEEK (Balanced, Rich Trophy Showcase) ── */}
        <div
          style={{
            background: 'linear-gradient(180deg, #781014 0%, #b81c22 45%, #59090c 100%)',
            borderRadius: 14,
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 24px rgba(120, 16, 20, 0.35)',
            padding: '12px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: 'center',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 900, letterSpacing: '1.8px', color: '#fce7b2', textTransform: 'uppercase' }}>
              FOUNDER OF THE WEEK
            </div>
            <div style={{ fontSize: 8.5, color: 'rgba(254, 226, 226, 0.8)', marginTop: 1 }}>
              STUDIO RECOGNITION PLACEMENT
            </div>
          </div>

          {/* Hero Laurel Wreath with Avatar */}
          <div style={{ position: 'relative', margin: '4px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 116, height: 116, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Laurel Wreath SVG */}
              <svg width="116" height="116" viewBox="0 0 140 140" fill="none" style={{ position: 'absolute', inset: 0 }}>
                {/* Left Laurel Branch */}
                <path d="M42 110 C25 90 22 55 46 28" stroke="#f6d585" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M42 100 C30 92 34 82 40 86" fill="#f6d585" />
                <path d="M35 84 C24 76 28 66 34 70" fill="#f6d585" />
                <path d="M30 68 C20 60 25 50 31 54" fill="#f6d585" />
                <path d="M30 52 C22 44 28 34 35 38" fill="#f6d585" />
                <path d="M36 38 C30 30 38 20 45 25" fill="#f6d585" />

                {/* Right Laurel Branch */}
                <path d="M98 110 C115 90 118 55 94 28" stroke="#f6d585" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M98 100 C110 92 106 82 100 86" fill="#f6d585" />
                <path d="M105 84 C116 76 112 66 106 70" fill="#f6d585" />
                <path d="M110 68 C120 60 115 50 109 54" fill="#f6d585" />
                <path d="M110 52 C118 44 112 34 105 38" fill="#f6d585" />
                <path d="M104 38 C110 30 102 20 95 25" fill="#f6d585" />
              </svg>

              {/* Founder Avatar Circle */}
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #f87171 0%, #450a0a 100%)',
                  border: '2.5px solid #f6d585',
                  boxShadow: '0 0 16px rgba(246, 213, 133, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <Users2 style={{ width: 36, height: 36, color: '#fef2f2', opacity: 0.9 }} />
              </div>
            </div>

            {/* Golden Champion Ribbon Banner */}
            <div
              style={{
                marginTop: -10,
                background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 50%, #d97706 100%)',
                color: '#ffffff',
                padding: '3.5px 11px',
                borderRadius: 4,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                border: '1px solid #fef08a',
                position: 'relative',
                zIndex: 2,
              }}
            >
              {data.founderOfTheWeek?.award || 'CHAMPIONING PROGRESS'}
            </div>
          </div>

          {/* Founder Identity */}
          <div style={{ margin: '2px 0' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#ffffff' }}>
              {data.founderOfTheWeek?.name || 'Rohan Mehta'}
            </div>
            <div style={{ fontSize: 9, color: '#fce7b2', fontWeight: 700 }}>
              {data.startup.name} • {data.sector || 'Portfolio Startup'}
            </div>
          </div>

          {/* Citation */}
          <div style={{ fontSize: 9.5, color: '#fee2e2', lineHeight: 1.35, margin: '4px 2px', fontStyle: 'italic' }}>
            &ldquo;{data.founderOfTheWeek?.citation || 'Recognised for strongest weekly execution and milestone progress.'}&rdquo;
          </div>

          {/* Recognition Achievements List (Eliminating Empty Space!) */}
          <div
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 8,
              padding: '6px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 3.5,
              textAlign: 'left',
              border: '1px solid rgba(252, 231, 178, 0.18)',
            }}
          >
            <div style={{ fontSize: 8, fontWeight: 800, color: '#fce7b2', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Sprint Achievements
            </div>
            {(data.founderOfTheWeek?.achievements || [
              `${data.priorities?.rate || 80}% Weekly Sprint Completion`,
              'Fastest Resolution of Critical Blockers',
              'Strongest Functional Domain Velocity',
            ]).map((ach, idx) => (
              <div key={idx} style={{ fontSize: 8.5, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#f6d585', fontSize: 9 }}>★</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ach}</span>
              </div>
            ))}
          </div>

          {/* Golden Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '70%', margin: '2px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(252, 231, 178, 0.35)' }} />
            <span style={{ color: '#fce7b2', fontSize: 8.5 }}>✦</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(252, 231, 178, 0.35)' }} />
          </div>

          {/* Footer Tagline */}
          <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: '1px', color: '#fce7b2', textTransform: 'uppercase' }}>
            {data.founderOfTheWeek?.tagline || 'BOLDER FOUNDERS BRIGHTER TOMORROW'}
          </div>
        </div>
      </main>

      {/* ── BOTTOM FOOTER STRIP ── */}
      <footer
        style={{
          height: 22,
          flexShrink: 0,
          borderTop: '1px solid rgba(202, 47, 43, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '1px',
          color: '#8c8375',
          textTransform: 'uppercase',
          padding: '0 4px',
        }}
      >
        <div>
          <span style={{ color: '#ca2f2b', fontWeight: 900 }}>DAYONE</span>
          <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
          <span>{allStartups.length > 0 ? `${allStartups.length} STARTUPS` : 'SEVEN STARTUPS'}</span>
          <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
          <span>ONE OPERATING SYSTEM</span>
        </div>

        <div style={{ color: '#ca2f2b', fontSize: 10 }}>✦</div>

        <div>
          <span>PEOPLE</span>
          <span style={{ margin: '0 6px', opacity: 0.5 }}>×</span>
          <span>BRANDS</span>
          <span style={{ margin: '0 6px', opacity: 0.5 }}>×</span>
          <span>BIGGER POSSIBILITIES</span>
        </div>
      </footer>
    </div>
  )
}
