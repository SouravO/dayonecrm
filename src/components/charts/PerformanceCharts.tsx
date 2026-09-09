'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface StartupBarData {
  name: string
  completion: number
  early: number
  onTime: number
  late: number
}

interface TrendData {
  week: string
  completion: number
}

interface StatusData {
  name: string
  value: number
  color: string
}

interface Props {
  barData: StartupBarData[]
  trendData: TrendData[]
  statusData: StatusData[]
}

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444']

export function PerformanceCharts({ barData, trendData, statusData }: Props) {
  const tooltipStyle = {
    backgroundColor: '#17171f',
    border: '1px solid #2a2a38',
    borderRadius: 8,
    color: '#f1f5f9',
    fontSize: 13,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Chart 1: Startup completion comparison */}
      <div className="chart-container">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
          Startup Completion Comparison
        </h3>
        {barData.length === 0 ? (
          <div className="empty-state">
            <p>No performance data available yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 4, right: 16, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: '#2a2a38' }}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                axisLine={{ stroke: '#2a2a38' }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [`${value}%`, '']}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
              />
              <Bar dataKey="completion" name="Completion %" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="early" name="Early %" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="onTime" name="On-Time %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" name="Late %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid-2">
        {/* Chart 2: Performance over time */}
        <div className="chart-container">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
            Completion Trend
          </h3>
          {trendData.length === 0 ? (
            <div className="empty-state">
              <p>Not enough historical data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ top: 4, right: 16, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#2a2a38' }}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#2a2a38' }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${value}%`, 'Avg Completion']}
                />
                <Line
                  type="monotone"
                  dataKey="completion"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 3: Task status breakdown */}
        <div className="chart-container">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
            Portfolio Task Status
          </h3>
          {statusData.every((d) => d.value === 0) ? (
            <div className="empty-state">
              <p>No task data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [value, name]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
                  formatter={(value) => value}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
