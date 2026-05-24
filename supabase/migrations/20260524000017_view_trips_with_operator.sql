-- =============================================================================
-- Migration: 20260524000017_view_trips_with_operator
-- VIEW aplanada trips + routes + operators para evitar JOINs de 2 niveles
-- en PostgREST. Usada por la UI en la página de búsqueda de pasajes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- VIEW: trips_with_operator
-- Filtra trips cancelados en origen para no exponerlos nunca.
-- Las columnas se nombran con los alias que la UI (Agente 2) espera.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.trips_with_operator
WITH (security_invoker = true)
AS
SELECT
  -- Identificadores
  t.id                             AS trip_id,
  t.route_id,
  t.bus_id,

  -- Estado y fechas del viaje
  t.status                         AS trip_status,
  t.departure_at,
  t.estimated_arrival_at           AS arrival_at,

  -- Precio (la tabla solo tiene base_price_usd; price_bolivares no existe aún)
  t.base_price_usd                 AS price_usd,
  NULL::numeric                    AS price_bolivares,

  -- Amenidades
  t.amenities_json,

  -- Columnas de la ruta
  r.origin_city,
  r.destination_city,
  r.origin_terminal,
  r.destination_terminal,
  r.estimated_duration_minutes     AS duration_minutes,
  r.distance_km,

  -- Columnas del operador
  o.id                             AS operator_id,
  o.name                           AS operator_name,
  o.logo_url                       AS operator_logo_url,
  o.contact_phone                  AS operator_contact_phone

FROM public.trips     t
JOIN public.routes    r ON r.id = t.route_id
JOIN public.operators o ON o.id = r.operator_id

-- Filtro de seguridad: nunca exponer viajes cancelados
WHERE t.status <> 'cancelled';

COMMENT ON VIEW public.trips_with_operator IS
  'View aplanada trips+routes+operators. Excluye viajes cancelados. '
  'Usada por PostgREST para evitar JOINs de 2 niveles desde el cliente.';

-- ---------------------------------------------------------------------------
-- Índice de soporte: la query principal del buscador filtra por
-- (origin_city, destination_city) en routes y departure_at en trips.
-- El índice existente idx_trips_search ya cubre (route_id, departure_at, status)
-- en trips. Agregamos uno compuesto en routes para el filtro origen/destino
-- cuando se use directamente sobre la vista.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_routes_origin_dest_full
  ON public.routes (origin_city, destination_city, operator_id)
  WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- SEGURIDAD: security_invoker = true (declarado arriba en WITH) hace que la
-- view evalúe las políticas RLS del usuario que la consulta, no del dueño.
-- Esto significa que las políticas de trips, routes y operators aplican
-- automáticamente. No se necesitan políticas separadas en la view.
--
-- Las políticas existentes ya cubren:
--   - trips:     anon_read_active_trips / authenticated_read_active_trips
--   - routes:    anon_read_active_routes / public_read_active_routes
--   - operators: anon_read_active_operators / authenticated_read_active_operators
--
-- El filtro WHERE t.status <> 'cancelled' es redundante con las políticas
-- pero actúa como defensa en profundidad: aunque una política cambie,
-- los cancelados nunca salen de la view.
-- ---------------------------------------------------------------------------
