// ==========================================
// API ROUTE: PRODUCTOS - CRUD
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// GET /api/productos
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const categoria_id = searchParams.get('categoria_id');
    const search = searchParams.get('search');

    let query = supabase!
      .from('productos')
      .select('*, categorias(id, nombre, icono), subcategorias(id, nombre), producto_opciones(*, producto_opcion_valores(*))')
      .eq('activo', true)
      .order('nombre');

    if (categoria_id) query = query.eq('categoria_id', categoria_id);
    if (search) query = query.ilike('nombre', `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/productos
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { opciones, ...productoData } = body;

    const { data: producto, error: prodError } = await supabase!
      .from('productos')
      .insert(productoData)
      .select()
      .single();

    if (prodError) throw prodError;

    if (opciones?.length > 0) {
      for (const opcion of opciones) {
        const { valores, ...opcionData } = opcion;
        const { data: opcionCreated, error: opError } = await supabase!
          .from('producto_opciones')
          .insert({ ...opcionData, producto_id: producto.id })
          .select()
          .single();

        if (opError) throw opError;

        if (valores?.length > 0) {
          const { error: valError } = await supabase!
            .from('producto_opcion_valores')
            .insert(valores.map((v: any) => ({ ...v, opcion_id: opcionCreated.id })));
          if (valError) throw valError;
        }
      }
    }

    return NextResponse.json(producto, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
