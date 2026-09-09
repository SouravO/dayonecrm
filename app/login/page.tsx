'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/features/auth/actions'
import type { ActionState } from '@/types'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(login, {})

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
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: 'var(--color-brand)',
              borderRadius: 12,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 800,
              color: '#fff',
              marginBottom: 16,
            }}
          >
            D1
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: 6,
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            Sign in to your Day One account
          </p>
        </div>

        {/* Form */}
        <div className="card">
          {state?.error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              {state.error}
            </div>
          )}

          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: 'center',
            fontSize: 14,
            color: 'var(--color-text-muted)',
            marginTop: 20,
          }}
        >
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            style={{ color: 'var(--color-brand)', textDecoration: 'none', fontWeight: 500 }}
          >
            Register your startup
          </Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 12 }}>
          <Link
            href="/"
            style={{ fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none' }}
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
