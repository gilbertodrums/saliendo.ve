/**
 * tipos/database.ts — Modelo de datos completo de saliendo.ve
 *
 * Compatible con el cliente tipado de Supabase:
 *   createBrowserClient<Database>(url, key)
 *   createServerClient<Database>(url, key, { cookies })
 *
 * Los tipos Row, Insert y Update se generan a partir de las definiciones
 * de tabla usando utilidades de TypeScript estándar para máxima seguridad
 * en tiempo de compilación.
 */

// ---------------------------------------------------------------------------
// ENUMS
// ---------------------------------------------------------------------------

/** Roles de usuario en el sistema */
export type UserRole = 'admin' | 'operator_staff' | 'driver' | 'customer'

/** Estado del viaje a lo largo de su ciclo de vida */
export type TripStatus = 'scheduled' | 'boarding' | 'departed' | 'cancelled'

/** Estado de un asiento en un viaje específico */
export type SeatStatus = 'available' | 'held' | 'sold' | 'blocked'

/** Estado de un ticket después de su emisión */
export type TicketStatus = 'active' | 'boarded' | 'cancelled' | 'replaced'

/** Estado del pago (mock en Fase 0, se expande en Fase 3) */
export type PaymentStatus = 'pending' | 'mock_paid' | 'failed' | 'refunded'

/** Canal por el que se vendió el ticket */
export type SoldByChannel = 'web' | 'office'

/** Método de pago registrado */
export type PaymentMethod = 'cash_bs' | 'cash_usd' | 'transfer_bs' | 'mock_card'

// ---------------------------------------------------------------------------
// TIPOS DE COLUMNAS JSON EMBEBIDAS
// ---------------------------------------------------------------------------

/** Posición de un asiento en el layout del bus */
export interface SeatPosition {
  /** Número único del asiento tal como aparece en el bus (ej: "1A", "12") */
  number: string
  /** Columna en la cuadrícula del layout (0-indexed) */
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
// DEFINICIONES DE TABLAS (estructura interna compatible con Supabase)
// ---------------------------------------------------------------------------

interface OperatorsTable {
  Row: {
    id: string
    name: string
    logo_url: string | null
    contact_phone: string | null
    contact_email: string | null
    rif: string | null
    is_active: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    name: string
    logo_url?: string | null
    contact_phone?: string | null
    contact_email?: string | null
    rif?: string | null
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    name?: string
    logo_url?: string | null
    contact_phone?: string | null
    contact_email?: string | null
    rif?: string | null
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}

interface UsersTable {
  Row: {
    /** UUID que coincide con auth.users.id de Supabase Auth */
    id: string
    email: string
    full_name: string
    phone: string | null
    role: UserRole
    /** Operador al que pertenece (operator_staff y driver) */
    operator_id: string | null
    id_number: string | null
    is_active: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id: string
    email: string
    full_name: string
    phone?: string | null
    role?: UserRole
    operator_id?: string | null
    id_number?: string | null
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    email?: string
    full_name?: string
    phone?: string | null
    role?: UserRole
    operator_id?: string | null
    id_number?: string | null
    is_active?: boolean
    created_at?: string
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
  ]
}

interface RoutesTable {
  Row: {
    id: string
    operator_id: string
    origin_city: string
    destination_city: string
    origin_terminal: string | null
    destination_terminal: string | null
    /** Duración estimada en minutos */
    estimated_duration_minutes: number | null
    distance_km: number | null
    is_active: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    operator_id: string
    origin_city: string
    destination_city: string
    origin_terminal?: string | null
    destination_terminal?: string | null
    estimated_duration_minutes?: number | null
    distance_km?: number | null
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    operator_id?: string
    origin_city?: string
    destination_city?: string
    origin_terminal?: string | null
    destination_terminal?: string | null
    estimated_duration_minutes?: number | null
    distance_km?: number | null
    is_active?: boolean
    created_at?: string
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
  ]
}

interface BusesTable {
  Row: {
    id: string
    operator_id: string
    plate: string
    model: string | null
    brand: string | null
    year: number | null
    total_seats: number
    /** Estructura JSON con posiciones x/y de cada asiento */
    layout_json: BusLayoutJson
    is_active: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    operator_id: string
    plate: string
    model?: string | null
    brand?: string | null
    year?: number | null
    total_seats: number
    layout_json: BusLayoutJson
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    operator_id?: string
    plate?: string
    model?: string | null
    brand?: string | null
    year?: number | null
    total_seats?: number
    layout_json?: BusLayoutJson
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: 'buses_operator_id_fkey'
      columns: ['operator_id']
      isOneToOne: false
      referencedRelation: 'operators'
      referencedColumns: ['id']
    },
  ]
}

interface TripsTable {
  Row: {
    id: string
    route_id: string
    bus_id: string
    driver_id: string | null
    /** Precio base en USD (puede variar por tipo de asiento) */
    base_price_usd: number
    departure_at: string
    /** ISO 8601 timestamp, null si aún no se conoce la hora exacta */
    estimated_arrival_at: string | null
    status: TripStatus
    amenities_json: TripAmenitiesJson
    notes: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    route_id: string
    bus_id: string
    driver_id?: string | null
    base_price_usd: number
    departure_at: string
    estimated_arrival_at?: string | null
    status?: TripStatus
    amenities_json?: TripAmenitiesJson
    notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    route_id?: string
    bus_id?: string
    driver_id?: string | null
    base_price_usd?: number
    departure_at?: string
    estimated_arrival_at?: string | null
    status?: TripStatus
    amenities_json?: TripAmenitiesJson
    notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: 'trips_route_id_fkey'
      columns: ['route_id']
      isOneToOne: false
      referencedRelation: 'routes'
      referencedColumns: ['id']
    },
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
  ]
}

interface SeatsStatusTable {
  Row: {
    /** FK a trips.id */
    trip_id: string
    /** Número de asiento (coincide con SeatPosition.number en layout_json) */
    seat_number: string
    status: SeatStatus
    /** UUID del usuario que tiene el asiento en hold */
    held_by: string | null
    /** Timestamp de expiración del hold (usualmente now() + 10 minutos) */
    held_until: string | null
    /** FK a tickets.id cuando el asiento está sold */
    ticket_id: string | null
    updated_at: string
  }
  Insert: {
    trip_id: string
    seat_number: string
    status?: SeatStatus
    held_by?: string | null
    held_until?: string | null
    ticket_id?: string | null
    updated_at?: string
  }
  Update: {
    trip_id?: string
    seat_number?: string
    status?: SeatStatus
    held_by?: string | null
    held_until?: string | null
    ticket_id?: string | null
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: 'seats_status_trip_id_fkey'
      columns: ['trip_id']
      isOneToOne: false
      referencedRelation: 'trips'
      referencedColumns: ['id']
    },
    {
      foreignKeyName: 'seats_status_ticket_id_fkey'
      columns: ['ticket_id']
      isOneToOne: false
      referencedRelation: 'tickets'
      referencedColumns: ['id']
    },
  ]
}

interface TicketsTable {
  Row: {
    id: string
    trip_id: string
    seat_number: string
    passenger_name: string
    passenger_id_number: string
    /** UUID v4 único para generar el QR — nunca reutilizar */
    qr_token: string
    sold_by_channel: SoldByChannel
    /** Usuario que vendió el ticket (operator_staff o customer en web) */
    sold_by_user_id: string | null
    status: TicketStatus
    /** FK al ticket que reemplaza a este (cuando status = 'replaced') */
    replaced_by_ticket_id: string | null
    price_paid_usd: number
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    trip_id: string
    seat_number: string
    passenger_name: string
    passenger_id_number: string
    qr_token?: string
    sold_by_channel: SoldByChannel
    sold_by_user_id?: string | null
    status?: TicketStatus
    replaced_by_ticket_id?: string | null
    price_paid_usd: number
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    trip_id?: string
    seat_number?: string
    passenger_name?: string
    passenger_id_number?: string
    qr_token?: string
    sold_by_channel?: SoldByChannel
    sold_by_user_id?: string | null
    status?: TicketStatus
    replaced_by_ticket_id?: string | null
    price_paid_usd?: number
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: 'tickets_trip_id_fkey'
      columns: ['trip_id']
      isOneToOne: false
      referencedRelation: 'trips'
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
      foreignKeyName: 'tickets_replaced_by_ticket_id_fkey'
      columns: ['replaced_by_ticket_id']
      isOneToOne: false
      referencedRelation: 'tickets'
      referencedColumns: ['id']
    },
  ]
}

interface PaymentsTable {
  Row: {
    id: string
    ticket_id: string
    amount_usd: number
    /** Monto en bolívares al tipo de cambio del momento */
    amount_bs: number | null
    /** Tipo de cambio BCV usado para la conversión */
    exchange_rate_bcv: number | null
    method: PaymentMethod
    status: PaymentStatus
    /** Referencia del banco o comprobante externo */
    reference_number: string | null
    processed_by_user_id: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    ticket_id: string
    amount_usd: number
    amount_bs?: number | null
    exchange_rate_bcv?: number | null
    method: PaymentMethod
    status?: PaymentStatus
    reference_number?: string | null
    processed_by_user_id?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    ticket_id?: string
    amount_usd?: number
    amount_bs?: number | null
    exchange_rate_bcv?: number | null
    method?: PaymentMethod
    status?: PaymentStatus
    reference_number?: string | null
    processed_by_user_id?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: [
    {
      foreignKeyName: 'payments_ticket_id_fkey'
      columns: ['ticket_id']
      isOneToOne: false
      referencedRelation: 'tickets'
      referencedColumns: ['id']
    },
    {
      foreignKeyName: 'payments_processed_by_user_id_fkey'
      columns: ['processed_by_user_id']
      isOneToOne: false
      referencedRelation: 'users'
      referencedColumns: ['id']
    },
  ]
}

interface AuditLogTable {
  Row: {
    id: string
    actor_user_id: string | null
    action: string
    entity_type: string
    entity_id: string
    /** Estado del registro antes del cambio */
    before_json: Record<string, unknown> | null
    /** Estado del registro después del cambio */
    after_json: Record<string, unknown> | null
    ip_address: string | null
    created_at: string
  }
  Insert: {
    id?: string
    actor_user_id?: string | null
    action: string
    entity_type: string
    entity_id: string
    before_json?: Record<string, unknown> | null
    after_json?: Record<string, unknown> | null
    ip_address?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    actor_user_id?: string | null
    action?: string
    entity_type?: string
    entity_id?: string
    before_json?: Record<string, unknown> | null
    after_json?: Record<string, unknown> | null
    ip_address?: string | null
    created_at?: string
  }
  Relationships: []
}

// ---------------------------------------------------------------------------
// TIPO DATABASE PRINCIPAL — compatible con SupabaseClient<Database>
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      operators: OperatorsTable
      users: UsersTable
      routes: RoutesTable
      buses: BusesTable
      trips: TripsTable
      seats_status: SeatsStatusTable
      tickets: TicketsTable
      payments: PaymentsTable
      audit_log: AuditLogTable
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      trip_status: TripStatus
      seat_status: SeatStatus
      ticket_status: TicketStatus
      payment_status: PaymentStatus
      sold_by_channel: SoldByChannel
      payment_method: PaymentMethod
    }
    CompositeTypes: Record<string, never>
  }
}

// ---------------------------------------------------------------------------
// ALIAS DE CONVENIENCIA — para usar en componentes sin repetir Database[...]
// ---------------------------------------------------------------------------

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
