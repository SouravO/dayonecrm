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
            <div key={member.id} className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div
                  className="avatar avatar-lg"
                  style={{
                    background: 'linear-gradient(135deg, #ca2f2b 0%, #9e1f1c 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {member.profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {member.profile?.full_name || 'Staff Member'}
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        padding: '2px 8px',
                        borderRadius: 100,
                        background: '#f1ede4',
                        color: '#6e6354',
                        border: '1px solid #e0d8c8',
                      }}
                    >
                      Staff Operator
                    </span>
                  </div>

                  {member.profile?.email && (
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--color-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 3,
                        wordBreak: 'break-all',
                      }}
                    >
                      <span>✉️</span>
                      <span>{member.profile.email}</span>
                    </div>
                  )}

                  {member.profile?.phone && (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 3,
                      }}
                    >
                      <span>📞</span>
                      <span>{member.profile.phone}</span>
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 6,
                    }}
                  >
                    <span>📅</span>
                    <span>Joined {new Date(member.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <form action={removeAction}>
                  <input type="hidden" name="member_id" value={member.id} />
                  <button
                    type="submit"
                    disabled={removePending}
                    className="btn btn-danger btn-sm"
                    title="Remove staff member from startup"
                    style={{ fontSize: 12, padding: '4px 10px' }}
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
