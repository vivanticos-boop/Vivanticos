-- ==========================================
-- FIX NOTIFICACIONES TABLE - VIVANTICOS
-- Ejecutar en Supabase SQL Editor
-- ==========================================

-- 1. Asegurar que la tabla notificaciones tenga todas las columnas necesarias
-- Si la tabla ya existe, agregar columnas faltantes

-- Agregar columna relacionado_id si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notificaciones' AND column_name = 'relacionado_id'
  ) THEN
    ALTER TABLE notificaciones ADD COLUMN relacionado_id TEXT;
  END IF;
END $$;

-- Agregar columna usuario_id si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notificaciones' AND column_name = 'usuario_id'
  ) THEN
    ALTER TABLE notificaciones ADD COLUMN usuario_id UUID;
  END IF;
END $$;

-- 2. Asegurar que la restricción CHECK del tipo está correcta
-- Primero eliminar la constraint anterior si existe
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'notificaciones'
  AND con.contype = 'c'
  AND conname LIKE '%tipo%';
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE notificaciones DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Agregar la nueva restricción
ALTER TABLE notificaciones
ADD CONSTRAINT chk_tipo_notificacion 
CHECK (tipo IN ('entrega_hoy', 'entrega_manana', 'entrega_vencida', 'cotizacion_aprobada', 'cotizacion_pendiente', 'info'));

-- 3. Deshabilitar RLS temporalmente para que la app funcione con anon key
-- (La app usa auth personalizada, no Supabase Auth)
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que usan auth.uid() (no funcionan sin Supabase Auth)
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias notificaciones" ON notificaciones;

-- Crear políticas que permitan acceso con anon key
CREATE POLICY "Allow anon select on notificaciones" ON notificaciones
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert on notificaciones" ON notificaciones
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update on notificaciones" ON notificaciones
  FOR UPDATE USING (true);

CREATE POLICY "Allow anon delete on notificaciones" ON notificaciones
  FOR DELETE USING (true);

-- 4. Lo mismo para push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver sus propias suscripciones" ON push_subscriptions;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias suscripciones" ON push_subscriptions;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias suscripciones" ON push_subscriptions;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias suscripciones" ON push_subscriptions;

CREATE POLICY "Allow anon select on push_subscriptions" ON push_subscriptions
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert on push_subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update on push_subscriptions" ON push_subscriptions
  FOR UPDATE USING (true);

CREATE POLICY "Allow anon delete on push_subscriptions" ON push_subscriptions
  FOR DELETE USING (true);
