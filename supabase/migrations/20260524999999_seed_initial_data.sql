-- =============================================================================
-- Seed: 20260524999999_seed_initial_data
-- 2 operadores, 3 buses, 4 rutas, 6 trips, seats_status poblado
-- Todos los UUIDs son fijos para que el seed sea reproducible.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- OPERADORES
-- ---------------------------------------------------------------------------
INSERT INTO public.operators (id, name, logo_url, contact_phone, contact_email, rif, is_active)
VALUES
  (
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Aeroexpresos Ejecutivos',
    NULL,
    '+58-212-555-0101',
    'info@aeroexpresos.com.ve',
    'J-00123456-7',
    true
  ),
  (
    'aaaaaaaa-0002-0002-0002-000000000002',
    'Expresos Occidente',
    NULL,
    '+58-261-555-0202',
    'info@expresosoccidente.com.ve',
    'J-00234567-8',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- BUSES (layout_json: 4 columnas [A,B,C,D], filas 1..N = total asientos)
-- Columnas A-B a la izquierda del pasillo, C-D a la derecha.
-- x: 0=A, 1=B, pasillo, 2=C, 3=D
-- ---------------------------------------------------------------------------

-- Bus 1 — Aeroexpresos, 40 asientos standard (10 filas x 4 columnas)
INSERT INTO public.buses (id, operator_id, plate, brand, model, year, total_seats, layout_json, is_active)
VALUES (
  'bbbbbbbb-0001-0001-0001-000000000001',
  'aaaaaaaa-0001-0001-0001-000000000001',
  'ABC-123',
  'Mercedes-Benz',
  'OF-1721',
  2020,
  40,
  jsonb_build_object(
    'columns', 4,
    'rows',    10,
    'seats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'number', (row_n + 1)::text || col_letter,
          'x',      col_x,
          'y',      row_n,
          'type',   'standard'
        )
      )
      FROM generate_series(0, 9) AS row_n,
      (VALUES (0,'A'),(1,'B'),(2,'C'),(3,'D')) AS cols(col_x, col_letter)
    )
  ),
  true
)
ON CONFLICT (id) DO NOTHING;

-- Bus 2 — Aeroexpresos, 44 asientos: fila 1 premium, resto standard (11 filas x 4)
INSERT INTO public.buses (id, operator_id, plate, brand, model, year, total_seats, layout_json, is_active)
VALUES (
  'bbbbbbbb-0002-0002-0002-000000000002',
  'aaaaaaaa-0001-0001-0001-000000000001',
  'DEF-456',
  'Yutong',
  'ZK6122H9',
  2022,
  44,
  jsonb_build_object(
    'columns', 4,
    'rows',    11,
    'seats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'number', (row_n + 1)::text || col_letter,
          'x',      col_x,
          'y',      row_n,
          'type',   CASE WHEN row_n = 0 THEN 'premium' ELSE 'standard' END
        )
      )
      FROM generate_series(0, 10) AS row_n,
      (VALUES (0,'A'),(1,'B'),(2,'C'),(3,'D')) AS cols(col_x, col_letter)
    )
  ),
  true
)
ON CONFLICT (id) DO NOTHING;

-- Bus 3 — Expresos Occidente, 40 asientos standard (10 filas x 4 columnas)
INSERT INTO public.buses (id, operator_id, plate, brand, model, year, total_seats, layout_json, is_active)
VALUES (
  'bbbbbbbb-0003-0003-0003-000000000003',
  'aaaaaaaa-0002-0002-0002-000000000002',
  'GHI-789',
  'Scania',
  'K410',
  2021,
  40,
  jsonb_build_object(
    'columns', 4,
    'rows',    10,
    'seats', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'number', (row_n + 1)::text || col_letter,
          'x',      col_x,
          'y',      row_n,
          'type',   'standard'
        )
      )
      FROM generate_series(0, 9) AS row_n,
      (VALUES (0,'A'),(1,'B'),(2,'C'),(3,'D')) AS cols(col_x, col_letter)
    )
  ),
  true
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RUTAS
-- ---------------------------------------------------------------------------
INSERT INTO public.routes
  (id, operator_id, origin_city, destination_city, origin_terminal, destination_terminal, estimated_duration_minutes, distance_km, is_active)
VALUES
  (
    'cccccccc-0001-0001-0001-000000000001',
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Caracas', 'Maracaibo',
    'Terminal La Bandera', 'Terminal Maracaibo',
    600, 695.0, true
  ),
  (
    'cccccccc-0002-0002-0002-000000000002',
    'aaaaaaaa-0001-0001-0001-000000000001',
    'Caracas', 'Valencia',
    'Terminal La Bandera', 'Terminal Valencia',
    150, 170.0, true
  ),
  (
    'cccccccc-0003-0003-0003-000000000003',
    'aaaaaaaa-0002-0002-0002-000000000002',
    'Caracas', 'Maracay',
    'Terminal La Bandera', 'Terminal Maracay',
    120, 115.0, true
  ),
  (
    'cccccccc-0004-0004-0004-000000000004',
    'aaaaaaaa-0002-0002-0002-000000000002',
    'Caracas', 'Barquisimeto',
    'Terminal La Bandera', 'Terminal Barquisimeto',
    330, 360.0, true
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- TRIPS — 6 viajes en los próximos 7 días
-- departure_at usa now() + interval para que siempre estén en el futuro
-- ---------------------------------------------------------------------------
INSERT INTO public.trips
  (id, route_id, bus_id, base_price_usd, departure_at, estimated_arrival_at, status, amenities_json)
VALUES
  -- Trip 1: Caracas→Maracaibo mañana temprano (Bus 1, AeroExpresos)
  (
    'dddddddd-0001-0001-0001-000000000001',
    'cccccccc-0001-0001-0001-000000000001',
    'bbbbbbbb-0001-0001-0001-000000000001',
    45.00,
    (now() + interval '1 day')::date + time '06:00:00',
    (now() + interval '1 day')::date + time '16:00:00',
    'scheduled',
    '{"wifi":true,"ac":true,"usb":true,"toilet":true,"snacks":false}'::jsonb
  ),
  -- Trip 2: Caracas→Maracaibo en 3 días noche (Bus 2, AeroExpresos, premium)
  (
    'dddddddd-0002-0002-0002-000000000002',
    'cccccccc-0001-0001-0001-000000000001',
    'bbbbbbbb-0002-0002-0002-000000000002',
    50.00,
    (now() + interval '3 days')::date + time '22:00:00',
    (now() + interval '4 days')::date + time '08:00:00',
    'scheduled',
    '{"wifi":true,"ac":true,"usb":true,"toilet":true,"snacks":true}'::jsonb
  ),
  -- Trip 3: Caracas→Valencia mañana (Bus 1, AeroExpresos)
  (
    'dddddddd-0003-0003-0003-000000000003',
    'cccccccc-0002-0002-0002-000000000002',
    'bbbbbbbb-0001-0001-0001-000000000001',
    15.00,
    (now() + interval '1 day')::date + time '08:00:00',
    (now() + interval '1 day')::date + time '10:30:00',
    'scheduled',
    '{"wifi":false,"ac":true,"usb":false,"toilet":false,"snacks":false}'::jsonb
  ),
  -- Trip 4: Caracas→Valencia en 5 días (Bus 2, AeroExpresos)
  (
    'dddddddd-0004-0004-0004-000000000004',
    'cccccccc-0002-0002-0002-000000000002',
    'bbbbbbbb-0002-0002-0002-000000000002',
    18.00,
    (now() + interval '5 days')::date + time '14:00:00',
    (now() + interval '5 days')::date + time '16:30:00',
    'scheduled',
    '{"wifi":true,"ac":true,"usb":true,"toilet":false,"snacks":false}'::jsonb
  ),
  -- Trip 5: Caracas→Maracay pasado mañana (Bus 3, Expresos Occidente)
  (
    'dddddddd-0005-0005-0005-000000000005',
    'cccccccc-0003-0003-0003-000000000003',
    'bbbbbbbb-0003-0003-0003-000000000003',
    12.00,
    (now() + interval '2 days')::date + time '07:00:00',
    (now() + interval '2 days')::date + time '09:00:00',
    'scheduled',
    '{"wifi":false,"ac":true,"usb":false,"toilet":false,"snacks":false}'::jsonb
  ),
  -- Trip 6: Caracas→Barquisimeto en 4 días (Bus 3, Expresos Occidente)
  (
    'dddddddd-0006-0006-0006-000000000006',
    'cccccccc-0004-0004-0004-000000000004',
    'bbbbbbbb-0003-0003-0003-000000000003',
    25.00,
    (now() + interval '4 days')::date + time '18:00:00',
    (now() + interval '4 days')::date + time '23:30:00',
    'scheduled',
    '{"wifi":false,"ac":true,"usb":true,"toilet":false,"snacks":false}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SEATS_STATUS — poblar todos los asientos de cada trip como 'available'
-- Extraemos seat numbers del layout_json del bus correspondiente.
-- ---------------------------------------------------------------------------

-- Trip 1 → Bus 1 (40 asientos)
INSERT INTO public.seats_status (trip_id, seat_number, status)
SELECT
  'dddddddd-0001-0001-0001-000000000001',
  seat->>'number',
  'available'
FROM public.buses b,
     jsonb_array_elements(b.layout_json->'seats') AS seat
WHERE b.id = 'bbbbbbbb-0001-0001-0001-000000000001'
ON CONFLICT (trip_id, seat_number) DO NOTHING;

-- Trip 2 → Bus 2 (44 asientos)
INSERT INTO public.seats_status (trip_id, seat_number, status)
SELECT
  'dddddddd-0002-0002-0002-000000000002',
  seat->>'number',
  'available'
FROM public.buses b,
     jsonb_array_elements(b.layout_json->'seats') AS seat
WHERE b.id = 'bbbbbbbb-0002-0002-0002-000000000002'
ON CONFLICT (trip_id, seat_number) DO NOTHING;

-- Trip 3 → Bus 1 (40 asientos)
INSERT INTO public.seats_status (trip_id, seat_number, status)
SELECT
  'dddddddd-0003-0003-0003-000000000003',
  seat->>'number',
  'available'
FROM public.buses b,
     jsonb_array_elements(b.layout_json->'seats') AS seat
WHERE b.id = 'bbbbbbbb-0001-0001-0001-000000000001'
ON CONFLICT (trip_id, seat_number) DO NOTHING;

-- Trip 4 → Bus 2 (44 asientos)
INSERT INTO public.seats_status (trip_id, seat_number, status)
SELECT
  'dddddddd-0004-0004-0004-000000000004',
  seat->>'number',
  'available'
FROM public.buses b,
     jsonb_array_elements(b.layout_json->'seats') AS seat
WHERE b.id = 'bbbbbbbb-0002-0002-0002-000000000002'
ON CONFLICT (trip_id, seat_number) DO NOTHING;

-- Trip 5 → Bus 3 (40 asientos)
INSERT INTO public.seats_status (trip_id, seat_number, status)
SELECT
  'dddddddd-0005-0005-0005-000000000005',
  seat->>'number',
  'available'
FROM public.buses b,
     jsonb_array_elements(b.layout_json->'seats') AS seat
WHERE b.id = 'bbbbbbbb-0003-0003-0003-000000000003'
ON CONFLICT (trip_id, seat_number) DO NOTHING;

-- Trip 6 → Bus 3 (40 asientos)
INSERT INTO public.seats_status (trip_id, seat_number, status)
SELECT
  'dddddddd-0006-0006-0006-000000000006',
  seat->>'number',
  'available'
FROM public.buses b,
     jsonb_array_elements(b.layout_json->'seats') AS seat
WHERE b.id = 'bbbbbbbb-0003-0003-0003-000000000003'
ON CONFLICT (trip_id, seat_number) DO NOTHING;
