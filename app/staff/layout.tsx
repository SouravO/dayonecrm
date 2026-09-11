import { requireStaff } from '@/lib/auth/requireRole'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Staff Dashboard' }

const staffNavItems = [
  { href: '/staff', label: 'My Dashboard', icon: '📊' },
  { href: '/staff/tasks', label: 'My Tasks', icon: '📋' },
]

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStaff()

  const supabase = await createClient()
  const { data: member } = await supabase
    .from('startup_members')
    .select('startup_id, startup:startups(name, logo_url)')
    .eq('user_id', session.id)
    .eq('role', 'STAFF')
    .single()

  const startupObj = Array.isArray(member?.startup)
    ? member.startup[0] as { name: string; logo_url?: string | null } | undefined
    : member?.startup as { name: string; logo_url?: string | null } | undefined

  const startupName = startupObj?.name || 'My Startup'
  const startupLogoUrl = startupObj?.logo_url || null

  return (
    <div className="app-shell">
      <Sidebar
        brandLabel={startupName}
        brandSublabel="Staff Portal"
        brandLogoUrl={startupLogoUrl}
        navItems={staffNavItems}
        userName={session.full_name}
        userEmail={session.email}
        userRole="Staff"
      />
      <main className="main-content animate-fade-in">{children}</main>
    </div>
  )
}
