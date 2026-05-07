// ==========================================
// STORE DE COTIZACIONES - VIVANTICOS
// ==========================================

import { create } from 'zustand';
import type { Cotizacion, CotizacionItem, ItemOpcionSeleccionada, EstadoCotizacion } from '@/types';

const DEMO_COTIZACIONES: Cotizacion[] = [
  {
    id: 'cot1',
    cliente_nombre: 'María García',
    cliente_telefono: '573001234567',
    cliente_email: 'maria@email.com',
    items: [
      {
        id: 'ci1', cotizacion_id: 'cot1', producto_id: 'p1', producto_nombre: 'Cuna Luna',
        cantidad: 1, precio_unitario: 450000,
        opciones_seleccionadas: [
          { opcion_id: 'op1', opcion_nombre: 'Medida', valor_id: 'ov1', valor_nombre: '120x60', precio_incremento: 0 },
          { opcion_id: 'op2', opcion_nombre: 'Colchón', valor_id: 'ov5', valor_nombre: 'Colchón 120x60', precio_incremento: 120000 },
          { opcion_id: 'op3', opcion_nombre: 'Lencería', valor_id: 'ov9', valor_nombre: 'Lencería Básica', precio_incremento: 85000 },
        ],
        subtotal: 575000,
      },
    ],
    subtotal: 575000,
    descuento_total: 80000,
    total: 495000,
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
        cantidad: 1, precio_unitario: 520000,
        opciones_seleccionadas: [
          { opcion_id: 'op4', opcion_nombre: 'Medida', valor_id: 'ov11', valor_nombre: '120x60', precio_incremento: 0 },
          { opcion_id: 'op5', opcion_nombre: 'Colchón', valor_id: 'ov14', valor_nombre: 'Sin colchón', precio_incremento: 0 },
        ],
        subtotal: 520000,
      },
      {
        id: 'ci3', cotizacion_id: 'cot2', producto_id: 'p6', producto_nombre: 'Cómoda Cambiador Daisy',
        cantidad: 1, precio_unitario: 380000,
        opciones_seleccionadas: [
          { opcion_id: 'op12', opcion_nombre: 'Acabado', valor_id: 'ov34', valor_nombre: 'Blanco', precio_incremento: 0 },
        ],
        subtotal: 380000,
      },
    ],
    subtotal: 900000,
    descuento_total: 200000,
    total: 700000,
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
          { opcion_id: 'op10', opcion_nombre: 'Medida', valor_id: 'ov27', valor_nombre: '80x160', precio_incremento: 0 },
          { opcion_id: 'op11', opcion_nombre: 'Colchón', valor_id: 'ov31', valor_nombre: 'Colchón 80x160', precio_incremento: 150000 },
        ],
        subtotal: 530000,
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

export const useCotizacionesStore = create<CotizacionState>((set, get) => ({
  cotizaciones: DEMO_COTIZACIONES,

  addCotizacion: (c) => set((s) => ({ cotizaciones: [c, ...s.cotizaciones] })),
  updateCotizacion: (c) => set((s) => ({
    cotizaciones: s.cotizaciones.map(cot => cot.id === c.id ? c : cot),
  })),
  deleteCotizacion: (id) => set((s) => ({
    cotizaciones: s.cotizaciones.filter(c => c.id !== id),
  })),
  updateEstado: (id, estado) => set((s) => ({
    cotizaciones: s.cotizaciones.map(c =>
      c.id === id ? { ...c, estado, actualizado_en: new Date().toISOString() } : c
    ),
  })),
  getCotizacion: (id) => get().cotizaciones.find(c => c.id === id),

  calcularTotal: (items) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal * item.cantidad, 0);
    // Los descuentos se calculan por item en la lógica de cada producto
    const descuento = items.reduce((sum, item) => {
      // Aquí se verificarían descuentos por tipo de producto
      return sum;
    }, 0);
    return { subtotal, descuento, total: subtotal - descuento };
  },
}));
