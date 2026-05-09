// ==========================================
// STORE DE CLIENTES - VIVANTICOS
// Con integración Supabase + localStorage fallback
// ==========================================

import { create } from 'zustand';
import type { Cliente } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { generateId } from '@/lib/utils';

// --- Helper: Check if ID is a valid UUID ---
function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// --- Persistencia localStorage ---
const CLI_STORAGE_KEY = 'vivanticos-clientes';

function loadCliFromStorage(): Cliente[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(CLI_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.clientes || null;
    }
  } catch (e) {
    console.error('Error loading clientes from localStorage:', e);
  }
  return null;
}

function saveCliToStorage(clientes: Cliente[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLI_STORAGE_KEY, JSON.stringify({ clientes, savedAt: new Date().toISOString() }));
  } catch (e) {
    console.error('Error saving clientes to localStorage:', e);
  }
}

interface ClienteState {
  clientes: Cliente[];
  isLoaded: boolean;
  isLoading: boolean;
  addCliente: (c: Cliente) => void;
  updateCliente: (c: Cliente) => void;
  deleteCliente: (id: string) => void;
  getCliente: (id: string) => Cliente | undefined;
  searchClientes: (query: string) => Cliente[];
  findOrCreateCliente: (nombre: string, telefono: string, email?: string, direccion?: string, cedula?: string) => Promise<Cliente | null>;
  loadFromSupabase: () => Promise<void>;
  saveClienteToSupabase: (c: Cliente) => Promise<boolean>;
  deleteClienteFromSupabase: (id: string) => Promise<boolean>;
}

export const useClientesStore = create<ClienteState>((set, get) => {
  const storedCli = typeof window !== 'undefined' ? loadCliFromStorage() : null;

  return {
  clientes: storedCli || [],
  isLoaded: false,
  isLoading: false,

  addCliente: (c) => set((s) => {
    const clientes = [...s.clientes, c];
    saveCliToStorage(clientes);
    return { clientes };
  }),
  updateCliente: (c) => set((s) => {
    const clientes = s.clientes.map(cli => cli.id === c.id ? c : cli);
    saveCliToStorage(clientes);
    return { clientes };
  }),
  deleteCliente: (id) => set((s) => {
    const clientes = s.clientes.filter(c => c.id !== id);
    saveCliToStorage(clientes);
    return { clientes };
  }),
  getCliente: (id) => get().clientes.find(c => c.id === id),

  // Search clientes by nombre, telefono, email, cedula
  searchClientes: (query: string) => {
    if (!query.trim()) return get().clientes;
    const term = query.toLowerCase().trim();
    return get().clientes.filter(c =>
      c.nombre.toLowerCase().includes(term) ||
      c.telefono.includes(term) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.cedula && c.cedula.includes(term))
    );
  },

  // Find existing cliente by nombre+telefono or by cedula, or create new
  findOrCreateCliente: async (nombre: string, telefono: string, email?: string, direccion?: string, cedula?: string) => {
    // First try to find by cedula if provided
    let existing: Cliente | undefined;
    if (cedula && cedula.trim()) {
      existing = get().clientes.find(c => c.cedula === cedula.trim());
    }
    // Fallback to nombre+telefono
    if (!existing) {
      existing = get().clientes.find(c =>
        c.nombre.toLowerCase() === nombre.toLowerCase() && c.telefono === telefono
      );
    }

    if (existing) {
      // Update email/direccion/cedula if provided and different
      const updates: Partial<Cliente> = {};
      if (email && !existing.email) updates.email = email;
      if (direccion && !existing.direccion) updates.direccion = direccion;
      if (cedula && cedula.trim() && !existing.cedula) updates.cedula = cedula.trim();
      if (Object.keys(updates).length > 0) {
        const updated = { ...existing, ...updates, actualizado_en: new Date().toISOString() };
        get().updateCliente(updated);
        await get().saveClienteToSupabase(updated);
        return updated;
      }
      return existing;
    }

    // Create new cliente
    const now = new Date().toISOString();
    const newCliente: Cliente = {
      id: generateId(),
      nombre,
      telefono,
      email,
      direccion,
      cedula: cedula?.trim() || undefined,
      creado_en: now,
      actualizado_en: now,
    };

    get().addCliente(newCliente);
    const success = await get().saveClienteToSupabase(newCliente);

    // If Supabase generated a new UUID, get it from the store
    if (success) {
      const saved = get().clientes.find(c =>
        c.nombre === nombre && c.telefono === telefono
      );
      return saved || newCliente;
    }

    return newCliente;
  },

  // --- Cargar datos desde Supabase ---
  loadFromSupabase: async () => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('Supabase no configurado, usando datos locales para clientes');
      set({ isLoaded: true });
      return;
    }

    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('creado_en', { ascending: true });

      if (error) throw error;

      const clientesFromSupabase: Cliente[] = (data || []).map((c: any) => ({
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono || '',
        email: c.email || undefined,
        direccion: c.direccion || undefined,
        cedula: c.cedula || undefined,
        creado_en: c.creado_en || new Date().toISOString(),
        actualizado_en: c.actualizado_en || new Date().toISOString(),
      }));

      // If Supabase has data, use it; otherwise keep local data
      const finalClientes = clientesFromSupabase.length > 0
        ? clientesFromSupabase
        : get().clientes;

      set({
        clientes: finalClientes,
        isLoaded: true,
        isLoading: false,
      });

      saveCliToStorage(finalClientes);
      console.log(`Clientes cargados: ${finalClientes.length} (Supabase: ${clientesFromSupabase.length})`);
    } catch (error) {
      console.error('Error cargando clientes desde Supabase:', error);
      set({ isLoaded: true, isLoading: false });
    }
  },

  // --- Guardar cliente en Supabase ---
  saveClienteToSupabase: async (c: Cliente) => {
    if (!isSupabaseConfigured() || !supabase) {
      const exists = get().clientes.find(cli => cli.id === c.id);
      if (exists) {
        get().updateCliente(c);
      } else {
        get().addCliente(c);
      }
      return true;
    }

    try {
      const clienteData = {
        nombre: c.nombre,
        telefono: c.telefono,
        email: c.email || null,
        direccion: c.direccion || null,
        cedula: c.cedula || null,
      };

      if (isUUID(c.id)) {
        // Check if exists in Supabase
        const { data: checkData } = await supabase
          .from('clientes')
          .select('id')
          .eq('id', c.id)
          .maybeSingle();

        if (checkData) {
          // UPDATE
          const { error } = await supabase
            .from('clientes')
            .update(clienteData)
            .eq('id', c.id);
          if (error) throw error;
          get().updateCliente(c);
        } else {
          // UUID locally but not in Supabase — insert without ID
          const { data, error } = await supabase
            .from('clientes')
            .insert(clienteData)
            .select()
            .single();
          if (error) throw error;
          const oldId = c.id;
          const newId = data.id;
          set((s) => ({
            clientes: s.clientes.map(cli => cli.id === oldId ? { ...c, id: newId } : cli),
          }));
          saveCliToStorage(get().clientes);
        }
      } else {
        // Non-UUID ID — new cliente, insert without ID
        const { data, error } = await supabase
          .from('clientes')
          .insert(clienteData)
          .select()
          .single();
        if (error) throw error;

        const oldId = c.id;
        const newId = data.id;
        set((s) => {
          const exists = s.clientes.find(cli => cli.id === oldId);
          if (exists) {
            return { clientes: s.clientes.map(cli => cli.id === oldId ? { ...c, id: newId } : cli) };
          } else {
            return { clientes: [...s.clientes, { ...c, id: newId }] };
          }
        });
        saveCliToStorage(get().clientes);
      }

      return true;
    } catch (error) {
      console.error('Error guardando cliente en Supabase:', error);
      const exists = get().clientes.find(cli => cli.id === c.id);
      if (!exists) {
        get().addCliente(c);
      } else {
        get().updateCliente(c);
      }
      return false;
    }
  },

  // --- Eliminar cliente de Supabase ---
  deleteClienteFromSupabase: async (id: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      get().deleteCliente(id);
      return true;
    }

    try {
      if (isUUID(id)) {
        const { error } = await supabase
          .from('clientes')
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
      get().deleteCliente(id);
      return true;
    } catch (error) {
      console.error('Error eliminando cliente de Supabase:', error);
      get().deleteCliente(id);
      return false;
    }
  },
  };
});
