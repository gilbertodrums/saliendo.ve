'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  onClick?: () => void
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', interactive = false, children, onClick, ...props }, ref) => {
    const baseClasses = `
      bg-white rounded-[16px] border border-line
      shadow-[0_1px_3px_rgba(10,19,48,0.04)]
      transition-all duration-200
      ${interactive ? 'cursor-pointer hover:shadow-[0_4px_16px_rgba(10,19,48,0.08)] active:shadow-[0_2px_8px_rgba(10,19,48,0.06)]' : ''}
      ${className}
    `

    if (interactive) {
      return (
        <motion.div
          ref={ref as any}
          className={baseClasses}
          onClick={onClick}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (onClick && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              onClick()
            }
          }}
          {...(props as any)}
        >
          {children}
        </motion.div>
      )
    }

    return (
      <div ref={ref} className={baseClasses} onClick={onClick} {...props}>
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

export const CardHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col gap-1.5 p-5 ${className}`} {...props} />
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-h2 text-ink-900 leading-tight font-bold ${className}`} {...props} />
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = ({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-body-sm text-ink-600 ${className}`} {...props} />
)
CardDescription.displayName = 'CardDescription'

export const CardContent = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-5 pb-5 ${className}`} {...props} />
)
CardContent.displayName = 'CardContent'

export const CardFooter = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`bg-surface/50 border-line flex items-center rounded-b-[16px] border-t px-5 py-4 ${className}`}
    {...props}
  />
)
CardFooter.displayName = 'CardFooter'
