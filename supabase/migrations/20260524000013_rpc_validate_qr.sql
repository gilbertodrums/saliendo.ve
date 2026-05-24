-- =============================================================================
-- Migration: 20260524000013_rpc_validate_qr
-- Solo el driver de ese trip puede validar. Cambia status a 'boarded'.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_qr(
  p_qr_token uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid;
  v_user_role public.user_role;
  v_ticket    public.tickets%ROWTYPE;
BEGIN
  v_user_id   := auth.uid();
  v_user_role := public.auth_user_role();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  -- Solo admin y driver pueden validar
  IF v_user_role NOT IN ('admin', 'driver') THEN
    RAISE EXCEPTION 'FORBIDDEN'
      USING HINT = 'Solo el chofer asignado puede validar boletos';
  END IF;

  -- Buscar el ticket
  SELECT * INTO v_ticket
  FROM public.tickets
  WHERE qr_token = p_qr_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QR_NOT_FOUND'
      USING HINT = 'El código QR no corresponde a ningún boleto';
  END IF;

  -- El driver solo puede validar tickets de sus propios viajes
  IF v_user_role = 'driver' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.trips
      WHERE id = v_ticket.trip_id
        AND driver_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'FORBIDDEN'
        USING HINT = 'Este boleto no corresponde a un viaje asignado a vos';
    END IF;
  END IF;

  -- Validar estado del ticket
  IF v_ticket.status = 'boarded' THEN
    RAISE EXCEPTION 'ALREADY_BOARDED'
      USING HINT = 'Este boleto ya fue escaneado';
  END IF;

  IF v_ticket.status IN ('cancelled', 'replaced') THEN
    RAISE EXCEPTION 'TICKET_INVALID'
      USING HINT = format('El boleto está en estado: %s', v_ticket.status);
  END IF;

  IF v_ticket.status != 'active' THEN
    RAISE EXCEPTION 'TICKET_INVALID'
      USING HINT = format('Estado inesperado del boleto: %s', v_ticket.status);
  END IF;

  -- Marcar como abordado
  UPDATE public.tickets
  SET status = 'boarded'
  WHERE id = v_ticket.id
  RETURNING * INTO v_ticket;

  RETURN jsonb_build_object(
    'ticket_id',           v_ticket.id,
    'passenger_name',      v_ticket.passenger_name,
    'passenger_id_number', v_ticket.passenger_id_number,
    'seat_number',         v_ticket.seat_number,
    'trip_id',             v_ticket.trip_id,
    'status',              v_ticket.status
  );
END;
$$;

COMMENT ON FUNCTION public.validate_qr(uuid) IS
  'Valida un QR de boleto y marca al pasajero como abordado. Solo puede ejecutarla el driver asignado al viaje o un admin.';
