import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tripId = searchParams.get('tripId')

  if (!tripId) {
    return NextResponse.json({ error: 'tripId requerido' }, { status: 400 })
  }

  try {
    // Obtener el viaje con su bus y layout
    const { data: tripData, error: tripError } = await supabaseAdmin
      .from('trips')
      .select(`
        id,
        bus_id,
        buses (
          layout_json,
          total_seats,
          brand,
          model
        )
      `)
      .eq('id', tripId)
      .single()

    if (tripError || !tripData) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
    }

    // Obtener el estado de todos los asientos de este viaje
    const { data: seatsData, error: seatsError } = await supabaseAdmin
      .from('seats_status')
      .select('*')
      .eq('trip_id', tripId)

    if (seatsError) {
      return NextResponse.json({ error: 'Error al obtener asientos' }, { status: 500 })
    }

    return NextResponse.json({
      trip: tripData,
      seats: seatsData || [],
    })
  } catch (err: any) {
    console.error('[seat-map] Unexpected error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
