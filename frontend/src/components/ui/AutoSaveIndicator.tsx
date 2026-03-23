export function AutoSaveIndicator({ lastSaved, isDirty }: { lastSaved: string | null; isDirty: boolean }) {
  if (isDirty) return <span data-testid="autosave-indicator" className="text-xs text-yellow-600">Unsaved changes</span>
  if (lastSaved) return <span data-testid="autosave-indicator" className="text-xs text-green-600">Saved at {new Date(lastSaved).toLocaleTimeString()}</span>
  return null
}
