// ==========================================
// STORE DE DATOS (CATÁLOGO) - VIVANTICOS
// Con integración Supabase + datos demo fallback
// ==========================================

import { create } from 'zustand';
import type { Categoria, Subcategoria, Producto, ProductoOpcion, ProductoOpcionValor } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// --- Datos demo (fallback cuando no hay Supabase) ---
const DEMO_CATEGORIAS: Categoria[] = [
  { id: 'cat1', nombre: 'Cunas', icono: '🛏️', orden: 1, activa: true },
  { id: 'cat2', nombre: 'Camas', icono: '🛏️', orden: 2, activa: true },
  { id: 'cat3', nombre: 'Cómodas', icono: '🗄️', orden: 3, activa: true },
  { id: 'cat4', nombre: 'Roperos', icono: '🚪', orden: 4, activa: true },
  { id: 'cat5', nombre: 'Escritorios', icono: '📐', orden: 5, activa: true },
  { id: 'cat6', nombre: 'Accesorios', icono: '✨', orden: 6, activa: true },
];

const DEMO_SUBCATEGORIAS: Subcategoria[] = [
  { id: 'sub1', categoria_id: 'cat1', nombre: 'Cunas Funcionales', orden: 1, activa: true },
  { id: 'sub2', categoria_id: 'cat1', nombre: 'Cunas Clásicas', orden: 2, activa: true },
  { id: 'sub3', categoria_id: 'cat2', nombre: 'Camas Infantiles', orden: 1, activa: true },
  { id: 'sub4', categoria_id: 'cat2', nombre: 'Camas Juveniles', orden: 2, activa: true },
  { id: 'sub5', categoria_id: 'cat3', nombre: 'Cómodas con Cambiador', orden: 1, activa: true },
  { id: 'sub6', categoria_id: 'cat3', nombre: 'Cómodas Clásicas', orden: 2, activa: true },
  { id: 'sub7', categoria_id: 'cat4', nombre: 'Roperos 2 Puertas', orden: 1, activa: true },
  { id: 'sub8', categoria_id: 'cat4', nombre: 'Roperos 3 Puertas', orden: 2, activa: true },
  { id: 'sub9', categoria_id: 'cat5', nombre: 'Escritorios con Repisa', orden: 1, activa: true },
  { id: 'sub10', categoria_id: 'cat6', nombre: 'Repisas', orden: 1, activa: true },
  { id: 'sub11', categoria_id: 'cat6', nombre: 'Canastos', orden: 2, activa: true },
];

const DEMO_PRODUCTOS: Producto[] = [
  {
    id: 'p1', codigo: 'CUN-LUN-001', nombre: 'Cuna Luna', categoria_id: 'cat1', subcategoria_id: 'sub1',
    descripcion: 'Cuna funcional con diseño de luna creciente, ideal para decoraciones celestiales.',
    medidas: '120x60cm, 130x70cm, 140x70cm',
    material: 'MDF 18mm con cantos de PVC, acabado lacado mate',
    garantia: '6 meses por defectos de fabricación',
    precio_base: 450000, precio_descuento: 350000, entrega_inmediata: true,
    imagenes: [], activo: true,
    creado_en: '2025-01-15', actualizado_en: '2025-03-01',
  },
  {
    id: 'p2', codigo: 'CUN-EST-002', nombre: 'Cuna Estrella', categoria_id: 'cat1', subcategoria_id: 'sub1',
    descripcion: 'Cuna funcional con motivos de estrellas, perfecta para un cuarto de ensueño.',
    medidas: '120x60cm, 130x70cm, 140x70cm',
    material: 'MDF 15mm con detalles tallados, acabado lacado',
    garantia: '6 meses por defectos de fabricación',
    precio_base: 520000, precio_descuento: 320000, entrega_inmediata: true,
    imagenes: [], activo: true,
    creado_en: '2025-01-20', actualizado_en: '2025-03-01',
  },
  {
    id: 'p3', codigo: 'CUN-NUB-003', nombre: 'Cuna Nube', categoria_id: 'cat1', subcategoria_id: 'sub1',
    descripcion: 'Cuna funcional con forma de nube suave, diseño minimalista y tierno.',
    medidas: '120x60cm, 130x70cm',
    material: 'MDF 18mm, terminación suave al tacto',
    garantia: '6 meses por defectos de fabricación',
    precio_base: 480000, precio_descuento: 380000, entrega_inmediata: false,
    imagenes: [], activo: true,
    creado_en: '2025-02-01', actualizado_en: '2025-03-01',
  },
  {
    id: 'p4', codigo: 'CAM-INF-001', nombre: 'Cama Infantil Safari', categoria_id: 'cat2', subcategoria_id: 'sub3',
    descripcion: 'Cama infantil con divertidos motivos de safari, perfecta para los más aventureros.',
    medidas: '80x160cm, 80x180cm, 90x190cm',
    material: 'MDF 18mm con serigrafía de animales',
    garantia: '6 meses por defectos de fabricación',
    precio_base: 380000, precio_descuento: 0, entrega_inmediata: true,
    imagenes: [], activo: true,
    creado_en: '2025-02-10', actualizado_en: '2025-03-01',
  },
  {
    id: 'p5', codigo: 'CAM-JUV-001', nombre: 'Cama Juvenil Nordic', categoria_id: 'cat2', subcategoria_id: 'sub4',
    descripcion: 'Cama juvenil estilo nórdico, limpia y moderna para adolescentes.',
    medidas: '80x180cm, 90x190cm',
    material: 'MDF 18mm con melamina de alta calidad',
    garantia: '6 meses por defectos de fabricación',
    precio_base: 420000, precio_descuento: 350000, entrega_inmediata: false,
    imagenes: [], activo: true,
    creado_en: '2025-02-15', actualizado_en: '2025-03-01',
  },
  {
    id: 'p6', codigo: 'COM-CAM-001', nombre: 'Cómoda Cambiador Daisy', categoria_id: 'cat3', subcategoria_id: 'sub5',
    descripcion: 'Cómoda con cambiador integrado, diseño de margaritas para un toque dulce.',
    medidas: '80x50x90cm',
    material: 'MDF 18mm con 4 cajones, rieles silenciosos',
    garantia: '6 meses por defectos de fabricación',
    precio_base: 380000, precio_descuento: 0, entrega_inmediata: true,
    imagenes: [], activo: true,
    creado_en: '2025-02-20', actualizado_en: '2025-03-01',
  },
  {
    id: 'p7', codigo: 'ROP-2P-001', nombre: 'Ropero 2 Puertas Rainbow', categoria_id: 'cat4', subcategoria_id: 'sub7',
    descripcion: 'Ropero de 2 puertas con arcoíris en las puertas, funcional y decorativo.',
    medidas: '1.20m ancho, 1.50m ancho, 1.80m ancho',
    material: 'MDF 18mm, bisagras de cierre suave',
    garantia: '6 meses por defectos de fabricación',
    precio_base: 520000, precio_descuento: 0, entrega_inmediata: false,
    imagenes: [], activo: true,
    creado_en: '2025-03-01', actualizado_en: '2025-03-01',
  },
  {
    id: 'p8', codigo: 'ESC-001', nombre: 'Escritorio Explorer', categoria_id: 'cat5', subcategoria_id: 'sub9',
    descripcion: 'Escritorio con repisa integrada, perfecto para la hora de tarea.',
    medidas: '100x50x75cm',
    material: 'MDF 15mm con estructura robusta, patas con niveladores',
    garantia: '6 meses por defectos de fabricación',
    precio_base: 280000, precio_descuento: 220000, entrega_inmediata: true,
    imagenes: [], activo: true,
    creado_en: '2025-03-05', actualizado_en: '2025-03-01',
  },
];

const DEMO_OPCIONES: ProductoOpcion[] = [
  { id: 'op1', producto_id: 'p1', tipo: 'medida', nombre: 'Medida', requerida: true, orden: 1 },
  { id: 'op2', producto_id: 'p1', tipo: 'colchon', nombre: 'Colchón', requerida: false, orden: 2 },
  { id: 'op3', producto_id: 'p1', tipo: 'lenceria', nombre: 'Lencería', requerida: false, orden: 3 },
  { id: 'op4', producto_id: 'p2', tipo: 'medida', nombre: 'Medida', requerida: true, orden: 1 },
  { id: 'op5', producto_id: 'p2', tipo: 'colchon', nombre: 'Colchón', requerida: false, orden: 2 },
  { id: 'op6', producto_id: 'p2', tipo: 'lenceria', nombre: 'Lencería', requerida: false, orden: 3 },
  { id: 'op7', producto_id: 'p3', tipo: 'medida', nombre: 'Medida', requerida: true, orden: 1 },
  { id: 'op8', producto_id: 'p3', tipo: 'colchon', nombre: 'Colchón', requerida: false, orden: 2 },
  { id: 'op9', producto_id: 'p3', tipo: 'lenceria', nombre: 'Lencería', requerida: false, orden: 3 },
  { id: 'op10', producto_id: 'p4', tipo: 'medida', nombre: 'Medida', requerida: true, orden: 1 },
  { id: 'op11', producto_id: 'p4', tipo: 'colchon', nombre: 'Colchón', requerida: false, orden: 2 },
  { id: 'op12', producto_id: 'p6', tipo: 'medida', nombre: 'Acabado', requerida: true, orden: 1 },
  { id: 'op13', producto_id: 'p7', tipo: 'medida', nombre: 'Medida', requerida: true, orden: 1 },
];

const DEMO_OPCION_VALORES: ProductoOpcionValor[] = [
  { id: 'ov1', opcion_id: 'op1', nombre: '120x60', precio_incremento: 0, activo: true },
  { id: 'ov2', opcion_id: 'op1', nombre: '130x70', precio_incremento: 50000, activo: true },
  { id: 'ov3', opcion_id: 'op1', nombre: '140x70', precio_incremento: 80000, activo: true },
  { id: 'ov4', opcion_id: 'op2', nombre: 'Sin colchón', precio_incremento: 0, activo: true },
  { id: 'ov5', opcion_id: 'op2', nombre: 'Colchón 120x60', precio_incremento: 120000, activo: true },
  { id: 'ov6', opcion_id: 'op2', nombre: 'Colchón 130x70', precio_incremento: 140000, activo: true },
  { id: 'ov7', opcion_id: 'op2', nombre: 'Colchón 140x70', precio_incremento: 160000, activo: true },
  { id: 'ov8', opcion_id: 'op3', nombre: 'Sin lencería', precio_incremento: 0, activo: true },
  { id: 'ov9', opcion_id: 'op3', nombre: 'Lencería Básica', precio_incremento: 85000, activo: true },
  { id: 'ov10', opcion_id: 'op3', nombre: 'Lencería Premium', precio_incremento: 150000, activo: true },
  { id: 'ov11', opcion_id: 'op4', nombre: '120x60', precio_incremento: 0, activo: true },
  { id: 'ov12', opcion_id: 'op4', nombre: '130x70', precio_incremento: 50000, activo: true },
  { id: 'ov13', opcion_id: 'op4', nombre: '140x70', precio_incremento: 80000, activo: true },
  { id: 'ov14', opcion_id: 'op5', nombre: 'Sin colchón', precio_incremento: 0, activo: true },
  { id: 'ov15', opcion_id: 'op5', nombre: 'Colchón 120x60', precio_incremento: 120000, activo: true },
  { id: 'ov16', opcion_id: 'op5', nombre: 'Colchón 130x70', precio_incremento: 140000, activo: true },
  { id: 'ov17', opcion_id: 'op5', nombre: 'Colchón 140x70', precio_incremento: 160000, activo: true },
  { id: 'ov18', opcion_id: 'op6', nombre: 'Sin lencería', precio_incremento: 0, activo: true },
  { id: 'ov19', opcion_id: 'op6', nombre: 'Lencería Básica', precio_incremento: 85000, activo: true },
  { id: 'ov20', opcion_id: 'op6', nombre: 'Lencería Premium', precio_incremento: 150000, activo: true },
  { id: 'ov21', opcion_id: 'op7', nombre: '120x60', precio_incremento: 0, activo: true },
  { id: 'ov22', opcion_id: 'op7', nombre: '130x70', precio_incremento: 50000, activo: true },
  { id: 'ov23', opcion_id: 'op8', nombre: 'Sin colchón', precio_incremento: 0, activo: true },
  { id: 'ov24', opcion_id: 'op8', nombre: 'Colchón 120x60', precio_incremento: 120000, activo: true },
  { id: 'ov25', opcion_id: 'op9', nombre: 'Sin lencería', precio_incremento: 0, activo: true },
  { id: 'ov26', opcion_id: 'op9', nombre: 'Lencería Básica', precio_incremento: 85000, activo: true },
  { id: 'ov27', opcion_id: 'op10', nombre: '80x160', precio_incremento: 0, activo: true },
  { id: 'ov28', opcion_id: 'op10', nombre: '80x180', precio_incremento: 40000, activo: true },
  { id: 'ov29', opcion_id: 'op10', nombre: '90x190', precio_incremento: 60000, activo: true },
  { id: 'ov30', opcion_id: 'op11', nombre: 'Sin colchón', precio_incremento: 0, activo: true },
  { id: 'ov31', opcion_id: 'op11', nombre: 'Colchón 80x160', precio_incremento: 150000, activo: true },
  { id: 'ov32', opcion_id: 'op11', nombre: 'Colchón 80x180', precio_incremento: 170000, activo: true },
  { id: 'ov33', opcion_id: 'op11', nombre: 'Colchón 90x190', precio_incremento: 190000, activo: true },
  { id: 'ov34', opcion_id: 'op12', nombre: 'Blanco', precio_incremento: 0, activo: true },
  { id: 'ov35', opcion_id: 'op12', nombre: 'Natural', precio_incremento: 20000, activo: true },
  { id: 'ov36', opcion_id: 'op12', nombre: 'Gris', precio_incremento: 30000, activo: true },
  { id: 'ov37', opcion_id: 'op13', nombre: '1.20m ancho', precio_incremento: 0, activo: true },
  { id: 'ov38', opcion_id: 'op13', nombre: '1.50m ancho', precio_incremento: 80000, activo: true },
  { id: 'ov39', opcion_id: 'op13', nombre: '1.80m ancho', precio_incremento: 150000, activo: true },
];

interface CatalogoState {
  categorias: Categoria[];
  subcategorias: Subcategoria[];
  productos: Producto[];
  opciones: ProductoOpcion[];
  opcionValores: ProductoOpcionValor[];
  searchTerm: string;
  filtroCategoria: string | null;
  filtroSubcategoria: string | null;
  isLoaded: boolean;
  isLoading: boolean;
  setSearchTerm: (term: string) => void;
  setFiltroCategoria: (catId: string | null) => void;
  setFiltroSubcategoria: (subId: string | null) => void;
  addProducto: (p: Producto) => void;
  updateProducto: (p: Producto) => void;
  deleteProducto: (id: string) => void;
  addCategoria: (c: Categoria) => void;
  updateCategoria: (c: Categoria) => void;
  deleteCategoria: (id: string) => void;
  addSubcategoria: (s: Subcategoria) => void;
  updateSubcategoria: (s: Subcategoria) => void;
  deleteSubcategoria: (id: string) => void;
  getOpcionesByProducto: (productoId: string) => ProductoOpcion[];
  getValoresByOpcion: (opcionId: string) => ProductoOpcionValor[];
  filteredProductos: () => Producto[];
  loadFromSupabase: () => Promise<void>;
  saveProductoToSupabase: (p: Producto, opciones?: any[]) => Promise<boolean>;
  deleteProductoFromSupabase: (id: string) => Promise<boolean>;
}

export const useCatalogoStore = create<CatalogoState>((set, get) => ({
  categorias: DEMO_CATEGORIAS,
  subcategorias: DEMO_SUBCATEGORIAS,
  productos: DEMO_PRODUCTOS,
  opciones: DEMO_OPCIONES,
  opcionValores: DEMO_OPCION_VALORES,
  searchTerm: '',
  filtroCategoria: null,
  filtroSubcategoria: null,
  isLoaded: false,
  isLoading: false,

  setSearchTerm: (term) => set({ searchTerm: term }),
  setFiltroCategoria: (catId) => set({ filtroCategoria: catId, filtroSubcategoria: null }),
  setFiltroSubcategoria: (subId) => set({ filtroSubcategoria: subId }),

  addProducto: (p) => set((s) => ({ productos: [...s.productos, p] })),
  updateProducto: (p) => set((s) => ({
    productos: s.productos.map(prod => prod.id === p.id ? p : prod),
  })),
  deleteProducto: (id) => set((s) => ({
    productos: s.productos.filter(p => p.id !== id),
  })),

  addCategoria: (c) => set((s) => ({ categorias: [...s.categorias, c] })),
  updateCategoria: (c) => set((s) => ({
    categorias: s.categorias.map(cat => cat.id === c.id ? c : cat),
  })),
  deleteCategoria: (id) => set((s) => ({
    categorias: s.categorias.filter(c => c.id !== id),
  })),

  addSubcategoria: (sub) => set((s) => ({ subcategorias: [...s.subcategorias, sub] })),
  updateSubcategoria: (sub) => set((s) => ({
    subcategorias: s.subcategorias.map(su => su.id === sub.id ? sub : su),
  })),
  deleteSubcategoria: (id) => set((s) => ({
    subcategorias: s.subcategorias.filter(su => su.id !== id),
  })),

  getOpcionesByProducto: (productoId) => get().opciones.filter(o => o.producto_id === productoId),
  getValoresByOpcion: (opcionId) => get().opcionValores.filter(v => v.opcion_id === opcionId),

  filteredProductos: () => {
    const { productos, searchTerm, filtroCategoria, filtroSubcategoria } = get();
    return productos.filter(p => {
      const matchSearch = !searchTerm ||
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategoria = !filtroCategoria || p.categoria_id === filtroCategoria;
      const matchSubcategoria = !filtroSubcategoria || p.subcategoria_id === filtroSubcategoria;
      return matchSearch && matchCategoria && matchSubcategoria && p.activo;
    });
  },

  // --- Cargar datos desde Supabase ---
  loadFromSupabase: async () => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('Supabase no configurado, usando datos demo');
      set({ isLoaded: true });
      return;
    }

    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      // Cargar categorías
      const { data: catData, error: catError } = await supabase
        .from('categorias')
        .select('*')
        .order('orden');
      if (catError) throw catError;

      // Cargar subcategorías
      const { data: subData, error: subError } = await supabase
        .from('subcategorias')
        .select('*')
        .order('orden');
      if (subError) throw subError;

      // Cargar productos
      const { data: prodData, error: prodError } = await supabase
        .from('productos')
        .select('*')
        .order('nombre');
      if (prodError) throw prodError;

      // Cargar opciones
      const { data: opData, error: opError } = await supabase
        .from('producto_opciones')
        .select('*')
        .order('orden');
      if (opError) throw opError;

      // Cargar valores de opciones
      const { data: valData, error: valError } = await supabase
        .from('producto_opcion_valores')
        .select('*');
      if (valError) throw valError;

      // Mapear datos de Supabase al formato de la app
      const categorias: Categoria[] = (catData || []).map((c: any) => ({
        id: c.id,
        nombre: c.nombre,
        icono: c.icono || undefined,
        orden: c.orden || 0,
        activa: c.activa ?? true,
      }));

      const subcategorias: Subcategoria[] = (subData || []).map((s: any) => ({
        id: s.id,
        categoria_id: s.categoria_id,
        nombre: s.nombre,
        orden: s.orden || 0,
        activa: s.activa ?? true,
      }));

      const productos: Producto[] = (prodData || []).map((p: any) => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        categoria_id: p.categoria_id,
        subcategoria_id: p.subcategoria_id || undefined,
        descripcion: p.descripcion || '',
        medidas: p.medidas || '',
        material: p.material || '',
        garantia: p.garantia || '',
        precio_base: p.precio_base || 0,
        precio_descuento: p.precio_descuento || 0,
        entrega_inmediata: p.entrega_inmediata ?? false,
        imagenes: p.imagenes || [],
        activo: p.activo ?? true,
        creado_en: p.creado_en || new Date().toISOString(),
        actualizado_en: p.actualizado_en || new Date().toISOString(),
      }));

      const opciones: ProductoOpcion[] = (opData || []).map((o: any) => ({
        id: o.id,
        producto_id: o.producto_id,
        tipo: o.tipo,
        nombre: o.nombre,
        requerida: o.requerida ?? false,
        orden: o.orden || 0,
      }));

      const opcionValores: ProductoOpcionValor[] = (valData || []).map((v: any) => ({
        id: v.id,
        opcion_id: v.opcion_id,
        nombre: v.nombre,
        precio_incremento: v.precio_incremento || 0,
        activo: v.activo ?? true,
      }));

      // Solo reemplazar datos demo si Supabase tiene datos; si no, mantener demo como fallback
      const finalCategorias = categorias.length > 0 ? categorias : get().categorias;
      const finalSubcategorias = subcategorias.length > 0 ? subcategorias : get().subcategorias;

      set({
        categorias: finalCategorias,
        subcategorias: finalSubcategorias,
        productos,
        opciones,
        opcionValores,
        isLoaded: true,
        isLoading: false,
      });

      console.log(`Catálogo cargado desde Supabase: ${productos.length} productos, ${finalCategorias.length} categorías (${categorias.length > 0 ? 'Supabase' : 'demo'})`);
    } catch (error) {
      console.error('Error cargando datos desde Supabase:', error);
      set({ isLoaded: true, isLoading: false });
    }
  },

  // --- Guardar producto en Supabase ---
  saveProductoToSupabase: async (p: Producto, opciones?: any[]) => {
    if (!isSupabaseConfigured() || !supabase) {
      // Solo actualizar store local
      const exists = get().productos.find(prod => prod.id === p.id);
      if (exists) {
        get().updateProducto(p);
      } else {
        get().addProducto(p);
      }
      return true;
    }

    try {
      const productoData = {
        codigo: p.codigo,
        nombre: p.nombre,
        categoria_id: p.categoria_id,
        subcategoria_id: p.subcategoria_id || null,
        descripcion: p.descripcion,
        medidas: p.medidas,
        material: p.material,
        garantia: p.garantia,
        precio_base: p.precio_base,
        precio_descuento: p.precio_descuento,
        entrega_inmediata: p.entrega_inmediata,
        imagenes: p.imagenes,
        activo: p.activo,
      };

      const existing = get().productos.find(prod => prod.id === p.id);

      if (existing) {
        // Update
        const { error } = await supabase
          .from('productos')
          .update(productoData)
          .eq('id', p.id);
        if (error) throw error;
        get().updateProducto(p);
      } else {
        // Insert
        const { data, error } = await supabase
          .from('productos')
          .insert(productoData)
          .select()
          .single();
        if (error) throw error;
        // Use the Supabase-generated ID
        const newProducto = { ...p, id: data.id };
        get().addProducto(newProducto);
      }

      return true;
    } catch (error) {
      console.error('Error guardando producto en Supabase:', error);
      // Fallback: actualizar solo localmente
      const exists = get().productos.find(prod => prod.id === p.id);
      if (exists) {
        get().updateProducto(p);
      } else {
        get().addProducto(p);
      }
      return false;
    }
  },

  // --- Eliminar producto de Supabase ---
  deleteProductoFromSupabase: async (id: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      get().deleteProducto(id);
      return true;
    }

    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);
      if (error) throw error;
      get().deleteProducto(id);
      return true;
    } catch (error) {
      console.error('Error eliminando producto de Supabase:', error);
      get().deleteProducto(id);
      return false;
    }
  },
}));
