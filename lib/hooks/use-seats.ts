'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SeatStatusRow, BusLayoutJson, SeatMapEntry, SeatPosition } from '@/types/database'

// Obtiene o genera el sessionId persistente del usuario (no requiere auth)
function getSessionId(): string {
  if (typeof window === 'undefined') return crypto.randomUUID()
  const stored = localStorage.getItem('saliendo_session_id')
  if (stored) return stored
  const newId = crypto.randomUUID()
  localStorage.setItem('saliendo_session_id', newId)
  return newId
}

export function useSeats(tripId: string, currentUserId?: string | null) {
  const supabase = createClient()
  const sessionId = useRef<string>('')

  // Inicializar sessionId solo en cliente
  useEffect(() => {
    sessionId.current = getSessionId()
  }, [])

  const [layout, setLayout] = useState<BusLayoutJson | null>(null)
  const [seats, setSeats] = useState<Map<string, SeatStatusRow>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carga inicial via API route (sin auth requerida, usa service role en servidor)
  const fetchSeatMapAndLayout = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/seat-map?tripId=${tripId}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Error al cargar el mapa de asientos')
      }

      const { trip, seats: seatsData } = await res.json()

      const busLayout = trip?.buses?.layout_json as unknown as BusLayoutJson
      if (!busLayout) throw new Error('No se pudo encontrar el layout del autobús asignado.')
      setLayout(busLayout)

      const seatMap = new Map<string, SeatStatusRow>()
      seatsData?.forEach((seat: SeatStatusRow) => {
        seatMap.set(seat.seat_number, seat)
      })
      setSeats(seatMap)
    } catch (err: any) {
      console.error('Error in fetchSeatMapAndLayout:', err)
      setError(err.message || 'Error al cargar el mapa de asientos')
    } finally {
      setLoading(false)
    }
  }, [tripId])

  // Inicializar carga y suscripción en tiempo real
  useEffect(() => {
    fetchSeatMapAndLayout()

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

    return () => {
      channel.unsubscribe()
    }
  }, [supabase, tripId, fetchSeatMapAndLayout])

  // Reserva atómica via API route — SIN requerir auth del cliente
  const holdSeat = useCallback(async (seatNumber: string) => {
    setError(null)
    try {
      const sid = sessionId.current || getSessionId()
      const res = await fetch('/api/hold-seat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          seatNumber,
          sessionId: sid,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'El asiento ya no está disponible.')
      }

      // Actualización optimista del estado local
      setSeats((prev) => {
        const next = new Map(prev)
        const currentSeat = next.get(seatNumber)
        if (currentSeat) {
          next.set(seatNumber, {
            ...currentSeat,
            status: 'held',
            held_by: sid,
            held_until: data.heldUntil,
          })
        }
        return next
      })

      return { success: true, result: data.heldUntil }
    } catch (err: any) {
      console.error('Error holding seat:', err)
      const friendlyMessage = err.message || 'El asiento ya no está disponible.'
      setError(friendlyMessage)
      return { success: false, error: friendlyMessage }
    }
  }, [tripId])

  // Liberación via API route
  const releaseSeat = useCallback(async (seatNumber: string) => {
    setError(null)
    try {
      const sid = sessionId.current || getSessionId()
      const res = await fetch('/api/release-seat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          seatNumber,
          sessionId: sid,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al liberar el asiento.')

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

      return { success: true }
    } catch (err: any) {
      console.error('Error releasing seat:', err)
      const friendlyMessage = err.message || 'Error al liberar el asiento.'
      setError(friendlyMessage)
      return { success: false, error: friendlyMessage }
    }
  }, [tripId])

  // Mapa de asientos en el formato SeatMapEntry que espera el componente
  const seatMapEntries = useMemo((): SeatMapEntry[] => {
    if (!layout) return []

    return layout.seats.map((seatPos: SeatPosition) => {
      const seatData = seats.get(seatPos.number)
      const sid = sessionId.current

      // Un asiento es "mío" si lo tiene en hold mi sessionId o el currentUserId auth
      const isHeldByCurrentUser =
        (!!sid && seatData?.held_by === sid) ||
        (!!currentUserId && seatData?.held_by === currentUserId)

      return {
        seat: seatPos,
        status: seatData?.status ?? 'available',
        isHeldByCurrentUser: !!isHeldByCurrentUser,
      } satisfies SeatMapEntry
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
    getSessionId: () => sessionId.current || getSessionId(),
  }
}
