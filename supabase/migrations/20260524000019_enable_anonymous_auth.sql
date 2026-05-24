-- =============================================================================
-- Migration: 20260524000019_enable_anonymous_auth
-- Permite compra de boletos sin registro previo (flujo guest / invitado).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Ajustar el trigger handle_new_user para que SOLO inserte en public.users
--    si el usuario tiene email (no anónimos)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo crear perfil en public.users si el usuario tiene email.
  -- Los usuarios anónimos NO tienen email y no deben tener fila en public.users
  -- hasta que vinculen su cuenta via OTP.
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      'customer'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Crea fila en public.users al registrarse un usuario con email. Los anónimos se omiten hasta vincular email.';

-- ---------------------------------------------------------------------------
-- 2. DROP + recrear hold_seat con soporte de usuarios anónimos
--    (la versión anterior de migration 018 ya tiene return type timestamptz,
--     así que solo necesitamos CREATE OR REPLACE)
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
  -- Validar que hay un usuario autenticado (incluye anónimos)
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED'
      USING HINT = 'Se requiere sesión para reservar un asiento';
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

  -- Proactivamente liberar el hold para este asiento si ya expiró
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
  UPDATE public.seats_status
  SET
    status     = 'available',
    held_by    = NULL,
    held_until = NULL
  WHERE trip_id    = p_trip_id
    AND held_by    = v_user_id
    AND status     = 'held';

  -- Adquirir el hold de forma atómica
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
  'Reserva atómica de asiento por 10 minutos. Acepta usuarios anónimos. Libera proactivamente holds expirados.';

-- Garantizar acceso para usuarios autenticados (incluye anónimos de Supabase)
GRANT EXECUTE ON FUNCTION public.hold_seat(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. DROP + recrear release_seat manteniendo return type boolean
--    (original retorna boolean, NO void — hay que mantenerlo consistente)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.release_seat(uuid, text);

CREATE FUNCTION public.release_seat(
  p_trip_id     uuid,
  p_seat_number text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_affected integer;
  v_user_id       uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED'
      USING HINT = 'Se requiere sesión para liberar un asiento';
  END IF;

  UPDATE public.seats_status
  SET
    status     = 'available',
    held_by    = NULL,
    held_until = NULL
  WHERE trip_id     = p_trip_id
    AND seat_number = p_seat_number
    AND status      = 'held'
    AND held_by     = v_user_id;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  RETURN v_rows_affected > 0;
END;
$$;

COMMENT ON FUNCTION public.release_seat(uuid, text) IS
  'Libera el hold de un asiento. Acepta usuarios anónimos. Retorna true si se liberó.';

GRANT EXECUTE ON FUNCTION public.release_seat(uuid, text) TO authenticated;

