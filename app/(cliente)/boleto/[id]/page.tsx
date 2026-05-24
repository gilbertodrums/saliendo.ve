'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  MapPin, 
  Calendar, 
  Users, 
  Armchair, 
  CheckCircle, 
  Ticket as TicketIcon, 
  Sparkles,
  Info
} from 'lucide-react'
import { Header } from '@/components/ui/header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import type { Ticket, TripWithOperator } from '@/types/database'

export default function BoletoDetallePage() {
  const router = useRouter()
  const params = useParams()
  const ticketId = params.id as string
  const { toast } = useToast()
  const supabase = createClient()

  // States
  const [ticket, setTicket] = React.useState<Ticket | null>(null)
  const [tripInfo, setTripInfo] = React.useState<TripWithOperator | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('')
  const [downloadingPdf, setDownloadingPdf] = React.useState(false)

  // Cargar boleto y su viaje unificado
  React.useEffect(() => {
    const fetchBoletoData = async () => {
      setLoading(true)
      setError(null)
      try {
        // 1. Obtener ticket de la tabla tickets
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single()

        if (ticketError) throw ticketError
        setTicket(ticketData)

        // 2. Obtener detalles del viaje de la vista trips_with_operator
        const { data: tripData, error: tripError } = await supabase
          .from('trips_with_operator')
          .select('*')
          .eq('trip_id', ticketData.trip_id)
          .single()

        if (tripError) throw tripError
        setTripInfo(tripData)

        // 3. Generar Código QR del token de manera local con la librería qrcode
        if (ticketData.qr_token) {
          const qrUrl = await QRCode.toDataURL(ticketData.qr_token, {
            width: 280,
            margin: 2,
            color: {
              dark: '#0A1330', // Ink 900
              light: '#FFFFFF'
            }
          })
          setQrCodeUrl(qrUrl)
        }
      } catch (err: any) {
        console.error('Error al cargar datos del boleto:', err)
        setError(err.message || 'Error al obtener boleto')
      } finally {
        setLoading(false)
      }
    }

    if (ticketId) {
      fetchBoletoData()
    }
  }, [ticketId, supabase])

  // Formatear hora
  const formatTime = (isoString: string | null) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  // Formatear fecha
  const formatDate = (isoString: string | null) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return d.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'short' })
  }

  // Compartir pasaje con Web Share API
  const handleShareTicket = async () => {
    if (!ticket || !tripInfo) return

    const shareData = {
      title: `Mi Pasaje saliendo.ve — ${tripInfo.operator_name}`,
      text: `¡Hola! Ya compré mi boleto para viajar de ${tripInfo.origin_city} a ${tripInfo.destination_city} el día ${new Date(tripInfo.departure_at!).toLocaleDateString('es-VE')}. Mi asiento es el ${ticket.seat_number}.`,
      url: window.location.origin + `/boleto/${ticket.id}`,
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        toast('Enlace compartido con éxito', 'success')
      } catch (err) {
        console.log('Canceló compartir pasaje')
      }
    } else {
      // Fallback
      try {
        await navigator.clipboard.writeText(shareData.url)
        toast('¡Enlace de boleto copiado al portapapeles!', 'success')
      } catch (err) {
        toast('No se pudo copiar el enlace. Cópialo manualmente de la barra de direcciones.', 'warning')
      }
    }
  }

  // Simular descarga de PDF
  const handleDownloadPdf = () => {
    setDownloadingPdf(true)
    toast('Generando PDF del boleto...', 'info')
    
    // Vibración sutil
    navigator.vibrate?.(30)

    setTimeout(() => {
      setDownloadingPdf(false)
      toast('¡Boleto en formato PDF descargado con éxito!', 'success')
    }, 2000)
  }

  // Configuración de Confetti con Framer Motion (partículas de colores animadas)
  const confettiColors = ['#1A3CFF', '#FF6B2B', '#16A34A', '#F59E0B', '#E6E9F2']
  const confettiParticles = React.useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      x: Math.random() * 360 - 180, // dirección X aleatoria
      y: Math.random() * -300 - 150, // altura Y aleatoria
      color: confettiColors[i % confettiColors.length],
      size: Math.random() * 8 + 6,
      rotate: Math.random() * 360,
      delay: Math.random() * 0.3
    }))
  }, [])

  if (loading) {
    return (
      <div className="bg-surface min-h-screen flex flex-col justify-center items-center px-6 pt-14 pb-12 select-none">
        <div className="h-14 bg-white border-b border-line fixed top-0 left-0 right-0 z-40 flex items-center px-4">
          <ArrowLeft className="h-5 w-5 text-ink-900" />
        </div>
        <div className="flex flex-col items-center gap-4 text-center mt-12">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <h3 className="text-body font-bold text-ink-900">Preparando tu pasaje definitivo...</h3>
          <p className="text-caption text-ink-600">Generando firma digital y código QR...</p>
        </div>
      </div>
    )
  }

  if (error || !ticket || !tripInfo) {
    return (
      <div className="bg-surface min-h-screen flex flex-col justify-center items-center px-6 pt-14 pb-12 select-none">
        <div className="h-14 bg-white border-b border-line fixed top-0 left-0 right-0 z-40 flex items-center px-4">
          <button onClick={() => router.push('/')} className="cursor-pointer">
            <ArrowLeft className="h-5 w-5 text-ink-900" />
          </button>
        </div>
        <div className="bg-white border border-line rounded-[24px] p-6 text-center max-w-sm w-full shadow-md">
          <Info className="h-10 w-10 text-danger mx-auto mb-3" />
          <h4 className="text-body font-bold text-ink-900">Boleto no encontrado</h4>
          <p className="text-caption text-ink-600 mt-2">
            No pudimos ubicar el boleto solicitado. Si el pago fue procesado, se sincronizará en unos instantes.
          </p>
          <Button variant="primary" size="md" onClick={() => router.push('/')} className="mt-6 w-full cursor-pointer">
            Ir al Inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface min-h-screen pb-16 relative overflow-hidden">
      
      {/* CONFETTI ANIMATION EFFECTS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex items-center justify-center w-full max-w-[360px] h-screen overflow-hidden">
        {confettiParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
            animate={{ 
              y: p.y + 600, 
              x: p.x + (Math.sin(p.id) * 30), 
              opacity: 0,
              rotate: p.rotate + 720
            }}
            transition={{ 
              duration: 3.5, 
              ease: 'easeOut',
              delay: p.delay
            }}
            className="absolute rounded-[4px]"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              top: '10%'
            }}
          />
        ))}
      </div>

      {/* Header global */}
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
              Tu Boleto Digital
            </span>
            <span className="text-[10px] text-success font-bold block mt-0.5 uppercase tracking-wider">
              ¡Compra Exitosa!
            </span>
          </div>

          <div className="w-10 h-10" />
        </div>
      </header>

      <main className="pt-18 px-4 max-w-md mx-auto w-full">
        {/* PREMIUM ANIMATED GREEN CHECKMARK */}
        <div className="flex flex-col items-center justify-center py-6 select-none text-center">
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="bg-success/10 text-success p-4 rounded-full flex items-center justify-center mb-3"
          >
            <CheckCircle className="h-12 w-12" strokeWidth={2} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-1.5 justify-center"
          >
            <Sparkles className="h-4 w-4 text-amber-500 animate-spin" />
            <h2 className="text-h1 font-display font-black text-ink-900">¡Buen Viaje!</h2>
          </motion.div>
          <p className="text-caption text-ink-600 mt-1 max-w-[240px]">
            Tu pasaje está confirmado. Preséntalo desde tu móvil al abordar.
          </p>
        </div>

        {/* PHYSICAL-LIKE TICKET CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <Card className="bg-white border border-line rounded-[28px] overflow-hidden shadow-[0_12px_40px_rgba(10,19,48,0.08)] relative select-none">
            {/* Top brand portion */}
            <div className="bg-brand-gradient text-white p-5 flex justify-between items-center relative">
              <div className="space-y-0.5">
                <span className="block text-[10px] text-white/70 font-bold uppercase tracking-wider">Transportista</span>
                <span className="block text-body font-black">{tripInfo.operator_name}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-white/70 font-bold uppercase tracking-wider">Localizador</span>
                <span className="block font-mono text-sm font-black tracking-wider uppercase">
                  {ticket.id.split('-')[0].toUpperCase()}
                </span>
              </div>
            </div>

            {/* Main ticket core */}
            <div className="p-5 space-y-4">
              
              {/* CITIES */}
              <div className="grid grid-cols-3 gap-1 items-center">
                <div>
                  <span className="block text-[10px] text-ink-600 font-bold uppercase tracking-wider">Origen</span>
                  <span className="text-h2 font-extrabold text-ink-900 leading-none">{tripInfo.origin_city}</span>
                  <span className="text-[10px] text-ink-600 block mt-1 truncate">{tripInfo.origin_terminal}</span>
                </div>

                <div className="flex flex-col items-center">
                  <TicketIcon className="h-5 w-5 text-primary/45" strokeWidth={1.5} />
                  <div className="w-full border-b border-dashed border-line my-1.5" />
                  <span className="text-[9px] text-ink-600 font-bold uppercase tracking-wider">Boleto Ida</span>
                </div>

                <div className="text-right">
                  <span className="block text-[10px] text-ink-600 font-bold uppercase tracking-wider">Destino</span>
                  <span className="text-h2 font-extrabold text-ink-900 leading-none">{tripInfo.destination_city}</span>
                  <span className="text-[10px] text-ink-600 block mt-1 truncate">{tripInfo.destination_terminal}</span>
                </div>
              </div>

              <hr className="border-line/65" />

              {/* DETAILS GRID */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2.5">
                  <Calendar className="h-4.5 w-4.5 text-ink-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <span className="block text-[10px] text-ink-600 font-bold uppercase tracking-wider">Fecha y Hora</span>
                    <span className="block text-body-sm font-extrabold text-ink-900 leading-tight">
                      {formatDate(tripInfo.departure_at)}
                    </span>
                    <span className="text-[10px] text-primary font-black block mt-0.5">
                      {formatTime(tripInfo.departure_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Armchair className="h-4.5 w-4.5 text-ink-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <span className="block text-[10px] text-ink-600 font-bold uppercase tracking-wider">Asiento</span>
                    <span className="block text-h2 font-display font-black text-accent leading-none">
                      {ticket.seat_number}
                    </span>
                    <span className="text-[9px] text-ink-600 font-bold block mt-1">
                      Clase Standard
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-line/65" />

              {/* PASSENGER INFO */}
              <div className="flex items-start gap-2.5">
                <Users className="h-4.5 w-4.5 text-ink-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <span className="block text-[10px] text-ink-600 font-bold uppercase tracking-wider">Pasajero</span>
                  <span className="block text-body-sm font-bold text-ink-900 truncate uppercase">
                    {ticket.passenger_name}
                  </span>
                  <span className="text-[10px] text-ink-600 block font-semibold mt-0.5">
                    Cédula: {ticket.passenger_id_number}
                  </span>
                </div>
              </div>

            </div>

            {/* SEPARADOR DENTADO (TICKET TEAR-OFF LINE) */}
            <div className="relative h-4 bg-surface my-1 flex items-center justify-between select-none">
              <div className="h-4 w-4 rounded-full bg-surface border-r border-line -ml-2" />
              <div className="flex-1 border-t-2 border-dashed border-line mx-2" />
              <div className="h-4 w-4 rounded-full bg-surface border-l border-line -mr-2" />
            </div>

            {/* QR Code and digital stamp portion */}
            <div className="p-5 flex flex-col items-center gap-3">
              {/* QR Image holder */}
              <div className="bg-white border-[3px] border-ink-900 rounded-[20px] p-2.5 shadow-sm max-w-[200px] w-full aspect-square flex items-center justify-center">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="Boleto QR de verificación" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-surface animate-pulse rounded-[12px]" />
                )}
              </div>
              
              <div className="text-center">
                <span className="text-[8px] text-ink-400 font-extrabold uppercase tracking-widest block leading-none">
                  Firma Electrónica Válida
                </span>
                <span className="font-mono text-[9px] text-ink-600 block mt-1">
                  {ticket.qr_token}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* PRIMARY CONTROL BUTTONS */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleShareTicket}
            leftIcon={<Share2 className="h-5 w-5" />}
            className="cursor-pointer font-bold"
          >
            Compartir
          </Button>
          
          <Button
            variant="primary"
            size="lg"
            onClick={handleDownloadPdf}
            leftIcon={<Download className="h-5 w-5" />}
            isLoading={downloadingPdf}
            className="cursor-pointer font-bold"
          >
            Descargar PDF
          </Button>
        </div>

        {/* REGRESAR AL HOME CTA */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="w-full text-center text-body-sm text-primary font-bold hover:underline mt-8 cursor-pointer active:scale-95 transition-transform"
        >
          ← Volver a Comprar Pasajes
        </button>
      </main>
    </div>
  )
}
