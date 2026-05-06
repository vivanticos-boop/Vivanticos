// ==========================================
// STORE DE ENTREGAS - VIVANTICOS
// ==========================================

import { create } from 'zustand';
import type { Entrega, EstadoEntrega } from '@/types';

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);
const twoWeeks = new Date(today);
twoWeeks.setDate(twoWeeks.getDate() + 14);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const lastWeek = new Date(today);
lastWeek.setDate(lastWeek.getDate() - 7);

const DEMO_ENTREGAS: Entrega[] = [
  {
    id: 'e1',
    cotizacion_id: 'cot1',
    cliente_nombre: 'María García',
    cliente_telefono: '573001234567',
    cliente_direccion: 'Cra 15 #82-34, Apt 502, Bogotá',
    fecha_entrega: today.toISOString().split('T')[0],
    estado: 'pendiente',
    notas: 'Llamar 30 min antes de llegar. Edificio con portería.',
    items: [
      { id: 'ei1', producto_nombre: 'Cuna Luna 120x60 + Colchón + Lencería Básica', cantidad: 1 },
    ],
    vendedor_id: 'u3',
    creado_en: today.toISOString(),
    actualizado_en: today.toISOString(),
  },
  {
    id: 'e2',
    cotizacion_id: 'cot2',
    cliente_nombre: 'Juan Pérez',
    cliente_telefono: '573009876543',
    cliente_direccion: 'Cl 72 #45-18, Casa 3, Bogotá',
    fecha_entrega: tomorrow.toISOString().split('T')[0],
    estado: 'pendiente',
    notas: 'Casa con fachada verde.',
    items: [
      { id: 'ei2', producto_nombre: 'Cuna Estrella 120x60', cantidad: 1 },
      { id: 'ei3', producto_nombre: 'Cómoda Cambiador Daisy - Blanco', cantidad: 1 },
    ],
    vendedor_id: 'u3',
    creado_en: today.toISOString(),
    actualizado_en: today.toISOString(),
  },
  {
    id: 'e3',
    cliente_nombre: 'Carolina López',
    cliente_telefono: '573007778888',
    cliente_direccion: 'Av. Suba #120-50, Apt 101, Bogotá',
    fecha_entrega: nextWeek.toISOString().split('T')[0],
    estado: 'pendiente',
    items: [
      { id: 'ei4', producto_nombre: 'Ropero 2 Puertas Rainbow - 1.20m', cantidad: 1 },
    ],
    vendedor_id: 'u2',
    creado_en: today.toISOString(),
    actualizado_en: today.toISOString(),
  },
  {
    id: 'e4',
    cliente_nombre: 'Pedro Martínez',
    cliente_telefono: '573006667777',
    cliente_direccion: 'Diag 50 #30-15, Bogotá',
    fecha_entrega: yesterday.toISOString().split('T')[0],
    estado: 'entregado',
    notas: 'Entregado sin novedad.',
    items: [
      { id: 'ei5', producto_nombre: 'Cama Infantil Safari 80x160 + Colchón', cantidad: 1 },
    ],
    vendedor_id: 'u3',
    creado_en: lastWeek.toISOString(),
    actualizado_en: yesterday.toISOString(),
  },
  {
    id: 'e5',
    cliente_nombre: 'Laura Sánchez',
    cliente_telefono: '573004445555',
    cliente_direccion: 'Cra 7 #65-20, Apt 803, Bogotá',
    fecha_entrega: lastWeek.toISOString().split('T')[0],
    estado: 'completado',
    notas: 'Cliente confirmó recepción satisfactoria.',
    items: [
      { id: 'ei6', producto_nombre: 'Cuna Nube 120x60', cantidad: 1 },
      { id: 'ei7', producto_nombre: 'Escritorio Explorer', cantidad: 1 },
    ],
    vendedor_id: 'u2',
    creado_en: new Date(lastWeek.getTime() - 86400000 * 3).toISOString(),
    actualizado_en: lastWeek.toISOString(),
  },
  {
    id: 'e6',
    cliente_nombre: 'Roberto Díaz',
    cliente_telefono: '573003334444',
    cliente_direccion: 'Cl 100 #15-40, Bogotá',
    fecha_entrega: twoWeeks.toISOString().split('T')[0],
    estado: 'pendiente',
    items: [
      { id: 'ei8', producto_nombre: 'Cuna Estrella 130x70 + Colchón + Lencería Premium', cantidad: 1 },
    ],
    vendedor_id: 'u3',
    creado_en: today.toISOString(),
    actualizado_en: today.toISOString(),
  },
];

interface EntregaState {
  entregas: Entrega[];
  addEntrega: (e: Entrega) => void;
  updateEntrega: (e: Entrega) => void;
  deleteEntrega: (id: string) => void;
  updateEstado: (id: string, estado: EstadoEntrega) => void;
  getEntrega: (id: string) => Entrega | undefined;
  getEntregasByFecha: (fecha: string) => Entrega[];
  getEntregasByMes: (year: number, month: number) => Entrega[];
  getProximasEntregas: (dias: number) => Entrega[];
}

export const useEntregasStore = create<EntregaState>((set, get) => ({
  entregas: DEMO_ENTREGAS,

  addEntrega: (e) => set((s) => ({ entregas: [e, ...s.entregas] })),
  updateEntrega: (e) => set((s) => ({
    entregas: s.entregas.map(ent => ent.id === e.id ? e : ent),
  })),
  deleteEntrega: (id) => set((s) => ({
    entregas: s.entregas.filter(e => e.id !== id),
  })),
  updateEstado: (id, estado) => set((s) => ({
    entregas: s.entregas.map(e =>
      e.id === id ? { ...e, estado, actualizado_en: new Date().toISOString() } : e
    ),
  })),
  getEntrega: (id) => get().entregas.find(e => e.id === id),

  getEntregasByFecha: (fecha) => get().entregas.filter(e =>
    e.fecha_entrega === fecha
  ),

  getEntregasByMes: (year, month) => get().entregas.filter(e => {
    const d = new Date(e.fecha_entrega);
    return d.getFullYear() === year && d.getMonth() === month;
  }),

  getProximasEntregas: (dias) => {
    const hoy = new Date();
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + dias);
    return get().entregas.filter(e => {
      const fecha = new Date(e.fecha_entrega);
      return fecha >= hoy && fecha <= limite && e.estado === 'pendiente';
    });
  },
}));
