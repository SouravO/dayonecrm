'use client'

import { useActionState, useState } from 'react'
import { createTask, updateTaskStatus, deleteTask } from '@/features/tasks/actions'
import { DomainSelectWithQuickAdd } from '@/components/domains/DomainSelectWithQuickAdd'
import type { ActionState, Task, Domain, WeeklyPlan } from '@/types'

interface StaffMemberEntry {
  user_id: string
  profile: { id: string; full_name: string } | null
}

interface Props {
  startupId: string
  tasks: Task[]
  domains: Domain[]
  weeklyPlans: Pick<WeeklyPlan, 'id' | 'week_start' | 'week_end'>[]
  staffMembers: StaffMemberEntry[]
  isFounder?: boolean
  currentUserId?: string
  currentPlanId?: string
}

export function TasksClient({
  startupId,
  tasks,
  domains,
  weeklyPlans,
  staffMembers,
  isFounder = false,
  currentUserId,
  currentPlanId,
}: Props) {
  const [createState, createAction, createPending] = useActionState<ActionState, FormData>(createTask, {})
  const [statusState, statusAction, statusPending] = useActionState<ActionState, FormData>(updateTaskStatus, {})
  const [deleteState, deleteAction, deletePending] = useActionState<ActionState, FormData>(deleteTask, {})

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterDomain, setFilterDomain] = useState<string>('ALL')

  const statusColors: Record<string, string> = {
    TODO: 'badge-neutral',
    IN_PROGRESS: 'badge-info',
    DONE: 'badge-success',
  }

  const priorityColors: Record<string, string> = {
    LOW: 'badge-neutral',
    MEDIUM: 'badge-warning',
    HIGH: 'badge-danger',
  }

  const filteredTasks = tasks.filter((t) => {
    const statusMatch = filterStatus === 'ALL' || t.status === filterStatus
    const domainMatch = filterDomain === 'ALL' || t.domain_id === filterDomain
    return statusMatch && domainMatch
  })

  const todoCt = tasks.filter((t) => t.status === 'TODO').length
  const ipCt = tasks.filter((t) => t.status === 'IN_PROGRESS').length
  const doneCt = tasks.filter((t) => t.status === 'DONE').length

  return (
    <div>
      {(createState?.error || statusState?.error || deleteState?.error) && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          {createState?.error || statusState?.error || deleteState?.error}
        </div>
      )}
      {(createState?.success || statusState?.success || deleteState?.success) && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          {createState?.success || statusState?.success || deleteState?.success}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Todo', value: todoCt, badge: 'badge-neutral' },
          { label: 'In Progress', value: ipCt, badge: 'badge-info' },
          { label: 'Done', value: doneCt, badge: 'badge-success' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ padding: '12px 20px', flex: 1, minWidth: 100 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' }}>{s.value}</div>
            <span className={`badge ${s.badge}`} style={{ marginTop: 4, display: 'inline-flex' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input"
          style={{ width: 'auto', minWidth: 140 }}
        >
          <option value="ALL">All Statuses</option>
          <option value="TODO">Todo</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
        <select
          value={filterDomain}
          onChange={(e) => setFilterDomain(e.target.value)}
          className="input"
          style={{ width: 'auto', minWidth: 140 }}
        >
          <option value="ALL">All Domains</option>
          {domains.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          {showCreateForm ? '✕ Cancel' : '+ New Task'}
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'var(--color-brand)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Create Task</h3>
          <form action={createAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input type="hidden" name="startup_id" value={startupId} />
            {currentPlanId && <input type="hidden" name="weekly_plan_id" value={currentPlanId} />}

            <div className="form-group">
              <label className="label">Title *</label>
              <input name="title" className="input" placeholder="Task title" required />
            </div>

            <div className="grid-2">
              <DomainSelectWithQuickAdd
                startupId={startupId}
                initialDomains={domains}
              />
              <div className="form-group">
                <label className="label">Priority</label>
                <select name="priority" className="input">
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              {isFounder && (
                <div className="form-group">
                  <label className="label">Weekly Plan</label>
                  <select name="weekly_plan_id" className="input">
                    <option value="">None</option>
                    {weeklyPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {new Date(p.week_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(p.week_end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="label">Due Date</label>
                <input name="due_date" type="date" className="input" />
              </div>
            </div>

            {isFounder && (
              <div className="form-group">
                <label className="label">Assign To</label>
                <select name="assigned_to" className="input">
                  <option value="">Unassigned</option>
                  {staffMembers.map((m) => m.profile && (
                    <option key={m.user_id} value={m.user_id}>
                      {m.profile.full_name}
                    </option>
                  ))}
                </select>
                {staffMembers.length === 0 && (
                  <span style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>
                    No staff members added yet. You can assign tasks after adding staff in the Staff page.
                  </span>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="label">Description</label>
              <textarea name="description" className="input" rows={2} placeholder="Optional…" />
            </div>

            <button type="submit" disabled={createPending} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
              {createPending ? 'Creating…' : 'Create Task'}
            </button>
          </form>
        </div>
      )}

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No tasks found</h3>
          <p>Create a task to start tracking work</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredTasks.map((task) => {
            const domainName = domains.find((d) => d.id === task.domain_id)?.name
            const assignedMember = staffMembers.find((m) => m.user_id === task.assigned_to)

            return (
              <div key={task.id} className={`task-card ${task.status === 'DONE' ? 'done' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                        {task.description}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`badge ${statusColors[task.status] || 'badge-neutral'}`}>{task.status}</span>
                      <span className={`badge ${priorityColors[task.priority] || 'badge-neutral'}`}>{task.priority}</span>
                      {domainName && <span className="badge badge-info">{domainName}</span>}
                      {task.completion_status && (
                        <span className={`badge ${task.completion_status === 'EARLY' ? 'badge-success' : task.completion_status === 'ON_TIME' ? 'badge-info' : 'badge-warning'}`}>
                          {task.completion_status}
                        </span>
                      )}
                      {task.due_date && (
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          Due {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {assignedMember?.profile && (
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          → {assignedMember.profile.full_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {task.status !== 'DONE' && (
                      <form action={statusAction} style={{ display: 'flex', gap: 6 }}>
                        <input type="hidden" name="task_id" value={task.id} />
                        {task.status === 'TODO' && (
                          <button type="submit" name="status" value="IN_PROGRESS" className="btn btn-secondary btn-sm" disabled={statusPending}>
                            Start
                          </button>
                        )}
                        <button type="submit" name="status" value="DONE" className="btn btn-primary btn-sm" disabled={statusPending}>
                          ✓ Done
                        </button>
                      </form>
                    )}
                    {isFounder && (
                      <form action={deleteAction}>
                        <input type="hidden" name="id" value={task.id} />
                        <button type="submit" className="btn btn-ghost btn-sm btn-icon" disabled={deletePending} style={{ color: 'var(--color-danger)' }}>
                          ✕
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
