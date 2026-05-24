'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useMemo } from 'react'
import type { TripWithOperator, TripAmenitiesJson } from '@/types/database'

export interface TripFilters {
  originCity?: string
  destinationCity?: string
  date?: string // Formato YYYY-MM-DD
  minPrice?: number
  maxPrice?: number
  departureTimeOfDay?: 'morning' | 'afternoon' | 'night'
  operatorId?: string
  wifi?: boolean
  ac?: boolean
  usb?: boolean
  toilet?: boolean
  snacks?: boolean
}

/**
 * Hook para buscar y filtrar viajes activos con TanStack Query y Supabase.
 * Realiza búsqueda inicial en el servidor por origen, destino y fecha,
 * y luego aplica filtros reactivos en el cliente para máxima velocidad sin re-renders.
 */
export function useTrips(filters: TripFilters = {}) {
  const supabase = createClient()

  // Filtros del lado del servidor (para evitar transferir datos innecesarios)
  const serverOrigin = filters.originCity?.trim()
  const serverDestination = filters.destinationCity?.trim()
  const serverDate = filters.date // YYYY-MM-DD

  const queryKey = ['trips', serverOrigin, serverDestination, serverDate]

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<TripWithOperator[]> => {
      let q = supabase
        .from('trips_with_operator')
        .select('*')
        .eq('trip_status', 'scheduled')

      if (serverOrigin) {
        q = q.ilike('origin_city', `%${serverOrigin}%`)
      }
      if (serverDestination) {
        q = q.ilike('destination_city', `%${serverDestination}%`)
      }
      if (serverDate) {
        // departure_at es un timestamp con zona horaria (ISO 8601).
        // Filtramos viajes que salgan dentro de ese día local (de 00:00:00 a 23:59:59.999)
        const startDate = `${serverDate}T00:00:00`
        const endDate = `${serverDate}T23:59:59.999`
        q = q.gte('departure_at', startDate).lte('departure_at', endDate)
      }

      // Ordenar por hora de salida de forma predeterminada
      q = q.order('departure_at', { ascending: true })

      const { data, error } = await q
      if (error) {
        console.error('Error fetching trips:', error)
        throw new Error(error.message || 'Error al obtener viajes')
      }

      return (data as TripWithOperator[]) || []
    },
  })

  // Filtrado reactivo en memoria (cliente) para sliders y checkboxes interactivos
  const filteredTrips = useMemo(() => {
    if (!query.data) return []

    return query.data.filter((trip) => {
      // 1. Rango de precios USD
      if (trip.price_usd !== null && trip.price_usd !== undefined) {
        if (filters.minPrice !== undefined && trip.price_usd < filters.minPrice) return false
        if (filters.maxPrice !== undefined && trip.price_usd > filters.maxPrice) return false
      }

      // 2. Operador específico
      if (filters.operatorId && trip.operator_id !== filters.operatorId) return false

      // 3. Rango de hora de salida
      if (filters.departureTimeOfDay && trip.departure_at) {
        const departureDate = new Date(trip.departure_at)
        const hour = departureDate.getHours()
        
        if (filters.departureTimeOfDay === 'morning' && (hour < 6 || hour >= 12)) return false
        if (filters.departureTimeOfDay === 'afternoon' && (hour < 12 || hour >= 18)) return false
        if (filters.departureTimeOfDay === 'night' && hour >= 18 && hour < 6) {
          // Cubre el período de 18:00 a 05:59
        }
        if (filters.departureTimeOfDay === 'night') {
          const isNight = hour >= 18 || hour < 6
          if (!isNight) return false
        }
      }

      // 4. Amenidades requeridas (si el filtro es true, el viaje debe poseerla)
      if (trip.amenities_json) {
        // En base de datos se guarda como Json, lo casteamos a nuestra interfaz
        const amenities = trip.amenities_json as unknown as TripAmenitiesJson
        if (filters.wifi && !amenities.wifi) return false
        if (filters.ac && !amenities.ac) return false
        if (filters.usb && !amenities.usb) return false
        if (filters.toilet && !amenities.toilet) return false
        if (filters.snacks && !amenities.snacks) return false
      } else {
        // Si no tiene amenidades y se requiere alguna, se excluye
        if (filters.wifi || filters.ac || filters.usb || filters.toilet || filters.snacks) return false
      }

      return true
    })
  }, [query.data, filters])

  return {
    ...query,
    trips: filteredTrips,
  }
}

/**
 * Hook para obtener la lista única de ciudades origen y destino
 * para autocompletado en el formulario de búsqueda inicial.
 */
export function useSearchCities() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['search_cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips_with_operator')
        .select('origin_city, destination_city')
        .eq('trip_status', 'scheduled')

      if (error) {
        console.error('Error fetching search cities:', error)
        throw new Error(error.message || 'Error al obtener ciudades de búsqueda')
      }

      const origins = new Set<string>()
      const destinations = new Set<string>()

      data?.forEach((row) => {
        if (row.origin_city) origins.add(row.origin_city.trim())
        if (row.destination_city) destinations.add(row.destination_city.trim())
      })

      return {
        origins: Array.from(origins).sort((a, b) => a.localeCompare(b)),
        destinations: Array.from(destinations).sort((a, b) => a.localeCompare(b)),
      }
    },
    staleTime: 5 * 60 * 1000, // Datos frescos por 5 minutos
  })
}

/**
 * Hook para obtener los operadores con salidas programadas.
 * Útil para poblar los filtros de operadores de manera dinámica.
 */
export function useTripOperators() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['trip_operators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips_with_operator')
        .select('operator_id, operator_name, operator_logo_url')
        .eq('trip_status', 'scheduled')

      if (error) {
        console.error('Error fetching trip operators:', error)
        throw new Error(error.message || 'Error al obtener operadores')
      }

      const operatorsMap = new Map<string, { id: string; name: string; logoUrl: string | null }>()
      
      data?.forEach((row) => {
        if (row.operator_id && row.operator_name) {
          operatorsMap.set(row.operator_id, {
            id: row.operator_id,
            name: row.operator_name.trim(),
            logoUrl: row.operator_logo_url,
          })
        }
      })

      return Array.from(operatorsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    },
    staleTime: 10 * 60 * 1000, // Datos frescos por 10 minutos
  })
}
