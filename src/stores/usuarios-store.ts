// ==========================================
// STORE DE USUARIOS - VIVANTICOS
// Con integración Supabase + datos demo fallback
// ==========================================

import { create } from 'zustand';
import type { Usuario } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// --- Helper: Check if ID is a valid UUID ---
function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// --- Persistencia localStorage ---
const USU_STORAGE_KEY = 'vivanticos-usuarios';

function loadUsuFromStorage(): Usuario[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(USU_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.usuarios || null;
    }
  } catch (e) {
    console.error('Error loading usuarios from localStorage:', e);
  }
  return null;
}

function saveUsuToStorage(usuarios: Usuario[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USU_STORAGE_KEY, JSON.stringify({ usuarios, savedAt: new Date().toISOString() }));
  } catch (e) {
    console.error('Error saving usuarios to localStorage:', e);
  }
}

const DEMO_USUARIOS: Usuario[] = [
  {
    id: 'u1', nombre: 'Administrador', email: 'admin@vivanticos.com',
    password: 'Vivanticos2025', rol: 'admin', activo: true, telefono: '573001112233',
    creado_en: '2025-01-01T00:00:00Z',
  },
  {
    id: 'u2', nombre: 'Alejandro Torres', email: 'jefe@vivanticos.com',
    password: 'Vivanticos2025', rol: 'jefe', activo: true, telefono: '573002223344',
    creado_en: '2025-01-15T00:00:00Z',
  },
  {
    id: 'u3', nombre: 'Carolina Vargas', email: 'vendedor@vivanticos.com',
    password: 'Vivanticos2025', rol: 'vendedor', activo: true, telefono: '573003334455',
    creado_en: '2025-02-01T00:00:00Z',
  },
  {
    id: 'u4', nombre: 'Daniela Morales', email: 'daniela@vivanticos.com',
    password: 'Vivanticos2025', rol: 'vendedor', activo: true, telefono: '573004445566',
    creado_en: '2025-02-15T00:00:00Z',
  },
  {
    id: 'u5', nombre: 'Santiago Ramírez', email: 'santiago@vivanticos.com',
    password: 'Vivanticos2025', rol: 'vendedor', activo: false, telefono: '573005556677',
    creado_en: '2025-03-01T00:00:00Z',
  },
];

interface UsuarioState {
  usuarios: Usuario[];
  isLoaded: boolean;
  isLoading: boolean;
  addUsuario: (u: Usuario) => void;
  updateUsuario: (u: Usuario) => void;
  deleteUsuario: (id: string) => void;
  toggleActivo: (id: string) => void;
  getUsuario: (id: string) => Usuario | undefined;
  getVendedores: () => Usuario[];
  authenticate: (email: string, password: string) => Usuario | null;
  loadFromSupabase: () => Promise<void>;
  saveUsuarioToSupabase: (u: Usuario) => Promise<boolean>;
  deleteUsuarioFromSupabase: (id: string) => Promise<boolean>;
}

export const useUsuariosStore = create<UsuarioState>((set, get) => {
  const storedUsu = typeof window !== 'undefined' ? loadUsuFromStorage() : null;

  return {
  usuarios: storedUsu || DEMO_USUARIOS,
  isLoaded: false,
  isLoading: false,

  addUsuario: (u) => set((s) => {
    const usuarios = [...s.usuarios, u];
    saveUsuToStorage(usuarios);
    return { usuarios };
  }),
  updateUsuario: (u) => set((s) => {
    const usuarios = s.usuarios.map(usr => usr.id === u.id ? u : usr);
    saveUsuToStorage(usuarios);
    return { usuarios };
  }),
  deleteUsuario: (id) => set((s) => {
    const usuarios = s.usuarios.filter(u => u.id !== id);
    saveUsuToStorage(usuarios);
    return { usuarios };
  }),
  toggleActivo: (id) => set((s) => {
    const usuarios = s.usuarios.map(u =>
      u.id === id ? { ...u, activo: !u.activo } : u
    );
    saveUsuToStorage(usuarios);
    return { usuarios };
  }),
  getUsuario: (id) => get().usuarios.find(u => u.id === id),
  getVendedores: () => get().usuarios.filter(u => u.rol === 'vendedor' && u.activo),

  // Autenticación: busca por email y valida contraseña
  authenticate: (email, password) => {
    const user = get().usuarios.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.activo
    );
    if (user && user.password === password) {
      return user;
    }
    return null;
  },

  // --- Cargar datos desde Supabase ---
  loadFromSupabase: async () => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('Supabase no configurado, usando datos locales para usuarios');
      set({ isLoaded: true });
      return;
    }

    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('creado_en', { ascending: true });

      if (error) throw error;

      const usuariosFromSupabase: Usuario[] = (data || []).map((u: any) => ({
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        password: u.password || u.password_hash || '', // password_hash como fallback
        rol: u.rol || 'vendedor',
        activo: u.activo ?? true,
        telefono: u.telefono || undefined,
        avatar_url: u.avatar_url || undefined,
        creado_en: u.creado_en || new Date().toISOString(),
      }));

      // If Supabase has data, use it; otherwise keep local/demo data
      const finalUsuarios = usuariosFromSupabase.length > 0
        ? usuariosFromSupabase
        : get().usuarios;

      set({
        usuarios: finalUsuarios,
        isLoaded: true,
        isLoading: false,
      });

      saveUsuToStorage(finalUsuarios);
      console.log(`Usuarios cargados: ${finalUsuarios.length} (Supabase: ${usuariosFromSupabase.length})`);
    } catch (error) {
      console.error('Error cargando usuarios desde Supabase:', error);
      set({ isLoaded: true, isLoading: false });
    }
  },

  // --- Guardar usuario en Supabase ---
  saveUsuarioToSupabase: async (u: Usuario) => {
    if (!isSupabaseConfigured() || !supabase) {
      const exists = get().usuarios.find(usr => usr.id === u.id);
      if (exists) {
        get().updateUsuario(u);
      } else {
        get().addUsuario(u);
      }
      return true;
    }

    try {
      const usuarioData = {
        nombre: u.nombre,
        email: u.email,
        password: u.password,
        password_hash: u.password, // Supabase requiere password_hash (NOT NULL o nullable)
        rol: u.rol,
        activo: u.activo,
        telefono: u.telefono || null,
        avatar_url: u.avatar_url || null,
      };

      if (isUUID(u.id)) {
        // Check if exists in Supabase
        const { data: checkData } = await supabase
          .from('usuarios')
          .select('id')
          .eq('id', u.id)
          .maybeSingle();

        if (checkData) {
          // UPDATE
          const { error } = await supabase
            .from('usuarios')
            .update(usuarioData)
            .eq('id', u.id);
          if (error) throw error;
          get().updateUsuario(u);
        } else {
          // UUID locally but not in Supabase — insert without ID
          const { data, error } = await supabase
            .from('usuarios')
            .insert(usuarioData)
            .select()
            .single();
          if (error) throw error;
          const oldId = u.id;
          const newId = data.id;
          set((s) => ({
            usuarios: s.usuarios.map(usr => usr.id === oldId ? { ...u, id: newId } : usr),
          }));
          saveUsuToStorage(get().usuarios);
        }
      } else {
        // Non-UUID ID — new user, insert without ID
        const { data, error } = await supabase
          .from('usuarios')
          .insert(usuarioData)
          .select()
          .single();
        if (error) throw error;

        const oldId = u.id;
        const newId = data.id;
        set((s) => {
          const exists = s.usuarios.find(usr => usr.id === oldId);
          if (exists) {
            return { usuarios: s.usuarios.map(usr => usr.id === oldId ? { ...u, id: newId } : usr) };
          } else {
            return { usuarios: [...s.usuarios, { ...u, id: newId }] };
          }
        });
        saveUsuToStorage(get().usuarios);
      }

      return true;
    } catch (error) {
      console.error('Error guardando usuario en Supabase:', error);
      const exists = get().usuarios.find(usr => usr.id === u.id);
      if (!exists) {
        get().addUsuario(u);
      } else {
        get().updateUsuario(u);
      }
      return false;
    }
  },

  // --- Eliminar usuario de Supabase ---
  deleteUsuarioFromSupabase: async (id: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      get().deleteUsuario(id);
      return true;
    }

    try {
      if (isUUID(id)) {
        const { error } = await supabase
          .from('usuarios')
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
      get().deleteUsuario(id);
      return true;
    } catch (error) {
      console.error('Error eliminando usuario de Supabase:', error);
      get().deleteUsuario(id);
      return false;
    }
  },
  };
});
