'use client'

import { create } from 'zustand'
import { get, set, del } from 'idb-keyval'
import type { TripWithOperator } from '@/types/database'

export interface PassengerData {
  fullName: string
  idNumber: string // Formato venezolano: V-12345678 o E-12345678
  phone: string
  email: string
}

export interface CheckoutState {
  tripId: string | null
  trip: TripWithOperator | null
  selectedSeat: string | null
  passenger: PassengerData | null
  paymentMethod: string | null // 'cash_bs' | 'cash_usd' | 'transfer_bs' | 'mock_card'
  holdUntil: string | null // ISO timestamp de cuándo expira la retención del asiento
  idempotencyKey: string | null // UUID generado en cliente para evitar doble compra
  loadingDraft: boolean
  error: string | null

  // Acciones de Estado
  initCheckout: (tripId: string, trip: TripWithOperator) => Promise<void>
  selectSeat: (seatNumber: string, holdDurationMinutes?: number) => Promise<void>
  updatePassenger: (passenger: PassengerData) => Promise<void>
  setPaymentMethod: (method: string) => Promise<void>
  clearCheckout: () => Promise<void>
  loadDraftFromStorage: (tripId: string) => Promise<boolean>
}

// Generador de UUID v4 compatible con navegadores antiguos y modernos
const generateUUID = (): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID()
  }
  // Algoritmo fallback seguro
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Almacén Zustand para el flujo coordinado de checkout del cliente.
 * Persiste los borradores de compra en IndexedDB (a través de idb-keyval) de manera reactiva.
 * Esto asegura resiliencia total frente a cortes eléctricos o pérdidas de conexión en Venezuela.
 */
export const useCheckout = create<CheckoutState>((setStore, getStore) => ({
  tripId: null,
  trip: null,
  selectedSeat: null,
  passenger: null,
  paymentMethod: null,
  holdUntil: null,
  idempotencyKey: null,
  loadingDraft: false,
  error: null,

  // Inicializa el checkout cargando el borrador persistente si no ha expirado
  initCheckout: async (tripId: string, trip: TripWithOperator) => {
    setStore({ loadingDraft: true, error: null })
    try {
      const draftKey = `saliendo_checkout_draft_${tripId}`
      const draft = await get(draftKey)

      if (draft) {
        // Verificar si el hold ya expiró (en base a la fecha/hora actual del cliente)
        const isExpired = draft.holdUntil ? new Date(draft.holdUntil).getTime() < Date.now() : true
        
        if (!isExpired) {
          // El hold sigue activo: restauramos el borrador completo para continuar la compra
          setStore({
            tripId,
            trip,
            selectedSeat: draft.selectedSeat,
            passenger: draft.passenger,
            paymentMethod: draft.paymentMethod,
            holdUntil: draft.holdUntil,
            idempotencyKey: draft.idempotencyKey,
            loadingDraft: false,
          })
          return
        } else {
          // Borrador expirado en base de datos local: lo limpiamos de forma proactiva
          await del(draftKey)
        }
      }

      // Si no hay borrador o ya expiró, inicializamos un estado limpio
      setStore({
        tripId,
        trip,
        selectedSeat: null,
        passenger: null,
        paymentMethod: null,
        holdUntil: null,
        idempotencyKey: generateUUID(), // Generamos clave de idempotencia atómica
        loadingDraft: false,
      })
    } catch (err: any) {
      console.error('Error al inicializar checkout store:', err)
      setStore({
        tripId,
        trip,
        selectedSeat: null,
        passenger: null,
        paymentMethod: null,
        holdUntil: null,
        idempotencyKey: generateUUID(),
        loadingDraft: false,
        error: 'No se pudo leer la base de datos de borrador local (IndexedDB)',
      })
    }
  },

  // Selecciona un asiento y calcula el temporizador de retención (default 10 min)
  selectSeat: async (seatNumber: string, holdDurationMinutes: number = 10) => {
    const state = getStore()
    if (!state.tripId) return

    const holdUntil = new Date(Date.now() + holdDurationMinutes * 60 * 1000).toISOString()
    const idempotencyKey = state.idempotencyKey || generateUUID()

    setStore({
      selectedSeat: seatNumber,
      holdUntil,
      idempotencyKey,
    })

    // Sincronizar en IndexedDB
    try {
      const draftKey = `saliendo_checkout_draft_${state.tripId}`
      await set(draftKey, {
        tripId: state.tripId,
        selectedSeat: seatNumber,
        passenger: state.passenger,
        paymentMethod: state.paymentMethod,
        holdUntil,
        idempotencyKey,
      })
    } catch (err) {
      console.error('Error persistiendo asiento seleccionado en IndexedDB:', err)
    }
  },

  // Actualiza los datos del pasajero en estado y persiste localmente
  updatePassenger: async (passengerData: PassengerData) => {
    const state = getStore()
    if (!state.tripId) return

    setStore({ passenger: passengerData })

    try {
      const draftKey = `saliendo_checkout_draft_${state.tripId}`
      await set(draftKey, {
        tripId: state.tripId,
        selectedSeat: state.selectedSeat,
        passenger: passengerData,
        paymentMethod: state.paymentMethod,
        holdUntil: state.holdUntil,
        idempotencyKey: state.idempotencyKey,
      })
    } catch (err) {
      console.error('Error persistiendo datos de pasajero en IndexedDB:', err)
    }
  },

  // Actualiza el método de pago seleccionado y persiste localmente
  setPaymentMethod: async (method: string) => {
    const state = getStore()
    if (!state.tripId) return

    setStore({ paymentMethod: method })

    try {
      const draftKey = `saliendo_checkout_draft_${state.tripId}`
      await set(draftKey, {
        tripId: state.tripId,
        selectedSeat: state.selectedSeat,
        passenger: state.passenger,
        paymentMethod: method,
        holdUntil: state.holdUntil,
        idempotencyKey: state.idempotencyKey,
      })
    } catch (err) {
      console.error('Error persistiendo método de pago en IndexedDB:', err)
    }
  },

  // Limpia el estado de la compra y remueve el borrador de IndexedDB
  clearCheckout: async () => {
    const state = getStore()
    const tripId = state.tripId
    
    setStore({
      tripId: null,
      trip: null,
      selectedSeat: null,
      passenger: null,
      paymentMethod: null,
      holdUntil: null,
      idempotencyKey: null,
      error: null,
    })

    if (tripId) {
      try {
        const draftKey = `saliendo_checkout_draft_${tripId}`
        await del(draftKey)
      } catch (err) {
        console.error('Error al remover borrador de IndexedDB:', err)
      }
    }
  },

  // Intenta recuperar el borrador de IndexedDB manualmente sin reinicializar todo el layout
  loadDraftFromStorage: async (tripId: string): Promise<boolean> => {
    try {
      const draftKey = `saliendo_checkout_draft_${tripId}`
      const draft = await get(draftKey)
      if (draft) {
        const isExpired = draft.holdUntil ? new Date(draft.holdUntil).getTime() < Date.now() : true
        if (!isExpired) {
          setStore({
            tripId: draft.tripId,
            selectedSeat: draft.selectedSeat,
            passenger: draft.passenger,
            paymentMethod: draft.paymentMethod,
            holdUntil: draft.holdUntil,
            idempotencyKey: draft.idempotencyKey,
          })
          return true
        } else {
          await del(draftKey)
        }
      }
      return false
    } catch (err) {
      console.error('Error al cargar borrador de IndexedDB:', err)
      return false
    }
  }
}))
