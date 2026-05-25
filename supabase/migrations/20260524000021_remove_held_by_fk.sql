-- =============================================================================
-- Migration: 20260524000021_remove_held_by_fk
-- 
-- El flujo de guest checkout ahora usa sessionId (UUID generado en el cliente
-- y guardado en localStorage) en lugar de auth.uid().
-- 
-- El campo held_by ya no necesita referenciar auth.users — es simplemente
-- un UUID identificador de la sesión del navegador.
-- =============================================================================

ALTER TABLE public.seats_status
  DROP CONSTRAINT IF EXISTS seats_status_held_by_fkey;

COMMENT ON COLUMN public.seats_status.held_by IS
  'UUID de la sesión del navegador (sessionId de localStorage) que tiene el asiento en hold. Ya no referencia auth.users.';
