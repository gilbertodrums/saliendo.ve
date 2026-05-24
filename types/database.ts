/**
 * types/database.ts — Tipos generados desde el esquema Supabase + tipos compuestos manuales
 *
 * La sección principal (Json, Database, Tables, TablesInsert, TablesUpdate,
 * Enums, CompositeTypes, Constants) fue generada con:
 *   mcp__supabase__generate_typescript_types (project_id: hcfeymszchvcpkjrlkbw)
 *
 * Última regeneración: 2026-05-24 — incluye view trips_with_operator
 *
 * Los tipos compuestos al final (TripWithRelations, TicketWithRelations,
 * SeatMapEntry, SeatStatusRealtimePayload, BusLayoutJson, TripAmenitiesJson,
 * TripWithOperator) son manuales y se mantienen en sincronía con el esquema.
 *
 * Compatible con:
 *   createBrowserClient<Database>(url, key)
 *   createServerClient<Database>(url, key, { cookies })
 */

// ---------------------------------------------------------------------------
// TIPOS JSON (generados)
// ---------------------------------------------------------------------------

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ---------------------------------------------------------------------------
// DATABASE (generado desde Supabase — fuente de verdad)
// ---------------------------------------------------------------------------

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          after_json: Json | null
          before_json: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_log_actor_user_id_fkey'
            columns: ['actor_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      buses: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          is_active: boolean
          layout_json: Json
          model: string | null
          operator_id: string
          plate: string
          total_seats: number
          updated_at: string
          year: number | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          layout_json: Json
          model?: string | null
          operator_id: string
          plate: string
          total_seats: number
          updated_at?: string
          year?: number | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          layout_json?: Json
          model?: string | null
          operator_id?: string
          plate?: string
          total_seats?: number
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'buses_operator_id_fkey'
            columns: ['operator_id']
            isOneToOne: false
            referencedRelation: 'operators'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'buses_operator_id_fkey'
            columns: ['operator_id']
            isOneToOne: false
            referencedRelation: 'trips_with_operator'
            referencedColumns: ['operator_id']
          },
        ]
      }
      operators: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          rif: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          rif?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          rif?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_bs: number | null
          amount_usd: number
          created_at: string
          exchange_rate_bcv: number | null
          id: string
          method: Database['public']['Enums']['payment_method']
          processed_by_user_id: string | null
          reference_number: string | null
          status: Database['public']['Enums']['payment_status']
          ticket_id: string
          updated_at: string
        }
        Insert: {
          amount_bs?: number | null
          amount_usd: number
          created_at?: string
          exchange_rate_bcv?: number | null
          id?: string
          method: Database['public']['Enums']['payment_method']
          processed_by_user_id?: string | null
          reference_number?: string | null
          status?: Database['public']['Enums']['payment_status']
          ticket_id: string
          updated_at?: string
        }
        Update: {
          amount_bs?: number | null
          amount_usd?: number
          created_at?: string
          exchange_rate_bcv?: number | null
          id?: string
          method?: Database['public']['Enums']['payment_method']
          processed_by_user_id?: string | null
          reference_number?: string | null
          status?: Database['public']['Enums']['payment_status']
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_processed_by_user_id_fkey'
            columns: ['processed_by_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: true
            referencedRelation: 'tickets'
            referencedColumns: ['id']
          },
        ]
      }
      routes: {
        Row: {
          created_at: string
          destination_city: string
          destination_terminal: string | null
          distance_km: number | null
          estimated_duration_minutes: number | null
          id: string
          is_active: boolean
          operator_id: string
          origin_city: string
          origin_terminal: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_city: string
          destination_terminal?: string | null
          distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          operator_id: string
          origin_city: string
          origin_terminal?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_city?: string
          destination_terminal?: string | null
          distance_km?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_active?: boolean
          operator_id?: string
          origin_city?: string
          origin_terminal?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'routes_operator_id_fkey'
            columns: ['operator_id']
            isOneToOne: false
            referencedRelation: 'operators'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'routes_operator_id_fkey'
            columns: ['operator_id']
            isOneToOne: false
            referencedRelation: 'trips_with_operator'
            referencedColumns: ['operator_id']
          },
        ]
      }
      seats_status: {
        Row: {
          held_by: string | null
          held_until: string | null
          seat_number: string
          status: Database['public']['Enums']['seat_status']
          ticket_id: string | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          held_by?: string | null
          held_until?: string | null
          seat_number: string
          status?: Database['public']['Enums']['seat_status']
          ticket_id?: string | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          held_by?: string | null
          held_until?: string | null
          seat_number?: string
          status?: Database['public']['Enums']['seat_status']
          ticket_id?: string | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'seats_status_held_by_fkey'
            columns: ['held_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'seats_status_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'tickets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'seats_status_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'seats_status_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips_with_operator'
            referencedColumns: ['trip_id']
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string
          id: string
          passenger_id_number: string
          passenger_name: string
          price_paid_usd: number
          qr_token: string
          replaced_by_ticket_id: string | null
          seat_number: string
          sold_by_channel: Database['public']['Enums']['sold_by_channel']
          sold_by_user_id: string | null
          status: Database['public']['Enums']['ticket_status']
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          passenger_id_number: string
          passenger_name: string
          price_paid_usd: number
          qr_token?: string
          replaced_by_ticket_id?: string | null
          seat_number: string
          sold_by_channel: Database['public']['Enums']['sold_by_channel']
          sold_by_user_id?: string | null
          status?: Database['public']['Enums']['ticket_status']
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          passenger_id_number?: string
          passenger_name?: string
          price_paid_usd?: number
          qr_token?: string
          replaced_by_ticket_id?: string | null
          seat_number?: string
          sold_by_channel?: Database['public']['Enums']['sold_by_channel']
          sold_by_user_id?: string | null
          status?: Database['public']['Enums']['ticket_status']
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tickets_replaced_by_ticket_id_fkey'
            columns: ['replaced_by_ticket_id']
            isOneToOne: false
            referencedRelation: 'tickets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tickets_sold_by_user_id_fkey'
            columns: ['sold_by_user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tickets_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tickets_trip_id_fkey'
            columns: ['trip_id']
            isOneToOne: false
            referencedRelation: 'trips_with_operator'
            referencedColumns: ['trip_id']
          },
        ]
      }
      trips: {
        Row: {
          amenities_json: Json
          base_price_usd: number
          bus_id: string
          created_at: string
          departure_at: string
          driver_id: string | null
          estimated_arrival_at: string | null
          id: string
          notes: string | null
          route_id: string
          status: Database['public']['Enums']['trip_status']
          updated_at: string
        }
        Insert: {
          amenities_json?: Json
          base_price_usd: number
          bus_id: string
          created_at?: string
          departure_at: string
          driver_id?: string | null
          estimated_arrival_at?: string | null
          id?: string
          notes?: string | null
          route_id: string
          status?: Database['public']['Enums']['trip_status']
          updated_at?: string
        }
        Update: {
          amenities_json?: Json
          base_price_usd?: number
          bus_id?: string
          created_at?: string
          departure_at?: string
          driver_id?: string | null
          estimated_arrival_at?: string | null
          id?: string
          notes?: string | null
          route_id?: string
          status?: Database['public']['Enums']['trip_status']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'trips_bus_id_fkey'
            columns: ['bus_id']
            isOneToOne: false
            referencedRelation: 'buses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'trips_driver_id_fkey'
            columns: ['driver_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'trips_route_id_fkey'
            columns: ['route_id']
            isOneToOne: false
            referencedRelation: 'routes'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          id_number: string | null
          is_active: boolean
          operator_id: string | null
          phone: string | null
          role: Database['public']['Enums']['user_role']
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          id_number?: string | null
          is_active?: boolean
          operator_id?: string | null
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          id_number?: string | null
          is_active?: boolean
          operator_id?: string | null
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'users_operator_id_fkey'
            columns: ['operator_id']
            isOneToOne: false
            referencedRelation: 'operators'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'users_operator_id_fkey'
            columns: ['operator_id']
            isOneToOne: false
            referencedRelation: 'trips_with_operator'
            referencedColumns: ['operator_id']
          },
        ]
      }
    }
    Views: {
      trips_with_operator: {
        Row: {
          amenities_json: Json | null
          arrival_at: string | null
          bus_id: string | null
          departure_at: string | null
          destination_city: string | null
          destination_terminal: string | null
          distance_km: number | null
          duration_minutes: number | null
          operator_contact_phone: string | null
          operator_id: string | null
          operator_logo_url: string | null
          operator_name: string | null
          origin_city: string | null
          origin_terminal: string | null
          price_bolivares: number | null
          price_usd: number | null
          route_id: string | null
          trip_id: string | null
          trip_status: Database['public']['Enums']['trip_status'] | null
        }
        Relationships: [
          {
            foreignKeyName: 'trips_bus_id_fkey'
            columns: ['bus_id']
            isOneToOne: false
            referencedRelation: 'buses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'trips_route_id_fkey'
            columns: ['route_id']
            isOneToOne: false
            referencedRelation: 'routes'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      auth_user_role: {
        Args: never
        Returns: Database['public']['Enums']['user_role']
      }
      confirm_ticket: {
        Args: {
          p_idempotency_key: string
          p_passenger_data: Json
          p_payment_data: Json
          p_seat_number: string
          p_trip_id: string
        }
        Returns: Json
      }
      hold_seat: {
        Args: { p_seat_number: string; p_trip_id: string }
        Returns: string
      }
      release_seat: {
        Args: { p_seat_number: string; p_trip_id: string }
        Returns: boolean
      }
      replace_ticket: {
        Args: { p_new_seat_number: string; p_old_ticket_id: string }
        Returns: Json
      }
      validate_qr: { Args: { p_qr_token: string }; Returns: Json }
    }
    Enums: {
      payment_method: 'cash_bs' | 'cash_usd' | 'transfer_bs' | 'mock_card'
      payment_status: 'pending' | 'mock_paid' | 'failed' | 'refunded'
      seat_status: 'available' | 'held' | 'sold' | 'blocked'
      sold_by_channel: 'web' | 'office'
      ticket_status: 'active' | 'boarded' | 'cancelled' | 'replaced'
      trip_status: 'scheduled' | 'boarding' | 'departed' | 'cancelled'
      user_role: 'admin' | 'operator_staff' | 'driver' | 'customer'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      payment_method: ['cash_bs', 'cash_usd', 'transfer_bs', 'mock_card'],
      payment_status: ['pending', 'mock_paid', 'failed', 'refunded'],
      seat_status: ['available', 'held', 'sold', 'blocked'],
      sold_by_channel: ['web', 'office'],
      ticket_status: ['active', 'boarded', 'cancelled', 'replaced'],
      trip_status: ['scheduled', 'boarding', 'departed', 'cancelled'],
      user_role: ['admin', 'operator_staff', 'driver', 'customer'],
    },
  },
} as const

// ---------------------------------------------------------------------------
// ALIAS DE CONVENIENCIA — para usar en componentes sin repetir Database[...]
// ---------------------------------------------------------------------------

/** Roles de usuario en el sistema */
export type UserRole = Database['public']['Enums']['user_role']
/** Estado del viaje a lo largo de su ciclo de vida */
export type TripStatus = Database['public']['Enums']['trip_status']
/** Estado de un asiento en un viaje específico */
export type SeatStatus = Database['public']['Enums']['seat_status']
/** Estado de un ticket después de su emisión */
export type TicketStatus = Database['public']['Enums']['ticket_status']
/** Estado del pago */
export type PaymentStatus = Database['public']['Enums']['payment_status']
/** Canal por el que se vendió el ticket */
export type SoldByChannel = Database['public']['Enums']['sold_by_channel']
/** Método de pago registrado */
export type PaymentMethod = Database['public']['Enums']['payment_method']

/** Fila completa de la tabla operators */
export type Operator = Database['public']['Tables']['operators']['Row']
/** Fila completa de la tabla users */
export type User = Database['public']['Tables']['users']['Row']
/** Fila completa de la tabla routes */
export type Route = Database['public']['Tables']['routes']['Row']
/** Fila completa de la tabla buses */
export type Bus = Database['public']['Tables']['buses']['Row']
/** Fila completa de la tabla trips */
export type Trip = Database['public']['Tables']['trips']['Row']
/** Fila completa de la tabla seats_status */
export type SeatStatusRow = Database['public']['Tables']['seats_status']['Row']
/** Fila completa de la tabla tickets */
export type Ticket = Database['public']['Tables']['tickets']['Row']
/** Fila completa de la tabla payments */
export type Payment = Database['public']['Tables']['payments']['Row']
/** Fila completa de la tabla audit_log */
export type AuditLog = Database['public']['Tables']['audit_log']['Row']
/** Fila de la view trips_with_operator (join aplanado trips+routes+operators) */
export type TripWithOperator = Database['public']['Views']['trips_with_operator']['Row']

/** Tipos Insert para formularios y Server Actions */
export type OperatorInsert = Database['public']['Tables']['operators']['Insert']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type RouteInsert = Database['public']['Tables']['routes']['Insert']
export type BusInsert = Database['public']['Tables']['buses']['Insert']
export type TripInsert = Database['public']['Tables']['trips']['Insert']
export type SeatStatusInsert = Database['public']['Tables']['seats_status']['Insert']
export type TicketInsert = Database['public']['Tables']['tickets']['Insert']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type AuditLogInsert = Database['public']['Tables']['audit_log']['Insert']

/** Tipos Update para mutaciones parciales */
export type OperatorUpdate = Database['public']['Tables']['operators']['Update']
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type RouteUpdate = Database['public']['Tables']['routes']['Update']
export type BusUpdate = Database['public']['Tables']['buses']['Update']
export type TripUpdate = Database['public']['Tables']['trips']['Update']
export type SeatStatusUpdate = Database['public']['Tables']['seats_status']['Update']
export type TicketUpdate = Database['public']['Tables']['tickets']['Update']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']

// ---------------------------------------------------------------------------
// TIPOS DE COLUMNAS JSON EMBEBIDAS (para tipar layout_json y amenities_json)
// ---------------------------------------------------------------------------

/** Posición de un asiento en el layout del bus */
export interface SeatPosition {
  /** Número único del asiento tal como aparece en el bus (ej: "1A", "12") */
  number: string
  /** Columna en la cuadrícula del layout (0-indexed: 0=A, 1=B, 2=C, 3=D) */
  x: number
  /** Fila en la cuadrícula del layout (0-indexed) */
  y: number
  /** Tipo de asiento para renderizado y precio diferenciado */
  type: 'standard' | 'premium' | 'bed' | 'disabled'
}

/** Layout completo de asientos de un bus */
export interface BusLayoutJson {
  /** Número de columnas en la cuadrícula del layout */
  columns: number
  /** Número de filas en la cuadrícula del layout */
  rows: number
  /** Lista de todos los asientos del bus */
  seats: SeatPosition[]
}

/** Amenidades disponibles en un viaje específico */
export interface TripAmenitiesJson {
  wifi: boolean
  ac: boolean
  usb: boolean
  toilet: boolean
  snacks: boolean
  /** Amenidades adicionales de texto libre */
  extras?: string[]
}

// ---------------------------------------------------------------------------
// TIPOS COMPUESTOS — para queries con JOIN (uso frecuente en UI)
// ---------------------------------------------------------------------------

/** Trip con sus relaciones expandidas para la página de búsqueda y detalle */
export interface TripWithRelations extends Trip {
  route: Route
  bus: Bus
  driver: Pick<User, 'id' | 'full_name' | 'phone'> | null
  operator: Pick<Operator, 'id' | 'name' | 'logo_url'>
}

/** Ticket con el viaje y pago incluidos (para la página del boleto) */
export interface TicketWithRelations extends Ticket {
  trip: TripWithRelations
  payment: Payment | null
}

/** Resumen de asientos para el mapa de selección */
export interface SeatMapEntry {
  seat: SeatPosition
  status: SeatStatus
  /** true solo si held_by coincide con el usuario actual */
  isHeldByCurrentUser: boolean
}

/** Payload para el Realtime channel de seats_status */
export interface SeatStatusRealtimePayload {
  trip_id: string
  seat_number: string
  status: SeatStatus
  held_by: string | null
  held_until: string | null
  ticket_id: string | null
}
