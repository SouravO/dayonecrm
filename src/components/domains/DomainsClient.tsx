'use client'

import { useActionState } from 'react'
import { createDomain, deleteDomain } from '@/features/domains/actions'
import type { ActionState, Domain } from '@/types'

interface Props {
  startupId: string
  domains: Domain[]
}

export function DomainsClient({ startupId, domains }: Props) {
  const [createState, createAction, createPending] = useActionState<ActionState, FormData>(createDomain, {})
  const [deleteState, deleteAction, deletePending] = useActionState<ActionState, FormData>(deleteDomain, {})

  const domainExamples = ['Marketing', 'Sales', 'Development', 'Design', 'Operations', 'Finance']

  return (
    <div>
      {(createState?.error || deleteState?.error) && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          {createState?.error || deleteState?.error}
        </div>
      )}
      {(createState?.success || deleteState?.success) && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          {createState?.success || deleteState?.success}
        </div>
      )}

      {/* Create domain form */}
      <div className="card" style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Add Domain</h2>
        <form action={createAction} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input type="hidden" name="startup_id" value={startupId} />
          <input
            name="name"
            className="input"
            placeholder="Domain name (e.g. Marketing)"
            required
            style={{ flex: 1, minWidth: 200 }}
          />
          <input
            name="description"
            className="input"
            placeholder="Optional description"
            style={{ flex: 2, minWidth: 200 }}
          />
          <button type="submit" disabled={createPending} className="btn btn-primary">
            {createPending ? 'Adding…' : '+ Add Domain'}
          </button>
        </form>

        {/* Quick add examples */}
        <div style={{ marginTop: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginRight: 8 }}>
            Quick add:
          </span>
          {domainExamples
            .filter((ex) => !domains.some((d) => d.name.toLowerCase() === ex.toLowerCase()))
            .map((ex) => (
              <form key={ex} action={createAction} style={{ display: 'inline-block', marginRight: 6, marginTop: 6 }}>
                <input type="hidden" name="startup_id" value={startupId} />
                <input type="hidden" name="name" value={ex} />
                <button type="submit" className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>
                  + {ex}
                </button>
              </form>
            ))}
        </div>
      </div>

      {/* Domain list */}
      {domains.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗂️</div>
          <h3>No domains yet</h3>
          <p>Create domains to organize your team by functional area</p>
        </div>
      ) : (
        <div className="grid-3">
          {domains.map((domain) => (
            <div key={domain.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🗂️</div>
                <form action={deleteAction}>
                  <input type="hidden" name="id" value={domain.id} />
                  <button
                    type="submit"
                    disabled={deletePending}
                    className="btn btn-ghost btn-sm btn-icon"
                    title="Delete domain"
                    style={{ color: 'var(--color-danger)', opacity: 0.6 }}
                  >
                    ✕
                  </button>
                </form>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                {domain.name}
              </div>
              {domain.description && (
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {domain.description}
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 10 }}>
                Created {new Date(domain.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
