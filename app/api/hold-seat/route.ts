import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Cliente con service role — bypass total de RLS
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { tripId, seatNumber, sessionId } = await req.json()

    if (!tripId || !seatNumber || !sessionId) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    // 1. Validar que el viaje existe y acepta reservas
    const { data: trip, error: tripError } = await supabaseAdmin
      .from('trips')
      .select('id, status')
      .eq('id', tripId)
      .in('status', ['scheduled', 'boarding'])
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'El viaje no está disponible' }, { status: 400 })
    }

    // 2. Liberar hold expirado en este asiento
    await supabaseAdmin
      .from('seats_status')
      .update({ status: 'available', held_by: null, held_until: null })
      .eq('trip_id', tripId)
      .eq('seat_number', seatNumber)
      .eq('status', 'held')
      .lt('held_until', new Date().toISOString())

    // 3. Liberar hold previo de ESTA sesión en este viaje
    await supabaseAdmin
      .from('seats_status')
      .update({ status: 'available', held_by: null, held_until: null })
      .eq('trip_id', tripId)
      .eq('held_by', sessionId)
      .eq('status', 'held')

    // 4. Intentar adquirir el hold atómicamente
    const heldUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { data: held, error: holdError } = await supabaseAdmin
      .from('seats_status')
      .update({
        status: 'held',
        held_by: sessionId,
        held_until: heldUntil,
      })
      .eq('trip_id', tripId)
      .eq('seat_number', seatNumber)
      .eq('status', 'available')
      .select()

    if (holdError) {
      console.error('[hold-seat] Error updating seat:', holdError)
      return NextResponse.json({ error: 'Error al reservar el asiento' }, { status: 500 })
    }

    if (!held || held.length === 0) {
      return NextResponse.json(
        { error: 'El asiento ya está reservado. Selecciona otro.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ heldUntil })
  } catch (err: any) {
    console.error('[hold-seat] Unexpected error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
