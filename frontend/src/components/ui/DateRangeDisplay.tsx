export function DateRangeDisplay({ startDate, endDate, label }: { startDate: string; endDate: string; label: string }) {
  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  return (
    <div data-testid={`date-range-${label.toLowerCase().replace(/\s/g, '-')}`} className="text-sm text-gray-600">
      <span className="font-medium text-gray-700">{label}:</span> {fmt(startDate)} — {fmt(endDate)}
    </div>
  )
}
