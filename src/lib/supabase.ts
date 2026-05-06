// ==========================================
// CONFIGURACIÓN SUPABASE - VIVANTICOS
// ==========================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

// Función helper para verificar conexión
export async function testSupabaseConnection(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('categorias').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
