'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Clock, Shield, Armchair, Info, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSeats } from '@/lib/hooks/use-seats'
import { useCheckout } from '@/lib/store/use-checkout'
import { useToast } from '@/components/ui/toast'
import type { SeatPosition } from '@/types/database'

export default function SeatSelectorPage() {
  const router = useRouter()
  const params = useParams()
  const tripId = params.id as string
  const { toast } = useToast()

  // 1. Obtener autenticación para pasar currentUserId
  const { user } = useAuth()

  // 2. Hook de asientos en tiempo real (Supabase Realtime + RPC)
  const {
    layout,
    seatMapEntries,
    loading,
    error: seatsError,
    holdSeat,
    releaseSeat,
  } = useSeats(tripId, user?.id)

  // 3. Zustand store de checkout
  const checkoutTrip = useCheckout((state) => state.trip)
  const selectedSeat = useCheckout((state) => state.selectedSeat)
  const holdUntil = useCheckout((state) => state.holdUntil)
  const selectSeatInStore = useCheckout((state) => state.selectSeat)
  const clearCheckout = useCheckout((state) => state.clearCheckout)

  // 4. Temporizador de hold local
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null)

  // Determinar si el bus es doble piso
  const isDoubleDecker = React.useMemo(() => {
    if (!layout?.seats) return false
    return layout.seats.some((s: any) => s.floor === 2) || layout.seats.length > 40
  }, [layout])

  const [selectedFloor, setSelectedFloor] = React.useState<1 | 2>(1)

  // Calcular filas máximas de acuerdo al piso seleccionado
  const visibleSeatEntries = React.useMemo(() => {
    if (!seatMapEntries) return []
    if (!isDoubleDecker) return seatMapEntries

    return seatMapEntries.filter((entry) => {
      // Si la base de datos no tiene 'floor', asumimos filas 0..4 = Piso 1, 5..10 = Piso 2
      const floor = (entry.seat as any).floor || (entry.seat.y < 5 ? 1 : 2)
      return floor === selectedFloor
    })
  }, [seatMapEntries, isDoubleDecker, selectedFloor])

  // Calcular segundos restantes
  React.useEffect(() => {
    if (!holdUntil || !selectedSeat) {
      setSecondsLeft(null)
      return
    }

    const interval = setInterval(() => {
      const expiry = new Date(holdUntil).getTime()
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000))
      
      setSecondsLeft(diff)

      if (diff === 0) {
        clearInterval(interval)
        handleReleaseExpiredHold()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [holdUntil, selectedSeat])

  // Liberar reserva si el tiempo expira
  const handleReleaseExpiredHold = async () => {
    if (selectedSeat) {
      navigator.vibrate?.([100, 200, 100])
      toast('El tiempo de reserva de tu asiento ha expirado. Por favor, selecciona otro.', 'error')
      await releaseSeat(selectedSeat)
      await clearCheckout()
    }
  }

  // Liberar el asiento seleccionado antes de desmontar o cambiar de asiento
  const handleSeatClick = async (seatNumber: string, status: string, isMine: boolean) => {
    if (status === 'sold' || status === 'blocked') {
      toast('Este asiento ya está vendido o no disponible.', 'warning')
      return
    }

    if (status === 'held' && !isMine) {
      toast('Este asiento está reservado temporalmente por otro pasajero.', 'warning')
      return
    }

    // Toggle de asiento propio
    if (isMine) {
      navigator.vibrate?.(10)
      const res = await releaseSeat(seatNumber)
      if (res.success) {
        // Limpiar Zustand store
        await selectSeatInStore('') // vaciar
        toast('Asiento liberado correctamente.', 'info')
      }
      return
    }

    // Si ya tiene un asiento seleccionado, liberarlo primero (solo permitimos 1 asiento por transacción en el flujo rápido)
    if (selectedSeat) {
      const releaseRes = await releaseSeat(selectedSeat)
      if (!releaseRes.success) {
        toast('No se pudo liberar el asiento anterior. Intenta de nuevo.', 'error')
        return
      }
    }

    // Reservar el nuevo asiento
    navigator.vibrate?.(15)
    toast('Reservando asiento...', 'info')
    const holdRes = await holdSeat(seatNumber)
    
    if (holdRes.success) {
      // Guardar en Zustand store (10 minutos)
      await selectSeatInStore(seatNumber, 10)
      toast(`Asiento ${seatNumber} reservado por 10 minutos.`, 'success')
    } else {
      toast(holdRes.error || 'No se pudo reservar el asiento. Podría haber sido tomado recién.', 'error')
    }
  }

  // Formatear temporizador (MM:SS)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Dibujar anillo circular del hold timer
  const circleOffset = React.useMemo(() => {
    if (secondsLeft === null) return 0
    const totalDuration = 10 * 60 // 10 minutos en segundos
    const radius = 18
    const circumference = 2 * Math.PI * radius
    const percentage = secondsLeft / totalDuration
    return (1 - percentage) * circumference
  }, [secondsLeft])

  // Retornar a la página de búsqueda
  const handleBack = async () => {
    if (selectedSeat) {
      await releaseSeat(selectedSeat)
      await clearCheckout()
    }
    router.push('/buscar')
  }

  // Avanzar a checkout
  const handleProceed = () => {
    if (!selectedSeat) {
      toast('Selecciona un asiento para continuar', 'warning')
      return
    }
    router.push('/checkout/pasajero')
  }

  if (loading) {
    return (
      <div className="bg-surface min-h-screen flex flex-col justify-center items-center px-6 pt-14 pb-12 select-none">
        <div className="h-14 bg-white border-b border-line fixed top-0 left-0 right-0 z-40 flex items-center px-4">
          <ArrowLeft className="h-5 w-5 text-ink-900" />
        </div>
        <div className="flex flex-col items-center gap-4 text-center mt-12">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <h3 className="text-body font-bold text-ink-900">Cargando mapa de asientos...</h3>
          <p className="text-caption text-ink-600">Conectando con Supabase Realtime...</p>
        </div>
      </div>
    )
  }

  if (seatsError || !layout) {
    return (
      <div className="bg-surface min-h-screen flex flex-col justify-center items-center px-6 pt-14 pb-12 select-none">
        <div className="h-14 bg-white border-b border-line fixed top-0 left-0 right-0 z-40 flex items-center px-4">
          <button onClick={handleBack} className="cursor-pointer">
            <ArrowLeft className="h-5 w-5 text-ink-900" />
          </button>
        </div>
        <div className="bg-white border border-line rounded-[24px] p-6 text-center max-w-sm w-full shadow-md">
          <Info className="h-10 w-10 text-danger mx-auto mb-3" />
          <h4 className="text-body font-bold text-ink-900">No se pudo cargar el mapa</h4>
          <p className="text-caption text-ink-600 mt-2">
            Ocurrió un error al obtener la información del autobús. Por favor, regresa e intenta nuevamente.
          </p>
          <Button variant="primary" size="md" onClick={handleBack} className="mt-6 w-full cursor-pointer">
            Volver a Búsqueda
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface min-h-screen pb-32">
      {/* HEADER DE VIAJE */}
      <header className="border-line/60 pt-safe fixed top-0 right-0 left-0 z-40 border-b bg-white/80 backdrop-blur-md select-none">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            onClick={handleBack}
            className="text-ink-900 active:bg-surface flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95 cursor-pointer"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          
          <div className="absolute left-1/2 max-w-[60%] -translate-x-1/2 truncate text-center">
            <span className="block text-body-sm font-bold text-ink-900 leading-none">
              Selector de Asiento
            </span>
            <span className="text-[10px] text-primary font-bold block mt-0.5 uppercase tracking-wider">
              {checkoutTrip?.operator_name || 'Autobús'}
            </span>
          </div>

          <div className="h-10 w-10 flex items-center justify-center">
            {/* TIMER HOLD CIRCULAR */}
            <AnimatePresence>
              {secondsLeft !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative flex items-center justify-center w-9 h-9"
                  title="Tiempo restante de reserva"
                >
                  <svg className="w-9 h-9 rotate-[-90deg]">
                    <circle cx="18" cy="18" r="15" className="stroke-line" strokeWidth="2.5" fill="transparent" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      className={`transition-all duration-1000 ${
                        secondsLeft < 120 ? 'stroke-danger animate-pulse' : 'stroke-accent'
                      }`}
                      strokeWidth="2.5"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 15}
                      strokeDashoffset={circleOffset}
                    />
                  </svg>
                  <span className={`absolute text-[8px] font-extrabold ${secondsLeft < 120 ? 'text-danger font-black animate-pulse' : 'text-accent'}`}>
                    {Math.ceil(secondsLeft / 60)}m
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* DETALLES DEL VIAJE FLOTANTES */}
      <main className="pt-18 px-4 max-w-md mx-auto w-full">
        <div className="bg-white border border-line rounded-[20px] p-4.5 mb-5 shadow-[0_2px_8px_rgba(10,19,48,0.02)] select-none">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {checkoutTrip?.origin_city} → {checkoutTrip?.destination_city}
              </span>
              <h3 className="text-body font-bold text-ink-900 mt-2">
                Salida: {checkoutTrip?.departure_at ? new Date(checkoutTrip.departure_at).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'short' }) : ''}
              </h3>
              <p className="text-caption text-ink-600 mt-1 flex items-center gap-1.5 font-medium">
                <Clock className="h-3 w-3" strokeWidth={2} />
                Hora: {checkoutTrip?.departure_at ? new Date(checkoutTrip.departure_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
              </p>
            </div>
            <div className="text-right">
              <span className="text-caption text-ink-600 block">Precio pasaje</span>
              <span className="text-h2 font-extrabold text-accent font-numeric leading-none block mt-1">
                ${checkoutTrip?.price_usd?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* LEYENDA */}
        <div className="grid grid-cols-4 gap-2 bg-white border border-line rounded-[16px] p-3 text-center mb-6 text-[10px] font-bold text-ink-600 select-none">
          <div className="flex flex-col items-center gap-1">
            <div className="h-6 w-6 rounded-md border border-line bg-white" />
            <span>Libre</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-6 w-6 rounded-md bg-primary border border-primary flex items-center justify-center text-white text-[8px] font-bold">
              ✔
            </div>
            <span className="text-primary font-extrabold">Tu Selección</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-6 w-6 rounded-md bg-ink-400/20 border border-ink-400/10 flex items-center justify-center text-ink-400">
              ✖
            </div>
            <span>Reservado</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-6 w-6 rounded-md bg-ink-900/10 border border-ink-900/5" />
            <span>Vendido</span>
          </div>
        </div>

        {/* SELECTOR DE PISOS (DOUBLE DECKER SELECTOR) */}
        {isDoubleDecker && (
          <div className="flex bg-white border border-line p-1 rounded-[14px] mb-6 relative select-none">
            <button
              onClick={() => setSelectedFloor(1)}
              className={`flex-1 py-3 text-body-sm font-bold rounded-[10px] relative transition-colors ${
                selectedFloor === 1 ? 'text-white' : 'text-ink-600 active:bg-surface'
              }`}
            >
              {selectedFloor === 1 && (
                <motion.div
                  layoutId="floor-active-bg"
                  className="absolute inset-0 bg-primary rounded-[10px] z-0"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">Piso 1 (Inferior)</span>
            </button>
            <button
              onClick={() => setSelectedFloor(2)}
              className={`flex-1 py-3 text-body-sm font-bold rounded-[10px] relative transition-colors ${
                selectedFloor === 2 ? 'text-white' : 'text-ink-600 active:bg-surface'
              }`}
            >
              {selectedFloor === 2 && (
                <motion.div
                  layoutId="floor-active-bg"
                  className="absolute inset-0 bg-primary rounded-[10px] z-0"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">Piso 2 (Superior)</span>
            </button>
          </div>
        )}

        {/* CONTENEDOR BUS MAP FRAME */}
        <div className="bg-white border-[2px] border-line rounded-[32px] p-6 max-w-[280px] mx-auto w-full shadow-lg relative select-none">
          {/* VOLANTE DEL BUS (Frente) */}
          <div className="flex justify-between items-center pb-8 border-b-2 border-dashed border-line mb-6">
            <div className="h-9 w-9 rounded-full bg-surface border border-line flex items-center justify-center text-ink-400 font-extrabold text-[10px] uppercase">
              Puerta
            </div>
            
            {/* Cabina Chofer */}
            <div className="flex flex-col items-center gap-1">
              <div className="h-9 w-9 rounded-full border-[2.5px] border-ink-600 flex items-center justify-center text-ink-900 active:scale-95 transition-transform">
                {/* SVG Volante */}
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2v20M2 12h20" />
                </svg>
              </div>
              <span className="text-[8px] font-black text-ink-600 uppercase tracking-wider">Chofer</span>
            </div>
          </div>

          {/* GRID DE ASIENTOS CON PASILLO EN EL MEDIO (5 columnas: A, B, pasillo, C, D) */}
          <div
            className="grid gap-y-4"
            style={{
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            }}
          >
            {visibleSeatEntries.map((entry) => {
              const seat = entry.seat
              const status = entry.status
              const isMine = entry.isHeldByCurrentUser

              // Mapear x del layout (0,1,2,3) a columna grid (1,2, 4,5), dejando 3 para el pasillo
              const gridColStart = seat.x >= 2 ? seat.x + 2 : seat.x + 1

              // Ajuste de fila para Piso 2 (restar 5 filas si es el piso superior para renderizar arriba)
              const rowShift = isDoubleDecker && selectedFloor === 2 ? 5 : 0
              const gridRowStart = seat.y - rowShift + 1

              // Estilos visuales del asiento según estado
              let seatBg = 'bg-white border-line text-ink-600 active:bg-surface hover:border-primary/40'
              let iconColor = 'text-ink-400'
              
              if (status === 'held' && isMine) {
                seatBg = 'bg-primary border-primary text-white scale-105 shadow-[0_4px_12px_rgba(26,60,255,0.3)] ring-2 ring-primary/20'
                iconColor = 'text-white'
              } else if (status === 'held' && !isMine) {
                seatBg = 'bg-ink-400/25 border-ink-400/10 text-ink-400 pointer-events-none'
                iconColor = 'text-ink-400/40'
              } else if (status === 'sold') {
                seatBg = 'bg-ink-900/10 border-ink-900/5 text-ink-400 pointer-events-none'
                iconColor = 'text-ink-900/15'
              } else if (status === 'blocked') {
                seatBg = 'bg-ink-400/15 border-ink-400/5 text-ink-400 pointer-events-none'
                iconColor = 'text-ink-400/30'
              }

              // Estilos de tipo de asiento
              const isPremium = seat.type === 'premium' || seat.type === 'bed'

              return (
                <button
                  key={seat.number}
                  style={{
                    gridColumnStart: gridColStart,
                    gridRowStart: gridRowStart,
                  }}
                  onClick={() => handleSeatClick(seat.number, status, isMine)}
                  className={`h-11 w-11 rounded-[10px] border-[1.5px] flex flex-col items-center justify-center relative transition-all duration-120 select-none cursor-pointer ${seatBg}`}
                  aria-label={`Asiento ${seat.number}, ${status}`}
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center justify-center w-full h-full"
                  >
                    <Armchair className={`h-4.5 w-4.5 ${iconColor}`} strokeWidth={1.8} />
                    <span className="text-[9px] font-extrabold leading-none mt-0.5">{seat.number}</span>
                  </motion.div>

                  {/* Corona premium dorada */}
                  {isPremium && status === 'available' && (
                    <span className="absolute -top-1 -right-1 bg-amber-400 h-2 w-2 rounded-full border border-white" title="Asiento Premium" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* INFORMACIÓN Y NOTA ACCESIBLE */}
        <div className="mt-8 bg-surface border border-line rounded-[18px] p-4 flex gap-3 max-w-sm mx-auto select-none">
          <HelpCircle className="h-5 w-5 text-ink-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="space-y-0.5">
            <h5 className="text-caption font-bold text-ink-900">Reservas concurrentes</h5>
            <p className="text-[10px] text-ink-600 leading-normal">
              El mapa se actualiza en tiempo real. Si otro pasajero selecciona el asiento antes, este se bloqueará de inmediato.
            </p>
          </div>
        </div>
      </main>

      {/* CTA FLOTANTE INFERIOR PEGADO (STICKY BOTTOM CTA) */}
      <footer className="border-t border-line bg-white/95 backdrop-blur-md fixed bottom-0 right-0 left-0 z-40 select-none">
        <div className="max-w-md mx-auto w-full px-5 py-4 pb-safe flex items-center justify-between">
          <div className="flex flex-col justify-center">
            <span className="text-caption text-ink-600 font-medium">Asiento seleccionado</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-h1 font-display font-black leading-none ${selectedSeat ? 'text-primary' : 'text-ink-400'}`}>
                {selectedSeat || '--'}
              </span>
              {selectedSeat && (
                <span className="text-caption text-ink-600 font-bold font-numeric">
                  (${checkoutTrip?.price_usd?.toFixed(2)})
                </span>
              )}
            </div>
          </div>

          <Button
            variant="accent"
            size="lg"
            disabled={!selectedSeat}
            onClick={handleProceed}
            className="px-8 font-bold h-12 w-auto min-w-[160px] cursor-pointer"
          >
            Continuar
          </Button>
        </div>
      </footer>
    </div>
  )
}
