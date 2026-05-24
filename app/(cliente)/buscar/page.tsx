'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Wifi, 
  Snowflake, 
  Usb, 
  Droplets, 
  Coffee, 
  SlidersHorizontal, 
  ArrowLeft, 
  Clock, 
  Bus, 
  DollarSign, 
  Check, 
  AlertCircle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { useTrips, useTripOperators } from '@/lib/hooks/use-trips'
import { useCheckout } from '@/lib/store/use-checkout'
import { useToast } from '@/components/ui/toast'
import type { TripWithOperator } from '@/types/database'

export default function BuscarViajes() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  // Recuperar Zustand store
  const initCheckout = useCheckout((state) => state.initCheckout)

  // 1. Obtener parámetros iniciales de la URL
  const origin = searchParams.get('origin') || ''
  const destination = searchParams.get('destination') || ''
  const date = searchParams.get('date') || ''
  const passengers = parseInt(searchParams.get('passengers') || '1', 10)

  // 2. Filtros locales reactivos (para la bottom sheet)
  const [minPrice, setMinPrice] = React.useState<number | undefined>(undefined)
  const [maxPrice, setMaxPrice] = React.useState<number | undefined>(undefined)
  const [operatorId, setOperatorId] = React.useState<string | undefined>(undefined)
  const [departureTimeOfDay, setDepartureTimeOfDay] = React.useState<'morning' | 'afternoon' | 'night' | undefined>(undefined)
  
  // Servicios
  const [wifi, setWifi] = React.useState(false)
  const [ac, setAc] = React.useState(false)
  const [usb, setUsb] = React.useState(false)
  const [toilet, setToilet] = React.useState(false)
  const [snacks, setSnacks] = React.useState(false)

  // Estado temporal de filtros en la Bottom Sheet (para aplicar solo al pulsar "Aplicar")
  const [tempMinPrice, setTempMinPrice] = React.useState<string>('')
  const [tempMaxPrice, setTempMaxPrice] = React.useState<string>('')
  const [tempOperatorId, setTempOperatorId] = React.useState<string>('')
  const [tempTimeOfDay, setTempTimeOfDay] = React.useState<'morning' | 'afternoon' | 'night' | 'all'>('all')
  const [tempWifi, setTempWifi] = React.useState(false)
  const [tempAc, setTempAc] = React.useState(false)
  const [tempUsb, setTempUsb] = React.useState(false)
  const [tempToilet, setTempToilet] = React.useState(false)
  const [tempSnacks, setTempSnacks] = React.useState(false)

  // Estado del modal de filtros
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false)

  // 3. Cargar operadores para los filtros
  const { data: operators = [] } = useTripOperators()

  // 4. Hook reactivo de viajes filtrados
  const tripsFilters = React.useMemo(() => ({
    originCity: origin,
    destinationCity: destination,
    date,
    minPrice,
    maxPrice,
    operatorId,
    departureTimeOfDay,
    wifi,
    ac,
    usb,
    toilet,
    snacks,
  }), [origin, destination, date, minPrice, maxPrice, operatorId, departureTimeOfDay, wifi, ac, usb, toilet, snacks])

  const { trips, isLoading, error } = useTrips(tripsFilters)

  // Sincronizar estados temporales al abrir la Bottom Sheet
  const handleOpenFilters = () => {
    setTempMinPrice(minPrice?.toString() || '')
    setTempMaxPrice(maxPrice?.toString() || '')
    setTempOperatorId(operatorId || '')
    setTempTimeOfDay(departureTimeOfDay || 'all')
    setTempWifi(wifi)
    setTempAc(ac)
    setTempUsb(usb)
    setTempToilet(toilet)
    setTempSnacks(snacks)
    setIsFiltersOpen(true)
  }

  // Aplicar filtros acumulados
  const handleApplyFilters = () => {
    setMinPrice(tempMinPrice ? parseFloat(tempMinPrice) : undefined)
    setMaxPrice(tempMaxPrice ? parseFloat(tempMaxPrice) : undefined)
    setOperatorId(tempOperatorId || undefined)
    setDepartureTimeOfDay(tempTimeOfDay === 'all' ? undefined : tempTimeOfDay)
    setWifi(tempWifi)
    setAc(tempAc)
    setUsb(tempUsb)
    setToilet(tempToilet)
    setSnacks(tempSnacks)
    setIsFiltersOpen(false)
    toast('Filtros aplicados correctamente', 'success')
  }

  // Limpiar todos los filtros
  const handleResetFilters = () => {
    setTempMinPrice('')
    setTempMaxPrice('')
    setTempOperatorId('')
    setTempTimeOfDay('all')
    setTempWifi(false)
    setTempAc(false)
    setTempUsb(false)
    setTempToilet(false)
    setTempSnacks(false)

    setMinPrice(undefined)
    setMaxPrice(undefined)
    setOperatorId(undefined)
    setDepartureTimeOfDay(undefined)
    setWifi(false)
    setAc(false)
    setUsb(false)
    setToilet(false)
    setSnacks(false)

    setIsFiltersOpen(false)
    toast('Filtros restablecidos', 'info')
  }

  // Formatear precio
  const formatCurrency = (val: number | null, currency: 'USD' | 'VES') => {
    if (val === null) return ''
    if (currency === 'VES') {
      return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(val)
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
  }

  // Formatear hora (ej: 06:00 AM)
  const formatTime = (isoString: string | null) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  // Formatear duración (minutos a horas/minutos)
  const formatDuration = (mins: number | null) => {
    if (!mins) return 'Duración n/a'
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }

  // Formatear fecha legible
  const formatDateFriendly = (dateStr: string) => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    return dateObj.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  // Cantidad de filtros activos
  const activeFiltersCount = React.useMemo(() => {
    let count = 0
    if (minPrice !== undefined) count++
    if (maxPrice !== undefined) count++
    if (operatorId !== undefined) count++
    if (departureTimeOfDay !== undefined) count++
    if (wifi) count++
    if (ac) count++
    if (usb) count++
    if (toilet) count++
    if (snacks) count++
    return count
  }, [minPrice, maxPrice, operatorId, departureTimeOfDay, wifi, ac, usb, toilet, snacks])

  // Iniciar checkout y avanzar al selector de asientos
  const handleSelectTrip = async (trip: TripWithOperator) => {
    if (!trip.trip_id) return
    try {
      await initCheckout(trip.trip_id, trip)
      router.push(`/viaje/${trip.trip_id}`)
    } catch (err) {
      console.error(err)
      toast('Error al inicializar la compra', 'error')
    }
  }

  return (
    <div className="bg-surface min-h-screen pb-12">
      {/* HEADER ADAPTADO - MOBILE FIRST */}
      <header className="border-line/60 pt-safe fixed top-0 right-0 left-0 z-40 border-b bg-white/80 backdrop-blur-md select-none">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            onClick={() => router.push('/')}
            className="text-ink-900 active:bg-surface flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95 cursor-pointer"
            aria-label="Volver al inicio"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </button>
          
          <div className="absolute left-1/2 max-w-[60%] -translate-x-1/2 truncate text-center">
            <span className="block text-body font-bold text-ink-900 leading-none">
              {origin} a {destination}
            </span>
            <span className="text-[10px] text-ink-600 font-semibold block mt-0.5">
              {formatDateFriendly(date)} · {passengers} {passengers === 1 ? 'pasajero' : 'pasajeros'}
            </span>
          </div>

          <button
            onClick={handleOpenFilters}
            className={`relative text-ink-600 active:bg-surface flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-95 cursor-pointer ${activeFiltersCount > 0 ? 'text-primary' : ''}`}
            aria-label="Filtros"
          >
            <SlidersHorizontal className="h-5 w-5" strokeWidth={1.5} />
            {activeFiltersCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-accent text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* RESULT LIST */}
      <main className="pt-18 px-4 max-w-md mx-auto w-full">
        {/* LIST STATE: LOADING SKELETONS */}
        {isLoading && (
          <div className="space-y-4 mt-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 space-y-4 border border-line bg-white rounded-[20px]">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <Skeleton variant="circle" className="h-9 w-9" />
                    <div>
                      <Skeleton variant="text" className="w-24 h-4" />
                      <Skeleton variant="text" className="w-16 h-3 mt-1.5" />
                    </div>
                  </div>
                  <Skeleton variant="text" className="w-14 h-5" />
                </div>
                <hr className="border-line/60" />
                <div className="flex justify-between items-center">
                  <div className="space-y-1.5">
                    <Skeleton variant="text" className="w-32 h-4" />
                    <Skeleton variant="text" className="w-20 h-3" />
                  </div>
                  <Skeleton variant="rect" className="w-24 h-10 rounded-[14px]" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* LIST STATE: ERROR */}
        {error && !isLoading && (
          <div className="bg-danger/5 border border-danger/20 rounded-[16px] p-6 text-center mt-6">
            <AlertCircle className="h-10 w-10 text-danger mx-auto mb-3 animate-bounce" />
            <h4 className="text-body font-bold text-danger">Error de Conexión</h4>
            <p className="text-caption text-ink-600 mt-1">
              No pudimos cargar los viajes. Revisa tu señal y vuelve a intentarlo.
            </p>
          </div>
        )}

        {/* LIST STATE: EMPTY STATE */}
        {!isLoading && !error && trips.length === 0 && (
          <div className="bg-white border border-line rounded-[24px] p-8 text-center mt-6 shadow-[0_4px_16px_rgba(10,19,48,0.02)] select-none">
            <Bus className="h-12 w-12 text-ink-400 mx-auto mb-4" strokeWidth={1.2} />
            <h4 className="text-body font-bold text-ink-900">No encontramos viajes</h4>
            <p className="text-caption text-ink-600 mt-2 max-w-[280px] mx-auto">
              No hay salidas disponibles para la fecha seleccionada o los filtros aplicados. Intenta ampliar tus criterios.
            </p>
            {activeFiltersCount > 0 && (
              <Button
                variant="secondary"
                size="md"
                onClick={handleResetFilters}
                className="mt-6"
              >
                Limpiar Filtros
              </Button>
            )}
          </div>
        )}

        {/* LIST STATE: RESULTS RENDERING */}
        {!isLoading && !error && trips.length > 0 && (
          <div className="space-y-4 mt-2">
            <span className="block text-caption text-ink-600 font-semibold mb-2">
              Se encontraron {trips.length} {trips.length === 1 ? 'salida disponible' : 'salidas disponibles'}
            </span>

            {trips.map((trip) => {
              const amenities = (trip.amenities_json || {}) as any
              return (
                <motion.div
                  key={trip.trip_id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Card className="border border-line bg-white p-4.5 rounded-[20px] shadow-[0_2px_8px_rgba(10,19,48,0.02)] select-none">
                    {/* TOP OPERATOR ROW */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-surface border border-line h-9 w-9 rounded-full flex items-center justify-center text-primary font-extrabold text-sm select-none">
                          {trip.operator_logo_url ? (
                            <img 
                              src={trip.operator_logo_url} 
                              alt={trip.operator_name || ''} 
                              className="h-full w-full rounded-full object-contain"
                            />
                          ) : (
                            trip.operator_name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <span className="block text-body-sm font-bold text-ink-900 leading-tight">
                            {trip.operator_name}
                          </span>
                          <span className="text-[10px] text-ink-600 font-semibold block leading-none">
                            Autobús {trip.bus_id?.split('-')[0].toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-body font-extrabold text-ink-900 tracking-tight font-numeric block leading-none">
                          {formatCurrency(trip.price_usd, 'USD')}
                        </span>
                        {trip.price_bolivares && (
                          <span className="text-[10px] text-primary font-bold font-numeric block mt-0.5">
                            {formatCurrency(trip.price_bolivares, 'VES')}
                          </span>
                        )}
                      </div>
                    </div>

                    <hr className="border-line/65 my-3" />

                    {/* ROUTE / TIMING GRID */}
                    <div className="grid grid-cols-3 gap-1 text-center py-1">
                      <div className="text-left">
                        <span className="block text-h3 font-extrabold text-ink-900 font-numeric leading-none">
                          {formatTime(trip.departure_at)}
                        </span>
                        <span className="text-[10px] text-ink-600 font-semibold truncate block mt-1">
                          {trip.origin_terminal || 'Terminal'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center px-1">
                        <span className="text-[10px] text-ink-600 font-bold leading-none flex items-center gap-1">
                          <Clock className="h-3 w-3" strokeWidth={2} />
                          {formatDuration(trip.duration_minutes)}
                        </span>
                        
                        {/* Visual timeline bar */}
                        <div className="relative w-full h-[2px] bg-line rounded-full mt-2 flex items-center justify-between">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          <div className="h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                        </div>
                        <span className="text-[8px] text-ink-400 font-bold uppercase tracking-wider mt-1.5">Directo</span>
                      </div>

                      <div className="text-right">
                        <span className="block text-h3 font-extrabold text-ink-900 font-numeric leading-none">
                          {formatTime(trip.arrival_at)}
                        </span>
                        <span className="text-[10px] text-ink-600 font-semibold truncate block mt-1">
                          {trip.destination_terminal || 'Terminal'}
                        </span>
                      </div>
                    </div>

                    <hr className="border-line/65 my-3" />

                    {/* BOTTOM ROW: AMENITIES AND CTA */}
                    <div className="flex items-center justify-between">
                      {/* AMENITY ICONS */}
                      <div className="flex items-center gap-2 text-ink-400">
                        {amenities.wifi && (
                          <div className="bg-surface p-1.5 rounded-[8px]" title="WiFi de alta velocidad">
                            <Wifi className="h-3.5 w-3.5" strokeWidth={2} />
                          </div>
                        )}
                        {amenities.ac && (
                          <div className="bg-surface p-1.5 rounded-[8px]" title="Aire acondicionado">
                            <Snowflake className="h-3.5 w-3.5" strokeWidth={2} />
                          </div>
                        )}
                        {amenities.usb && (
                          <div className="bg-surface p-1.5 rounded-[8px]" title="Cargadores USB en cada asiento">
                            <Usb className="h-3.5 w-3.5" strokeWidth={2} />
                          </div>
                        )}
                        {amenities.toilet && (
                          <div className="bg-surface p-1.5 rounded-[8px]" title="Baño operativo">
                            <Droplets className="h-3.5 w-3.5" strokeWidth={2} />
                          </div>
                        )}
                        {amenities.snacks && (
                          <div className="bg-surface p-1.5 rounded-[8px]" title="Snacks o refrigerio">
                            <Coffee className="h-3.5 w-3.5" strokeWidth={2} />
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <Button
                        variant="accent"
                        size="md"
                        onClick={() => handleSelectTrip(trip)}
                        className="px-4 font-bold select-none cursor-pointer"
                      >
                        Ver Asientos
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      {/* FILTER BOTTOM SHEET */}
      <BottomSheet
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        title="Filtros de Búsqueda"
      >
        <div className="space-y-6 pb-6 select-none">
          {/* PRICE RANGE FILTERS */}
          <div className="space-y-3">
            <h4 className="text-body-sm font-bold text-ink-900 uppercase tracking-wider">Rango de Precios (USD)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-ink-600 uppercase">Min</label>
                <input
                  type="number"
                  placeholder="$ 0.00"
                  value={tempMinPrice}
                  onChange={(e) => setTempMinPrice(e.target.value)}
                  className="border-line text-body font-semibold text-ink-900 placeholder:text-ink-400 focus:border-primary h-12 w-full rounded-[12px] border bg-white px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-ink-600 uppercase">Max</label>
                <input
                  type="number"
                  placeholder="$ 100.00"
                  value={tempMaxPrice}
                  onChange={(e) => setTempMaxPrice(e.target.value)}
                  className="border-line text-body font-semibold text-ink-900 placeholder:text-ink-400 focus:border-primary h-12 w-full rounded-[12px] border bg-white px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* SCHEDULE FILTERS */}
          <div className="space-y-3">
            <h4 className="text-body-sm font-bold text-ink-900 uppercase tracking-wider">Horario de Salida</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'Todos', time: 'Cualquiera' },
                { id: 'morning', label: 'Mañana', time: '6:00 - 12:00' },
                { id: 'afternoon', label: 'Tarde', time: '12:00 - 18:00' },
                { id: 'night', label: 'Noche', time: '18:00 - 6:00' },
              ].map((timeOption) => (
                <button
                  key={timeOption.id}
                  type="button"
                  onClick={() => setTempTimeOfDay(timeOption.id as any)}
                  className={`border border-line rounded-[14px] p-3 text-center transition-all cursor-pointer ${
                    tempTimeOfDay === timeOption.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'bg-white text-ink-900 active:bg-surface'
                  }`}
                >
                  <span className="block text-body-sm font-bold leading-none mb-1">{timeOption.label}</span>
                  <span className="text-[9px] text-ink-600 block leading-none font-medium">{timeOption.time}</span>
                </button>
              ))}
            </div>
          </div>

          {/* OPERATOR FILTERS */}
          <div className="space-y-3">
            <h4 className="text-body-sm font-bold text-ink-900 uppercase tracking-wider">Línea de Transporte</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTempOperatorId('')}
                className={`px-4 py-2 rounded-full border text-body-sm font-semibold transition-all cursor-pointer ${
                  !tempOperatorId
                    ? 'border-primary bg-primary text-white'
                    : 'border-line bg-white text-ink-900 active:bg-surface'
                }`}
              >
                Todos
              </button>
              {operators.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setTempOperatorId(op.id)}
                  className={`px-4 py-2 rounded-full border text-body-sm font-semibold transition-all cursor-pointer ${
                    tempOperatorId === op.id
                      ? 'border-primary bg-primary text-white'
                      : 'border-line bg-white text-ink-900 active:bg-surface'
                  }`}
                >
                  {op.name}
                </button>
              ))}
            </div>
          </div>

          {/* AMENITIES CHECKLIST */}
          <div className="space-y-3">
            <h4 className="text-body-sm font-bold text-ink-900 uppercase tracking-wider">Servicios a bordo</h4>
            <div className="space-y-2">
              {[
                { id: 'wifi', label: 'WiFi de alta velocidad', state: tempWifi, setter: setTempWifi, icon: <Wifi className="h-4 w-4" /> },
                { id: 'ac', label: 'Aire acondicionado', state: tempAc, setter: setTempAc, icon: <Snowflake className="h-4 w-4" /> },
                { id: 'usb', label: 'Cargadores USB individuales', state: tempUsb, setter: setTempUsb, icon: <Usb className="h-4 w-4" /> },
                { id: 'toilet', label: 'Baño a bordo', state: tempToilet, setter: setTempToilet, icon: <Droplets className="h-4 w-4" /> },
                { id: 'snacks', label: 'Refrigerio/Snacks', state: tempSnacks, setter: setTempSnacks, icon: <Coffee className="h-4 w-4" /> },
              ].map((service) => (
                <div
                  key={service.id}
                  onClick={() => service.setter(!service.state)}
                  className="flex items-center justify-between border border-line/60 rounded-[14px] p-3 cursor-pointer hover:bg-surface active:scale-[0.99] transition-all bg-white"
                >
                  <div className="flex items-center gap-3 text-ink-900">
                    <div className="bg-surface text-ink-600 p-2 rounded-[8px] flex-shrink-0">
                      {service.icon}
                    </div>
                    <span className="text-body-sm font-semibold">{service.label}</span>
                  </div>
                  
                  <div className={`h-6 w-6 rounded-full border-[1.5px] flex items-center justify-center transition-all ${
                    service.state
                      ? 'bg-primary border-primary text-white scale-105 shadow-sm'
                      : 'border-line bg-white'
                  }`}>
                    {service.state && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-line">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleResetFilters}
              className="cursor-pointer"
            >
              Restablecer
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleApplyFilters}
              className="cursor-pointer"
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
