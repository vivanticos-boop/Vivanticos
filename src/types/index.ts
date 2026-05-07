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
  categoria_id: string;
  subcategoria_id?: string;
  entrega_inmediata: boolean;
  imagenes: string[]; // URLs de Cloudinary, máximo 4
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

// --- Opciones de producto ---
export type TipoOpcion = 'medida' | 'colchon' | 'lenceria' | 'extra';

export interface ProductoOpcion {
  id: string;
  producto_id: string;
  tipo: TipoOpcion;
  nombre: string;
  requerida: boolean;
  orden: number;
}

export interface ProductoOpcionValor {
  id: string;
  opcion_id: string;
  nombre: string;
  precio_incremento: number;
  activo: boolean;
}

// --- Cotizaciones ---
export type EstadoCotizacion = 'borrador' | 'enviada' | 'aprobada' | 'rechazada';

export interface Cotizacion {
  id: string;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email?: string;
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
  precio_unitario: number;
  opciones_seleccionadas: ItemOpcionSeleccionada[];
  subtotal: number;
}

export interface ItemOpcionSeleccionada {
  opcion_id: string;
  opcion_nombre: string;
  valor_id: string;
  valor_nombre: string;
  precio_incremento: number;
}

// --- Usuarios ---
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
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
