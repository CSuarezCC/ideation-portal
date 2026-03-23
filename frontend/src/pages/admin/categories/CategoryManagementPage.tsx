import { useEffect, useState } from 'react'
import { campaignService, type Category } from '../../../services/campaignService'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

export function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    campaignService.listCategories(false).then(setCategories).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openCreate = () => { setEditing(null); setName(''); setDescription(''); setError(''); setShowModal(true) }
  const openEdit = (c: Category) => { setEditing(c); setName(c.name); setDescription(c.description || ''); setError(''); setShowModal(true) }

  const handleSave = async () => {
    if (name.length < 2 || name.length > 100) { setError('Name must be 2-100 characters'); return }
    setSaving(true); setError('')
    try {
      if (editing) {
        await campaignService.updateCategory(editing.categoryId, { name, description: description || undefined })
      } else {
        await campaignService.createCategory({ name, description: description || undefined })
      }
      setShowModal(false); load()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleToggle = async (c: Category) => {
    await campaignService.deactivateCategory(c.categoryId)
    load()
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Button data-testid="add-category-button" onClick={openCreate}>Add Category</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map(c => (
              <tr key={c.categoryId} data-testid={`category-row-${c.categoryId}`}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{c.description || '—'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive === 'true' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {c.isActive === 'true' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button data-testid={`edit-category-${c.categoryId}`} onClick={() => openEdit(c)} className="text-indigo-600 hover:text-indigo-900 text-sm">Edit</button>
                  <button data-testid={`toggle-category-${c.categoryId}`} onClick={() => handleToggle(c)} className="text-sm text-gray-600 hover:text-gray-900">
                    {c.isActive === 'true' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" data-testid="category-modal">
            <h3 className="text-lg font-semibold mb-4">{editing ? 'Edit Category' : 'Add Category'}</h3>
            {error && <div className="bg-red-50 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>}
            <div className="space-y-3">
              <Input label="Name" data-testid="category-name-input" value={name} onChange={e => setName(e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea data-testid="category-description-input" value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" rows={2} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button data-testid="save-category-button" onClick={handleSave} loading={saving}>Save</Button>
              <Button data-testid="cancel-category-button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
