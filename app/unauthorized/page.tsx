import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-background)',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🔐</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>
          Access Denied
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 32, fontSize: 15 }}>
          You don&apos;t have permission to access this page.
        </p>
        <Link href="/login" className="btn btn-primary">
          Sign In with a different account
        </Link>
      </div>
    </div>
  )
}
