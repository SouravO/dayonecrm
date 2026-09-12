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
  Search,
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

  // Clear legacy dark mode preference and restore auto-cycle preference
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

  // WakeLock: Keep TV screen awake
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

  // Auto-Cycle Timer
  useEffect(() => {
    if (!isAutoCycle || allStartups.length <= 1) {
      setAutoCycleProgress(0)
      return
    }

    const intervalMs = 100
    const step = 100 / (autoCycleSeconds * (1000 / intervalMs))

    const timer = setInterval(() => {
      setAutoCycleProgress((prev) => {
        if (prev >= 100) {
          handleNextStartup()
          return 0
        }
        return prev + step
      })
    }, intervalMs)

    return () => clearInterval(timer)
  }, [isAutoCycle, autoCycleSeconds, allStartups.length, handleNextStartup])

  const toggleAutoCycle = () => {
    const next = !isAutoCycle
    setIsAutoCycle(next)
    setAutoCycleProgress(0)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dayone_tv_autocycle', String(next))
    }
  }

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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNextStartup()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrevStartup()
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        toggleFullscreen()
      } else if (e.key === ' ') {
        e.preventDefault()
        toggleAutoCycle()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNextStartup, handlePrevStartup])

  const filteredStartups = allStartups.filter((s) =>
    s.name.toLowerCase().includes(companySearch.toLowerCase()) ||
    (s.sector && s.sector.toLowerCase().includes(companySearch.toLowerCase()))
  )

  // Card base styles with true TV vertical density
  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    borderRadius: 14,
    border: '1px solid rgba(220, 210, 195, 0.75)',
    boxShadow: '0 4px 16px -2px rgba(160, 130, 110, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 30%, #fffdfa 0%, #f7f0e3 60%, #eee2cf 100%)',
        color: '#1e1b18',
        fontFamily: "'Plus Jakarta Sans', var(--font-sans), sans-serif",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '12px 20px 8px 20px',
        boxSizing: 'border-box',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* ── AMBIENT 3D LIQUID ACCENTS (EXACT MATCH TO REFERENCE DESIGN) ── */}
      {/* Top Left Subtle Liquid Curve */}
      <svg
        width="260"
        height="180"
        viewBox="0 0 260 180"
        fill="none"
        style={{
          position: 'absolute',
          top: -20,
          left: -20,
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.5,
        }}
      >
        <path
          d="M-20 0 C40 40 80 120 240 70 C160 160 40 180 -20 120 Z"
          fill="url(#ambientRedGrad1)"
        />
        <defs>
          <linearGradient id="ambientRedGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ca2f2b" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#fca5a5" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Bottom Right Glowing Glass Orb & Liquid Swirl */}
      <svg
        width="280"
        height="220"
        viewBox="0 0 280 220"
        fill="none"
        style={{
          position: 'absolute',
          bottom: -30,
          right: -20,
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.6,
        }}
      >
        <path
          d="M40 220 C90 140 180 130 280 170 C240 220 160 230 40 220 Z"
          fill="url(#ambientRedGrad2)"
        />
        <circle cx="210" cy="150" r="42" fill="url(#orbGrad)" />
        <circle cx="195" cy="135" r="14" fill="#ffffff" fillOpacity="0.55" />
        <defs>
          <radialGradient id="orbGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fecaca" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#ca2f2b" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#781014" stopOpacity="0.85" />
          </radialGradient>
          <linearGradient id="ambientRedGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ca2f2b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fecaca" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>

      {/* ── HEADER ── */}
      <header
        style={{
          height: 56,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          position: 'relative',
        }}
      >
        {/* Left: Brand Identity & Subtitles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              lineHeight: 0.95,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span
                style={{
                  fontSize: 38,
                  fontWeight: 900,
                  color: '#9e1820',
                  letterSpacing: '-1.4px',
                  fontFamily: "'Plus Jakarta Sans', var(--font-sans), sans-serif",
                }}
              >
                dayone
              </span>
            </div>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: '#9e1820',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                letterSpacing: '0.2px',
                marginTop: 2,
              }}
            >
              venture studio by iQue
            </span>
          </Link>

          <div style={{ width: 1, height: 42, background: '#dcd2bd' }} />

          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: '#9e1820',
                letterSpacing: '1.8px',
                textTransform: 'uppercase',
              }}
            >
              VENTURE STUDIO DASHBOARD
            </div>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: '#26221f',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                lineHeight: 1.15,
              }}
            >
              COMMON PERFORMANCE SYSTEM
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: '#736b5e',
                fontWeight: 500,
              }}
            >
              One system. Seven startups. Distinct journeys.
            </div>
          </div>
        </div>

        {/* Right: Startup Screen Dots & Spotlight Card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#4a443a',
                letterSpacing: '0.9px',
                textTransform: 'uppercase',
              }}
            >
              STARTUP SCREEN 0{Math.max(1, currentStartupIndex + 1)} / 0{Math.max(7, allStartups.length)}
            </div>

            {/* 7-Dot Timeline Progress Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {Array.from({ length: Math.max(7, allStartups.length) }).map((_, idx) => {
                const targetStartup = allStartups[idx]
                const isSelected = idx === currentStartupIndex
                return (
                  <button
                    key={idx}
                    onClick={() => targetStartup && handleSelectStartup(targetStartup)}
                    disabled={!targetStartup}
                    style={{
                      width: isSelected ? 22 : 7.5,
                      height: 7.5,
                      borderRadius: 100,
                      background: isSelected ? '#9e1820' : '#dcd2bd',
                      border: 'none',
                      cursor: targetStartup ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      padding: 0,
                    }}
                    title={targetStartup ? `${targetStartup.name} (Screen 0${idx + 1})` : `Screen 0${idx + 1}`}
                  />
                )
              })}
            </div>

            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#8c8270',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
              }}
            >
              WEEKLY PERFORMANCE OVERVIEW
            </div>
          </div>

          <div style={{ width: 1, height: 36, background: '#dcd2bd' }} />

          {/* Quick Swap Arrows & Spotlight Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={handlePrevStartup}
              title="Previous Startup (←)"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #dcd2bd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#4a443a',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Spotlight Card */}
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                background: '#ffffff',
                border: '1px solid #dcd2bd',
                borderRadius: 12,
                padding: '5px 14px 5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
              }}
            >
              <CompanyLogo logoUrl={data.startup.logo_url} name={data.startup.name} size={34} />
              <div>
                <div
                  style={{
                    fontSize: 8.5,
                    fontWeight: 900,
                    color: '#9e1820',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                  }}
                >
                  STARTUP SPOTLIGHT
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 900, color: '#9e1820', lineHeight: 1.1 }}>
                  {data.startup.name}
                </div>
                <div style={{ fontSize: 10, color: '#736b5e', fontWeight: 600 }}>
                  {data.sector || 'Skincare / Beauty Tech'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </div>

            <button
              onClick={handleNextStartup}
              title="Next Startup (→)"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #dcd2bd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#4a443a',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F)'}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: '#ffffff',
                border: '1px solid #dcd2bd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#4a443a',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                marginLeft: 2,
              }}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Startup Swapper Dropdown */}
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  width: 270,
                  background: '#ffffff',
                  border: '1px solid #dcd2bd',
                  borderRadius: 12,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                  padding: 10,
                  zIndex: 99,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 900, color: '#8c8270', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Select Portfolio Startup
                  </span>
                  <span style={{ fontSize: 10, color: '#9e1820', fontWeight: 800 }}>
                    {allStartups.length} Available
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 9px',
                    borderRadius: 8,
                    background: '#fcfbf7',
                    border: '1px solid #dcd2bd',
                    marginBottom: 6,
                  }}
                >
                  <Search className="w-3.5 h-3.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search startups..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: 11,
                      color: '#1e1b18',
                      width: '100%',
                    }}
                    autoFocus
                  />
                </div>

                <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                          padding: '7px 9px',
                          borderRadius: 8,
                          background: isSelected ? 'rgba(158, 24, 32, 0.08)' : 'transparent',
                          border: isSelected ? '1px solid #9e1820' : '1px solid transparent',
                          cursor: 'pointer',
                          color: '#1e1b18',
                          textAlign: 'left',
                          width: '100%',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <CompanyLogo logoUrl={s.logo_url} name={s.name} size={24} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {s.name}
                            </div>
                            <div style={{ fontSize: 9.5, color: '#736b5e' }}>
                              {s.sector || 'Portfolio Startup'}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: 9.5, color: '#8c8270', fontWeight: 700 }}>
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

      {/* ── MAIN 4-ROW + HERO GRID ── */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: 12,
          margin: '8px 0',
          opacity: isSwitching ? 0.35 : 1,
          transition: 'opacity 0.15s ease',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ── LEFT COLUMN: 4 EQUALLY BALANCED HORIZONTAL ROWS ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            height: '100%',
            minHeight: 0,
          }}
        >
          {/* ══════════════════════════════════════════════════════════
              ROW 1 (Height: ~18%): 4 Cards
              Current Stage | Overall Health | Sprint Priorities | Completed
             ══════════════════════════════════════════════════════════ */}
          <div
            style={{
              height: '18%',
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: '1.15fr 1.6fr 1.05fr 1.1fr',
              gap: 10,
            }}
          >
            {/* Card 1.1: Current Stage */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers style={{ width: 16, height: 16, color: '#9e1820' }} />
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1e1b18' }}>Current Stage</span>
              </div>

              {/* Centered Segmented Pill Selector: MVP | GTM | Growth */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f8f5ed',
                    borderRadius: 100,
                    padding: '4px 6px',
                    border: '1px solid #e8e2d4',
                    justifyContent: 'space-between',
                  }}
                >
                  {(['MVP', 'GTM', 'Growth'] as const).map((stg) => {
                    const isActive = (data.stage || 'Growth') === stg
                    return (
                      <div
                        key={stg}
                        style={{
                          padding: '6px 20px',
                          borderRadius: 100,
                          fontSize: 12.5,
                          fontWeight: 800,
                          background: isActive ? '#9e1820' : 'transparent',
                          color: isActive ? '#ffffff' : '#736b5e',
                          boxShadow: isActive ? '0 2px 8px rgba(158, 24, 32, 0.3)' : 'none',
                          letterSpacing: '0.4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {stg}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Card 1.2: Overall Health */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Heart style={{ width: 16, height: 16, color: '#9e1820' }} />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1e1b18' }}>Overall Health</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#059669',
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669' }} />
                  <span>{data.healthScore?.status || 'On Track'}</span>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 44, fontWeight: 900, color: '#1e1b18', lineHeight: 1 }}>
                      {data.healthScore?.score || 76}
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#8c8270', marginLeft: 3 }}>/100</span>
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: '#736b5e',
                      fontStyle: 'italic',
                      fontFamily: 'var(--font-serif)',
                      maxWidth: '55%',
                      textAlign: 'right',
                      lineHeight: 1.25,
                    }}
                  >
                    {data.healthScore?.motto || 'Building something brighter.'}
                  </div>
                </div>

                <div style={{ width: '100%', height: 9, borderRadius: 100, background: '#fae8e8', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${data.healthScore?.score || 76}%`,
                      height: '100%',
                      borderRadius: 100,
                      background: 'linear-gradient(90deg, #9e1820 0%, #ca2f2b 100%)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Card 1.3: This Week's Priorities */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ListOrdered style={{ width: 16, height: 16, color: '#9e1820' }} />
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1e1b18' }}>This Week&apos;s Priorities</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
                <div style={{ fontSize: 54, fontWeight: 900, color: '#1e1b18', lineHeight: 1 }}>
                  {data.priorities?.total || 5}
                </div>
              </div>
            </div>

            {/* Card 1.4: Completed */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 style={{ width: 16, height: 16, color: '#9e1820' }} />
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#1e1b18' }}>Completed</span>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
                <div style={{ fontSize: 46, fontWeight: 900, color: '#1e1b18', lineHeight: 1 }}>
                  {data.priorities?.completed || 4} of {data.priorities?.total || 5}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              ROW 2 (Height: ~26%): 3 Cards
              Weekly Execution | Monthly Target | Financials (This Month)
             ══════════════════════════════════════════════════════════ */}
          <div
            style={{
              height: '26%',
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: '1.05fr 1.15fr 1.25fr',
              gap: 10,
            }}
          >
            {/* Card 2.1: Weekly Execution */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2.5px solid #9e1820', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#9e1820' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1e1b18' }}>Weekly Execution</span>
              </div>

              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 20 }}>
                {/* SVG Radial Donut Meter */}
                <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
                  <svg width="96" height="96" viewBox="0 0 54 54">
                    <circle cx="27" cy="27" r="21" fill="none" stroke="#fae8e8" strokeWidth="6.5" />
                    <circle
                      cx="27"
                      cy="27"
                      r="21"
                      fill="none"
                      stroke="#9e1820"
                      strokeWidth="6.5"
                      strokeDasharray={`${(data.priorities?.rate || 80) * 1.319} 132`}
                      strokeDashoffset="33"
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
                      fontSize: 20,
                      fontWeight: 900,
                      color: '#1e1b18',
                    }}
                  >
                    {data.priorities?.rate || 80}%
                  </div>
                </div>

                {/* Right Caption */}
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: '#9e1820',
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    CONSISTENT MOMENTUM
                  </div>
                  <div style={{ fontSize: 12, color: '#736b5e', lineHeight: 1.35, marginTop: 4 }}>
                    Ideas to impact, week by week.
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2.2: Monthly Target */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target style={{ width: 16, height: 16, color: '#9e1820' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1e1b18' }}>Monthly Target</span>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: '#1e1b18', lineHeight: 1 }}>
                  {data.financials?.monthlyTarget || '₹10L'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#1e1b18', whiteSpace: 'nowrap' }}>
                    Achieved: {data.financials?.achievedAmount || '₹7.2L'}
                  </span>
                  <div style={{ flex: 1, height: 9, borderRadius: 100, background: '#fae8e8', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${data.financials?.targetRate || 72}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #9e1820 0%, #ca2f2b 100%)',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1e1b18' }}>
                    {data.financials?.targetRate || 72}%
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2.3: Financials (This Month) + Integrated Runway */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BarChart3 style={{ width: 16, height: 16, color: '#9e1820' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1e1b18' }}>Financials (This Month)</span>
              </div>

              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 16, alignItems: 'center' }}>
                {/* Left: Revenue vs Burn */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#736b5e' }}>Revenue</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#1e1b18', marginTop: 2 }}>
                      {data.financials?.revenue || '₹7.2L'}
                    </div>
                    <div style={{ width: '100%', height: 46, background: '#9e1820', borderRadius: 5, marginTop: 6 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#736b5e' }}>Burn</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#1e1b18', marginTop: 2 }}>
                      {data.financials?.burn || '₹3.1L'}
                    </div>
                    <div style={{ width: '100%', height: 46, background: '#fca5a5', borderRadius: 5, marginTop: 6 }} />
                  </div>
                </div>

                {/* Right: Runway Column */}
                <div style={{ borderLeft: '1px solid #eee5d3', paddingLeft: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Hourglass style={{ width: 14, height: 14, color: '#9e1820' }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#1e1b18' }}>Runway</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                    <span style={{ fontSize: 40, fontWeight: 900, color: '#1e1b18', lineHeight: 1 }}>
                      {data.financials?.runwayMonths || 8}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#1e1b18' }}>Months</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 4, lineHeight: 1.25 }}>
                    {data.financials?.runwayStatus || 'Solid runway to scale.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              ROW 3 (Height: ~28%): 3 Cards
              Growth Metrics | Leads & Customers Trend | Quadrant Key Milestones
             ══════════════════════════════════════════════════════════ */}
          <div
            style={{
              height: '28%',
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: '1.05fr 1.25fr 1.15fr',
              gap: 10,
            }}
          >
            {/* Card 3.1: Growth Metrics (This Week) */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp style={{ width: 16, height: 16, color: '#9e1820' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1e1b18' }}>Growth Metrics (This Week)</span>
              </div>

              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11.5, color: '#736b5e' }}>Leads</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: '#1e1b18', lineHeight: 1.05, marginTop: 4 }}>
                    {data.growth?.leads || 840}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: '#059669', marginTop: 4 }}>
                    ▲ {data.growth?.leadsChange || '+18%'}
                  </div>
                  <div style={{ fontSize: 10, color: '#8c8270' }}>vs last week</div>
                </div>

                <div>
                  <div style={{ fontSize: 11.5, color: '#736b5e' }}>Customers</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: '#1e1b18', lineHeight: 1.05, marginTop: 4 }}>
                    {data.growth?.customers || 126}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: '#059669', marginTop: 4 }}>
                    ▲ {data.growth?.customersChange || '+24%'}
                  </div>
                  <div style={{ fontSize: 10, color: '#8c8270' }}>vs last week</div>
                </div>

                <div>
                  <div style={{ fontSize: 11.5, color: '#736b5e' }}>CAC</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: '#1e1b18', lineHeight: 1.05, marginTop: 4 }}>
                    {data.growth?.cac || '₹420'}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: '#059669', marginTop: 4 }}>
                    ▼ {data.growth?.cacChange || '+12%'}
                  </div>
                  <div style={{ fontSize: 10, color: '#8c8270' }}>vs last week</div>
                </div>
              </div>
            </div>

            {/* Card 3.2: Leads & Customers Trend */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BarChart3 style={{ width: 16, height: 16, color: '#9e1820' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1e1b18' }}>Leads & Customers Trend</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#9e1820' }} />
                    <span style={{ color: '#736b5e' }}>Leads</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fca5a5' }} />
                    <span style={{ color: '#736b5e' }}>Customers</span>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%', height: 130 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={data.growth?.weeklyTrend || []}
                      margin={{ top: 4, right: 0, left: -22, bottom: -4 }}
                      barGap={3}
                    >
                      <CartesianGrid strokeDasharray="2 2" stroke="#ede5d6" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#736b5e' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#736b5e' }} axisLine={false} tickLine={false} domain={[0, 900]} ticks={[0, 300, 600, 900]} />
                      <Bar dataKey="leads" fill="#9e1820" radius={[3, 3, 0, 0]} isAnimationActive={false} barSize={11} />
                      <Bar dataKey="customers" fill="#fca5a5" radius={[3, 3, 0, 0]} isAnimationActive={false} barSize={11} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Card 3.3: Quadrant Metric Card (Milestones, Blockers, Mentor, Founder Score) */}
            <div style={cardStyle}>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 12, alignItems: 'center' }}>
                {/* Top-Left: Key Milestones */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Flag style={{ width: 14, height: 14, color: '#9e1820' }} />
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: '#1e1b18' }}>Key Milestones</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#1e1b18', marginTop: 3 }}>
                    {data.execution?.milestonesCount || '7/10'}
                  </div>
                  <div style={{ width: '85%', height: 6, borderRadius: 100, background: '#fae8e8', overflow: 'hidden', marginTop: 4 }}>
                    <div style={{ width: '70%', height: '100%', background: '#9e1820' }} />
                  </div>
                </div>

                {/* Top-Right: Critical Blockers */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertTriangle style={{ width: 14, height: 14, color: '#9e1820' }} />
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: '#1e1b18' }}>Critical Blockers</span>
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#9e1820', marginTop: 3 }}>
                    {data.execution?.criticalBlockersCount || 2}
                  </div>
                </div>

                {/* Bottom-Left: Mentor Rating */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Star style={{ width: 14, height: 14, color: '#9e1820' }} />
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: '#1e1b18' }}>Mentor Rating</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#1e1b18', marginTop: 3 }}>
                    {data.execution?.mentorRating || '8/10'}
                  </div>
                </div>

                {/* Bottom-Right: Founder Execution Score */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Zap style={{ width: 14, height: 14, color: '#9e1820' }} />
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: '#1e1b18' }}>Founder Execution Score</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#1e1b18', marginTop: 3 }}>
                    {data.execution?.founderExecutionScore || 82}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              ROW 4 (Height: ~28%): 3 Cards
              Top Wins | Critical Blockers | Startup Value Spotlight
             ══════════════════════════════════════════════════════════ */}
          <div
            style={{
              height: '28%',
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: '1.05fr 1.15fr 1.25fr',
              gap: 10,
            }}
          >
            {/* Card 4.1: Top Wins This Week */}
            <div style={{ ...cardStyle, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, zIndex: 1 }}>
                <Trophy style={{ width: 16, height: 16, color: '#9e1820' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1e1b18' }}>Top Wins This Week</span>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, zIndex: 1, margin: '4px 0' }}>
                {(data.highlights?.topWins || [
                  'Revenue crossed ₹7.2L',
                  '4/5 priorities completed',
                  'Lead generation reached 840',
                ]).slice(0, 3).map((win, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 600, color: '#1e1b18' }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#9e1820',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
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

              {/* Elegant Calligraphy Handwriting Watermark */}
              <div
                style={{
                  position: 'absolute',
                  right: 14,
                  bottom: 6,
                  color: '#9e1820',
                  fontFamily: "'Caveat', cursive, sans-serif",
                  fontSize: 44,
                  fontWeight: 700,
                  transform: 'rotate(-6deg)',
                  opacity: 0.38,
                  pointerEvents: 'none',
                }}
              >
                Small Steps Brighter Days
              </div>
            </div>

            {/* Card 4.2: Critical Blockers */}
            <div style={{ ...cardStyle, position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, zIndex: 1 }}>
                <AlertCircle style={{ width: 16, height: 16, color: '#9e1820' }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1e1b18' }}>Critical Blockers</span>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, zIndex: 1, margin: '6px 0' }}>
                {(data.highlights?.criticalBlockers || [
                  'Packaging vendor delay',
                  'Performance ad creative refresh needed',
                ]).slice(0, 2).map((blocker, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 600, color: '#1e1b18' }}>
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#9e1820',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{blocker}</span>
                  </div>
                ))}
              </div>

              {/* Elegant Calligraphy Handwriting Watermark */}
              <div
                style={{
                  position: 'absolute',
                  right: 16,
                  bottom: 6,
                  color: '#9e1820',
                  fontFamily: "'Caveat', cursive, sans-serif",
                  fontSize: 44,
                  fontWeight: 700,
                  transform: 'rotate(-6deg)',
                  opacity: 0.38,
                  pointerEvents: 'none',
                }}
              >
                Solve Scale Shine
              </div>
            </div>

            {/* Card 4.3: STARTUP VALUE SPOTLIGHT */}
            <div style={{ ...cardStyle, padding: '14px 18px', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Gem style={{ width: 16, height: 16, color: '#9e1820' }} />
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 900,
                    color: '#9e1820',
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                  }}
                >
                  STARTUP VALUE SPOTLIGHT
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '4px 0' }}>
                {(data.highlights?.valueSpotlight?.items || [
                  'Science-led skincare',
                  'Barrier-first routines',
                  'High repeat-purchase potential',
                ]).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#1e1b18' }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#9e1820',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Check style={{ width: 11, height: 11, color: '#ffffff', strokeWidth: 3 }} />
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Bottom Solid Crimson Pill Banner */}
              <div
                style={{
                  background: '#9e1820',
                  borderRadius: 100,
                  padding: '8px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#ffffff',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.3px' }}>
                  {data.highlights?.valueSpotlight?.bannerText || 'Brand built for repeat trust.'}
                </span>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowRight style={{ width: 12, height: 12, color: '#9e1820', strokeWidth: 3 }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT COLUMN: FOUNDER OF THE WEEK HERO PLAQUE (Full Height)
           ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(180deg, #6c0d12 0%, #9e1820 40%, #4a070a 100%)',
            borderRadius: 16,
            border: '1px solid rgba(255, 230, 200, 0.25)',
            boxShadow: '0 12px 36px rgba(108, 13, 18, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            padding: '24px 18px 20px 18px',
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
          {/* Subtle Golden Ambient Glow Behind Laurel */}
          <div
            style={{
              position: 'absolute',
              top: '25%',
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(246, 213, 133, 0.35) 0%, rgba(246, 213, 133, 0.08) 55%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Top Title */}
          <div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 900,
                letterSpacing: '2.5px',
                color: '#ffffff',
                textTransform: 'uppercase',
              }}
            >
              FOUNDER OF THE WEEK
            </div>
          </div>

          {/* Golden Laurel Wreath + Circular Silhouette Portrait */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Detailed Golden Laurel Wreath SVG */}
              <svg width="200" height="200" viewBox="0 0 140 140" fill="none" style={{ position: 'absolute', inset: 0 }}>
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

              {/* Founder Circular Silhouette Portrait Frame */}
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #3d070b 0%, #150203 100%)',
                  border: '3px solid #f6d585',
                  boxShadow: '0 0 24px rgba(246, 213, 133, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {/* Stylized Founder Silhouette */}
                <svg width="80" height="92" viewBox="0 0 58 68" fill="none">
                  <circle cx="29" cy="22" r="14" fill="#fce7b2" fillOpacity="0.85" />
                  <path
                    d="M8 68 C8 46 16 40 29 40 C42 40 50 46 50 68 Z"
                    fill="#fce7b2"
                    fillOpacity="0.85"
                  />
                </svg>
              </div>
            </div>

            {/* 3D Folded Metallic Golden Ribbon */}
            <div
              style={{
                marginTop: -22,
                position: 'relative',
                zIndex: 5,
                background: 'linear-gradient(180deg, #ffeaa7 0%, #f6c85f 40%, #df9a26 100%)',
                color: '#730e13',
                padding: '7px 20px',
                borderRadius: 5,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                border: '1px solid #fff5cc',
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                textShadow: '0 1px 0 rgba(255, 255, 255, 0.6)',
              }}
            >
              {data.founderOfTheWeek?.award || 'CHAMPIONING PROGRESS'}
            </div>
          </div>

          {/* Citation Text */}
          <div
            style={{
              fontSize: 15,
              color: '#ffe6cf',
              fontStyle: 'italic',
              fontFamily: 'var(--font-serif)',
              lineHeight: 1.5,
              padding: '0 14px',
            }}
          >
            &ldquo;{data.founderOfTheWeek?.citation || 'Recognised for strongest weekly execution and milestone progress.'}&rdquo;
          </div>

          {/* Golden Hairline Divider with Diamond */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '70%' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(246, 213, 133, 0.4)' }} />
            <span style={{ color: '#f6d585', fontSize: 12 }}>✦</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(246, 213, 133, 0.4)' }} />
          </div>

          {/* Bottom Motto */}
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: '2.2px',
                color: '#f6d585',
                textTransform: 'uppercase',
                lineHeight: 1.4,
              }}
            >
              BOLDER FOUNDERS
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: '2.2px',
                color: '#f6d585',
                textTransform: 'uppercase',
                lineHeight: 1.4,
              }}
            >
              BRIGHTER TOMORROW
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER (FULL WIDTH, CLEAN TYPOGRAPHY) ── */}
      <footer
        style={{
          height: 28,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: '1px',
          color: '#736b5e',
          textTransform: 'uppercase',
          padding: '0 6px',
          borderTop: '1px solid rgba(158, 24, 32, 0.12)',
          zIndex: 10,
        }}
      >
        <div>
          <span style={{ color: '#9e1820', fontWeight: 900 }}>DAYONE</span>
          <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
          <span>SEVEN STARTUPS</span>
          <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
          <span>ONE OPERATING SYSTEM</span>
        </div>

        {/* Center Star with Hairline Rules */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '24%' }}>
          <div style={{ flex: 1, height: 1, background: '#ded6c1' }} />
          <span style={{ color: '#9e1820', fontSize: 13 }}>✦</span>
          <div style={{ flex: 1, height: 1, background: '#ded6c1' }} />
        </div>

        <div>
          <span>PEOPLE</span>
          <span style={{ margin: '0 8px', opacity: 0.5 }}>×</span>
          <span>BRANDS</span>
          <span style={{ margin: '0 8px', opacity: 0.5 }}>×</span>
          <span>BIGGER POSSIBILITIES</span>
        </div>
      </footer>
    </div>
  )
}
