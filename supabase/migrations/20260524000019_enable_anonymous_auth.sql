-- =============================================================================
-- Migration: 20260524000019_enable_anonymous_auth
-- Permite compra de boletos sin registro previo (flujo guest / invitado).
--
-- Estrategia:
--   1. El FK seats_status.held_by ya referencia auth.users(id) — esto está OK
--      porque los usuarios anónimos de Supabase SÍ tienen fila en auth.users.
--
--   2. El trigger handle_new_user en public.users solo se dispara para usuarios
--      que tienen email. Los usuarios anónimos NO tienen email, por lo que
--      NO se crea fila en public.users — lo cual es intencional.
--
--   3. La función hold_seat es SECURITY DEFINER, por lo que puede escribir
--      en seats_status con auth.uid() de cualquier usuario, incluyendo anónimos.
--
--   4. Necesitamos que el hold_seat funcione aunque el usuario anónimo NO
--      tenga fila en public.users. Actualizamos la función para NO requerir
--      perfil en public.users.
--
--   5. Permitimos que anon (antes de signInAnonymously, solo el cliente real)
--      y authenticated (incluye anónimos) puedan ejecutar hold_seat.
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
  -- Solo crear perfil en public.users si el usuario tiene email
  -- Los usuarios anónimos (is_anonymous=true) NO tienen email
  -- y NO deben tener fila en public.users hasta que vinculen su cuenta.
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
  'Crea fila en public.users al registrarse un nuevo usuario en auth.users con email. Los usuarios anónimos (is_anonymous=true) se omiten hasta que vinculen un email.';

-- ---------------------------------------------------------------------------
-- 2. Actualizar hold_seat para NO verificar existencia en public.users
--    Los usuarios anónimos tienen auth.uid() válido en auth.users pero
--    no necesariamente en public.users.
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

  -- Proactivamente liberar el hold para este asiento específico si ya expiró.
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
  'Reserva atómica de asiento por 10 minutos. Acepta usuarios anónimos (is_anonymous=true). Libera proactivamente holds expirados.';

-- Permitir que usuarios autenticados (incluyendo anónimos) ejecuten hold_seat
GRANT EXECUTE ON FUNCTION public.hold_seat(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Actualizar release_seat de forma similar
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_seat(
  p_trip_id     uuid,
  p_seat_number text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
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
    AND held_by     = v_user_id
    AND status      = 'held';
END;
$$;

COMMENT ON FUNCTION public.release_seat(uuid, text) IS
  'Libera el hold de un asiento por el usuario autenticado (incluyendo anónimos).';

GRANT EXECUTE ON FUNCTION public.release_seat(uuid, text) TO authenticated;
