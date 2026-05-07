// ==========================================
// API ROUTE: USUARIOS - CRUD
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// GET /api/usuarios
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  }

  try {
    const { data, error } = await supabase!
      .from('usuarios')
      .select('id, nombre, email, rol, activo, telefono, avatar_url, creado_en')
      .order('nombre');

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/usuarios
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  }

  try {
    const body = await request.json();

    const { data, error } = await supabase!
      .from('usuarios')
      .insert(body)
      .select('id, nombre, email, rol, activo, telefono, avatar_url, creado_en')
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
