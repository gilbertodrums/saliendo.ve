-- =============================================================================
-- Migration: 20260524000014_rpc_replace_ticket
-- Reemplaza un ticket en taquilla. Registra audit_log, genera nuevo qr_token,
-- libera el asiento viejo y asigna el nuevo como sold. Todo en transacción.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.replace_ticket(
  p_old_ticket_id   uuid,
  p_new_seat_number text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        uuid;
  v_user_role      public.user_role;
  v_operator_id    uuid;
  v_old_ticket     public.tickets%ROWTYPE;
  v_new_ticket     public.tickets%ROWTYPE;
  v_new_qr_token   uuid;
BEGIN
  v_user_id   := auth.uid();
  v_user_role := public.auth_user_role();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED';
  END IF;

  -- Solo operator_staff y admin pueden reemplazar tickets
  IF v_user_role NOT IN ('admin', 'operator_staff') THEN
    RAISE EXCEPTION 'FORBIDDEN'
      USING HINT = 'Solo el personal de taquilla puede reemplazar boletos';
  END IF;

  -- Cargar el ticket original
  SELECT * INTO v_old_ticket
  FROM public.tickets
  WHERE id = p_old_ticket_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TICKET_NOT_FOUND'
      USING HINT = 'El ticket original no existe';
  END IF;

  -- operator_staff solo puede reemplazar tickets de su operador
  IF v_user_role = 'operator_staff' THEN
    SELECT operator_id INTO v_operator_id
    FROM public.users WHERE id = v_user_id;

    IF NOT EXISTS (
      SELECT 1 FROM public.trips t
      JOIN public.routes r ON r.id = t.route_id
      WHERE t.id = v_old_ticket.trip_id
        AND r.operator_id = v_operator_id
    ) THEN
      RAISE EXCEPTION 'FORBIDDEN'
        USING HINT = 'El ticket no pertenece a tu operador';
    END IF;
  END IF;

  -- El ticket debe estar en estado 'active'
  IF v_old_ticket.status != 'active' THEN
    RAISE EXCEPTION 'TICKET_NOT_REPLACEABLE'
      USING HINT = format('El ticket está en estado %s y no puede reemplazarse', v_old_ticket.status);
  END IF;

  -- El nuevo asiento no puede ser el mismo
  IF p_new_seat_number = v_old_ticket.seat_number THEN
    RAISE EXCEPTION 'SAME_SEAT'
      USING HINT = 'El nuevo asiento debe ser diferente al actual';
  END IF;

  -- Verificar que el nuevo asiento está disponible
  IF NOT EXISTS (
    SELECT 1 FROM public.seats_status
    WHERE trip_id     = v_old_ticket.trip_id
      AND seat_number = p_new_seat_number
      AND status      = 'available'
  ) THEN
    RAISE EXCEPTION 'NEW_SEAT_NOT_AVAILABLE'
      USING HINT = 'El nuevo asiento no está disponible';
  END IF;

  -- -------------------------------------------------------------------------
  -- Registrar en audit_log ANTES de hacer cambios (before_json)
  -- -------------------------------------------------------------------------
  INSERT INTO public.audit_log (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_json,
    after_json
  )
  VALUES (
    v_user_id,
    'replace_ticket',
    'ticket',
    p_old_ticket_id::text,
    row_to_json(v_old_ticket)::jsonb,
    NULL
  );

  -- -------------------------------------------------------------------------
  -- Generar nuevo qr_token
  -- -------------------------------------------------------------------------
  v_new_qr_token := extensions.uuid_generate_v4();

  -- -------------------------------------------------------------------------
  -- Crear el nuevo ticket
  -- -------------------------------------------------------------------------
  INSERT INTO public.tickets (
    trip_id,
    seat_number,
    passenger_name,
    passenger_id_number,
    qr_token,
    sold_by_channel,
    sold_by_user_id,
    status,
    price_paid_usd
  )
  VALUES (
    v_old_ticket.trip_id,
    p_new_seat_number,
    v_old_ticket.passenger_name,
    v_old_ticket.passenger_id_number,
    v_new_qr_token,
    v_old_ticket.sold_by_channel,
    v_user_id,
    'active',
    v_old_ticket.price_paid_usd
  )
  RETURNING * INTO v_new_ticket;

  -- -------------------------------------------------------------------------
  -- Marcar ticket original como reemplazado
  -- -------------------------------------------------------------------------
  UPDATE public.tickets
  SET
    status                = 'replaced',
    replaced_by_ticket_id = v_new_ticket.id
  WHERE id = p_old_ticket_id;

  -- -------------------------------------------------------------------------
  -- Liberar el asiento viejo
  -- -------------------------------------------------------------------------
  UPDATE public.seats_status
  SET
    status     = 'available',
    held_by    = NULL,
    held_until = NULL,
    ticket_id  = NULL
  WHERE trip_id     = v_old_ticket.trip_id
    AND seat_number = v_old_ticket.seat_number;

  -- -------------------------------------------------------------------------
  -- Marcar el nuevo asiento como sold directamente
  -- -------------------------------------------------------------------------
  UPDATE public.seats_status
  SET
    status     = 'sold',
    held_by    = NULL,
    held_until = NULL,
    ticket_id  = v_new_ticket.id
  WHERE trip_id     = v_old_ticket.trip_id
    AND seat_number = p_new_seat_number
    AND status      = 'available';

  -- -------------------------------------------------------------------------
  -- Completar audit_log con after_json
  -- -------------------------------------------------------------------------
  UPDATE public.audit_log
  SET after_json = row_to_json(v_new_ticket)::jsonb
  WHERE actor_user_id = v_user_id
    AND action        = 'replace_ticket'
    AND entity_id     = p_old_ticket_id::text
    AND after_json IS NULL;

  RETURN jsonb_build_object(
    'old_ticket_id', p_old_ticket_id,
    'new_ticket',    row_to_json(v_new_ticket)
  );
END;
$$;

COMMENT ON FUNCTION public.replace_ticket(uuid, text) IS
  'Reemplaza un ticket activo por uno nuevo en otro asiento. Registra audit_log, genera nuevo qr_token, libera asiento viejo y asigna el nuevo. Solo operator_staff y admin.';
