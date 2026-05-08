// ==========================================
// TIPOS PRINCIPALES - VIVANTICOS APP
// ==========================================

// --- Roles ---
export type UserRole = 'admin' | 'jefe' | 'vendedor';

// --- Categorías ---
export interface Categoria {
  id: string;
  nombre: string;
  icono?: string;
  orden: number;
  activa: boolean;
}

export interface Subcategoria {
  id: string;
  nombre: string;
  categoria_id: string;
  orden: number;
  activa: boolean;
}

// --- Tipos de producto ---
export type TipoProducto = 'cuna' | 'colchon' | 'lenceria' | 'cambiador' | 'cama' | 'ropero' | 'escritorio' | 'accesorio' | 'otro';

export const TIPO_PRODUCTO_LABELS: Record<TipoProducto, string> = {
  cuna: 'Cuna',
  colchon: 'Colchón',
  lenceria: 'Lencería',
  cambiador: 'Cambiador',
  cama: 'Cama',
  ropero: 'Ropero',
  escritorio: 'Escritorio',
  accesorio: 'Accesorio',
  otro: 'Otro',
};

// --- Productos ---
export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string; // Solo visible dentro de la app (admin/vendedor)
  medidas: string; // Solo visible dentro de la app
  material: string; // Solo visible dentro de la app
  garantia: string; // Solo visible dentro de la app
  precio_base: number;
  precio_descuento: number; // 0 = sin descuento
  tipo_producto: TipoProducto; // Tipo de producto para descuentos automáticos
  descuento_base: number; // Descuento automático por tipo de producto en cotizaciones
  categoria_id: string;
  subcategoria_id?: string;
  entrega_inmediata: boolean;
  imagenes: string[]; // URLs de Cloudinary, máximo 4
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

// --- Opciones de producto ---
export type TipoOpcionInput = 'select' | 'checkbox';

export interface ProductoOpcion {
  id: string;
  producto_id: string;
  nombre: string; // ej: Medida, Colchón, Lencería
  tipo: TipoOpcionInput; // select = dropdown, checkbox = toggle
  requerida: boolean;
  orden: number;
}

export interface ProductoOpcionValor {
  id: string;
  opcion_id: string;
  nombre: string;
  incremento_precio: number; // Renamed from precio_incremento
  activo: boolean;
}

// --- Cotizaciones ---
export type EstadoCotizacion = 'borrador' | 'enviada' | 'aprobada' | 'rechazada';

export interface Cotizacion {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email?: string;
  cliente_direccion?: string;  // NEW
  cliente_id?: string;         // NEW - link to clientes table
  items: CotizacionItem[];
  subtotal: number;
  descuento_total: number;
  total: number;
  estado: EstadoCotizacion;
  vendedor_id: string;
  notas?: string;
  creado_en: string;
  actualizado_en: string;
}

export interface CotizacionItem {
  id: string;
  cotizacion_id: string;
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number; // precio_base efectivo (con descuento si aplica)
  opciones_seleccionadas: ItemOpcionSeleccionada[];
  subtotal: number; // precio_unitario + incrementos (antes de descuento tipo)
  configuracion: Record<string, any>; // Snapshot completo de la configuración
  precio_total_item: number; // precio final = precio_base + incrementos - descuento_aplicado
  descuento_aplicado: number; // Descuento automático por tipo_producto
}

export interface ItemOpcionSeleccionada {
  opcion_id: string;
  opcion_nombre: string;
  opcion_tipo: TipoOpcionInput; // select o checkbox
  valor_id: string;
  valor_nombre: string;
  incremento_precio: number; // Renamed from precio_incremento
}

// --- Usuarios ---
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password: string;
  rol: UserRole;
  activo: boolean;
  telefono?: string;
  avatar_url?: string;
  creado_en: string;
}

// --- Entregas ---
export type EstadoEntrega = 'pendiente' | 'entregado' | 'completado';

export interface Entrega {
  id: string;
  cotizacion_id?: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_direccion: string;
  fecha_entrega: string;
  estado: EstadoEntrega;
  notas?: string;
  items: EntregaItem[];
  vendedor_id: string;
  creado_en: string;
  actualizado_en: string;
}

export interface EntregaItem {
  id: string;
  producto_nombre: string;
  cantidad: number;
  configuracion?: string;
}

// --- Clientes ---
export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email?: string;
  direccion?: string;
  creado_en: string;
  actualizado_en: string;
}

// --- Opcionales Predefinidos ---
export interface OpcionalPredefinido {
  id: string;
  nombre: string;
  valor: number;
  categoria: string; // 'cuna' | 'colchon'
  activo: boolean;
  orden: number;
}

// --- Vistas de navegación ---
export type AppView =
  | 'dashboard'
  | 'catalogo'
  | 'producto-detalle'
  | 'producto-form'
  | 'cotizaciones'
  | 'cotizacion-form'
  | 'cotizacion-detalle'
  | 'entregas'
  | 'entrega-form'
  | 'usuarios'
  | 'usuario-form'
  | 'categorias'
  | 'clientes'
  | 'configuracion';

// --- Notificaciones ---
export interface Notificacion {
  id: string;
  tipo: 'entrega_manana' | 'entrega_hoy' | 'cotizacion_aprobada' | 'info';
  titulo: string;
  mensaje: string;
  leida: boolean;
  creado_en: string;
  relacionado_id?: string;
}
