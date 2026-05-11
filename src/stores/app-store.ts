// ==========================================
// STORE PRINCIPAL DE NAVEGACIÓN - VIVANTICOS
// Con sistema de notificaciones dinámico
// Conectado a Supabase para persistencia
// ==========================================

import { create } from 'zustand';
import type { AppView, UserRole, Notificacion, TipoNotificacion } from '@/types';
import { useUsuariosStore } from '@/stores/usuarios-store';
import { supabase } from '@/lib/supabase';

// --- Persistencia de notificaciones en localStorage (fallback offline) ---
const NOTIF_STORAGE_KEY = 'vivanticos-notificaciones';

function loadNotifFromStorage(): Notificacion[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return (parsed.notificaciones || []).filter(
        (n: Notificacion) => new Date(n.creado_en) > sevenDaysAgo
      );
    }
  } catch (e) {
    console.error('Error loading notificaciones from localStorage:', e);
  }
  return null;
}

function saveNotifToStorage(notificaciones: Notificacion[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify({
      notificaciones,
      savedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.error('Error saving notificaciones to localStorage:', e);
  }
}

interface AppState {
  // Navegación
  currentView: AppView;
  previousView: AppView | null;
  navigateTo: (view: AppView) => void;
  goBack: () => void;

  // Parámetros de vista
  selectedProductoId: string | null;
  selectedCotizacionId: string | null;
  selectedEntregaId: string | null;
  selectedUsuarioId: string | null;
  setSelectedProductoId: (id: string | null) => void;
  setSelectedCotizacionId: (id: string | null) => void;
  setSelectedEntregaId: (id: string | null) => void;
  setSelectedUsuarioId: (id: string | null) => void;

  // Sesión
  isLoggedIn: boolean;
  currentUser: {
    id: string;
    nombre: string;
    email: string;
    rol: UserRole;
    avatar_url?: string;
  } | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;

  // Notificaciones
  notificaciones: Notificacion[];
  addNotificacion: (n: Omit<Notificacion, 'id' | 'creado_en' | 'leida'>) => void;
  markNotificacionLeida: (id: string) => void;
  markAllNotificacionesLeidas: () => void;
  clearNotificaciones: () => void;
  unreadCount: () => number;
  generateNotificaciones: (entregas: any[], cotizaciones: any[]) => void;
  loadNotificacionesFromSupabase: (usuarioId: string) => Promise<void>;
  syncNotificacionToSupabase: (n: Notificacion) => Promise<void>;

  // Sincronización
  lastSync: string | null;
  setLastSync: (date: string) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navegación
  currentView: 'dashboard',
  previousView: null,
  navigateTo: (view) => set((state) => ({
    previousView: state.currentView,
    currentView: view,
  })),
  goBack: () => set((state) => ({
    currentView: state.previousView || 'dashboard',
    previousView: null,
  })),

  // Parámetros
  selectedProductoId: null,
  selectedCotizacionId: null,
  selectedEntregaId: null,
  selectedUsuarioId: null,
  setSelectedProductoId: (id) => set({ selectedProductoId: id }),
  setSelectedCotizacionId: (id) => set({ selectedCotizacionId: id }),
  setSelectedEntregaId: (id) => set({ selectedEntregaId: id }),
  setSelectedUsuarioId: (id) => set({ selectedUsuarioId: id }),

  // Sesión
  isLoggedIn: false,
  currentUser: null,
  login: (email, password) => {
    const user = useUsuariosStore.getState().authenticate(email, password);
    if (user) {
      set({
        isLoggedIn: true,
        currentUser: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          avatar_url: user.avatar_url,
        },
      });
      // Cargar notificaciones de Supabase al iniciar sesión
      get().loadNotificacionesFromSupabase(user.id);
      return true;
    }
    return false;
  },
  logout: () => set({
    isLoggedIn: false,
    currentUser: null,
    currentView: 'dashboard',
    previousView: null,
    notificaciones: [],
  }),

  // Notificaciones — arrancar vacío; se generan dinámicamente
  notificaciones: loadNotifFromStorage() || [],
  addNotificacion: (n) => {
    // Evitar duplicados: si ya existe una notificación del mismo tipo con el mismo relacionado_id, no agregar
    const existing = get().notificaciones.find(
      ex => ex.tipo === n.tipo && ex.relacionado_id === n.relacionado_id && !ex.leida
    );
    if (existing) return;

    const newNotif: Notificacion = {
      ...n,
      id: `n${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      creado_en: new Date().toISOString(),
      leida: false,
    };

    set((state) => {
      const notificaciones = [newNotif, ...state.notificaciones].slice(0, 50);
      saveNotifToStorage(notificaciones);
      return { notificaciones };
    });

    // Sincronizar con Supabase en segundo plano
    if (get().currentUser?.id) {
      get().syncNotificacionToSupabase(newNotif);
    }
  },
  markNotificacionLeida: (id) => {
    set((state) => {
      const notificaciones = state.notificaciones.map(n =>
        n.id === id ? { ...n, leida: true } : n
      );
      saveNotifToStorage(notificaciones);

      // Actualizar en Supabase
      if (state.currentUser?.id && supabase) {
        const notif = notificaciones.find(n => n.id === id);
        // Si la notificación tiene un UUID de Supabase, actualizarla
        if (notif && notif.id.includes('-')) {
          supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('id', notif.id)
            .then(() => {});
        }
      }

      return { notificaciones };
    });
  },
  markAllNotificacionesLeidas: () => {
    set((state) => {
      const notificaciones = state.notificaciones.map(n => ({ ...n, leida: true }));
      saveNotifToStorage(notificaciones);

      // Actualizar todas en Supabase
      if (state.currentUser?.id && supabase) {
        supabase
          .from('notificaciones')
          .update({ leida: true })
          .eq('usuario_id', state.currentUser.id)
          .eq('leida', false)
          .then(() => {});
      }

      return { notificaciones };
    });
  },
  clearNotificaciones: () => {
    saveNotifToStorage([]);
    set({ notificaciones: [] });
  },
  unreadCount: () => get().notificaciones.filter(n => !n.leida).length,

  // Cargar notificaciones desde Supabase
  loadNotificacionesFromSupabase: async (usuarioId: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('creado_en', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading notificaciones from Supabase:', error);
        return;
      }

      if (data && data.length > 0) {
        const notificaciones: Notificacion[] = data.map(n => ({
          id: n.id,
          tipo: n.tipo as TipoNotificacion,
          titulo: n.titulo,
          mensaje: n.mensaje,
          leida: n.leida,
          creado_en: n.creado_en,
          relacionado_id: n.relacionado_id || undefined,
          relacionado_tipo: n.relacionado_id ? (n.tipo.startsWith('entrega') ? 'entrega' as const : 'cotizacion' as const) : undefined,
        }));

        // Mezclar con las de localStorage (dar prioridad a las de Supabase)
        const localNotifs = loadNotifFromStorage() || [];
        const supabaseIds = new Set(notificaciones.map(n => n.relacionado_id).filter(Boolean));

        // Agregar notificaciones locales que no estén en Supabase
        const localOnly = localNotifs.filter(
          n => n.relacionado_id && !supabaseIds.has(n.relacionado_id) && !notificaciones.some(sn => sn.tipo === n.tipo && sn.relacionado_id === n.relacionado_id && !sn.leida)
        );

        const merged = [...notificaciones, ...localOnly]
          .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime())
          .slice(0, 50);

        saveNotifToStorage(merged);
        set({ notificaciones: merged });
      }
    } catch (e) {
      console.error('Error in loadNotificacionesFromSupabase:', e);
    }
  },

  // Sincronizar una notificación a Supabase
  syncNotificacionToSupabase: async (n: Notificacion) => {
    if (!supabase || !get().currentUser?.id) return;

    try {
      // Verificar si ya existe en Supabase (por tipo + relacionado_id + no leída)
      const { data: existing } = await supabase
        .from('notificaciones')
        .select('id')
        .eq('usuario_id', get().currentUser!.id)
        .eq('tipo', n.tipo)
        .eq('relacionado_id', n.relacionado_id || '')
        .eq('leida', false)
        .maybeSingle();

      if (existing) return; // Ya existe en Supabase

      await supabase.from('notificaciones').insert({
        usuario_id: get().currentUser!.id,
        tipo: n.tipo,
        titulo: n.titulo,
        mensaje: n.mensaje,
        leida: false,
        relacionado_id: n.relacionado_id || null,
      });
    } catch (e) {
      console.error('Error syncing notification to Supabase:', e);
    }
  },

  // Generar notificaciones dinámicas basadas en entregas y cotizaciones
  generateNotificaciones: (entregas, cotizaciones) => {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const mananaStr = manana.toISOString().split('T')[0];

    const nuevasNotificaciones: Omit<Notificacion, 'id' | 'creado_en' | 'leida'>[] = [];

    // 1. Entregas para HOY (pendientes)
    const entregasHoy = entregas.filter(
      (e: any) => e.fecha_entrega === hoyStr && e.estado === 'pendiente'
    );
    for (const e of entregasHoy) {
      nuevasNotificaciones.push({
        tipo: 'entrega_hoy',
        titulo: 'Entrega hoy',
        mensaje: `${e.cliente_nombre} — ${e.items?.map((i: any) => i.producto_nombre).join(', ') || 'Sin items'}${e.hora_entrega ? ` a las ${e.hora_entrega}` : ''}`,
        relacionado_id: e.id,
        relacionado_tipo: 'entrega',
      });
    }

    // 2. Entregas para MAÑANA (pendientes)
    const entregasManana = entregas.filter(
      (e: any) => e.fecha_entrega === mananaStr && e.estado === 'pendiente'
    );
    for (const e of entregasManana) {
      nuevasNotificaciones.push({
        tipo: 'entrega_manana',
        titulo: 'Entrega mañana',
        mensaje: `${e.cliente_nombre} — ${e.items?.map((i: any) => i.producto_nombre).join(', ') || 'Sin items'}${e.hora_entrega ? ` a las ${e.hora_entrega}` : ''}`,
        relacionado_id: e.id,
        relacionado_tipo: 'entrega',
      });
    }

    // 3. Entregas VENCIDAS (fecha pasada, estado pendiente)
    const entregasVencidas = entregas.filter(
      (e: any) => e.fecha_entrega < hoyStr && e.estado === 'pendiente'
    );
    for (const e of entregasVencidas.slice(0, 5)) {
      nuevasNotificaciones.push({
        tipo: 'entrega_vencida',
        titulo: 'Entrega vencida',
        mensaje: `${e.cliente_nombre} — Programada para ${e.fecha_entrega}`,
        relacionado_id: e.id,
        relacionado_tipo: 'entrega',
      });
    }

    // 4. Cotizaciones aprobadas recientemente (últimos 3 días)
    const tresDiasAtras = new Date(hoy);
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3);
    const cotizacionesAprobadas = cotizaciones.filter(
      (c: any) => c.estado === 'aprobada' && new Date(c.actualizado_en) >= tresDiasAtras
    );
    for (const c of cotizacionesAprobadas) {
      nuevasNotificaciones.push({
        tipo: 'cotizacion_aprobada',
        titulo: 'Cotización aprobada',
        mensaje: `${c.cliente_nombre} — $${(c.total || 0).toLocaleString('es-CO')}`,
        relacionado_id: c.id,
        relacionado_tipo: 'cotizacion',
      });
    }

    // 5. Cotizaciones pendientes (borrador o enviada, más de 2 días sin respuesta)
    const dosDiasAtras = new Date(hoy);
    dosDiasAtras.setDate(dosDiasAtras.getDate() - 2);
    const cotizacionesPendientes = cotizaciones.filter(
      (c: any) => (c.estado === 'borrador' || c.estado === 'enviada') && new Date(c.creado_en) <= dosDiasAtras
    );
    for (const c of cotizacionesPendientes.slice(0, 3)) {
      nuevasNotificaciones.push({
        tipo: 'cotizacion_pendiente',
        titulo: 'Cotización sin respuesta',
        mensaje: `${c.cliente_nombre} — ${c.estado === 'borrador' ? 'Borrador' : 'Enviada'} hace más de 2 días`,
        relacionado_id: c.id,
        relacionado_tipo: 'cotizacion',
      });
    }

    // Agregar todas (addNotificacion previene duplicados y sincroniza con Supabase)
    for (const n of nuevasNotificaciones) {
      get().addNotificacion(n);
    }

    // Limpiar notificaciones viejas (>7 días) y leídas
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cleaned = get().notificaciones.filter(
      n => !n.leida || new Date(n.creado_en) > sevenDaysAgo
    );
    if (cleaned.length !== get().notificaciones.length) {
      saveNotifToStorage(cleaned);
      set({ notificaciones: cleaned });
    }
  },

  // Sincronización
  lastSync: null,
  setLastSync: (date) => set({ lastSync: date }),
  isLoading: false,
  setIsLoading: (v) => set({ isLoading: v }),

  // Sidebar
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}));
