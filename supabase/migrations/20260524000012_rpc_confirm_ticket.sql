-- =============================================================================
-- Migration: 20260524000012_rpc_confirm_ticket
-- Compra definitiva con idempotency key. Todo en una transacción.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.confirm_ticket(
  p_trip_id          uuid,
  p_seat_number      text,
  p_passenger_data   jsonb,
  p_payment_data     jsonb,
  p_idempotency_key  uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id         uuid;
  v_ticket          public.tickets%ROWTYPE;
  v_ticket_id       uuid;
  v_trip_price      numeric(10,2);
  v_passenger_name  text;
  v_passenger_id_no text;
  v_payment_method  public.payment_method;
  v_amount_bs       numeric(14,2);
  v_exchange_rate   numeric(12,4);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED'
      USING HINT = 'Debes iniciar sesión para confirmar la compra';
  END IF;

  -- -------------------------------------------------------------------------
  -- 1. Idempotency check: si ya existe un ticket con esta key como id,
  --    devolverlo sin duplicar (el id del ticket ES la idempotency key)
  -- -------------------------------------------------------------------------
  SELECT * INTO v_ticket
  FROM public.tickets
  WHERE id = p_idempotency_key;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'idempotent', true,
      'ticket', row_to_json(v_ticket)
    );
  END IF;

  -- -------------------------------------------------------------------------
  -- 2. Verificar que el hold es vigente y pertenece a este usuario
  -- -------------------------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM public.seats_status
    WHERE trip_id     = p_trip_id
      AND seat_number = p_seat_number
      AND status      = 'held'
      AND held_by     = v_user_id
      AND held_until  > now()
  ) THEN
    RAISE EXCEPTION 'HOLD_EXPIRED_OR_NOT_FOUND'
      USING HINT = 'El hold del asiento expiró o no existe. Volvé a seleccionar el asiento.';
  END IF;

  -- -------------------------------------------------------------------------
  -- 3. Extraer y validar datos del pasajero
  -- -------------------------------------------------------------------------
  v_passenger_name  := p_passenger_data->>'passenger_name';
  v_passenger_id_no := p_passenger_data->>'passenger_id_number';

  IF v_passenger_name IS NULL OR v_passenger_id_no IS NULL THEN
    RAISE EXCEPTION 'INVALID_PASSENGER_DATA'
      USING HINT = 'Se requieren passenger_name y passenger_id_number';
  END IF;

  -- -------------------------------------------------------------------------
  -- 4. Extraer datos de pago
  -- -------------------------------------------------------------------------
  v_payment_method := (p_payment_data->>'method')::public.payment_method;
  v_amount_bs      := (p_payment_data->>'amount_bs')::numeric;
  v_exchange_rate  := (p_payment_data->>'exchange_rate_bcv')::numeric;

  -- Precio del viaje
  SELECT base_price_usd INTO v_trip_price
  FROM public.trips WHERE id = p_trip_id;

  -- -------------------------------------------------------------------------
  -- 5. Insertar ticket (usando p_idempotency_key como id)
  -- -------------------------------------------------------------------------
  INSERT INTO public.tickets (
    id,
    trip_id,
    seat_number,
    passenger_name,
    passenger_id_number,
    sold_by_channel,
    sold_by_user_id,
    status,
    price_paid_usd
  )
  VALUES (
    p_idempotency_key,
    p_trip_id,
    p_seat_number,
    v_passenger_name,
    v_passenger_id_no,
    'web',
    v_user_id,
    'active',
    v_trip_price
  )
  RETURNING * INTO v_ticket;

  v_ticket_id := v_ticket.id;

  -- -------------------------------------------------------------------------
  -- 6. Insertar payment
  -- -------------------------------------------------------------------------
  INSERT INTO public.payments (
    ticket_id,
    amount_usd,
    amount_bs,
    exchange_rate_bcv,
    method,
    status
  )
  VALUES (
    v_ticket_id,
    v_trip_price,
    v_amount_bs,
    v_exchange_rate,
    COALESCE(v_payment_method, 'mock_card'),
    'mock_paid'
  );

  -- -------------------------------------------------------------------------
  -- 7. Actualizar seats_status a 'sold'
  -- -------------------------------------------------------------------------
  UPDATE public.seats_status
  SET
    status     = 'sold',
    held_by    = NULL,
    held_until = NULL,
    ticket_id  = v_ticket_id
  WHERE trip_id     = p_trip_id
    AND seat_number = p_seat_number
    AND held_by     = v_user_id;

  RETURN jsonb_build_object(
    'idempotent', false,
    'ticket', row_to_json(v_ticket)
  );
END;
$$;

COMMENT ON FUNCTION public.confirm_ticket(uuid, text, jsonb, jsonb, uuid) IS
  'Confirma la compra de un ticket. Verifica hold vigente, aplica idempotency key, inserta ticket+payment y marca el asiento como sold. Todo en una transacción.';
