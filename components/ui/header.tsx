'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, User, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  showBackButton?: boolean
  onBackClick?: () => void
  title?: string
  rightAction?: React.ReactNode
}

export const Header = ({
  showBackButton = false,
  onBackClick,
  title,
  rightAction,
}: HeaderProps) => {
  const router = useRouter()
  const [isVisible, setIsVisible] = React.useState(true)
  const lastScrollY = React.useRef(0)

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Mostrar siempre en el tope superior
      if (currentScrollY <= 50) {
        setIsVisible(true)
        lastScrollY.current = currentScrollY
        return
      }

      // Si scrollea hacia abajo, ocultar. Si scrollea hacia arriba, mostrar.
      if (currentScrollY > lastScrollY.current) {
        // Scrolleando hacia abajo
        setIsVisible(false)
      } else {
        // Scrolleando hacia arriba
        setIsVisible(true)
      }

      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleBack = () => {
    if (onBackClick) {
      onBackClick()
    } else {
      router.back()
    }
  }

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : '-100%' }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="border-line/60 pt-safe fixed top-0 right-0 left-0 z-40 border-b bg-white/80 backdrop-blur-md select-none"
    >
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left Side: Logo or Back Button */}
        <div className="flex items-center gap-3">
          {showBackButton ? (
            <button
              onClick={handleBack}
              className="text-ink-900 active:bg-surface flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95"
              aria-label="Regresar"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-[8px] text-lg font-bold text-white shadow-[0_2px_8px_rgba(26,60,255,0.25)]">
                s
              </div>
              <span className="text-h2 font-display text-ink-900 font-extrabold tracking-tight">
                saliendo<span className="text-accent">.ve</span>
              </span>
            </div>
          )}
        </div>

        {/* Center: Optional Title */}
        {title && (
          <div className="absolute left-1/2 max-w-[50%] -translate-x-1/2 truncate text-center">
            <span className="text-body text-ink-900 font-semibold">{title}</span>
          </div>
        )}

        {/* Right Side: Actions */}
        <div className="flex items-center gap-1">
          {rightAction ? (
            rightAction
          ) : (
            <>
              <button
                className="text-ink-600 active:bg-surface flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95"
                aria-label="Perfil de usuario"
              >
                <User className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <button
                className="text-ink-600 active:bg-surface flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95"
                aria-label="Menú principal"
              >
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}
