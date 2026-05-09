// ==========================================
// STORE DE ENTREGAS - VIVANTICOS
// Con integración Supabase + datos demo fallback
// ==========================================

import { create } from 'zustand';
import type { Entrega, EstadoEntrega } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// --- Helper: Check if ID is a valid UUID ---
function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// --- Persistencia localStorage ---
const ENT_STORAGE_KEY = 'vivanticos-entregas';

function loadEntFromStorage(): Entrega[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(ENT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.entregas || null;
    }
  } catch (e) {
    console.error('Error loading entregas from localStorage:', e);
  }
  return null;
}

function saveEntToStorage(entregas: Entrega[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ENT_STORAGE_KEY, JSON.stringify({ entregas, savedAt: new Date().toISOString() }));
  } catch (e) {
    console.error('Error saving entregas to localStorage:', e);
  }
}

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
  isLoaded: boolean;
  isLoading: boolean;
  addEntrega: (e: Entrega) => void;
  updateEntrega: (e: Entrega) => void;
  deleteEntrega: (id: string) => void;
  updateEstado: (id: string, estado: EstadoEntrega) => void;
  getEntrega: (id: string) => Entrega | undefined;
  getEntregasByFecha: (fecha: string) => Entrega[];
  getEntregasByMes: (year: number, month: number) => Entrega[];
  getProximasEntregas: (dias: number) => Entrega[];
  loadFromSupabase: () => Promise<void>;
  saveEntregaToSupabase: (e: Entrega) => Promise<boolean>;
  deleteEntregaFromSupabase: (id: string) => Promise<boolean>;
  updateEstadoSupabase: (id: string, estado: EstadoEntrega) => Promise<boolean>;
}

export const useEntregasStore = create<EntregaState>((set, get) => {
  const storedEnt = typeof window !== 'undefined' ? loadEntFromStorage() : null;

  return {
  entregas: storedEnt || DEMO_ENTREGAS,
  isLoaded: false,
  isLoading: false,

  addEntrega: (e) => set((s) => {
    const entregas = [e, ...s.entregas];
    saveEntToStorage(entregas);
    return { entregas };
  }),
  updateEntrega: (e) => set((s) => {
    const entregas = s.entregas.map(ent => ent.id === e.id ? e : ent);
    saveEntToStorage(entregas);
    return { entregas };
  }),
  deleteEntrega: (id) => set((s) => {
    const entregas = s.entregas.filter(e => e.id !== id);
    saveEntToStorage(entregas);
    return { entregas };
  }),
  updateEstado: (id, estado) => set((s) => {
    const entregas = s.entregas.map(e =>
      e.id === id ? { ...e, estado, actualizado_en: new Date().toISOString() } : e
    );
    saveEntToStorage(entregas);
    return { entregas };
  }),
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

  // --- Cargar datos desde Supabase ---
  loadFromSupabase: async () => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('Supabase no configurado, usando datos locales para entregas');
      set({ isLoaded: true });
      return;
    }

    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      const { data, error } = await supabase
        .from('entregas')
        .select('*')
        .order('fecha_entrega', { ascending: true });

      if (error) throw error;

      const entregasFromSupabase: Entrega[] = (data || []).map((e: any) => ({
        id: e.id,
        cotizacion_id: e.cotizacion_id || undefined,
        cliente_nombre: e.cliente_nombre || '',
        cliente_telefono: e.cliente_telefono || '',
        cliente_direccion: e.cliente_direccion || '',
        cliente_cedula: e.cliente_cedula || undefined,
        fecha_entrega: e.fecha_entrega || new Date().toISOString().split('T')[0],
        hora_entrega: e.hora_entrega || undefined,
        estado: e.estado || 'pendiente',
        notas: e.notas || undefined,
        items: e.items || [],
        vendedor_id: e.vendedor_id || '',
        creado_en: e.creado_en || new Date().toISOString(),
        actualizado_en: e.actualizado_en || new Date().toISOString(),
      }));

      // If Supabase has data, use it; otherwise keep local/demo data
      const finalEntregas = entregasFromSupabase.length > 0
        ? entregasFromSupabase
        : get().entregas;

      set({
        entregas: finalEntregas,
        isLoaded: true,
        isLoading: false,
      });

      saveEntToStorage(finalEntregas);
      console.log(`Entregas cargadas: ${finalEntregas.length} (Supabase: ${entregasFromSupabase.length})`);
    } catch (error) {
      console.error('Error cargando entregas desde Supabase:', error);
      set({ isLoaded: true, isLoading: false });
    }
  },

  // --- Guardar entrega en Supabase ---
  saveEntregaToSupabase: async (e: Entrega) => {
    if (!isSupabaseConfigured() || !supabase) {
      const exists = get().entregas.find(ent => ent.id === e.id);
      if (exists) {
        get().updateEntrega(e);
      } else {
        get().addEntrega(e);
      }
      return true;
    }

    try {
      // Resolve vendedor_id
      let resolvedVendedorId = e.vendedor_id;
      if (!isUUID(resolvedVendedorId)) {
        const { useUsuariosStore } = await import('@/stores/usuarios-store');
        const usuarios = useUsuariosStore.getState().usuarios;
        const matchingUser = usuarios.find(u => u.id === resolvedVendedorId || u.nombre === e.vendedor_id);
        if (matchingUser && isUUID(matchingUser.id)) {
          resolvedVendedorId = matchingUser.id;
        } else {
          const activeVendedor = usuarios.find(u => u.rol === 'vendedor' && u.activo && isUUID(u.id));
          if (activeVendedor) resolvedVendedorId = activeVendedor.id;
        }
      }

      const entregaData = {
        cotizacion_id: (e.cotizacion_id && isUUID(e.cotizacion_id)) ? e.cotizacion_id : null,
        cliente_nombre: e.cliente_nombre,
        cliente_telefono: e.cliente_telefono,
        cliente_direccion: e.cliente_direccion || '',
        cliente_cedula: e.cliente_cedula || null,
        fecha_entrega: e.fecha_entrega,
        hora_entrega: e.hora_entrega || null,
        estado: e.estado,
        notas: e.notas || null,
        vendedor_id: isUUID(resolvedVendedorId) ? resolvedVendedorId : null,
        items: e.items || [],
      };

      if (isUUID(e.id)) {
        // Check if exists in Supabase
        const { data: checkData } = await supabase
          .from('entregas')
          .select('id')
          .eq('id', e.id)
          .maybeSingle();

        if (checkData) {
          // UPDATE
          const { error } = await supabase
            .from('entregas')
            .update(entregaData)
            .eq('id', e.id);
          if (error) throw error;
          get().updateEntrega(e);
        } else {
          // UUID locally but not in Supabase — insert without ID
          const { data, error } = await supabase
            .from('entregas')
            .insert(entregaData)
            .select()
            .single();
          if (error) throw error;
          const oldId = e.id;
          const newId = data.id;
          set((s) => ({
            entregas: s.entregas.map(ent => ent.id === oldId ? { ...e, id: newId } : ent),
          }));
          saveEntToStorage(get().entregas);
        }
      } else {
        // Non-UUID ID — new entrega, insert without ID
        const { data, error } = await supabase
          .from('entregas')
          .insert(entregaData)
          .select()
          .single();
        if (error) throw error;

        const oldId = e.id;
        const newId = data.id;
        set((s) => {
          const exists = s.entregas.find(ent => ent.id === oldId);
          if (exists) {
            return { entregas: s.entregas.map(ent => ent.id === oldId ? { ...e, id: newId } : ent) };
          } else {
            return { entregas: [...s.entregas, { ...e, id: newId }] };
          }
        });
        saveEntToStorage(get().entregas);
      }

      return true;
    } catch (error) {
      console.error('Error guardando entrega en Supabase:', error);
      const exists = get().entregas.find(ent => ent.id === e.id);
      if (!exists) {
        get().addEntrega(e);
      } else {
        get().updateEntrega(e);
      }
      return false;
    }
  },

  // --- Eliminar entrega de Supabase ---
  deleteEntregaFromSupabase: async (id: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      get().deleteEntrega(id);
      return true;
    }

    try {
      if (isUUID(id)) {
        const { error } = await supabase
          .from('entregas')
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
      get().deleteEntrega(id);
      return true;
    } catch (error) {
      console.error('Error eliminando entrega de Supabase:', error);
      get().deleteEntrega(id);
      return false;
    }
  },

  // --- Actualizar estado en Supabase ---
  updateEstadoSupabase: async (id: string, estado: EstadoEntrega) => {
    get().updateEstado(id, estado);

    if (!isSupabaseConfigured() || !supabase) {
      return true;
    }

    try {
      if (isUUID(id)) {
        const { error } = await supabase
          .from('entregas')
          .update({ estado, actualizado_en: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error('Error actualizando estado de entrega en Supabase:', error);
      return false;
    }
  },
  };
});
