-- ==========================================
-- FIX RLS: Permitir escrituras con anon key
-- La app NO usa Supabase Auth, usa su propio sistema de passwords.
-- Por eso auth.uid() siempre es NULL y las políticas actuales bloquean TODAS las escrituras.
-- Este script reemplaza las políticas restrictivas con políticas que permiten
-- acceso completo desde la app (rol anon y authenticated).
-- Ejecutar en el SQL Editor de Supabase
-- ==========================================

-- ==========================================
-- 1. CATEGORÍAS
-- ==========================================
DROP POLICY IF EXISTS "Authenticated users can read categorias" ON categorias;
DROP POLICY IF EXISTS "Admin and jefe can write categorias" ON categorias;

CREATE POLICY "Allow read categorias" ON categorias FOR SELECT USING (true);
CREATE POLICY "Allow insert categorias" ON categorias FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update categorias" ON categorias FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete categorias" ON categorias FOR DELETE USING (true);

-- ==========================================
-- 2. SUBCATEGORÍAS
-- ==========================================
DROP POLICY IF EXISTS "Authenticated users can read subcategorias" ON subcategorias;
DROP POLICY IF EXISTS "Admin and jefe can write subcategorias" ON subcategorias;

CREATE POLICY "Allow read subcategorias" ON subcategorias FOR SELECT USING (true);
CREATE POLICY "Allow insert subcategorias" ON subcategorias FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update subcategorias" ON subcategorias FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete subcategorias" ON subcategorias FOR DELETE USING (true);

-- ==========================================
-- 3. PRODUCTOS
-- ==========================================
DROP POLICY IF EXISTS "Authenticated users can read productos" ON productos;
DROP POLICY IF EXISTS "Admin and jefe can write productos" ON productos;

CREATE POLICY "Allow read productos" ON productos FOR SELECT USING (true);
CREATE POLICY "Allow insert productos" ON productos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update productos" ON productos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete productos" ON productos FOR DELETE USING (true);

-- ==========================================
-- 4. PRODUCTO OPCIONES
-- ==========================================
DROP POLICY IF EXISTS "Authenticated users can read producto_opciones" ON producto_opciones;
DROP POLICY IF EXISTS "Admin and jefe can write producto_opciones" ON producto_opciones;

CREATE POLICY "Allow read producto_opciones" ON producto_opciones FOR SELECT USING (true);
CREATE POLICY "Allow insert producto_opciones" ON producto_opciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update producto_opciones" ON producto_opciones FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete producto_opciones" ON producto_opciones FOR DELETE USING (true);

-- ==========================================
-- 5. PRODUCTO OPCION VALORES
-- ==========================================
DROP POLICY IF EXISTS "Authenticated users can read producto_opcion_valores" ON producto_opcion_valores;
DROP POLICY IF EXISTS "Admin and jefe can write producto_opcion_valores" ON producto_opcion_valores;

CREATE POLICY "Allow read producto_opcion_valores" ON producto_opcion_valores FOR SELECT USING (true);
CREATE POLICY "Allow insert producto_opcion_valores" ON producto_opcion_valores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update producto_opcion_valores" ON producto_opcion_valores FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete producto_opcion_valores" ON producto_opcion_valores FOR DELETE USING (true);

-- ==========================================
-- 6. USUARIOS
-- ==========================================
DROP POLICY IF EXISTS "Users can read own profile" ON usuarios;
DROP POLICY IF EXISTS "Admin can manage users" ON usuarios;

CREATE POLICY "Allow read usuarios" ON usuarios FOR SELECT USING (true);
CREATE POLICY "Allow insert usuarios" ON usuarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update usuarios" ON usuarios FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete usuarios" ON usuarios FOR DELETE USING (true);

-- ==========================================
-- 7. COTIZACIONES
-- ==========================================
DROP POLICY IF EXISTS "Users can read own cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Users can create cotizaciones" ON cotizaciones;
DROP POLICY IF EXISTS "Users can update own cotizaciones" ON cotizaciones;

CREATE POLICY "Allow read cotizaciones" ON cotizaciones FOR SELECT USING (true);
CREATE POLICY "Allow insert cotizaciones" ON cotizaciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update cotizaciones" ON cotizaciones FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete cotizaciones" ON cotizaciones FOR DELETE USING (true);

-- ==========================================
-- 8. COTIZACIÓN ITEMS
-- ==========================================
DROP POLICY IF EXISTS "Users can read cotizacion_items" ON cotizacion_items;
DROP POLICY IF EXISTS "Users can manage cotizacion_items" ON cotizacion_items;

CREATE POLICY "Allow read cotizacion_items" ON cotizacion_items FOR SELECT USING (true);
CREATE POLICY "Allow insert cotizacion_items" ON cotizacion_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update cotizacion_items" ON cotizacion_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete cotizacion_items" ON cotizacion_items FOR DELETE USING (true);

-- ==========================================
-- 9. ENTREGAS
-- ==========================================
DROP POLICY IF EXISTS "Users can read own entregas" ON entregas;
DROP POLICY IF EXISTS "Users can create entregas" ON entregas;
DROP POLICY IF EXISTS "Users can update own entregas" ON entregas;

CREATE POLICY "Allow read entregas" ON entregas FOR SELECT USING (true);
CREATE POLICY "Allow insert entregas" ON entregas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update entregas" ON entregas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete entregas" ON entregas FOR DELETE USING (true);

-- ==========================================
-- 10. NOTIFICACIONES
-- ==========================================
DROP POLICY IF EXISTS "Users can read own notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Users can update own notificaciones" ON notificaciones;
DROP POLICY IF EXISTS "Users can create notificaciones" ON notificaciones;

CREATE POLICY "Allow read notificaciones" ON notificaciones FOR SELECT USING (true);
CREATE POLICY "Allow insert notificaciones" ON notificaciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update notificaciones" ON notificaciones FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete notificaciones" ON notificaciones FOR DELETE USING (true);
