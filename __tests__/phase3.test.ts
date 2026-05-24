import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import crypto from 'crypto'

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno en .env.local')
}

// Función para obtener una instancia limpia del cliente Service Role (Bypass RLS)
const getAdminClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

describe('Pruebas de la Fase 3 - Compra y Reserva de Asientos', () => {
  let userAId: string
  let userBId: string
  let userAToken: string
  let userBToken: string
  
  const tripId = 'dddddddd-0001-0001-0001-000000000001' // Trip 1 del seed
  const seatNumber = '1A'

  // Función para obtener cliente para un usuario específico mediante token JWT
  const getClientForUser = (jwt: string) => {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    })
  }

  beforeAll(async () => {
    const admin = getAdminClient()
    
    // 1. Crear dos usuarios temporales de prueba en auth.users
    const emailA = `test.user.a.${Date.now()}@saliendo.ve`
    const emailB = `test.user.b.${Date.now()}@saliendo.ve`
    const password = 'TestPassword123!'

    const { data: dataA, error: errA } = await admin.auth.admin.createUser({
      email: emailA,
      password: password,
      email_confirm: true,
    })
    if (errA || !dataA.user) throw new Error(`Error creando Usuario A: ${errA?.message}`)
    userAId = dataA.user.id

    const { data: dataB, error: errB } = await admin.auth.admin.createUser({
      email: emailB,
      password: password,
      email_confirm: true,
    })
    if (errB || !dataB.user) throw new Error(`Error creando Usuario B: ${errB?.message}`)
    userBId = dataB.user.id

    // 2. Iniciar sesión con clientes temporales dedicados para NO contaminar el service role client
    const clientTempA = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    const { data: loginA, error: logErrA } = await clientTempA.auth.signInWithPassword({
      email: emailA,
      password: password,
    })
    if (logErrA || !loginA.session) throw new Error(`Error login Usuario A: ${logErrA?.message}`)
    userAToken = loginA.session.access_token

    const clientTempB = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    const { data: loginB, error: logErrB } = await clientTempB.auth.signInWithPassword({
      email: emailB,
      password: password,
    })
    if (logErrB || !loginB.session) throw new Error(`Error login Usuario B: ${logErrB?.message}`)
    userBToken = loginB.session.access_token
  })

  afterAll(async () => {
    const admin = getAdminClient()

    // Limpieza: eliminar usuarios de prueba creados
    if (userAId) {
      await admin.auth.admin.deleteUser(userAId)
    }
    if (userBId) {
      await admin.auth.admin.deleteUser(userBId)
    }
    
    // Restaurar asiento a disponible
    await admin
      .from('seats_status')
      .update({
        status: 'available',
        held_by: null,
        held_until: null,
        ticket_id: null,
      })
      .match({ trip_id: tripId, seat_number: seatNumber })
  })

  beforeEach(async () => {
    const admin = getAdminClient()

    // Antes de cada test, asegurarse de que el asiento esté disponible y limpio
    const { error } = await admin
      .from('seats_status')
      .update({
        status: 'available',
        held_by: null,
        held_until: null,
        ticket_id: null,
      })
      .match({ trip_id: tripId, seat_number: seatNumber })

    if (error) {
      console.error('Error in beforeEach resetting seat:', error)
    }
  })

  it('CASO 1 — Carrera de Asientos (Concurrencia)', async () => {
    const clientA = getClientForUser(userAToken)
    const clientB = getClientForUser(userBToken)

    // Lanzar concurrentemente la solicitud de reserva para el mismo asiento y viaje
    const results = await Promise.all([
      clientA.rpc('hold_seat', { p_trip_id: tripId, p_seat_number: seatNumber }),
      clientB.rpc('hold_seat', { p_trip_id: tripId, p_seat_number: seatNumber })
    ])

    const successRes = results.filter(r => r.error === null)
    const errorRes = results.filter(r => r.error !== null)

    // Validar que exactamente uno tenga éxito y exactamente uno falle
    expect(successRes).toHaveLength(1)
    expect(errorRes).toHaveLength(1)

    // Validar que el error específico sea SEAT_NOT_AVAILABLE
    const failedRpc = errorRes[0]
    expect(failedRpc.error?.message).toContain('SEAT_NOT_AVAILABLE')

    // Verificar en la base de datos a quién pertenece el hold final
    const admin = getAdminClient()
    const { data: finalSeat, error: fetchErr } = await admin
      .from('seats_status')
      .select('*')
      .match({ trip_id: tripId, seat_number: seatNumber })
      .single()

    expect(fetchErr).toBeNull()
    expect(finalSeat?.status).toBe('held')
    expect([userAId, userBId]).toContain(finalSeat?.held_by)
  })

  it('CASO 2 — Corte de Red y Energía (Idempotencia)', async () => {
    const clientA = getClientForUser(userAToken)

    // 1. Primero, el usuario A reserva el asiento
    const { data: holdData, error: holdErr } = await clientA.rpc('hold_seat', {
      p_trip_id: tripId,
      p_seat_number: seatNumber
    })
    expect(holdErr).toBeNull()
    expect(holdData).toBeDefined()

    // 2. Definir parámetros de confirmación (usando el enum correcto 'transfer_bs')
    const idempotencyKey = crypto.randomUUID()
    const passengerData = {
      passenger_name: 'Ana Gomez',
      passenger_id_number: 'V-12345678'
    }
    const paymentData = {
      method: 'transfer_bs',
      amount_bs: 1800.00,
      exchange_rate_bcv: 40.00
    }

    // 3. Primera confirmación
    const { data: confirm1, error: err1 } = await clientA.rpc('confirm_ticket', {
      p_trip_id: tripId,
      p_seat_number: seatNumber,
      p_passenger_data: passengerData,
      p_payment_data: paymentData,
      p_idempotency_key: idempotencyKey
    })

    expect(err1).toBeNull()
    expect(confirm1.idempotent).toBe(false)
    expect(confirm1.ticket).toBeDefined()
    expect(confirm1.ticket.id).toBe(idempotencyKey)

    // 4. Segunda confirmación (reintento debido a supuesto corte de red)
    const { data: confirm2, error: err2 } = await clientA.rpc('confirm_ticket', {
      p_trip_id: tripId,
      p_seat_number: seatNumber,
      p_passenger_data: passengerData,
      p_payment_data: paymentData,
      p_idempotency_key: idempotencyKey
    })

    expect(err2).toBeNull()
    expect(confirm2.idempotent).toBe(true) // Debe indicar que es una respuesta idempotente
    expect(confirm2.ticket).toBeDefined()
    expect(confirm2.ticket.id).toBe(idempotencyKey)

    // 5. Validar en base de datos que no haya registros duplicados
    const admin = getAdminClient()
    const { data: ticketCount } = await admin
      .from('tickets')
      .select('id', { count: 'exact' })
      .eq('id', idempotencyKey)

    expect(ticketCount).toHaveLength(1)

    // Limpieza específica para el ticket creado
    await admin.from('payments').delete().eq('ticket_id', idempotencyKey)
    await admin.from('tickets').delete().eq('id', idempotencyKey)
  })

  it('CASO 3 — Expiración de Holds', async () => {
    const clientA = getClientForUser(userAToken)
    const clientB = getClientForUser(userBToken)

    // 1. El Usuario A adquiere un hold
    const { data: holdData, error: holdErr } = await clientA.rpc('hold_seat', {
      p_trip_id: tripId,
      p_seat_number: seatNumber
    })
    expect(holdErr).toBeNull()
    expect(holdData).toBeDefined()

    // 2. Modificar la base de datos para que el hold del Usuario A aparezca como EXPIRADO físicamente
    const admin = getAdminClient()
    const pastTime = new Date(Date.now() - 5000).toISOString() // 5 segundos en el pasado
    const { error: updateErr } = await admin
      .from('seats_status')
      .update({ held_until: pastTime })
      .match({ trip_id: tripId, seat_number: seatNumber })

    expect(updateErr).toBeNull()

    // 3. El Usuario B intenta reservar el mismo asiento.
    // Lógicamente, dado que el hold ya expiró, el asiento debería estar libre y permitir el hold del Usuario B.
    const { data: holdBData, error: holdBErr } = await clientB.rpc('hold_seat', {
      p_trip_id: tripId,
      p_seat_number: seatNumber
    })

    // Validar si el RPC hold_seat manejó correctamente la expiración
    console.log('hold_seat para hold expirado - Data:', holdBData, 'Error:', holdBErr)
    
    // Si la función hold_seat no maneja la expiración de forma en línea, fallará aquí porque el estado sigue siendo 'held'.
    expect(holdBErr).toBeNull()
    expect(holdBData).toBeDefined()

    // Verificar en base de datos que el nuevo dueño sea el Usuario B
    const { data: finalSeat } = await admin
      .from('seats_status')
      .select('*')
      .match({ trip_id: tripId, seat_number: seatNumber })
      .single()

    expect(finalSeat?.status).toBe('held')
    expect(finalSeat?.held_by).toBe(userBId)
  })
})
