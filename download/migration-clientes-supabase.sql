-- ==========================================
-- VIVANTICOS - MIGRACIÓN: Tabla clientes + columnas nuevas
-- Ejecutar en el SQL Editor de Supabase
-- ==========================================

-- ==========================================
-- 1. CREAR TABLA: clientes (NUEVA)
-- ==========================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT,
  direccion TEXT,
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

-- Índice para buscar clientes por nombre
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);

-- Trigger de auto-actualización
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS para clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read clientes" ON clientes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and jefe can write clientes" ON clientes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')));

CREATE POLICY "Vendedor can create clientes" ON clientes FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Vendedor can update clientes" ON clientes FOR UPDATE TO authenticated
  USING (true);

-- ==========================================
-- 2. AGREGAR COLUMNAS A: cotizaciones
-- ==========================================
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS cliente_direccion TEXT;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;

-- ==========================================
-- 3. HACER vendedor_id NULLABLE en cotizaciones (para datos demo que usan IDs falsos)
-- ==========================================
-- Nota: Si ya hay datos con vendedor_id que no son UUIDs válidos, esto evitará errores
-- Solo ejecutar si hay problemas con la restricción de foreign key:
-- ALTER TABLE cotizaciones ALTER COLUMN vendedor_id DROP NOT NULL;

-- ==========================================
-- 4. INSERTAR USUARIOS DEMO (si no existen)
-- ==========================================
-- Estos son los usuarios demo que usa la app localmente
-- Password: Vivanticos2025 para todos
INSERT INTO usuarios (id, nombre, email, password, rol, activo, telefono) VALUES
  ('66666666-6666-6666-6666-666666666601', 'Administrador', 'admin@vivanticos.com', 'Vivanticos2025', 'admin', true, '573001112233'),
  ('66666666-6666-6666-6666-666666666602', 'Alejandro Torres', 'jefe@vivanticos.com', 'Vivanticos2025', 'jefe', true, '573002223344'),
  ('66666666-6666-6666-6666-666666666603', 'Carolina Vargas', 'vendedor@vivanticos.com', 'Vivanticos2025', 'vendedor', true, '573003334455'),
  ('66666666-6666-6666-6666-666666666604', 'Daniela Morales', 'daniela@vivanticos.com', 'Vivanticos2025', 'vendedor', true, '573004445566'),
  ('66666666-6666-6666-6666-666666666605', 'Santiago Ramírez', 'santiago@vivanticos.com', 'Vivanticos2025', 'vendedor', false, '573005556677')
ON CONFLICT (id) DO UPDATE SET
  password = EXCLUDED.password,
  activo = EXCLUDED.activo;

-- ==========================================
-- 5. VERIFICACIÓN
-- ==========================================
-- Verificar que las tablas y columnas se crearon correctamente:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clientes';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cotizaciones' AND column_name IN ('cliente_direccion', 'cliente_id');
