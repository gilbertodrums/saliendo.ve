-- =============================================================================
-- Migration: 20260524000006_create_trips
-- =============================================================================

CREATE TABLE public.trips (
  id                    uuid              PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  route_id              uuid              NOT NULL REFERENCES public.routes (id) ON DELETE RESTRICT,
  bus_id                uuid              NOT NULL REFERENCES public.buses  (id) ON DELETE RESTRICT,
  driver_id             uuid              REFERENCES public.users  (id) ON DELETE SET NULL,
  base_price_usd        numeric(10,2)     NOT NULL CHECK (base_price_usd >= 0),
  departure_at          timestamptz       NOT NULL,
  estimated_arrival_at  timestamptz,
  status                public.trip_status NOT NULL DEFAULT 'scheduled',
  amenities_json        jsonb             NOT NULL DEFAULT '{"wifi":false,"ac":true,"usb":false,"toilet":false,"snacks":false}'::jsonb,
  notes                 text,
  created_at            timestamptz       NOT NULL DEFAULT now(),
  updated_at            timestamptz       NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.trips                    IS 'Instancia concreta de un viaje: ruta + bus + horario';
COMMENT ON COLUMN public.trips.base_price_usd     IS 'Precio base en USD; puede variar por tipo de asiento en versiones futuras';
COMMENT ON COLUMN public.trips.amenities_json     IS 'JSON: { wifi, ac, usb, toilet, snacks, extras? }';
COMMENT ON COLUMN public.trips.departure_at       IS 'Salida programada (con timezone)';
COMMENT ON COLUMN public.trips.estimated_arrival_at IS 'Llegada estimada; null si no se conoce la hora exacta';

-- Índices clave
CREATE INDEX idx_trips_departure_at   ON public.trips (departure_at);
CREATE INDEX idx_trips_route_id       ON public.trips (route_id);
CREATE INDEX idx_trips_bus_id         ON public.trips (bus_id);
CREATE INDEX idx_trips_driver_id      ON public.trips (driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_trips_status         ON public.trips (status);
-- Índice compuesto para la query principal del buscador
CREATE INDEX idx_trips_search         ON public.trips (route_id, departure_at, status)
  WHERE status IN ('scheduled', 'boarding');

-- Trigger updated_at
CREATE TRIGGER trg_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_trips" ON public.trips
  FOR ALL TO authenticated
  USING     (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- operator_staff gestiona viajes de su operador (via route.operator_id)
CREATE POLICY "operator_staff_manage_own_trips" ON public.trips
  FOR ALL TO authenticated
  USING (
    public.auth_user_role() = 'operator_staff'
    AND route_id IN (
      SELECT id FROM public.routes
      WHERE operator_id = (SELECT operator_id FROM public.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    public.auth_user_role() = 'operator_staff'
    AND route_id IN (
      SELECT id FROM public.routes
      WHERE operator_id = (SELECT operator_id FROM public.users WHERE id = auth.uid())
    )
  );

-- driver: lee sus propios viajes asignados
CREATE POLICY "driver_read_own_trips" ON public.trips
  FOR SELECT TO authenticated
  USING (
    public.auth_user_role() = 'driver'
    AND driver_id = auth.uid()
  );

-- customer y anon: viajes activos públicos
CREATE POLICY "authenticated_read_active_trips" ON public.trips
  FOR SELECT TO authenticated
  USING (status IN ('scheduled', 'boarding'));

CREATE POLICY "anon_read_active_trips" ON public.trips
  FOR SELECT TO anon
  USING (status IN ('scheduled', 'boarding'));
