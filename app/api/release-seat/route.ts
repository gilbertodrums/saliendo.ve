import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

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

    const { error } = await supabaseAdmin
      .from('seats_status')
      .update({ status: 'available', held_by: null, held_until: null })
      .eq('trip_id', tripId)
      .eq('seat_number', seatNumber)
      .eq('held_by', sessionId)
      .eq('status', 'held')

    if (error) {
      return NextResponse.json({ error: 'Error al liberar el asiento' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[release-seat] Unexpected error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
