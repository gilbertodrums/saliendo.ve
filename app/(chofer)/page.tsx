'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bus, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  MapPin, 
  Clock, 
  Check,
  Search,
  Scan
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'

interface ConductorPassenger {
  id: string
  seat: string
  name: string
  idCard: string
  boarded: boolean
}

export default function ChoferDashboard() {
  const { toast } = useToast()

  // Chofer Trip info
  const busUnit = 'Unidad 102'
  const routeName = 'Caracas a San Cristóbal'
  const departureTime = '08:30 PM'

  // Passenger list state
  const [passengers, setPassengers] = React.useState<ConductorPassenger[]>([
    { id: '1', seat: '01A', name: 'JUAN ALBERTO HERNÁNDEZ', idCard: 'V-14.892.482', boarded: true },
    { id: '2', seat: '01B', name: 'MARÍA ALEJANDRA PÉREZ', idCard: 'V-18.390.281', boarded: true },
    { id: '3', seat: '02A', name: 'CARLOS ENRIQUE RONDÓN', idCard: 'V-11.203.492', boarded: false },
    { id: '4', seat: '02B', name: 'PATRICIA COROMOTO CASTRO', idCard: 'V-15.390.103', boarded: false },
    { id: '5', seat: '03A', name: 'JOSÉ GREGORIO DELGADO', idCard: 'V-9.489.102', boarded: false },
    { id: '6', seat: '03B', name: 'ANA CRISTINA VALERA', idCard: 'V-20.103.882', boarded: false },
  ])

  // Filter query for passenger search
  const [searchQuery, setSearchQuery] = React.useState('')

  // Simulate scanning QR Code
  const [scanning, setScanning] = React.useState(false)
  const [scannedTicket, setScannedTicket] = React.useState<ConductorPassenger | null>(null)

  // Toggle boarding
  const handleToggleBoarded = (id: string, name: string, currentState: boolean) => {
    // Vibration physical feedback
    navigator.vibrate?.(currentState ? 15 : [20, 50, 20])

    setPassengers(prev =>
      prev.map(p => (p.id === id ? { ...p, boarded: !p.boarded } : p))
    )

    toast(
      !currentState 
        ? `Pasajero ${name} abordó correctamente.` 
        : `Abordaje de ${name} cancelado.`,
      !currentState ? 'success' : 'info'
    )
  }

  // Trigger simulated QR Scan
  const handleScanQR = () => {
    setScanning(true)
    toast('Iniciando escáner de cámara...', 'info')
    
    // Simulate camera feed delay
    setTimeout(() => {
      // Find a passenger that has not boarded yet to board them
      const notBoarded = passengers.find(p => !p.boarded)
      if (notBoarded) {
        setScannedTicket(notBoarded)
        handleToggleBoarded(notBoarded.id, notBoarded.name, false)
      } else {
        toast('Boleto QR ya escaneado previamente o inválido', 'warning')
      }
      setScanning(false)
    }, 2000)
  }

  // Filtered passengers list
  const filteredPassengers = React.useMemo(() => {
    if (!searchQuery.trim()) return passengers
    return passengers.filter(
      p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.seat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.idCard.includes(searchQuery)
    )
  }, [passengers, searchQuery])

  // Boarded count
  const boardedCount = passengers.filter(p => p.boarded).length
  const totalCount = passengers.length

  return (
    <div className="bg-surface min-h-screen pb-32">
      {/* HEADER DE CHOFER */}
      <header className="border-line/60 pt-safe fixed top-0 right-0 left-0 z-40 border-b bg-white/80 backdrop-blur-md select-none">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-accent/10 text-accent p-1.5 rounded-[8px]">
              <Bus className="h-4.5 w-4.5" />
            </div>
            <span className="text-body font-bold text-ink-900 leading-none">
              Control de Conductor
            </span>
          </div>

          <span className="text-[10px] bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-full font-bold uppercase font-numeric">
            {busUnit}
          </span>
        </div>
      </header>

      <main className="pt-18 px-4 max-w-md mx-auto w-full">
        {/* TRIP OVERVIEW CARD */}
        <div className="bg-brand-gradient text-white rounded-[24px] p-5 shadow-lg select-none relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 translate-x-4 -translate-y-4 pointer-events-none">
            <Bus className="h-36 w-36" />
          </div>

          <span className="text-[9px] bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Viaje en Curso
          </span>
          <h2 className="text-h2 font-display font-black mt-3 leading-tight">{routeName}</h2>
          
          <div className="grid grid-cols-2 gap-4 mt-5 text-body-sm font-semibold select-text">
            <div className="flex items-center gap-1.5 text-white/90">
              <Clock className="h-4 w-4 text-white/60" strokeWidth={2} />
              <span>Hora: {departureTime}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/90 justify-end">
              <Users className="h-4 w-4 text-white/60" strokeWidth={2} />
              <span>Abordados: {boardedCount}/{totalCount}</span>
            </div>
          </div>
        </div>

        {/* SEARCH BAR FOR CHECKLIST */}
        <div className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar pasajero o asiento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-line text-body-sm font-semibold text-ink-900 placeholder:text-ink-400 focus:border-accent h-12 w-full rounded-[14px] border bg-white pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-600" />
          </div>
        </div>

        {/* PASSENGER CHECKLIST */}
        <div className="mt-5 space-y-3">
          <div className="flex justify-between items-center select-none px-1">
            <span className="text-caption text-ink-600 font-bold uppercase tracking-wider">Lista de Manifiesto</span>
            <span className="text-[10px] text-ink-600 font-bold font-numeric">{filteredPassengers.length} Pasajeros</span>
          </div>

          {filteredPassengers.length === 0 ? (
            <div className="bg-white border border-line rounded-[20px] p-6 text-center text-ink-600 text-caption select-none">
              No se encontraron pasajeros con el criterio buscado.
            </div>
          ) : (
            filteredPassengers.map((p) => (
              <Card 
                key={p.id}
                onClick={() => handleToggleBoarded(p.id, p.name, p.boarded)}
                className={`border rounded-[18px] p-3.5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
                  p.boarded 
                    ? 'bg-success/5 border-success/20' 
                    : 'bg-white border-line'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Seat Number circular badge */}
                  <div className={`h-10 w-10 rounded-full font-display font-black text-sm flex items-center justify-center flex-shrink-0 border ${
                    p.boarded 
                      ? 'bg-success border-success text-white shadow-sm' 
                      : 'bg-surface border-line text-ink-900'
                  }`}>
                    {p.seat}
                  </div>
                  
                  <div className="min-w-0">
                    <span className={`block text-body-sm font-bold truncate uppercase ${p.boarded ? 'text-success' : 'text-ink-900'}`}>
                      {p.name}
                    </span>
                    <span className="text-[10px] text-ink-600 block mt-0.5 font-semibold">
                      Cédula: {p.idCard}
                    </span>
                  </div>
                </div>

                {/* Checkbox indicator */}
                <div className={`h-6 w-6 rounded-full border-[1.5px] flex items-center justify-center transition-all ${
                  p.boarded 
                    ? 'bg-success border-success text-white scale-105 shadow-sm' 
                    : 'border-line bg-white'
                }`}>
                  {p.boarded && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </div>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* GIANT FLOATING QR SCAN BUTTON (BOTTOM FLOTANTE) */}
      <footer className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-6 select-none pointer-events-none">
        <div className="pointer-events-auto">
          <Button
            type="button"
            variant="accent"
            size="lg"
            onClick={handleScanQR}
            leftIcon={scanning ? <Scan className="h-6 w-6 animate-pulse" /> : <QrCode className="h-6 w-6 animate-bounce" />}
            className="px-8 font-extrabold h-14 rounded-full shadow-[0_8px_24px_rgba(255,107,43,0.35)] active:scale-95 transition-all text-white border-none text-body cursor-pointer"
            isLoading={scanning}
          >
            {scanning ? 'Escaneando Boleto...' : 'Escanear Boleto QR'}
          </Button>
        </div>
      </footer>
    </div>
  )
}
