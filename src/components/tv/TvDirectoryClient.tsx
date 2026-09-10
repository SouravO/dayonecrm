'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Tv,
  ExternalLink,
  Copy,
  Check,
  Search,
  MonitorPlay,
  Layers,
  CalendarRange,
  Flame,
  ArrowRight,
} from 'lucide-react'
import { Logo } from '@/components/brand/Logo'

interface StartupSummary {
  id: string
  name: string
  email: string
  status: string
  slug: string
  planGoal: string | null
  tasksCount: number
  domainsCount: number
}

interface Props {
  startups: StartupSummary[]
}

export function TvDirectoryClient({ startups }: Props) {
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = startups.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const copyTvUrl = (startup: StartupSummary) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/tv/${startup.slug}`
    navigator.clipboard.writeText(url)
    setCopiedId(startup.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)', padding: '36px 24px 80px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 36,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Logo size="md" />
            </Link>
            <div style={{ height: 32, width: 1, background: 'var(--color-border)' }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>
                Multi-TV Studio Control Hub
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                Dedicated live mission control displays for wall TVs and war rooms
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/admin/startups" className="btn btn-secondary btn-sm">
              Manage Startups
            </Link>
            <Link href="/login" className="btn btn-primary btn-sm">
              Sign In to CRM
            </Link>
          </div>
        </div>

        {/* Search and Instructions Banner */}
        <div
          className="card"
          style={{
            marginBottom: 32,
            background: '#ffffff',
            padding: '24px 28px',
            border: '1px solid #e5dfcb',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Portfolio Company Feeds ({startups.length} Available)
              </h2>
              <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Each company has a permanent route designed for 1080p / 4K TV screens with zero login required.
              </p>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
              <Search
                className="w-4 h-4 text-[#8c8375]"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search company by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                style={{ paddingLeft: 36, fontSize: 13 }}
              />
            </div>
          </div>

          {/* Quick TV Setup Guide Pill */}
          <div
            style={{
              padding: '12px 16px',
              background: '#fcfbfa',
              border: '1px solid #e5ded0',
              borderRadius: 10,
              fontSize: 12.5,
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15 }}>📺</span>
              <span>
                <strong>Smart TV Setup:</strong> Open the TV web browser on each screen → Paste or bookmark the company URL → Press <strong>Fullscreen</strong>.
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Built-in WakeLock keeps screens on 24/7
            </span>
          </div>
        </div>

        {/* Startups Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: 20,
          }}
        >
          {filtered.map((s) => (
            <div
              key={s.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '22px 24px',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #ca2f2b 0%, #9e1f1c 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        fontWeight: 800,
                        boxShadow: '0 2px 8px rgba(202, 47, 43, 0.25)',
                      }}
                    >
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {s.name}
                      </h3>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        /tv/{s.slug}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 100,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: s.status === 'ACTIVE' ? '#ecfdf5' : '#fffbeb',
                      color: s.status === 'ACTIVE' ? '#065f46' : '#92400e',
                      border: `1px solid ${s.status === 'ACTIVE' ? '#a7f3d0' : '#fde68a'}`,
                    }}
                  >
                    {s.status}
                  </span>
                </div>

                {/* Sprint Goal Quote */}
                <div
                  style={{
                    padding: '12px 14px',
                    background: '#fcfbfa',
                    border: '1px solid #e5dfcb',
                    borderRadius: 10,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-brand)', marginBottom: 4 }}>
                    Current Sprint Goal
                  </div>
                  <div
                    className="font-serif-italic"
                    style={{
                      fontSize: 13.5,
                      color: 'var(--color-text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.planGoal ? `"${s.planGoal}"` : 'Active sprint underway'}
                  </div>
                </div>

                {/* Metrics Pills */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <div style={{ flex: 1, padding: '8px 10px', background: '#fbf9f1', borderRadius: 8, border: '1px solid #e5dfcb' }}>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Deliverables
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2 }}>
                      {s.tasksCount} tasks
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: '8px 10px', background: '#fbf9f1', borderRadius: 8, border: '1px solid #e5dfcb' }}>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Domains
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginTop: 2 }}>
                      {s.domainsCount} areas
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <Link
                  href={`/tv/${s.slug}`}
                  target="_blank"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <MonitorPlay className="w-3.5 h-3.5" />
                  <span>Launch TV Display</span>
                </Link>

                <button
                  onClick={() => copyTvUrl(s)}
                  className="btn btn-secondary btn-sm btn-icon"
                  title="Copy permanent TV link for this screen"
                  style={{ position: 'relative' }}
                >
                  {copiedId === s.id ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
