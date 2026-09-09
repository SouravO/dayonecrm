import { createClient } from '@/lib/supabase/server'
import { RegistrationActions } from '@/components/registrations/RegistrationActions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Registrations' }

export default async function RegistrationsPage() {
  const supabase = await createClient()

  const { data: requests } = await supabase
    .from('registration_requests')
    .select(`
      *,
      startup:startups(id, name, email, phone, status, created_at)
    `)
    .order('created_at', { ascending: false })

  const pending = (requests || []).filter((r) => r.status === 'PENDING')
  const reviewed = (requests || []).filter((r) => r.status !== 'PENDING')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Registration Requests</h1>
          <p className="page-subtitle">Review and approve startup applications</p>
        </div>
        <div className="badge badge-warning" style={{ display: 'inline-flex' }}>
          {pending.length} Pending
        </div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-secondary)' }}>
            Pending Review ({pending.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pending.map((req) => (
              <div key={req.id} className="card" style={{ borderColor: 'var(--color-warning)', borderWidth: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div className="avatar">
                        {req.startup?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {req.startup?.name}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                          {req.startup?.email}
                        </div>
                      </div>
                    </div>
                    {req.startup?.phone && (
                      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                        📞 {req.startup.phone}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Submitted {new Date(req.created_at).toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <RegistrationActions request={req as any} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-secondary)' }}>
            Reviewed ({reviewed.length})
          </h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Startup</th>
                  <th>Email</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Reviewed</th>
                </tr>
              </thead>
              <tbody>
                {reviewed.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {req.startup?.name}
                    </td>
                    <td>{req.startup?.email}</td>
                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td>
                      <RegistrationActions request={req as any} />
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {req.reviewed_at
                        ? new Date(req.reviewed_at).toLocaleDateString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {requests?.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No registration requests</h3>
          <p>New startup applications will appear here</p>
        </div>
      )}
    </div>
  )
}
