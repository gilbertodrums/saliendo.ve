-- =============================================================================
-- Migration: 20260524000002_create_operators
-- Tabla operators + helper trigger updated_at + helper auth_user_role()
-- =============================================================================

-- ---------------------------------------------------------------------------
-- HELPER: trigger function para actualizar updated_at automáticamente
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.set_updated_at() IS 'Trigger function: actualiza updated_at a now() en cada UPDATE';

-- ---------------------------------------------------------------------------
-- HELPER: función para leer el role del usuario actual desde public.users
-- check_function_bodies=off permite crear la función antes de que la tabla
-- users exista; se valida en tiempo de ejecución, no de compilación.
-- ---------------------------------------------------------------------------
SET check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

SET check_function_bodies = on;

COMMENT ON FUNCTION public.auth_user_role() IS 'Retorna el role del usuario autenticado desde public.users. STABLE + SECURITY DEFINER para eficiencia en RLS.';

-- ---------------------------------------------------------------------------
-- TABLA: operators
-- ---------------------------------------------------------------------------
CREATE TABLE public.operators (
  id               uuid        PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name             text        NOT NULL,
  logo_url         text,
  contact_phone    text,
  contact_email    text,
  rif              text,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.operators             IS 'Empresas de transporte que operan en la plataforma';
COMMENT ON COLUMN public.operators.rif         IS 'RIF venezolano de la empresa (ej: J-12345678-9)';
COMMENT ON COLUMN public.operators.logo_url    IS 'URL pública del logo almacenado en Supabase Storage';

CREATE INDEX idx_operators_is_active ON public.operators (is_active)
  WHERE is_active = true;

CREATE TRIGGER trg_operators_updated_at
  BEFORE UPDATE ON public.operators
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_operators" ON public.operators
  FOR ALL TO authenticated
  USING     (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

CREATE POLICY "authenticated_read_active_operators" ON public.operators
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "anon_read_active_operators" ON public.operators
  FOR SELECT TO anon
  USING (is_active = true);
