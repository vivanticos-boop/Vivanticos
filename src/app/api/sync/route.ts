// ==========================================
// API ROUTE: SYNC - Sincronización con Supabase
// ==========================================

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// GET /api/sync - Traer todos los datos de Supabase
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  }

  try {
    const [categorias, subcategorias, productos, opciones, opcionValores, usuarios, cotizaciones, entregas] = await Promise.all([
      supabase!.from('categorias').select('*').order('orden'),
      supabase!.from('subcategorias').select('*').order('orden'),
      supabase!.from('productos').select('*').order('nombre'),
      supabase!.from('producto_opciones').select('*').order('orden'),
      supabase!.from('producto_opcion_valores').select('*'),
      supabase!.from('usuarios').select('id, nombre, email, rol, activo, telefono, avatar_url, creado_en').order('nombre'),
      supabase!.from('cotizaciones').select('*, cotizacion_items(*)').order('creado_en', { ascending: false }),
      supabase!.from('entregas').select('*').order('fecha_entrega'),
    ]);

    return NextResponse.json({
      lastSync: new Date().toISOString(),
      data: {
        categorias: categorias.data || [],
        subcategorias: subcategorias.data || [],
        productos: productos.data || [],
        opciones: opciones.data || [],
        opcionValores: opcionValores.data || [],
        usuarios: usuarios.data || [],
        cotizaciones: cotizaciones.data || [],
        entregas: entregas.data || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
