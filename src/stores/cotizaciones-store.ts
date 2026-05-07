// ==========================================
// STORE DE COTIZACIONES - VIVANTICOS
// Con cálculos automáticos de configuración y descuentos
// ==========================================

import { create } from 'zustand';
import type { Cotizacion, CotizacionItem, ItemOpcionSeleccionada, EstadoCotizacion } from '@/types';

// --- Persistencia localStorage ---
const COT_STORAGE_KEY = 'vivanticos-cotizaciones';

function loadCotFromStorage(): Cotizacion[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(COT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.cotizaciones || null;
    }
  } catch (e) {
    console.error('Error loading cotizaciones from localStorage:', e);
  }
  return null;
}

function saveCotToStorage(cotizaciones: Cotizacion[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COT_STORAGE_KEY, JSON.stringify({ cotizaciones, savedAt: new Date().toISOString() }));
  } catch (e) {
    console.error('Error saving cotizaciones to localStorage:', e);
  }
}

const DEMO_COTIZACIONES: Cotizacion[] = [
  {
    id: 'cot1',
    cliente_nombre: 'María García',
    cliente_telefono: '573001234567',
    cliente_email: 'maria@email.com',
    items: [
      {
        id: 'ci1', cotizacion_id: 'cot1', producto_id: 'p1', producto_nombre: 'Cuna Luna',
        cantidad: 1, precio_unitario: 350000,
        opciones_seleccionadas: [
          { opcion_id: 'op1', opcion_nombre: 'Medida', opcion_tipo: 'select', valor_id: 'ov1', valor_nombre: '1.00m (120x60)', incremento_precio: 0 },
          { opcion_id: 'op2', opcion_nombre: 'Colchón', opcion_tipo: 'checkbox', valor_id: 'ov4', valor_nombre: 'Incluir colchón', incremento_precio: 120000 },
          { opcion_id: 'op3', opcion_nombre: 'Lencería', opcion_tipo: 'select', valor_id: 'ov6', valor_nombre: 'Lencería Básica', incremento_precio: 85000 },
        ],
        subtotal: 555000,
        configuracion: { medida: '1.00m (120x60)', colchon: 'Incluir colchón', lenceria: 'Lencería Básica' },
        precio_total_item: 455000,
        descuento_aplicado: 100000,
      },
    ],
    subtotal: 555000,
    descuento_total: 100000,
    total: 455000,
    estado: 'aprobada',
    vendedor_id: 'u3',
    notas: 'Cliente quiere color blanco mate',
    creado_en: '2025-03-10T10:00:00Z',
    actualizado_en: '2025-03-12T14:30:00Z',
  },
  {
    id: 'cot2',
    cliente_nombre: 'Juan Pérez',
    cliente_telefono: '573009876543',
    items: [
      {
        id: 'ci2', cotizacion_id: 'cot2', producto_id: 'p2', producto_nombre: 'Cuna Estrella',
        cantidad: 1, precio_unitario: 320000,
        opciones_seleccionadas: [
          { opcion_id: 'op4', opcion_nombre: 'Medida', opcion_tipo: 'select', valor_id: 'ov8', valor_nombre: '1.00m (120x60)', incremento_precio: 0 },
          { opcion_id: 'op5', opcion_nombre: 'Colchón', opcion_tipo: 'checkbox', valor_id: 'ov11', valor_nombre: 'Incluir colchón', incremento_precio: 120000 },
        ],
        subtotal: 440000,
        configuracion: { medida: '1.00m (120x60)', colchon: 'Incluir colchón' },
        precio_total_item: 240000,
        descuento_aplicado: 200000,
      },
      {
        id: 'ci3', cotizacion_id: 'cot2', producto_id: 'p6', producto_nombre: 'Cómoda Cambiador Daisy',
        cantidad: 1, precio_unitario: 380000,
        opciones_seleccionadas: [
          { opcion_id: 'op12', opcion_nombre: 'Acabado', opcion_tipo: 'select', valor_id: 'ov24', valor_nombre: 'Blanco', incremento_precio: 0 },
        ],
        subtotal: 380000,
        configuracion: { acabado: 'Blanco' },
        precio_total_item: 380000,
        descuento_aplicado: 0,
      },
    ],
    subtotal: 820000,
    descuento_total: 200000,
    total: 620000,
    estado: 'borrador',
    vendedor_id: 'u3',
    creado_en: '2025-03-15T09:00:00Z',
    actualizado_en: '2025-03-15T09:00:00Z',
  },
  {
    id: 'cot3',
    cliente_nombre: 'Ana Rodríguez',
    cliente_telefono: '573005551234',
    cliente_email: 'ana@email.com',
    items: [
      {
        id: 'ci4', cotizacion_id: 'cot3', producto_id: 'p4', producto_nombre: 'Cama Infantil Safari',
        cantidad: 1, precio_unitario: 380000,
        opciones_seleccionadas: [
          { opcion_id: 'op10', opcion_nombre: 'Medida', opcion_tipo: 'select', valor_id: 'ov20', valor_nombre: '80x160', incremento_precio: 0 },
          { opcion_id: 'op11', opcion_nombre: 'Colchón', opcion_tipo: 'checkbox', valor_id: 'ov23', valor_nombre: 'Incluir colchón', incremento_precio: 150000 },
        ],
        subtotal: 530000,
        configuracion: { medida: '80x160', colchon: 'Incluir colchón' },
        precio_total_item: 530000,
        descuento_aplicado: 0,
      },
    ],
    subtotal: 530000,
    descuento_total: 0,
    total: 530000,
    estado: 'enviada',
    vendedor_id: 'u2',
    creado_en: '2025-03-18T11:00:00Z',
    actualizado_en: '2025-03-18T11:00:00Z',
  },
];

interface CotizacionState {
  cotizaciones: Cotizacion[];
  addCotizacion: (c: Cotizacion) => void;
  updateCotizacion: (c: Cotizacion) => void;
  deleteCotizacion: (id: string) => void;
  updateEstado: (id: string, estado: EstadoCotizacion) => void;
  getCotizacion: (id: string) => Cotizacion | undefined;
  calcularTotal: (items: CotizacionItem[]) => { subtotal: number; descuento: number; total: number };
}

export const useCotizacionesStore = create<CotizacionState>((set, get) => {
  const storedCot = typeof window !== 'undefined' ? loadCotFromStorage() : null;

  return {
  cotizaciones: storedCot || DEMO_COTIZACIONES,

  addCotizacion: (c) => set((s) => {
    const cotizaciones = [c, ...s.cotizaciones];
    saveCotToStorage(cotizaciones);
    return { cotizaciones };
  }),
  updateCotizacion: (c) => set((s) => {
    const cotizaciones = s.cotizaciones.map(cot => cot.id === c.id ? c : cot);
    saveCotToStorage(cotizaciones);
    return { cotizaciones };
  }),
  deleteCotizacion: (id) => set((s) => {
    const cotizaciones = s.cotizaciones.filter(c => c.id !== id);
    saveCotToStorage(cotizaciones);
    return { cotizaciones };
  }),
  updateEstado: (id, estado) => set((s) => {
    const cotizaciones = s.cotizaciones.map(c =>
      c.id === id ? { ...c, estado, actualizado_en: new Date().toISOString() } : c
    );
    saveCotToStorage(cotizaciones);
    return { cotizaciones };
  }),
  getCotizacion: (id) => get().cotizaciones.find(c => c.id === id),

  calcularTotal: (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.precio_total_item || item.subtotal) * item.cantidad, 0);
    const descuento = items.reduce((sum, item) => sum + (item.descuento_aplicado || 0) * item.cantidad, 0);
    return { subtotal, descuento, total: subtotal - descuento };
  },
  };
});
