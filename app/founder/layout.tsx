import { requireFounder } from '@/lib/auth/requireRole'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Founder Dashboard' }

const founderNavItems = [
  { href: '/founder', label: 'Dashboard', icon: '📊' },
  { href: '/founder/weekly-plan', label: 'Weekly Plan', icon: '📅' },
  { href: '/founder/tasks', label: 'Tasks', icon: '📋' },
  { href: '/founder/staff', label: 'Staff', icon: '👥' },
  { href: '/founder/domains', label: 'Domains', icon: '🗂️' },
]

export default async function FounderLayout({ children }: { children: React.ReactNode }) {
  const session = await requireFounder()

  // Get startup name for sidebar
  const supabase = await createClient()
  const { data: member } = await supabase
    .from('startup_members')
    .select('startup_id, startup:startups(name)')
    .eq('user_id', session.id)
    .eq('role', 'FOUNDER')
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
        brandSublabel="Founder Dashboard"
        navItems={founderNavItems}
        userName={session.full_name}
        userEmail={session.email}
        userRole="Founder"
      />
      <main className="main-content animate-fade-in">{children}</main>
    </div>
  )
}
