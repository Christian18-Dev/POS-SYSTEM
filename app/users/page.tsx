'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { apiRequest } from '@/lib/api'
import styles from './users.module.css'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'staff'
  createdAt: string
}

export default function UsersPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <UsersContent />
      </Layout>
    </ProtectedRoute>
  )
}

function UsersContent() {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'admin' | 'staff',
  })

  useEffect(() => {
    if (!isAdmin) {
      return
    }
    fetchUsers()
  }, [isAdmin])

  const fetchUsers = async () => {
    try {
      const data = await apiRequest<{ success: boolean; users: User[] }>('/api/users')
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'staff',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users')
      return
    }

    try {
      if (editingUser) {
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        }
        if (formData.password) {
          updateData.password = formData.password
        }
        await apiRequest(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      } else {
        await apiRequest('/api/users', {
          method: 'POST',
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
          }),
        })
      }
      await fetchUsers()
      handleCloseModal()
      toast.success(editingUser ? 'User updated' : 'User created')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await apiRequest(`/api/users/${id}`, {
          method: 'DELETE',
        })
        await fetchUsers()
        toast.success('User deleted')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'An error occurred')
      }
    }
  }

  if (!isAdmin) {
    return (
      <div className={styles.users}>
        <div className={styles.unauthorized}>
          <h2>Access Denied</h2>
          <p>You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.users}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.headerTitle}>User Management</h1>
            <p className={styles.headerSubtitle}>Manage user accounts and permissions</p>
          </div>
          <button onClick={() => handleOpenModal()} className={styles.addButton}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add User
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loading}>Loading users...</div>
        ) : (
          <div className={styles.usersGrid}>
            {users.map((user) => (
              <div key={user.id} className={styles.userCard}>
                <div className={styles.userHeader}>
                  <div>
                    <h3 className={styles.userName}>{user.name}</h3>
                    <p className={styles.userEmail}>{user.email}</p>
                  </div>
                  <div className={styles.userActions}>
                    <button
                      onClick={() => handleOpenModal(user)}
                      className={styles.editButton}
                      aria-label="Edit user"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.5 4.5L15.5 8.5M3 17H7L15.5 8.5L11.5 4.5L3 13V17H7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className={styles.deleteButton}
                      aria-label="Delete user"
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 7.5H15M8.33333 10.8333V14.1667M11.6667 10.8333V14.1667M4.16667 7.5L4.99917 15.8333C4.99917 16.2754 5.17476 16.6993 5.48732 17.0118C5.79988 17.3244 6.22381 17.5 6.66584 17.5H13.3325C13.7745 17.5 14.1985 17.3244 14.511 17.0118C14.8236 16.6993 14.9992 16.2754 14.9992 15.8333L15.8333 7.5M7.5 7.5V5.83333C7.5 5.39131 7.67559 4.96738 7.98815 4.65482C8.30071 4.34226 8.72464 4.16667 9.16667 4.16667H10.8333C11.2754 4.16667 11.6993 4.34226 12.0118 4.65482C12.3244 4.96738 12.5 5.39131 12.5 5.83333V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className={styles.userDetails}>
                  <div className={styles.userDetail}>
                    <span className={styles.detailLabel}>Role:</span>
                    <span className={`${styles.detailValue} ${styles[user.role]}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                  <div className={styles.userDetail}>
                    <span className={styles.detailLabel}>Created:</span>
                    <span className={styles.detailValue}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {users.length === 0 && !isLoading && (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>No users yet</h3>
            <p>Get started by adding your first user</p>
            <button onClick={() => handleOpenModal()} className={styles.addButton}>
              Add User
            </button>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={handleCloseModal} className={styles.closeButton}>
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="password">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })}
                  required
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={styles.formActions}>
                <button type="button" onClick={handleCloseModal} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  {editingUser ? 'Update' : 'Create'} User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
