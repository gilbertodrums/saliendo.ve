'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Users, Search, Compass, ShieldCheck, Heart } from 'lucide-react'
import { Header } from '@/components/ui/header'
import { Button } from '@/components/ui/button'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useSearchCities } from '@/lib/hooks/use-trips'
import { useToast } from '@/components/ui/toast'

export default function ClienteHome() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Datos del backend (Agente 1)
  const { data: citiesData, isLoading: isLoadingCities } = useSearchCities()

  // Estados de búsqueda locales
  const [origin, setOrigin] = React.useState('')
  const [destination, setDestination] = React.useState('')
  const [date, setDate] = React.useState(() => {
    // Inicializar con la fecha de mañana en formato YYYY-MM-DD
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [passengers, setPassengers] = React.useState(1)

  // Estados de control para los Bottom Sheets
  const [isOriginSheetOpen, setIsOriginSheetOpen] = React.useState(false)
  const [isDestinationSheetOpen, setIsDestinationSheetOpen] = React.useState(false)
  const [isPassengersSheetOpen, setIsPassengersSheetOpen] = React.useState(false)

  // Lista de ciudades
  const origins = citiesData?.origins || []
  const destinations = citiesData?.destinations || []

  // Validar y ejecutar la búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!origin) {
      toast('Por favor, selecciona una ciudad de origen.', 'warning')
      setIsOriginSheetOpen(true)
      return
    }
    
    if (!destination) {
      toast('Por favor, selecciona una ciudad de destino.', 'warning')
      setIsDestinationSheetOpen(true)
      return
    }
    
    if (origin === destination) {
      toast('El origen y el destino no pueden ser el mismo.', 'warning')
      return
    }

    if (!date) {
      toast('Por favor, selecciona una fecha de salida.', 'warning')
      return
    }

    // Redirigir al flujo de búsqueda con query params
    router.push(
      `/buscar?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(
        destination
      )}&date=${encodeURIComponent(date)}&passengers=${passengers}`
    )
  }

  // Intercambiar origen y destino
  const handleSwapCities = () => {
    const temp = origin
    setOrigin(destination)
    setDestination(temp)
  }

  // Obtener fecha de hoy en formato YYYY-MM-DD para deshabilitar fechas pasadas
  const todayStr = React.useMemo(() => {
    return new Date().toISOString().split('T')[0]
  }, [])

  return (
    <div className="bg-surface min-h-screen pb-24">
      {/* Header global */}
      <Header />

      <main className="pt-14">
        {/* HERO BRAND BANNER */}
        <section className="bg-brand-gradient text-white pt-8 pb-32 px-6 flex flex-col justify-center relative overflow-hidden select-none">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-md mx-auto w-full text-center mt-4"
          >
            <h1 className="text-display tracking-tight text-white mb-2 leading-[1.1] font-extrabold">
              Viaja seguro por <br />toda Venezuela
            </h1>
            <p className="text-body text-white/80 max-w-[280px] mx-auto font-medium">
              Reserva tus pasajes en segundos y viaja con total tranquilidad.
            </p>
          </motion.div>
        </section>

        {/* FLOATING SEARCH CARD CONTAINER */}
        <section className="px-4 -mt-24 relative z-10 max-w-md mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-[24px] border border-line p-5 shadow-[0_8px_32px_rgba(10,19,48,0.06)]"
          >
            <form onSubmit={handleSearch} className="space-y-4">
              {/* ORIGIN FIELD */}
              <div 
                onClick={() => setIsOriginSheetOpen(true)}
                className="bg-surface border border-line rounded-[16px] p-4 flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-all select-none active:scale-[0.99]"
              >
                <div className="bg-primary/10 text-primary p-2.5 rounded-[12px]">
                  <MapPin className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-caption text-ink-600 font-semibold uppercase tracking-wider">
                    Origen
                  </span>
                  <span className={`block text-body font-semibold truncate ${origin ? 'text-ink-900' : 'text-ink-400'}`}>
                    {origin || '¿Desde dónde sales?'}
                  </span>
                </div>
              </div>

              {/* SWAP BUTTON */}
              <div className="flex justify-end -my-2.5 px-6 relative z-20">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSwapCities()
                  }}
                  className="bg-white border border-line text-primary flex h-9 w-9 items-center justify-center rounded-full shadow-md active:scale-90 transition-transform cursor-pointer"
                  aria-label="Intercambiar origen y destino"
                >
                  <svg className="h-5 w-5 rotate-90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 4L20 7M20 7L17 10M20 7H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 20L4 17M4 17L7 14M4 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* DESTINATION FIELD */}
              <div 
                onClick={() => setIsDestinationSheetOpen(true)}
                className="bg-surface border border-line rounded-[16px] p-4 flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-all select-none active:scale-[0.99]"
              >
                <div className="bg-accent/10 text-accent p-2.5 rounded-[12px]">
                  <MapPin className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-caption text-ink-600 font-semibold uppercase tracking-wider">
                    Destino
                  </span>
                  <span className={`block text-body font-semibold truncate ${destination ? 'text-ink-900' : 'text-ink-400'}`}>
                    {destination || '¿A dónde quieres ir?'}
                  </span>
                </div>
              </div>

              {/* GRID FOR DATE AND PASSENGERS */}
              <div className="grid grid-cols-2 gap-4">
                {/* DATE SELECTOR */}
                <div className="bg-surface border border-line rounded-[16px] p-4 flex flex-col justify-center relative hover:border-primary/30 transition-all select-none">
                  <span className="block text-caption text-ink-600 font-semibold uppercase tracking-wider mb-1">
                    Salida
                  </span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-ink-600 flex-shrink-0" strokeWidth={1.5} />
                    <input
                      type="date"
                      value={date}
                      min={todayStr}
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-transparent text-body text-ink-900 font-semibold outline-none w-full border-none p-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* PASSENGERS SELECTOR */}
                <div 
                  onClick={() => setIsPassengersSheetOpen(true)}
                  className="bg-surface border border-line rounded-[16px] p-4 flex flex-col justify-center cursor-pointer hover:border-primary/30 transition-all select-none active:scale-[0.99]"
                >
                  <span className="block text-caption text-ink-600 font-semibold uppercase tracking-wider mb-1">
                    Pasajeros
                  </span>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-ink-600 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-body text-ink-900 font-semibold">
                      {passengers} {passengers === 1 ? 'Pasajero' : 'Pasajeros'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<Search className="h-5 w-5" />}
                className="mt-2"
              >
                Buscar Viajes
              </Button>
            </form>
          </motion.div>
        </section>

        {/* TRUST BANNER */}
        <section className="mt-12 px-6 max-w-md mx-auto w-full select-none">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <div className="bg-primary/5 text-primary h-12 w-12 rounded-full flex items-center justify-center mb-2">
                <Compass className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <span className="text-caption font-bold text-ink-900">Rutas Nacionales</span>
              <span className="text-[10px] text-ink-600 leading-tight">Caracas, Maracaibo, Oriente y más.</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-success/5 text-success h-12 w-12 rounded-full flex items-center justify-center mb-2">
                <ShieldCheck className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <span className="text-caption font-bold text-ink-900">Pago Seguro</span>
              <span className="text-[10px] text-ink-600 leading-tight">Pago móvil, divisas y Binance.</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-accent/5 text-accent h-12 w-12 rounded-full flex items-center justify-center mb-2">
                <Heart className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <span className="text-caption font-bold text-ink-900">Soporte 24/7</span>
              <span className="text-[10px] text-ink-600 leading-tight">Acompañamiento en todo tu viaje.</span>
            </div>
          </div>
        </section>

        {/* POPULAR DESTINATIONS */}
        <section className="mt-12 px-6 max-w-md mx-auto w-full pb-8 select-none">
          <h3 className="text-h2 font-display text-ink-900 font-bold mb-4">Destinos Populares</h3>
          <div className="space-y-3">
            {[
              { from: 'Caracas', to: 'Maracaibo', price: '$45', duration: '10 horas' },
              { from: 'Caracas', to: 'Valencia', price: '$15', duration: '2.5 horas' },
              { from: 'Caracas', to: 'Barquisimeto', price: '$25', duration: '5.5 horas' },
            ].map((routeItem, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setOrigin(routeItem.from)
                  setDestination(routeItem.to)
                  toast(`Origen y destino establecidos: ${routeItem.from} a ${routeItem.to}`, 'info')
                  // Scroll to top smoothly so the user can search
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="bg-white border border-line rounded-[16px] p-4 flex items-center justify-between hover:border-primary/20 transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="flex flex-col">
                  <span className="text-body-sm font-bold text-ink-900 flex items-center gap-1.5">
                    {routeItem.from} 
                    <span className="text-ink-400 font-normal">→</span> 
                    {routeItem.to}
                  </span>
                  <span className="text-caption text-ink-600 mt-0.5">{routeItem.duration}</span>
                </div>
                <div className="text-right">
                  <span className="text-body-sm font-bold text-primary block">Desde {routeItem.price}</span>
                  <span className="text-[10px] text-ink-400">Sólo ida</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* BOTTOM SHEET SELECTOR: ORIGIN */}
      <BottomSheet
        isOpen={isOriginSheetOpen}
        onClose={() => setIsOriginSheetOpen(false)}
        title="Selecciona Ciudad de Origen"
      >
        <div className="space-y-1">
          {isLoadingCities ? (
            <div className="py-8 text-center text-ink-600 text-body-sm animate-pulse">Cargando orígenes...</div>
          ) : origins.length === 0 ? (
            <div className="py-8 text-center text-ink-400 text-body-sm">No hay viajes activos programados.</div>
          ) : (
            origins.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  setOrigin(city)
                  setIsOriginSheetOpen(false)
                  // Auto open destination for fluent UX
                  setTimeout(() => setIsDestinationSheetOpen(true), 250)
                }}
                className="w-full text-left py-3.5 px-4 border-b border-line/40 text-body font-semibold text-ink-900 hover:bg-surface rounded-[10px] flex items-center gap-3 transition-colors active:bg-surface cursor-pointer"
              >
                <MapPin className="h-5 w-5 text-primary flex-shrink-0" strokeWidth={1.5} />
                <span>{city}</span>
              </button>
            ))
          )}
        </div>
      </BottomSheet>

      {/* BOTTOM SHEET SELECTOR: DESTINATION */}
      <BottomSheet
        isOpen={isDestinationSheetOpen}
        onClose={() => setIsDestinationSheetOpen(false)}
        title="Selecciona Ciudad de Destino"
      >
        <div className="space-y-1">
          {isLoadingCities ? (
            <div className="py-8 text-center text-ink-600 text-body-sm animate-pulse">Cargando destinos...</div>
          ) : destinations.length === 0 ? (
            <div className="py-8 text-center text-ink-400 text-body-sm">No hay viajes activos programados.</div>
          ) : (
            destinations
              .filter(city => city !== origin) // Excluir origen seleccionado
              .map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setDestination(city)
                    setIsDestinationSheetOpen(false)
                  }}
                  className="w-full text-left py-3.5 px-4 border-b border-line/40 text-body font-semibold text-ink-900 hover:bg-surface rounded-[10px] flex items-center gap-3 transition-colors active:bg-surface cursor-pointer"
                >
                  <MapPin className="h-5 w-5 text-accent flex-shrink-0" strokeWidth={1.5} />
                  <span>{city}</span>
                </button>
              ))
          )}
        </div>
      </BottomSheet>

      {/* BOTTOM SHEET SELECTOR: PASSENGERS */}
      <BottomSheet
        isOpen={isPassengersSheetOpen}
        onClose={() => setIsPassengersSheetOpen(false)}
        title="Cantidad de Pasajeros"
      >
        <div className="py-4">
          <p className="text-body-sm text-ink-600 mb-6 text-center">
            Puedes comprar un máximo de 6 pasajes por transacción en línea.
          </p>
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              disabled={passengers <= 1}
              onClick={() => setPassengers(prev => prev - 1)}
              className="h-12 w-12 rounded-full border-[1.5px] border-line flex items-center justify-center text-xl font-bold text-ink-900 active:bg-surface disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              -
            </button>
            <span className="text-display font-display text-ink-900 font-extrabold min-w-[40px] text-center">
              {passengers}
            </span>
            <button
              type="button"
              disabled={passengers >= 6}
              onClick={() => setPassengers(prev => prev + 1)}
              className="h-12 w-12 rounded-full border-[1.5px] border-line flex items-center justify-center text-xl font-bold text-ink-900 active:bg-surface disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              +
            </button>
          </div>
          
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setIsPassengersSheetOpen(false)}
            className="mt-8"
          >
            Confirmar {passengers} {passengers === 1 ? 'Pasajero' : 'Pasajeros'}
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
