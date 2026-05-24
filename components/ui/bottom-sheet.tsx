'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  showCloseButton?: boolean
  maxHeight?: string // e.g. 'max-h-[85vh]'
}

export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  maxHeight = 'max-h-[85vh]',
}: BottomSheetProps) => {
  const [mounted, setMounted] = React.useState(false)
  const dragControls = useDragControls()

  React.useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Cerrar al presionar la tecla Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleDragEnd = (event: any, info: any) => {
    // Si la velocidad hacia abajo es alta (> 300px/s) o si se arrastró más del 30% de la pantalla hacia abajo
    if (info.velocity.y > 300 || info.offset.y > 150) {
      onClose()
    }
  }

  if (!mounted) return null

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop con Blur y Opacidad */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="bg-ink-900/40 absolute inset-0 backdrop-blur-[8px]"
            aria-hidden="true"
          />

          {/* Bottom Sheet Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'sheet-title' : undefined}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false} // Hacemos que solo se pueda arrastrar desde el área de arrastre o el header
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className={`pb-safe relative flex w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_-8px_32px_rgba(10,19,48,0.12)] select-none ${maxHeight}`}
          >
            {/* Tirador visual de arrastre */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex w-full cursor-grab touch-none flex-col items-center pt-3 pb-2 select-none active:cursor-grabbing"
            >
              <div className="bg-ink-400/30 h-1.5 w-12 rounded-full" />
            </div>

            {/* Header del Bottom Sheet */}
            {(title || showCloseButton) && (
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="border-line flex touch-none items-center justify-between border-b px-5 pb-3 select-none"
              >
                {title ? (
                  <h2 id="sheet-title" className="text-h2 text-ink-900 leading-none font-bold">
                    {title}
                  </h2>
                ) : (
                  <div />
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="bg-surface text-ink-600 flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-95"
                    aria-label="Cerrar modal"
                  >
                    <X className="h-5 w-5" strokeWidth={2} />
                  </button>
                )}
              </div>
            )}

            {/* Contenido (Scrollable interno) */}
            <div className="flex-1 overflow-y-auto px-5 py-4 select-text">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
