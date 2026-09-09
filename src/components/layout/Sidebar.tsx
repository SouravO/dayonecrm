'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/features/auth/actions'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface SidebarProps {
  brandLabel: string
  brandSublabel: string
  navItems: NavItem[]
  userName: string
  userEmail: string
  userRole: string
}

export function Sidebar({
  brandLabel,
  brandSublabel,
  navItems,
  userName,
  userEmail,
  userRole,
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              fontSize: 13,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            D1
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {brandLabel}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{brandSublabel}</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive =
            item.href === pathname || (item.href !== '/admin' && item.href !== '/founder' && item.href !== '/staff' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="avatar avatar-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userName}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userRole}
            </div>
          </div>
        </div>
        <form action={logout}>
          <button type="submit" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }}>
            🚪 Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
