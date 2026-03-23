interface DimensionTabsProps {
  activeTab: string
  onTabChange: (dimension: string) => void
}

const TABS = [
  { key: 'composite', label: 'Composite' },
  { key: 'feasibility', label: 'Feasibility' },
  { key: 'impact', label: 'Impact' },
  { key: 'innovation', label: 'Innovation' },
  { key: 'most_recent', label: 'Most Recent' },
]

export function DimensionTabs({ activeTab, onTabChange }: DimensionTabsProps) {
  return (
    <div className="flex gap-1 border-b border-gray-200 mb-4" data-testid="dimension-tabs">
      {TABS.map(tab => (
        <button key={tab.key} data-testid={`tab-${tab.key}`} onClick={() => onTabChange(tab.key)}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === tab.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
