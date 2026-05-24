'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, User, ArrowLeft, X, Home, Search, Ticket, HelpCircle, LogIn } from 'lucide-react'
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
  const [menuOpen, setMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY <= 50) {
        setIsVisible(true)
        lastScrollY.current = currentScrollY
        return
      }

      if (currentScrollY > lastScrollY.current) {
        setIsVisible(false)
      } else {
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

  const menuLinks = [
    { label: 'Inicio', icon: Home, href: '/' },
    { label: 'Buscar viajes', icon: Search, href: '/buscar' },
    { label: 'Mis boletos', icon: Ticket, href: '/checkout/pasajero' },
    { label: 'Iniciar sesión', icon: LogIn, href: '/checkout/pasajero' },
    { label: 'Ayuda', icon: HelpCircle, href: '#' },
  ]

  return (
    <>
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
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 active:opacity-70 transition-opacity"
                aria-label="Ir al inicio"
              >
                <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-[8px] text-lg font-bold text-white shadow-[0_2px_8px_rgba(26,60,255,0.25)]">
                  s
                </div>
                <span className="text-h2 font-display text-ink-900 font-extrabold tracking-tight">
                  saliendo<span className="text-accent">.ve</span>
                </span>
              </button>
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
                  id="header-user-btn"
                  onClick={() => router.push('/checkout/pasajero')}
                  className="text-ink-600 active:bg-surface flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95"
                  aria-label="Perfil de usuario"
                >
                  <User className="h-5 w-5" strokeWidth={1.5} />
                </button>
                <button
                  id="header-menu-btn"
                  onClick={() => setMenuOpen(true)}
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

      {/* MENU DRAWER */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            {/* Bottom Sheet */}
            <motion.div
              key="menu-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] shadow-2xl pb-safe"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-line rounded-full" />
              </div>

              {/* Header del menú */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-line">
                <span className="text-body font-extrabold text-ink-900">Menú</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="h-9 w-9 flex items-center justify-center rounded-full bg-surface text-ink-600 active:scale-95 transition-transform"
                  aria-label="Cerrar menú"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              {/* Links */}
              <nav className="px-4 py-3 space-y-1">
                {menuLinks.map((link) => (
                  <button
                    key={link.href + link.label}
                    onClick={() => {
                      setMenuOpen(false)
                      router.push(link.href)
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-[16px] text-left text-body-sm font-semibold text-ink-900 hover:bg-surface active:bg-surface/80 transition-colors"
                  >
                    <link.icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
                    {link.label}
                  </button>
                ))}
              </nav>

              {/* Footer del menú */}
              <div className="px-5 py-4 border-t border-line">
                <p className="text-[10px] text-ink-400 text-center font-medium">
                  saliendo.ve &mdash; Transporte interprovincial Venezuela
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
