'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SeatStatusRow, BusLayoutJson, SeatMapEntry } from '@/types/database'

/**
 * Hook para gestionar el mapa de asientos del autobús y su estado en tiempo real.
 * Permite bloquear (hold) y liberar (release) asientos con atomicidad.
 * 
 * @param tripId - El ID del viaje activo.
 * @param currentUserId - El ID del usuario actual autenticado (opcional, para determinar si él posee el hold).
 */
export function useSeats(tripId: string, currentUserId?: string | null) {
  const supabase = createClient()

  const [layout, setLayout] = useState<BusLayoutJson | null>(null)
  const [seats, setSeats] = useState<Map<string, SeatStatusRow>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carga inicial de datos: layout del bus y estado de asientos
  const fetchSeatMapAndLayout = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Obtener la información del viaje y el layout de su bus asignado
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select(`
          bus_id,
          buses (
            layout_json
          )
        `)
        .eq('id', tripId)
        .single()

      if (tripError) throw tripError
      
      const busLayout = tripData?.buses?.layout_json as unknown as BusLayoutJson
      if (busLayout) {
        setLayout(busLayout)
      } else {
        throw new Error('No se pudo encontrar el layout del autobús asignado.')
      }

      // 2. Obtener el estado actual de los asientos de seats_status
      const { data: seatsData, error: seatsError } = await supabase
        .from('seats_status')
        .select('*')
        .eq('trip_id', tripId)

      if (seatsError) throw seatsError

      const seatMap = new Map<string, SeatStatusRow>()
      seatsData?.forEach((seat) => {
        seatMap.set(seat.seat_number, seat)
      })
      setSeats(seatMap)
    } catch (err: any) {
      console.error('Error in fetchSeatMapAndLayout:', err)
      setError(err.message || 'Error al cargar el mapa de asientos')
    } finally {
      setLoading(false)
    }
  }, [supabase, tripId])

  // Inicializar carga y suscripción en tiempo real filtrada por trip_id
  useEffect(() => {
    fetchSeatMapAndLayout()

    // Suscribirse únicamente a cambios en la tabla seats_status para ESTE viaje
    const channel = supabase
      .channel(`seats_status_trip:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seats_status',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          const updatedSeat = payload.new as SeatStatusRow
          const deletedSeat = payload.old as Partial<SeatStatusRow>

          // Actualización de estado atómica y dirigida para evitar re-renders masivos
          setSeats((prevSeats) => {
            const nextSeats = new Map(prevSeats)
            if (payload.eventType === 'DELETE' && deletedSeat.seat_number) {
              nextSeats.delete(deletedSeat.seat_number)
            } else if (updatedSeat && updatedSeat.seat_number) {
              nextSeats.set(updatedSeat.seat_number, updatedSeat)
            }
            return nextSeats
          })
        }
      )
      .subscribe()

    // Limpieza de canal al desmontar el componente o cambiar tripId
    return () => {
      channel.unsubscribe()
    }
  }, [supabase, tripId, fetchSeatMapAndLayout])

  // Garantiza que haya una sesión activa (anónima si es necesario)
  const ensureSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('[useSeats] No session — signing in anonymously...')
      const { error } = await supabase.auth.signInAnonymously()
      if (error) throw new Error('No se pudo establecer sesión. Intenta recargar la página.')
    }
  }

  // Reserva atómica de un asiento (RPC hold_seat)
  const holdSeat = useCallback(async (seatNumber: string) => {
    setError(null)
    try {
      // Garantizar sesión activa antes de llamar el RPC
      await ensureSession()

      const { data, error: rpcError } = await supabase.rpc('hold_seat', {
        p_seat_number: seatNumber,
        p_trip_id: tripId,
      })

      if (rpcError) throw rpcError

      // Actualización optimista del estado local
      const { data: { session } } = await supabase.auth.getSession()
      setSeats((prev) => {
        const next = new Map(prev)
        const currentSeat = next.get(seatNumber)
        if (currentSeat) {
          next.set(seatNumber, {
            ...currentSeat,
            status: 'held',
            held_by: session?.user?.id ?? null,
            held_until: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          })
        }
        return next
      })

      return { success: true, result: data }
    } catch (err: any) {
      console.error('Error holding seat:', err)
      const friendlyMessage = err.message || 'El asiento ya no está disponible.'
      setError(friendlyMessage)
      return { success: false, error: friendlyMessage }
    }
  }, [supabase, tripId])

  // Liberación atómica de un asiento (RPC release_seat)
  const releaseSeat = useCallback(async (seatNumber: string) => {
    setError(null)
    try {
      const { data, error: rpcError } = await supabase.rpc('release_seat', {
        p_seat_number: seatNumber,
        p_trip_id: tripId,
      })

      if (rpcError) throw rpcError

      // Actualización optimista del estado local
      setSeats((prev) => {
        const next = new Map(prev)
        const currentSeat = next.get(seatNumber)
        if (currentSeat) {
          next.set(seatNumber, {
            ...currentSeat,
            status: 'available',
            held_by: null,
            held_until: null,
          })
        }
        return next
      })

      return { success: true, result: data }
    } catch (err: any) {
      console.error('Error releasing seat:', err)
      const friendlyMessage = err.message || 'Error al liberar el asiento.'
      setError(friendlyMessage)
      return { success: false, error: friendlyMessage }
    }
  }, [supabase, tripId])

  // Mapeo unificado de posiciones geométricas y estados de ocupación (SeatMapEntry)
  const seatMapEntries = useMemo((): SeatMapEntry[] => {
    if (!layout?.seats) return []

    return layout.seats.map((seatPos) => {
      const statusRow = seats.get(seatPos.number)
      
      const status = statusRow?.status || 'available'
      const isHeldByCurrentUser = !!(
        status === 'held' &&
        statusRow?.held_by &&
        currentUserId &&
        statusRow.held_by === currentUserId
      )

      return {
        seat: seatPos,
        status,
        isHeldByCurrentUser,
      }
    })
  }, [layout, seats, currentUserId])

  return {
    layout,
    seats,
    seatMapEntries,
    loading,
    error,
    holdSeat,
    releaseSeat,
    refetch: fetchSeatMapAndLayout,
  }
}
