-- ==========================================
-- MIGRACIÓN: Arreglar schema para sincronizar con el frontend
-- Ejecutar en el SQL Editor de Supabase
-- Este script NO borra datos existentes
-- ==========================================

-- 1. ARREGLAR producto_opciones: Cambiar CHECK constraint de tipo
--    De: ('medida', 'colchon', 'lenceria', 'extra')
--    A:  ('select', 'checkbox')
ALTER TABLE producto_opciones DROP CONSTRAINT IF EXISTS producto_opciones_tipo_check;

-- Convertir datos existentes: 'medida','lenceria','extra' → 'select', 'colchon' → 'checkbox'
UPDATE producto_opciones SET tipo = 'select' WHERE tipo IN ('medida', 'lenceria', 'extra');
UPDATE producto_opciones SET tipo = 'checkbox' WHERE tipo = 'colchon';

-- Crear nueva constraint
ALTER TABLE producto_opciones ADD CONSTRAINT producto_opciones_tipo_check
  CHECK (tipo IN ('select', 'checkbox'));

-- 2. AGREGAR columnas faltantes a productos: tipo_producto y descuento_base
ALTER TABLE productos ADD COLUMN IF NOT EXISTS tipo_producto TEXT NOT NULL DEFAULT 'otro'
  CHECK (tipo_producto IN ('cuna', 'colchon', 'lenceria', 'cambiador', 'cama', 'ropero', 'escritorio', 'accesorio', 'otro'));
ALTER TABLE productos ADD COLUMN IF NOT EXISTS descuento_base INTEGER DEFAULT 0;

-- 3. AGREGAR columnas faltantes a cotizacion_items: configuracion, precio_total_item, descuento_aplicado
ALTER TABLE cotizacion_items ADD COLUMN IF NOT EXISTS configuracion JSONB DEFAULT '{}';
ALTER TABLE cotizacion_items ADD COLUMN IF NOT EXISTS precio_total_item INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cotizacion_items ADD COLUMN IF NOT EXISTS descuento_aplicado INTEGER NOT NULL DEFAULT 0;

-- 4. AGREGAR columna password a usuarios (si no existe)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'Vivanticos2025';

-- 5. RENOMBRAR precio_incremento a incremento_precio en producto_opcion_valores (si existe la columna vieja)
-- Nota: Solo renombrar si la columna vieja existe y la nueva no
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'producto_opcion_valores' AND column_name = 'precio_incremento'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'producto_opcion_valores' AND column_name = 'incremento_precio'
  ) THEN
    ALTER TABLE producto_opcion_valores RENAME COLUMN precio_incremento TO incremento_precio;
  END IF;
END $$;

-- 6. ACTUALIZAR datos de productos existentes con tipo_producto y descuento_base
-- Cunas
UPDATE productos SET tipo_producto = 'cuna', descuento_base = 100000
  WHERE codigo IN ('CUN-LUN-001', 'CUN-NUB-003') AND tipo_producto = 'otro';
UPDATE productos SET tipo_producto = 'cuna', descuento_base = 200000
  WHERE codigo = 'CUN-EST-002' AND tipo_producto = 'otro';
-- Camas
UPDATE productos SET tipo_producto = 'cama', descuento_base = 0
  WHERE codigo IN ('CAM-INF-001', 'CAM-JUV-001') AND tipo_producto = 'otro';
-- Cambiadores
UPDATE productos SET tipo_producto = 'cambiador', descuento_base = 0
  WHERE codigo = 'COM-CAM-001' AND tipo_producto = 'otro';
-- Roperos
UPDATE productos SET tipo_producto = 'ropero', descuento_base = 0
  WHERE codigo = 'ROP-2P-001' AND tipo_producto = 'otro';
-- Escritorios
UPDATE productos SET tipo_producto = 'escritorio', descuento_base = 0
  WHERE codigo = 'ESC-001' AND tipo_producto = 'otro';
