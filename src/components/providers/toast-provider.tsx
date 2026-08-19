'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

interface ToastContextType {
  toasts: Toast[]
  toast: (props: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, title, description, variant }])
    setTimeout(() => dismiss(id), 5000)
    return id
  }

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const variantClasses: Record<string, string> = {
    default: 'bg-white border-gray-200',
    destructive: 'bg-red-50 border-red-200',
    success: 'bg-green-50 border-green-200',
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[300px] max-w-md animate-slide-in ${variantClasses[toast.variant || 'default']}`}
      role="alert"
    >
      <div className="flex-1">
        <p className="font-medium text-gray-900">{toast.title}</p>
        {toast.description && (
          <p className="text-sm text-gray-600 mt-1">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}