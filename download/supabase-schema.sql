-- ==========================================
-- VIVANTICOS - SCRIPTS SQL PARA SUPABASE
-- Ejecutar en orden en el SQL Editor de Supabase
-- ==========================================

-- ==========================================
-- DROP TABLE (en orden inverso por dependencias)
-- ==========================================
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS entregas;
DROP TABLE IF EXISTS cotizacion_items;
DROP TABLE IF EXISTS cotizaciones;
DROP TABLE IF EXISTS producto_opcion_valores;
DROP TABLE IF EXISTS producto_opciones;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS subcategorias;
DROP TABLE IF EXISTS categorias;

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
  medidas TEXT DEFAULT '',
  material TEXT DEFAULT '',
  garantia TEXT DEFAULT '',
  precio_descuento INTEGER DEFAULT 0,
  entrega_inmediata BOOLEAN DEFAULT false,
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
-- DATOS INICIALES (usando UUIDs válidos)
-- ==========================================

-- Categorías (IDs UUID válidos)
INSERT INTO categorias (id, nombre, icono, orden) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Cunas', '🛏️', 1),
  ('11111111-1111-1111-1111-111111111102', 'Camas', '🛏️', 2),
  ('11111111-1111-1111-1111-111111111103', 'Cómodas', '🗄️', 3),
  ('11111111-1111-1111-1111-111111111104', 'Roperos', '🚪', 4),
  ('11111111-1111-1111-1111-111111111105', 'Escritorios', '📐', 5),
  ('11111111-1111-1111-1111-111111111106', 'Accesorios', '✨', 6)
ON CONFLICT DO NOTHING;

-- Subcategorías
INSERT INTO subcategorias (id, categoria_id, nombre, orden) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Cunas Funcionales', 1),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Cunas Clásicas', 2),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 'Camas Infantiles', 1),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111102', 'Camas Juveniles', 2),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111103', 'Cómodas con Cambiador', 1),
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111103', 'Cómodas Clásicas', 2),
  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111104', 'Roperos 2 Puertas', 1),
  ('22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111104', 'Roperos 3 Puertas', 2),
  ('22222222-2222-2222-2222-222222222209', '11111111-1111-1111-1111-111111111105', 'Escritorios con Repisa', 1),
  ('22222222-2222-2222-2222-222222222210', '11111111-1111-1111-1111-111111111106', 'Repisas', 1),
  ('22222222-2222-2222-2222-222222222211', '11111111-1111-1111-1111-111111111106', 'Canastos', 2)
ON CONFLICT DO NOTHING;

-- Productos
INSERT INTO productos (id, codigo, nombre, categoria_id, subcategoria_id, descripcion, descripcion_tecnica, precio_base, medidas, material, garantia, precio_descuento, entrega_inmediata) VALUES
  ('33333333-3333-3333-3333-333333333301', 'CUN-LUN-001', 'Cuna Luna',
   '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201',
   'Cuna funcional con diseño de luna creciente, ideal para decoraciones celestiales.',
   'Estructura en MDF 18mm con cantos de PVC. Acabado lacado mate. Incluye barandas removibles y ruedas con freno. Medida estándar 120x60cm.',
   450000, '120x60cm, 130x70cm, 140x70cm', 'MDF 18mm con cantos de PVC, acabado lacado mate', '6 meses por defectos de fabricación', 350000, true),
  ('33333333-3333-3333-3333-333333333302', 'CUN-EST-002', 'Cuna Estrella',
   '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201',
   'Cuna funcional con motivos de estrellas, perfecta para un cuarto de ensueño.',
   'MDF 15mm con detalles tallados. Incluye cajón debajo. Baranda frontal rebatible. Acabado lacado.',
   520000, '120x60cm, 130x70cm, 140x70cm', 'MDF 15mm con detalles tallados, acabado lacado', '6 meses por defectos de fabricación', 320000, true),
  ('33333333-3333-3333-3333-333333333303', 'CUN-NUB-003', 'Cuna Nube',
   '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201',
   'Cuna funcional con forma de nube suave, diseño minimalista y tierno.',
   'MDF 18mm. Diseño recortado de nube en cabecera y piecera. Ruedas de silicone. Terminación suave al tacto.',
   480000, '120x60cm, 130x70cm', 'MDF 18mm, terminación suave al tacto', '6 meses por defectos de fabricación', 380000, false),
  ('33333333-3333-3333-3333-333333333304', 'CAM-INF-001', 'Cama Infantil Safari',
   '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222203',
   'Cama infantil con divertidos motivos de safari, perfecta para los más aventureros.',
   'Estructura en MDF 18mm con serigrafía de animales. Baranda de seguridad lateral desmontable. Incluye repisa en piecera.',
   380000, '80x160cm, 80x180cm, 90x190cm', 'MDF 18mm con serigrafía de animales', '6 meses por defectos de fabricación', 0, true),
  ('33333333-3333-3333-3333-333333333305', 'CAM-JUV-001', 'Cama Juvenil Nordic',
   '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222204',
   'Cama juvenil estilo nórdico, limpia y moderna para adolescentes.',
   'MDF 18mm con melamina de alta calidad. Líneas rectas y minimalistas. Disponible en varios colores.',
   420000, '80x180cm, 90x190cm', 'MDF 18mm con melamina de alta calidad', '6 meses por defectos de fabricación', 350000, false),
  ('33333333-3333-3333-3333-333333333306', 'COM-CAM-001', 'Cómoda Cambiador Daisy',
   '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222205',
   'Cómoda con cambiador integrado, diseño de margaritas para un toque dulce.',
   'MDF 18mm con 4 cajones con rieles silenciosos. Superficie superior como cambiador. Detalles serigrafiados.',
   380000, '80x50x90cm', 'MDF 18mm con 4 cajones, rieles silenciosos', '6 meses por defectos de fabricación', 0, true),
  ('33333333-3333-3333-3333-333333333307', 'ROP-2P-001', 'Ropero 2 Puertas Rainbow',
   '11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222207',
   'Ropero de 2 puertas con arcoíris en las puertas, funcional y decorativo.',
   'MDF 18mm. Puertas con bisagras de cierre suave. Interior con repisa y colgador. Acabado lacado mate.',
   520000, '1.20m ancho, 1.50m ancho, 1.80m ancho', 'MDF 18mm, bisagras de cierre suave', '6 meses por defectos de fabricación', 0, false),
  ('33333333-3333-3333-3333-333333333308', 'ESC-001', 'Escritorio Explorer',
   '11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222209',
   'Escritorio con repisa integrada, perfecto para la hora de tarea.',
   'MDF 15mm con estructura robusta. Repisa superior para libros. Cajón para útiles. Patas con niveladores.',
   280000, '100x50x75cm', 'MDF 15mm con estructura robusta, patas con niveladores', '6 meses por defectos de fabricación', 220000, true)
ON CONFLICT DO NOTHING;

-- Opciones de productos
INSERT INTO producto_opciones (id, producto_id, tipo, nombre, requerida, orden) VALUES
  -- Cuna Luna
  ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 'medida', 'Medida', true, 1),
  ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 'colchon', 'Colchón', false, 2),
  ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333301', 'lenceria', 'Lencería', false, 3),
  -- Cuna Estrella
  ('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333302', 'medida', 'Medida', true, 1),
  ('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333302', 'colchon', 'Colchón', false, 2),
  ('44444444-4444-4444-4444-444444444406', '33333333-3333-3333-3333-333333333302', 'lenceria', 'Lencería', false, 3),
  -- Cuna Nube
  ('44444444-4444-4444-4444-444444444407', '33333333-3333-3333-3333-333333333303', 'medida', 'Medida', true, 1),
  ('44444444-4444-4444-4444-444444444408', '33333333-3333-3333-3333-333333333303', 'colchon', 'Colchón', false, 2),
  ('44444444-4444-4444-4444-444444444409', '33333333-3333-3333-3333-333333333303', 'lenceria', 'Lencería', false, 3),
  -- Cama Infantil Safari
  ('44444444-4444-4444-4444-444444444410', '33333333-3333-3333-3333-333333333304', 'medida', 'Medida', true, 1),
  ('44444444-4444-4444-4444-444444444411', '33333333-3333-3333-3333-333333333304', 'colchon', 'Colchón', false, 2),
  -- Cómoda Cambiador Daisy
  ('44444444-4444-4444-4444-444444444412', '33333333-3333-3333-3333-333333333306', 'medida', 'Acabado', true, 1),
  -- Ropero 2 Puertas Rainbow
  ('44444444-4444-4444-4444-444444444413', '33333333-3333-3333-3333-333333333307', 'medida', 'Medida', true, 1)
ON CONFLICT DO NOTHING;

-- Valores de opciones
INSERT INTO producto_opcion_valores (id, opcion_id, nombre, precio_incremento) VALUES
  -- Medidas Cuna Luna
  ('55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444401', '120x60', 0),
  ('55555555-5555-5555-5555-555555555502', '44444444-4444-4444-4444-444444444401', '130x70', 50000),
  ('55555555-5555-5555-5555-555555555503', '44444444-4444-4444-4444-444444444401', '140x70', 80000),
  -- Colchón Cuna Luna
  ('55555555-5555-5555-5555-555555555504', '44444444-4444-4444-4444-444444444402', 'Sin colchón', 0),
  ('55555555-5555-5555-5555-555555555505', '44444444-4444-4444-4444-444444444402', 'Colchón 120x60', 120000),
  ('55555555-5555-5555-5555-555555555506', '44444444-4444-4444-4444-444444444402', 'Colchón 130x70', 140000),
  ('55555555-5555-5555-5555-555555555507', '44444444-4444-4444-4444-444444444402', 'Colchón 140x70', 160000),
  -- Lencería Cuna Luna
  ('55555555-5555-5555-5555-555555555508', '44444444-4444-4444-4444-444444444403', 'Sin lencería', 0),
  ('55555555-5555-5555-5555-555555555509', '44444444-4444-4444-4444-444444444403', 'Lencería Básica', 85000),
  ('55555555-5555-5555-5555-555555555510', '44444444-4444-4444-4444-444444444403', 'Lencería Premium', 150000),
  -- Medidas Cuna Estrella
  ('55555555-5555-5555-5555-555555555511', '44444444-4444-4444-4444-444444444404', '120x60', 0),
  ('55555555-5555-5555-5555-555555555512', '44444444-4444-4444-4444-444444444404', '130x70', 50000),
  ('55555555-5555-5555-5555-555555555513', '44444444-4444-4444-4444-444444444404', '140x70', 80000),
  -- Colchón Cuna Estrella
  ('55555555-5555-5555-5555-555555555514', '44444444-4444-4444-4444-444444444405', 'Sin colchón', 0),
  ('55555555-5555-5555-5555-555555555515', '44444444-4444-4444-4444-444444444405', 'Colchón 120x60', 120000),
  ('55555555-5555-5555-5555-555555555516', '44444444-4444-4444-4444-444444444405', 'Colchón 130x70', 140000),
  ('55555555-5555-5555-5555-555555555517', '44444444-4444-4444-4444-444444444405', 'Colchón 140x70', 160000),
  -- Lencería Cuna Estrella
  ('55555555-5555-5555-5555-555555555518', '44444444-4444-4444-4444-444444444406', 'Sin lencería', 0),
  ('55555555-5555-5555-5555-555555555519', '44444444-4444-4444-4444-444444444406', 'Lencería Básica', 85000),
  ('55555555-5555-5555-5555-555555555520', '44444444-4444-4444-4444-444444444406', 'Lencería Premium', 150000),
  -- Medidas Cuna Nube
  ('55555555-5555-5555-5555-555555555521', '44444444-4444-4444-4444-444444444407', '120x60', 0),
  ('55555555-5555-5555-5555-555555555522', '44444444-4444-4444-4444-444444444407', '130x70', 50000),
  -- Colchón Cuna Nube
  ('55555555-5555-5555-5555-555555555523', '44444444-4444-4444-4444-444444444408', 'Sin colchón', 0),
  ('55555555-5555-5555-5555-555555555524', '44444444-4444-4444-4444-444444444408', 'Colchón 120x60', 120000),
  -- Lencería Cuna Nube
  ('55555555-5555-5555-5555-555555555525', '44444444-4444-4444-4444-444444444409', 'Sin lencería', 0),
  ('55555555-5555-5555-5555-555555555526', '44444444-4444-4444-4444-444444444409', 'Lencería Básica', 85000),
  -- Medidas Cama Infantil
  ('55555555-5555-5555-5555-555555555527', '44444444-4444-4444-4444-444444444410', '80x160', 0),
  ('55555555-5555-5555-5555-555555555528', '44444444-4444-4444-4444-444444444410', '80x180', 40000),
  ('55555555-5555-5555-5555-555555555529', '44444444-4444-4444-4444-444444444410', '90x190', 60000),
  -- Colchón Cama Infantil
  ('55555555-5555-5555-5555-555555555530', '44444444-4444-4444-4444-444444444411', 'Sin colchón', 0),
  ('55555555-5555-5555-5555-555555555531', '44444444-4444-4444-4444-444444444411', 'Colchón 80x160', 150000),
  ('55555555-5555-5555-5555-555555555532', '44444444-4444-4444-4444-444444444411', 'Colchón 80x180', 170000),
  ('55555555-5555-5555-5555-555555555533', '44444444-4444-4444-4444-444444444411', 'Colchón 90x190', 190000),
  -- Acabado Cómoda
  ('55555555-5555-5555-5555-555555555534', '44444444-4444-4444-4444-444444444412', 'Blanco', 0),
  ('55555555-5555-5555-5555-555555555535', '44444444-4444-4444-4444-444444444412', 'Natural', 20000),
  ('55555555-5555-5555-5555-555555555536', '44444444-4444-4444-4444-444444444412', 'Gris', 30000),
  -- Medidas Ropero
  ('55555555-5555-5555-5555-555555555537', '44444444-4444-4444-4444-444444444413', '1.20m ancho', 0),
  ('55555555-5555-5555-5555-555555555538', '44444444-4444-4444-4444-444444444413', '1.50m ancho', 80000),
  ('55555555-5555-5555-5555-555555555539', '44444444-4444-4444-4444-444444444413', '1.80m ancho', 150000)
ON CONFLICT DO NOTHING;

-- Usuario admin inicial (contraseña: admin123 - cambiar en producción)
-- NOTA: En producción usar auth.users de Supabase y bcrypt
INSERT INTO usuarios (id, nombre, email, password_hash, rol) VALUES
  ('66666666-6666-6666-6666-666666666601', 'Administrador', 'admin@vivanticos.com', 'admin123', 'admin'),
  ('66666666-6666-6666-6666-666666666602', 'Alejandro Torres', 'jefe@vivanticos.com', 'jefe123', 'jefe'),
  ('66666666-6666-6666-6666-666666666603', 'Carolina Vargas', 'vendedor@vivanticos.com', 'vendedor123', 'vendedor')
ON CONFLICT DO NOTHING;
