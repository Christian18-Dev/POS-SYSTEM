'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'

export type UserRole = 'admin' | 'staff'

export interface User {
  id: string
  email: string
  name: string
  role?: UserRole
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'pos_token'

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

function removeAuthToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const toast = useToast()

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      const token = getAuthToken()
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.user) {
              setUser(data.user)
            } else {
              removeAuthToken()
            }
          } else {
            removeAuthToken()
          }
        } catch (error) {
          console.error('Auth check error:', error)
          removeAuthToken()
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setAuthToken(data.token)
        setUser(data.user)
        toast.success('Signed in successfully')
        return true
      } else {
        toast.error(data.error || 'Login failed')
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('An error occurred during login. Please try again.')
      return false
    }
  }

  const logout = () => {
    setUser(null)
    removeAuthToken()
    toast.info('Signed out')
    router.push('/')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

