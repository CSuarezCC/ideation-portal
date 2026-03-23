interface ScoreDisplayProps {
  label: string
  value: number
  max?: number
}

const getColor = (value: number, max: number) => {
  const pct = value / max
  if (pct >= 0.8) return 'text-green-600 bg-green-50'
  if (pct >= 0.5) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

export function ScoreDisplay({ label, value, max = 10 }: ScoreDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 w-24">{label}</span>
      <span className={`px-2 py-0.5 rounded text-sm font-semibold ${getColor(value, max)}`} data-testid={`score-${label.toLowerCase()}`}>
        {value.toFixed(1)}
      </span>
      <span className="text-xs text-gray-400">/ {max}</span>
    </div>
  )
}
