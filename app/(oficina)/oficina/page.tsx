'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, 
  CreditCard, 
  MapPin, 
  User, 
  Users, 
  Bus, 
  TrendingUp, 
  FileText, 
  Search, 
  QrCode, 
  Check, 
  LogOut 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/hooks/use-auth'

export default function OficinaDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const { profile, signOut } = useAuth()
  
  // Tab activo: 'ventas' | 'viajes' | 'perfil'
  const [activeTab, setActiveTab] = React.useState<'ventas' | 'viajes' | 'perfil'>('ventas')

  // Datos de Oficina Simulados
  const officeCity = (profile as any)?.office_city || 'Caracas'
  const operatorName = 'Aeroexpresos Ejecutivos'

  // Ventas Express local states
  const [custName, setCustName] = React.useState('')
  const [custId, setCustId] = React.useState('')
  const [custSeat, setCustSeat] = React.useState('')
  const [custPhone, setCustPhone] = React.useState('')
  const [selling, setSelling] = React.useState(false)

  const handleSellTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!custName || !custId || !custSeat) {
      toast('Por favor, completa los campos requeridos.', 'warning')
      return
    }

    setSelling(true)
    setTimeout(() => {
      setSelling(false)
      toast(`¡Boleto Asiento ${custSeat} vendido y facturado con éxito!`, 'success')
      setCustName('')
      setCustId('')
      setCustSeat('')
      setCustPhone('')
    }, 1500)
  }

  return (
    <div className="bg-surface min-h-screen pb-24">
      {/* HEADER DE OFICINA */}
      <header className="border-line/60 pt-safe fixed top-0 right-0 left-0 z-40 border-b bg-white/80 backdrop-blur-md select-none">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-1.5 rounded-[8px]">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <span className="text-body font-bold text-ink-900 leading-none">
              Taquilla: {officeCity}
            </span>
          </div>

          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold uppercase">
            {operatorName}
          </span>
        </div>
      </header>

      {/* RENDER ACTIVE TAB WITH SLIDE ANIMATION */}
      <main className="pt-18 px-4 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'ventas' && (
            <motion.div
              key="ventas"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="flex justify-between items-center select-none">
                <h2 className="text-h2 font-display font-bold text-ink-900">Venta Rápida de Pasajes</h2>
                <span className="text-caption text-ink-600 font-semibold font-numeric">Efectivo / Taquilla</span>
              </div>

              {/* QUICK TICKETING CARD */}
              <Card className="bg-white border border-line p-5 rounded-[24px] shadow-sm">
                <form onSubmit={handleSellTicket} className="space-y-4">
                  <Input
                    label="Nombre del Pasajero *"
                    placeholder="Ej: Juan Pérez"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Cédula/RIF *"
                      placeholder="V-12345678"
                      value={custId}
                      onChange={(e) => setCustId(e.target.value)}
                      required
                    />
                    <Input
                      label="Nro de Asiento *"
                      placeholder="Ej: 14A"
                      value={custSeat}
                      onChange={(e) => setCustSeat(e.target.value)}
                      required
                    />
                  </div>

                  <Input
                    label="Teléfono Celular"
                    placeholder="Ej: 04141234567"
                    type="tel"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                  />

                  <div className="bg-surface rounded-[12px] p-3 text-[10px] text-ink-600 leading-normal select-none">
                    * La venta en taquilla bloqueará el asiento de manera definitiva en el inventario digital y emitirá factura física.
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={selling}
                    className="cursor-pointer"
                  >
                    Emitir Boleto Físico
                  </Button>
                </form>
              </Card>

              {/* RESUMEN DE VENTAS DIARIAS */}
              <Card className="bg-white border border-line p-4 rounded-[20px] shadow-sm select-none">
                <span className="text-caption text-ink-600 font-bold uppercase tracking-wider block mb-3">Ventas Hoy en Oficina</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-surface rounded-[14px] p-3">
                    <span className="block text-caption text-ink-600">Boletos</span>
                    <strong className="text-body font-black text-ink-900 font-numeric">18</strong>
                  </div>
                  <div className="bg-surface rounded-[14px] p-3">
                    <span className="block text-caption text-ink-600">Monto USD</span>
                    <strong className="text-body font-black text-primary font-numeric">$480.00</strong>
                  </div>
                  <div className="bg-surface rounded-[14px] p-3">
                    <span className="block text-caption text-ink-600">Pago Móvil</span>
                    <strong className="text-body font-black text-success font-numeric">12 trans.</strong>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'viajes' && (
            <motion.div
              key="viajes"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center select-none">
                <h2 className="text-h2 font-display font-bold text-ink-900">Salidas desde {officeCity}</h2>
                <span className="text-caption bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">Hoy</span>
              </div>

              {/* TRIP LIST FOR OFFICE OFFICE */}
              {[
                { time: '08:30 AM', dest: 'Maracaibo', bus: 'Yutong 102', seatsSold: 38, seatsTotal: 44, status: 'Salido' },
                { time: '01:00 PM', dest: 'Valencia', bus: 'Mercedes-Benz 45', seatsSold: 28, seatsTotal: 40, status: 'Abordando' },
                { time: '07:30 PM', dest: 'Barquisimeto', bus: 'Yutong 88', seatsSold: 12, seatsTotal: 44, status: 'Programado' },
              ].map((tripItem, idx) => {
                const occupancyPercent = (tripItem.seatsSold / tripItem.seatsTotal) * 100
                return (
                  <Card key={idx} className="bg-white border border-line p-4 rounded-[20px] shadow-sm select-none">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] bg-ink-900/5 border border-line px-2 py-0.5 rounded-full font-bold font-numeric text-ink-900">
                          {tripItem.time}
                        </span>
                        <h4 className="text-body font-bold text-ink-900 mt-2">
                          Destino: {tripItem.dest}
                        </h4>
                        <span className="text-caption text-ink-600 block mt-0.5">
                          Unidad: {tripItem.bus}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          tripItem.status === 'Salido' 
                            ? 'bg-ink-400/10 text-ink-600'
                            : tripItem.status === 'Abordando'
                            ? 'bg-success/10 text-success'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {tripItem.status}
                        </span>
                        <span className="text-caption text-ink-600 block mt-2 font-bold font-numeric">
                          Ocupación: {tripItem.seatsSold}/{tripItem.seatsTotal}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar of Occupancy */}
                    <div className="w-full h-1.5 bg-line rounded-full mt-4 overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${occupancyPercent}%` }} 
                      />
                    </div>
                  </Card>
                )
              })}
            </motion.div>
          )}

          {activeTab === 'perfil' && (
            <motion.div
              key="perfil"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <h2 className="text-h2 font-display font-bold text-ink-900 select-none">Información Taquilla</h2>

              <Card className="bg-white border border-line p-5 rounded-[24px] shadow-sm select-none text-center">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8" />
                </div>
                
                <h3 className="text-body font-bold text-ink-900">Personal Taquilla</h3>
                <span className="text-caption text-ink-600 block mt-0.5">ID Empleado: EX-4902</span>
                <span className="text-caption text-primary font-bold block mt-2 uppercase">Operador Taquilla {officeCity}</span>

                <hr className="border-line/65 my-5" />

                <div className="space-y-3.5 text-left text-body-sm font-semibold text-ink-900">
                  <div className="flex justify-between">
                    <span className="text-ink-600 font-normal">Oficina principal:</span>
                    <span>Terminal {officeCity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600 font-normal">Impresora Factura:</span>
                    <span className="text-success flex items-center gap-1.5">
                      <Check className="h-4 w-4" strokeWidth={2.5} /> Conectada
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600 font-normal">Versión App Taquilla:</span>
                    <span className="font-numeric text-xs font-normal">v3.4.1 (PWA)</span>
                  </div>
                </div>
              </Card>

              {/* LOGOUT BUTTON */}
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => {
                  signOut()
                  toast('Sesión de taquilla cerrada', 'info')
                  router.push('/')
                }}
                leftIcon={<LogOut className="h-5 w-5" />}
                className="text-danger border-danger/20 hover:bg-danger/5 hover:border-danger/30 cursor-pointer"
              >
                Cerrar Sesión Taquilla
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 64PX BOTTOM NAVIGATION BAR FOR OFFICE PANEL */}
      <footer className="h-16 border-t border-line bg-white/95 backdrop-blur-md fixed bottom-0 right-0 left-0 z-40 pb-safe select-none">
        <div className="max-w-md mx-auto w-full h-full grid grid-cols-3">
          {[
            { id: 'ventas', label: 'Ventas', icon: <CreditCard className="h-5 w-5" /> },
            { id: 'viajes', label: 'Viajes', icon: <Bus className="h-5 w-5" /> },
            { id: 'perfil', label: 'Perfil', icon: <User className="h-5 w-5" /> },
          ].map((tabItem) => {
            const isTabActive = activeTab === tabItem.id
            return (
              <button
                key={tabItem.id}
                onClick={() => setActiveTab(tabItem.id as any)}
                className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${
                  isTabActive ? 'text-primary' : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                <div className={`p-1 rounded-full relative transition-colors ${
                  isTabActive ? 'text-primary' : 'text-ink-600'
                }`}>
                  {tabItem.icon}
                  {isTabActive && (
                    <motion.div
                      layoutId="oficina-nav-glow"
                      className="absolute -inset-1.5 bg-primary/5 rounded-full z-[-1]"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-bold leading-none">{tabItem.label}</span>
              </button>
            )
          })}
        </div>
      </footer>
    </div>
  )
}
