'use client'

import React, { useState } from 'react'

interface CompanyLogoProps {
  logoUrl?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  className?: string
  style?: React.CSSProperties
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
}

// Deterministic vibrant gradient generator based on company name
function getGradient(name: string) {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const gradients = [
    'linear-gradient(135deg, #ca2f2b 0%, #9e1f1c 100%)', // Red / Crimson
    'linear-gradient(135deg, #0284c7 0%, #1e3a8a 100%)', // Electric Blue
    'linear-gradient(135deg, #059669 0%, #064e3b 100%)', // Emerald
    'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)', // Violet
    'linear-gradient(135deg, #d97706 0%, #78350f 100%)', // Amber
    'linear-gradient(135deg, #db2777 0%, #831843 100%)', // Rose
  ]
  return gradients[hash % gradients.length]
}

export function CompanyLogo({
  logoUrl,
  name,
  size = 'md',
  className = '',
  style = {},
}: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false)

  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 40
  const initial = (name || 'C').charAt(0).toUpperCase()
  const borderRadius = Math.max(6, Math.round(pixelSize * 0.22))
  const fontSize = Math.max(11, Math.round(pixelSize * 0.42))

  if (logoUrl && !hasError) {
    return (
      <div
        className={className}
        style={{
          width: pixelSize,
          height: pixelSize,
          borderRadius,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          flexShrink: 0,
          ...style,
        }}
      >
        <img
          src={logoUrl}
          alt={`${name} Logo`}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: pixelSize > 32 ? 2 : 1,
          }}
        />
      </div>
    )
  }

  // Fallback Monogram Avatar
  return (
    <div
      className={className}
      style={{
        width: pixelSize,
        height: pixelSize,
        borderRadius,
        background: getGradient(name || 'DayOne'),
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        letterSpacing: '-0.5px',
        flexShrink: 0,
        ...style,
      }}
    >
      {initial}
    </div>
  )
}
