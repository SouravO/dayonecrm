'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createWeeklyPlan, updateWeeklyPlan, deleteWeeklyPlan } from '@/features/weekly-plans/actions'
import type { ActionState, WeeklyPlan, Domain, Task } from '@/types'
import { createTask, updateTaskStatus } from '@/features/tasks/actions'
import { DomainSelectWithQuickAdd } from '@/components/domains/DomainSelectWithQuickAdd'
import { TaskEditModal, type StaffMemberOption } from '@/components/tasks/TaskEditModal'

interface StaffMemberEntry {
  user_id: string
  role?: string
  profile: { id: string; full_name: string; email?: string | null } | null
}

interface Props {
  startupId: string
  allPlans: WeeklyPlan[]
  activePlan: WeeklyPlan | null
  domains: Domain[]
  tasks: Task[]
  staffMembers?: StaffMemberEntry[]
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function WeeklyPlanClient({
  startupId,
  allPlans,
  activePlan,
  domains,
  tasks,
  staffMembers = [],
}: Props) {
  const router = useRouter()

  const [createPlanState, createPlanAction, createPlanPending] = useActionState<ActionState, FormData>(createWeeklyPlan, {})
  const [updatePlanState, updatePlanAction, updatePlanPending] = useActionState<ActionState, FormData>(updateWeeklyPlan, {})
  const [deletePlanState, deletePlanAction, deletePlanPending] = useActionState<ActionState, FormData>(deleteWeeklyPlan, {})
  const [createTaskState, createTaskAction, createTaskPending] = useActionState<ActionState, FormData>(createTask, {})
  const [updateStatusState, updateStatusAction, updateStatusPending] = useActionState<ActionState, FormData>(updateTaskStatus, {})

  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [editingPlan, setEditingPlan] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Default dates for new plan modal
  const defaultMonday = getMonday(new Date())
  const defaultSunday = new Date(defaultMonday)
  defaultSunday.setDate(defaultMonday.getDate() + 6)

  const [newPlanStart, setNewPlanStart] = useState(toDateStr(defaultMonday))
  const [newPlanEnd, setNewPlanEnd] = useState(toDateStr(defaultSunday))

  // Close create modal on success
  useEffect(() => {
    if (createPlanState?.success) {
      setShowCreatePlanModal(false)
    }
  }, [createPlanState])

  // Close edit plan on success
  useEffect(() => {
    if (updatePlanState?.success) {
      setEditingPlan(false)
    }
  }, [updatePlanState])

  const todayStr = toDateStr(new Date())

  const setDatePreset = (preset: 'this_week' | 'next_week' | 'next_month') => {
    if (preset === 'this_week') {
      const mon = getMonday(new Date())
      const sun = new Date(mon)
      sun.setDate(mon.getDate() + 6)
      setNewPlanStart(toDateStr(mon))
      setNewPlanEnd(toDateStr(sun))
    } else if (preset === 'next_week') {
      const nextMon = getMonday(new Date())
      nextMon.setDate(nextMon.getDate() + 7)
      const nextSun = new Date(nextMon)
      nextSun.setDate(nextMon.getDate() + 6)
      setNewPlanStart(toDateStr(nextMon))
      setNewPlanEnd(toDateStr(nextSun))
    } else if (preset === 'next_month') {
      const now = new Date()
      const nextMonthFirst = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const nextMonthLast = new Date(now.getFullYear(), now.getMonth() + 2, 0)
      setNewPlanStart(toDateStr(nextMonthFirst))
      setNewPlanEnd(toDateStr(nextMonthLast))
    }
  }

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

  const getPlanStatusBadge = (plan: WeeklyPlan) => {
    if (todayStr >= plan.week_start && todayStr <= plan.week_end) {
      return <span className="badge badge-success" style={{ fontSize: 10 }}>Current</span>
    }
    if (todayStr < plan.week_start) {
      return <span className="badge badge-info" style={{ fontSize: 10 }}>Upcoming</span>
    }
    return <span className="badge badge-neutral" style={{ fontSize: 10 }}>Past</span>
  }

  return (
    <div>
      {(createPlanState?.error || updatePlanState?.error || deletePlanState?.error || createTaskState?.error) && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          {createPlanState?.error || updatePlanState?.error || deletePlanState?.error || createTaskState?.error}
        </div>
      )}
      {(createPlanState?.success || updatePlanState?.success || deletePlanState?.success || createTaskState?.success) && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          {createPlanState?.success || updatePlanState?.success || deletePlanState?.success || createTaskState?.success}
        </div>
      )}

      {/* Plan Switcher Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
          background: 'var(--color-surface, #1e293b)',
          padding: '12px 16px',
          borderRadius: 10,
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Plans:
          </span>
          {allPlans.length === 0 ? (
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No plans created yet</span>
          ) : (
            allPlans.map((plan) => {
              const isSelected = activePlan?.id === plan.id
              const startStr = new Date(plan.week_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const endStr = new Date(plan.week_end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const displayName = plan.title || plan.goal || `Sprint (${startStr} - ${endStr})`

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => router.push(`/founder/weekly-plan?plan=${plan.id}`)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: isSelected ? 'var(--color-brand)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--color-text-primary)',
                    border: isSelected ? '1px solid var(--color-brand)' : '1px solid var(--color-border)',
                  }}
                >
                  <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </span>
                  <span style={{ opacity: isSelected ? 0.9 : 0.7, fontSize: 11 }}>
                    ({startStr} - {endStr})
                  </span>
                  {getPlanStatusBadge(plan)}
                </button>
              )
            })
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowCreatePlanModal(true)}
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span>+ New Plan</span>
        </button>
      </div>

      {!activePlan ? (
        /* No active plan selected or none exists */
        <div className="card" style={{ maxWidth: 580, margin: '40px auto', textAlign: 'center', padding: 36 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Weekly Plan Selected</h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24 }}>
            Create a new weekly plan or sprint to organize your team&apos;s tasks, track KPIs, and drive execution.
          </p>
          <button
            type="button"
            onClick={() => setShowCreatePlanModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            + Create New Weekly Plan
          </button>
        </div>
      ) : (
        /* Active plan view */
        <div>
          {/* Goal section */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                    {activePlan.title || 'Weekly Plan'}
                  </h2>
                  {getPlanStatusBadge(activePlan)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  📅 {new Date(activePlan.week_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} →{' '}
                  {new Date(activePlan.week_end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditingPlan(!editingPlan)}
                  className="btn btn-ghost btn-sm"
                >
                  {editingPlan ? 'Cancel' : '✏️ Edit Plan'}
                </button>
                <form action={deletePlanAction} onSubmit={(e) => {
                  if (!confirm('Are you sure you want to delete this weekly plan? Tasks will remain unlinked.')) {
                    e.preventDefault()
                  }
                }}>
                  <input type="hidden" name="id" value={activePlan.id} />
                  <button
                    type="submit"
                    className="btn btn-ghost btn-sm btn-icon"
                    disabled={deletePlanPending}
                    style={{ color: 'var(--color-danger)' }}
                    title="Delete Plan"
                  >
                    🗑️
                  </button>
                </form>
              </div>
            </div>

            {editingPlan ? (
              <form action={updatePlanAction} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                <input type="hidden" name="id" value={activePlan.id} />
                <div className="grid-2">
                  <div className="form-group">
                    <label className="label">Plan Title</label>
                    <input
                      name="title"
                      className="input"
                      defaultValue={activePlan.title || ''}
                      placeholder="e.g. Sprint 2: Core Features"
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Weekly Goal</label>
                    <input
                      name="goal"
                      className="input"
                      defaultValue={activePlan.goal || ''}
                      placeholder="e.g. Launch MVP & onboard first 10 users"
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="label">Start Date</label>
                    <input
                      name="week_start"
                      type="date"
                      className="input"
                      defaultValue={activePlan.week_start}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">End Date</label>
                    <input
                      name="week_end"
                      type="date"
                      className="input"
                      defaultValue={activePlan.week_end}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setEditingPlan(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatePlanPending}
                    className="btn btn-primary btn-sm"
                  >
                    {updatePlanPending ? 'Saving…' : 'Save Plan'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                  GOAL:
                </div>
                <p style={{ fontSize: 15, color: 'var(--color-text-secondary)', fontStyle: activePlan.goal ? 'italic' : 'normal', margin: 0 }}>
                  &ldquo;{activePlan.goal || 'No goal set for this sprint'}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Add task toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Tasks in this Plan ({tasks.length})</h2>
            <button onClick={() => setShowCreateTask(!showCreateTask)} className="btn btn-primary btn-sm">
              {showCreateTask ? '✕ Cancel' : '+ Add Task'}
            </button>
          </div>

          {/* Create Task Form */}
          {showCreateTask && (
            <div className="card" style={{ marginBottom: 20, borderColor: 'var(--color-brand)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>New Task for {activePlan.title || 'Weekly Plan'}</h3>
              <form action={createTaskAction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input type="hidden" name="startup_id" value={startupId} />
                <input type="hidden" name="weekly_plan_id" value={activePlan.id} />
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
                  <div className="form-group">
                    <label className="label">Due Date</label>
                    <input
                      name="due_date"
                      type="date"
                      className="input"
                      defaultValue={activePlan.week_end}
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Assign To</label>
                    <select name="assigned_to" className="input">
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
              <h3>No tasks in this plan</h3>
              <p>Add tasks above or assign existing tasks to this plan</p>
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
                    {domTasks.map((task) => {
                      const assignedMember = staffMembers.find((m) => m.user_id === task.assigned_to)
                      return (
                        <div key={task.id} className={`task-card ${task.status === 'DONE' ? 'done' : ''}`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                                {task.title}
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                <span className={`badge ${statusColors[task.status] || 'badge-neutral'}`}>{task.status}</span>
                                <span className={`badge ${priorityColors[task.priority] || 'badge-neutral'}`}>{task.priority}</span>
                                {task.due_date && (
                                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                    Due {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                                {assignedMember?.profile && (
                                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                    → {assignedMember.profile.full_name} {assignedMember.profile.email ? `(${assignedMember.profile.email})` : ''}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => setEditingTask(task)}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                title="Edit task"
                              >
                                ✏️ Edit
                              </button>
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
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {unassignedTasks.length > 0 && (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <span className="badge badge-neutral">No Domain</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {unassignedTasks.map((task) => {
                      const assignedMember = staffMembers.find((m) => m.user_id === task.assigned_to)
                      return (
                        <div key={task.id} className={`task-card ${task.status === 'DONE' ? 'done' : ''}`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                                {task.title}
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                <span className={`badge ${statusColors[task.status] || 'badge-neutral'}`}>{task.status}</span>
                                <span className={`badge ${priorityColors[task.priority] || 'badge-neutral'}`}>{task.priority}</span>
                                {task.due_date && (
                                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                    Due {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                                {assignedMember?.profile && (
                                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                    → {assignedMember.profile.full_name} {assignedMember.profile.email ? `(${assignedMember.profile.email})` : ''}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => setEditingTask(task)}
                                className="btn btn-secondary btn-sm"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                title="Edit task"
                              >
                                ✏️ Edit
                              </button>
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
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Weekly Plan Modal */}
      {showCreatePlanModal && (
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
            if (e.target === e.currentTarget) setShowCreatePlanModal(false)
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 540,
              backgroundColor: 'var(--color-surface, #1e293b)',
              borderRadius: 12,
              border: '1px solid var(--color-border)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Create Weekly Plan</h2>
              <button
                type="button"
                onClick={() => setShowCreatePlanModal(false)}
                className="btn btn-ghost btn-sm btn-icon"
              >
                ✕
              </button>
            </div>

            <form action={createPlanAction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input type="hidden" name="startup_id" value={startupId} />

              <div className="form-group">
                <label className="label">Plan Title</label>
                <input
                  name="title"
                  className="input"
                  placeholder="e.g. Sprint 1, Week 38, Marketing Sprint..."
                />
              </div>

              {/* Date Presets */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, color: 'var(--color-text-muted)' }}>Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => setDatePreset('this_week')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11.5, padding: '3px 8px' }}
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset('next_week')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11.5, padding: '3px 8px' }}
                >
                  Next Week
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset('next_month')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11.5, padding: '3px 8px' }}
                >
                  Next Month
                </button>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="label">Start Date *</label>
                  <input
                    name="week_start"
                    type="date"
                    className="input"
                    value={newPlanStart}
                    onChange={(e) => setNewPlanStart(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">End Date *</label>
                  <input
                    name="week_end"
                    type="date"
                    className="input"
                    value={newPlanEnd}
                    onChange={(e) => setNewPlanEnd(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Weekly Goal / Objective</label>
                <textarea
                  name="goal"
                  className="input"
                  placeholder="e.g. Complete branding, build first prototype, acquire initial 20 leads…"
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowCreatePlanModal(false)}
                  className="btn btn-secondary"
                  disabled={createPlanPending}
                >
                  Cancel
                </button>
                <button type="submit" disabled={createPlanPending} className="btn btn-primary">
                  {createPlanPending ? 'Creating…' : 'Create Weekly Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          domains={domains}
          startupId={startupId}
          weeklyPlans={allPlans}
          staffMembers={staffMembers}
        />
      )}
    </div>
  )
}
