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
    .select('startup_id, startup:startups(name)')
    .eq('user_id', session.id)
    .eq('role', 'STAFF')
    .single()

  const startupName =
    member?.startup && !Array.isArray(member.startup)
      ? (member.startup as { name: string }).name
      : Array.isArray(member?.startup) && member.startup.length > 0
      ? (member.startup[0] as { name: string }).name
      : 'My Startup'

  return (
    <div className="app-shell">
      <Sidebar
        brandLabel={startupName}
        brandSublabel="Staff Portal"
        navItems={staffNavItems}
        userName={session.full_name}
        userEmail={session.email}
        userRole="Staff"
      />
      <main className="main-content animate-fade-in">{children}</main>
    </div>
  )
}
