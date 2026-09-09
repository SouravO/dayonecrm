'use client'

import { useActionState } from 'react'
import { approveRegistration, rejectRegistration } from '@/features/registrations/actions'
import type { ActionState, RegistrationRequestWithStartup } from '@/types'
import { useState } from 'react'

interface Props {
  request: RegistrationRequestWithStartup
}

export function RegistrationActions({ request }: Props) {
  const [approveState, approveAction, approvePending] = useActionState<ActionState, FormData>(
    approveRegistration,
    {}
  )
  const [rejectState, rejectAction, rejectPending] = useActionState<ActionState, FormData>(
    rejectRegistration,
    {}
  )
  const [showRejectForm, setShowRejectForm] = useState(false)

  if (request.status !== 'PENDING') {
    return (
      <span
        className={`badge ${request.status === 'APPROVED' ? 'badge-success' : 'badge-danger'}`}
      >
        {request.status}
      </span>
    )
  }

  return (
    <div>
      {(approveState?.error || rejectState?.error) && (
        <div className="alert alert-error" style={{ marginBottom: 12 }}>
          {approveState?.error || rejectState?.error}
        </div>
      )}

      {!showRejectForm && (
        <div style={{ display: 'flex', gap: 8 }}>
          <form action={approveAction}>
            <input type="hidden" name="requestId" value={request.id} />
            <input type="hidden" name="startupId" value={request.startup_id} />
            <button type="submit" disabled={approvePending} className="btn btn-primary btn-sm">
              {approvePending ? 'Approving…' : '✓ Approve'}
            </button>
          </form>
          <button
            onClick={() => setShowRejectForm(true)}
            className="btn btn-danger btn-sm"
          >
            ✕ Reject
          </button>
        </div>
      )}

      {showRejectForm && (
        <form action={rejectAction} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="hidden" name="requestId" value={request.id} />
          <input type="hidden" name="startupId" value={request.startup_id} />
          <textarea
            name="rejection_reason"
            className="input"
            placeholder="Reason for rejection…"
            rows={2}
            required
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={rejectPending} className="btn btn-danger btn-sm">
              {rejectPending ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
            <button
              type="button"
              onClick={() => setShowRejectForm(false)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
