-- =============================================================================
-- Migration: 20260524000003_create_users
-- Tabla users (espeja auth.users) + trigger handle_new_user
-- =============================================================================

CREATE TABLE public.users (
  id            uuid                NOT NULL PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email         text                NOT NULL,
  full_name     text                NOT NULL,
  phone         text,
  role          public.user_role    NOT NULL DEFAULT 'customer',
  operator_id   uuid                REFERENCES public.operators (id) ON DELETE SET NULL,
  id_number     text,
  is_active     boolean             NOT NULL DEFAULT true,
  created_at    timestamptz         NOT NULL DEFAULT now(),
  updated_at    timestamptz         NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.users                 IS 'Perfil público de cada usuario; espeja auth.users con campos de dominio';
COMMENT ON COLUMN public.users.id             IS 'UUID que coincide con auth.users.id de Supabase Auth';
COMMENT ON COLUMN public.users.role           IS 'Rol del usuario: admin | operator_staff | driver | customer';
COMMENT ON COLUMN public.users.operator_id    IS 'FK al operador (solo para operator_staff y driver)';
COMMENT ON COLUMN public.users.id_number      IS 'Cédula de identidad venezolana (ej: V-12345678)';

-- Índices
CREATE INDEX idx_users_operator_id ON public.users (operator_id) WHERE operator_id IS NOT NULL;
CREATE INDEX idx_users_role        ON public.users (role);
CREATE INDEX idx_users_email       ON public.users (email);

-- Trigger updated_at
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- TRIGGER: crear fila en public.users cuando se registra un nuevo auth.user
-- Aplica para OTP email (clientes) y cualquier método de auth.
-- Para staff/driver/admin: el admin los crea via service_role y luego
-- actualiza role y operator_id con:
--   UPDATE public.users SET role='driver', operator_id='...' WHERE id='...';
-- La MFA para admin se activa desde el dashboard de Supabase (Auth > MFA).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Crea fila en public.users al registrarse un nuevo usuario en auth.users. Role default: customer.';

CREATE TRIGGER trg_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Admin: acceso total
CREATE POLICY "admin_all_users" ON public.users
  FOR ALL TO authenticated
  USING     (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- operator_staff: lee usuarios de su mismo operador
CREATE POLICY "operator_staff_read_same_operator_users" ON public.users
  FOR SELECT TO authenticated
  USING (
    public.auth_user_role() = 'operator_staff'
    AND operator_id = (SELECT operator_id FROM public.users WHERE id = auth.uid())
  );

-- driver: solo su propia fila
CREATE POLICY "driver_read_own_user" ON public.users
  FOR SELECT TO authenticated
  USING (
    public.auth_user_role() = 'driver'
    AND id = auth.uid()
  );

-- customer: lee y actualiza su propia fila (no puede cambiar role ni operator_id)
CREATE POLICY "customer_read_own_user" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "customer_update_own_user" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid() AND public.auth_user_role() = 'customer')
  WITH CHECK (
    id = auth.uid()
    AND role = 'customer'         -- no puede auto-escalarse
    AND operator_id IS NULL       -- no puede asignarse operador
  );
