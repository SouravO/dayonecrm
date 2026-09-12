// ─── Enums ─────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'FOUNDER' | 'STAFF'
export type StartupStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'INACTIVE'
export type MemberRole = 'FOUNDER' | 'STAFF'
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type CompletionStatus = 'EARLY' | 'ON_TIME' | 'LATE'
export type PerformanceStatus = 'AHEAD' | 'ON_TRACK' | 'BEHIND' | 'AT_RISK'
export type WeeklyCompletionStatus =
  | 'COMPLETED_EARLY'
  | 'COMPLETED_ON_TIME'
  | 'COMPLETED_LATE'
  | 'INCOMPLETE'

// ─── DB Row Types ───────────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string
  email?: string | null
  phone: string | null
  role: Role
  created_at: string
  updated_at: string
}

export interface Startup {
  id: string
  name: string
  email: string
  phone: string | null
  status: StartupStatus
  logo_url?: string | null
  created_at: string
  updated_at: string
}

export interface StartupMember {
  id: string
  startup_id: string
  user_id: string
  role: MemberRole
  created_at: string
}

export interface RegistrationRequest {
  id: string
  startup_id: string
  status: RegistrationStatus
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
}

export interface Domain {
  id: string
  startup_id: string
  name: string
  description: string | null
  created_at: string
}

export interface WeeklyPlan {
  id: string
  startup_id: string
  week_start: string
  week_end: string
  goal: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  startup_id: string
  weekly_plan_id: string | null
  domain_id: string | null
  assigned_to: string | null
  created_by: string
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  completion_status: CompletionStatus | null
}

export interface TaskUpdate {
  id: string
  task_id: string
  user_id: string
  comment: string
  created_at: string
}

export interface WeeklyPerformance {
  id: string
  startup_id: string
  weekly_plan_id: string
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  in_progress_tasks: number
  early_tasks: number
  on_time_tasks: number
  late_tasks: number
  overdue_tasks: number
  completion_rate: number
  early_rate: number
  on_time_rate: number
  late_rate: number
  performance_status: PerformanceStatus
  planned_end_date: string | null
  actual_completion_date: string | null
  days_early: number | null
  weekly_completion_status: WeeklyCompletionStatus
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  startup_id: string | null
  user_id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// ─── Joined / Enriched Types ────────────────────────────────────────────────

export interface StartupWithFounder extends Startup {
  founder: Profile | null
  latest_performance: WeeklyPerformance | null
}

export interface TaskWithDetails extends Task {
  assigned_profile: Profile | null
  created_by_profile: Profile | null
  domain: Domain | null
}

export interface RegistrationRequestWithStartup extends RegistrationRequest {
  startup: Startup
  founder: Profile | null
}

export interface ActivityLogWithProfile extends ActivityLog {
  profile: Profile | null
}

export interface StartupMemberWithProfile extends StartupMember {
  profile: Profile
}

// ─── Form / Action State Types ──────────────────────────────────────────────

export type ActionState = {
  error?: string
  success?: string
  data?: unknown
}

// ─── Session / Auth ─────────────────────────────────────────────────────────

export interface SessionUser {
  id: string
  email: string
  role: Role
  full_name: string
}
