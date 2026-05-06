// ==========================================
// CONFIGURACIÓN SUPABASE - VIVANTICOS
// ==========================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vtwaekybydhkjiureafm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0d2Fla3lieWRoa2ppdXJlYWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMDM2MTMsImV4cCI6MjA5MzU3OTYxM30.sqY-eG7VfJmuT_Z6vrGKkQlQlzRWwljF_E0BI9m-ruY';

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
