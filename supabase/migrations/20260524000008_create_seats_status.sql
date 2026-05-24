-- =============================================================================
-- Migration: 20260524000008_create_seats_status
-- PK compuesta (trip_id, seat_number). FK a tickets ya existe.
-- =============================================================================

CREATE TABLE public.seats_status (
  trip_id      uuid              NOT NULL REFERENCES public.trips   (id) ON DELETE CASCADE,
  seat_number  text              NOT NULL,
  status       public.seat_status NOT NULL DEFAULT 'available',
  held_by      uuid              REFERENCES public.users  (id) ON DELETE SET NULL,
  held_until   timestamptz,
  ticket_id    uuid              REFERENCES public.tickets (id) ON DELETE SET NULL,
  updated_at   timestamptz       NOT NULL DEFAULT now(),

  PRIMARY KEY (trip_id, seat_number),

  -- Consistencia: held_by y held_until solo tienen valor cuando status='held'
  CONSTRAINT chk_held_fields CHECK (
    (status = 'held' AND held_by IS NOT NULL AND held_until IS NOT NULL)
    OR (status != 'held' AND held_by IS NULL AND held_until IS NULL)
  ),
  -- Consistencia: ticket_id solo tiene valor cuando status='sold'
  CONSTRAINT chk_ticket_field CHECK (
    (status = 'sold' AND ticket_id IS NOT NULL)
    OR (status != 'sold')
  )
);

COMMENT ON TABLE  public.seats_status             IS 'Estado en tiempo real de cada asiento para cada viaje. PK compuesta (trip_id, seat_number).';
COMMENT ON COLUMN public.seats_status.held_by     IS 'UUID del usuario que tiene el asiento en hold (10 min)';
COMMENT ON COLUMN public.seats_status.held_until  IS 'Expiración del hold; pg_cron libera los expirados cada 60s';
COMMENT ON COLUMN public.seats_status.ticket_id   IS 'FK al ticket cuando el asiento ya fue vendido';

-- Índice crítico para el cron de liberación de holds expirados
CREATE INDEX idx_seats_held_until ON public.seats_status (held_until)
  WHERE status = 'held';

-- Índice para Realtime filtered por trip_id
CREATE INDEX idx_seats_trip_id ON public.seats_status (trip_id);

-- Índices de FKs detectados por advisor
CREATE INDEX idx_seats_status_held_by   ON public.seats_status (held_by)    WHERE held_by IS NOT NULL;
CREATE INDEX idx_seats_status_ticket_id ON public.seats_status (ticket_id)  WHERE ticket_id IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER trg_seats_status_updated_at
  BEFORE UPDATE ON public.seats_status
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.seats_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_seats_status" ON public.seats_status
  FOR ALL TO authenticated
  USING     (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

CREATE POLICY "operator_staff_manage_own_seats" ON public.seats_status
  FOR ALL TO authenticated
  USING (
    public.auth_user_role() = 'operator_staff'
    AND trip_id IN (
      SELECT t.id FROM public.trips t
      JOIN public.routes r ON r.id = t.route_id
      WHERE r.operator_id = (SELECT operator_id FROM public.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    public.auth_user_role() = 'operator_staff'
    AND trip_id IN (
      SELECT t.id FROM public.trips t
      JOIN public.routes r ON r.id = t.route_id
      WHERE r.operator_id = (SELECT operator_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "driver_read_own_trip_seats" ON public.seats_status
  FOR SELECT TO authenticated
  USING (
    public.auth_user_role() = 'driver'
    AND trip_id IN (
      SELECT id FROM public.trips WHERE driver_id = auth.uid()
    )
  );

-- customer y anon: lectura pública del estado de asientos (para el mapa)
CREATE POLICY "authenticated_read_seats" ON public.seats_status
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "anon_read_seats" ON public.seats_status
  FOR SELECT TO anon
  USING (true);

-- customer: puede hacer hold/release de sus propios asientos (via RPC SECURITY DEFINER)
CREATE POLICY "customer_update_own_held_seat" ON public.seats_status
  FOR UPDATE TO authenticated
  USING (held_by = auth.uid() OR status = 'available')
  WITH CHECK (
    (status = 'held' AND held_by = auth.uid())
    OR (status = 'available' AND held_by IS NULL)
  );
