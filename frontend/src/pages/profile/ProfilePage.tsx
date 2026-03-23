import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { userService, type UserProfile } from '../../services/userService'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { RoleBadge } from '../../components/ui/RoleBadge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

interface ProfileForm { name: string; department: string }

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileForm>()

  useEffect(() => {
    userService.getProfile()
      .then((p) => { setProfile(p); reset({ name: p.name, department: p.department ?? '' }) })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setIsLoading(false))
  }, [reset])

  const onSubmit = async (data: ProfileForm) => {
    setError(null)
    try {
      await userService.updateProfile({ name: data.name, department: data.department || undefined })
      setProfile((prev) => prev ? { ...prev, name: data.name, department: data.department } : prev)
      setIsEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Failed to update profile')
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      {success && <p className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded-md">Profile updated successfully.</p>}
      {error && <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
            <p className="text-sm text-gray-900">{profile?.email}</p>
          </div>
          {profile && <RoleBadge role={profile.role} />}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input id="profile-name" label="Full Name" data-testid="profile-name-input"
              error={errors.name?.message}
              {...register('name', { required: 'Name is required' })} />
            <Input id="profile-department" label="Department" data-testid="profile-department-input"
              {...register('department')} />
            <div className="flex gap-3">
              <Button type="submit" isLoading={isSubmitting} data-testid="profile-save-button">Save</Button>
              <Button type="button" variant="secondary" onClick={() => { setIsEditing(false); reset() }}
                data-testid="profile-cancel-button">Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
              <p className="text-sm text-gray-900">{profile?.name}</p>
            </div>
            {profile?.department && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Department</p>
                <p className="text-sm text-gray-900">{profile.department}</p>
              </div>
            )}
            <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </div>
        )}
      </div>
    </div>
  )
}
