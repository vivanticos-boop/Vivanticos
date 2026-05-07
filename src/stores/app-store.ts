// ==========================================
// STORE PRINCIPAL DE NAVEGACIÓN - VIVANTICOS
// ==========================================

import { create } from 'zustand';
import type { AppView, UserRole, Notificacion } from '@/types';
import { useUsuariosStore } from '@/stores/usuarios-store';

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
  unreadCount: () => number;

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
    // Autenticación real: valida contra el store de usuarios
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
      return true;
    }
    return false;
  },
  logout: () => set({
    isLoggedIn: false,
    currentUser: null,
    currentView: 'dashboard',
    previousView: null,
  }),

  // Notificaciones
  notificaciones: [
    {
      id: 'n1',
      tipo: 'entrega_hoy',
      titulo: 'Entrega hoy',
      mensaje: 'Entrega programada para hoy: Cuna Luna para María García',
      leida: false,
      creado_en: new Date().toISOString(),
      relacionado_id: 'e1',
    },
    {
      id: 'n2',
      tipo: 'entrega_manana',
      titulo: 'Entrega mañana',
      mensaje: 'Entrega programada mañana: Cuna Estrella para Juan Pérez',
      leida: false,
      creado_en: new Date().toISOString(),
      relacionado_id: 'e2',
    },
  ],
  addNotificacion: (n) => set((state) => ({
    notificaciones: [{
      ...n,
      id: `n${Date.now()}`,
      creado_en: new Date().toISOString(),
      leida: false,
    }, ...state.notificaciones],
  })),
  markNotificacionLeida: (id) => set((state) => ({
    notificaciones: state.notificaciones.map(n =>
      n.id === id ? { ...n, leida: true } : n
    ),
  })),
  unreadCount: () => get().notificaciones.filter(n => !n.leida).length,

  // Sincronización
  lastSync: null,
  setLastSync: (date) => set({ lastSync: date }),
  isLoading: false,
  setIsLoading: (v) => set({ isLoading: v }),

  // Sidebar
  sidebarOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}));
