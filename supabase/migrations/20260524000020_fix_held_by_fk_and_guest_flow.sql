-- =============================================================================
-- Migration: 20260524000020_fix_held_by_fk_and_guest_flow
-- 
-- BUG REAL: seats_status.held_by referencia public.users(id) pero los
-- usuarios anónimos de Supabase solo tienen fila en auth.users, NO en
-- public.users. Esto causa una violación de FK cuando hold_seat intenta
-- escribir held_by = auth.uid() de un usuario anónimo.
--
-- FIX: Cambiar el FK para que apunte a auth.users(id) directamente.
-- =============================================================================

-- 1. Eliminar la constraint FK actual
ALTER TABLE public.seats_status
  DROP CONSTRAINT IF EXISTS seats_status_held_by_fkey;

-- 2. Re-agregar el FK apuntando a auth.users (no public.users)
--    Los usuarios anónimos SÍ tienen fila en auth.users.
ALTER TABLE public.seats_status
  ADD CONSTRAINT seats_status_held_by_fkey
  FOREIGN KEY (held_by)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.seats_status.held_by IS
  'UUID del usuario (auth.users) que tiene el asiento en hold. Acepta usuarios anónimos y registrados.';
