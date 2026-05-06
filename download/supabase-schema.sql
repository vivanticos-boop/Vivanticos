-- ==========================================
-- VIVANTICOS - SCRIPTS SQL PARA SUPABASE
-- Ejecutar en orden en el SQL Editor de Supabase
-- ==========================================

-- ==========================================
-- 1. TABLA: categorias
-- ==========================================
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  icono TEXT,
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. TABLA: subcategorias
-- ==========================================
CREATE TABLE IF NOT EXISTS subcategorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. TABLA: productos
-- ==========================================
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
  subcategoria_id UUID REFERENCES subcategorias(id) ON DELETE SET NULL,
  descripcion TEXT DEFAULT '',
  descripcion_tecnica TEXT DEFAULT '',
  precio_base INTEGER NOT NULL DEFAULT 0,
  imagenes TEXT[] DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  descuento_tipo TEXT DEFAULT 'ninguno' CHECK (descuento_tipo IN ('ninguno', 'colchon', 'cuna')),
  descuento_valor INTEGER DEFAULT 0,
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 4. TABLA: producto_opciones
-- ==========================================
CREATE TABLE IF NOT EXISTS producto_opciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('medida', 'colchon', 'lenceria', 'extra')),
  nombre TEXT NOT NULL,
  requerida BOOLEAN DEFAULT false,
  orden INTEGER DEFAULT 0,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 5. TABLA: producto_opcion_valores
-- ==========================================
CREATE TABLE IF NOT EXISTS producto_opcion_valores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opcion_id UUID NOT NULL REFERENCES producto_opciones(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  precio_incremento INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 6. TABLA: usuarios
-- ==========================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'jefe', 'vendedor')) DEFAULT 'vendedor',
  activo BOOLEAN DEFAULT true,
  telefono TEXT,
  avatar_url TEXT,
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 7. TABLA: cotizaciones
-- ==========================================
CREATE TABLE IF NOT EXISTS cotizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  cliente_email TEXT,
  subtotal INTEGER NOT NULL DEFAULT 0,
  descuento_total INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'rechazada')),
  vendedor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 8. TABLA: cotizacion_items
-- ==========================================
CREATE TABLE IF NOT EXISTS cotizacion_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  producto_nombre TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario INTEGER NOT NULL DEFAULT 0,
  opciones_seleccionadas JSONB DEFAULT '[]',
  subtotal INTEGER NOT NULL DEFAULT 0,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 9. TABLA: entregas
-- ==========================================
CREATE TABLE IF NOT EXISTS entregas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE SET NULL,
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  cliente_direccion TEXT NOT NULL,
  fecha_entrega DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'entregado', 'completado')),
  notas TEXT,
  vendedor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  items JSONB DEFAULT '[]',
  creado_en TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 10. TABLA: notificaciones
-- ==========================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrega_manana', 'entrega_hoy', 'cotizacion_aprobada', 'info')),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  relacionado_id UUID,
  creado_en TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- ÍNDICES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_subcategorias_categoria ON subcategorias(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_producto_opciones_producto ON producto_opciones(producto_id);
CREATE INDEX IF NOT EXISTS idx_producto_opcion_valores_opcion ON producto_opcion_valores(opcion_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_vendedor ON cotizaciones(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_cotizacion_items_cotizacion ON cotizacion_items(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_entregas_fecha ON entregas(fecha_entrega);
CREATE INDEX IF NOT EXISTS idx_entregas_estado ON entregas(estado);
CREATE INDEX IF NOT EXISTS idx_entregas_vendedor ON entregas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);

-- ==========================================
-- FUNCIONES DE AUTO-ACTUALIZACIÓN
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subcategorias_updated_at BEFORE UPDATE ON subcategorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cotizaciones_updated_at BEFORE UPDATE ON cotizaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entregas_updated_at BEFORE UPDATE ON entregas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_opciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_opcion_valores ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizacion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas: todos los usuarios autenticados pueden leer
CREATE POLICY "Authenticated users can read categorias" ON categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read subcategorias" ON subcategorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read productos" ON productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read producto_opciones" ON producto_opciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read producto_opcion_valores" ON producto_opcion_valores FOR SELECT TO authenticated USING (true);

-- Políticas: escritura solo para admin y jefe
CREATE POLICY "Admin and jefe can write categorias" ON categorias FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')));

CREATE POLICY "Admin and jefe can write subcategorias" ON subcategorias FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')));

CREATE POLICY "Admin and jefe can write productos" ON productos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')));

CREATE POLICY "Admin and jefe can write producto_opciones" ON producto_opciones FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')));

CREATE POLICY "Admin and jefe can write producto_opcion_valores" ON producto_opcion_valores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')));

-- Usuarios: admin puede gestionar todo, jefe puede gestionar vendedores
CREATE POLICY "Users can read own profile" ON usuarios FOR SELECT TO authenticated
  USING (id = auth.uid() OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')));

CREATE POLICY "Admin can manage users" ON usuarios FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin'));

-- Cotizaciones: todos pueden crear, cada usuario ve las propias (admin ve todas)
CREATE POLICY "Users can read own cotizaciones" ON cotizaciones FOR SELECT TO authenticated
  USING (vendedor_id = auth.uid() OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')));

CREATE POLICY "Users can create cotizaciones" ON cotizaciones FOR INSERT TO authenticated
  WITH CHECK (vendedor_id = auth.uid());

CREATE POLICY "Users can update own cotizaciones" ON cotizaciones FOR UPDATE TO authenticated
  USING (vendedor_id = auth.uid() OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')));

-- Cotización items
CREATE POLICY "Users can read cotizacion_items" ON cotizacion_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM cotizaciones WHERE id = cotizacion_id AND (vendedor_id = auth.uid() OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')))));

CREATE POLICY "Users can manage cotizacion_items" ON cotizacion_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM cotizaciones WHERE id = cotizacion_id AND (vendedor_id = auth.uid() OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')))));

-- Entregas
CREATE POLICY "Users can read own entregas" ON entregas FOR SELECT TO authenticated
  USING (vendedor_id = auth.uid() OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')));

CREATE POLICY "Users can create entregas" ON entregas FOR INSERT TO authenticated
  WITH CHECK (vendedor_id = auth.uid() OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')));

CREATE POLICY "Users can update own entregas" ON entregas FOR UPDATE TO authenticated
  USING (vendedor_id = auth.uid() OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'jefe')));

-- Notificaciones
CREATE POLICY "Users can read own notificaciones" ON notificaciones FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR usuario_id IS NULL);

CREATE POLICY "Users can update own notificaciones" ON notificaciones FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "Users can create notificaciones" ON notificaciones FOR INSERT TO authenticated
  WITH CHECK (true);

-- ==========================================
-- DATOS INICIALES
-- ==========================================

-- Categorías
INSERT INTO categorias (id, nombre, icono, orden) VALUES
  ('cat-1', 'Cunas', '🛏️', 1),
  ('cat-2', 'Camas', '🛏️', 2),
  ('cat-3', 'Cómodas', '🗄️', 3),
  ('cat-4', 'Roperos', '🚪', 4),
  ('cat-5', 'Escritorios', '📐', 5),
  ('cat-6', 'Accesorios', '✨', 6)
ON CONFLICT DO NOTHING;

-- Subcategorías
INSERT INTO subcategorias (id, categoria_id, nombre, orden) VALUES
  ('sub-1', 'cat-1', 'Cunas Funcionales', 1),
  ('sub-2', 'cat-1', 'Cunas Clásicas', 2),
  ('sub-3', 'cat-2', 'Camas Infantiles', 1),
  ('sub-4', 'cat-2', 'Camas Juveniles', 2),
  ('sub-5', 'cat-3', 'Cómodas con Cambiador', 1),
  ('sub-6', 'cat-3', 'Cómodas Clásicas', 2),
  ('sub-7', 'cat-4', 'Roperos 2 Puertas', 1),
  ('sub-8', 'cat-4', 'Roperos 3 Puertas', 2),
  ('sub-9', 'cat-5', 'Escritorios con Repisa', 1),
  ('sub-10', 'cat-6', 'Repisas', 1),
  ('sub-11', 'cat-6', 'Canastos', 2)
ON CONFLICT DO NOTHING;

-- Usuario admin inicial (contraseña: admin123 - cambiar en producción)
-- NOTA: En producción usar auth.users de Supabase y bcrypt
INSERT INTO usuarios (id, nombre, email, password_hash, rol) VALUES
  ('usr-1', 'Administrador', 'admin@vivanticos.com', 'admin123', 'admin'),
  ('usr-2', 'Alejandro Torres', 'jefe@vivanticos.com', 'jefe123', 'jefe'),
  ('usr-3', 'Carolina Vargas', 'vendedor@vivanticos.com', 'vendedor123', 'vendedor')
ON CONFLICT DO NOTHING;
