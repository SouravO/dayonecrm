'use client'

import { useActionState, useState } from 'react'
import { createWeeklyPlan, updateWeeklyPlan } from '@/features/weekly-plans/actions'
import type { ActionState, WeeklyPlan, Domain, Task } from '@/types'
import { createTask, updateTaskStatus } from '@/features/tasks/actions'

interface Props {
  startupId: string
  currentPlan: WeeklyPlan | null
  domains: Domain[]
  tasks: Task[]
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function WeeklyPlanClient({ startupId, currentPlan, domains, tasks }: Props) {
  const [createPlanState, createPlanAction, createPlanPending] = useActionState<ActionState, FormData>(createWeeklyPlan, {})
  const [updatePlanState, updatePlanAction, updatePlanPending] = useActionState<ActionState, FormData>(updateWeeklyPlan, {})
  const [createTaskState, createTaskAction, createTaskPending] = useActionState<ActionState, FormData>(createTask, {})
  const [updateStatusState, updateStatusAction, updateStatusPending] = useActionState<ActionState, FormData>(updateTaskStatus, {})

  const [showCreateTask, setShowCreateTask] = useState(false)
  const [editingGoal, setEditingGoal] = useState(false)

  const monday = getMonday(new Date())
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

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

  const tasksByDomain = domains.map((d) => ({
    domain: d,
    tasks: tasks.filter((t) => t.domain_id === d.id),
  }))
  const unassignedTasks = tasks.filter((t) => !t.domain_id)

  return (
    <div>
      {(createPlanState?.error || updatePlanState?.error || createTaskState?.error) && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          {createPlanState?.error || updatePlanState?.error || createTaskState?.error}
        </div>
      )}
      {(createPlanState?.success || updatePlanState?.success || createTaskState?.success) && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          {createPlanState?.success || updatePlanState?.success || createTaskState?.success}
        </div>
      )}

      {!currentPlan ? (
        /* Create weekly plan */
        <div className="card" style={{ maxWidth: 560 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Create This Week&apos;s Plan</h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24 }}>
            {monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} →{' '}
            {sunday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <form action={createPlanAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input type="hidden" name="startup_id" value={startupId} />
            <input type="hidden" name="week_start" value={toDateStr(monday)} />
            <input type="hidden" name="week_end" value={toDateStr(sunday)} />
            <div className="form-group">
              <label className="label">Weekly Goal</label>
              <textarea
                name="goal"
                className="input"
                placeholder="e.g. Increase customer acquisition by 20%"
                rows={3}
              />
            </div>
            <button type="submit" disabled={createPlanPending} className="btn btn-primary">
              {createPlanPending ? 'Creating…' : 'Create Weekly Plan'}
            </button>
          </form>
        </div>
      ) : (
        /* Current plan view */
        <div>
          {/* Goal section */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Weekly Goal</h2>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {new Date(currentPlan.week_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} →{' '}
                  {new Date(currentPlan.week_end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <button onClick={() => setEditingGoal(!editingGoal)} className="btn btn-ghost btn-sm">
                {editingGoal ? 'Cancel' : '✏️ Edit'}
              </button>
            </div>
            {editingGoal ? (
              <form action={updatePlanAction} style={{ display: 'flex', gap: 12 }}>
                <input type="hidden" name="id" value={currentPlan.id} />
                <textarea
                  name="goal"
                  className="input"
                  defaultValue={currentPlan.goal || ''}
                  rows={2}
                  style={{ flex: 1 }}
                />
                <button type="submit" disabled={updatePlanPending} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }}>
                  {updatePlanPending ? '…' : 'Save'}
                </button>
              </form>
            ) : (
              <p style={{ fontSize: 16, color: 'var(--color-text-secondary)', fontStyle: currentPlan.goal ? 'italic' : 'normal' }}>
                {currentPlan.goal || 'No goal set for this week'}
              </p>
            )}
          </div>

          {/* Add task */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Tasks ({tasks.length})</h2>
            <button onClick={() => setShowCreateTask(!showCreateTask)} className="btn btn-primary btn-sm">
              {showCreateTask ? '✕ Cancel' : '+ Add Task'}
            </button>
          </div>

          {showCreateTask && (
            <div className="card" style={{ marginBottom: 20, borderColor: 'var(--color-brand)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>New Task</h3>
              <form action={createTaskAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input type="hidden" name="startup_id" value={startupId} />
                <input type="hidden" name="weekly_plan_id" value={currentPlan.id} />
                <div className="form-group">
                  <label className="label">Title *</label>
                  <input name="title" className="input" placeholder="Task title" required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="label">Domain</label>
                    <select name="domain_id" className="input">
                      <option value="">No domain</option>
                      {domains.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Priority</label>
                    <select name="priority" className="input">
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Due Date</label>
                  <input name="due_date" type="date" className="input" min={currentPlan.week_start} max={currentPlan.week_end} />
                </div>
                <div className="form-group">
                  <label className="label">Description</label>
                  <textarea name="description" className="input" rows={2} placeholder="Optional details…" />
                </div>
                <button type="submit" disabled={createTaskPending} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
                  {createTaskPending ? 'Creating…' : 'Create Task'}
                </button>
              </form>
            </div>
          )}

          {/* Tasks by domain */}
          {tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No tasks yet</h3>
              <p>Add tasks to start tracking this week&apos;s work</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {tasksByDomain.filter((g) => g.tasks.length > 0).map(({ domain, tasks: domTasks }) => (
                <div key={domain.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span className="badge badge-info">{domain.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {domTasks.filter((t) => t.status === 'DONE').length}/{domTasks.length} done
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {domTasks.map((task) => (
                      <div key={task.id} className={`task-card ${task.status === 'DONE' ? 'done' : ''}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                              {task.title}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <span className={`badge ${statusColors[task.status] || 'badge-neutral'}`}>{task.status}</span>
                              <span className={`badge ${priorityColors[task.priority] || 'badge-neutral'}`}>{task.priority}</span>
                              {task.due_date && (
                                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                  Due {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                          {task.status !== 'DONE' && (
                            <form action={updateStatusAction} style={{ display: 'flex', gap: 6 }}>
                              <input type="hidden" name="task_id" value={task.id} />
                              {task.status === 'TODO' && (
                                <button
                                  type="submit"
                                  name="status"
                                  value="IN_PROGRESS"
                                  className="btn btn-secondary btn-sm"
                                  disabled={updateStatusPending}
                                >
                                  Start
                                </button>
                              )}
                              <button
                                type="submit"
                                name="status"
                                value="DONE"
                                className="btn btn-primary btn-sm"
                                disabled={updateStatusPending}
                              >
                                ✓ Done
                              </button>
                            </form>
                          )}
                          {task.status === 'DONE' && task.completion_status && (
                            <span className={`badge ${task.completion_status === 'EARLY' ? 'badge-success' : task.completion_status === 'ON_TIME' ? 'badge-info' : 'badge-warning'}`}>
                              {task.completion_status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {unassignedTasks.length > 0 && (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <span className="badge badge-neutral">No Domain</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {unassignedTasks.map((task) => (
                      <div key={task.id} className={`task-card ${task.status === 'DONE' ? 'done' : ''}`}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                          {task.title}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span className={`badge ${statusColors[task.status] || 'badge-neutral'}`}>{task.status}</span>
                          <span className={`badge ${priorityColors[task.priority] || 'badge-neutral'}`}>{task.priority}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
