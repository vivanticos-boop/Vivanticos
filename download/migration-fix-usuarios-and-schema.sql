-- ==========================================
-- MIGRACIÓN COMPLETA: Arreglar usuarios + crear tablas faltantes
-- Ejecutar en el SQL Editor de Supabase
-- Este script NO borra datos existentes
-- ==========================================

-- ==========================================
-- 1. ARREGLAR TABLA USUARIOS: password_hash NOT NULL
-- ==========================================
-- El problema: password_hash tiene NOT NULL pero la app no lo llena
-- Solución: Hacer password_hash nullable y agregar default

-- Opción A: Hacer password_hash nullable (recomendado)
ALTER TABLE usuarios ALTER COLUMN password_hash DROP NOT NULL;

-- Opción B (alternativa): Agregar default a password_hash
-- ALTER TABLE usuarios ALTER COLUMN password_hash SET DEFAULT '';

-- Actualizar filas existentes que tengan password_hash null pero password con valor
UPDATE usuarios SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL;


-- ==========================================
-- 2. CREAR TABLA CLIENTES (si no existe)
-- ==========================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL DEFAULT '',
  email TEXT,
  direccion TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para búsqueda rápida por nombre
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes (nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes (telefono);

-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política: permitir todo (la app usa anon key)
CREATE POLICY "Allow all operations on clientes" ON clientes
  FOR ALL USING (true) WITH CHECK (true);


-- ==========================================
-- 3. AGREGAR columnas faltantes a COTIZACIONES
-- ==========================================
-- Agregar cliente_direccion si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizaciones' AND column_name = 'cliente_direccion'
  ) THEN
    ALTER TABLE cotizaciones ADD COLUMN cliente_direccion TEXT;
  END IF;
END $$;

-- Agregar cliente_id (FK a clientes) si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cotizaciones' AND column_name = 'cliente_id'
  ) THEN
    ALTER TABLE cotizaciones ADD COLUMN cliente_id UUID REFERENCES clientes(id);
  END IF;
END $$;


-- ==========================================
-- 4. VERIFICAR que la tabla ENTREGAS tiene todas las columnas
-- ==========================================
-- Agregar columna vendedor_id si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entregas' AND column_name = 'vendedor_id'
  ) THEN
    ALTER TABLE entregas ADD COLUMN vendedor_id UUID;
  END IF;
END $$;

-- Agregar columna creado_en si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entregas' AND column_name = 'creado_en'
  ) THEN
    ALTER TABLE entregas ADD COLUMN creado_en TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Agregar columna actualizado_en si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'entregas' AND column_name = 'actualizado_en'
  ) THEN
    ALTER TABLE entregas ADD COLUMN actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;


-- ==========================================
-- 5. INSERTAR datos demo de USUARIOS (si la tabla está vacía)
-- ==========================================
-- Solo insertar si no hay usuarios en la tabla
INSERT INTO usuarios (id, nombre, email, password, password_hash, rol, activo, telefono)
SELECT
  u.id, u.nombre, u.email, u.password, u.password, u.rol, u.activo, u.telefono
FROM (VALUES
  ('66666666-6666-6666-6666-666666666601'::UUID, 'Administrador', 'admin@vivanticos.com', 'Vivanticos2025', 'admin', true, '573001112233'),
  ('66666666-6666-6666-6666-666666666602'::UUID, 'Alejandro Torres', 'jefe@vivanticos.com', 'Vivanticos2025', 'jefe', true, '573002223344'),
  ('66666666-6666-6666-6666-666666666603'::UUID, 'Carolina Vargas', 'vendedor@vivanticos.com', 'Vivanticos2025', 'vendedor', true, '573003334455'),
  ('66666666-6666-6666-6666-666666666604'::UUID, 'Daniela Morales', 'daniela@vivanticos.com', 'Vivanticos2025', 'vendedor', true, '573004445566'),
  ('66666666-6666-6666-6666-666666666605'::UUID, 'Santiago Ramírez', 'santiago@vivanticos.com', 'Vivanticos2025', 'vendedor', false, '573005556677')
) AS u(id, nombre, email, password, rol, activo, telefono)
WHERE NOT EXISTS (SELECT 1 FROM usuarios LIMIT 1);


-- ==========================================
-- VERIFICACIÓN: Consultar las tablas para confirmar
-- ==========================================
-- SELECT * FROM usuarios;
-- SELECT * FROM clientes;
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'cotizaciones' ORDER BY ordinal_position;
