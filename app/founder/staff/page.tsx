import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth/getSession'
import { StaffClient } from '@/components/staff/StaffClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Staff Management' }

export default async function StaffPage() {
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

  const { data: staffMembers } = await supabase
    .from('startup_members')
    .select('*, profile:profiles(*)')
    .eq('startup_id', startupId)
    .eq('role', 'STAFF')
    .order('created_at', { ascending: true })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff</h1>
          <p className="page-subtitle">{staffMembers?.length || 0} team members</p>
        </div>
      </div>
      <StaffClient startupId={startupId} staff={staffMembers as any || []} />
    </div>
  )
}
