'use client'

import { useActionState, useState, useRef } from 'react'
import Link from 'next/link'
import { registerStartup } from '@/features/registrations/actions'
import { Logo } from '@/components/brand/Logo'
import { CompanyLogo } from '@/components/brand/CompanyLogo'
import { Upload, X, Image as ImageIcon, Link2 } from 'lucide-react'
import type { ActionState } from '@/types'

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    registerStartup,
    {}
  )
  const [startupName, setStartupName] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUrlInput, setLogoUrlInput] = useState('')
  const [isUrlMode, setIsUrlMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Logo image must be under 5MB')
        return
      }
      const previewUrl = URL.createObjectURL(file)
      setLogoPreview(previewUrl)
    }
  }

  const handleClearLogo = () => {
    setLogoPreview(null)
    setLogoUrlInput('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (state?.success) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-background)',
          padding: 24,
        }}
      >
        <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 24 }}>🎉</div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: 12,
            }}
          >
            Application Submitted!
          </h1>
          <p
            style={{
              fontSize: 16,
              color: 'var(--color-text-secondary)',
              lineHeight: 1.7,
              marginBottom: 32,
            }}
          >
            Your startup registration is under review. The Day One team will
            reach out once approved. You can then log in and start building.
          </p>
          <div className="alert alert-success" style={{ marginBottom: 24, textAlign: 'left' }}>
            {state.success}
          </div>
          <Link href="/login" className="btn btn-primary">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-background)',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-block', marginBottom: 12 }}>
            <Logo size="lg" />
          </Link>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: 6,
            }}
          >
            Register Your Startup
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            Submit your application to join Day One
          </p>
        </div>

        <div className="card">
          {state?.error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              {state.error}
            </div>
          )}

          <form
            action={formAction}
            encType="multipart/form-data"
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            <div className="form-group">
              <label htmlFor="startup_name" className="label">
                Startup Name *
              </label>
              <input
                id="startup_name"
                name="startup_name"
                className="input"
                placeholder="e.g. Acme Inc."
                required
                value={startupName}
                onChange={(e) => setStartupName(e.target.value)}
              />
            </div>

            {/* Company Logo Section */}
            <div
              style={{
                border: '1px dashed var(--color-border)',
                borderRadius: 12,
                padding: '14px 16px',
                background: 'var(--color-surface)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <label className="label" style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>
                  Company Logo{' '}
                  <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>
                    (Optional)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsUrlMode(!isUrlMode)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-brand)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {isUrlMode ? (
                    <>
                      <Upload size={13} /> Upload File
                    </>
                  ) : (
                    <>
                      <Link2 size={13} /> Paste Image URL
                    </>
                  )}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Logo Live Preview */}
                <div style={{ flexShrink: 0 }}>
                  <CompanyLogo
                    logoUrl={logoPreview || (isUrlMode && logoUrlInput ? logoUrlInput : null)}
                    name={startupName || 'Startup'}
                    size={52}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {!isUrlMode ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        name="logo_file"
                        id="logo_file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn btn-secondary"
                          style={{
                            fontSize: 12,
                            padding: '6px 12px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Upload size={14} />
                          {logoPreview ? 'Change Logo' : 'Upload Logo'}
                        </button>
                        {(logoPreview || logoUrlInput) && (
                          <button
                            type="button"
                            onClick={handleClearLogo}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-text-muted)',
                              fontSize: 12,
                              cursor: 'pointer',
                              padding: '4px 8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <X size={13} /> Clear
                          </button>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-muted)',
                          marginTop: 5,
                        }}
                      >
                        PNG, JPG, SVG or WebP. Displayed on the live TV showcase.
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        name="logo_url"
                        type="url"
                        className="input"
                        placeholder="https://example.com/logo.png"
                        value={logoUrlInput}
                        onChange={(e) => setLogoUrlInput(e.target.value)}
                        style={{ fontSize: 13, padding: '7px 10px' }}
                      />
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-muted)',
                          marginTop: 4,
                        }}
                      >
                        Public image link for your company logo mark.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="founder_name" className="label">
                Founder Name *
              </label>
              <input
                id="founder_name"
                name="founder_name"
                className="input"
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="label">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                placeholder="you@startup.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="label">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="input"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="label">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
            >
              {pending ? 'Submitting…' : 'Submit Application'}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--color-text-muted)',
            marginTop: 20,
            lineHeight: 1.6,
          }}
        >
          Already registered?{' '}
          <Link href="/login" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>
            Sign in
          </Link>
          {' · '}
          <Link href="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
