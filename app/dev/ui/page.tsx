'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Header } from '@/components/ui/header'
import { BottomNav, BottomNavTab } from '@/components/ui/bottom-nav'
import {
  Bus,
  Search,
  User,
  Settings,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Send,
  Loader2,
  Calendar,
  CreditCard,
} from 'lucide-react'

export default function DevUiPage() {
  const { success, error, warning, info } = useToast()
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const [inputError, setInputError] = React.useState('')
  const [isButtonLoading, setIsButtonLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('home')

  // Tabs de navegación simulada
  const navTabs: BottomNavTab[] = [
    { id: 'home', label: 'Viajes', icon: Bus, href: '#' },
    { id: 'search', label: 'Buscar', icon: Search, href: '#' },
    { id: 'profile', label: 'Mi Perfil', icon: User, href: '#' },
    { id: 'admin', label: 'Ajustes', icon: Settings, href: '#' },
  ]

  const triggerToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        success('¡Asiento reservado con éxito! Tienes 10 minutos para pagar.')
        break
      case 'error':
        error('Hubo un error de conexión con la pasarela de pago.')
        break
      case 'warning':
        warning('Tu sesión de reserva expirará en 2 minutos.')
        break
      case 'info':
        info('Siguiente autobús programado para salir a las 08:30 AM.')
        break
    }
  }

  const validateInput = (value: string) => {
    setInputValue(value)
    if (value.trim() === '') {
      setInputError('Este campo no puede estar vacío.')
    } else if (value.length < 3) {
      setInputError('El nombre debe tener al menos 3 caracteres.')
    } else {
      setInputError('')
    }
  }

  const simulateLoading = () => {
    setIsButtonLoading(true)
    setTimeout(() => {
      setIsButtonLoading(false)
      success('Operación completada con éxito.')
    }, 2000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-0 text-slate-100 md:p-8">
      {/* Marco de simulación móvil (solo visible en pantallas grandes) */}
      <div className="text-ink-900 relative flex min-h-screen w-full max-w-md flex-col overflow-hidden border-0 bg-white md:max-h-[880px] md:min-h-[840px] md:rounded-[40px] md:border-[8px] md:border-slate-800 md:shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
        {/* Header móvil */}
        <Header
          title="Componentes UI Base"
          showBackButton={true}
          onBackClick={() => info('Acción de botón Atrás')}
        />

        {/* Contenido principal - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pt-16 pb-20">
          <div className="space-y-8 py-4">
            {/* Introducción */}
            <div className="border-line border-b py-2 pb-4 text-center">
              <h1 className="text-h1 text-brand-gradient font-extrabold">Saliendo.ve</h1>
              <p className="text-body-sm text-ink-600 mt-1">
                Catálogo interactivo y entorno de pruebas de componentes base.
              </p>
            </div>

            {/* SECCIÓN 1: BOTONES */}
            <section className="space-y-4">
              <h2 className="text-h2 text-ink-900 border-primary border-l-4 pl-2 font-bold">
                Botones (`button.tsx`)
              </h2>
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <span className="text-caption text-ink-600 font-semibold">
                    Primario / CTA Principal
                  </span>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => success('Botón Primario presionado!')}
                  >
                    Comprar Pasaje (48px)
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-2">
                    <span className="text-caption text-ink-600 font-semibold">Secundario</span>
                    <Button variant="secondary" onClick={() => info('Botón Secundario')}>
                      Atrás
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-caption text-ink-600 font-semibold">
                      Acento (Compra Final)
                    </span>
                    <Button variant="accent" onClick={() => triggerToast('success')}>
                      Confirmar
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-caption text-ink-600 font-semibold">Con Iconos</span>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      leftIcon={<Search className="h-5 w-5" />}
                      className="flex-1"
                    >
                      Buscar
                    </Button>
                    <Button
                      variant="secondary"
                      rightIcon={<Send className="h-5 w-5" />}
                      className="flex-1"
                    >
                      Enviar
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-caption text-ink-600 font-semibold">
                    Estados Especiales
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      isLoading={isButtonLoading}
                      onClick={simulateLoading}
                      className="flex-1"
                    >
                      {isButtonLoading ? 'Procesando' : 'Simular Carga'}
                    </Button>
                    <Button variant="primary" disabled className="flex-1">
                      Deshabilitado
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* SECCIÓN 2: FORMULARIOS */}
            <section className="space-y-4">
              <h2 className="text-h2 text-ink-900 border-primary border-l-4 pl-2 font-bold">
                Inputs (`input.tsx`)
              </h2>
              <div className="space-y-3">
                <Input
                  label="Nombre Completo"
                  placeholder="Ej. Juan Pérez"
                  helperText="Ingresa tu nombre tal como aparece en tu cédula."
                />

                <Input
                  label="Cédula de Identidad"
                  placeholder="Ej. 12345678"
                  leftIcon={<User className="h-5 w-5" />}
                />

                <Input
                  label="Validación Dinámica"
                  placeholder="Escribe menos de 3 letras..."
                  value={inputValue}
                  onChange={(e) => validateInput(e.target.value)}
                  error={inputError}
                  rightIcon={
                    inputError ? <AlertCircle className="text-danger h-5 w-5" /> : undefined
                  }
                />

                <Input
                  label="Input Deshabilitado"
                  placeholder="No puedes escribir aquí"
                  disabled
                  value="Contenido no modificable"
                />
              </div>
            </section>

            {/* SECCIÓN 3: CARDS */}
            <section className="space-y-4">
              <h2 className="text-h2 text-ink-900 border-primary border-l-4 pl-2 font-bold">
                Tarjetas (`card.tsx`)
              </h2>
              <div className="space-y-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Viaje Directo</CardTitle>
                    <CardDescription>Caracas → Maracaibo • Expresos Occidente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-surface flex items-center justify-between rounded-[12px] p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="text-primary h-5 w-5" />
                        <div>
                          <p className="text-caption text-ink-600 leading-none font-semibold">
                            FECHA
                          </p>
                          <p className="text-body-sm text-ink-900 mt-1 font-bold">
                            28 de Mayo, 2026
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-caption text-ink-600 leading-none font-semibold">
                          PRECIO
                        </p>
                        <p className="text-body text-accent mt-1 font-extrabold">$35.00</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <span className="text-caption text-ink-600 font-medium">
                      Asiento 12 (Ventana)
                    </span>
                    <span className="text-caption text-success flex items-center gap-1 font-bold">
                      <CheckCircle2 className="h-4 w-4" /> Asiento Retenido
                    </span>
                  </CardFooter>
                </Card>

                <Card interactive onClick={() => triggerToast('info')}>
                  <CardHeader>
                    <CardTitle className="text-body flex items-center justify-between font-bold">
                      <span>Tarjeta Interactiva</span>
                      <span className="text-caption bg-primary/10 text-primary rounded-full px-2.5 py-1 font-bold">
                        Tap Aquí
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Esta tarjeta tiene efectos táctiles con Framer Motion (whileTap) y responde al
                      clic.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </section>

            {/* SECCIÓN 4: TOAST SYSTEM */}
            <section className="space-y-4">
              <h2 className="text-h2 text-ink-900 border-primary border-l-4 pl-2 font-bold">
                Feedback & Toasts (`toast.tsx`)
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  onClick={() => triggerToast('success')}
                  className="text-success border-success/30 hover:bg-success/5 h-12"
                >
                  Toast Éxito
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => triggerToast('error')}
                  className="text-danger border-danger/30 hover:bg-danger/5 h-12"
                >
                  Toast Error
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => triggerToast('warning')}
                  className="text-warning border-warning/30 hover:bg-warning/5 h-12"
                >
                  Toast Alerta
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => triggerToast('info')}
                  className="text-primary border-primary/30 hover:bg-primary/5 h-12"
                >
                  Toast Info
                </Button>
              </div>
            </section>

            {/* SECCIÓN 5: SKELETON LOADERS */}
            <section className="space-y-4">
              <h2 className="text-h2 text-ink-900 border-primary border-l-4 pl-2 font-bold">
                Skeletons (`skeleton.tsx`)
              </h2>
              <div className="border-line space-y-3 rounded-[16px] border bg-white p-4">
                <div className="flex items-center gap-3">
                  {/* Círculo para avatar o icono */}
                  <Skeleton variant="circle" className="h-12 w-12" />
                  <div className="flex-1 space-y-1.5">
                    {/* Líneas simuladas de texto */}
                    <Skeleton variant="text" className="h-4 w-3/4" />
                    <Skeleton variant="text" className="h-3.5 w-1/2" />
                  </div>
                </div>
                {/* Cuadro grande simulando mapa o imagen */}
                <Skeleton variant="rect" className="mt-2 h-20 w-full" />
              </div>
            </section>

            {/* SECCIÓN 6: BOTTOM SHEET */}
            <section className="space-y-4">
              <h2 className="text-h2 text-ink-900 border-primary border-l-4 pl-2 font-bold">
                Bottom Sheets (`bottom-sheet.tsx`)
              </h2>
              <div className="space-y-3">
                <p className="text-body-sm text-ink-600">
                  Prueba el selector principal en móviles. Cuenta con arrastre físico
                  drag-to-dismiss y backdrop blur.
                </p>
                <Button
                  variant="primary"
                  leftIcon={<Sliders className="h-5 w-5" />}
                  fullWidth
                  onClick={() => setIsSheetOpen(true)}
                >
                  Abrir Filtros de Viaje
                </Button>
              </div>
            </section>
          </div>
        </div>

        {/* Bottom Navigation móvil */}
        <BottomNav
          tabs={navTabs}
          activeTab={activeTab}
          onChange={(id) => {
            setActiveTab(id)
            info(`Tab seleccionada: ${navTabs.find((t) => t.id === id)?.label}`)
          }}
        />

        {/* Modal de Bottom Sheet */}
        <BottomSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          title="Filtros de Búsqueda"
        >
          <div className="space-y-5">
            <p className="text-body-sm text-ink-600">
              Personaliza tu viaje ordenando por precio, horario o amenidades de autobús.
            </p>

            <div className="space-y-3">
              <h4 className="text-body-sm text-ink-900 font-bold">Ordenar por</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" size="sm" className="h-12 rounded-[10px]">
                  Menor Precio
                </Button>
                <Button variant="secondary" size="sm" className="h-12 rounded-[10px]">
                  Hora de Salida
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-body-sm text-ink-900 font-bold">Tipo de Servicio</h4>
              <div className="space-y-2">
                <label className="border-line hover:bg-surface flex cursor-pointer items-center gap-3 rounded-[12px] border p-3 transition-all active:scale-[0.99]">
                  <input type="checkbox" defaultChecked className="accent-primary h-5 w-5" />
                  <div>
                    <p className="text-body-sm text-ink-900 font-bold">Semicama</p>
                    <p className="text-caption text-ink-600">Aire acondicionado, cargador USB</p>
                  </div>
                </label>
                <label className="border-line hover:bg-surface flex cursor-pointer items-center gap-3 rounded-[12px] border p-3 transition-all active:scale-[0.99]">
                  <input type="checkbox" className="accent-primary h-5 w-5" />
                  <div>
                    <p className="text-body-sm text-ink-900 font-bold">Cama Ejecutivo</p>
                    <p className="text-caption text-ink-600">Reclinación premium, WiFi a bordo</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="h-12 flex-1"
                onClick={() => setIsSheetOpen(false)}
              >
                Limpiar
              </Button>
              <Button
                variant="primary"
                className="h-12 flex-1"
                onClick={() => {
                  setIsSheetOpen(false)
                  success('¡Filtros aplicados con éxito!')
                }}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </BottomSheet>
      </div>
    </div>
  )
}
