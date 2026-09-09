import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import { DomainsClient } from '@/components/domains/DomainsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Domains' }

export default async function DomainsPage() {
  const session = await getSession()
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('startup_members')
    .select('startup_id')
    .eq('user_id', session!.id)
    .eq('role', 'FOUNDER')
    .single()

  const startupId = member?.startup_id
  if (!startupId) return <div>Startup not found</div>

  const { data: domains } = await supabase
    .from('domains')
    .select('*')
    .eq('startup_id', startupId)
    .order('created_at', { ascending: true })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Domains</h1>
          <p className="page-subtitle">Organize your team by functional area</p>
        </div>
      </div>
      <DomainsClient startupId={startupId} domains={domains || []} />
    </div>
  )
}
