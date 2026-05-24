-- =============================================================================
-- Migration: 20260524000004_create_routes
-- =============================================================================

CREATE TABLE public.routes (
  id                           uuid        PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  operator_id                  uuid        NOT NULL REFERENCES public.operators (id) ON DELETE RESTRICT,
  origin_city                  text        NOT NULL,
  destination_city             text        NOT NULL,
  origin_terminal              text,
  destination_terminal         text,
  estimated_duration_minutes   integer,
  distance_km                  numeric(8,2),
  is_active                    boolean     NOT NULL DEFAULT true,
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.routes                              IS 'Rutas fijas entre terminales que operan los transportistas';
COMMENT ON COLUMN public.routes.estimated_duration_minutes  IS 'Duración estimada del viaje en minutos';
COMMENT ON COLUMN public.routes.distance_km                 IS 'Distancia aproximada en kilómetros';

-- Índices
CREATE INDEX idx_routes_operator_id    ON public.routes (operator_id);
CREATE INDEX idx_routes_origin_dest    ON public.routes (origin_city, destination_city) WHERE is_active = true;

-- Trigger updated_at
CREATE TRIGGER trg_routes_updated_at
  BEFORE UPDATE ON public.routes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_routes" ON public.routes
  FOR ALL TO authenticated
  USING     (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

CREATE POLICY "operator_staff_manage_own_routes" ON public.routes
  FOR ALL TO authenticated
  USING (
    public.auth_user_role() = 'operator_staff'
    AND operator_id = (SELECT operator_id FROM public.users WHERE id = auth.uid())
  )
  WITH CHECK (
    public.auth_user_role() = 'operator_staff'
    AND operator_id = (SELECT operator_id FROM public.users WHERE id = auth.uid())
  );

-- driver, customer y anon: solo lectura de rutas activas
CREATE POLICY "public_read_active_routes" ON public.routes
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "anon_read_active_routes" ON public.routes
  FOR SELECT TO anon
  USING (is_active = true);
