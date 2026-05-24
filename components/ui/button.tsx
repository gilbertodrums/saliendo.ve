'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isButtonDisabled = disabled || isLoading

    // Estilos base de acuerdo a la guía de diseño
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none'

    // Tamaños: mínimo de altura de 48px para touch targets interactivos en móvil
    const sizes = {
      sm: 'h-10 px-4 text-body-sm', // para botones compactos excepcionales
      md: 'h-12 px-6 text-body', // 48px - touch target mínimo estándar
      lg: 'h-14 px-8 text-body', // 56px - botones principales/CTA flotantes
    }

    // Variantes según la paleta e identidad visual
    const variants = {
      primary:
        'bg-primary text-white shadow-[0_4px_12px_rgba(26,60,255,0.25)] hover:bg-primary-light active:bg-primary focus-visible:bg-primary-light',
      secondary:
        'bg-white text-ink-900 border-[1.5px] border-line hover:bg-surface active:bg-line focus-visible:bg-surface',
      accent:
        'bg-accent text-white shadow-[0_4px_12px_rgba(255,107,43,0.25)] hover:bg-opacity-90 active:bg-accent focus-visible:bg-opacity-90',
      ghost: 'bg-transparent text-ink-900 hover:bg-surface active:bg-line focus-visible:bg-surface',
    }

    const widthStyle = fullWidth ? 'w-full' : ''

    const combinedClasses = `${baseStyles} ${sizes[size]} ${variants[variant]} ${widthStyle} ${className}`

    return (
      <motion.button
        ref={ref as any}
        disabled={isButtonDisabled}
        className={combinedClasses}
        whileTap={{ scale: isButtonDisabled ? 1 : 0.97 }}
        transition={{ duration: 0.12, ease: [0.32, 0.72, 0, 1] }}
        aria-busy={isLoading}
        aria-live="polite"
        {...(props as any)}
      >
        {isLoading && (
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-current" strokeWidth={2} />
        )}
        {!isLoading && leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>}
        <span className="flex items-center">{children}</span>
        {!isLoading && rightIcon && <span className="ml-2 inline-flex">{rightIcon}</span>}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
