// ==========================================
// API ROUTE: COTIZACIONES - CRUD
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// GET /api/cotizaciones
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const vendedor_id = searchParams.get('vendedor_id');

    let query = supabase!
      .from('cotizaciones')
      .select('*, cotizacion_items(*)')
      .order('creado_en', { ascending: false });

    if (estado) query = query.eq('estado', estado);
    if (vendedor_id) query = query.eq('vendedor_id', vendedor_id);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/cotizaciones
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { items, ...cotizacionData } = body;

    const { data: cotizacion, error: cotError } = await supabase!
      .from('cotizaciones')
      .insert(cotizacionData)
      .select()
      .single();

    if (cotError) throw cotError;

    if (items?.length > 0) {
      const { error: itemsError } = await supabase!
        .from('cotizacion_items')
        .insert(items.map((item: any) => ({ ...item, cotizacion_id: cotizacion.id })));

      if (itemsError) throw itemsError;
    }

    return NextResponse.json(cotizacion, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
