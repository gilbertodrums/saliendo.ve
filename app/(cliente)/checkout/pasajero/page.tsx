'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Key, Mail, Phone, User as UserIcon, CreditCard, ShieldCheck, Clock, Check } from 'lucide-react'
import { Header } from '@/components/ui/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/hooks/use-auth'
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

  // Auth Context
  const { 
    user, 
    profile, 
    loading: authLoading,
    isAnonymous,
    signInWithOtp, 
    verifyOtp, 
    upsertProfile 
  } = useAuth()

  // Form states
  const [fullName, setFullName] = React.useState('')
  const [idType, setIdType] = React.useState('V')
  const [idDigits, setIdDigits] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')

  // OTP flow states
  const [otpSent, setOtpSent] = React.useState(false)
  const [otpToken, setOtpToken] = React.useState('')
  const [verifyingOtp, setVerifyingOtp] = React.useState(false)

  // Guard: esperar a que el componente se monte en cliente antes de validar el store
  const [isMounted, setIsMounted] = React.useState(false)
  React.useEffect(() => { setIsMounted(true) }, [])

  // Timer local para la barra de hold
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null)

  // Redirigir a home si no hay viaje o asiento seleccionados
  // IMPORTANTE: esperar a que el componente se monte para no redirigir antes
  // de que Zustand hidrate el estado desde IndexedDB.
  React.useEffect(() => {
    if (!isMounted) return // todavía no se ha montado en cliente
    if (authLoading) return // esperar a que la sesión anon arrange
    if (!tripId || !selectedSeat) {
      toast('Por favor, selecciona un viaje y asiento primero.', 'warning')
      router.push('/')
    }
  }, [isMounted, authLoading, tripId, selectedSeat, router])

  // Prefill si hay datos previos en Zustand o en el perfil autenticado
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
    } else if (profile) {
      setFullName(profile.full_name || '')
      if (profile.id_number) {
        const parts = profile.id_number.split('-')
        if (parts.length === 2) {
          setIdType(parts[0])
          setIdDigits(parts[1])
        } else {
          setIdDigits(profile.id_number)
        }
      }
      setPhone(profile.phone || '')
      setEmail(profile.email || '')
    } else if (user) {
      setEmail(user.email || '')
    }
  }, [passenger, profile, user])

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

  // Validaciones del formulario
  const validateForm = () => {
    if (fullName.trim().length < 4) {
      toast('Ingresa un nombre y apellido válido.', 'warning')
      return false
    }
    if (!/^\d{6,9}$/.test(idDigits.trim())) {
      toast('La cédula de identidad debe contener entre 6 y 9 dígitos numéricos.', 'warning')
      return false
    }
    if (!/^\+?\d{9,15}$/.test(phone.trim().replace(/\s+/g, ''))) {
      toast('Ingresa un número telefónico válido (ej: 04121234567).', 'warning')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast('Ingresa un correo electrónico válido.', 'warning')
      return false
    }
    return true
  }

  // Flujo OTP 1: Enviar correo
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    toast('Enviando código de verificación...', 'info')
    const res = await signInWithOtp(email.trim())
    if (res.success) {
      setOtpSent(true)
      toast('Código OTP enviado a tu correo. Revisa tu bandeja de entrada o spam.', 'success')
    } else {
      toast(res.error?.message || 'Error al enviar el código OTP. Intenta de nuevo.', 'error')
    }
  }

  // Flujo OTP 2: Verificar token y avanzar
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpToken || otpToken.length < 6) {
      toast('Ingresa el código OTP de 6 dígitos enviado.', 'warning')
      return
    }

    setVerifyingOtp(true)
    toast('Verificando código...', 'info')
    const verifyRes = await verifyOtp(email.trim(), otpToken.trim())

    if (verifyRes.success) {
      // 3. Crear / actualizar perfil en Supabase (pasar email para usuarios anónimos recién vinculados)
      const fullIdNumber = `${idType}-${idDigits.trim()}`
      const upsertRes = await upsertProfile({
        full_name: fullName.trim(),
        id_number: fullIdNumber,
        phone: phone.trim(),
        email: email.trim(),
      })

      if (upsertRes.success) {
        // 4. Guardar datos en Zustand
        await updatePassenger({
          fullName: fullName.trim(),
          idNumber: fullIdNumber,
          phone: phone.trim(),
          email: email.trim(),
        })

        toast('¡Correo verificado y perfil creado con éxito!', 'success')
        router.push('/checkout/pago')
      } else {
        toast('Se verificó el correo pero no pudimos guardar tu perfil en base de datos.', 'error')
      }
    } else {
      toast(verifyRes.error?.message || 'Código OTP inválido o expirado. Revisa y reintenta.', 'error')
    }
    setVerifyingOtp(false)
  }

  // En caso de estar autenticado: flujo directo
  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const fullIdNumber = `${idType}-${idDigits.trim()}`
    
    toast('Guardando información del pasajero...', 'info')
    
    // 1. Sincronizar en Supabase
    const upsertRes = await upsertProfile({
      full_name: fullName.trim(),
      id_number: fullIdNumber,
      phone: phone.trim(),
    })

    if (upsertRes.success) {
      // 2. Guardar en Zustand
      await updatePassenger({
        fullName: fullName.trim(),
        idNumber: fullIdNumber,
        phone: phone.trim(),
        email: email.trim(),
      })

      toast('Datos guardados correctamente', 'success')
      router.push('/checkout/pago')
    } else {
      toast('Error al guardar perfil en Supabase. Intenta nuevamente.', 'error')
    }
  }

  // Formatear temporizador
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-surface min-h-screen pb-20">
      {/* Header con título */}
      <Header 
        showBackButton={true} 
        onBackClick={() => router.push(`/viaje/${tripId}`)} 
        title="Datos del Pasajero" 
      />

      <main className="pt-14 px-4 max-w-md mx-auto w-full select-none">
        
        {/* BARRA FLOTANTE DE TIEMPO RESTANTE (HOLD TIMER) */}
        {secondsLeft !== null && (
          <div className={`mt-4 rounded-[14px] px-4 py-2.5 flex items-center justify-between text-body-sm font-bold shadow-sm ${
            secondsLeft < 120 ? 'bg-danger/10 text-danger border border-danger/25 animate-pulse' : 'bg-primary/5 text-primary border border-primary/10'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" strokeWidth={2.5} />
              <span>Tu asiento {selectedSeat} está reservado por:</span>
            </div>
            <span className="font-mono text-base font-black tracking-tight">{formatTimer(secondsLeft)}</span>
          </div>
        )}

        {/* STEPPER INDICATOR */}
        <div className="flex items-center justify-between mt-6 px-1 select-none">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-primary text-white text-caption font-extrabold flex items-center justify-center shadow-sm">1</span>
            <span className="text-body-sm font-bold text-ink-900">Pasajero</span>
          </div>
          <div className="flex-1 h-[2px] bg-line mx-4" />
          <div className="flex items-center gap-2 opacity-50">
            <span className="h-6 w-6 rounded-full bg-white border border-line text-ink-600 text-caption font-bold flex items-center justify-center">2</span>
            <span className="text-body-sm font-bold text-ink-600">Pago</span>
          </div>
        </div>

        {/* SUMMARY CARD */}
        <div className="bg-white border border-line rounded-[20px] p-4 mt-6 flex justify-between items-center shadow-sm select-none">
          <div className="flex items-center gap-3">
            <div className="bg-surface p-2.5 rounded-[12px] text-primary">
              <CreditCard className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div>
              <span className="block text-[10px] text-ink-600 font-bold uppercase tracking-wider">Viaje Seleccionado</span>
              <span className="block text-body-sm font-bold text-ink-900 leading-tight">
                {trip?.operator_name} · Asiento {selectedSeat}
              </span>
            </div>
          </div>
          <span className="text-body-sm font-black text-accent font-numeric">${trip?.price_usd?.toFixed(2)}</span>
        </div>

        {/* FORM CONTAINER */}
        <div className="bg-white border border-line rounded-[24px] p-5 mt-5 shadow-sm">
          {/* Usuario anónimo o no autenticado: mostrar flujo guest con OTP inline */}
          {(!user || isAnonymous) ? (
            /* ============================================================
               FLUJO: INVITADO / USUARIO ANÓNIMO (OTP INLINE INTEGRADO)
               ============================================================ */
            <div className="space-y-5">
              <div className="bg-primary/5 border border-primary/10 rounded-[14px] p-3.5 flex gap-3 text-primary">
                <ShieldCheck className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                <div className="space-y-0.5">
                  <h5 className="text-caption font-bold">Compra Segura sin Contraseña</h5>
                  <p className="text-[10px] text-ink-600 leading-normal">
                    Ingresa tus datos y verificaremos tu correo al instante para emitir tu boleto. ¡No requieres contraseña!
                  </p>
                </div>
              </div>

              {!otpSent ? (
                /* SUB-PASO A: ENTRADA DE DATOS + DISPARO DE OTP */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <Input
                    label="Nombre y Apellido"
                    placeholder="Escribe tu nombre completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    leftIcon={<UserIcon className="h-5 w-5 text-ink-400" />}
                    required
                  />

                  {/* CEDULA CONTAINER */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-body-sm text-ink-600 leading-none font-semibold">
                      Cédula de Identidad
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={idType}
                        onChange={(e) => setIdType(e.target.value)}
                        className="border-line text-body font-bold text-ink-900 focus:border-primary h-[52px] w-20 rounded-[14px] border bg-surface px-2 focus:outline-none focus:ring-2 focus:ring-primary/20 text-center select-none"
                      >
                        <option value="V">V-</option>
                        <option value="E">E-</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Ej: 12345678"
                        value={idDigits}
                        onChange={(e) => setIdDigits(e.target.value)}
                        className="border-line text-body text-ink-900 placeholder:text-ink-400 focus:ring-primary/20 focus:border-primary h-[52px] flex-1 rounded-[14px] border bg-white px-4 focus:ring-2 focus:outline-none font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <Input
                    label="Teléfono Móvil"
                    placeholder="Ej: 04121234567"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    leftIcon={<Phone className="h-5 w-5 text-ink-400" />}
                    required
                  />

                  <Input
                    label="Correo Electrónico"
                    placeholder="correo@ejemplo.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail className="h-5 w-5 text-ink-400" />}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="mt-4 cursor-pointer"
                    isLoading={authLoading}
                  >
                    Verificar Correo Electrónico
                  </Button>
                </form>
              ) : (
                /* SUB-PASO B: ENTRADA DE CODIGO OTP */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center py-2">
                    <span className="block text-body-sm font-bold text-ink-900">Ingresa el código OTP</span>
                    <span className="text-[11px] text-ink-600 mt-1 block">
                      Enviamos un código de verificación de 6 dígitos a <br />
                      <strong className="text-primary font-bold">{email}</strong>
                    </span>
                  </div>

                  <Input
                    label="Código de Verificación (OTP)"
                    placeholder="123456"
                    type="text"
                    maxLength={6}
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                    leftIcon={<Key className="h-5 w-5 text-ink-400" />}
                    required
                  />

                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    fullWidth
                    className="mt-4 cursor-pointer"
                    isLoading={verifyingOtp}
                  >
                    Confirmar Código OTP
                  </Button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-center text-caption text-primary hover:underline font-bold mt-2 cursor-pointer"
                  >
                    ← Modificar mis datos o correo
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* ============================================================
               FLUJO: USUARIO YA AUTENTICADO (DIRECT SUBMIT + SYNC PROFILE)
               ============================================================ */
            <form onSubmit={handleDirectSubmit} className="space-y-4">
              <div className="bg-success/5 border border-success/15 rounded-[14px] p-3 flex gap-2.5 text-success select-none">
                <Check className="h-5 w-5 flex-shrink-0" strokeWidth={2.5} />
                <span className="text-caption font-bold">Sesión iniciada como: {user.email}</span>
              </div>

              <Input
                label="Nombre y Apellido"
                placeholder="Escribe tu nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<UserIcon className="h-5 w-5 text-ink-400" />}
                required
              />

              {/* CEDULA CONTAINER */}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-body-sm text-ink-600 leading-none font-semibold">
                  Cédula de Identidad
                </label>
                <div className="flex gap-2">
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="border-line text-body font-bold text-ink-900 focus:border-primary h-[52px] w-20 rounded-[14px] border bg-surface px-2 focus:outline-none focus:ring-2 focus:ring-primary/20 text-center select-none"
                  >
                    <option value="V">V-</option>
                    <option value="E">E-</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Ej: 12345678"
                    value={idDigits}
                    onChange={(e) => setIdDigits(e.target.value)}
                    className="border-line text-body text-ink-900 placeholder:text-ink-400 focus:ring-primary/20 focus:border-primary h-[52px] flex-1 rounded-[14px] border bg-white px-4 focus:ring-2 focus:outline-none font-semibold"
                    required
                  />
                </div>
              </div>

              <Input
                label="Teléfono Móvil"
                placeholder="Ej: 04121234567"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="h-5 w-5 text-ink-400" />}
                required
              />

              <Input
                label="Correo Electrónico"
                placeholder="correo@ejemplo.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-5 w-5 text-ink-400" />}
                required
                disabled // correo no modificable porque es la sesión activa
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                className="mt-4 cursor-pointer"
                isLoading={authLoading}
              >
                Continuar al Pago
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
