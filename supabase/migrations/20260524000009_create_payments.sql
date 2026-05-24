-- =============================================================================
-- Migration: 20260524000009_create_payments
-- =============================================================================

CREATE TABLE public.payments (
  id                      uuid                    PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  ticket_id               uuid                    NOT NULL UNIQUE REFERENCES public.tickets (id) ON DELETE RESTRICT,
  amount_usd              numeric(10,2)           NOT NULL CHECK (amount_usd >= 0),
  amount_bs               numeric(14,2),
  exchange_rate_bcv       numeric(12,4),
  method                  public.payment_method   NOT NULL,
  status                  public.payment_status   NOT NULL DEFAULT 'pending',
  reference_number        text,
  processed_by_user_id    uuid                    REFERENCES public.users (id) ON DELETE SET NULL,
  created_at              timestamptz             NOT NULL DEFAULT now(),
  updated_at              timestamptz             NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.payments                     IS 'Registro de pagos. Mock en Fase 1; integración real en Fase 3.';
COMMENT ON COLUMN public.payments.ticket_id           IS 'Relación 1:1 con tickets (UNIQUE)';
COMMENT ON COLUMN public.payments.amount_bs           IS 'Monto en bolívares al tipo de cambio del momento';
COMMENT ON COLUMN public.payments.exchange_rate_bcv   IS 'Tipo de cambio BCV usado para la conversión';
COMMENT ON COLUMN public.payments.reference_number    IS 'Referencia del banco o comprobante externo';

-- Índices
CREATE INDEX idx_payments_ticket_id            ON public.payments (ticket_id);
CREATE INDEX idx_payments_status               ON public.payments (status);
CREATE INDEX idx_payments_processed_by_user_id ON public.payments (processed_by_user_id)
  WHERE processed_by_user_id IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_payments" ON public.payments
  FOR ALL TO authenticated
  USING     (public.auth_user_role() = 'admin')
  WITH CHECK (public.auth_user_role() = 'admin');

CREATE POLICY "operator_staff_read_own_payments" ON public.payments
  FOR SELECT TO authenticated
  USING (
    public.auth_user_role() = 'operator_staff'
    AND ticket_id IN (
      SELECT tk.id FROM public.tickets tk
      JOIN public.trips t ON t.id = tk.trip_id
      JOIN public.routes r ON r.id = t.route_id
      WHERE r.operator_id = (SELECT operator_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "operator_staff_insert_payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.auth_user_role() = 'operator_staff'
    AND processed_by_user_id = auth.uid()
  );

CREATE POLICY "customer_read_own_payment" ON public.payments
  FOR SELECT TO authenticated
  USING (
    public.auth_user_role() = 'customer'
    AND ticket_id IN (
      SELECT id FROM public.tickets WHERE sold_by_user_id = auth.uid()
    )
  );

CREATE POLICY "customer_insert_payment" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.auth_user_role() = 'customer'
    AND ticket_id IN (
      SELECT id FROM public.tickets WHERE sold_by_user_id = auth.uid()
    )
  );
