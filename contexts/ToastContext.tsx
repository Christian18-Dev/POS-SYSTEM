'use client'

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import styles from './ToastContext.module.css'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  title?: string
  durationMs?: number
}

interface ToastContextType {
  show: (toast: Omit<Toast, 'id'>) => void
  success: (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => void
  error: (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => void
  info: (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => void
  dismiss: (id: string) => void
  clear: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

function createToastId() {
  // Avoid pulling in crypto libs on the client; Date+random is fine for UI ids.
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Record<string, number>>({})

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current[id]
    if (timer) {
      window.clearTimeout(timer)
      delete timersRef.current[id]
    }
  }, [])

  const clear = useCallback(() => {
    setToasts([])
    Object.values(timersRef.current).forEach((t) => window.clearTimeout(t))
    timersRef.current = {}
  }, [])

  const show = useCallback(
    (toastInput: Omit<Toast, 'id'>) => {
      const id = createToastId()
      const durationMs = toastInput.durationMs ?? 4500

      const toast: Toast = { id, ...toastInput, durationMs }
      setToasts((prev) => [toast, ...prev].slice(0, 4)) // cap to avoid flooding

      if (durationMs > 0) {
        timersRef.current[id] = window.setTimeout(() => dismiss(id), durationMs)
      }
    },
    [dismiss]
  )

  const api = useMemo<ToastContextType>(
    () => ({
      show,
      success: (message, options) => show({ type: 'success', message, ...options }),
      error: (message, options) => show({ type: 'error', message, ...options }),
      info: (message, options) => show({ type: 'info', message, ...options }),
      dismiss,
      clear,
    }),
    [dismiss, clear, show]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.toastRegion} aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.type]}`}
            role={t.type === 'error' ? 'alert' : 'status'}
          >
            <div className={styles.toastBody}>
              {t.title && <div className={styles.toastTitle}>{t.title}</div>}
              <div className={styles.toastMessage}>{t.message}</div>
            </div>
            <button
              type="button"
              className={styles.toastClose}
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

