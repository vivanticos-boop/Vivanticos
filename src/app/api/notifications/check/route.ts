// ==========================================
// API: CHECK & SEND AUTOMATIC NOTIFICATIONS - VIVANTICOS
// Verifica entregas/cotizaciones y envía notificaciones push
// Llamado por Vercel Cron cada 5 minutos
// ==========================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:soporte@vivanticos.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

interface PushSub {
  endpoint: string;
  p256dh: string;
  auth_key: string;
  usuario_id: string;
}

async function sendPush(
  subscription: PushSub,
  payload: { title: string; body: string; icon?: string; tag?: string; data?: Record<string, any> }
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth_key },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (error: any) {
    if (error?.statusCode === 410 || error?.statusCode === 404) {
      const supabase = getSupabaseAdmin();
      await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
    }
    return false;
  }
}

// Verificar si ya existe una notificación similar no leída (evitar spam)
async function notificacionYaExiste(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  tipo: string,
  relacionadoId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('notificaciones')
    .select('id')
    .eq('tipo', tipo)
    .eq('relacionado_id', relacionadoId)
    .eq('leida', false)
    .maybeSingle();
  return !!data;
}

// GET /api/notifications/check — Verificar y enviar notificaciones automáticas
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const hoy = new Date().toISOString().split('T')[0];
    const manana = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // 1. Obtener todos los usuarios activos
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id')
      .eq('activo', true);

    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay usuarios activos' });
    }

    const usuarioIds = usuarios.map(u => u.id);

    // 2. Obtener todas las suscripciones push
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key, usuario_id')
      .in('usuario_id', usuarioIds);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay suscripciones push' });
    }

    let notificationsSent = 0;

    // 3. Entregas para HOY (pendientes)
    const { data: entregasHoy } = await supabase
      .from('entregas')
      .select('id, cliente_nombre, hora_entrega')
      .eq('fecha_entrega', hoy)
      .eq('estado', 'pendiente');

    if (entregasHoy && entregasHoy.length > 0) {
      for (const e of entregasHoy) {
        const existe = await notificacionYaExiste(supabase, 'entrega_hoy', e.id);
        if (existe) continue;

        const payload = {
          title: '🚚 Entrega hoy',
          body: `${e.cliente_nombre}${e.hora_entrega ? ` a las ${e.hora_entrega}` : ''}`,
          icon: '/icons/icon-192x192.png',
          tag: `entrega-hoy-${e.id}`,
          data: { tipo: 'entrega_hoy', relacionado_id: e.id, relacionado_tipo: 'entrega' },
        };

        // Insertar en la tabla notificaciones para cada usuario
        await supabase.from('notificaciones').insert(
          usuarioIds.map(uid => ({
            usuario_id: uid,
            tipo: 'entrega_hoy',
            titulo: 'Entrega hoy',
            mensaje: payload.body,
            leida: false,
            relacionado_id: e.id,
          }))
        );

        // Enviar push
        const results = await Promise.allSettled(
          subscriptions.map(sub => sendPush(sub, payload))
        );
        notificationsSent += results.filter(r => r.status === 'fulfilled' && r.value).length;
      }
    }

    // 4. Entregas para MAÑANA (pendientes)
    const { data: entregasManana } = await supabase
      .from('entregas')
      .select('id, cliente_nombre, hora_entrega')
      .eq('fecha_entrega', manana)
      .eq('estado', 'pendiente');

    if (entregasManana && entregasManana.length > 0) {
      for (const e of entregasManana) {
        const existe = await notificacionYaExiste(supabase, 'entrega_manana', e.id);
        if (existe) continue;

        const payload = {
          title: '📅 Entrega mañana',
          body: `${e.cliente_nombre}${e.hora_entrega ? ` a las ${e.hora_entrega}` : ''}`,
          icon: '/icons/icon-192x192.png',
          tag: `entrega-manana-${e.id}`,
          data: { tipo: 'entrega_manana', relacionado_id: e.id, relacionado_tipo: 'entrega' },
        };

        await supabase.from('notificaciones').insert(
          usuarioIds.map(uid => ({
            usuario_id: uid,
            tipo: 'entrega_manana',
            titulo: 'Entrega mañana',
            mensaje: payload.body,
            leida: false,
            relacionado_id: e.id,
          }))
        );

        const results = await Promise.allSettled(
          subscriptions.map(sub => sendPush(sub, payload))
        );
        notificationsSent += results.filter(r => r.status === 'fulfilled' && r.value).length;
      }
    }

    // 5. Entregas VENCIDAS (solo las de los últimos 7 días, para no spam)
    const hace7Dias = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const { data: entregasVencidas } = await supabase
      .from('entregas')
      .select('id, cliente_nombre, fecha_entrega')
      .lt('fecha_entrega', hoy)
      .gte('fecha_entrega', hace7Dias)
      .eq('estado', 'pendiente')
      .limit(5);

    if (entregasVencidas && entregasVencidas.length > 0) {
      for (const e of entregasVencidas) {
        const existe = await notificacionYaExiste(supabase, 'entrega_vencida', e.id);
        if (existe) continue;

        const payload = {
          title: '⚠️ Entrega vencida',
          body: `${e.cliente_nombre} — Programada para ${e.fecha_entrega}`,
          icon: '/icons/icon-192x192.png',
          tag: `entrega-vencida-${e.id}`,
          requireInteraction: true,
          data: { tipo: 'entrega_vencida', relacionado_id: e.id, relacionado_tipo: 'entrega' },
        };

        await supabase.from('notificaciones').insert(
          usuarioIds.map(uid => ({
            usuario_id: uid,
            tipo: 'entrega_vencida',
            titulo: 'Entrega vencida',
            mensaje: payload.body,
            leida: false,
            relacionado_id: e.id,
          }))
        );

        const results = await Promise.allSettled(
          subscriptions.map(sub => sendPush(sub, payload))
        );
        notificationsSent += results.filter(r => r.status === 'fulfilled' && r.value).length;
      }
    }

    // 6. Limpiar notificaciones leídas mayores a 7 días
    const hace7DiasISO = new Date(Date.now() - 7 * 86400000).toISOString();
    await supabase
      .from('notificaciones')
      .delete()
      .eq('leida', true)
      .lt('creado_en', hace7DiasISO);

    return NextResponse.json({
      success: true,
      notificationsSent,
      checked: {
        entregasHoy: entregasHoy?.length || 0,
        entregasManana: entregasManana?.length || 0,
        entregasVencidas: entregasVencidas?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('Error in check notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
