// ==========================================
// STORE DE USUARIOS - VIVANTICOS
// ==========================================

import { create } from 'zustand';
import type { Usuario } from '@/types';

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
  addUsuario: (u: Usuario) => void;
  updateUsuario: (u: Usuario) => void;
  deleteUsuario: (id: string) => void;
  toggleActivo: (id: string) => void;
  getUsuario: (id: string) => Usuario | undefined;
  getVendedores: () => Usuario[];
  authenticate: (email: string, password: string) => Usuario | null;
}

export const useUsuariosStore = create<UsuarioState>((set, get) => ({
  usuarios: DEMO_USUARIOS,

  addUsuario: (u) => set((s) => ({ usuarios: [...s.usuarios, u] })),
  updateUsuario: (u) => set((s) => ({
    usuarios: s.usuarios.map(usr => usr.id === u.id ? u : usr),
  })),
  deleteUsuario: (id) => set((s) => ({
    usuarios: s.usuarios.filter(u => u.id !== id),
  })),
  toggleActivo: (id) => set((s) => ({
    usuarios: s.usuarios.map(u =>
      u.id === id ? { ...u, activo: !u.activo } : u
    ),
  })),
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
}));
