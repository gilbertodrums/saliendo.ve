'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Bus, 
  DollarSign, 
  ShieldAlert, 
  ArrowUpRight, 
  Activity,
  ArrowLeft,
  ChevronRight,
  Briefcase
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'

// Recharts dinámico para Next.js
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts'

// Mock Data para el Administrador
const weeklyRevenueData = [
  { day: 'Lun', ventas: 1200 },
  { day: 'Mar', ventas: 1900 },
  { day: 'Mié', ventas: 1500 },
  { day: 'Jue', ventas: 2100 },
  { day: 'Vie', ventas: 2800 },
  { day: 'Sáb', ventas: 3400 },
  { day: 'Dom', ventas: 2900 },
]

const operatorPerformanceData = [
  { name: 'Aeroexpresos', ocupacion: 82, boletos: 140 },
  { name: 'Exp. Occidente', ocupacion: 76, boletos: 120 },
  { name: 'Exp. Flamingo', ocupacion: 68, boletos: 98 },
  { name: 'Rutas de Vzla', ocupacion: 90, boletos: 160 },
]

export default function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()

  // Evitar hydration issues con Recharts en SSR
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleRefreshStats = () => {
    toast('Estadísticas globales actualizadas en tiempo real', 'success')
  }

  return (
    <div className="bg-surface min-h-screen pb-16">
      {/* HEADER DE ADMIN */}
      <header className="border-line/60 pt-safe fixed top-0 right-0 left-0 z-40 border-b bg-white/80 backdrop-blur-md select-none">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="text-ink-900 active:bg-surface flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <span className="text-body font-bold text-ink-900 leading-none">
              Consola Administrador
            </span>
          </div>

          <button
            onClick={handleRefreshStats}
            className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-bold uppercase cursor-pointer hover:bg-primary/15 transition-colors"
          >
            Actualizar
          </button>
        </div>
      </header>

      <main className="pt-18 px-4 max-w-md mx-auto w-full">
        {/* STATS GRID INDICATORS */}
        <section className="grid grid-cols-2 gap-4 select-none">
          {/* REVENUE */}
          <Card className="bg-white border border-line p-4 rounded-[20px] shadow-sm flex flex-col justify-between h-28">
            <div className="flex justify-between items-center text-ink-600">
              <span className="text-[10px] font-bold uppercase tracking-wider">Recaudación (USD)</span>
              <div className="bg-primary/5 text-primary p-1.5 rounded-[8px]">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="block text-h1 font-display font-black text-ink-900 leading-none font-numeric">
                $15,800
              </span>
              <span className="text-[9px] text-success font-bold flex items-center gap-0.5 mt-1.5 leading-none">
                <TrendingUp className="h-3 w-3" /> +12.4% vs ayer
              </span>
            </div>
          </Card>

          {/* TICKETS SOLD */}
          <Card className="bg-white border border-line p-4 rounded-[20px] shadow-sm flex flex-col justify-between h-28">
            <div className="flex justify-between items-center text-ink-600">
              <span className="text-[10px] font-bold uppercase tracking-wider">Boletos Vendidos</span>
              <div className="bg-accent/5 text-accent p-1.5 rounded-[8px]">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="block text-h1 font-display font-black text-ink-900 leading-none font-numeric">
                518
              </span>
              <span className="text-[9px] text-success font-bold flex items-center gap-0.5 mt-1.5 leading-none">
                <TrendingUp className="h-3 w-3" /> +8.2% vs ayer
              </span>
            </div>
          </Card>

          {/* ACTIVE TRIPS */}
          <Card className="bg-white border border-line p-4 rounded-[20px] shadow-sm flex flex-col justify-between h-28">
            <div className="flex justify-between items-center text-ink-600">
              <span className="text-[10px] font-bold uppercase tracking-wider">Viajes Activos</span>
              <div className="bg-success/5 text-success p-1.5 rounded-[8px]">
                <Bus className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="block text-h1 font-display font-black text-ink-900 leading-none font-numeric">
                14
              </span>
              <span className="text-[9px] text-ink-600 font-bold block mt-1.5 leading-none">
                3 operadores activos
              </span>
            </div>
          </Card>

          {/* OCCUPANCY AVG */}
          <Card className="bg-white border border-line p-4 rounded-[20px] shadow-sm flex flex-col justify-between h-28">
            <div className="flex justify-between items-center text-ink-600">
              <span className="text-[10px] font-bold uppercase tracking-wider">Ocupación Promedio</span>
              <div className="bg-amber-500/5 text-amber-500 p-1.5 rounded-[8px]">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div>
              <span className="block text-h1 font-display font-black text-ink-900 leading-none font-numeric">
                79.0%
              </span>
              <span className="text-[9px] text-success font-bold flex items-center gap-0.5 mt-1.5 leading-none">
                <TrendingUp className="h-3 w-3" /> +4.1% esta semana
              </span>
            </div>
          </Card>
        </section>

        {/* INTERACTIVE WEEKLY REVENUES AREA CHART */}
        <section className="mt-6">
          <Card className="bg-white border border-line p-4 rounded-[24px] shadow-sm">
            <div className="flex justify-between items-center mb-4 select-none">
              <div>
                <span className="text-caption text-ink-600 font-bold uppercase tracking-wider block">Flujo de Ingresos</span>
                <span className="text-body-sm font-bold text-ink-900">Ventas Diarias (USD)</span>
              </div>
              <div className="h-8 w-8 bg-surface rounded-full flex items-center justify-center text-ink-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>

            <div className="h-44 w-full text-caption select-none">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyRevenueData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A3CFF" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#1A3CFF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E9F2" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} stroke="#9AA3BD" />
                    <YAxis axisLine={false} tickLine={false} stroke="#9AA3BD" />
                    <Tooltip contentStyle={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E6E9F2' }} />
                    <Area type="monotone" dataKey="ventas" stroke="#1A3CFF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVentas)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-surface animate-pulse rounded-[16px]" />
              )}
            </div>
          </Card>
        </section>

        {/* OPERATOR OCCUPANCY RATE BAR CHART */}
        <section className="mt-6">
          <Card className="bg-white border border-line p-4 rounded-[24px] shadow-sm">
            <div className="flex justify-between items-center mb-4 select-none">
              <div>
                <span className="text-caption text-ink-600 font-bold uppercase tracking-wider block">Rendimiento</span>
                <span className="text-body-sm font-bold text-ink-900">Porcentaje de Ocupación por Línea</span>
              </div>
              <div className="h-8 w-8 bg-surface rounded-full flex items-center justify-center text-ink-600">
                <Users className="h-4 w-4" />
              </div>
            </div>

            <div className="h-44 w-full text-caption select-none">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={operatorPerformanceData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E9F2" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#9AA3BD" />
                    <YAxis axisLine={false} tickLine={false} stroke="#9AA3BD" unit="%" />
                    <Tooltip contentStyle={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E6E9F2' }} />
                    <Bar dataKey="ocupacion" fill="#FF6B2B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-surface animate-pulse rounded-[16px]" />
              )}
            </div>
          </Card>
        </section>

        {/* SYSTEM AUDIT ALERTS / REALTIME ACTION logs */}
        <section className="mt-6 select-none">
          <div className="flex justify-between items-center mb-3.5 px-1">
            <span className="text-caption text-ink-600 font-bold uppercase tracking-wider">Bitácora del Sistema</span>
            <span className="text-[10px] text-ink-600 font-bold flex items-center gap-1">
              <Activity className="h-3 w-3 text-success" /> En Tiempo Real
            </span>
          </div>

          <div className="space-y-2.5">
            {[
              { time: 'Hace 2 min', type: 'COMPRA', desc: 'Boleto vendido en Caracas - Asiento 05A (USDT)', status: 'OK' },
              { time: 'Hace 8 min', type: 'HOLD', desc: 'Asiento 12C reservado temporalmente en ruta Valencia', status: 'HOLD' },
              { time: 'Hace 14 min', type: 'ALERTA', desc: 'Pago verificado exitosamente Ref: #849028', status: 'SYS' },
            ].map((log, idx) => (
              <Card key={idx} className="bg-white border border-line p-3.5 rounded-[16px] shadow-sm flex justify-between items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                      log.type === 'COMPRA' 
                        ? 'bg-success/10 text-success'
                        : log.type === 'HOLD'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-accent/10 text-accent'
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-[10px] text-ink-600 font-semibold">{log.time}</span>
                  </div>
                  <p className="text-body-sm font-bold text-ink-900 mt-1 truncate">
                    {log.desc}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-400 flex-shrink-0" />
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
