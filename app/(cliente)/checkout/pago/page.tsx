'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Clock, 
  Check, 
  Smartphone, 
  Coins, 
  Building2, 
  AlertTriangle, 
  CreditCard 
} from 'lucide-react'
import { Header } from '@/components/ui/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCheckout } from '@/lib/store/use-checkout'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'

// Tasa de cambio BCV simulada para Venezuela
const BCV_RATE = 36.50

export default function CheckoutPagoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  
  // Zustand store
  const trip = useCheckout((state) => state.trip)
  const tripId = useCheckout((state) => state.tripId)
  const selectedSeat = useCheckout((state) => state.selectedSeat)
  const holdUntil = useCheckout((state) => state.holdUntil)
  const passenger = useCheckout((state) => state.passenger)
  const idempotencyKey = useCheckout((state) => state.idempotencyKey)
  const clearCheckout = useCheckout((state) => state.clearCheckout)

  // Local state
  const [selectedMethod, setSelectedMethod] = React.useState<'pago_movil' | 'binance' | 'transferencia'>('pago_movil')
  
  // Form input states
  const [reference, setReference] = React.useState('')
  const [originBank, setOriginBank] = React.useState('')
  const [confirming, setConfirming] = React.useState(false)

  // Timer local
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null)

  // Redirigir si no hay datos del paso anterior
  React.useEffect(() => {
    if (!tripId || !selectedSeat || !passenger) {
      toast('Faltan datos del pasajero para proceder al pago.', 'warning')
      router.push('/checkout/pasajero')
    }
  }, [tripId, selectedSeat, passenger, router])

  // Countdown timer effect
  React.useEffect(() => {
    if (!holdUntil) return

    const interval = setInterval(() => {
      const expiry = new Date(holdUntil).getTime()
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000))
      
      setSecondsLeft(diff)

      if (diff === 0) {
        clearInterval(interval)
        toast('El tiempo de reserva de tu asiento ha expirado. Por favor, selecciona otro.', 'error')
        router.push(`/viaje/${tripId}`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [holdUntil, tripId, router])

  // Precio final en Bs
  const priceUSD = trip?.price_usd || 0
  const priceVES = React.useMemo(() => {
    return priceUSD * BCV_RATE
  }, [priceUSD])

  // Validaciones
  const validatePayment = () => {
    if (!reference.trim() || reference.trim().length < 4) {
      toast('Por favor, ingresa el número de referencia o ID de transacción de tu pago.', 'warning')
      return false
    }
    if (selectedMethod !== 'binance' && !originBank.trim()) {
      toast('Por favor, ingresa el banco emisor del pago.', 'warning')
      return false
    }
    return true
  }

  // Ejecutar confirmación en base de datos
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePayment()) return

    setConfirming(true)
    toast('Confirmando transacción con el banco...', 'info')

    try {
      // 1. Mapear enums correctos para la base de datos
      // 'cash_bs' | 'cash_usd' | 'transfer_bs' | 'mock_card'
      let dbMethod: 'cash_bs' | 'cash_usd' | 'transfer_bs' | 'mock_card' = 'transfer_bs'
      if (selectedMethod === 'binance') {
        dbMethod = 'cash_usd' // Binance Pay se liquida en USD
      } else {
        dbMethod = 'transfer_bs' // Pago móvil o transferencia en Bs
      }

      // 2. Disparar RPC confirm_ticket (Transaccional, atómico, seguro de red)
      const { data, error: rpcError } = await supabase.rpc('confirm_ticket', {
        p_trip_id: tripId || '',
        p_seat_number: selectedSeat || '',
        p_passenger_data: {
          passenger_name: passenger?.fullName,
          passenger_id_number: passenger?.idNumber,
        },
        p_payment_data: {
          method: dbMethod,
          amount_usd: priceUSD,
          amount_bs: dbMethod === 'transfer_bs' ? priceVES : null,
          exchange_rate_bcv: BCV_RATE,
          reference_number: reference.trim(),
          bank_name: originBank.trim() || 'Binance',
        },
        p_idempotency_key: idempotencyKey || '',
      })

      if (rpcError) {
        throw rpcError
      }

      // 3. Extraer el ID del ticket emitido
      const resData = data as any
      const ticketId = resData?.ticket?.id || idempotencyKey // en fallback usamos la key (es la misma)

      toast('¡Boleto emitido con éxito!', 'success')
      
      // 4. Limpiar Zustand persistente
      await clearCheckout()
      
      // 5. Redirigir a boleto final
      router.push(`/boleto/${ticketId}`)
    } catch (err: any) {
      console.error('Error al confirmar boleto via RPC:', err)
      toast(err.message || 'Error al procesar el pago. Por favor, reintenta.', 'error')
    } finally {
      setConfirming(false)
    }
  }

  // Formatear temporizador
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-surface min-h-screen pb-24">
      {/* Header global */}
      <Header 
        showBackButton={true} 
        onBackClick={() => router.push('/checkout/pasajero')} 
        title="Flujo de Pago" 
      />

      <main className="pt-14 px-4 max-w-md mx-auto w-full">
        
        {/* BARRA FLOTANTE DE TIEMPO RESTANTE (HOLD TIMER) */}
        {secondsLeft !== null && (
          <div className={`mt-4 rounded-[14px] px-4 py-2.5 flex items-center justify-between text-body-sm font-bold shadow-sm ${
            secondsLeft < 120 ? 'bg-danger/10 text-danger border border-danger/25 animate-pulse' : 'bg-primary/5 text-primary border border-primary/10'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" strokeWidth={2.5} />
              <span>Reserva de asiento asegurada por:</span>
            </div>
            <span className="font-mono text-base font-black tracking-tight">{formatTimer(secondsLeft)}</span>
          </div>
        )}

        {/* STEPPER INDICATOR */}
        <div className="flex items-center justify-between mt-6 px-1 select-none">
          <div className="flex items-center gap-2 opacity-50">
            <span className="h-6 w-6 rounded-full bg-white border border-line text-ink-600 text-caption font-bold flex items-center justify-center">1</span>
            <span className="text-body-sm font-bold text-ink-600">Pasajero</span>
          </div>
          <div className="flex-1 h-[2px] bg-primary mx-4" />
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-primary text-white text-caption font-extrabold flex items-center justify-center shadow-sm">2</span>
            <span className="text-body-sm font-bold text-ink-900">Pago</span>
          </div>
        </div>

        {/* TOTAL TO PAY CONTAINER */}
        <div className="bg-brand-gradient text-white rounded-[24px] p-5.5 mt-6 shadow-[0_6px_20px_rgba(26,60,255,0.15)] flex justify-between items-center select-none">
          <div className="space-y-1">
            <span className="block text-[10px] text-white/70 font-bold uppercase tracking-wider">Total a Cancelar</span>
            <span className="block text-display leading-none font-black font-numeric">
              ${priceUSD.toFixed(2)}
            </span>
          </div>
          <div className="text-right space-y-1">
            <span className="block text-[10px] text-white/70 font-bold uppercase tracking-wider">Monto en Bolívares</span>
            <span className="block text-body font-black font-numeric">
              {priceVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
            </span>
            <span className="block text-[8px] text-white/50 font-bold uppercase">Tasa BCV: {BCV_RATE} Bs/$</span>
          </div>
        </div>

        {/* METHOD SELECTORS */}
        <h4 className="text-body-sm font-bold text-ink-900 uppercase tracking-wider mt-6 mb-3 select-none">
          Selecciona tu Método de Pago
        </h4>
        
        <div className="grid grid-cols-3 gap-2.5 select-none">
          {/* PAGO MOVIL */}
          <button
            type="button"
            onClick={() => {
              setSelectedMethod('pago_movil')
              setReference('')
            }}
            className={`border border-line rounded-[16px] p-3.5 flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              selectedMethod === 'pago_movil'
                ? 'border-primary bg-primary/5 text-primary scale-[1.02] shadow-sm'
                : 'bg-white text-ink-900 active:bg-surface'
            }`}
          >
            <Smartphone className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[10px] font-bold">Pago Móvil</span>
          </button>

          {/* BINANCE PAY */}
          <button
            type="button"
            onClick={() => {
              setSelectedMethod('binance')
              setReference('')
            }}
            className={`border border-line rounded-[16px] p-3.5 flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              selectedMethod === 'binance'
                ? 'border-primary bg-primary/5 text-primary scale-[1.02] shadow-sm'
                : 'bg-white text-ink-900 active:bg-surface'
            }`}
          >
            <Coins className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[10px] font-bold">Binance Pay</span>
          </button>

          {/* TRANSFERENCIA */}
          <button
            type="button"
            onClick={() => {
              setSelectedMethod('transferencia')
              setReference('')
            }}
            className={`border border-line rounded-[16px] p-3.5 flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
              selectedMethod === 'transferencia'
                ? 'border-primary bg-primary/5 text-primary scale-[1.02] shadow-sm'
                : 'bg-white text-ink-900 active:bg-surface'
            }`}
          >
            <Building2 className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[10px] font-bold">Transferencia</span>
          </button>
        </div>

        {/* METHOD DESCRIPTION & FORM */}
        <div className="bg-white border border-line rounded-[24px] p-5 mt-5 shadow-sm">
          <AnimatePresence mode="wait">
            {selectedMethod === 'pago_movil' && (
              <motion.div
                key="pago_movil"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Instrucciones de Pago Móvil */}
                <div className="bg-surface rounded-[16px] p-4 text-body-sm font-semibold space-y-2 select-text">
                  <span className="block text-[10px] text-ink-600 font-bold uppercase tracking-wider">Datos para el pago</span>
                  <div className="grid grid-cols-2 gap-2 text-ink-900">
                    <div>
                      <span className="block text-[10px] text-ink-400 font-normal">Banco:</span>
                      <strong>Banesco (0134)</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-400 font-normal">Teléfono:</span>
                      <strong>0412-555-0101</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-400 font-normal">RIF:</span>
                      <strong>J-00123456-7</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-400 font-normal">Monto exacto:</span>
                      <strong className="text-accent">{priceVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs</strong>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConfirmPayment} className="space-y-4">
                  <Input
                    label="Banco Emisor"
                    placeholder="Ej: Mercantil, BNC, Provincial..."
                    value={originBank}
                    onChange={(e) => setOriginBank(e.target.value)}
                    required
                  />

                  <Input
                    label="Número de Referencia"
                    placeholder="Últimos 8 dígitos de la transacción"
                    maxLength={8}
                    value={reference}
                    onChange={(e) => setReference(e.target.value.replace(/\D/g, ''))}
                    required
                  />

                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    fullWidth
                    className="mt-4 cursor-pointer"
                    isLoading={confirming}
                  >
                    Confirmar Pago Móvil
                  </Button>
                </form>
              </motion.div>
            )}

            {selectedMethod === 'binance' && (
              <motion.div
                key="binance"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Instrucciones de Binance */}
                <div className="bg-surface rounded-[16px] p-4 text-body-sm font-semibold space-y-2 select-text">
                  <span className="block text-[10px] text-ink-600 font-bold uppercase tracking-wider">Datos para Binance Pay</span>
                  <div className="space-y-2 text-ink-900">
                    <div>
                      <span className="block text-[10px] text-ink-400 font-normal">ID de Pago (Binance Pay ID):</span>
                      <strong>987654321</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-400 font-normal">Dirección USDT (BSC / BEP20):</span>
                      <span className="block text-[10px] font-mono break-all text-primary font-bold">0x71C7656EC7ab88b098defB751B7401B5f6d1476B</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-400 font-normal">Monto exacto USDT:</span>
                      <strong className="text-accent">${priceUSD.toFixed(2)} USDT</strong>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConfirmPayment} className="space-y-4">
                  <Input
                    label="Binance Transaction ID"
                    placeholder="ID de transacción de 8 dígitos"
                    maxLength={12}
                    value={reference}
                    onChange={(e) => setReference(e.target.value.replace(/\D/g, ''))}
                    required
                  />

                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    fullWidth
                    className="mt-4 cursor-pointer"
                    isLoading={confirming}
                  >
                    Confirmar Binance Pay
                  </Button>
                </form>
              </motion.div>
            )}

            {selectedMethod === 'transferencia' && (
              <motion.div
                key="transferencia"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Instrucciones de Transferencia */}
                <div className="bg-surface rounded-[16px] p-4 text-body-sm font-semibold space-y-2 select-text">
                  <span className="block text-[10px] text-ink-600 font-bold uppercase tracking-wider">Cuenta para Transferencia</span>
                  <div className="space-y-1.5 text-ink-900">
                    <div>
                      <span className="block text-[10px] text-ink-400 font-normal">Banco:</span>
                      <strong>Mercantil (0105)</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-400 font-normal">Cuenta Corriente:</span>
                      <strong className="font-mono text-xs block text-primary mt-0.5">0105-0011-22-3344556677</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-400 font-normal">Beneficiario:</span>
                      <strong>saliendo.ve C.A.</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-ink-400 font-normal">RIF:</span>
                      <strong>J-00123456-7</strong>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConfirmPayment} className="space-y-4">
                  <Input
                    label="Banco Emisor"
                    placeholder="Ej: Banesco, Provincial, BNC..."
                    value={originBank}
                    onChange={(e) => setOriginBank(e.target.value)}
                    required
                  />

                  <Input
                    label="Número de Referencia"
                    placeholder="Últimos 8 dígitos de la transferencia"
                    maxLength={8}
                    value={reference}
                    onChange={(e) => setReference(e.target.value.replace(/\D/g, ''))}
                    required
                  />

                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    fullWidth
                    className="mt-4 cursor-pointer"
                    isLoading={confirming}
                  >
                    Confirmar Transferencia
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* NOTA DE CONFIABILIDAD */}
        <div className="mt-6 flex items-center justify-center gap-2 select-none text-[10px] font-bold text-ink-600 uppercase tracking-wider">
          <Check className="h-4 w-4 text-success" strokeWidth={3} />
          <span>Garantía de reembolso inmediata</span>
        </div>
      </main>
    </div>
  )
}
