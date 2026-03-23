import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { ComparativeIdeaRow } from '../../services/analyticsService'

interface ComparativeChartProps {
  data: ComparativeIdeaRow[]
}

const COLORS = { feasibilityAvg: '#3b82f6', impactAvg: '#10b981', innovationAvg: '#f59e0b', compositeScore: '#6366f1' }

export function ComparativeChart({ data }: ComparativeChartProps) {
  const chartData = data.map(d => ({ name: d.title.length > 20 ? d.title.slice(0, 20) + '…' : d.title, ...d }))

  return (
    <div data-testid="comparative-chart">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="feasibilityAvg" name="Feasibility" fill={COLORS.feasibilityAvg} />
          <Bar dataKey="impactAvg" name="Impact" fill={COLORS.impactAvg} />
          <Bar dataKey="innovationAvg" name="Innovation" fill={COLORS.innovationAvg} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
