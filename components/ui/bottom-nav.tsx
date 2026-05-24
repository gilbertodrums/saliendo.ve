'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface BottomNavTab {
  id: string
  label: string
  icon: LucideIcon
  href: string
}

interface BottomNavProps {
  tabs: BottomNavTab[]
  activeTab?: string
  onChange?: (id: string) => void
}

export const BottomNav = ({ tabs, activeTab, onChange }: BottomNavProps) => {
  const pathname = usePathname()

  // Si no se provee activeTab, intentamos emparejar por el pathname actual
  const currentActiveTab = activeTab || tabs.find((tab) => pathname === tab.href)?.id || tabs[0]?.id

  return (
    <nav className="border-line/60 pb-safe fixed right-0 bottom-0 left-0 z-40 border-t bg-white shadow-[0_-4px_16px_rgba(10,19,48,0.04)] select-none">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = currentActiveTab === tab.id

          const content = (
            <button
              onClick={() => onChange?.(tab.id)}
              className="relative flex h-12 w-16 flex-col items-center justify-center rounded-xl transition-colors focus:outline-none"
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Animación de fondo sutil para el tab activo */}
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-active-pill"
                  className="bg-primary/5 absolute inset-0 z-0 rounded-2xl"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icono con escala activa */}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ duration: 0.15 }}
                className={`relative z-10 ${isActive ? 'text-primary' : 'text-ink-600'}`}
              >
                <Icon className="h-5.5 w-5.5" strokeWidth={isActive ? 2 : 1.5} />
              </motion.div>

              {/* Label de texto */}
              <span
                className={`z-10 mt-1 text-[10px] font-semibold tracking-wide transition-colors duration-150 ${
                  isActive ? 'text-primary' : 'text-ink-600'
                }`}
              >
                {tab.label}
              </span>

              {/* Punto de notificación visual opcional o indicador mini de barra */}
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-dot"
                  className="bg-primary absolute bottom-0 z-10 h-1.5 w-1.5 rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          )

          if (tab.href && !onChange) {
            return (
              <Link key={tab.id} href={tab.href} passHref legacyBehavior>
                {content}
              </Link>
            )
          }

          return <React.Fragment key={tab.id}>{content}</React.Fragment>
        })}
      </div>
    </nav>
  )
}
