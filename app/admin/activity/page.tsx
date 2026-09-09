import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Activity Log' }

function formatAction(action: string): string {
  return action
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${days}d ago`
}

const actionIcons: Record<string, string> = {
  APPROVED_REGISTRATION: '✅',
  REJECTED_REGISTRATION: '❌',
  CREATED_WEEKLY_PLAN: '📅',
  CREATED_TASK: '📋',
  COMPLETED_TASK: '🎯',
  UPDATED_TASK_STATUS: '🔄',
  CREATED_DOMAIN: '🗂️',
  ADDED_STAFF: '👥',
}

export default async function ActivityPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: startups } = await supabase.from('startups').select('id, name')
  const startupMap = (startups || []).reduce<Record<string, string>>((acc, s) => {
    acc[s.id] = s.name
    return acc
  }, {})

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">All actions across the portfolio</p>
        </div>
        <span className="badge badge-neutral">{logs?.length || 0} entries</span>
      </div>

      <div className="card">
        {logs?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚡</div>
            <h3>No activity yet</h3>
            <p>Actions across all startups will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {logs?.map((log, i) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                  padding: '14px 0',
                  borderBottom:
                    i < (logs?.length || 0) - 1
                      ? '1px solid var(--color-border-subtle)'
                      : 'none',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'var(--color-surface-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {actionIcons[log.action] || '⚡'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {formatAction(log.action)}
                  </div>
                  {log.startup_id && (
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {startupMap[log.startup_id] || 'Unknown startup'}
                    </div>
                  )}
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {Object.entries(log.metadata as Record<string, unknown>)
                        .filter(([k]) => !['startup_id', 'user_id'].includes(k))
                        .map(([k, v]) => `${k}: ${v}`)
                        .slice(0, 2)
                        .join(' · ')}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {timeAgo(log.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
