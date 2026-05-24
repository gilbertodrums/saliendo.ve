-- =============================================================================
-- Migration: 20260524000018_fix_bugs_qa
-- 1. BUG-01: Proactive, atomic release of expired holds inside hold_seat RPC
-- 2. BUG-02: Infinite RLS recursion fix for users under operator_staff role
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. BUG-01: Actualizar public.hold_seat con liberación proactiva de hold expirado
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hold_seat(
  p_trip_id     uuid,
  p_seat_number text
)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_held_until  timestamptz;
  v_user_id     uuid;
BEGIN
  -- Validar que hay un usuario autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED'
      USING HINT = 'Debes iniciar sesión para reservar un asiento';
  END IF;

  -- Validar que el trip existe y está en estado aceptable
  IF NOT EXISTS (
    SELECT 1 FROM public.trips
    WHERE id = p_trip_id
      AND status IN ('scheduled', 'boarding')
  ) THEN
    RAISE EXCEPTION 'TRIP_NOT_AVAILABLE'
      USING HINT = 'El viaje no existe o no acepta reservas';
  END IF;

  -- Proactivamente liberar el hold para este asiento específico si ya expiró.
  -- Esto previene que los asientos queden bloqueados durante el intervalo de 60s
  -- de latencia del cron sweep de pg_cron.
  UPDATE public.seats_status
  SET
    status     = 'available',
    held_by    = NULL,
    held_until = NULL
  WHERE trip_id     = p_trip_id
    AND seat_number = p_seat_number
    AND status      = 'held'
    AND held_until  < now();

  -- Liberar cualquier hold previo del mismo usuario en este viaje
  -- (un usuario no puede tener más de un asiento en hold por viaje)
  UPDATE public.seats_status
  SET
    status     = 'available',
    held_by    = NULL,
    held_until = NULL
  WHERE trip_id    = p_trip_id
    AND held_by    = v_user_id
    AND status     = 'held';

  -- Adquirir el hold de forma atómica
  -- Si el asiento no está 'available', UPDATE afecta 0 filas → excepción
  UPDATE public.seats_status
  SET
    status     = 'held',
    held_by    = v_user_id,
    held_until = now() + interval '10 minutes'
  WHERE trip_id     = p_trip_id
    AND seat_number = p_seat_number
    AND status      = 'available'
  RETURNING held_until INTO v_held_until;

  IF v_held_until IS NULL THEN
    RAISE EXCEPTION 'SEAT_NOT_AVAILABLE'
      USING HINT = 'El asiento ya está reservado o vendido. Seleccioná otro.';
  END IF;

  RETURN v_held_until;
END;
$$;

COMMENT ON FUNCTION public.hold_seat(uuid, text) IS
  'Reserva atómica de asiento por 10 minutos. Libera proactivamente holds expirados y lanza SEAT_NOT_AVAILABLE si no está libre.';

-- Revocar EXECUTE de anon en la función hold_seat modificada
REVOKE EXECUTE ON FUNCTION public.hold_seat(uuid, text) FROM anon;

-- ---------------------------------------------------------------------------
-- 2. BUG-02: Función helper SECURITY DEFINER para obtener el operator_id del usuario
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auth_user_operator_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT operator_id FROM public.users WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.auth_user_operator_id() IS
  'Retorna el operator_id del usuario autenticado desde public.users. STABLE + SECURITY DEFINER para evitar recursión infinita en RLS.';

-- Revocar permisos de anon y authenticated por seguridad y coherencia
REVOKE EXECUTE ON FUNCTION public.auth_user_operator_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.auth_user_operator_id() FROM authenticated;

-- ---------------------------------------------------------------------------
-- 3. BUG-02: Re-crear la política de RLS operator_staff_read_same_operator_users sin recursión
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "operator_staff_read_same_operator_users" ON public.users;

CREATE POLICY "operator_staff_read_same_operator_users" ON public.users
  FOR SELECT TO authenticated
  USING (
    public.auth_user_role() = 'operator_staff'
    AND operator_id = public.auth_user_operator_id()
  );
