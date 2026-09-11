'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/features/auth/actions'
import { Logo } from '@/components/brand/Logo'
import {
  LayoutDashboard,
  CalendarRange,
  CheckSquare,
  Users2,
  Layers,
  ClipboardList,
  Rocket,
  TrendingUp,
  Activity,
  LogOut,
  Building2,
  Sparkles,
  Tv,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: string
}

import { CompanyLogo } from '@/components/brand/CompanyLogo'

interface SidebarProps {
  brandLabel: string
  brandSublabel: string
  brandLogoUrl?: string | null
  navItems: NavItem[]
  userName: string
  userEmail: string
  userRole: string
}

function renderNavIcon(icon: string) {
  const iconProps = { className: 'w-4 h-4 transition-colors' }
  switch (icon) {
    case 'tv':
    case 'monitor':
    case '📺':
      return <Tv {...iconProps} />
    case 'dashboard':
    case '📊':
      return <LayoutDashboard {...iconProps} />
    case 'calendar':
    case 'weekly-plan':
    case '📅':
      return <CalendarRange {...iconProps} />
    case 'tasks':
    case '📋':
      return <CheckSquare {...iconProps} />
    case 'staff':
    case 'users':
    case '👥':
      return <Users2 {...iconProps} />
    case 'domains':
    case '🗂️':
    case '📁':
      return <Layers {...iconProps} />
    case 'registrations':
      return <ClipboardList {...iconProps} />
    case 'startups':
    case '🚀':
    case '🏢':
      return <Rocket {...iconProps} />
    case 'performance':
    case '📈':
      return <TrendingUp {...iconProps} />
    case 'activity':
    case '⚡':
      return <Activity {...iconProps} />
    default:
      return <LayoutDashboard {...iconProps} />
  }
}

export function Sidebar({
  brandLabel,
  brandSublabel,
  brandLogoUrl,
  navItems,
  userName,
  userEmail,
  userRole,
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-logo">
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: 16 }}>
          <Logo size="sm" />
        </Link>

        {/* Executive Startup / Account Switcher Card */}
        <div
          style={{
            padding: '10px 12px',
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5dfcb',
            boxShadow: '0 1px 3px rgba(45, 38, 25, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <CompanyLogo logoUrl={brandLogoUrl} name={brandLabel} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.2px',
              }}
            >
              {brandLabel}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                color: 'var(--color-text-muted)',
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#059669',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                {brandSublabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-section-label">Navigation</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => {
            const isActive =
              item.href === pathname ||
              (item.href !== '/admin' &&
                item.href !== '/founder' &&
                item.href !== '/staff' &&
                pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-link-icon">{renderNavIcon(item.icon)}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && (
                  <span
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: 'var(--color-brand)',
                    }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User footer */}
      <div className="sidebar-footer" style={{ padding: '16px 14px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#ede6c8',
              color: '#1e1b18',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              border: '1px solid #dfd7b8',
              flexShrink: 0,
            }}
          >
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
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
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                color: 'var(--color-brand)',
              }}
            >
              {userRole}
            </div>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="btn btn-ghost btn-sm"
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              gap: 8,
              color: 'var(--color-text-secondary)',
              fontSize: 12.5,
              padding: '7px 10px',
              borderRadius: 8,
            }}
          >
            <LogOut className="w-3.5 h-3.5 opacity-70" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
