// ==========================================
// API ROUTE: ENTREGAS - CRUD
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// GET /api/entregas
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const fecha = searchParams.get('fecha');
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');

    let query = supabase!
      .from('entregas')
      .select('*')
      .order('fecha_entrega', { ascending: true });

    if (estado) query = query.eq('estado', estado);
    if (fecha) query = query.eq('fecha_entrega', fecha);
    if (desde) query = query.gte('fecha_entrega', desde);
    if (hasta) query = query.lte('fecha_entrega', hasta);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/entregas
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  }

  try {
    const body = await request.json();

    const { data, error } = await supabase!
      .from('entregas')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    // Crear notificaciones de recordatorio
    const fechaEntrega = new Date(body.fecha_entrega);

    // 1 día antes a las 12pm
    const fechaManana = new Date(fechaEntrega);
    fechaManana.setDate(fechaManana.getDate() - 1);
    fechaManana.setHours(12, 0, 0);

    await supabase!.from('notificaciones').insert([
      {
        usuario_id: body.vendedor_id,
        tipo: 'entrega_manana',
        titulo: 'Entrega mañana',
        mensaje: `Entrega programada mañana: ${body.cliente_nombre}`,
        relacionado_id: data.id,
      },
      {
        usuario_id: body.vendedor_id,
        tipo: 'entrega_hoy',
        titulo: 'Entrega hoy',
        mensaje: `Entrega programada para hoy: ${body.cliente_nombre}`,
        relacionado_id: data.id,
      },
    ]);

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
