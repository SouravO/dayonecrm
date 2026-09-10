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

const CHART_COLORS = ['#ca2f2b', '#10b981', '#f59e0b', '#0ea5e9']

export function PerformanceCharts({ barData, trendData, statusData }: Props) {
  const tooltipStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e2dbbe',
    borderRadius: 8,
    color: '#1e1b18',
    boxShadow: '0 4px 16px rgba(45, 38, 25, 0.08)',
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e2dbbe" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#5a5348', fontSize: 12 }}
                axisLine={{ stroke: '#e2dbbe' }}
              />
              <YAxis
                tick={{ fill: '#5a5348', fontSize: 12 }}
                axisLine={{ stroke: '#e2dbbe' }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [`${value}%`, '']}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#5a5348' }}
              />
              <Bar dataKey="completion" name="Completion %" fill="#ca2f2b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="early" name="Early %" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="onTime" name="On-Time %" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e2dbbe" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#5a5348', fontSize: 11 }}
                  axisLine={{ stroke: '#e2dbbe' }}
                />
                <YAxis
                  tick={{ fill: '#5a5348', fontSize: 11 }}
                  axisLine={{ stroke: '#e2dbbe' }}
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
                  stroke="#ca2f2b"
                  strokeWidth={2}
                  dot={{ fill: '#ca2f2b', strokeWidth: 0, r: 4 }}
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
                  wrapperStyle={{ fontSize: 12, color: '#5a5348' }}
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
