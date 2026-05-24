'use client'

import * as React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      type = 'text',
      label,
      error,
      leftIcon,
      rightIcon,
      helperText,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId()
    const inputId = id || generatedId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    return (
      <div className={`flex w-full flex-col gap-1.5 ${disabled ? 'opacity-60' : ''}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-body-sm text-ink-600 leading-none font-semibold select-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="text-ink-400 pointer-events-none absolute left-4 flex items-center justify-center">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            type={type}
            id={inputId}
            disabled={disabled}
            className={`border-line text-body text-ink-900 placeholder:text-ink-400 focus:ring-primary/20 focus:border-primary h-[52px] w-full rounded-[14px] border bg-white px-4 transition-all duration-200 focus:ring-2 focus:outline-none ${leftIcon ? 'pl-11' : ''} ${rightIcon ? 'pr-11' : ''} ${error ? 'border-danger focus:ring-danger/20 focus:border-danger' : ''} ${className} `}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            {...props}
          />

          {rightIcon && (
            <span className="text-ink-400 pointer-events-none absolute right-4 flex items-center justify-center">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <span id={errorId} className="text-caption text-danger mt-0.5 font-medium" role="alert">
            {error}
          </span>
        )}

        {!error && helperText && (
          <span id={helperId} className="text-caption text-ink-400 mt-0.5">
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
