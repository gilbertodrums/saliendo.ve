-- =============================================================================
-- Migration: 20260524000011_rpc_hold_release_seat
-- hold_seat y release_seat — operaciones atómicas sobre seats_status
-- =============================================================================

-- ---------------------------------------------------------------------------
-- RPC: hold_seat
-- Adquiere un hold atómico sobre un asiento disponible.
-- Devuelve held_until si tuvo éxito.
-- Lanza excepción 'SEAT_NOT_AVAILABLE' si el asiento ya no está libre.
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
  'Reserva atómica de asiento por 10 minutos. Lanza SEAT_NOT_AVAILABLE si el asiento no está libre.';

-- ---------------------------------------------------------------------------
-- RPC: release_seat
-- Libera el hold de un asiento. Solo puede hacerlo el usuario que lo tiene.
-- Devuelve true si se liberó, false si no era suyo o no estaba en hold.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_seat(
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
      USING HINT = 'Debes iniciar sesión';
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
  'Libera el hold de un asiento. Solo el usuario que lo tiene puede liberarlo.';
