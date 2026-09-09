import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Day One — Build Your Startup With Structure',
  description:
    'Day One is a venture studio that helps startups grow from scratch with structured weekly planning, task tracking, and performance analytics.',
}

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background)' }}>
      {/* ── Navigation ── */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: 'var(--color-brand)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
              color: '#fff',
            }}
          >
            D1
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>
            Day One
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" className="btn btn-ghost btn-sm">
            Sign in
          </Link>
          <Link href="/register" className="btn btn-primary btn-sm">
            Register Your Startup
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="hero-gradient"
        style={{
          paddingTop: 140,
          paddingBottom: 100,
          textAlign: 'center',
          padding: '140px 24px 100px',
        }}
      >
        <div
          className="badge badge-info animate-fade-in"
          style={{ marginBottom: 24, display: 'inline-flex' }}
        >
          Venture Studio Platform
        </div>
        <h1
          className="gradient-text"
          style={{
            fontSize: 'clamp(40px, 7vw, 72px)',
            fontWeight: 800,
            letterSpacing: '-2px',
            lineHeight: 1.1,
            marginBottom: 24,
          }}
        >
          Build Startups
          <br />
          With Precision
        </h1>
        <p
          style={{
            fontSize: 20,
            color: 'var(--color-text-secondary)',
            maxWidth: 560,
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}
        >
          Day One gives every startup in our portfolio the structure to execute
          weekly goals, track progress, and grow systematically.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" className="btn btn-primary btn-lg">
            Register Your Startup →
          </Link>
          <Link href="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>

        {/* Hero stats */}
        <div
          style={{
            display: 'flex',
            gap: 48,
            justifyContent: 'center',
            marginTop: 64,
            flexWrap: 'wrap',
          }}
        >
          {[
            { value: '100%', label: 'Structured Execution' },
            { value: 'Weekly', label: 'Planning Cadence' },
            { value: 'Real-time', label: 'Progress Tracking' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How Day One Works ── */}
      <section
        style={{
          padding: '80px 24px',
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            fontSize: 36,
            fontWeight: 700,
            textAlign: 'center',
            color: 'var(--color-text-primary)',
            marginBottom: 12,
            letterSpacing: '-1px',
          }}
        >
          How Day One Works
        </h2>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: 16,
            marginBottom: 56,
          }}
        >
          A clear hierarchy that keeps everyone aligned
        </p>

        <div className="grid-3">
          {[
            {
              icon: '🏛️',
              title: 'Day One Admin',
              subtitle: 'Control Tower',
              desc: 'Monitors all startups, reviews registrations, and tracks cross-portfolio performance in real time.',
              color: 'var(--color-brand)',
            },
            {
              icon: '🚀',
              title: 'Founder',
              subtitle: 'Startup Direction',
              desc: "Sets weekly goals, manages domains and staff, and monitors the startup's execution. Owns the vision.",
              color: 'var(--color-success)',
            },
            {
              icon: '⚙️',
              title: 'Staff',
              subtitle: 'Execution Layer',
              desc: 'Creates and completes tasks within their domain. Moves work from TODO to DONE, week by week.',
              color: 'var(--color-warning)',
            },
          ].map((item) => (
            <div key={item.title} className="feature-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{item.icon}</div>
              <div
                className="badge"
                style={{
                  background: `color-mix(in srgb, ${item.color} 15%, transparent)`,
                  color: item.color,
                  marginBottom: 12,
                  display: 'inline-flex',
                }}
              >
                {item.subtitle}
              </div>
              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  marginBottom: 12,
                }}
              >
                {item.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Startup Growth ── */}
      <section
        style={{
          padding: '80px 24px',
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 700,
              textAlign: 'center',
              color: 'var(--color-text-primary)',
              marginBottom: 12,
              letterSpacing: '-1px',
            }}
          >
            Weekly Execution, Every Week
          </h2>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: 16,
              marginBottom: 56,
            }}
          >
            Startups that execute consistently outperform. Day One ensures that.
          </p>

          <div className="grid-2">
            <div className="card">
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 20,
                  color: 'var(--color-text-primary)',
                }}
              >
                Weekly Plan Structure
              </h3>
              {[
                { step: '01', title: 'Founder sets weekly goal', desc: 'Define the north star for the week' },
                { step: '02', title: 'Domains create tasks', desc: 'Marketing, Sales, Dev — each owns their scope' },
                { step: '03', title: 'Staff executes', desc: 'Move tasks through TODO → IN PROGRESS → DONE' },
                { step: '04', title: 'System tracks completion', desc: 'EARLY / ON-TIME / LATE — automatically' },
              ].map((item) => (
                <div
                  key={item.step}
                  style={{
                    display: 'flex',
                    gap: 16,
                    marginBottom: 20,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'var(--color-brand-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--color-brand)',
                      flexShrink: 0,
                    }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <div
                      style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 20,
                  color: 'var(--color-text-primary)',
                }}
              >
                Performance Tracking
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: 'Completion Rate', value: 87, color: 'var(--color-brand)' },
                  { label: 'Early Completion', value: 42, color: 'var(--color-success)' },
                  { label: 'On-Time Rate', value: 35, color: 'var(--color-info)' },
                  { label: 'Late Rate', value: 10, color: 'var(--color-warning)' },
                ].map((item) => (
                  <div key={item.label}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {item.value}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${item.value}%`, background: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="badge status-ahead"
                style={{ marginTop: 24, display: 'inline-flex' }}
              >
                ↑ AHEAD of schedule
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          padding: '100px 24px',
          textAlign: 'center',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.15) 0%, transparent 60%)',
        }}
      >
        <h2
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            marginBottom: 16,
            letterSpacing: '-1.5px',
          }}
        >
          Ready to Build with Day One?
        </h2>
        <p
          style={{
            fontSize: 18,
            color: 'var(--color-text-secondary)',
            marginBottom: 40,
            maxWidth: 480,
            margin: '0 auto 40px',
          }}
        >
          Submit your startup for review. Once approved, you get access to the
          full Day One management platform.
        </p>
        <Link href="/register" className="btn btn-primary btn-lg">
          Register Your Startup →
        </Link>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 16 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--color-brand)', textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '24px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--color-text-muted)',
            fontSize: 13,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              background: 'var(--color-brand)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            D1
          </div>
          Day One Venture Studio
        </div>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          © 2026 Day One. All rights reserved.
        </span>
      </footer>
    </div>
  )
}
