-- =============================================================================
-- Migration: 20260524000007_create_tickets
-- Se crea ANTES de seats_status porque seats_status.ticket_id referencia tickets.
-- =============================================================================

CREATE TABLE public.tickets (
  id                      uuid                    PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  trip_id                 uuid                    NOT NULL REFERENCES public.trips (id) ON DELETE RESTRICT,
  seat_number             text                    NOT NULL,
  passenger_name          text                    NOT NULL,
  passenger_id_number     text                    NOT NULL,
  qr_token                uuid                    NOT NULL UNIQUE DEFAULT extensions.uuid_generate_v4(),
  sold_by_channel         public.sold_by_channel  NOT NULL,
  sold_by_user_id         uuid                    REFERENCES public.users (id) ON DELETE SET NULL,
  status                  public.ticket_status    NOT NULL DEFAULT 'active',
  replaced_by_ticket_id   uuid                    REFERENCES public.tickets (id) ON DELETE SET NULL,
  price_paid_usd          numeric(10,2)           NOT NULL CHECK (price_paid_usd >= 0),
  created_at              timestamptz             NOT NULL DEFAULT now(),
  updated_at              timestamptz             NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.tickets                       IS 'Boletos emitidos para cada viaje';
COMMENT ON COLUMN public.tickets.qr_token              IS 'UUID v4 único para generar el QR — nunca reutilizar';
COMMENT ON COLUMN public.tickets.passenger_id_number   IS 'Cédula de identidad del pasajero (ej: V-12345678)';
COMMENT ON COLUMN public.tickets.replaced_by_ticket_id IS 'FK al nuevo ticket cuando este fue reemplazado en taquilla';
COMMENT ON COLUMN public.tickets.sold_by_channel       IS 'web: vendido online por el cliente; office: vendido en taquilla';

-- Índices
CREATE INDEX idx_tickets_trip_id         ON public.tickets (trip_id);
CREATE INDEX idx_tickets_sold_by_user_id ON public.tickets (sold_by_user_id) WHERE sold_by_user_id IS NOT NULL;
CREATE INDEX idx_tickets_status          ON public.tickets (status);
CREATE UNIQUE INDEX idx_tickets_qr_token ON public.tickets (qr_token);
CREATE INDEX idx_tickets_passenger_id    ON public.tickets (passenger_id_number);
CREATE INDEX idx_tickets_replaced_by     ON public.tickets (replaced_by_ticket_id) WHERE replaced_by_ticket_id IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_tickets" ON public.tickets
  FOR ALL TO authenticated
  USING     (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

-- operator_staff: tickets de viajes de su operador
CREATE POLICY "operator_staff_read_own_operator_tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (
    public.auth_user_role() = 'operator_staff'
    AND trip_id IN (
      SELECT t.id FROM public.trips t
      JOIN public.routes r ON r.id = t.route_id
      WHERE r.operator_id = (SELECT operator_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "operator_staff_insert_tickets" ON public.tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    public.auth_user_role() = 'operator_staff'
    AND sold_by_channel = 'office'
  );

CREATE POLICY "operator_staff_update_own_operator_tickets" ON public.tickets
  FOR UPDATE TO authenticated
  USING (
    public.auth_user_role() = 'operator_staff'
    AND trip_id IN (
      SELECT t.id FROM public.trips t
      JOIN public.routes r ON r.id = t.route_id
      WHERE r.operator_id = (SELECT operator_id FROM public.users WHERE id = auth.uid())
    )
  );

-- driver: lee tickets de sus viajes asignados (para validación QR)
CREATE POLICY "driver_read_own_trip_tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (
    public.auth_user_role() = 'driver'
    AND trip_id IN (
      SELECT id FROM public.trips WHERE driver_id = auth.uid()
    )
  );

CREATE POLICY "driver_update_boarded_status" ON public.tickets
  FOR UPDATE TO authenticated
  USING (
    public.auth_user_role() = 'driver'
    AND trip_id IN (
      SELECT id FROM public.trips WHERE driver_id = auth.uid()
    )
  )
  WITH CHECK (status = 'boarded');

-- customer: sus propios tickets
CREATE POLICY "customer_read_own_tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (
    public.auth_user_role() = 'customer'
    AND sold_by_user_id = auth.uid()
  );

CREATE POLICY "customer_insert_tickets" ON public.tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    public.auth_user_role() = 'customer'
    AND sold_by_channel = 'web'
    AND sold_by_user_id = auth.uid()
  );
