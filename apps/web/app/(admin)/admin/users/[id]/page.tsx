'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface UserDetail {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  is_active: boolean
  disabled_at: string | null
  disabled_by: string | null
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const [categories, setCategories] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])

  useEffect(() => {
    loadUserData()
  }, [userId])

  const loadUserData = async () => {
    try {
      setLoading(true)

      // Call API route
      const response = await fetch(`/api/admin/users/${userId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`)
      }

      const data = await response.json()

      setUser(data.user)
      setCategories(data.categories || [])
      setGoals(data.goals || [])
      setActivities(data.activities || [])
      setChallenges(data.challenges || [])
    } catch (error) {
      console.error('Error loading user:', error)
      alert('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!user) return

    const action = user.is_active ? 'disable' : 'enable'
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    try {
      setActionLoading(true)

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_status',
          is_active: !user.is_active,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`)
      }

      alert(`User ${action}d successfully`)
      await loadUserData()
    } catch (error) {
      console.error(`Error ${action}ing user:`, error)
      alert(`Failed to ${action} user`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteData = async (dataType: 'categories' | 'goals' | 'activities' | 'challenges') => {
    if (!confirm(`Delete ALL ${dataType} for this user? This cannot be undone.`)) return

    try {
      setActionLoading(true)

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_data',
          dataType,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to delete ${dataType}`)
      }

      alert(`All ${dataType} deleted successfully`)
      await loadUserData()
    } catch (error) {
      console.error(`Error deleting ${dataType}:`, error)
      alert(`Failed to delete ${dataType}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!confirm('PERMANENTLY delete this user and ALL their data? This cannot be undone.')) return
    if (!confirm('Type DELETE to confirm deletion.')) return

    try {
      setActionLoading(true)

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      alert('User deleted successfully')
      router.push('/admin/users')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">User not found</p>
          <Link href="/admin/users" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
            Back to Users
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/users" className="text-gray-400 hover:text-gray-600">
                ← Back
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.email}</h1>
                <p className="mt-1 text-sm text-gray-500">User ID: {user.id}</p>
              </div>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              user.is_active ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'
            }`}>
              {user.is_active ? 'Active' : 'Disabled'}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(user.created_at).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Sign In</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {user.last_sign_in_at
                  ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                  : 'Never'}
              </dd>
            </div>
            {user.disabled_at && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Disabled At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.disabled_at).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="text-3xl font-bold text-indigo-600">{categories.length}</div>
            <div className="text-sm text-gray-600 mt-1">Categories</div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="text-3xl font-bold text-purple-600">{goals.length}</div>
            <div className="text-sm text-gray-600 mt-1">Goals</div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="text-3xl font-bold text-green-600">{activities.length}</div>
            <div className="text-sm text-gray-600 mt-1">Activities</div>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="text-3xl font-bold text-yellow-600">{challenges.length}</div>
            <div className="text-sm text-gray-600 mt-1">Challenges</div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`w-full px-4 py-3 border rounded-md text-sm font-medium ${
              user.is_active
                ? 'border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100'
                : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
            } disabled:opacity-50`}
          >
            {user.is_active ? 'Disable User' : 'Enable User'}
          </button>
        </div>

        {/* Data Management */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => handleDeleteData('categories')}
              disabled={actionLoading || categories.length === 0}
              className="px-4 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium disabled:opacity-50"
            >
              Delete Categories ({categories.length})
            </button>
            <button
              onClick={() => handleDeleteData('goals')}
              disabled={actionLoading || goals.length === 0}
              className="px-4 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium disabled:opacity-50"
            >
              Delete Goals ({goals.length})
            </button>
            <button
              onClick={() => handleDeleteData('activities')}
              disabled={actionLoading || activities.length === 0}
              className="px-4 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium disabled:opacity-50"
            >
              Delete Activities ({activities.length})
            </button>
            <button
              onClick={() => handleDeleteData('challenges')}
              disabled={actionLoading || challenges.length === 0}
              className="px-4 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium disabled:opacity-50"
            >
              Delete Challenges ({challenges.length})
            </button>
          </div>
        </div>

        {/* Data Preview */}
        {(categories.length > 0 || goals.length > 0 || activities.length > 0 || challenges.length > 0) && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Preview</h2>

            {categories.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Categories ({categories.length})</h3>
                <div className="space-y-2">
                  {categories.slice(0, 5).map(cat => (
                    <div key={cat.id} className="text-sm text-gray-600 flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>
                  ))}
                  {categories.length > 5 && (
                    <div className="text-xs text-gray-400">+ {categories.length - 5} more</div>
                  )}
                </div>
              </div>
            )}

            {goals.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Goals ({goals.length})</h3>
                <div className="space-y-2">
                  {goals.slice(0, 5).map(goal => (
                    <div key={goal.id} className="text-sm text-gray-600">
                      {goal.title} {goal.category && `(${goal.category.name})`}
                    </div>
                  ))}
                  {goals.length > 5 && (
                    <div className="text-xs text-gray-400">+ {goals.length - 5} more</div>
                  )}
                </div>
              </div>
            )}

            {activities.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Activities ({activities.length})</h3>
                <div className="space-y-2">
                  {activities.slice(0, 5).map(activity => (
                    <div key={activity.id} className="text-sm text-gray-600">
                      {activity.title} {activity.goal && `(${activity.goal.title})`}
                    </div>
                  ))}
                  {activities.length > 5 && (
                    <div className="text-xs text-gray-400">+ {activities.length - 5} more</div>
                  )}
                </div>
              </div>
            )}

            {challenges.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Challenges ({challenges.length})</h3>
                <div className="space-y-2">
                  {challenges.slice(0, 5).map(challenge => (
                    <div key={challenge.id} className="text-sm text-gray-600">
                      {challenge.title} - {challenge.status}
                    </div>
                  ))}
                  {challenges.length > 5 && (
                    <div className="text-xs text-gray-400">+ {challenges.length - 5} more</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h2>
          <p className="text-sm text-red-700 mb-4">
            Permanently delete this user account and all associated data. This cannot be undone.
          </p>
          <button
            onClick={handleDeleteUser}
            disabled={actionLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            Delete User Permanently
          </button>
        </div>
      </div>
    </div>
  )
}
