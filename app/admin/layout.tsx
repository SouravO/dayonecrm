import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/requireRole'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/registrations', label: 'Registrations', icon: '📋' },
  { href: '/admin/startups', label: 'Startups', icon: '🚀' },
  { href: '/admin/performance', label: 'Performance', icon: '📈' },
  { href: '/admin/activity', label: 'Activity', icon: '⚡' },
  { href: '/tv', label: 'Live TV Wall', icon: '📺' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()

  return (
    <div className="app-shell">
      <Sidebar
        brandLabel="Day One"
        brandSublabel="Admin Control Tower"
        navItems={adminNavItems}
        userName={session.full_name}
        userEmail={session.email}
        userRole="Administrator"
      />
      <main className="main-content animate-fade-in">{children}</main>
    </div>
  )
}
