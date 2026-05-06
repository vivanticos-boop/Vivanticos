// ==========================================
// STORE DE DATOS (CATÁLOGO) - VIVANTICOS
// ==========================================

import { create } from 'zustand';
import type { Categoria, Subcategoria, Producto, ProductoOpcion, ProductoOpcionValor } from '@/types';

// --- Datos demo ---
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
    descripcion_tecnica: 'Estructura en MDF 18mm con cantos de PVC. Acabado lacado mate. Incluye barandas removibles y ruedas con freno. Medida estándar 120x60cm.',
    precio_base: 450000, imagenes: [], activo: true, descuento_tipo: 'cuna', descuento_valor: 100000,
    creado_en: '2025-01-15', actualizado_en: '2025-03-01',
  },
  {
    id: 'p2', codigo: 'CUN-EST-002', nombre: 'Cuna Estrella', categoria_id: 'cat1', subcategoria_id: 'sub1',
    descripcion: 'Cuna funcional con motivos de estrellas, perfecta para un cuarto de ensueño.',
    descripcion_tecnica: 'MDF 15mm con detalles tallados. Incluye cajón debajo. Baranda frontal rebatible. Acabado lacado.',
    precio_base: 520000, imagenes: [], activo: true, descuento_tipo: 'cuna', descuento_valor: 200000,
    creado_en: '2025-01-20', actualizado_en: '2025-03-01',
  },
  {
    id: 'p3', codigo: 'CUN-NUB-003', nombre: 'Cuna Nube', categoria_id: 'cat1', subcategoria_id: 'sub1',
    descripcion: 'Cuna funcional con forma de nube suave, diseño minimalista y tierno.',
    descripcion_tecnica: 'MDF 18mm. Diseño recortado de nube en cabecera y piecera. Ruedas de silicone. Terminación suave al tacto.',
    precio_base: 480000, imagenes: [], activo: true, descuento_tipo: 'cuna', descuento_valor: 100000,
    creado_en: '2025-02-01', actualizado_en: '2025-03-01',
  },
  {
    id: 'p4', codigo: 'CAM-INF-001', nombre: 'Cama Infantil Safari', categoria_id: 'cat2', subcategoria_id: 'sub3',
    descripcion: 'Cama infantil con divertidos motivos de safari, perfecta para los más aventureros.',
    descripcion_tecnica: 'Estructura en MDF 18mm con serigrafía de animales. Baranda de seguridad lateral desmontable. Incluye repisa en piecera.',
    precio_base: 380000, imagenes: [], activo: true, descuento_tipo: 'ninguno', descuento_valor: 0,
    creado_en: '2025-02-10', actualizado_en: '2025-03-01',
  },
  {
    id: 'p5', codigo: 'CAM-JUV-001', nombre: 'Cama Juvenil Nordic', categoria_id: 'cat2', subcategoria_id: 'sub4',
    descripcion: 'Cama juvenil estilo nórdico, limpia y moderna para adolescentes.',
    descripcion_tecnica: 'MDF 18mm con melamina de alta calidad. Líneas rectas y minimalistas. Disponible en varios colores.',
    precio_base: 420000, imagenes: [], activo: true, descuento_tipo: 'ninguno', descuento_valor: 0,
    creado_en: '2025-02-15', actualizado_en: '2025-03-01',
  },
  {
    id: 'p6', codigo: 'COM-CAM-001', nombre: 'Cómoda Cambiador Daisy', categoria_id: 'cat3', subcategoria_id: 'sub5',
    descripcion: 'Cómoda con cambiador integrado, diseño de margaritas para un toque dulce.',
    descripcion_tecnica: 'MDF 18mm con 4 cajones con rieles silenciosos. Superficie superior como cambiador. Detalles serigrafiados.',
    precio_base: 380000, imagenes: [], activo: true, descuento_tipo: 'ninguno', descuento_valor: 0,
    creado_en: '2025-02-20', actualizado_en: '2025-03-01',
  },
  {
    id: 'p7', codigo: 'ROP-2P-001', nombre: 'Ropero 2 Puertas Rainbow', categoria_id: 'cat4', subcategoria_id: 'sub7',
    descripcion: 'Ropero de 2 puertas con arcoíris en las puertas, funcional y decorativo.',
    descripcion_tecnica: 'MDF 18mm. Puertas con bisagras de cierre suave. Interior con repisa y colgador. Acabado lacado mate.',
    precio_base: 520000, imagenes: [], activo: true, descuento_tipo: 'ninguno', descuento_valor: 0,
    creado_en: '2025-03-01', actualizado_en: '2025-03-01',
  },
  {
    id: 'p8', codigo: 'ESC-001', nombre: 'Escritorio Explorer', categoria_id: 'cat5', subcategoria_id: 'sub9',
    descripcion: 'Escritorio con repisa integrada, perfecto para la hora de tarea.',
    descripcion_tecnica: 'MDF 15mm con estructura robusta. Repisa superior para libros. Cajón para útiles. Patas con niveladores.',
    precio_base: 280000, imagenes: [], activo: true, descuento_tipo: 'ninguno', descuento_valor: 0,
    creado_en: '2025-03-05', actualizado_en: '2025-03-01',
  },
];

const DEMO_OPCIONES: ProductoOpcion[] = [
  // Opciones para Cuna Luna
  { id: 'op1', producto_id: 'p1', tipo: 'medida', nombre: 'Medida', requerida: true, orden: 1 },
  { id: 'op2', producto_id: 'p1', tipo: 'colchon', nombre: 'Colchón', requerida: false, orden: 2 },
  { id: 'op3', producto_id: 'p1', tipo: 'lenceria', nombre: 'Lencería', requerida: false, orden: 3 },
  // Opciones para Cuna Estrella
  { id: 'op4', producto_id: 'p2', tipo: 'medida', nombre: 'Medida', requerida: true, orden: 1 },
  { id: 'op5', producto_id: 'p2', tipo: 'colchon', nombre: 'Colchón', requerida: false, orden: 2 },
  { id: 'op6', producto_id: 'p2', tipo: 'lenceria', nombre: 'Lencería', requerida: false, orden: 3 },
  // Opciones para Cuna Nube
  { id: 'op7', producto_id: 'p3', tipo: 'medida', nombre: 'Medida', requerida: true, orden: 1 },
  { id: 'op8', producto_id: 'p3', tipo: 'colchon', nombre: 'Colchón', requerida: false, orden: 2 },
  { id: 'op9', producto_id: 'p3', tipo: 'lenceria', nombre: 'Lencería', requerida: false, orden: 3 },
  // Opciones para Cama Infantil Safari
  { id: 'op10', producto_id: 'p4', tipo: 'medida', nombre: 'Medida', requerida: true, orden: 1 },
  { id: 'op11', producto_id: 'p4', tipo: 'colchon', nombre: 'Colchón', requerida: false, orden: 2 },
  // Opciones para Cómoda
  { id: 'op12', producto_id: 'p6', tipo: 'medida', nombre: 'Acabado', requerida: true, orden: 1 },
  // Opciones para Ropero
  { id: 'op13', producto_id: 'p7', tipo: 'medida', nombre: 'Medida', requerida: true, orden: 1 },
];

const DEMO_OPCION_VALORES: ProductoOpcionValor[] = [
  // Medidas para Cuna Luna
  { id: 'ov1', opcion_id: 'op1', nombre: '120x60', precio_incremento: 0, activo: true },
  { id: 'ov2', opcion_id: 'op1', nombre: '130x70', precio_incremento: 50000, activo: true },
  { id: 'ov3', opcion_id: 'op1', nombre: '140x70', precio_incremento: 80000, activo: true },
  // Colchón para Cuna Luna
  { id: 'ov4', opcion_id: 'op2', nombre: 'Sin colchón', precio_incremento: 0, activo: true },
  { id: 'ov5', opcion_id: 'op2', nombre: 'Colchón 120x60', precio_incremento: 120000, activo: true },
  { id: 'ov6', opcion_id: 'op2', nombre: 'Colchón 130x70', precio_incremento: 140000, activo: true },
  { id: 'ov7', opcion_id: 'op2', nombre: 'Colchón 140x70', precio_incremento: 160000, activo: true },
  // Lencería para Cuna Luna
  { id: 'ov8', opcion_id: 'op3', nombre: 'Sin lencería', precio_incremento: 0, activo: true },
  { id: 'ov9', opcion_id: 'op3', nombre: 'Lencería Básica', precio_incremento: 85000, activo: true },
  { id: 'ov10', opcion_id: 'op3', nombre: 'Lencería Premium', precio_incremento: 150000, activo: true },
  // Medidas para Cuna Estrella
  { id: 'ov11', opcion_id: 'op4', nombre: '120x60', precio_incremento: 0, activo: true },
  { id: 'ov12', opcion_id: 'op4', nombre: '130x70', precio_incremento: 50000, activo: true },
  { id: 'ov13', opcion_id: 'op4', nombre: '140x70', precio_incremento: 80000, activo: true },
  // Colchón Cuna Estrella
  { id: 'ov14', opcion_id: 'op5', nombre: 'Sin colchón', precio_incremento: 0, activo: true },
  { id: 'ov15', opcion_id: 'op5', nombre: 'Colchón 120x60', precio_incremento: 120000, activo: true },
  { id: 'ov16', opcion_id: 'op5', nombre: 'Colchón 130x70', precio_incremento: 140000, activo: true },
  { id: 'ov17', opcion_id: 'op5', nombre: 'Colchón 140x70', precio_incremento: 160000, activo: true },
  // Lencería Cuna Estrella
  { id: 'ov18', opcion_id: 'op6', nombre: 'Sin lencería', precio_incremento: 0, activo: true },
  { id: 'ov19', opcion_id: 'op6', nombre: 'Lencería Básica', precio_incremento: 85000, activo: true },
  { id: 'ov20', opcion_id: 'op6', nombre: 'Lencería Premium', precio_incremento: 150000, activo: true },
  // Medidas Cuna Nube
  { id: 'ov21', opcion_id: 'op7', nombre: '120x60', precio_incremento: 0, activo: true },
  { id: 'ov22', opcion_id: 'op7', nombre: '130x70', precio_incremento: 50000, activo: true },
  // Colchón Cuna Nube
  { id: 'ov23', opcion_id: 'op8', nombre: 'Sin colchón', precio_incremento: 0, activo: true },
  { id: 'ov24', opcion_id: 'op8', nombre: 'Colchón 120x60', precio_incremento: 120000, activo: true },
  // Lencería Cuna Nube
  { id: 'ov25', opcion_id: 'op9', nombre: 'Sin lencería', precio_incremento: 0, activo: true },
  { id: 'ov26', opcion_id: 'op9', nombre: 'Lencería Básica', precio_incremento: 85000, activo: true },
  // Medidas Cama Infantil
  { id: 'ov27', opcion_id: 'op10', nombre: '80x160', precio_incremento: 0, activo: true },
  { id: 'ov28', opcion_id: 'op10', nombre: '80x180', precio_incremento: 40000, activo: true },
  { id: 'ov29', opcion_id: 'op10', nombre: '90x190', precio_incremento: 60000, activo: true },
  // Colchón Cama Infantil
  { id: 'ov30', opcion_id: 'op11', nombre: 'Sin colchón', precio_incremento: 0, activo: true },
  { id: 'ov31', opcion_id: 'op11', nombre: 'Colchón 80x160', precio_incremento: 150000, activo: true },
  { id: 'ov32', opcion_id: 'op11', nombre: 'Colchón 80x180', precio_incremento: 170000, activo: true },
  { id: 'ov33', opcion_id: 'op11', nombre: 'Colchón 90x190', precio_incremento: 190000, activo: true },
  // Acabado Cómoda
  { id: 'ov34', opcion_id: 'op12', nombre: 'Blanco', precio_incremento: 0, activo: true },
  { id: 'ov35', opcion_id: 'op12', nombre: 'Natural', precio_incremento: 20000, activo: true },
  { id: 'ov36', opcion_id: 'op12', nombre: 'Gris', precio_incremento: 30000, activo: true },
  // Medidas Ropero
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
  setSearchTerm: (term: string) => void;
  setFiltroCategoria: (catId: string | null) => void;
  addProducto: (p: Producto) => void;
  updateProducto: (p: Producto) => void;
  deleteProducto: (id: string) => void;
  addCategoria: (c: Categoria) => void;
  updateCategoria: (c: Categoria) => void;
  deleteCategoria: (id: string) => void;
  addSubcategoria: (s: Subcategoria) => void;
  getOpcionesByProducto: (productoId: string) => ProductoOpcion[];
  getValoresByOpcion: (opcionId: string) => ProductoOpcionValor[];
  getProductoPrecioConOpciones: (productoId: string, selecciones: Record<string, string>) => number;
  filteredProductos: () => Producto[];
}

export const useCatalogoStore = create<CatalogoState>((set, get) => ({
  categorias: DEMO_CATEGORIAS,
  subcategorias: DEMO_SUBCATEGORIAS,
  productos: DEMO_PRODUCTOS,
  opciones: DEMO_OPCIONES,
  opcionValores: DEMO_OPCION_VALORES,
  searchTerm: '',
  filtroCategoria: null,

  setSearchTerm: (term) => set({ searchTerm: term }),
  setFiltroCategoria: (catId) => set({ filtroCategoria: catId }),

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

  getOpcionesByProducto: (productoId) => get().opciones.filter(o => o.producto_id === productoId),
  getValoresByOpcion: (opcionId) => get().opcionValores.filter(v => v.opcion_id === opcionId),

  getProductoPrecioConOpciones: (productoId, selecciones) => {
    const producto = get().productos.find(p => p.id === productoId);
    if (!producto) return 0;
    let precio = producto.precio_base;
    Object.entries(selecciones).forEach(([_opId, valorId]) => {
      const valor = get().opcionValores.find(v => v.id === valorId);
      if (valor) precio += valor.precio_incremento;
    });
    // Aplicar descuento si aplica
    if (producto.descuento_tipo === 'colchon') {
      const colchonSeleccionado = Object.entries(selecciones).find(([opId]) => {
        const op = get().opciones.find(o => o.id === opId);
        return op?.tipo === 'colchon';
      });
      if (colchonSeleccionado) {
        const valor = get().opcionValores.find(v => v.id === colchonSeleccionado[1]);
        if (valor && valor.precio_incremento > 0) {
          precio -= (producto.descuento_valor || 80000);
        }
      }
    }
    return precio;
  },

  filteredProductos: () => {
    const { productos, searchTerm, filtroCategoria } = get();
    return productos.filter(p => {
      const matchSearch = !searchTerm ||
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategoria = !filtroCategoria || p.categoria_id === filtroCategoria;
      return matchSearch && matchCategoria && p.activo;
    });
  },
}));
