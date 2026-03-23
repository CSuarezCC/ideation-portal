import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { ScoreBucket } from '../../services/analyticsService'

interface ScoreBarChartProps {
  data: ScoreBucket[]
  title: string
  color?: string
}

export function ScoreBarChart({ data, title, color = '#4f46e5' }: ScoreBarChartProps) {
  return (
    <div data-testid={`chart-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="rangeLabel" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
