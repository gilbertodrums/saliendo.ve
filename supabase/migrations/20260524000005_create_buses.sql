-- =============================================================================
-- Migration: 20260524000005_create_buses
-- =============================================================================

CREATE TABLE public.buses (
  id            uuid        PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  operator_id   uuid        NOT NULL REFERENCES public.operators (id) ON DELETE RESTRICT,
  plate         text        NOT NULL UNIQUE,
  model         text,
  brand         text,
  year          integer     CHECK (year BETWEEN 1990 AND 2100),
  total_seats   integer     NOT NULL CHECK (total_seats > 0),
  layout_json   jsonb       NOT NULL,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.buses              IS 'Unidades de transporte con su layout de asientos';
COMMENT ON COLUMN public.buses.plate        IS 'Placa del vehículo (única en la plataforma)';
COMMENT ON COLUMN public.buses.layout_json  IS 'JSON: { columns, rows, seats: [{number, x, y, type}] }';
COMMENT ON COLUMN public.buses.total_seats  IS 'Total de asientos; debe coincidir con len(layout_json.seats)';

-- Índices
CREATE INDEX idx_buses_operator_id ON public.buses (operator_id);
CREATE INDEX idx_buses_is_active   ON public.buses (is_active) WHERE is_active = true;

-- Trigger updated_at
CREATE TRIGGER trg_buses_updated_at
  BEFORE UPDATE ON public.buses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_buses" ON public.buses
  FOR ALL TO authenticated
  USING     (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

CREATE POLICY "operator_staff_manage_own_buses" ON public.buses
  FOR ALL TO authenticated
  USING (
    public.auth_user_role() = 'operator_staff'
    AND operator_id = (SELECT operator_id FROM public.users WHERE id = auth.uid())
  )
  WITH CHECK (
    public.auth_user_role() = 'operator_staff'
    AND operator_id = (SELECT operator_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "authenticated_read_active_buses" ON public.buses
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "anon_read_active_buses" ON public.buses
  FOR SELECT TO anon
  USING (is_active = true);
