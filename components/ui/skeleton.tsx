'use client'

import * as React from 'react'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle'
}

export const Skeleton = ({ className = '', variant = 'rect', ...props }: SkeletonProps) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full'
      case 'text':
        return 'h-4 w-full rounded-[4px]'
      case 'rect':
      default:
        return 'rounded-[12px]'
    }
  }

  return (
    <div
      className={`bg-surface relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent ${getVariantClass()} ${className} `}
      {...props}
    />
  )
}

// Para usar con Tailwind v4, agregaremos un Keyframe de shimmer si no estuviese por defecto.
// La animación shimmer se desplaza en X para lograr el efecto brillo.
// Definiremos los estilos de animación del shimmer en globals.css para mayor portabilidad, o lo podemos
// inyectar si no estuviera configurado en globals.css.
