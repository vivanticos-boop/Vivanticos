-- ==========================================
-- VIVANTICOS - MIGRACIÓN: Flujo Tránsito → Pedido → Entrega
-- Ejecutar en el SQL Editor de Supabase
-- ==========================================

-- ==========================================
-- 1. AGREGAR CÉDULA A CLIENTES
-- ==========================================
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cedula TEXT;

-- Índice para buscar clientes por cédula
CREATE INDEX IF NOT EXISTS idx_clientes_cedula ON clientes(cedula);

-- ==========================================
-- 2. AGREGAR CÉDULA A COTIZACIONES
-- ==========================================
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS cliente_cedula TEXT;

-- Índice para buscar cotizaciones por cédula
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cedula ON cotizaciones(cliente_cedula);

-- ==========================================
-- 3. ACTUALIZAR ESTADOS DE COTIZACIONES (agregar transito y pedido)
-- ==========================================
-- Primero eliminar la restricción CHECK vieja y crear la nueva
ALTER TABLE cotizaciones DROP CONSTRAINT IF EXISTS cotizaciones_estado_check;
ALTER TABLE cotizaciones ADD CONSTRAINT cotizaciones_estado_check 
  CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'rechazada', 'transito', 'pedido'));

-- ==========================================
-- 4. AGREGAR CÉDULA Y HORA A ENTREGAS
-- ==========================================
ALTER TABLE entregas ADD COLUMN IF NOT EXISTS cliente_cedula TEXT;
ALTER TABLE entregas ADD COLUMN IF NOT EXISTS hora_entrega TEXT;

-- Índice para buscar entregas por cédula
CREATE INDEX IF NOT EXISTS idx_entregas_cedula ON entregas(cliente_cedula);

-- ==========================================
-- 5. ACTUALIZAR ESTADO DEFAULT DE COTIZACIONES NUEVAS A 'transito'
-- ==========================================
-- (No cambiamos el default para no afectar datos existentes)
-- Las cotizaciones nuevas desde la app usarán 'transito' por defecto

-- ==========================================
-- 6. VERIFICACIÓN
-- ==========================================
-- Verificar columnas nuevas:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cotizaciones' AND column_name = 'cliente_cedula';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'entregas' AND column_name IN ('cliente_cedula', 'hora_entrega');
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'cedula';
