'use client'

import { useActionState, useEffect } from 'react'
import { updateTask } from '@/features/tasks/actions'
import { DomainSelectWithQuickAdd } from '@/components/domains/DomainSelectWithQuickAdd'
import type { ActionState, Task, Domain, WeeklyPlan } from '@/types'

export interface StaffMemberOption {
  user_id: string
  role?: string
  profile: {
    id: string
    full_name: string
    email?: string | null
  } | null
}

interface Props {
  task: Task | null
  onClose: () => void
  domains: Domain[]
  startupId: string
  weeklyPlans: Pick<WeeklyPlan, 'id' | 'week_start' | 'week_end' | 'title' | 'goal'>[]
  staffMembers: StaffMemberOption[]
}

export function TaskEditModal({
  task,
  onClose,
  domains,
  startupId,
  weeklyPlans,
  staffMembers,
}: Props) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateTask, {})

  useEffect(() => {
    if (state?.success) {
      onClose()
    }
  }, [state, onClose])

  if (!task) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--color-surface, #1e293b)',
          borderRadius: 12,
          border: '1px solid var(--color-border)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
            Edit Task
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-icon"
            style={{ fontSize: 18, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {state?.error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            {state.error}
          </div>
        )}

        <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input type="hidden" name="id" value={task.id} />

          <div className="form-group">
            <label className="label">Task Title *</label>
            <input
              name="title"
              defaultValue={task.title}
              className="input"
              required
              placeholder="e.g. Implement user authentication"
            />
          </div>

          <div className="grid-2">
            <DomainSelectWithQuickAdd
              startupId={startupId}
              initialDomains={domains}
              defaultValue={task.domain_id || ''}
            />
            <div className="form-group">
              <label className="label">Priority</label>
              <select name="priority" defaultValue={task.priority} className="input">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="label">Status</label>
              <select name="status" defaultValue={task.status} className="input">
                <option value="TODO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Due Date</label>
              <input
                name="due_date"
                type="date"
                defaultValue={task.due_date ? task.due_date.split('T')[0] : ''}
                className="input"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="label">Assign To</label>
              <select name="assigned_to" defaultValue={task.assigned_to || ''} className="input">
                <option value="">Unassigned</option>
                {staffMembers.map((m) => {
                  if (!m.profile) return null
                  const roleBadge = m.role ? ` • ${m.role}` : ''
                  const emailStr = m.profile.email ? ` (${m.profile.email})` : ''
                  return (
                    <option key={m.user_id} value={m.user_id}>
                      {m.profile.full_name}{emailStr}{roleBadge}
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Weekly Plan</label>
              <select name="weekly_plan_id" defaultValue={task.weekly_plan_id || ''} className="input">
                <option value="">No Plan</option>
                {weeklyPlans.map((p) => {
                  const startStr = new Date(p.week_start + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                  const endStr = new Date(p.week_end + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                  const label = p.title || p.goal || 'Weekly Sprint'
                  return (
                    <option key={p.id} value={p.id}>
                      {label} ({startStr} → {endStr})
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              name="description"
              defaultValue={task.description || ''}
              className="input"
              rows={3}
              placeholder="Task details, acceptance criteria, or links…"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isPending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
