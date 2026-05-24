'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, User as UserIcon, CreditCard, Clock, Mail, IdCard } from 'lucide-react'
import { Header } from '@/components/ui/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCheckout } from '@/lib/store/use-checkout'
import { useToast } from '@/components/ui/toast'

export default function CheckoutPasajeroPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Zustand store
  const trip = useCheckout((state) => state.trip)
  const tripId = useCheckout((state) => state.tripId)
  const selectedSeat = useCheckout((state) => state.selectedSeat)
  const holdUntil = useCheckout((state) => state.holdUntil)
  const passenger = useCheckout((state) => state.passenger)
  const updatePassenger = useCheckout((state) => state.updatePassenger)

  // Form states
  const [fullName, setFullName] = React.useState('')
  const [idType, setIdType] = React.useState('V')
  const [idDigits, setIdDigits] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')

  // Guard: esperar a que el componente se monte
  const [isMounted, setIsMounted] = React.useState(false)
  React.useEffect(() => { setIsMounted(true) }, [])

  // Timer local para la barra de hold
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null)

  // Redirigir si no hay viaje o asiento — solo después de montar
  React.useEffect(() => {
    if (!isMounted) return
    if (!tripId || !selectedSeat) {
      toast('Por favor, selecciona un viaje y asiento primero.', 'warning')
      router.push('/')
    }
  }, [isMounted, tripId, selectedSeat, router])

  // Pre-rellenar con datos previos si existen
  React.useEffect(() => {
    if (passenger) {
      setFullName(passenger.fullName)
      const parts = passenger.idNumber.split('-')
      if (parts.length === 2) {
        setIdType(parts[0])
        setIdDigits(parts[1])
      } else {
        setIdDigits(passenger.idNumber)
      }
      setPhone(passenger.phone)
      setEmail(passenger.email)
    }
  }, [passenger])

  // Countdown timer
  React.useEffect(() => {
    if (!holdUntil) return
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(holdUntil).getTime() - Date.now()) / 1000))
      setSecondsLeft(diff)
      if (diff === 0) {
        clearInterval(interval)
        toast('El tiempo de reserva expiró. Selecciona otro asiento.', 'error')
        router.push(`/viaje/${tripId}`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [holdUntil, tripId, router])

  // Validaciones
  const validateForm = () => {
    if (fullName.trim().length < 4) {
      toast('Ingresa tu nombre y apellido completo.', 'warning')
      return false
    }
    if (!/^\d{6,9}$/.test(idDigits.trim())) {
      toast('La cédula debe tener entre 6 y 9 dígitos.', 'warning')
      return false
    }
    if (!/^\+?\d{9,15}$/.test(phone.trim().replace(/\s+/g, ''))) {
      toast('Ingresa un teléfono válido (ej: 04121234567).', 'warning')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast('Ingresa un correo electrónico válido.', 'warning')
      return false
    }
    return true
  }

  // Submit directo — sin OTP, sin registro obligatorio
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const fullIdNumber = `${idType}-${idDigits.trim()}`

    await updatePassenger({
      fullName: fullName.trim(),
      idNumber: fullIdNumber,
      phone: phone.trim(),
      email: email.trim(),
    })

    router.push('/checkout/pago')
  }

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-surface min-h-screen pb-20">
      <Header
        showBackButton={true}
        onBackClick={() => router.push(`/viaje/${tripId}`)}
        title="Datos del Pasajero"
      />

      <main className="pt-14 px-4 max-w-md mx-auto w-full select-none">

        {/* TIMER DE HOLD */}
        {secondsLeft !== null && (
          <div className={`mt-4 rounded-[14px] px-4 py-2.5 flex items-center justify-between text-body-sm font-bold shadow-sm ${
            secondsLeft < 120
              ? 'bg-danger/10 text-danger border border-danger/25 animate-pulse'
              : 'bg-primary/5 text-primary border border-primary/10'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" strokeWidth={2.5} />
              <span>Asiento {selectedSeat} reservado por:</span>
            </div>
            <span className="font-mono text-base font-black tracking-tight">{formatTimer(secondsLeft)}</span>
          </div>
        )}

        {/* STEPPER */}
        <div className="flex items-center justify-between mt-6 px-1">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-primary text-white text-caption font-extrabold flex items-center justify-center shadow-sm">1</span>
            <span className="text-body-sm font-bold text-ink-900">Pasajero</span>
          </div>
          <div className="flex-1 h-[2px] bg-line mx-4" />
          <div className="flex items-center gap-2 opacity-40">
            <span className="h-6 w-6 rounded-full bg-white border border-line text-ink-600 text-caption font-bold flex items-center justify-center">2</span>
            <span className="text-body-sm font-bold text-ink-600">Pago</span>
          </div>
        </div>

        {/* RESUMEN DEL VIAJE */}
        <div className="bg-white border border-line rounded-[20px] p-4 mt-6 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-surface p-2.5 rounded-[12px] text-primary">
              <CreditCard className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <span className="block text-[10px] text-ink-600 font-bold uppercase tracking-wider">Viaje Seleccionado</span>
              <span className="block text-body-sm font-bold text-ink-900 leading-tight">
                {trip?.operator_name} · Asiento {selectedSeat}
              </span>
              <span className="block text-[10px] text-ink-500 mt-0.5">
                {trip?.origin_city} → {trip?.destination_city}
              </span>
            </div>
          </div>
          <span className="text-body-sm font-black text-accent font-numeric">${trip?.price_usd?.toFixed(2)}</span>
        </div>

        {/* FORMULARIO DIRECTO — SIN OTP */}
        <div className="bg-white border border-line rounded-[24px] p-5 mt-5 shadow-sm">
          <h2 className="text-body font-extrabold text-ink-900 mb-1">¿Quién viaja?</h2>
          <p className="text-caption text-ink-500 mb-5">Completa tus datos para el boleto. No necesitas cuenta.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre y Apellido"
              placeholder="Ej: Juan Pérez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<UserIcon className="h-5 w-5 text-ink-400" />}
              required
            />

            {/* CÉDULA */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-body-sm text-ink-600 leading-none font-semibold flex items-center gap-1.5">
                <IdCard className="h-4 w-4" />
                Cédula de Identidad
              </label>
              <div className="flex gap-2">
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="border-line text-body font-bold text-ink-900 focus:border-primary h-[52px] w-20 rounded-[14px] border bg-surface px-2 focus:outline-none focus:ring-2 focus:ring-primary/20 text-center"
                >
                  <option value="V">V-</option>
                  <option value="E">E-</option>
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="12345678"
                  value={idDigits}
                  onChange={(e) => setIdDigits(e.target.value.replace(/\D/g, ''))}
                  className="border-line text-body text-ink-900 placeholder:text-ink-400 focus:ring-primary/20 focus:border-primary h-[52px] flex-1 rounded-[14px] border bg-white px-4 focus:ring-2 focus:outline-none font-semibold"
                  required
                />
              </div>
            </div>

            <Input
              label="Teléfono Móvil"
              placeholder="04121234567"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="h-5 w-5 text-ink-400" />}
              required
            />

            <Input
              label="Correo Electrónico"
              placeholder="correo@ejemplo.com"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-5 w-5 text-ink-400" />}
              required
            />

            <p className="text-[11px] text-ink-400 text-center leading-normal px-2">
              Tu correo solo se usa para enviarte el boleto. No creamos cuenta automáticamente.
            </p>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              className="mt-2 cursor-pointer"
            >
              Continuar al Pago →
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
