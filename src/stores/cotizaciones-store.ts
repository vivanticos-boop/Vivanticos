// ==========================================
// STORE DE COTIZACIONES - VIVANTICOS
// Con integración Supabase + cálculos automáticos
// ==========================================

import { create } from 'zustand';
import type { Cotizacion, CotizacionItem, ItemOpcionSeleccionada, EstadoCotizacion } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// --- Helper: Check if ID is a valid UUID ---
function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

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
  isLoaded: boolean;
  isLoading: boolean;
  addCotizacion: (c: Cotizacion) => void;
  updateCotizacion: (c: Cotizacion) => void;
  deleteCotizacion: (id: string) => void;
  updateEstado: (id: string, estado: EstadoCotizacion) => void;
  getCotizacion: (id: string) => Cotizacion | undefined;
  calcularTotal: (items: CotizacionItem[]) => { subtotal: number; descuento: number; total: number };
  loadFromSupabase: () => Promise<void>;
  saveCotizacionToSupabase: (c: Cotizacion) => Promise<boolean>;
  deleteCotizacionFromSupabase: (id: string) => Promise<boolean>;
  updateEstadoSupabase: (id: string, estado: EstadoCotizacion) => Promise<boolean>;
}

export const useCotizacionesStore = create<CotizacionState>((set, get) => {
  const storedCot = typeof window !== 'undefined' ? loadCotFromStorage() : null;

  return {
  cotizaciones: storedCot || DEMO_COTIZACIONES,
  isLoaded: false,
  isLoading: false,

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

  // --- Cargar datos desde Supabase ---
  loadFromSupabase: async () => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('Supabase no configurado, usando datos locales para cotizaciones');
      set({ isLoaded: true });
      return;
    }

    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      // Load cotizaciones and items in parallel
      const [cotRes, itemsRes] = await Promise.all([
        supabase.from('cotizaciones').select('*').order('creado_en', { ascending: false }),
        supabase.from('cotizacion_items').select('*'),
      ]);

      if (cotRes.error) throw cotRes.error;
      if (itemsRes.error) throw itemsRes.error;

      // Build items map by cotizacion_id
      const itemsByCotId: Record<string, any[]> = {};
      for (const item of itemsRes.data || []) {
        const cId = item.cotizacion_id;
        if (!itemsByCotId[cId]) itemsByCotId[cId] = [];
        itemsByCotId[cId].push(item);
      }

      // Map cotizaciones with their items
      const cotizacionesFromSupabase: Cotizacion[] = (cotRes.data || []).map((c: any) => {
        const cotItems: CotizacionItem[] = (itemsByCotId[c.id] || []).map((item: any) => ({
          id: item.id,
          cotizacion_id: item.cotizacion_id,
          producto_id: item.producto_id || '',
          producto_nombre: item.producto_nombre || '',
          cantidad: item.cantidad || 1,
          precio_unitario: item.precio_unitario || 0,
          opciones_seleccionadas: item.opciones_seleccionadas || [],
          subtotal: item.subtotal || 0,
          configuracion: item.configuracion || {},
          precio_total_item: item.precio_total_item || item.subtotal || 0,
          descuento_aplicado: item.descuento_aplicado || 0,
        }));

        return {
          id: c.id,
          cliente_nombre: c.cliente_nombre || '',
          cliente_telefono: c.cliente_telefono || '',
          cliente_email: c.cliente_email || undefined,
          cliente_direccion: c.cliente_direccion || undefined,
          cliente_id: c.cliente_id || undefined,
          items: cotItems,
          subtotal: c.subtotal || 0,
          descuento_total: c.descuento_total || 0,
          total: c.total || 0,
          estado: c.estado || 'borrador',
          vendedor_id: c.vendedor_id || '',
          notas: c.notas || undefined,
          creado_en: c.creado_en || new Date().toISOString(),
          actualizado_en: c.actualizado_en || new Date().toISOString(),
        };
      });

      // If Supabase has data, use it; otherwise keep local/demo data
      const finalCotizaciones = cotizacionesFromSupabase.length > 0
        ? cotizacionesFromSupabase
        : get().cotizaciones;

      set({
        cotizaciones: finalCotizaciones,
        isLoaded: true,
        isLoading: false,
      });

      saveCotToStorage(finalCotizaciones);
      console.log(`Cotizaciones cargadas: ${finalCotizaciones.length} (Supabase: ${cotizacionesFromSupabase.length})`);
    } catch (error) {
      console.error('Error cargando cotizaciones desde Supabase:', error);
      set({ isLoaded: true, isLoading: false });
    }
  },

  // --- Guardar cotización en Supabase ---
  saveCotizacionToSupabase: async (c: Cotizacion) => {
    if (!isSupabaseConfigured() || !supabase) {
      const exists = get().cotizaciones.find(cot => cot.id === c.id);
      if (exists) {
        get().updateCotizacion(c);
      } else {
        get().addCotizacion(c);
      }
      return true;
    }

    try {
      // Resolve vendedor_id: if not a UUID, try to find the matching usuario UUID
      let resolvedVendedorId = c.vendedor_id;
      if (!isUUID(resolvedVendedorId)) {
        // Import usuarios store dynamically to avoid circular deps
        const { useUsuariosStore } = await import('@/stores/usuarios-store');
        const usuarios = useUsuariosStore.getState().usuarios;
        const matchingUser = usuarios.find(u => u.id === resolvedVendedorId || u.nombre === c.vendedor_id);
        if (matchingUser && isUUID(matchingUser.id)) {
          resolvedVendedorId = matchingUser.id;
        } else {
          // Try by email or role as fallback
          const activeVendedor = usuarios.find(u => u.rol === 'vendedor' && u.activo && isUUID(u.id));
          if (activeVendedor) resolvedVendedorId = activeVendedor.id;
        }
      }

      // Auto-save client data to clientes table (upsert by nombre+telefono)
      let resolvedClienteId = c.cliente_id;
      try {
        const { useClientesStore } = await import('@/stores/clientes-store');
        const cliente = await useClientesStore.getState().findOrCreateCliente(
          c.cliente_nombre,
          c.cliente_telefono,
          c.cliente_email,
          c.cliente_direccion,
        );
        if (cliente) resolvedClienteId = cliente.id;
      } catch (e) {
        console.warn('Could not auto-save cliente:', e);
      }

      const cotizacionData = {
        cliente_nombre: c.cliente_nombre,
        cliente_telefono: c.cliente_telefono,
        cliente_email: c.cliente_email || null,
        cliente_direccion: c.cliente_direccion || null,
        cliente_id: resolvedClienteId || null,
        subtotal: c.subtotal,
        descuento_total: c.descuento_total,
        total: c.total,
        estado: c.estado,
        vendedor_id: isUUID(resolvedVendedorId) ? resolvedVendedorId : null,
        notas: c.notas || null,
      };

      let cotizacionId = c.id;

      if (isUUID(c.id)) {
        // Check if exists in Supabase
        const { data: checkData } = await supabase
          .from('cotizaciones')
          .select('id')
          .eq('id', c.id)
          .maybeSingle();

        if (checkData) {
          // UPDATE existing cotizacion
          const { error } = await supabase
            .from('cotizaciones')
            .update(cotizacionData)
            .eq('id', c.id);
          if (error) throw error;
          get().updateCotizacion({ ...c, cliente_id: resolvedClienteId });
        } else {
          // UUID locally but not in Supabase — insert without ID
          const { data, error } = await supabase
            .from('cotizaciones')
            .insert(cotizacionData)
            .select()
            .single();
          if (error) throw error;
          const oldId = c.id;
          const newId = data.id;
          cotizacionId = newId;
          set((s) => ({
            cotizaciones: s.cotizaciones.map(cot => cot.id === oldId ? { ...c, id: newId, cliente_id: resolvedClienteId } : cot),
          }));
          saveCotToStorage(get().cotizaciones);
        }
      } else {
        // Non-UUID ID — new cotizacion, insert without ID
        const { data, error } = await supabase
          .from('cotizaciones')
          .insert(cotizacionData)
          .select()
          .single();
        if (error) throw error;

        const oldId = c.id;
        const newId = data.id;
        cotizacionId = newId;
        set((s) => {
          const exists = s.cotizaciones.find(cot => cot.id === oldId);
          if (exists) {
            return { cotizaciones: s.cotizaciones.map(cot => cot.id === oldId ? { ...c, id: newId, cliente_id: resolvedClienteId } : cot) };
          } else {
            return { cotizaciones: [...s.cotizaciones, { ...c, id: newId, cliente_id: resolvedClienteId }] };
          }
        });
        saveCotToStorage(get().cotizaciones);
      }

      // Save items: delete old items first, then insert new ones
      if (isUUID(cotizacionId)) {
        // Delete old items
        await supabase.from('cotizacion_items').delete().eq('cotizacion_id', cotizacionId);

        // Insert new items
        for (const item of c.items) {
          const itemData = {
            cotizacion_id: cotizacionId,
            producto_id: isUUID(item.producto_id) ? item.producto_id : null,
            producto_nombre: item.producto_nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            opciones_seleccionadas: item.opciones_seleccionadas || [],
            subtotal: item.subtotal,
            configuracion: item.configuracion || {},
            precio_total_item: item.precio_total_item,
            descuento_aplicado: item.descuento_aplicado || 0,
          };

          const { data: newItem, error: itemErr } = await supabase
            .from('cotizacion_items')
            .insert(itemData)
            .select()
            .single();

          if (itemErr) {
            console.error('Error saving cotizacion_item:', itemErr);
          } else if (newItem) {
            // Update local state with new item IDs
            set((s) => ({
              cotizaciones: s.cotizaciones.map(cot => {
                if (cot.id === cotizacionId) {
                  return {
                    ...cot,
                    items: cot.items.map(ci =>
                      ci.id === item.id ? { ...ci, id: newItem.id, cotizacion_id: cotizacionId } : ci
                    ),
                  };
                }
                return cot;
              }),
            }));
          }
        }
        saveCotToStorage(get().cotizaciones);
      }

      return true;
    } catch (error) {
      console.error('Error guardando cotización en Supabase:', error);
      const exists = get().cotizaciones.find(cot => cot.id === c.id);
      if (!exists) {
        get().addCotizacion(c);
      } else {
        get().updateCotizacion(c);
      }
      return false;
    }
  },

  // --- Eliminar cotización de Supabase ---
  deleteCotizacionFromSupabase: async (id: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      get().deleteCotizacion(id);
      return true;
    }

    try {
      if (isUUID(id)) {
        // Delete items first
        await supabase.from('cotizacion_items').delete().eq('cotizacion_id', id);
        const { error } = await supabase
          .from('cotizaciones')
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
      get().deleteCotizacion(id);
      return true;
    } catch (error) {
      console.error('Error eliminando cotización de Supabase:', error);
      get().deleteCotizacion(id);
      return false;
    }
  },

  // --- Actualizar estado en Supabase ---
  updateEstadoSupabase: async (id: string, estado: EstadoCotizacion) => {
    get().updateEstado(id, estado);

    if (!isSupabaseConfigured() || !supabase) {
      return true;
    }

    try {
      if (isUUID(id)) {
        const { error } = await supabase
          .from('cotizaciones')
          .update({ estado, actualizado_en: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error('Error actualizando estado en Supabase:', error);
      return false;
    }
  },
  };
});
