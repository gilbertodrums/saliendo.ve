-- =============================================================================
-- Migration: 20260524000001_extensions_and_enums
-- Habilita extensiones necesarias y crea todos los enums del dominio
-- =============================================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"     WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto"      WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_cron"       WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS "moddatetime"   WITH SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM (
  'admin',
  'operator_staff',
  'driver',
  'customer'
);
COMMENT ON TYPE public.user_role IS 'Roles de usuario en el sistema saliendo.ve';

CREATE TYPE public.trip_status AS ENUM (
  'scheduled',
  'boarding',
  'departed',
  'cancelled'
);
COMMENT ON TYPE public.trip_status IS 'Estado del viaje a lo largo de su ciclo de vida';

CREATE TYPE public.seat_status AS ENUM (
  'available',
  'held',
  'sold',
  'blocked'
);
COMMENT ON TYPE public.seat_status IS 'Estado de un asiento en un viaje específico';

CREATE TYPE public.ticket_status AS ENUM (
  'active',
  'boarded',
  'cancelled',
  'replaced'
);
COMMENT ON TYPE public.ticket_status IS 'Estado de un ticket después de su emisión';

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'mock_paid',
  'failed',
  'refunded'
);
COMMENT ON TYPE public.payment_status IS 'Estado del pago (mock en Fase 1, se expande en Fase 3)';

CREATE TYPE public.sold_by_channel AS ENUM (
  'web',
  'office'
);
COMMENT ON TYPE public.sold_by_channel IS 'Canal por el que se vendió el ticket';

CREATE TYPE public.payment_method AS ENUM (
  'cash_bs',
  'cash_usd',
  'transfer_bs',
  'mock_card'
);
COMMENT ON TYPE public.payment_method IS 'Método de pago registrado';
