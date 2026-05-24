# saliendo.ve — Guía técnica del prototipo

> Documento de referencia para el equipo. Léelo antes de tocar código.

---

## 1. Contexto y visión del producto

**saliendo.ve** es una plataforma web (PWA mobile-first) inspirada en [recorrido.cl](https://www.recorrido.cl/) pero diseñada para el mercado venezolano de transporte terrestre interurbano. El objetivo de esta primera entrega es construir un **prototipo funcional (demo)** que el equipo (4 personas: dev + 3) usará internamente para validar flujos, mostrar a líneas de transporte aliadas y probar la lógica de negocio antes de invertir en infraestructura productiva.

### 1.1 Problema que resuelve

En Venezuela la compra de pasajes interurbanos sigue siendo mayormente presencial. No existe un agregador moderno tipo Recorrido/Busbud adaptado a:

- Métodos de pago locales (Pago Móvil, transferencias a bancos venezolanos, Binance Pay/USDT).
- Conexiones inestables y cortes de energía frecuentes.
- Parque de dispositivos dominado por Android de gama media-baja.
- Operadores que aún venden mayoritariamente en taquilla.

### 1.2 Alcance del prototipo (qué SÍ entra)

- Búsqueda de viajes (origen, destino, fecha, pasajeros).
- Resultados con filtros y precio desde.
- Selección visual de asiento en el bus.
- Captura de datos del pasajero.
- **Mock de pago** (no se procesa dinero real; solo se simula y se registra el método elegido).
- Emisión de boleto con QR único.
- Panel de oficina (venta presencial, gestión de viajes, edición de boletos).
- Panel de chofer (escaneo y validación de QR).
- Panel de administrador (métricas, alta de operadores, gestión global).

### 1.3 Fuera de alcance (queda para después)

- Procesamiento real de pagos.
- Notificaciones push y emails transaccionales.
- Reembolsos automáticos.
- Multi-idioma.
- Programa de fidelidad.
- App nativa (la PWA cubre la sensación nativa).

### 1.4 Principios no negociables

1. **Mobile-first literal.** Se diseña a 360px primero, se escala hacia arriba.
2. **Funciona con mala red.** Optimistic UI, reintentos, persistencia local del flujo.
3. **Tolera cortes de luz.** Si el usuario reanuda, retoma donde quedó.
4. **Bundle inicial < 150KB gzipped.**
5. **Sensación de app nativa** (transiciones, gestos, sin parpadeos).
6. **Sin conflictos de asientos** entre web y oficina, jamás.

---

## 2. Stack tecnológico

| Capa                 | Elección                                     | Razón corta                                       |
| -------------------- | -------------------------------------------- | ------------------------------------------------- |
| Frontend             | Next.js 15 (App Router) + React + TypeScript | SSR/edge, ecosistema, type-safety                 |
| Estilos              | Tailwind CSS                                 | Bundle pequeño, mobile-first nativo               |
| PWA                  | `next-pwa` + Workbox                         | Service worker, install prompt, offline           |
| Backend + DB         | Supabase (Postgres)                          | Auth, RLS, Realtime y Storage en un solo servicio |
| Estado servidor      | TanStack Query                               | Cache, reintentos, optimistic updates             |
| Estado UI            | Zustand                                      | Ligero, sin boilerplate                           |
| Animaciones          | Framer Motion + CSS transitions              | Transiciones fluidas, gestos                      |
| QR generación        | `qrcode`                                     | Genera SVG/PNG en cliente                         |
| QR escaneo           | `@zxing/browser` o `html5-qrcode`            | Lectura desde cámara web                          |
| Almacenamiento local | `idb-keyval` (IndexedDB)                     | Persistir flujo de compra y caché de chofer       |
| Hosting              | Vercel                                       | Edge functions, deploy gratis, baja latencia      |
| Tipografías          | Plus Jakarta Sans + Inter (Google Fonts)     | Display y cuerpo                                  |
| Íconos               | Lucide React                                 | Set consistente, tree-shakeable                   |

**Plan de costos para la demo:** Vercel Hobby + Supabase Free. Cero dólares mientras estemos en prototipo.

---

## 3. Identidad visual y sistema de diseño

### 3.1 Paleta de colores

| Token             | HEX       | Uso                                                                                  |
| ----------------- | --------- | ------------------------------------------------------------------------------------ |
| `--color-primary` | `#1A3CFF` | Azul zafiro profundo. CTAs principales, headers, links activos, asiento seleccionado |
| `--color-accent`  | `#FF6B2B` | Naranja vibrante. Acentos, badges de promoción, estado "held", botón "Comprar"       |
| `--color-white`   | `#FFFFFF` | Fondo principal                                                                      |
| `--color-ink-900` | `#0A1330` | Texto principal (no negro puro: deriva del azul)                                     |
| `--color-ink-600` | `#4A5578` | Texto secundario                                                                     |
| `--color-ink-400` | `#9AA3BD` | Texto deshabilitado, placeholders                                                    |
| `--color-line`    | `#E6E9F2` | Bordes, divisores                                                                    |
| `--color-bg-soft` | `#F5F7FB` | Fondos de secciones, cards en reposo                                                 |
| `--color-success` | `#16A34A` | Asiento disponible, ticket válido                                                    |
| `--color-danger`  | `#DC2626` | Errores, ticket inválido, asiento bloqueado                                          |
| `--color-warning` | `#F59E0B` | Avisos, tiempo de hold por expirar                                                   |

**Gradiente de marca** (úsalo en hero y pantallas de éxito):
`linear-gradient(135deg, #1A3CFF 0%, #4B6CFF 50%, #FF6B2B 130%)`

**Reglas de uso del color:**

- Azul primario: dominante. Aparece en navegación, botones primarios, headers, focus rings.
- Naranja: úsalo como acento puntual, nunca como fondo de pantalla completa. Sirve para llamar la atención (timer del hold, CTA final de compra, confirmación).
- Blanco: fondo por defecto. Todo respira en blanco.
- **Contraste mínimo AA**: 4.5:1 para texto. Ya validados los pares arriba.

### 3.2 Tipografía

```
Display / titulares  →  Plus Jakarta Sans (700, 800)
Cuerpo / UI          →  Inter (400, 500, 600)
```

Carga vía `next/font` con `display: swap` y `subset: ['latin']`. **Solo los pesos que usamos**, no toda la familia. Esto ahorra ~80KB.

**Escala tipográfica mobile (rem, root = 16px):**

| Token          | Tamaño          | Line-height | Uso                      |
| -------------- | --------------- | ----------- | ------------------------ |
| `text-display` | 32px / 2rem     | 1.1         | Hero, pantallas de éxito |
| `text-h1`      | 24px / 1.5rem   | 1.2         | Título de pantalla       |
| `text-h2`      | 20px / 1.25rem  | 1.3         | Secciones                |
| `text-h3`      | 18px / 1.125rem | 1.35        | Cards                    |
| `text-body`    | 16px / 1rem     | 1.5         | Cuerpo por defecto       |
| `text-body-sm` | 14px / 0.875rem | 1.5         | Detalles, labels         |
| `text-caption` | 12px / 0.75rem  | 1.4         | Microtexto, timestamps   |

**Reglas:**

- **Nunca bajar de 14px en cuerpo en móvil.** 16px es el default.
- **Inputs siempre a 16px** (evita el zoom automático de iOS Safari al enfocar).
- Tracking ligeramente negativo en displays (`letter-spacing: -0.02em`).
- Números tabulares en precios y horarios (`font-variant-numeric: tabular-nums`).

### 3.3 Espaciado y grid

Sistema de 4px. Tokens Tailwind nativos (`p-1` = 4px, `p-2` = 8px, etc.).

**Container mobile:** 100% ancho con `padding: 16px` lateral. Nunca pegar contenido al borde.

**Safe area:** respetar `env(safe-area-inset-*)` para iPhones con notch y barras de gestos Android.

### 3.4 Componentes (estilo visual)

**Botones:**

- Altura mínima **48px** (touch target cómodo, sobre el 44px de Apple HIG).
- Border radius: 14px (suave, moderno, no excesivo).
- Botón primario: fondo `--color-primary`, texto blanco, sombra sutil (`0 4px 12px rgba(26,60,255,0.25)`).
- Botón secundario: fondo blanco, borde 1.5px `--color-line`, texto `--color-ink-900`.
- Botón de acento (compra final): fondo `--color-accent`, texto blanco.
- Estado `:active` con `scale(0.97)` y transición de 120ms.
- **Botón fijo inferior** (`sticky` bottom) en flujos de compra. Es el patrón estándar de apps nativas: el CTA siempre visible sin scrollear.

**Cards:**

- Fondo blanco, borde `1px --color-line`, radius `16px`, sombra `0 1px 3px rgba(10,19,48,0.04)`.
- En hover/press: elevar sombra a `0 4px 16px rgba(10,19,48,0.08)`.

**Inputs:**

- Altura 52px en móvil. Padding interno generoso.
- Label flotante o label arriba (no placeholder-as-label, dificulta accesibilidad).
- Focus ring de 3px en `--color-primary` con `opacity: 0.2`.
- Iconos a la izquierda para origen/destino (pin), fecha (calendario), pasajeros (persona).

**Bottom sheets:**

- Patrón principal para mostrar detalles, filtros, selectores en móvil. **Nunca modales centrados en móvil.**
- Animación: deslizar desde abajo con `spring` (Framer Motion).
- Backdrop con `backdrop-filter: blur(8px)` y opacidad 0.4.
- Drag-to-dismiss habilitado.

**Skeletons:**

- Reemplazan spinners genéricos. Forma de la card real con shimmer animado.
- Color base `--color-bg-soft`, brillo `--color-line` desplazándose en 1.4s.

### 3.5 Iconografía

Lucide React, peso `1.5px stroke`, tamaño base `20px` en UI y `24px` en tap targets aislados. Mantener consistencia: **un solo set en toda la app**.

---

## 4. Diseño mobile-first y sensación de app nativa

Esta es la sección más importante. Cada decisión aquí busca que el usuario sienta que abrió una app, no un sitio web.

### 4.1 Estructura de navegación

**No usamos navbar horizontal tradicional en móvil.** Patrón:

- **Header compacto (56px)** con logo a la izquierda y un icono de menú/perfil a la derecha. Fondo blanco con `backdrop-filter: blur(12px)` y borde inferior `1px --color-line`.
- **Header se oculta al hacer scroll hacia abajo, reaparece al scrollear hacia arriba** (patrón "hide on scroll", como Instagram/X). Implementar con un hook que escucha `scrollY` y aplica `translateY(-100%)` con transición de 250ms.
- **Bottom navigation con 4 ítems** solo en paneles internos (oficina, chofer, admin), no en flujo de cliente. Ítems: Inicio, Viajes, Boletos, Perfil. Altura 64px + safe area.
- **Flujo de compra del cliente: sin nav.** Solo botón "Atrás" arriba a la izquierda y CTA fijo abajo. Distrae menos = más conversión.

### 4.2 Transiciones entre pantallas

Implementadas con **Framer Motion** y la View Transitions API donde esté disponible.

| Transición        | Cuándo                      | Duración | Curva                                       |
| ----------------- | --------------------------- | -------- | ------------------------------------------- |
| Slide horizontal  | Avanzar/retroceder en flujo | 280ms    | `cubic-bezier(0.32, 0.72, 0, 1)` (iOS-like) |
| Fade + scale leve | Abrir bottom sheet          | 320ms    | `spring(stiffness: 300, damping: 30)`       |
| Shared element    | Card de viaje → detalle     | 400ms    | `spring`                                    |
| Crossfade         | Cambio de tab               | 180ms    | `ease-out`                                  |

**Regla:** ninguna transición pasa de 400ms. Más que eso se siente lento.

### 4.3 Microinteracciones

- **Asiento al tocarlo:** `scale(0.9)` en 80ms, luego se queda en `scale(1.05)` con halo azul y check animado dibujándose (path SVG, 200ms).
- **Botón primario al presionar:** ripple sutil desde el punto de toque + `scale(0.97)`.
- **Timer del hold:** anillo circular SVG que se vacía suavemente. Cambia a naranja a los 2 minutos restantes y pulsa al último minuto.
- **Confirmación de compra:** check verde grande que se dibuja, seguido de confetti sutil (Framer Motion + `lottie` ligero o canvas), QR aparece con `scale + fade-in`.
- **Pull-to-refresh** en listados con indicador propio (no el del navegador). Patrón nativo Android/iOS.

### 4.4 Pantallas de carga (loaders)

Tres niveles, nunca un spinner genérico de navegador:

1. **Splash inicial (PWA abierta desde icono):** fondo gradiente de marca + logo animado (path SVG dibujándose en 600ms). Dura lo que tarde el hydrate inicial.
2. **Skeleton screens:** para listados (resultados de búsqueda, lista de viajes en panel oficina). Imitan la forma del contenido real.
3. **Progress bar superior:** barra delgada de 2px en `--color-accent` que se ancla al top durante transiciones de ruta. Estilo NProgress.

### 4.5 Gestos

- **Swipe horizontal** en cards de viaje para acciones rápidas en panel oficina (editar / bloquear).
- **Swipe down** para cerrar bottom sheets.
- **Long press** sobre un asiento → tooltip con info (tipo, precio, número).
- **Pinch zoom** en el mapa de asientos para buses grandes (doble piso).

### 4.6 Feedback háptico

Usar la Vibration API en eventos clave:

- Selección de asiento: `navigator.vibrate(10)`.
- Confirmación de compra: `navigator.vibrate([30, 50, 30])`.
- Error (asiento no disponible): `navigator.vibrate([50, 100, 50])`.

Solo en Android (iOS Safari lo ignora, no rompe).

### 4.7 Detalles de PWA "app-like"

- **Manifest** con `display: standalone`, `theme_color: #1A3CFF`, `background_color: #FFFFFF`, íconos 192/512 y maskable.
- **iOS:** `apple-touch-icon`, `apple-mobile-web-app-status-bar-style: black-translucent`.
- **Install prompt** propio (no el del navegador) que aparece después de 2 visitas o de completar una compra exitosa. Bottom sheet amable con copy: "Agrega saliendo.ve a tu pantalla de inicio para comprar más rápido."
- **Splash screens** generadas para los principales tamaños iOS (hay generadores que producen las 30+ imágenes necesarias).
- **Status bar tematizada** vía `theme-color` meta tag (cambia con el modo claro/oscuro si lo implementamos).
- **Sin scroll bounce blanco en iOS:** `overscroll-behavior: none` en body y elementos clave.
- **Tap highlight removido:** `-webkit-tap-highlight-color: transparent` global, manejamos feedback nosotros.

### 4.8 Modo oscuro (opcional fase 2)

Reservar la arquitectura de tokens CSS para soportarlo. No bloqueante para la demo.

### 4.9 Accesibilidad mínima

- Touch targets ≥ 44px (idealmente 48px).
- Focus visible siempre (anillo azul de 3px).
- Roles ARIA en bottom sheets, modales, navegación.
- Soporte de teclado en todos los flujos (Tab, Enter, Esc).
- `prefers-reduced-motion`: respetar y desactivar animaciones grandes.

---

## 5. Modelo de datos (Supabase / Postgres)

Tablas principales (esquema lógico, no SQL):

- **`operators`** — líneas de transporte. Campos: id, name, logo_url, active.
- **`users`** — extiende `auth.users` de Supabase. Campos: id, role (`admin` | `operator_staff` | `driver` | `customer`), operator_id (nullable).
- **`routes`** — origen → destino. Campos: id, operator_id, origin_city, destination_city, distance_km, default_duration_min.
- **`buses`** — flota. Campos: id, operator_id, plate, layout_json (array de asientos con posición x/y, tipo, número), total_seats.
- **`trips`** — una salida concreta. Campos: id, route_id, bus_id, departure_at, arrival_at_estimated, price_usd, price_bs, amenities_json (AC, comida, wifi, baño, doble piso), status (`scheduled` | `boarding` | `departed` | `cancelled`).
- **`seats_status`** — estado por trip + asiento. Campos: trip_id, seat_number, status (`available` | `held` | `sold` | `blocked`), held_by, held_until, ticket_id. **PK compuesta (trip_id, seat_number).**
- **`tickets`** — boletos emitidos. Campos: id, trip_id, seat_number, passenger_name, passenger_id_doc, passenger_phone, qr_token (UUID v4 único), payment_method, sold_by_channel (`web` | `office`), sold_by_user, status (`active` | `boarded` | `cancelled` | `replaced`), replaced_by_ticket_id, created_at.
- **`payments`** — mock. Campos: id, ticket_id, method, amount, currency, status (`mock_paid`), metadata_json.
- **`audit_log`** — quién hizo qué. Campos: id, actor_user_id, action, entity_type, entity_id, before_json, after_json, created_at.

**Row Level Security (RLS):** activado en TODAS las tablas. Políticas:

- `customer` solo lee/escribe sus propios tickets.
- `operator_staff` lee/escribe solo dentro de su `operator_id`.
- `driver` solo lee tickets de los trips que tiene asignados hoy.
- `admin` lee todo.

---

## 6. Lógica crítica: bloqueo de asientos sin conflictos

Patrón estándar de la industria (lo usan Recorrido, Busbud, aerolíneas).

### 6.1 Flujo de hold

1. Usuario toca un asiento disponible.
2. Cliente llama RPC de Supabase: `hold_seat(trip_id, seat_number)`.
3. La función ejecuta atómicamente:
   ```
   UPDATE seats_status
   SET status='held', held_by=auth.uid(), held_until=now()+interval '10 minutes'
   WHERE trip_id=? AND seat_number=? AND status='available'
   ```
4. Si afecta 1 fila → éxito, devuelve `held_until`.
5. Si afecta 0 filas → otro usuario lo agarró primero. Devuelve error específico. UI muestra toast: "Ese asiento ya no está disponible" y refresca el mapa.

### 6.2 Realtime para sincronización

Cliente se suscribe a cambios de `seats_status` filtrado por `trip_id`:

```
supabase.channel('trip:'+id).on('postgres_changes', { filter }, ...)
```

Cualquier cambio (held, sold, blocked, released) se propaga a todos los clientes conectados (web cliente, web oficina, otras pestañas) en ~200ms. La UI repinta solo el asiento afectado, sin re-render del mapa completo.

### 6.3 Confirmación de compra (held → sold)

Al completar el flujo (datos + mock pago), llamar `confirm_ticket(trip_id, seat_number, passenger_data, payment_data, idempotency_key)`. La función:

1. Verifica que el asiento sigue `held` por el mismo `auth.uid()`.
2. Si la `idempotency_key` ya existe en `tickets`, devuelve el ticket existente (no duplica).
3. Genera `qr_token` (UUID v4).
4. Inserta en `tickets`, inserta en `payments`, actualiza `seats_status` a `sold` con `ticket_id`.
5. Todo en una transacción.

### 6.4 Liberación de holds expirados

Cron job en Supabase (`pg_cron`) cada 60 segundos:

```
UPDATE seats_status SET status='available', held_by=NULL, held_until=NULL
WHERE status='held' AND held_until < now()
```

Adicionalmente, las queries de lectura ya filtran lógicamente por `held_until > now()` para tratar holds caducados como disponibles incluso si el cron se atrasa.

### 6.5 Configuración

- **Tiempo de hold:** 10 minutos.
- **Aviso en UI:** anillo naranja a partir de los 2 minutos restantes.
- **Auto-extensión:** NO. Si se acaba, se acaba (evita abuso).

---

## 7. Resiliencia: cortes de luz e internet inestable

### 7.1 Service worker estratégico

- **Shell de la app** (HTML, CSS, JS principal): `CacheFirst` con revalidación.
- **API calls (Supabase):** `NetworkFirst` con timeout de 5 segundos, fallback a cache si existe.
- **Imágenes:** `StaleWhileRevalidate`.

### 7.2 Persistencia del flujo de compra

Cada paso del checkout (asiento seleccionado, datos del pasajero, método de pago) se guarda en IndexedDB con `idb-keyval` bajo una key tipo `checkout_draft_<trip_id>`. Al reabrir la app, si existe un draft válido (asiento aún en hold del usuario), se ofrece "Retomar compra".

### 7.3 Idempotency keys

Cada intento de `confirm_ticket` lleva un UUID generado en cliente y persistido localmente hasta que se confirma el éxito. Si la red se cae justo después de enviar, el reintento usa el mismo key y el backend devuelve el mismo resultado en lugar de duplicar.

### 7.4 Reintentos automáticos

TanStack Query configurado con:

- `retry: 3`
- `retryDelay: exponential backoff (1s, 2s, 4s)`
- `networkMode: 'offlineFirst'` donde aplique.

### 7.5 Indicador de estado de conexión

Banner superior delgado (3px) en rojo cuando se detecta offline, naranja en "reconectando", desaparece en online. Usa `navigator.onLine` + ping a Supabase cada 30s.

### 7.6 Modo offline del chofer (crítico)

Al iniciar turno, el chofer abre el trip y la app descarga el "manifiesto":

```json
{
  "trip_id": "...",
  "tickets": [
    { "qr_token": "...", "seat_number": 12, "passenger_name": "...", "status": "active" },
    ...
  ],
  "downloaded_at": "..."
}
```

Tamaño aproximado: 50-80KB para un bus de 50 asientos. Se guarda en IndexedDB.

El escaneo valida 100% local. Cuando hay red, sincroniza el campo `status: boarded` de vuelta al servidor (también con idempotency). Si nunca hay red, el chofer igual completó su trabajo y la sincronización ocurre al final del viaje.

---

## 8. Autenticación y roles

- **Cliente:** login con email + OTP (passwordless). Magic link / código de 6 dígitos.
- **Oficina y chofer:** código de operador + PIN de 6 dígitos. Más rápido que email para uso laboral diario. Implementado sobre Supabase Auth con identidades custom o email derivado.
- **Admin (yo):** email + OTP, con MFA habilitado.

Las sesiones se persisten con refresh tokens largos (Supabase los maneja). La PWA recuerda al usuario indefinidamente salvo logout explícito.

---

## 9. Los cuatro paneles — flujos detallados

### 9.1 Cliente (`/`)

1. **Home**: hero con gradiente de marca, formulario de búsqueda flotante (origen, destino, fecha, pasajeros).
2. **Resultados** (`/buscar`): lista de cards con operador, hora salida/llegada, duración, precio desde, amenidades como íconos. Filtros en bottom sheet (precio, hora, operador, AC, comida).
3. **Detalle del viaje + selección de asiento** (`/viaje/[id]`): mapa visual del bus, leyenda de colores, asientos tocables. Timer del hold cuando se selecciona.
4. **Datos del pasajero** (`/checkout/pasajero`): nombre, cédula, teléfono, email opcional. Auto-guardado en IndexedDB.
5. **Pago (mock)** (`/checkout/pago`): selector de método (Pago Móvil, Transferencia, Binance), pantalla simulada con botón "Marcar como pagado".
6. **Confirmación** (`/boleto/[id]`): animación de éxito, QR grande, datos del viaje, botón "Descargar PDF", botón "Compartir".

### 9.2 Oficina (`/oficina`)

- Bottom nav: Vender / Viajes / Validar / Perfil.
- **Vender**: mismo flujo que cliente pero con campos extra (efectivo, POS) y sin email obligatorio.
- **Viajes**: CRUD de trips. Crear nueva salida (ruta, bus, fecha/hora, precio, amenidades). Bloquear asientos dañados (estado permanente `blocked`).
- **Validar / Modificar boleto**: escanear QR → ver datos → opciones: confirmar identidad / cambiar asiento (libera el viejo, holdea el nuevo, regenera qr_token, marca el anterior como `replaced`) / cancelar.
- Todo cambio se registra en `audit_log`.

### 9.3 Chofer (`/chofer`)

- Una sola pantalla principal.
- Selector grande del trip de hoy (lista de los asignados).
- Botón gigante "Escanear QR" centrado.
- Al escanear: pantalla a full bleed verde (válido) o roja (inválido) por 1.5s con haptic + sonido, luego vuelve al escáner. Patrón de aerolínea/gate.
- Lista lateral oculta (swipe desde izquierda) con el manifiesto y check de quién ya abordó.

### 9.4 Admin (`/admin`)

- Dashboard con métricas: tickets vendidos hoy/semana/mes, ingresos por método de pago, ocupación promedio por ruta, top 5 rutas, top operadores.
- Gráficos ligeros con `recharts` (tree-shakeable).
- CRUD de operadores. Botón "Invitar staff" → genera link mágico con rol pre-asignado.
- Visor del `audit_log` con filtros.
- Exportar a CSV para reportes manuales.

---

## 10. Performance — presupuestos y técnicas

### 10.1 Presupuestos

| Métrica              | Objetivo |
| -------------------- | -------- |
| JS inicial (gzipped) | < 150KB  |
| LCP en 3G simulada   | < 2.5s   |
| TTI en 3G simulada   | < 4s     |
| CLS                  | < 0.05   |
| INP                  | < 200ms  |

### 10.2 Técnicas

- `next/image` con AVIF, `loading="lazy"`, `sizes` correcto.
- `next/font` con subsets.
- Dynamic imports para vistas pesadas (escáner QR, recharts, mapas de asientos grandes).
- Tree-shaking agresivo de Lucide (`import { X } from 'lucide-react'`).
- Tailwind con `content` bien acotado para JIT óptimo.
- No usar librerías de UI pesadas (NO MUI, NO Ant Design, NO Chakra).
- Prefetch de la siguiente pantalla del flujo cuando el usuario llega a una intermedia.
- Imágenes de operadores comprimidas a < 20KB cada una.

---

## 11. Pasos de desarrollo (roadmap por fases)

### Fase 0 — Setup (Día 1-2)

- Crear repo, configurar Next.js 15 + TS + Tailwind.
- Crear proyecto Supabase, conectar.
- Configurar `next-pwa`, manifest, íconos, splash.
- Definir tokens CSS (paleta, tipografía, espaciado) en `globals.css` y `tailwind.config.ts`.
- Cargar fuentes con `next/font`.
- Configurar ESLint, Prettier, lint-staged.
- Deploy inicial a Vercel.

### Fase 1 — Modelo de datos y auth (Día 3-4)

- Crear tablas en Supabase con SQL migrations versionadas en el repo.
- Definir RLS por tabla.
- Crear funciones RPC: `hold_seat`, `release_seat`, `confirm_ticket`, `validate_qr`, `replace_ticket`.
- Cron `pg_cron` para liberar holds.
- Configurar Supabase Auth (email OTP) y crear flujo de invitación para roles internos.
- Seed inicial: 2 operadores ficticios, 4 rutas, 6 trips, 3 buses.

### Fase 2 — Sistema de diseño y componentes base (Día 5-6)

- Crear `<Button>`, `<Input>`, `<Card>`, `<BottomSheet>`, `<Skeleton>`, `<Toast>`, `<Header>`, `<BottomNav>`.
- Configurar Framer Motion con presets de transición.
- Crear layouts: `layout.tsx` raíz, layout por sección.
- Construir el sistema de transiciones entre rutas.
- Configurar viewport, safe areas, tap highlights.
- Storybook ligero opcional (o página `/dev/ui` con todos los componentes).

### Fase 3 — Flujo del cliente (Día 7-10)

- Pantalla home con buscador.
- Resultados con filtros y skeleton.
- Detalle del viaje con mapa de asientos.
- Integración de `hold_seat` con Realtime.
- Timer del hold con anillo SVG animado.
- Captura de datos del pasajero (con persistencia IndexedDB).
- Mock de pago.
- Generación y visualización del QR.
- Descarga PDF del boleto.

### Fase 4 — Panel de oficina (Día 11-13)

- Login con código + PIN.
- Bottom nav.
- Flujo de venta (reusa componentes del cliente).
- CRUD de trips.
- Escaneo de QR con `@zxing/browser`.
- Vista de validación y edición de boleto.
- Audit log básico.

### Fase 5 — Panel del chofer (Día 14-15)

- Login.
- Selector de trip del día.
- Descarga del manifiesto a IndexedDB.
- Escáner con validación local.
- Sincronización diferida con backend.
- Indicador de estado de sincronización.

### Fase 6 — Panel de admin (Día 16-17)

- Dashboard con métricas (queries directas a Supabase o vistas materializadas).
- CRUD de operadores.
- Invitación de staff.
- Visor de audit log.
- Exportación CSV.

### Fase 7 — Resiliencia y pulido (Día 18-20)

- Configurar service worker con estrategias de caché.
- Idempotency keys end-to-end.
- Probar flujos offline (DevTools throttling + offline).
- Indicador de conexión.
- Microinteracciones finales (haptic, sonidos sutiles, confetti).
- Auditoría Lighthouse, ajustar lo que falle el presupuesto.
- Pruebas en dispositivos reales (Android gama media, iPhone).

### Fase 8 — Pruebas con el equipo (Día 21+)

- Sesiones de uso con los 3 miembros del equipo.
- Recolectar bugs y fricciones.
- Iterar.

---

## 12. Estructura de carpetas sugerida

```
saliendo-ve/
├── app/                          # Next.js App Router
│   ├── (cliente)/                # Rutas públicas
│   │   ├── page.tsx              # Home
│   │   ├── buscar/
│   │   ├── viaje/[id]/
│   │   ├── checkout/
│   │   └── boleto/[id]/
│   ├── oficina/
│   ├── chofer/
│   ├── admin/
│   ├── api/                      # Route handlers si hace falta
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # Botón, Input, Card, etc.
│   ├── seat-map/
│   ├── qr/
│   └── ...
├── lib/
│   ├── supabase/                 # Cliente, helpers
│   ├── hooks/
│   ├── store/                    # Zustand
│   └── utils/
├── public/
│   ├── icons/
│   └── splash/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

---

## 13. Decisiones documentadas (para que el equipo entienda el porqué)

| Decisión                                   | Alternativa descartada    | Razón                                                               |
| ------------------------------------------ | ------------------------- | ------------------------------------------------------------------- |
| Supabase sobre backend custom              | Express + Postgres propio | Auth, realtime, RLS y storage gratis. Cero plomería.                |
| Next.js sobre Vite + React                 | Vite SPA                  | SSR para SEO de rutas, edge functions cerca del usuario, mejor LCP. |
| PWA sobre app nativa (Expo/Flutter)        | App nativa                | Una sola codebase, instalable, suficiente para la sensación nativa. |
| Tailwind sobre styled-components           | CSS-in-JS                 | Bundle menor, mejor DX con LLMs, mobile-first nativo.               |
| TanStack Query sobre SWR                   | SWR                       | Mejor manejo de mutations e idempotency.                            |
| `@zxing/browser` sobre BarcodeDetector API | API nativa                | Soporte cross-browser, más estable en Android viejos.               |
| Hold de 10 min sobre 5 min                 | 5 min                     | VE tiene redes lentas. Margen necesario.                            |

---

## 14. Riesgos conocidos y mitigaciones

| Riesgo                            | Mitigación                                                                 |
| --------------------------------- | -------------------------------------------------------------------------- |
| Doble venta por race condition    | UPDATE atómico con cláusula `WHERE status='available'`                     |
| Doble cobro por reintento         | Idempotency keys en `confirm_ticket`                                       |
| Pérdida de datos por corte de luz | Persistencia IndexedDB del flujo                                           |
| Chofer sin internet en ruta       | Manifiesto descargado, validación local                                    |
| Hold expirado mientras paga       | Avisos de timer + auto-recovery si vuelve a tiempo                         |
| QR copiado/fotografiado           | qr_token único + status `boarded` después de escanear (no se puede reusar) |
| Bundle pesado en Android viejo    | Presupuestos estrictos, dynamic imports, no UI libs pesadas                |

---

## 15. Checklist final antes de demo al equipo

- [ ] Lighthouse mobile > 90 en Performance, Accessibility, Best Practices, PWA.
- [ ] Probado en Android 9+ (gama media real).
- [ ] Probado en iPhone (Safari iOS 15+).
- [ ] Probado con throttling "Slow 3G" en DevTools.
- [ ] Probado offline a mitad del checkout.
- [ ] Probado dos usuarios seleccionando el mismo asiento simultáneamente.
- [ ] Audit log registra todas las modificaciones.
- [ ] Roles funcionan: chofer no puede vender, oficina no ve métricas del admin.
- [ ] PWA instalable desde el ícono de Chrome y Safari.
- [ ] Splash screen visible al abrir desde el ícono.

---

## 16. Recursos y referencias

- recorrido.cl — referencia funcional principal.
- Busbud, Pluxee, Redbus — patrones de selección de asientos.
- Apple HIG y Material Design 3 — referencias de gestos y touch targets.
- web.dev/pwa — guía de PWA moderna.
- Supabase docs — RLS, Realtime, RPCs.

---

**Última actualización:** este documento debe evolucionar con el proyecto. Si una decisión cambia, se actualiza acá antes de tocar código.
