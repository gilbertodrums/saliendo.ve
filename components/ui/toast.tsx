'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { create } from 'zustand'
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react'

// ============================================================
// TOAST STATE STORE (Zustand)
// ============================================================
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  message: string
  type?: ToastType
  duration?: number
}

interface ToastStore {
  toasts: ToastItem[]
  addToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }))
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

// Hook para facilitar el uso en los componentes
export const useToast = () => {
  const addToast = useToastStore((state) => state.addToast)
  return {
    toast: (message: string, type?: ToastType, duration?: number) =>
      addToast(message, type, duration),
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
  }
}

// ============================================================
// TOAST COMPONENT
// ============================================================
export const ToastProvider = () => {
  const [mounted, setMounted] = React.useState(false)
  const { toasts, removeToast } = useToastStore()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const icons = {
    success: <CheckCircle2 className="text-success h-5 w-5" strokeWidth={2} />,
    error: <AlertCircle className="text-danger h-5 w-5" strokeWidth={2} />,
    warning: <AlertTriangle className="text-warning h-5 w-5" strokeWidth={2} />,
    info: <Info className="text-primary h-5 w-5" strokeWidth={2} />,
  }

  const borderColors = {
    success: 'border-success/20 bg-success/5',
    error: 'border-danger/20 bg-danger/5',
    warning: 'border-warning/20 bg-warning/5',
    info: 'border-primary/20 bg-primary/5',
  }

  return createPortal(
    <div className="pointer-events-none fixed top-4 left-1/2 z-[100] flex w-full max-w-[360px] -translate-x-1/2 flex-col gap-2 px-4 select-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          // Auto-dismiss setup
          return (
            <ToastSingle
              key={toast.id}
              toast={toast}
              icon={icons[toast.type || 'info']}
              bgBorderClass={borderColors[toast.type || 'info']}
              onClose={() => removeToast(toast.id)}
            />
          )
        })}
      </AnimatePresence>
    </div>,
    document.body
  )
}

interface ToastSingleProps {
  toast: ToastItem
  icon: React.ReactNode
  bgBorderClass: string
  onClose: () => void
}

const ToastSingle = ({ toast, icon, bgBorderClass, onClose }: ToastSingleProps) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, toast.duration || 3000)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-[16px] border bg-white p-4 shadow-[0_8px_24px_rgba(10,19,48,0.08)] ${bgBorderClass} `}
    >
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="text-body-sm text-ink-900 flex-1 leading-snug font-medium">
        {toast.message}
      </div>
      <button
        onClick={onClose}
        className="text-ink-400 hover:text-ink-600 flex-shrink-0 transition-transform active:scale-90"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" strokeWidth={2} />
      </button>
    </motion.div>
  )
}
