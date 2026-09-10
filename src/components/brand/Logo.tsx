import React from 'react'
import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'icon'
  variant?: 'red' | 'cream' | 'auto'
  showTagline?: boolean
  className?: string
}

export function Logo({
  size = 'md',
  variant = 'auto',
  showTagline = true,
  className = '',
}: LogoProps) {
  if (size === 'icon') {
    return (
      <div
        className={`inline-flex items-center justify-center flex-shrink-0 relative ${className}`}
        style={{
          width: 34,
          height: 34,
          background: 'linear-gradient(135deg, #ca2f2b 0%, #a82420 100%)',
          borderRadius: 9,
          boxShadow: '0 2px 10px rgba(202, 47, 43, 0.35)',
        }}
      >
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <span
            style={{
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: '-1px',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1,
            }}
          >
            d<span style={{ fontSize: 13, color: '#f6f2db' }}>1</span>
          </span>
          {/* Subtle signature star sparkle */}
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -5,
              color: '#f6f2db',
              fontSize: 8,
              lineHeight: 1,
            }}
          >
            ✦
          </span>
        </div>
      </div>
    )
  }

  const dimensions = {
    sm: { width: 120, height: 40 },
    md: { width: 150, height: 50 },
    lg: { width: 210, height: 70 },
  }[size]

  return (
    <div className={`inline-flex flex-col ${className}`} style={{ textDecoration: 'none' }}>
      <div style={{ position: 'relative', width: dimensions.width, height: dimensions.height }}>
        <Image
          src="/dayone-logo-red.png"
          alt="Day One — Venture Studio by iQue"
          width={dimensions.width}
          height={dimensions.height}
          style={{
            objectFit: 'contain',
            objectPosition: 'left center',
            width: '100%',
            height: '100%',
          }}
          priority
        />
      </div>
    </div>
  )
}
