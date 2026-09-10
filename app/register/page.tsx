'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registerStartup } from '@/features/registrations/actions'
import { Logo } from '@/components/brand/Logo'
import type { ActionState } from '@/types'

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    registerStartup,
    {}
  )

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

          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
              />
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
