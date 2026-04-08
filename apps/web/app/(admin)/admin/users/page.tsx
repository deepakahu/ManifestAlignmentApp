'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  is_active: boolean
  disabled_at: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'disabled'>('all')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)

      // Call API route instead of directly using admin client
      const response = await fetch('/api/admin/users')

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error loading users:', error)
      alert('Failed to load users. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    if (searchQuery && !user.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filterStatus === 'active' && !user.is_active) return false
    if (filterStatus === 'disabled' && user.is_active) return false
    return true
  })

  const getOnlineStatus = (lastSignIn: string | null) => {
    if (!lastSignIn) return { status: 'never', color: 'text-gray-500', bgColor: 'bg-gray-100' }

    const diffMinutes = (Date.now() - new Date(lastSignIn).getTime()) / (1000 * 60)
    if (diffMinutes < 5) return { status: 'online', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (diffMinutes < 30) return { status: 'away', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { status: 'offline', color: 'text-gray-600', bgColor: 'bg-gray-100' }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage users, view activity, and control access
              </p>
            </div>
            <button
              onClick={loadUsers}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search by email
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Users</option>
                <option value="active">Active Only</option>
                <option value="disabled">Disabled Only</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-indigo-600">{users.length}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => !u.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Disabled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Seen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const onlineStatus = getOnlineStatus(user.last_sign_in_at)
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">
                              {user.email[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.email}</div>
                            <div className="text-xs text-gray-500">{user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${onlineStatus.color} ${onlineStatus.bgColor}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
                            {onlineStatus.status}
                          </span>
                          {!user.is_active && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-800 bg-red-100">
                              Disabled
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_sign_in_at
                          ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
