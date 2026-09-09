'use client'

import { useActionState } from 'react'
import { useState } from 'react'
import { addStaffMember, removeStaffMember } from '@/features/staff/actions'
import type { ActionState, StartupMemberWithProfile } from '@/types'

interface Props {
  startupId: string
  staff: StartupMemberWithProfile[]
}

export function StaffClient({ startupId, staff }: Props) {
  const [addState, addAction, addPending] = useActionState<ActionState, FormData>(addStaffMember, {})
  const [removeState, removeAction, removePending] = useActionState<ActionState, FormData>(removeStaffMember, {})
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      {(addState?.error || removeState?.error) && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          {addState?.error || removeState?.error}
        </div>
      )}
      {(addState?.success || removeState?.success) && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          {addState?.success || removeState?.success}
        </div>
      )}

      {/* Add staff form */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
          style={{ marginBottom: showForm ? 20 : 0 }}
        >
          {showForm ? '✕ Cancel' : '+ Add Staff Member'}
        </button>

        {showForm && (
          <div className="card" style={{ borderColor: 'var(--color-brand)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Add Staff Member</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
              They&apos;ll be able to log in immediately with the credentials you set.
            </p>
            <form action={addAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input type="hidden" name="startup_id" value={startupId} />
              <div className="grid-2">
                <div className="form-group">
                  <label className="label">Full Name *</label>
                  <input name="full_name" className="input" placeholder="Jane Smith" required />
                </div>
                <div className="form-group">
                  <label className="label">Email *</label>
                  <input name="email" type="email" className="input" placeholder="jane@startup.com" required />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="label">Phone</label>
                  <input name="phone" type="tel" className="input" placeholder="+1 234 567 8900" />
                </div>
                <div className="form-group">
                  <label className="label">Temporary Password *</label>
                  <input name="password" type="password" className="input" placeholder="Min 8 characters" required minLength={8} />
                </div>
              </div>
              <button type="submit" disabled={addPending} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                {addPending ? 'Adding…' : 'Add Staff Member'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Staff list */}
      {staff.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>No staff yet</h3>
          <p>Add team members to assign tasks and track progress</p>
        </div>
      ) : (
        <div className="grid-2">
          {staff.map((member) => (
            <div key={member.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="avatar avatar-lg">
                  {member.profile?.full_name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {member.profile?.full_name}
                  </div>
                  {member.profile?.phone && (
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      {member.profile.phone}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Joined {new Date(member.created_at).toLocaleDateString()}
                  </div>
                </div>
                <form action={removeAction}>
                  <input type="hidden" name="member_id" value={member.id} />
                  <button
                    type="submit"
                    disabled={removePending}
                    className="btn btn-danger btn-sm"
                    title="Remove from startup"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
