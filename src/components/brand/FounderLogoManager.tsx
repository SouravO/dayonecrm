'use client'

import React, { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CompanyLogo } from '@/components/brand/CompanyLogo'
import { updateStartupLogo } from '@/features/startups/actions'
import {
  Camera,
  Upload,
  Link2,
  Trash2,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tv,
  Monitor,
  LayoutGrid,
  ArrowUpRight,
} from 'lucide-react'
import type { ActionState } from '@/types'

interface FounderLogoManagerProps {
  startupId: string
  startupName: string
  currentLogoUrl?: string | null
  size?: number
  variant?: 'avatar' | 'button' | 'quick-action' | 'both'
  className?: string
}

export function FounderLogoManager({
  startupId,
  startupName,
  currentLogoUrl,
  size = 54,
  variant = 'both',
  className = '',
}: FounderLogoManagerProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isUrlMode, setIsUrlMode] = useState(false)
  const [logoUrlInput, setLogoUrlInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [removeLogoRequested, setRemoveLogoRequested] = useState(false)
  const [statusState, setStatusState] = useState<ActionState | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Compute live preview URL:
  const effectivePreviewUrl = removeLogoRequested
    ? null
    : filePreviewUrl || (isUrlMode && logoUrlInput ? logoUrlInput : currentLogoUrl)

  const handleOpen = () => {
    setStatusState(null)
    setRemoveLogoRequested(false)
    setSelectedFile(null)
    setFilePreviewUrl(null)
    setLogoUrlInput(currentLogoUrl && !currentLogoUrl.startsWith('data:') ? currentLogoUrl : '')
    setIsUrlMode(false)
    setIsOpen(true)
  }

  const handleClose = () => {
    if (isPending) return
    setIsOpen(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setStatusState({ error: 'Image file size exceeds the 5MB limit.' })
        return
      }
      setSelectedFile(file)
      setRemoveLogoRequested(false)
      const objUrl = URL.createObjectURL(file)
      setFilePreviewUrl(objUrl)
      setStatusState(null)
    }
  }

  const handleClearSelectedFile = () => {
    setSelectedFile(null)
    setFilePreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRequestRemoveLogo = () => {
    setRemoveLogoRequested(true)
    setSelectedFile(null)
    setFilePreviewUrl(null)
    setLogoUrlInput('')
    setStatusState(null)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setStatusState(null)

    const formData = new FormData()
    formData.append('startup_id', startupId)

    if (removeLogoRequested) {
      formData.append('remove_logo', 'true')
    } else if (selectedFile) {
      formData.append('logo_file', selectedFile)
    } else if (isUrlMode && logoUrlInput.trim()) {
      formData.append('logo_url', logoUrlInput.trim())
    }

    startTransition(async () => {
      try {
        const res = await updateStartupLogo({}, formData)
        setStatusState(res)
        if (res.success) {
          router.refresh()
          setTimeout(() => {
            setIsOpen(false)
          }, 1200)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update logo'
        setStatusState({ error: msg })
      }
    })
  }

  return (
    <>
      {/* ── Trigger Types ── */}
      {variant === 'quick-action' ? (
        <div
          onClick={handleOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            background: '#fcfbfa',
            border: '1px solid #e5dfcb',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          className={`quick-action-row ${className}`}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(202, 47, 43, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Camera className="w-4 h-4 text-[#ca2f2b]" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Brand Identity & Logo
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>
              {currentLogoUrl ? 'Update or replace company logo' : 'Upload logo for TV wall & dashboard'}
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#8c8375] action-arrow" />
        </div>
      ) : variant === 'button' ? (
        <button
          type="button"
          onClick={handleOpen}
          className={`btn btn-secondary btn-sm ${className}`}
          style={{
            fontSize: 12,
            padding: '6px 12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
          }}
        >
          <Camera size={13} className="text-[#ca2f2b]" />
          <span>{currentLogoUrl ? 'Change Logo' : 'Add Logo'}</span>
        </button>
      ) : (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }} className={className}>
          {/* Clickable Avatar with Hover Overlay */}
          <div
            onClick={handleOpen}
            title="Click to change company logo"
            style={{
              position: 'relative',
              cursor: 'pointer',
              borderRadius: Math.max(6, Math.round(size * 0.22)),
              overflow: 'hidden',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(202, 47, 43, 0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <CompanyLogo logoUrl={currentLogoUrl} name={startupName} size={size} />

            {/* Hover Camera Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(20, 16, 12, 0.65)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                color: '#ffffff',
                borderRadius: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0'
              }}
            >
              <Camera size={Math.round(size * 0.36)} />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}
              >
                Edit
              </span>
            </div>
          </div>

          {variant === 'both' && (
            <button
              type="button"
              onClick={handleOpen}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: 12,
                padding: '5px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontWeight: 600,
              }}
            >
              <Camera size={13} className="text-[#ca2f2b]" />
              <span>{currentLogoUrl ? 'Change Logo' : 'Add Logo'}</span>
            </button>
          )}
        </div>
      )}

      {/* ── Brand Logo Modal Dialog ── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: 'rgba(28, 22, 16, 0.65)',
            backdropFilter: 'blur(6px)',
            animation: 'fadeIn 0.15s ease',
          }}
          onClick={handleClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 580,
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e8e2d4',
              boxShadow: '0 24px 48px -12px rgba(45, 38, 25, 0.25)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'scaleUp 0.2s ease',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px 16px',
                borderBottom: '1px solid #f0ebe1',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                background: '#faf7f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(202, 47, 43, 0.1)',
                    border: '1px solid rgba(202, 47, 43, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ca2f2b',
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#1a1612',
                      letterSpacing: '-0.3px',
                      margin: 0,
                    }}
                  >
                    Company Brand Logo
                  </h2>
                  <p
                    style={{
                      fontSize: 12.5,
                      color: '#736859',
                      margin: '2px 0 0',
                    }}
                  >
                    Syncs across Day One TV Wall, Executive Dashboard, and Sidebar.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9c9182',
                  cursor: 'pointer',
                  padding: 4,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} style={{ padding: 24 }}>
              {/* Status Alerts */}
              {statusState?.error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{statusState.error}</span>
                </div>
              )}

              {statusState?.success && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <span>{statusState.success}</span>
                </div>
              )}

              {/* ── Real-Time Multi-Context Live Preview ── */}
              <div
                style={{
                  background: '#fcfaf6',
                  border: '1px solid #ede7db',
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#8c7e6c',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Live Cross-Platform Preview
                  </span>
                  {removeLogoRequested ? (
                    <span
                      style={{
                        fontSize: 11,
                        color: '#ca2f2b',
                        fontWeight: 600,
                      }}
                    >
                      • Reverting to Monogram
                    </span>
                  ) : effectivePreviewUrl ? (
                    <span
                      style={{
                        fontSize: 11,
                        color: '#059669',
                        fontWeight: 600,
                      }}
                    >
                      • Custom Logo Active
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        color: '#8c7e6c',
                      }}
                    >
                      • Default Monogram
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 12,
                  }}
                >
                  {/* Context 1: TV Screen */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e8e2d4',
                      borderRadius: 10,
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: 8,
                    }}
                  >
                    <CompanyLogo
                      logoUrl={effectivePreviewUrl}
                      name={startupName}
                      size={46}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Tv size={11} color="#ca2f2b" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#423b32' }}>
                        TV Wall Display
                      </span>
                    </div>
                  </div>

                  {/* Context 2: Dashboard Header */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e8e2d4',
                      borderRadius: 10,
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: 8,
                    }}
                  >
                    <CompanyLogo
                      logoUrl={effectivePreviewUrl}
                      name={startupName}
                      size={46}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Monitor size={11} color="#0284c7" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#423b32' }}>
                        Dashboard Header
                      </span>
                    </div>
                  </div>

                  {/* Context 3: Sidebar */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e8e2d4',
                      borderRadius: 10,
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: 8,
                    }}
                  >
                    <CompanyLogo
                      logoUrl={effectivePreviewUrl}
                      name={startupName}
                      size={32}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <LayoutGrid size={11} color="#7c3aed" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#423b32' }}>
                        Sidebar Badge
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Mode Switcher Tabs ── */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f2ece1',
                  borderRadius: 10,
                  padding: 3,
                  marginBottom: 16,
                  gap: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsUrlMode(false)
                    setRemoveLogoRequested(false)
                  }}
                  style={{
                    flex: 1,
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: !isUrlMode ? '#ffffff' : 'transparent',
                    color: !isUrlMode ? '#1a1612' : '#736859',
                    fontSize: 12.5,
                    fontWeight: !isUrlMode ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: !isUrlMode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Upload size={14} />
                  Upload Image File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUrlMode(true)
                    setRemoveLogoRequested(false)
                  }}
                  style={{
                    flex: 1,
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: isUrlMode ? '#ffffff' : 'transparent',
                    color: isUrlMode ? '#1a1612' : '#736859',
                    fontSize: 12.5,
                    fontWeight: isUrlMode ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: isUrlMode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Link2 size={14} />
                  Paste Image URL
                </button>
              </div>

              {/* ── Mode 1: File Upload ── */}
              {!isUrlMode && (
                <div style={{ marginBottom: 20 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  {selectedFile ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#475569',
                          }}
                        >
                          IMG
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#1e293b',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {selectedFile.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleClearSelectedFile}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                        }}
                      >
                        <X size={14} /> Remove
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: '2px dashed #d6cec0',
                        borderRadius: 12,
                        padding: '28px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: '#faf8f4',
                        transition: 'border-color 0.15s ease, background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ca2f2b'
                        e.currentTarget.style.background = '#fefcf8'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#d6cec0'
                        e.currentTarget.style.background = '#faf8f4'
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          background: 'rgba(202, 47, 43, 0.08)',
                          color: '#ca2f2b',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <Upload size={20} />
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#2d2619', marginBottom: 3 }}>
                        Choose an image file or drag here
                      </div>
                      <div style={{ fontSize: 11.5, color: '#7a7062' }}>
                        PNG, JPG, SVG, WebP or GIF up to 5MB
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Mode 2: URL Input ── */}
              {isUrlMode && (
                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#423b32',
                      marginBottom: 6,
                    }}
                  >
                    Public Image Link
                  </label>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://example.com/brand/logo.png"
                    value={logoUrlInput}
                    onChange={(e) => {
                      setLogoUrlInput(e.target.value)
                      setRemoveLogoRequested(false)
                    }}
                    style={{
                      fontSize: 13,
                      padding: '9px 12px',
                      borderRadius: 8,
                      width: '100%',
                    }}
                  />
                  <span style={{ fontSize: 11, color: '#8c7e6c', marginTop: 4, display: 'block' }}>
                    Paste a direct image link hosted on your website, CDN, or AWS S3.
                  </span>
                </div>
              )}

              {/* ── Modal Footer Buttons ── */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 16,
                  borderTop: '1px solid #f0ebe1',
                }}
              >
                {/* Remove Logo Option */}
                {currentLogoUrl && !removeLogoRequested ? (
                  <button
                    type="button"
                    onClick={handleRequestRemoveLogo}
                    disabled={isPending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '6px 8px',
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Remove Logo</span>
                  </button>
                ) : removeLogoRequested ? (
                  <button
                    type="button"
                    onClick={() => setRemoveLogoRequested(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: 12.5,
                      cursor: 'pointer',
                    }}
                  >
                    Undo Removal
                  </button>
                ) : (
                  <div />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 13, padding: '7px 14px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn btn-primary btn-sm"
                    style={{
                      fontSize: 13,
                      padding: '7px 18px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {isPending ? (
                      <>
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            border: '2px solid rgba(255,255,255,0.4)',
                            borderTopColor: '#ffffff',
                            borderRadius: '50%',
                            display: 'inline-block',
                            animation: 'spin 0.8s linear infinite',
                          }}
                        />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Save & Publish Logo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
