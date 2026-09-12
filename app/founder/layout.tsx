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

  // Get startup name and logo for sidebar
  const supabase = await createClient()
  const { data: member } = await supabase
    .from('startup_members')
    .select('startup_id, startup:startups(name, logo_url)')
    .eq('user_id', session.id)
    .eq('role', 'FOUNDER')
    .single()

  const startupObj = Array.isArray(member?.startup)
    ? member.startup[0] as { name: string; logo_url?: string | null } | undefined
    : member?.startup as { name: string; logo_url?: string | null } | undefined

  const startupName = startupObj?.name || 'My Startup'
  const startupLogoUrl = startupObj?.logo_url || null

  const navItems = [
    ...founderNavItems,
    {
      href: member?.startup_id ? `/tv/${member.startup_id}` : '/tv',
      label: 'Live TV Wall',
      icon: '📺',
    },
  ]

  return (
    <div className="app-shell">
      <Sidebar
        brandLabel={startupName}
        brandSublabel="Founder Dashboard"
        brandLogoUrl={startupLogoUrl}
        startupId={member?.startup_id}
        navItems={navItems}
        userName={session.full_name}
        userEmail={session.email}
        userRole="Founder"
      />
      <main className="main-content animate-fade-in">{children}</main>
    </div>
  )
}
