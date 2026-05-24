-- =============================================================================
-- Migration: 20260524000010_create_audit_log
-- Solo INSERT (append-only). Nadie puede UPDATE ni DELETE registros de auditoría.
-- =============================================================================

CREATE TABLE public.audit_log (
  id              uuid        PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  actor_user_id   uuid        REFERENCES public.users (id) ON DELETE SET NULL,
  action          text        NOT NULL,
  entity_type     text        NOT NULL,
  entity_id       text        NOT NULL,
  before_json     jsonb,
  after_json      jsonb,
  ip_address      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.audit_log              IS 'Log inmutable de operaciones críticas (replace_ticket, cancel, etc.)';
COMMENT ON COLUMN public.audit_log.action       IS 'Verbo de la acción: replace_ticket | cancel_ticket | update_trip_status | etc.';
COMMENT ON COLUMN public.audit_log.entity_type  IS 'Tipo de entidad afectada: ticket | trip | seat | etc.';
COMMENT ON COLUMN public.audit_log.entity_id    IS 'UUID (como text) de la entidad afectada';
COMMENT ON COLUMN public.audit_log.before_json  IS 'Estado del registro antes del cambio (snapshot completo)';
COMMENT ON COLUMN public.audit_log.after_json   IS 'Estado del registro después del cambio';
COMMENT ON COLUMN public.audit_log.ip_address   IS 'IP del request (capturada desde el Route Handler si está disponible)';

-- Índices
CREATE INDEX idx_audit_log_actor_user_id ON public.audit_log (actor_user_id) WHERE actor_user_id IS NOT NULL;
CREATE INDEX idx_audit_log_entity        ON public.audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at    ON public.audit_log (created_at DESC);

-- RLS (append-only: INSERT solo via RPCs SECURITY DEFINER, SELECT para admin y operator_staff)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_audit_log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.auth_user_role() = 'admin');

CREATE POLICY "operator_staff_read_own_audit" ON public.audit_log
  FOR SELECT TO authenticated
  USING (
    public.auth_user_role() = 'operator_staff'
    AND actor_user_id IN (
      SELECT id FROM public.users
      WHERE operator_id = (SELECT operator_id FROM public.users WHERE id = auth.uid())
    )
  );

-- Solo admin puede insertar directamente; las RPCs lo hacen vía SECURITY DEFINER
CREATE POLICY "service_insert_audit_log" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.auth_user_role() = 'admin');
