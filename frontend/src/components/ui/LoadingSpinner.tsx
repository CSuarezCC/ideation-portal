export function LoadingSpinner({ fullPage = false }: { fullPage?: boolean }) {
  const spinner = (
    <svg
      data-testid="loading-spinner"
      className="animate-spin h-8 w-8 text-indigo-600"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        {spinner}
      </div>
    )
  }

  return <div className="flex justify-center py-8">{spinner}</div>
}
