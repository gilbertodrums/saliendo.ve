-- =============================================================================
-- Migration: 20260524000016_security_hardening
-- 1. Fijar search_path en set_updated_at
-- 2. Revocar EXECUTE de anon en todas las RPCs SECURITY DEFINER
-- 3. Agregar índices faltantes detectados por get_advisors (performance)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Fix: set_updated_at con search_path fijo
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Revocar EXECUTE de anon y authenticated en funciones internas
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.auth_user_role()                               FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                              FROM anon;
REVOKE EXECUTE ON FUNCTION public.hold_seat(uuid, text)                          FROM anon;
REVOKE EXECUTE ON FUNCTION public.release_seat(uuid, text)                       FROM anon;
REVOKE EXECUTE ON FUNCTION public.confirm_ticket(uuid, text, jsonb, jsonb, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.validate_qr(uuid)                              FROM anon;
REVOKE EXECUTE ON FUNCTION public.replace_ticket(uuid, text)                     FROM anon;

-- auth_user_role y handle_new_user son funciones internas, no RPCs de usuario
REVOKE EXECUTE ON FUNCTION public.auth_user_role() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- ---------------------------------------------------------------------------
-- 3. Índices faltantes detectados por performance advisor
-- ---------------------------------------------------------------------------

-- seats_status.held_by (FK a users sin índice)
CREATE INDEX IF NOT EXISTS idx_seats_status_held_by
  ON public.seats_status (held_by)
  WHERE held_by IS NOT NULL;

-- seats_status.ticket_id (FK a tickets sin índice)
CREATE INDEX IF NOT EXISTS idx_seats_status_ticket_id
  ON public.seats_status (ticket_id)
  WHERE ticket_id IS NOT NULL;

-- tickets.replaced_by_ticket_id (FK auto-referencial)
CREATE INDEX IF NOT EXISTS idx_tickets_replaced_by
  ON public.tickets (replaced_by_ticket_id)
  WHERE replaced_by_ticket_id IS NOT NULL;

-- payments.processed_by_user_id
CREATE INDEX IF NOT EXISTS idx_payments_processed_by
  ON public.payments (processed_by_user_id)
  WHERE processed_by_user_id IS NOT NULL;

-- audit_log.actor_user_id
CREATE INDEX IF NOT EXISTS idx_audit_log_actor
  ON public.audit_log (actor_user_id)
  WHERE actor_user_id IS NOT NULL;
